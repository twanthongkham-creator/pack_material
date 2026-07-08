-- Migration: add fields needed for daily stock recording (บันทึกยอด / stock.html)
-- Run this once in the Supabase SQL editor for this project before using the new pages.

-- 1) Packing-unit conversion factors per material (units per pallet / per layer-shelf).
--    These are fixed properties of a material's packaging spec (e.g. a 360ml PET bottle
--    is packed 3040 per pallet and 380 per layer), so they live on master_packmat.
ALTER TABLE master_packmat ADD COLUMN IF NOT EXISTS pallet_unit NUMERIC;
ALTER TABLE master_packmat ADD COLUMN IF NOT EXISTS layer_unit NUMERIC;

-- 2) Latest stock-count fields on products (no daily history is kept — each save
--    overwrites the previous count, matching the "show latest only" requirement).
ALTER TABLE products ADD COLUMN IF NOT EXISTS pallet_count NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS layer_count NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS production_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS best_before DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_updated_at TIMESTAMPTZ;
