import hashlib
import json
import os
import re
import secrets
from datetime import datetime

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

TRADE_URL_RE = re.compile(
    r'^https://steamcommunity\.com/tradeoffer/new/\?partner=\d+&token=[A-Za-z0-9_-]{6,}$'
)
MAX_ITEMS_PER_TRADE = 20


def _db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _resp(status: int, body: dict) -> dict:
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, default=str), 'isBase64Encoded': False}


def _session_user(cur, token: str):
    if not token:
        return None
    cur.execute(
        f"SELECT u.* FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token_hash = %s AND s.revoked = FALSE AND s.expires_at > %s",
        (hashlib.sha256(token.encode()).hexdigest(), datetime.utcnow()),
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """Инвентарь игрока: добавление выпавших скинов, продажа за баллы и вывод предметов в Steam."""
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
            cur.execute(
                f"SELECT id, skin_name, price, image_url, rarity, case_name, status, created_at "
                f"FROM {SCHEMA}.inventory WHERE user_id = %s AND status <> 'sold' "
                f"ORDER BY created_at DESC LIMIT 200",
                (user['id'],),
            )
            items = cur.fetchall()
            owned = [i for i in items if i['status'] == 'owned']
            return _resp(200, {
                'items': items,
                'balance': user['balance'],
                'total_value': sum(int(i['price']) for i in owned),
            })

        if method != 'POST':
            return _resp(405, {'error': 'Метод не поддерживается'})

        if action == 'add':
            skin = str(body.get('skin_name') or '').strip()[:128]
            if not skin:
                return _resp(400, {'error': 'Не указан предмет'})
            try:
                price = max(0, int(body.get('price') or 0))
            except Exception:
                price = 0

            case_price = 0
            try:
                case_price = max(0, int(body.get('case_price') or 0))
            except Exception:
                case_price = 0

            if case_price:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance - %s "
                    f"WHERE id = %s AND balance >= %s RETURNING balance",
                    (case_price, user['id'], case_price),
                )
                if cur.fetchone() is None:
                    return _resp(400, {'error': 'На балансе недостаточно средств'})

            cur.execute(
                f"INSERT INTO {SCHEMA}.inventory (user_id, skin_name, price, image_url, rarity, case_name) "
                f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, skin_name, price, image_url, rarity, case_name, status, created_at",
                (
                    user['id'],
                    skin,
                    price,
                    str(body.get('image_url') or '')[:600] or None,
                    str(body.get('rarity') or '')[:48] or None,
                    str(body.get('case_name') or '')[:64] or None,
                ),
            )
            item = cur.fetchone()
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (user['id'],))
            return _resp(200, {'item': item, 'balance': cur.fetchone()['balance']})

        if action == 'sell':
            ids = body.get('ids') or []
            if not isinstance(ids, list) or not ids:
                return _resp(400, {'error': 'Выберите предметы для продажи'})
            safe_ids = [int(i) for i in ids][:100]
            id_list = ','.join(str(i) for i in safe_ids)

            cur.execute(
                f"SELECT id, price FROM {SCHEMA}.inventory "
                f"WHERE user_id = %s AND status = 'owned' AND id IN ({id_list})",
                (user['id'],),
            )
            rows = cur.fetchall()
            if not rows:
                return _resp(400, {'error': 'Предметы не найдены'})

            total = sum(int(r['price']) for r in rows)
            ok_list = ','.join(str(r['id']) for r in rows)
            cur.execute(
                f"UPDATE {SCHEMA}.inventory SET status = 'sold', updated_at = %s "
                f"WHERE user_id = %s AND status = 'owned' AND id IN ({ok_list})",
                (datetime.utcnow(), user['id']),
            )
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s RETURNING balance",
                (total, user['id']),
            )
            return _resp(200, {'sold': len(rows), 'earned': total, 'balance': cur.fetchone()['balance']})

        if action == 'withdraw':
            ids = body.get('ids') or []
            trade_url = str(body.get('trade_url') or '').strip()[:400]
            if not TRADE_URL_RE.match(trade_url):
                return _resp(400, {'error': 'Вставьте корректную трейд-ссылку Steam'})
            if not isinstance(ids, list) or not ids:
                return _resp(400, {'error': 'Выберите предметы для вывода'})

            safe_ids = [int(i) for i in ids][:MAX_ITEMS_PER_TRADE]
            id_list = ','.join(str(i) for i in safe_ids)

            cur.execute(
                f"SELECT COUNT(*) AS c FROM {SCHEMA}.withdrawals WHERE user_id = %s AND status = 'pending'",
                (user['id'],),
            )
            if int(cur.fetchone()['c']) >= 3:
                return _resp(429, {'error': 'У вас уже есть заявки на вывод. Дождитесь решения'})

            cur.execute(
                f"SELECT id, skin_name, price FROM {SCHEMA}.inventory "
                f"WHERE user_id = %s AND status = 'owned' AND id IN ({id_list})",
                (user['id'],),
            )
            rows = cur.fetchall()
            if not rows:
                return _resp(400, {'error': 'Предметы не найдены или уже выводятся'})

            total = sum(int(r['price']) for r in rows)
            first = rows[0]['skin_name']
            item_name = first if len(rows) == 1 else f'{first} и ещё {len(rows) - 1}'
            order_code = str(secrets.randbelow(900000) + 100000)

            cur.execute(
                f"INSERT INTO {SCHEMA}.withdrawals (user_id, order_code, amount, item_name, trade_url, items_count) "
                f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, order_code, amount, item_name, status, created_at",
                (user['id'], order_code, total, item_name[:128], trade_url, len(rows)),
            )
            req = cur.fetchone()

            ok_list = ','.join(str(r['id']) for r in rows)
            cur.execute(
                f"UPDATE {SCHEMA}.inventory SET status = 'withdrawing', withdrawal_id = %s, updated_at = %s "
                f"WHERE user_id = %s AND status = 'owned' AND id IN ({ok_list})",
                (req['id'], datetime.utcnow(), user['id']),
            )
            cur.execute(
                f"UPDATE {SCHEMA}.users SET trade_url = %s WHERE id = %s",
                (trade_url, user['id']),
            )

            return _resp(200, {'request': req})

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()