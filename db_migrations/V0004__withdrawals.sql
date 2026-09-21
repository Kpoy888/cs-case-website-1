CREATE TABLE IF NOT EXISTS t_p89018960_cs_case_website_1.withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p89018960_cs_case_website_1.users(id),
    order_code VARCHAR(16) NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    item_name VARCHAR(128),
    trade_url TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INTEGER NULL
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON t_p89018960_cs_case_website_1.withdrawals (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON t_p89018960_cs_case_website_1.withdrawals (status, created_at);

ALTER TABLE t_p89018960_cs_case_website_1.users
    ADD COLUMN IF NOT EXISTS trade_url TEXT;