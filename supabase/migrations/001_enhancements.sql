-- ============================================================
-- MySociety Enhancement Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TENANT MANAGEMENT 2.0
-- ============================================================

-- Extend tenants table with agreement & ID proof fields
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS agreement_status text DEFAULT 'draft'
  CHECK (agreement_status IN ('draft', 'active', 'expired', 'terminated'));
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS id_proof_url text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS id_proof_type text
  CHECK (id_proof_type IS NULL OR id_proof_type IN ('aadhaar', 'passport', 'driving_license', 'voter_id', 'other'));
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS welcome_charges numeric(10,2) DEFAULT 0;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS notes text;

-- Extend rent_records to support different payment categories
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS category text DEFAULT 'rent'
  CHECK (category IN ('rent', 'maintenance', 'welcome_charge', 'extra'));
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS description text;

-- ============================================================
-- 2. VENDOR SUBCATEGORIES
-- ============================================================

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS subcategory text;

-- ============================================================
-- 3. PROFILE PRIVACY
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_visibility text DEFAULT 'visible'
  CHECK (phone_visibility IN ('visible', 'dm_only', 'hidden'));

-- ============================================================
-- 4. INTEREST-BASED COMMUNITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  icon text DEFAULT 'group',
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(society_id, slug)
);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.communities(id);

-- Seed default communities for all existing societies
INSERT INTO public.communities (society_id, name, slug, icon, description)
SELECT s.id, c.name, c.slug, c.icon, c.description
FROM public.societies s
CROSS JOIN (VALUES
  ('Sports & Fitness', 'sports', 'sports', 'Find sports partners, organize matches'),
  ('Cultural Activities', 'cultural', 'celebration', 'Festivals, cultural events, traditions'),
  ('Request for Help', 'help', 'handshake', 'Ask neighbours for help or favours'),
  ('Celebrations', 'celebrations', 'cake', 'Birthdays, anniversaries, housewarming'),
  ('Events & Gatherings', 'events', 'event', 'Society events, meetups, get-togethers'),
  ('Kids & Parenting', 'kids', 'child_care', 'Playdates, school info, parenting tips')
) AS c(name, slug, icon, description)
ON CONFLICT (society_id, slug) DO NOTHING;

-- Index for community posts
CREATE INDEX IF NOT EXISTS idx_posts_community ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_communities_society ON public.communities(society_id);

-- RLS for communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Communities viewable by same-society" ON public.communities;
CREATE POLICY "Communities viewable by same-society"
  ON public.communities FOR SELECT
  USING (society_id = get_my_society_id());

DROP POLICY IF EXISTS "Admins can manage communities" ON public.communities;
CREATE POLICY "Admins can manage communities"
  ON public.communities FOR INSERT
  WITH CHECK (
    society_id = get_my_society_id()
    AND get_my_role() IN ('admin', 'secretary', 'chairman')
  );

-- ============================================================
-- 5. MAINTENANCE MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.maintenance_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE UNIQUE,
  rate_type text NOT NULL DEFAULT 'unit_type'
    CHECK (rate_type IN ('per_sqft', 'unit_type')),
  per_sqft_rate numeric(10,2),
  rate_1bhk numeric(10,2),
  rate_2bhk numeric(10,2),
  rate_3bhk numeric(10,2),
  rate_4bhk numeric(10,2),
  billing_day int DEFAULT 1,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month text NOT NULL,  -- '2026-03'
  amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_method text,
  paid_date timestamptz,
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(society_id, unit_id, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_records_society ON public.maintenance_records(society_id, month);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_unit ON public.maintenance_records(unit_id, month);

-- RLS for maintenance
ALTER TABLE public.maintenance_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Maintenance config viewable by same-society" ON public.maintenance_config;
CREATE POLICY "Maintenance config viewable by same-society"
  ON public.maintenance_config FOR SELECT
  USING (society_id = get_my_society_id());

DROP POLICY IF EXISTS "Admins can manage maintenance config" ON public.maintenance_config;
CREATE POLICY "Admins can manage maintenance config"
  ON public.maintenance_config FOR INSERT
  WITH CHECK (
    society_id = get_my_society_id()
    AND get_my_role() IN ('admin', 'secretary', 'chairman')
  );

DROP POLICY IF EXISTS "Admins can update maintenance config" ON public.maintenance_config;
CREATE POLICY "Admins can update maintenance config"
  ON public.maintenance_config FOR UPDATE
  USING (
    society_id = get_my_society_id()
    AND get_my_role() IN ('admin', 'secretary', 'chairman')
  );

DROP POLICY IF EXISTS "Maintenance records viewable by same-society" ON public.maintenance_records;
CREATE POLICY "Maintenance records viewable by same-society"
  ON public.maintenance_records FOR SELECT
  USING (
    unit_id = auth.uid()
    OR (
      society_id = get_my_society_id()
      AND get_my_role() IN ('admin', 'secretary', 'chairman')
    )
  );

DROP POLICY IF EXISTS "Admins can create maintenance records" ON public.maintenance_records;
CREATE POLICY "Admins can create maintenance records"
  ON public.maintenance_records FOR INSERT
  WITH CHECK (
    society_id = get_my_society_id()
    AND get_my_role() IN ('admin', 'secretary', 'chairman')
  );

DROP POLICY IF EXISTS "Admins can update maintenance records" ON public.maintenance_records;
CREATE POLICY "Admins can update maintenance records"
  ON public.maintenance_records FOR UPDATE
  USING (
    society_id = get_my_society_id()
    AND get_my_role() IN ('admin', 'secretary', 'chairman')
  );

-- ============================================================
-- REALTIME: Enable for new tables
-- ============================================================
-- Run in Supabase Dashboard > Database > Replication
-- Enable replication for: communities, maintenance_records
