ALTER TABLE t_p89018960_cs_case_website_1.users
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS t_p89018960_cs_case_website_1.topup_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p89018960_cs_case_website_1.users(id),
    order_code VARCHAR(16) NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    total INTEGER NOT NULL,
    method VARCHAR(16) NOT NULL DEFAULT 'card',
    receipt_url TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INTEGER NULL
);

CREATE INDEX IF NOT EXISTS idx_topup_user ON t_p89018960_cs_case_website_1.topup_requests (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_topup_status ON t_p89018960_cs_case_website_1.topup_requests (status, created_at);