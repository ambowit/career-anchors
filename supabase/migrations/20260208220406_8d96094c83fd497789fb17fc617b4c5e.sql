-- Create assessment_progress table to store in-progress assessments
CREATE TABLE public.assessment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progress state
  current_index INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  question_order TEXT[] NOT NULL DEFAULT '{}',
  
  -- Metadata
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Ensure only one active progress per user
  CONSTRAINT one_active_progress_per_user UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX assessment_progress_user_id_idx ON public.assessment_progress(user_id);

-- Enable RLS
ALTER TABLE public.assessment_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own progress
CREATE POLICY "Users can view own progress"
  ON public.assessment_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.assessment_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.assessment_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.assessment_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.assessment_progress IS 'Stores in-progress assessment state for users to resume later';