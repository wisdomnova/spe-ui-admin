-- ═══════════════════════════════════════════════════════
-- Decouple voters from elections → global voter pool
-- ═══════════════════════════════════════════════════════

-- 1. Create global voters table
CREATE TABLE IF NOT EXISTS voters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  matric_number text NOT NULL UNIQUE,
  email       text NOT NULL,
  level       text,
  department  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2. Migrate existing voter data into the global voters table
--    (upsert to handle duplicate matric numbers across elections)
INSERT INTO voters (name, matric_number, email, level, created_at)
SELECT DISTINCT ON (matric_number)
  name, matric_number, email, level, created_at
FROM election_voters
ON CONFLICT (matric_number) DO NOTHING;

-- 3. Create new junction table
CREATE TABLE IF NOT EXISTS election_voter_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id  uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  voter_id     uuid NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
  has_voted    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(election_id, voter_id)
);

-- 4. Migrate election-voter relationships to the junction table
INSERT INTO election_voter_assignments (election_id, voter_id, has_voted, created_at)
SELECT ev.election_id, v.id, ev.has_voted, ev.created_at
FROM election_voters ev
JOIN voters v ON v.matric_number = ev.matric_number
ON CONFLICT (election_id, voter_id) DO NOTHING;

-- 5. Drop old election_voters table
DROP TABLE IF EXISTS election_voters;

-- 6. RLS policies
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_voter_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for service role" ON voters FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for service role" ON election_voter_assignments FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voters_matric ON voters(matric_number);
CREATE INDEX IF NOT EXISTS idx_voters_level ON voters(level);
CREATE INDEX IF NOT EXISTS idx_eva_election ON election_voter_assignments(election_id);
CREATE INDEX IF NOT EXISTS idx_eva_voter ON election_voter_assignments(voter_id);
