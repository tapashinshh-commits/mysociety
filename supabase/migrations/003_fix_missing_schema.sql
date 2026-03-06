-- ============================================================
-- Fix: Add missing columns and tables from 001_enhancements
-- Safe to run multiple times (all idempotent)
-- ============================================================

-- 1. phone_visibility column on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_visibility'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_visibility text DEFAULT 'visible';
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_visibility_check
      CHECK (phone_visibility IN ('visible', 'dm_only', 'hidden'));
  END IF;
END $$;

-- 2. communities table
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

-- Add community_id to posts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'community_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN community_id uuid REFERENCES public.communities(id);
  END IF;
END $$;

-- Seed default communities for all existing societies (skip if already seeded)
INSERT INTO public.communities (society_id, name, slug, icon, description)
SELECT s.id, c.name, c.slug, c.icon, c.description
FROM public.societies s
CROSS JOIN (VALUES
  ('General',      'general',      'forum',   'Open discussions for everyone'),
  ('Maintenance',  'maintenance',  'build',   'Report and track maintenance issues'),
  ('Events',       'events',       'event',   'Society events and celebrations'),
  ('Buy & Sell',   'buy-sell',     'shopping_cart', 'Marketplace for residents'),
  ('Lost & Found', 'lost-found',   'search',  'Lost or found items in society')
) AS c(name, slug, icon, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.communities WHERE society_id = s.id AND slug = c.slug
);

-- Index
CREATE INDEX IF NOT EXISTS idx_communities_society ON public.communities(society_id);

-- RLS for communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Communities viewable by same-society" ON public.communities;
CREATE POLICY "Communities viewable by same-society"
  ON public.communities FOR SELECT
  USING (society_id = public.get_my_society_id());

DROP POLICY IF EXISTS "Admins can manage communities" ON public.communities;
CREATE POLICY "Admins can manage communities"
  ON public.communities FOR INSERT
  WITH CHECK (society_id = public.get_my_society_id() AND public.get_my_role() IN ('admin', 'secretary', 'chairman'));
