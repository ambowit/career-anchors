-- Create assessment_results table to store completed assessments
CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Raw scores for each dimension (0-100 scale)
  score_tf NUMERIC(5,2) NOT NULL,  -- 技术/专业能力型
  score_gm NUMERIC(5,2) NOT NULL,  -- 管理型
  score_au NUMERIC(5,2) NOT NULL,  -- 自主/独立型
  score_se NUMERIC(5,2) NOT NULL,  -- 安全/稳定型
  score_ec NUMERIC(5,2) NOT NULL,  -- 创业/创造型
  score_sv NUMERIC(5,2) NOT NULL,  -- 服务/奉献型
  score_ch NUMERIC(5,2) NOT NULL,  -- 挑战型
  score_ls NUMERIC(5,2) NOT NULL,  -- 生活方式整合型
  
  -- Derived results
  main_anchor TEXT NOT NULL,       -- Main career anchor code (e.g., 'TF', 'GM')
  secondary_anchor TEXT,           -- Secondary anchor if exists
  conflict_anchors TEXT[],         -- Array of conflicting anchor codes
  risk_index NUMERIC(5,2) NOT NULL,-- Risk index (0-100)
  stability TEXT NOT NULL,         -- 'mature', 'developing', 'unclear'
  
  -- Metadata
  question_count INTEGER NOT NULL, -- Number of questions answered
  completion_time_seconds INTEGER, -- Time taken to complete
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster user lookups
CREATE INDEX assessment_results_user_id_idx ON public.assessment_results(user_id);
CREATE INDEX assessment_results_created_at_idx ON public.assessment_results(created_at DESC);

-- Enable RLS
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own results
CREATE POLICY "Users can view own assessment results"
  ON public.assessment_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment results"
  ON public.assessment_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessment results"
  ON public.assessment_results FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.assessment_results IS 'Stores completed career anchor assessment results for users';