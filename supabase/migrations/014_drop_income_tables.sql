-- 014_drop_income_tables.sql
-- Remove the unused Income & CPF automation feature. Its cron was never
-- scheduled, so the tables below were never populated. Surplus tracking now
-- relies solely on surplus_config.monthly_income.

DROP TABLE IF EXISTS income_records;
DROP TABLE IF EXISTS user_settings;
