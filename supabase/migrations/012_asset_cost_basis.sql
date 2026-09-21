-- 012_asset_cost_basis.sql
-- Track the amount paid (in SGD) for an asset so we can surface gain/loss.

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS cost_basis DECIMAL(15, 2);
