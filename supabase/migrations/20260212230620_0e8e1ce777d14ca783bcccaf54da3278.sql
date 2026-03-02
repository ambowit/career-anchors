
-- Create a helper function to check if the current user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Allow admins to view ALL assessment results
CREATE POLICY "Admins can view all assessment results"
  ON public.assessment_results FOR SELECT
  USING (public.is_admin());

-- Allow admins to view ALL profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Allow admins to delete any assessment result (for data management)
CREATE POLICY "Admins can delete any assessment result"
  ON public.assessment_results FOR DELETE
  USING (public.is_admin());
