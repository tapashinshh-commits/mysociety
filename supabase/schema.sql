-- ============================================
-- MySociety Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. SOCIETIES TABLE
-- ============================================
CREATE TABLE public.societies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pin_code TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed common societies for the dropdown
INSERT INTO public.societies (name, city, state) VALUES
  ('Green Valley Apartments', 'Mumbai', 'Maharashtra'),
  ('Sunshine Residency', 'Mumbai', 'Maharashtra'),
  ('Royal Heights', 'Pune', 'Maharashtra'),
  ('Palm Grove Society', 'Bangalore', 'Karnataka'),
  ('Lotus Park', 'Hyderabad', 'Telangana'),
  ('Shanti Nagar CHS', 'Mumbai', 'Maharashtra'),
  ('Prestige Towers', 'Bangalore', 'Karnataka'),
  ('Godrej Garden City', 'Ahmedabad', 'Gujarat'),
  ('Hiranandani Estate', 'Mumbai', 'Maharashtra'),
  ('DLF Phase 1', 'Gurgaon', 'Haryana'),
  ('Oberoi Splendor', 'Mumbai', 'Maharashtra'),
  ('Lodha Palava', 'Mumbai', 'Maharashtra'),
  ('Jaypee Kosmos', 'Noida', 'Uttar Pradesh');

-- ============================================
-- 2. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  mobile TEXT,
  society_id UUID REFERENCES public.societies(id),
  flat_no TEXT,
  block TEXT,
  floor TEXT,
  role TEXT DEFAULT 'resident' CHECK (role IN ('resident', 'owner', 'tenant', 'secretary', 'chairman', 'admin', 'guard')),
  aadhaar_last4 TEXT,
  id_card_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. POSTS TABLE (Community Feed)
-- ============================================
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'question', 'alert', 'event')),
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.post_likes (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.comment_likes (
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

-- ============================================
-- 4. MESSAGES TABLE
-- ============================================
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. VENDORS TABLE
-- ============================================
CREATE TABLE public.vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_hi TEXT,
  category TEXT NOT NULL,
  phone TEXT NOT NULL,
  timing TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_the_way', 'done_for_today', 'holiday')),
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  area TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. TICKETS TABLE (Complaints with Escalation)
-- ============================================
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'escalated', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  escalation_level INTEGER DEFAULT 0,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ticket_upvotes (
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (ticket_id, user_id)
);

-- ============================================
-- 7. SOS ALERTS TABLE
-- ============================================
CREATE TABLE public.sos_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_hi TEXT,
  phone TEXT NOT NULL,
  type TEXT DEFAULT 'other' CHECK (type IN ('police', 'fire', 'ambulance', 'security', 'other')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. TENANTS TABLE (for future use)
-- ============================================
CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_profile_id UUID REFERENCES public.profiles(id),
  tenant_name TEXT NOT NULL,
  tenant_mobile TEXT NOT NULL,
  tenant_email TEXT,
  flat_no TEXT NOT NULL,
  block TEXT NOT NULL,
  floor TEXT,
  rent_amount NUMERIC(10,2),
  lease_start DATE,
  lease_end DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. RENT RECORDS TABLE (for future use)
-- ============================================
CREATE TABLE public.rent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_method TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 10. Q&A FORUM TABLES (for future use)
-- ============================================
CREATE TABLE public.forum_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_faq BOOLEAN DEFAULT false,
  upvotes_count INTEGER DEFAULT 0,
  answers_count INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.forum_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.forum_questions(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 11. VENDOR REVIEWS TABLE
-- ============================================
CREATE TABLE public.vendor_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, author_id)
);

-- ============================================
-- 12. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_society ON public.profiles(society_id);
CREATE INDEX idx_posts_society ON public.posts(society_id, created_at DESC);
CREATE INDEX idx_comments_post ON public.comments(post_id, created_at);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id, created_at DESC);
CREATE INDEX idx_vendors_society ON public.vendors(society_id);
CREATE INDEX idx_tickets_society ON public.tickets(society_id, created_at DESC);
CREATE INDEX idx_tickets_status ON public.tickets(society_id, status);
CREATE INDEX idx_sos_alerts_society ON public.sos_alerts(society_id, is_active, created_at DESC);
CREATE INDEX idx_tenants_owner ON public.tenants(owner_id);
CREATE INDEX idx_tenants_society ON public.tenants(society_id);
CREATE INDEX idx_rent_records_tenant ON public.rent_records(tenant_id, due_date DESC);
CREATE INDEX idx_forum_questions_society ON public.forum_questions(society_id, created_at DESC);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ============================================
-- TRIGGERS: Auto-update like/comment counts
-- ============================================

-- Post likes count
CREATE OR REPLACE FUNCTION public.increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_like_insert
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.increment_post_likes();

CREATE TRIGGER on_post_like_delete
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_post_likes();

-- Post comments count
CREATE OR REPLACE FUNCTION public.increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.increment_post_comments();

CREATE TRIGGER on_comment_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.decrement_post_comments();

-- Ticket upvotes count
CREATE OR REPLACE FUNCTION public.increment_ticket_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tickets SET upvotes_count = upvotes_count + 1 WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_ticket_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tickets SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.ticket_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ticket_upvote_insert
  AFTER INSERT ON public.ticket_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.increment_ticket_upvotes();

CREATE TRIGGER on_ticket_upvote_delete
  AFTER DELETE ON public.ticket_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_ticket_upvotes();

-- Vendor rating recalculation
CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_id UUID;
BEGIN
  v_id := COALESCE(NEW.vendor_id, OLD.vendor_id);
  UPDATE public.vendors SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.vendor_reviews WHERE vendor_id = v_id), 0),
    review_count = (SELECT COUNT(*) FROM public.vendor_reviews WHERE vendor_id = v_id)
  WHERE id = v_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vendor_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_vendor_rating();

-- SOS notification trigger
CREATE OR REPLACE FUNCTION public.notify_sos_alert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT
    p.id,
    'sos_alert',
    'EMERGENCY: ' || NEW.type,
    NEW.message,
    jsonb_build_object('alert_id', NEW.id, 'location', NEW.location)
  FROM public.profiles p
  WHERE p.society_id = NEW.society_id AND p.id != NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_sos_alert_created
  AFTER INSERT ON public.sos_alerts
  FOR EACH ROW EXECUTE FUNCTION public.notify_sos_alert();

-- Auto-update updated_at on tickets
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ticket_update
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RPC: Get conversations for messages page
-- ============================================
CREATE OR REPLACE FUNCTION public.get_conversations(p_user_id UUID)
RETURNS TABLE(
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message TEXT,
  last_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
  WITH latest_messages AS (
    SELECT DISTINCT ON (
      LEAST(sender_id, receiver_id),
      GREATEST(sender_id, receiver_id)
    )
      id,
      sender_id,
      receiver_id,
      content,
      created_at,
      read
    FROM public.messages
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
    ORDER BY
      LEAST(sender_id, receiver_id),
      GREATEST(sender_id, receiver_id),
      created_at DESC
  )
  SELECT
    CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END AS other_user_id,
    p.full_name AS other_user_name,
    p.avatar_url AS other_user_avatar,
    lm.content AS last_message,
    lm.created_at AS last_time,
    (
      SELECT COUNT(*)
      FROM public.messages
      WHERE receiver_id = p_user_id
        AND sender_id = CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END
        AND read = false
    ) AS unread_count
  FROM latest_messages lm
  JOIN public.profiles p ON p.id = CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END
  ORDER BY lm.created_at DESC;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.get_my_society_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT society_id FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

-- SOCIETIES: readable by all authenticated, creatable by authenticated
CREATE POLICY "Societies are viewable by everyone"
  ON public.societies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create societies"
  ON public.societies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- PROFILES: viewable by same-society members, updateable by self
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

-- POSTS: same society only
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

-- MESSAGES: only between sender and receiver
CREATE POLICY "Users see own messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Receiver can mark as read"
  ON public.messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- VENDORS: same society
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

-- TICKETS: same society
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

-- SOS ALERTS: same society
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

-- EMERGENCY CONTACTS: same society
CREATE POLICY "Emergency contacts viewable by same-society"
  ON public.emergency_contacts FOR SELECT
  USING (society_id = get_my_society_id());

-- TENANTS: owner or admin
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

-- RENT RECORDS: owner or tenant
CREATE POLICY "Owner or tenant can see rent records"
  ON public.rent_records FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    OR tenant_id IN (SELECT id FROM public.tenants WHERE tenant_profile_id = auth.uid())
  );

CREATE POLICY "Owner can create rent records"
  ON public.rent_records FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Owner can update rent records"
  ON public.rent_records FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- FORUM: same society
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

-- VENDOR REVIEWS: same society
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

-- NOTIFICATIONS: own only
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKETS
-- Run these separately in the SQL Editor
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('id-cards', 'id-cards', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- CREATE POLICY "Avatar upload" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
-- CREATE POLICY "Avatar owner delete" ON storage.objects FOR DELETE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Post image upload" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "Post image public read" ON storage.objects FOR SELECT
--   USING (bucket_id = 'post-images');

-- CREATE POLICY "ID card upload" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "ID card owner read" ON storage.objects FOR SELECT
--   USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- REALTIME: Enable for real-time subscriptions
-- ============================================
-- Run in Supabase Dashboard > Database > Replication
-- Enable replication for: posts, comments, messages, sos_alerts, notifications
