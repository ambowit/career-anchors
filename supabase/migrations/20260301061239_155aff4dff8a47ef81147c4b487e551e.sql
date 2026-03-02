-- Partner Products & Revenue System

-- Product partners table
CREATE TABLE IF NOT EXISTS product_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_name_en TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Partner products table
CREATE TABLE IF NOT EXISTS partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES product_partners(id) ON DELETE CASCADE,
  product_name_zh_tw TEXT NOT NULL,
  product_name_zh_cn TEXT,
  product_name_en TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('document', 'link')),
  -- document = uploaded test design doc (50:50 revenue split)
  -- link = external link authorization (30:70 revenue split, 70 to partner)
  description_zh_tw TEXT,
  description_zh_cn TEXT,
  description_en TEXT,
  cp_price INTEGER NOT NULL DEFAULT 0,
  external_url TEXT, -- for link type
  document_url TEXT, -- for document type
  revenue_split_platform NUMERIC(4,2) NOT NULL DEFAULT 0.50,
  revenue_split_partner NUMERIC(4,2) NOT NULL DEFAULT 0.50,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'suspended')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  is_active BOOLEAN DEFAULT false,
  total_sales INTEGER DEFAULT 0,
  total_revenue_cp INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partner revenue records
CREATE TABLE IF NOT EXISTS partner_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES product_partners(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES partner_products(id) ON DELETE CASCADE,
  order_user_id UUID NOT NULL REFERENCES auth.users(id),
  cp_amount INTEGER NOT NULL,
  platform_share INTEGER NOT NULL,
  partner_share INTEGER NOT NULL,
  currency_value NUMERIC(10,2) DEFAULT 0,
  settlement_status TEXT NOT NULL DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'settled', 'cancelled')),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_revenue ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_partners
CREATE POLICY "Users can view own partner profile" ON product_partners
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own partner profile" ON product_partners
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own partner profile" ON product_partners
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for partner_products
CREATE POLICY "Partners can manage own products" ON partner_products
  FOR ALL USING (
    partner_id IN (SELECT id FROM product_partners WHERE user_id = auth.uid())
  );
CREATE POLICY "Public can view approved active products" ON partner_products
  FOR SELECT USING (review_status = 'approved' AND is_active = true);

-- RLS policies for partner_revenue
CREATE POLICY "Partners can view own revenue" ON partner_revenue
  FOR SELECT USING (
    partner_id IN (SELECT id FROM product_partners WHERE user_id = auth.uid())
  );

COMMENT ON TABLE product_partners IS 'Product partner accounts with approval workflow';
COMMENT ON TABLE partner_products IS 'Products submitted by partners for platform sale';
COMMENT ON TABLE partner_revenue IS 'Revenue records per product sale with split tracking';