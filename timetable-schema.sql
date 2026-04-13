CREATE TABLE IF NOT EXISTS timetables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level int NOT NULL CHECK (level IN (100, 200, 300, 400, 500)),
  type text NOT NULL CHECK (type IN ('class', 'exam')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (level, type)
);

CREATE TABLE IF NOT EXISTS timetable_courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timetable_id uuid NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  name text NOT NULL,
  day text NOT NULL CHECK (day IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')),
  start_time text NOT NULL,
  end_time text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES timetable_courses(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_timetables ON timetables FOR SELECT USING (true);
CREATE POLICY public_insert_timetables ON timetables FOR INSERT WITH CHECK (true);

CREATE POLICY public_read_courses ON timetable_courses FOR SELECT USING (true);
CREATE POLICY public_insert_courses ON timetable_courses FOR INSERT WITH CHECK (true);
CREATE POLICY public_update_courses ON timetable_courses FOR UPDATE USING (true);
CREATE POLICY public_delete_courses ON timetable_courses FOR DELETE USING (true);

CREATE POLICY public_read_notes ON course_notes FOR SELECT USING (true);
CREATE POLICY public_insert_notes ON course_notes FOR INSERT WITH CHECK (true);
CREATE POLICY public_update_notes ON course_notes FOR UPDATE USING (true);
CREATE POLICY public_delete_notes ON course_notes FOR DELETE USING (true);
