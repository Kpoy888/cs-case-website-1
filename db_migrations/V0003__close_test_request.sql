UPDATE t_p89018960_cs_case_website_1.topup_requests
SET status = 'rejected', comment = 'Тестовая заявка', reviewed_at = CURRENT_TIMESTAMP
WHERE order_code = '988329';