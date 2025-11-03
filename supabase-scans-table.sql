-- Create scans table for storing PC scan data
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  brand TEXT,
  model TEXT,
  cpu TEXT,
  cores TEXT,
  threads TEXT,
  base_speed_mhz TEXT,
  ram_gb TEXT,
  ram_speed_mhz TEXT,
  ram_type TEXT,
  storage JSONB,
  gpu TEXT,
  display_resolution TEXT,
  screen_size_inch NUMERIC,
  os TEXT,
  scan_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust based on your needs)
CREATE POLICY "Allow all operations on scans" ON scans
  FOR ALL
  USING (true)
  WITH CHECK (true);

