-- Migration: add table for incoming-delivery planning (planning.html)
-- Run this once in the Supabase SQL editor for this project before using the new page.

CREATE TABLE IF NOT EXISTS receiving_plans (
  id BIGINT PRIMARY KEY,
  material BIGINT NOT NULL REFERENCES master_packmat(material) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  plan_time TIME,
  planned_pallets NUMERIC NOT NULL DEFAULT 0,
  received_pallets NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'partial' | 'complete'
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE receiving_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON receiving_plans;
DROP POLICY IF EXISTS "Allow public insert" ON receiving_plans;
DROP POLICY IF EXISTS "Allow public update" ON receiving_plans;
DROP POLICY IF EXISTS "Allow public delete" ON receiving_plans;

CREATE POLICY "Allow public select" ON receiving_plans FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON receiving_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON receiving_plans FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON receiving_plans FOR DELETE USING (true);
