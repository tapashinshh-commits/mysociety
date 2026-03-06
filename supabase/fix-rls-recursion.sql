-- ============================================
-- FIX: infinite recursion in RLS policies
-- Run this in the Supabase SQL Editor
-- ============================================
-- The problem: policies on profiles (and other tables) do
--   SELECT society_id FROM profiles WHERE id = auth.uid()
-- which triggers the profiles RLS policies again → infinite loop.
--
-- The fix: a SECURITY DEFINER function that bypasses RLS.
-- ============================================

-- 1. Create helper functions (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_society_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT society_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- 2. Drop ALL existing policies that cause recursion

-- PROFILES
DROP POLICY IF EXISTS "Profiles viewable by same-society or self" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- POSTS
DROP POLICY IF EXISTS "Posts viewable by same-society members" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts in their society" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- POST LIKES
DROP POLICY IF EXISTS "Post likes viewable by same-society" ON public.post_likes;
DROP POLICY IF EXISTS "Users can toggle own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can remove own likes" ON public.post_likes;

-- COMMENTS
DROP POLICY IF EXISTS "Comments viewable by same-society" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- COMMENT LIKES
DROP POLICY IF EXISTS "Comment likes viewable by same-society" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can toggle comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can remove comment likes" ON public.comment_likes;

-- VENDORS
DROP POLICY IF EXISTS "Vendors viewable by same-society" ON public.vendors;
DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can delete vendors" ON public.vendors;

-- TICKETS
DROP POLICY IF EXISTS "Tickets viewable by same-society" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authors and admins can update tickets" ON public.tickets;

-- TICKET COMMENTS
DROP POLICY IF EXISTS "Ticket comments viewable by same-society" ON public.ticket_comments;
DROP POLICY IF EXISTS "Users can create ticket comments" ON public.ticket_comments;

-- TICKET UPVOTES
DROP POLICY IF EXISTS "Ticket upvotes viewable by same-society" ON public.ticket_upvotes;
DROP POLICY IF EXISTS "Users can toggle ticket upvotes" ON public.ticket_upvotes;
DROP POLICY IF EXISTS "Users can remove ticket upvotes" ON public.ticket_upvotes;

-- SOS ALERTS
DROP POLICY IF EXISTS "SOS alerts viewable by same-society" ON public.sos_alerts;
DROP POLICY IF EXISTS "Users can create SOS alerts" ON public.sos_alerts;
DROP POLICY IF EXISTS "Users can resolve own SOS alerts" ON public.sos_alerts;

-- EMERGENCY CONTACTS
DROP POLICY IF EXISTS "Emergency contacts viewable by same-society" ON public.emergency_contacts;

-- TENANTS
DROP POLICY IF EXISTS "Owners see own tenants" ON public.tenants;
DROP POLICY IF EXISTS "Owners can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Owners can update tenants" ON public.tenants;

-- FORUM
DROP POLICY IF EXISTS "Forum viewable by same-society" ON public.forum_questions;
DROP POLICY IF EXISTS "Users can create questions" ON public.forum_questions;
DROP POLICY IF EXISTS "Answers viewable by same-society" ON public.forum_answers;
DROP POLICY IF EXISTS "Users can create answers" ON public.forum_answers;

-- VENDOR REVIEWS
DROP POLICY IF EXISTS "Reviews viewable by same-society" ON public.vendor_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.vendor_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.vendor_reviews;

-- 3. Recreate ALL policies using the helper functions

-- PROFILES
CREATE POLICY "Profiles viewable by same-society or self"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR society_id IS NULL
    OR society_id = get_my_society_id()
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- POSTS
CREATE POLICY "Posts viewable by same-society members"
  ON public.posts FOR SELECT
  USING (society_id = get_my_society_id());

CREATE POLICY "Users can create posts in their society"
  ON public.posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND society_id = get_my_society_id()
  );

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (author_id = auth.uid());

-- POST LIKES
CREATE POLICY "Post likes viewable by same-society"
  ON public.post_likes FOR SELECT
  USING (
    post_id IN (SELECT id FROM public.posts WHERE society_id = get_my_society_id())
  );

CREATE POLICY "Users can toggle own likes"
  ON public.post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own likes"
  ON public.post_likes FOR DELETE
  USING (user_id = auth.uid());

-- COMMENTS
CREATE POLICY "Comments viewable by same-society"
  ON public.comments FOR SELECT
  USING (
    post_id IN (SELECT id FROM public.posts WHERE society_id = get_my_society_id())
  );

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (author_id = auth.uid());

-- COMMENT LIKES
CREATE POLICY "Comment likes viewable by same-society"
  ON public.comment_likes FOR SELECT
  USING (
    comment_id IN (SELECT id FROM public.comments WHERE post_id IN (
      SELECT id FROM public.posts WHERE society_id = get_my_society_id()
    ))
  );

CREATE POLICY "Users can toggle comment likes"
  ON public.comment_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove comment likes"
  ON public.comment_likes FOR DELETE
  USING (user_id = auth.uid());

-- MESSAGES (unchanged — no society_id reference)
-- Already correct, no changes needed

-- VENDORS
CREATE POLICY "Vendors viewable by same-society"
  ON public.vendors FOR SELECT
  USING (society_id = get_my_society_id());

CREATE POLICY "Admins can insert vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (
    society_id = get_my_society_id()
    AND get_my_role() IN ('admin', 'secretary', 'chairman')
  );

CREATE POLICY "Admins can update vendors"
  ON public.vendors FOR UPDATE
  USING (
    society_id = get_my_society_id()
    AND get_my_role() IN ('admin', 'secretary', 'chairman')
  );

CREATE POLICY "Admins can delete vendors"
  ON public.vendors FOR DELETE
  USING (
    society_id = get_my_society_id()
    AND get_my_role() IN ('admin', 'secretary', 'chairman')
  );

-- TICKETS
CREATE POLICY "Tickets viewable by same-society"
  ON public.tickets FOR SELECT
  USING (society_id = get_my_society_id());

CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND society_id = get_my_society_id()
  );

CREATE POLICY "Authors and admins can update tickets"
  ON public.tickets FOR UPDATE
  USING (
    author_id = auth.uid()
    OR (
      society_id = get_my_society_id()
      AND get_my_role() IN ('admin', 'secretary', 'chairman')
    )
  );

-- TICKET COMMENTS
CREATE POLICY "Ticket comments viewable by same-society"
  ON public.ticket_comments FOR SELECT
  USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE society_id = get_my_society_id())
  );

CREATE POLICY "Users can create ticket comments"
  ON public.ticket_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- TICKET UPVOTES
CREATE POLICY "Ticket upvotes viewable by same-society"
  ON public.ticket_upvotes FOR SELECT
  USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE society_id = get_my_society_id())
  );

CREATE POLICY "Users can toggle ticket upvotes"
  ON public.ticket_upvotes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove ticket upvotes"
  ON public.ticket_upvotes FOR DELETE
  USING (user_id = auth.uid());

-- SOS ALERTS
CREATE POLICY "SOS alerts viewable by same-society"
  ON public.sos_alerts FOR SELECT
  USING (society_id = get_my_society_id());

CREATE POLICY "Users can create SOS alerts"
  ON public.sos_alerts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND society_id = get_my_society_id()
  );

CREATE POLICY "Users can resolve own SOS alerts"
  ON public.sos_alerts FOR UPDATE
  USING (author_id = auth.uid());

-- EMERGENCY CONTACTS
CREATE POLICY "Emergency contacts viewable by same-society"
  ON public.emergency_contacts FOR SELECT
  USING (society_id = get_my_society_id());

-- TENANTS
CREATE POLICY "Owners see own tenants"
  ON public.tenants FOR SELECT
  USING (
    owner_id = auth.uid()
    OR (
      society_id = get_my_society_id()
      AND get_my_role() IN ('admin', 'secretary', 'chairman')
    )
  );

CREATE POLICY "Owners can create tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update tenants"
  ON public.tenants FOR UPDATE
  USING (owner_id = auth.uid());

-- FORUM
CREATE POLICY "Forum viewable by same-society"
  ON public.forum_questions FOR SELECT
  USING (society_id = get_my_society_id());

CREATE POLICY "Users can create questions"
  ON public.forum_questions FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND society_id = get_my_society_id()
  );

CREATE POLICY "Answers viewable by same-society"
  ON public.forum_answers FOR SELECT
  USING (
    question_id IN (SELECT id FROM public.forum_questions WHERE society_id = get_my_society_id())
  );

CREATE POLICY "Users can create answers"
  ON public.forum_answers FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- VENDOR REVIEWS
CREATE POLICY "Reviews viewable by same-society"
  ON public.vendor_reviews FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE society_id = get_my_society_id())
  );

CREATE POLICY "Users can create reviews"
  ON public.vendor_reviews FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON public.vendor_reviews FOR UPDATE
  USING (author_id = auth.uid());
