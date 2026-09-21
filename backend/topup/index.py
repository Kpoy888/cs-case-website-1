import base64
import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta

import boto3
import psycopg2
import psycopg2.extras

SCHEMA = 't_p89018960_cs_case_website_1'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
}

MIN_AMOUNT = 100
MAX_AMOUNT = 100000
MAX_FILE_BYTES = 6 * 1024 * 1024
ALLOWED_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
}
PENDING_LIMIT = 3
AUTO_CREDIT_MINUTES = 3


def _db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _resp(status: int, body: dict) -> dict:
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, default=str), 'isBase64Encoded': False}


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _session_user(cur, token: str):
    if not token:
        return None
    cur.execute(
        f"SELECT u.* FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token_hash = %s AND s.revoked = FALSE AND s.expires_at > %s",
        (_token_hash(token), datetime.utcnow()),
    )
    return cur.fetchone()


def _autocredit(cur, user_id: int) -> None:
    """Зачисляет заявки, которые отвисели проверку дольше AUTO_CREDIT_MINUTES."""
    ready = datetime.utcnow() - timedelta(minutes=AUTO_CREDIT_MINUTES)
    cur.execute(
        f"SELECT id, total FROM {SCHEMA}.topup_requests "
        f"WHERE user_id = %s AND status = 'pending' AND created_at <= %s",
        (user_id, ready),
    )
    rows = cur.fetchall()
    for row in rows:
        cur.execute(
            f"UPDATE {SCHEMA}.topup_requests SET status = 'approved', comment = %s, reviewed_at = %s "
            f"WHERE id = %s AND status = 'pending'",
            ('Перевод подтверждён', datetime.utcnow(), row['id']),
        )
        if cur.rowcount:
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s",
                (row['total'], user_id),
            )


def _upload_receipt(data_url: str, order_code: str) -> str:
    if ';base64,' not in data_url:
        raise ValueError('Файл повреждён, приложите фото ещё раз')

    head, payload = data_url.split(';base64,', 1)
    mime = head.replace('data:', '').strip().lower()
    if mime not in ALLOWED_TYPES:
        raise ValueError('Подойдёт фото JPG, PNG, WEBP или PDF-выписка')

    raw = base64.b64decode(payload, validate=False)
    if len(raw) < 2048:
        raise ValueError('Файл слишком маленький — приложите читаемую выписку')
    if len(raw) > MAX_FILE_BYTES:
        raise ValueError('Файл больше 6 МБ, сожмите фото')

    key = f"receipts/{order_code}-{secrets.token_hex(6)}.{ALLOWED_TYPES[mime]}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=mime)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """Заявки на пополнение баланса: создание с выпиской из банка, список заявок и решение администратора."""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-auth-token') or ''

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
        user = _session_user(cur, token)
        if not user:
            return _resp(401, {'error': 'Войдите в аккаунт'})

        if action == 'list' or method == 'GET':
            _autocredit(cur, user['id'])
            cur.execute(
                f"SELECT balance FROM {SCHEMA}.users WHERE id = %s",
                (user['id'],),
            )
            user['balance'] = cur.fetchone()['balance']
            cur.execute(
                f"SELECT id, order_code, amount, total, status, comment, receipt_url, created_at, reviewed_at "
                f"FROM {SCHEMA}.topup_requests WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
                (user['id'],),
            )
            return _resp(200, {'requests': cur.fetchall(), 'balance': user['balance']})

        if method != 'POST':
            return _resp(405, {'error': 'Метод не поддерживается'})

        if action == 'create':
            try:
                amount = int(body.get('amount') or 0)
            except Exception:
                return _resp(400, {'error': 'Некорректная сумма'})

            if amount < MIN_AMOUNT:
                return _resp(400, {'error': f'Минимальная сумма пополнения — {MIN_AMOUNT} ₽'})
            if amount > MAX_AMOUNT:
                return _resp(400, {'error': f'Максимум за одну заявку — {MAX_AMOUNT} ₽'})

            bonus = 0.25 if amount >= 2000 else (0.15 if amount >= 300 else 0)
            total = round(amount * (1 + bonus))

            cur.execute(
                f"SELECT COUNT(*) AS c FROM {SCHEMA}.topup_requests WHERE user_id = %s AND status = 'pending'",
                (user['id'],),
            )
            if int(cur.fetchone()['c']) >= PENDING_LIMIT:
                return _resp(429, {'error': 'У вас уже есть заявки на проверке. Дождитесь решения'})

            cur.execute(
                f"SELECT COUNT(*) AS c FROM {SCHEMA}.topup_requests WHERE user_id = %s AND created_at > %s",
                (user['id'], datetime.utcnow() - timedelta(hours=1)),
            )
            if int(cur.fetchone()['c']) >= 10:
                return _resp(429, {'error': 'Слишком много заявок за час, попробуйте позже'})

            order_code = str(secrets.randbelow(900000) + 100000)
            receipt = str(body.get('receipt') or '')
            if not receipt:
                return _resp(400, {'error': 'Приложите фото выписки из банка'})

            try:
                receipt_url = _upload_receipt(receipt, order_code)
            except ValueError as e:
                return _resp(400, {'error': str(e)})

            cur.execute(
                f"INSERT INTO {SCHEMA}.topup_requests (user_id, order_code, amount, total, method, receipt_url) "
                f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, order_code, amount, total, status, created_at",
                (user['id'], order_code, amount, total, str(body.get('method') or 'card')[:16], receipt_url),
            )
            return _resp(200, {'request': cur.fetchone()})

        if action == 'review':
            if not user.get('is_admin'):
                return _resp(403, {'error': 'Недостаточно прав'})

            req_id = int(body.get('id') or 0)
            decision = str(body.get('decision') or '').strip()
            if decision not in ('approved', 'rejected'):
                return _resp(400, {'error': 'Некорректное решение'})

            cur.execute(
                f"SELECT * FROM {SCHEMA}.topup_requests WHERE id = %s AND status = 'pending'",
                (req_id,),
            )
            req = cur.fetchone()
            if not req:
                return _resp(404, {'error': 'Заявка не найдена или уже обработана'})

            cur.execute(
                f"UPDATE {SCHEMA}.topup_requests SET status = %s, comment = %s, reviewed_at = %s, reviewed_by = %s "
                f"WHERE id = %s",
                (decision, str(body.get('comment') or '')[:500], datetime.utcnow(), user['id'], req_id),
            )

            if decision == 'approved':
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s",
                    (req['total'], req['user_id']),
                )

            return _resp(200, {'ok': True})

        if action == 'pending':
            if not user.get('is_admin'):
                return _resp(403, {'error': 'Недостаточно прав'})
            cur.execute(
                f"SELECT r.*, u.email, u.nickname FROM {SCHEMA}.topup_requests r "
                f"JOIN {SCHEMA}.users u ON u.id = r.user_id "
                f"WHERE r.status = 'pending' ORDER BY r.created_at LIMIT 100"
            )
            return _resp(200, {'requests': cur.fetchall()})

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()