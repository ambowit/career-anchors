-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own results" ON assessment_results;
DROP POLICY IF EXISTS "Users can insert own results" ON assessment_results;
DROP POLICY IF EXISTS "Users can delete own results" ON assessment_results;
DROP POLICY IF EXISTS "Users can view own progress" ON assessment_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON assessment_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON assessment_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON assessment_progress;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_progress ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Assessment results policies
CREATE POLICY "Users can view own results" ON assessment_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results" ON assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own results" ON assessment_results
  FOR DELETE USING (auth.uid() = user_id);

-- Assessment progress policies
CREATE POLICY "Users can view own progress" ON assessment_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON assessment_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON assessment_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON assessment_progress
  FOR DELETE USING (auth.uid() = user_id);