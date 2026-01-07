-- ============================================
-- COMPREHENSIVE RLS POLICIES FOR MULTI-TENANCY
-- Tenant Boundary: family_id
-- ============================================

-- ============================================
-- CLEANUP: Drop policies from earlier migrations
-- These have different names, need explicit cleanup
-- ============================================

-- user_profiles (from 20250107100100)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- children (from 20250107100200)
DROP POLICY IF EXISTS "Users can view family children" ON children;
DROP POLICY IF EXISTS "Users can insert family children" ON children;
DROP POLICY IF EXISTS "Users can update family children" ON children;
DROP POLICY IF EXISTS "Users can delete family children" ON children;

-- books (from 20250107100300)
DROP POLICY IF EXISTS "Users can view family books" ON books;
DROP POLICY IF EXISTS "Users can insert family books" ON books;
DROP POLICY IF EXISTS "Users can update family books" ON books;

-- book_pages (from 20250107100400)
DROP POLICY IF EXISTS "Users can view book pages" ON book_pages;
DROP POLICY IF EXISTS "Users can insert book pages" ON book_pages;
DROP POLICY IF EXISTS "Users can update book pages" ON book_pages;

-- story_memory (from 20250107100500)
DROP POLICY IF EXISTS "Users can view child story memory" ON story_memory;
DROP POLICY IF EXISTS "Users can upsert child story memory" ON story_memory;
DROP POLICY IF EXISTS "Users can update child story memory" ON story_memory;

-- voice_profiles (from 20250107100600)
DROP POLICY IF EXISTS "Users can view family voice profiles" ON voice_profiles;
DROP POLICY IF EXISTS "Users can insert voice profiles" ON voice_profiles;
DROP POLICY IF EXISTS "Users can update family voice profiles" ON voice_profiles;
DROP POLICY IF EXISTS "Users can delete family voice profiles" ON voice_profiles;

-- narrations (from 20250107100700)
DROP POLICY IF EXISTS "Users can view narrations" ON narrations;
DROP POLICY IF EXISTS "Users can insert narrations" ON narrations;

-- subscriptions (from 20250107100800)
DROP POLICY IF EXISTS "Users can view family subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Helper function to get current user's family_id
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE user_id = auth.uid() 
    AND role = required_role
    AND status = 'active'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user can modify settings
CREATE OR REPLACE FUNCTION public.user_can_modify_settings()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE user_id = auth.uid() 
    AND (role IN ('admin', 'parent') OR can_modify_settings = true)
    AND status = 'active'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- FAMILIES - Root tenant table
-- ============================================

DROP POLICY IF EXISTS "Users can view their family" ON families;
CREATE POLICY "Users can view their family" ON families
  FOR SELECT USING (id = public.get_user_family_id());

DROP POLICY IF EXISTS "Users can update their family" ON families;
CREATE POLICY "Users can update their family" ON families
  FOR UPDATE USING (id = public.get_user_family_id() AND public.user_can_modify_settings());

-- ============================================
-- USER_PROFILES - Users belong to families
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can view family members profiles" ON user_profiles;
CREATE POLICY "Users can view family members profiles" ON user_profiles
  FOR SELECT USING (family_id = public.get_user_family_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================
-- CHILDREN - Scoped to family
-- ============================================

DROP POLICY IF EXISTS "Family members can view children" ON children;
CREATE POLICY "Family members can view children" ON children
  FOR SELECT USING (family_id = public.get_user_family_id());

DROP POLICY IF EXISTS "Authorized members can insert children" ON children;
CREATE POLICY "Authorized members can insert children" ON children
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id()
    AND (
      public.user_has_role('admin') 
      OR public.user_has_role('parent')
      OR EXISTS (
        SELECT 1 FROM family_members 
        WHERE user_id = auth.uid() 
        AND can_modify_children = true
      )
    )
  );

DROP POLICY IF EXISTS "Authorized members can update children" ON children;
CREATE POLICY "Authorized members can update children" ON children
  FOR UPDATE USING (
    family_id = public.get_user_family_id()
    AND (
      public.user_has_role('admin') 
      OR public.user_has_role('parent')
      OR EXISTS (
        SELECT 1 FROM family_members 
        WHERE user_id = auth.uid() 
        AND can_modify_children = true
      )
    )
  );

DROP POLICY IF EXISTS "Authorized members can delete children" ON children;
CREATE POLICY "Authorized members can delete children" ON children
  FOR DELETE USING (
    family_id = public.get_user_family_id()
    AND (public.user_has_role('admin') OR public.user_has_role('parent'))
  );

-- ============================================
-- BOOKS - Scoped to family
-- ============================================

DROP POLICY IF EXISTS "Family members can view books" ON books;
CREATE POLICY "Family members can view books" ON books
  FOR SELECT USING (family_id = public.get_user_family_id());

DROP POLICY IF EXISTS "Authorized members can create books" ON books;
CREATE POLICY "Authorized members can create books" ON books
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id()
    AND (
      public.user_has_role('admin') 
      OR public.user_has_role('parent')
      OR public.user_has_role('caregiver')
      OR EXISTS (
        SELECT 1 FROM family_members 
        WHERE user_id = auth.uid() 
        AND can_create_books = true
      )
    )
  );

DROP POLICY IF EXISTS "Authorized members can update books" ON books;
CREATE POLICY "Authorized members can update books" ON books
  FOR UPDATE USING (
    family_id = public.get_user_family_id()
    AND (
      public.user_has_role('admin') 
      OR public.user_has_role('parent')
      OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authorized members can delete books" ON books;
CREATE POLICY "Authorized members can delete books" ON books
  FOR DELETE USING (
    family_id = public.get_user_family_id()
    AND (public.user_has_role('admin') OR public.user_has_role('parent'))
  );

-- ============================================
-- BOOK_PAGES - Inherit from books
-- ============================================

DROP POLICY IF EXISTS "Family members can view book pages" ON book_pages;
CREATE POLICY "Family members can view book pages" ON book_pages
  FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE family_id = public.get_user_family_id())
  );

DROP POLICY IF EXISTS "Authorized members can manage book pages" ON book_pages;
CREATE POLICY "Authorized members can manage book pages" ON book_pages
  FOR ALL USING (
    book_id IN (
      SELECT id FROM books 
      WHERE family_id = public.get_user_family_id()
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_members 
          WHERE user_id = auth.uid() 
          AND role IN ('admin', 'parent')
        )
      )
    )
  );

-- ============================================
-- BOOK_TRANSLATIONS - Inherit from books
-- ============================================

DROP POLICY IF EXISTS "Family members can view translations" ON book_translations;
CREATE POLICY "Family members can view translations" ON book_translations
  FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE family_id = public.get_user_family_id())
  );

DROP POLICY IF EXISTS "Family members can create translations" ON book_translations;
CREATE POLICY "Family members can create translations" ON book_translations
  FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE family_id = public.get_user_family_id())
  );

-- ============================================
-- STORY_MEMORY - Inherit from children
-- ============================================

DROP POLICY IF EXISTS "Family members can view story memory" ON story_memory;
CREATE POLICY "Family members can view story memory" ON story_memory
  FOR SELECT USING (
    child_id IN (SELECT id FROM children WHERE family_id = public.get_user_family_id())
  );

DROP POLICY IF EXISTS "System can manage story memory" ON story_memory;
CREATE POLICY "System can manage story memory" ON story_memory
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE family_id = public.get_user_family_id())
  );

-- ============================================
-- VOICE_PROFILES - Scoped to family
-- ============================================

DROP POLICY IF EXISTS "Family members can view voice profiles" ON voice_profiles;
CREATE POLICY "Family members can view voice profiles" ON voice_profiles
  FOR SELECT USING (family_id = public.get_user_family_id());

DROP POLICY IF EXISTS "Family members can manage voice profiles" ON voice_profiles;
CREATE POLICY "Family members can manage voice profiles" ON voice_profiles
  FOR ALL USING (family_id = public.get_user_family_id());

-- ============================================
-- NARRATIONS - Inherit from books
-- ============================================

DROP POLICY IF EXISTS "Family members can view narrations" ON narrations;
CREATE POLICY "Family members can view narrations" ON narrations
  FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE family_id = public.get_user_family_id())
  );

DROP POLICY IF EXISTS "Family members can manage narrations" ON narrations;
CREATE POLICY "Family members can manage narrations" ON narrations
  FOR ALL USING (
    book_id IN (SELECT id FROM books WHERE family_id = public.get_user_family_id())
  );

-- ============================================
-- SUBSCRIPTIONS - Scoped to family
-- ============================================

DROP POLICY IF EXISTS "Family members can view subscription" ON subscriptions;
CREATE POLICY "Family members can view subscription" ON subscriptions
  FOR SELECT USING (family_id = public.get_user_family_id());

DROP POLICY IF EXISTS "Only admins can manage subscription" ON subscriptions;
CREATE POLICY "Only admins can manage subscription" ON subscriptions
  FOR UPDATE USING (
    family_id = public.get_user_family_id()
    AND (
      public.user_has_role('admin')
      OR EXISTS (
        SELECT 1 FROM family_members 
        WHERE user_id = auth.uid() 
        AND can_manage_subscription = true
      )
    )
  );

-- ============================================
-- FAMILY_MEMBERS - Scoped to family
-- ============================================

DROP POLICY IF EXISTS "Family members can view members" ON family_members;
CREATE POLICY "Family members can view members" ON family_members
  FOR SELECT USING (family_id = public.get_user_family_id());

DROP POLICY IF EXISTS "Admins can manage members" ON family_members;
CREATE POLICY "Admins can manage members" ON family_members
  FOR ALL USING (
    family_id = public.get_user_family_id()
    AND public.user_has_role('admin')
  );

-- ============================================
-- FAMILY_PREFERENCES - Scoped to family
-- ============================================

DROP POLICY IF EXISTS "Family members can view preferences" ON family_preferences;
CREATE POLICY "Family members can view preferences" ON family_preferences
  FOR SELECT USING (family_id = public.get_user_family_id());

DROP POLICY IF EXISTS "Only parents/admins can update preferences" ON family_preferences;
CREATE POLICY "Only parents/admins can update preferences" ON family_preferences
  FOR UPDATE USING (
    family_id = public.get_user_family_id()
    AND public.user_can_modify_settings()
  );

-- ============================================
-- CHILD_CONTENT_PREFERENCES - Inherit from children
-- ============================================

DROP POLICY IF EXISTS "Family members can view child preferences" ON child_content_preferences;
CREATE POLICY "Family members can view child preferences" ON child_content_preferences
  FOR SELECT USING (
    child_id IN (SELECT id FROM children WHERE family_id = public.get_user_family_id())
  );

DROP POLICY IF EXISTS "Parents can manage child preferences" ON child_content_preferences;
CREATE POLICY "Parents can manage child preferences" ON child_content_preferences
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE family_id = public.get_user_family_id())
    AND public.user_can_modify_settings()
  );

-- ============================================
-- PARENTAL_CONTROL_AUDIT - Scoped to family (read-only)
-- ============================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON parental_control_audit;
CREATE POLICY "Admins can view audit logs" ON parental_control_audit
  FOR SELECT USING (
    family_id = public.get_user_family_id()
    AND public.user_has_role('admin')
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON parental_control_audit;
CREATE POLICY "System can insert audit logs" ON parental_control_audit
  FOR INSERT WITH CHECK (family_id = public.get_user_family_id());

-- ============================================
-- ONBOARDING_SESSIONS - Scoped to family
-- ============================================

DROP POLICY IF EXISTS "Users can access their onboarding sessions" ON onboarding_sessions;
CREATE POLICY "Users can access their onboarding sessions" ON onboarding_sessions
  FOR ALL USING (family_id = public.get_user_family_id());

-- ============================================
-- FAMILY_INVITES - Scoped to family
-- ============================================

DROP POLICY IF EXISTS "Family members can view invites" ON family_invites;
CREATE POLICY "Family members can view invites" ON family_invites
  FOR SELECT USING (family_id = public.get_user_family_id());

DROP POLICY IF EXISTS "Admins can manage invites" ON family_invites;
CREATE POLICY "Admins can manage invites" ON family_invites
  FOR ALL USING (
    family_id = public.get_user_family_id()
    AND (
      public.user_has_role('admin')
      OR EXISTS (
        SELECT 1 FROM family_members 
        WHERE user_id = auth.uid() 
        AND can_invite_members = true
      )
    )
  );

-- Invitees can view their own invites by token (for accepting)
DROP POLICY IF EXISTS "Invitees can view their invite" ON family_invites;
CREATE POLICY "Invitees can view their invite" ON family_invites
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND accepted_at IS NULL
    AND expires_at > NOW()
  );

-- ============================================
-- NOTIFICATIONS - User-scoped
-- ============================================

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- ============================================
-- SUMMARY
-- ============================================
-- 
-- Multi-Tenant Architecture:
-- - Single Supabase project
-- - family_id is the tenant boundary
-- - All data access filtered by family_id
-- - Nested tables (book_pages, narrations) inherit from parent
-- - Role-based permissions within families
-- - Storage uses family_id in path for RLS
--
-- Role Hierarchy:
-- - admin: Full access, can manage everything
-- - parent: Can manage content, children, settings
-- - caregiver: Can create books, limited child access
-- - viewer: Read-only access
-- - child: Read-only, age-appropriate content only
