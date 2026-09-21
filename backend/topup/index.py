import base64
import hashlib
import json
import os
import re
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
MIN_WITHDRAW = 500
TRADE_URL_RE = re.compile(
    r'^https://steamcommunity\.com/tradeoffer/new/\?partner=\d+&token=[A-Za-z0-9_-]{6,}$'
)


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
            topups = cur.fetchall()
            cur.execute(
                f"SELECT id, order_code, amount, item_name, trade_url, status, comment, created_at, reviewed_at "
                f"FROM {SCHEMA}.withdrawals WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
                (user['id'],),
            )
            return _resp(200, {
                'requests': topups,
                'withdrawals': cur.fetchall(),
                'balance': user['balance'],
                'trade_url': user.get('trade_url') or '',
            })

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

        if action == 'withdraw':
            try:
                amount = int(body.get('amount') or 0)
            except Exception:
                return _resp(400, {'error': 'Некорректная сумма'})

            trade_url = str(body.get('trade_url') or '').strip()[:400]
            if not TRADE_URL_RE.match(trade_url):
                return _resp(400, {'error': 'Вставьте корректную трейд-ссылку Steam'})

            if amount < MIN_WITHDRAW:
                return _resp(400, {'error': f'Минимальная сумма вывода — {MIN_WITHDRAW} ₽'})

            _autocredit(cur, user['id'])
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (user['id'],))
            balance = int(cur.fetchone()['balance'])
            if amount > balance:
                return _resp(400, {'error': 'На балансе недостаточно средств'})

            cur.execute(
                f"SELECT COUNT(*) AS c FROM {SCHEMA}.withdrawals WHERE user_id = %s AND status = 'pending'",
                (user['id'],),
            )
            if int(cur.fetchone()['c']) >= PENDING_LIMIT:
                return _resp(429, {'error': 'У вас уже есть заявки на вывод. Дождитесь решения'})

            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance - %s, trade_url = %s WHERE id = %s AND balance >= %s",
                (amount, trade_url, user['id'], amount),
            )
            if not cur.rowcount:
                return _resp(400, {'error': 'На балансе недостаточно средств'})

            order_code = str(secrets.randbelow(900000) + 100000)
            cur.execute(
                f"INSERT INTO {SCHEMA}.withdrawals (user_id, order_code, amount, item_name, trade_url) "
                f"VALUES (%s, %s, %s, %s, %s) RETURNING id, order_code, amount, item_name, status, created_at",
                (user['id'], order_code, amount, str(body.get('item_name') or '')[:128] or None, trade_url),
            )
            return _resp(200, {'request': cur.fetchone()})

        if action == 'review_withdraw':
            if not user.get('is_admin'):
                return _resp(403, {'error': 'Недостаточно прав'})

            req_id = int(body.get('id') or 0)
            decision = str(body.get('decision') or '').strip()
            if decision not in ('approved', 'rejected'):
                return _resp(400, {'error': 'Некорректное решение'})

            cur.execute(
                f"SELECT * FROM {SCHEMA}.withdrawals WHERE id = %s AND status = 'pending'",
                (req_id,),
            )
            req = cur.fetchone()
            if not req:
                return _resp(404, {'error': 'Заявка не найдена или уже обработана'})

            cur.execute(
                f"UPDATE {SCHEMA}.withdrawals SET status = %s, comment = %s, reviewed_at = %s, reviewed_by = %s "
                f"WHERE id = %s",
                (decision, str(body.get('comment') or '')[:500], datetime.utcnow(), user['id'], req_id),
            )

            cur.execute(
                f"SELECT COUNT(*) AS c FROM {SCHEMA}.inventory WHERE withdrawal_id = %s",
                (req_id,),
            )
            has_items = int(cur.fetchone()['c']) > 0

            if decision == 'rejected':
                if has_items:
                    cur.execute(
                        f"UPDATE {SCHEMA}.inventory SET status = 'owned', withdrawal_id = NULL, updated_at = %s "
                        f"WHERE withdrawal_id = %s",
                        (datetime.utcnow(), req_id),
                    )
                else:
                    cur.execute(
                        f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s",
                        (req['amount'], req['user_id']),
                    )
            elif has_items:
                cur.execute(
                    f"UPDATE {SCHEMA}.inventory SET status = 'withdrawn', updated_at = %s "
                    f"WHERE withdrawal_id = %s",
                    (datetime.utcnow(), req_id),
                )

            return _resp(200, {'ok': True})

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
            topups = cur.fetchall()
            cur.execute(
                f"SELECT w.*, u.email, u.nickname FROM {SCHEMA}.withdrawals w "
                f"JOIN {SCHEMA}.users u ON u.id = w.user_id "
                f"WHERE w.status = 'pending' ORDER BY w.created_at LIMIT 100"
            )
            return _resp(200, {'requests': topups, 'withdrawals': cur.fetchall()})

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()