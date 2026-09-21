CREATE TABLE IF NOT EXISTS t_p89018960_cs_case_website_1.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nickname VARCHAR(64) NOT NULL,
    password_hash TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON t_p89018960_cs_case_website_1.users (LOWER(email));

CREATE TABLE IF NOT EXISTS t_p89018960_cs_case_website_1.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p89018960_cs_case_website_1.users(id),
    token_hash TEXT NOT NULL UNIQUE,
    ip VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p89018960_cs_case_website_1.sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON t_p89018960_cs_case_website_1.sessions (user_id);

CREATE TABLE IF NOT EXISTS t_p89018960_cs_case_website_1.auth_log (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    ip VARCHAR(64),
    action VARCHAR(32) NOT NULL,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_log_ip_time ON t_p89018960_cs_case_website_1.auth_log (ip, created_at);