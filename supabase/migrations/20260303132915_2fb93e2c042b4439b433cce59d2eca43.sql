-- Fix ledger entry that was incorrectly depleted by failed consume-cp attempts
-- The wallet still shows 800 activity CP, so the ledger should reflect that
UPDATE cp_ledger_entries
SET remaining_amount = original_amount,
    status = 'active'
WHERE id = 'dd987a2a-0e46-4f5e-9ed8-2235c6084ffe'
  AND status = 'depleted';
