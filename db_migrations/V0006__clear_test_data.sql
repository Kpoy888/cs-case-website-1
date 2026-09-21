UPDATE t_p89018960_cs_case_website_1.inventory
SET status = 'sold', updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

UPDATE t_p89018960_cs_case_website_1.withdrawals
SET status = 'rejected', comment = 'Тестовая заявка', reviewed_at = CURRENT_TIMESTAMP
WHERE user_id = 1 AND status = 'pending';

UPDATE t_p89018960_cs_case_website_1.users
SET balance = 0
WHERE id = 1;