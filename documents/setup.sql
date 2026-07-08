-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  updated TIMESTAMPTZ DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  category BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  updated TIMESTAMPTZ DEFAULT now()
);

-- Create master_packmat table
CREATE TABLE IF NOT EXISTS master_packmat (
  material BIGINT PRIMARY KEY,
  material_name TEXT NOT NULL,
  material_desc TEXT,
  material_group TEXT,
  type TEXT,
  category TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_packmat ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "Allow public select" ON categories;
DROP POLICY IF EXISTS "Allow public insert" ON categories;
DROP POLICY IF EXISTS "Allow public update" ON categories;
DROP POLICY IF EXISTS "Allow public delete" ON categories;

CREATE POLICY "Allow public select" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON categories FOR DELETE USING (true);

-- Products policies
DROP POLICY IF EXISTS "Allow public select" ON products;
DROP POLICY IF EXISTS "Allow public insert" ON products;
DROP POLICY IF EXISTS "Allow public update" ON products;
DROP POLICY IF EXISTS "Allow public delete" ON products;

CREATE POLICY "Allow public select" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON products FOR DELETE USING (true);

-- Master Packmat policies
DROP POLICY IF EXISTS "Allow public select" ON master_packmat;
DROP POLICY IF EXISTS "Allow public insert" ON master_packmat;
DROP POLICY IF EXISTS "Allow public update" ON master_packmat;
DROP POLICY IF EXISTS "Allow public delete" ON master_packmat;

CREATE POLICY "Allow public select" ON master_packmat FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON master_packmat FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON master_packmat FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON master_packmat FOR DELETE USING (true);
