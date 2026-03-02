-- Add missing columns to product_partners that the UI code already references
ALTER TABLE product_partners
  ADD COLUMN IF NOT EXISTS company_name_en text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Add review_notes column to partner_products that the UI code references
ALTER TABLE partner_products
  ADD COLUMN IF NOT EXISTS review_notes text DEFAULT '';