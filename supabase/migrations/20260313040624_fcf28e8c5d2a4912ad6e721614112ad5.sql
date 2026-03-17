-- Add value_ranking column to scpc_assessment_results for combined batch assessments
-- This stores ideal card rankings when assessment_type = 'combined'
ALTER TABLE scpc_assessment_results 
ADD COLUMN IF NOT EXISTS value_ranking jsonb DEFAULT '[]';

COMMENT ON COLUMN scpc_assessment_results.value_ranking IS 'Ideal life card rankings for combined assessments: [{rank, cardId, category, label, labelEn}]';