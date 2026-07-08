-- Migration: add tables for daily production planning (production.html)
-- Run this once in the Supabase SQL editor for this project before using the new page.

-- One row per production run (e.g. "10/07/2026 - น้ำดื่มขวด 600ml")
CREATE TABLE IF NOT EXISTS production_runs (
  id BIGINT PRIMARY KEY,
  run_date DATE NOT NULL,
  product_name TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed'
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One row per material line needed for a production run (many-to-one with production_runs)
CREATE TABLE IF NOT EXISTS production_run_items (
  id BIGINT PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
  material BIGINT NOT NULL REFERENCES master_packmat(material) ON DELETE CASCADE,
  required_pallets NUMERIC NOT NULL DEFAULT 0,
  required_layers NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE production_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_run_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON production_runs;
DROP POLICY IF EXISTS "Allow public insert" ON production_runs;
DROP POLICY IF EXISTS "Allow public update" ON production_runs;
DROP POLICY IF EXISTS "Allow public delete" ON production_runs;

CREATE POLICY "Allow public select" ON production_runs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON production_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON production_runs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON production_runs FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select" ON production_run_items;
DROP POLICY IF EXISTS "Allow public insert" ON production_run_items;
DROP POLICY IF EXISTS "Allow public update" ON production_run_items;
DROP POLICY IF EXISTS "Allow public delete" ON production_run_items;

CREATE POLICY "Allow public select" ON production_run_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON production_run_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON production_run_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON production_run_items FOR DELETE USING (true);
