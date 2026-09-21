CREATE TABLE IF NOT EXISTS t_p89018960_cs_case_website_1.inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p89018960_cs_case_website_1.users(id),
    skin_name VARCHAR(128) NOT NULL,
    price INTEGER NOT NULL,
    image_url TEXT,
    rarity VARCHAR(48),
    case_name VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'owned',
    withdrawal_id INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON t_p89018960_cs_case_website_1.inventory (user_id, status);

ALTER TABLE t_p89018960_cs_case_website_1.withdrawals
    ADD COLUMN IF NOT EXISTS items_count INTEGER NOT NULL DEFAULT 0;