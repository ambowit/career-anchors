-- Add role and career_stage columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS career_stage TEXT;

-- Add comment
COMMENT ON COLUMN profiles.role IS 'User role: user or admin';
COMMENT ON COLUMN profiles.career_stage IS 'Career stage: entry, mid, senior, hr';