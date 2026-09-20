-- 011_asset_fx_conversion.sql
-- Store the SGD-converted value and applied FX rate for assets held in
-- non-SGD currencies so net worth can be summed consistently in SGD.

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS value_sgd DECIMAL(15, 2);

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS fx_rate DECIMAL(12, 6);

-- Helpers for the sync cron to backfill quickly
CREATE INDEX IF NOT EXISTS idx_assets_currency ON assets(currency);
