
ALTER TABLE assessment_results
ADD COLUMN answers jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN assessment_results.answers IS 'Stores user answers as JSON array: [{questionId, value, dimension, weight}]';
