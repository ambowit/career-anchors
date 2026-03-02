
-- Add additional_roles JSONB column to profiles table
-- Stores array of {role_type, organization_id, organization_name, department_id} objects
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS additional_roles JSONB DEFAULT '[]';

COMMENT ON COLUMN profiles.additional_roles IS 'Array of additional role assignments: [{role_type, organization_id, department_id}]';
