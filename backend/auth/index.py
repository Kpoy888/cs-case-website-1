import hashlib
import hmac
import json
import os
import re
import secrets
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras

SCHEMA = 't_p89018960_cs_case_website_1'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
}

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$')
NICK_RE = re.compile(r'^[A-Za-z0-9_\-\.]{3,24}$')

PBKDF_ITERATIONS = 240000
SESSION_DAYS = 30
MAX_FAILED = 5
LOCK_MINUTES = 15
IP_ATTEMPTS_LIMIT = 20
IP_WINDOW_MINUTES = 10


def _db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _resp(status: int, body: dict) -> dict:
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body), 'isBase64Encoded': False}


def _hash_password(password: str, salt: bytes = None) -> str:
    salt = salt or secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, PBKDF_ITERATIONS)
    return f'pbkdf2_sha256${PBKDF_ITERATIONS}${salt.hex()}${dk.hex()}'


def _verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, hash_hex = stored.split('$')
        if algo != 'pbkdf2_sha256':
            return False
        dk = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt_hex), int(iters))
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _client_ip(event: dict) -> str:
    ctx = event.get('requestContext') or {}
    ip = ((ctx.get('identity') or {}).get('sourceIp')) or ''
    return str(ip)[:64]


def _password_problem(password: str) -> str:
    if len(password) < 8:
        return 'Пароль должен быть не короче 8 символов'
    if len(password) > 128:
        return 'Пароль слишком длинный'
    if not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password):
        return 'Пароль должен содержать буквы и цифры'
    return ''


def _log(cur, email: str, ip: str, action: str, success: bool) -> None:
    cur.execute(
        f"INSERT INTO {SCHEMA}.auth_log (email, ip, action, success) VALUES (%s, %s, %s, %s)",
        (email[:255] if email else None, ip, action, success),
    )


def _ip_throttled(cur, ip: str) -> bool:
    if not ip:
        return False
    since = datetime.utcnow() - timedelta(minutes=IP_WINDOW_MINUTES)
    cur.execute(
        f"SELECT COUNT(*) AS c FROM {SCHEMA}.auth_log WHERE ip = %s AND success = FALSE AND created_at > %s",
        (ip, since),
    )
    return int(cur.fetchone()['c']) >= IP_ATTEMPTS_LIMIT


def _public_user(row: dict) -> dict:
    return {
        'id': row['id'],
        'email': row['email'],
        'nickname': row['nickname'],
        'balance': row['balance'],
    }


def _create_session(cur, user_id: int, ip: str, ua: str) -> str:
    token = secrets.token_urlsafe(48)
    cur.execute(
        f"INSERT INTO {SCHEMA}.sessions (user_id, token_hash, ip, user_agent, expires_at) "
        f"VALUES (%s, %s, %s, %s, %s)",
        (user_id, _token_hash(token), ip, (ua or '')[:400], datetime.utcnow() + timedelta(days=SESSION_DAYS)),
    )
    return token


def _session_user(cur, token: str):
    if not token:
        return None
    cur.execute(
        f"SELECT u.* FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token_hash = %s AND s.revoked = FALSE AND s.expires_at > %s",
        (_token_hash(token), datetime.utcnow()),
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """Регистрация, вход, выход и проверка сессии пользователя Nicedrop с защитой от подбора паролей."""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-auth-token') or ''
    ip = _client_ip(event)
    ua = headers.get('user-agent', '')

    params = event.get('queryStringParameters') or {}
    action = (params.get('action') or '').strip()

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            return _resp(400, {'error': 'Некорректный запрос'})
    if not action:
        action = str(body.get('action') or '').strip()

    conn = _db()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        if method == 'GET' or action == 'me':
            user = _session_user(cur, token)
            if not user:
                return _resp(401, {'error': 'Сессия не найдена'})
            return _resp(200, {'user': _public_user(user)})

        if method != 'POST':
            return _resp(405, {'error': 'Метод не поддерживается'})

        if action == 'logout':
            if token:
                cur.execute(
                    f"UPDATE {SCHEMA}.sessions SET revoked = TRUE WHERE token_hash = %s",
                    (_token_hash(token),),
                )
            return _resp(200, {'ok': True})

        if _ip_throttled(cur, ip):
            return _resp(429, {'error': 'Слишком много попыток. Повторите через несколько минут'})

        email = str(body.get('email') or '').strip().lower()[:255]
        password = str(body.get('password') or '')

        if action == 'register':
            nickname = str(body.get('nickname') or '').strip()[:64]
            if not EMAIL_RE.match(email):
                return _resp(400, {'error': 'Введите корректный e-mail'})
            if not NICK_RE.match(nickname):
                return _resp(400, {'error': 'Ник: 3-24 символа, латиница, цифры, _ - .'})
            problem = _password_problem(password)
            if problem:
                return _resp(400, {'error': problem})

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE LOWER(email) = %s", (email,))
            if cur.fetchone():
                _log(cur, email, ip, 'register', False)
                return _resp(409, {'error': 'Пользователь с таким e-mail уже зарегистрирован'})

            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email, nickname, password_hash, balance) "
                f"VALUES (%s, %s, %s, %s) RETURNING *",
                (email, nickname, _hash_password(password), 0),
            )
            user = cur.fetchone()
            new_token = _create_session(cur, user['id'], ip, ua)
            _log(cur, email, ip, 'register', True)
            return _resp(200, {'user': _public_user(user), 'token': new_token})

        if action == 'login':
            if not EMAIL_RE.match(email) or not password:
                return _resp(400, {'error': 'Введите e-mail и пароль'})

            cur.execute(f"SELECT * FROM {SCHEMA}.users WHERE LOWER(email) = %s", (email,))
            user = cur.fetchone()

            if not user:
                _log(cur, email, ip, 'login', False)
                return _resp(401, {'error': 'Неверный e-mail или пароль'})

            if user['is_blocked']:
                _log(cur, email, ip, 'login', False)
                return _resp(403, {'error': 'Аккаунт заблокирован. Напишите в поддержку'})

            if user['locked_until'] and user['locked_until'] > datetime.utcnow():
                _log(cur, email, ip, 'login', False)
                return _resp(429, {'error': f'Вход временно заблокирован на {LOCK_MINUTES} минут'})

            if not _verify_password(password, user['password_hash']):
                failed = int(user['failed_attempts']) + 1
                if failed >= MAX_FAILED:
                    cur.execute(
                        f"UPDATE {SCHEMA}.users SET failed_attempts = 0, locked_until = %s WHERE id = %s",
                        (datetime.utcnow() + timedelta(minutes=LOCK_MINUTES), user['id']),
                    )
                else:
                    cur.execute(
                        f"UPDATE {SCHEMA}.users SET failed_attempts = %s WHERE id = %s",
                        (failed, user['id']),
                    )
                _log(cur, email, ip, 'login', False)
                return _resp(401, {'error': 'Неверный e-mail или пароль'})

            cur.execute(
                f"UPDATE {SCHEMA}.users SET failed_attempts = 0, locked_until = NULL, last_login_at = %s "
                f"WHERE id = %s RETURNING *",
                (datetime.utcnow(), user['id']),
            )
            user = cur.fetchone()
            new_token = _create_session(cur, user['id'], ip, ua)
            _log(cur, email, ip, 'login', True)
            return _resp(200, {'user': _public_user(user), 'token': new_token})

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()
