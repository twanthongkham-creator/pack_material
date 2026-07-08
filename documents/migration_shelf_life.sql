-- Migration: Add shelf_life column to master_packmat and set default for bottles (ขวด)
-- Run this in the Supabase SQL editor.

-- 1) Add shelf_life column (in days) to master_packmat
ALTER TABLE master_packmat ADD COLUMN IF NOT EXISTS shelf_life INTEGER;

-- 2) Update default shelf_life to 30 days for type = 'ขวด'
UPDATE master_packmat 
SET shelf_life = 30 
WHERE type = 'ขวด' AND shelf_life IS NULL;
