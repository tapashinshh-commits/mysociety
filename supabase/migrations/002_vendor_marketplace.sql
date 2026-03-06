-- ============================================================
-- MySociety Vendor Marketplace Migration
-- Run this in the Supabase SQL Editor
-- Safe to re-run (idempotent)
-- ============================================================

-- ============================================================
-- 1. ADD 'vendor' ROLE TO PROFILES
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('resident', 'owner', 'tenant', 'vendor', 'secretary', 'chairman', 'admin', 'guard'));

-- ============================================================
-- 2. EXTEND VENDORS TABLE
-- ============================================================

-- Link vendor record to a user profile (one-to-one)
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS profile_id uuid UNIQUE REFERENCES public.profiles(id);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS business_phone text;

-- Fix status mismatch: DB has ('available','on_the_way','done_for_today','holiday')
-- App uses ('active','inactive','pending'). Align to app usage.
UPDATE public.vendors SET status = 'active' WHERE status IN ('available', 'on_the_way');
UPDATE public.vendors SET status = 'inactive' WHERE status IN ('done_for_today', 'holiday');

ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_status_check;
ALTER TABLE public.vendors ADD CONSTRAINT vendors_status_check
  CHECK (status IN ('pending', 'active', 'inactive', 'suspended'));

-- ============================================================
-- 3. HELPER FUNCTION FOR VENDOR OWNERSHIP
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_my_vendor(v_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendors WHERE id = v_id AND profile_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 4. VENDOR SERVICES (what vendors offer with pricing)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vendor_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2),
  price_type text DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor ON public.vendor_services(vendor_id);

ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor services viewable by same-society" ON public.vendor_services;
CREATE POLICY "Vendor services viewable by same-society"
  ON public.vendor_services FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE society_id = get_my_society_id()));

DROP POLICY IF EXISTS "Vendors can manage own services" ON public.vendor_services;
CREATE POLICY "Vendors can manage own services"
  ON public.vendor_services FOR INSERT
  WITH CHECK (is_my_vendor(vendor_id));

DROP POLICY IF EXISTS "Vendors can update own services" ON public.vendor_services;
CREATE POLICY "Vendors can update own services"
  ON public.vendor_services FOR UPDATE
  USING (is_my_vendor(vendor_id));

DROP POLICY IF EXISTS "Vendors can delete own services" ON public.vendor_services;
CREATE POLICY "Vendors can delete own services"
  ON public.vendor_services FOR DELETE
  USING (is_my_vendor(vendor_id));

-- ============================================================
-- 5. SERVICE BOOKINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.vendor_services(id),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  status text DEFAULT 'requested'
    CHECK (status IN ('requested', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
  preferred_date date,
  preferred_time text,
  description text,
  address text,
  amount numeric(10,2),
  vendor_notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_bookings_vendor ON public.service_bookings(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_customer ON public.service_bookings(customer_id);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bookings viewable by customer or vendor" ON public.service_bookings;
CREATE POLICY "Bookings viewable by customer or vendor"
  ON public.service_bookings FOR SELECT
  USING (
    customer_id = auth.uid()
    OR vendor_id IN (SELECT id FROM public.vendors WHERE profile_id = auth.uid())
    OR (society_id = get_my_society_id() AND get_my_role() IN ('admin', 'secretary', 'chairman'))
  );

DROP POLICY IF EXISTS "Customers can create bookings" ON public.service_bookings;
CREATE POLICY "Customers can create bookings"
  ON public.service_bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid() AND society_id = get_my_society_id());

DROP POLICY IF EXISTS "Vendor or customer can update bookings" ON public.service_bookings;
CREATE POLICY "Vendor or customer can update bookings"
  ON public.service_bookings FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR vendor_id IN (SELECT id FROM public.vendors WHERE profile_id = auth.uid())
  );

-- ============================================================
-- 6. VENDOR PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor ON public.vendor_products(vendor_id);

ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products viewable by same-society" ON public.vendor_products;
CREATE POLICY "Products viewable by same-society"
  ON public.vendor_products FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE society_id = get_my_society_id()));

DROP POLICY IF EXISTS "Vendors can manage own products" ON public.vendor_products;
CREATE POLICY "Vendors can manage own products"
  ON public.vendor_products FOR INSERT
  WITH CHECK (is_my_vendor(vendor_id));

DROP POLICY IF EXISTS "Vendors can update own products" ON public.vendor_products;
CREATE POLICY "Vendors can update own products"
  ON public.vendor_products FOR UPDATE
  USING (is_my_vendor(vendor_id));

DROP POLICY IF EXISTS "Vendors can delete own products" ON public.vendor_products;
CREATE POLICY "Vendors can delete own products"
  ON public.vendor_products FOR DELETE
  USING (is_my_vendor(vendor_id));

-- ============================================================
-- 7. PRODUCT ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  total_amount numeric(10,2) NOT NULL,
  status text DEFAULT 'placed'
    CHECK (status IN ('placed', 'confirmed', 'in_progress', 'delivered', 'cancelled')),
  delivery_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_orders_vendor ON public.product_orders(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_product_orders_customer ON public.product_orders(customer_id);

ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders viewable by customer or vendor" ON public.product_orders;
CREATE POLICY "Orders viewable by customer or vendor"
  ON public.product_orders FOR SELECT
  USING (
    customer_id = auth.uid()
    OR vendor_id IN (SELECT id FROM public.vendors WHERE profile_id = auth.uid())
    OR (society_id = get_my_society_id() AND get_my_role() IN ('admin', 'secretary', 'chairman'))
  );

DROP POLICY IF EXISTS "Customers can create orders" ON public.product_orders;
CREATE POLICY "Customers can create orders"
  ON public.product_orders FOR INSERT
  WITH CHECK (customer_id = auth.uid() AND society_id = get_my_society_id());

DROP POLICY IF EXISTS "Vendor or customer can update orders" ON public.product_orders;
CREATE POLICY "Vendor or customer can update orders"
  ON public.product_orders FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR vendor_id IN (SELECT id FROM public.vendors WHERE profile_id = auth.uid())
  );

-- ============================================================
-- 8. VENDOR SELF-MANAGEMENT RLS
-- ============================================================

DROP POLICY IF EXISTS "Vendor role can register" ON public.vendors;
CREATE POLICY "Vendor role can register"
  ON public.vendors FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND society_id = get_my_society_id()
  );

DROP POLICY IF EXISTS "Vendors can update own record" ON public.vendors;
CREATE POLICY "Vendors can update own record"
  ON public.vendors FOR UPDATE
  USING (profile_id = auth.uid());

-- ============================================================
-- REALTIME: Enable for new tables
-- ============================================================
-- Run in Supabase Dashboard > Database > Replication
-- Enable replication for: service_bookings, product_orders
