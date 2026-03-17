-- Add employee report access mode to batch assessment table
-- Controls whether employees can view/download their assessment reports
ALTER TABLE scpc_assessment_batches
ADD COLUMN IF NOT EXISTS employee_report_access_mode TEXT NOT NULL DEFAULT 'view_and_download'
CHECK (employee_report_access_mode IN ('view_and_download', 'view_only', 'hidden'));

COMMENT ON COLUMN scpc_assessment_batches.employee_report_access_mode IS 'Controls employee report visibility and download: view_and_download = full access, view_only = can view but not download, hidden = only HR/admin can view';