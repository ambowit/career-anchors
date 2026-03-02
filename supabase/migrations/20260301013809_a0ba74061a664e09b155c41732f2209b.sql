
-- V8.1 DDL Migration 5: Alter course_enrollments and profiles

-- Add assignment answers storage for batch CDU review
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS assignment_answers jsonb DEFAULT '[]';
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS sign_in_time timestamptz;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS assignment_questions jsonb DEFAULT '[]';

COMMENT ON COLUMN course_enrollments.assignment_answers IS 'Array of open-ended assignment answers: [{question, answer}]';
COMMENT ON COLUMN course_enrollments.sign_in_time IS 'Actual sign-in timestamp for attendance verification';
COMMENT ON COLUMN course_enrollments.assignment_questions IS 'Assignment questions defined by course: [{id, question_text}]';

-- Add English name fields to profiles for GCQA export
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name_en text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name_en text DEFAULT '';

COMMENT ON COLUMN profiles.first_name_en IS 'English first name for GCQA data export';
COMMENT ON COLUMN profiles.last_name_en IS 'English last name for GCQA data export';
