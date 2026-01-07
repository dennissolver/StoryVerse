export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // ============================================
      // CORE TABLES
      // ============================================
      
      families: {
        Row: { 
          id: string; 
          name: string; 
          preferred_language: string; 
          created_at: string; 
          updated_at: string 
        };
        Insert: { 
          id?: string; 
          name: string; 
          preferred_language?: string; 
        };
        Update: { 
          name?: string; 
          preferred_language?: string; 
        };
      };
      
      user_profiles: {
        Row: { 
          id: string; 
          family_id: string | null; 
          email: string; 
          full_name: string | null; 
          avatar_url: string | null; 
          role: string; 
          created_at: string; 
          updated_at: string 
        };
        Insert: { 
          id: string; 
          family_id?: string | null; 
          email: string; 
          full_name?: string | null; 
          avatar_url?: string | null; 
          role?: string 
        };
        Update: { 
          family_id?: string | null; 
          full_name?: string | null; 
          avatar_url?: string | null; 
          role?: string 
        };
      };
      
      children: {
        Row: { 
          id: string; 
          family_id: string; 
          name: string; 
          date_of_birth: string | null; 
          gender: string | null; 
          photo_url: string | null; 
          interests: string[] | null; 
          reading_level: string | null; 
          favorite_color: string | null; 
          preferred_language: string; 
          created_at: string; 
          updated_at: string 
        };
        Insert: { 
          id?: string; 
          family_id: string; 
          name: string; 
          date_of_birth?: string | null; 
          gender?: string | null; 
          photo_url?: string | null; 
          interests?: string[] | null; 
          reading_level?: string | null; 
          favorite_color?: string | null; 
          preferred_language?: string 
        };
        Update: { 
          name?: string; 
          date_of_birth?: string | null; 
          gender?: string | null; 
          photo_url?: string | null; 
          interests?: string[] | null; 
          reading_level?: string | null; 
          favorite_color?: string | null; 
          preferred_language?: string 
        };
      };
      
      // ============================================
      // BOOKS & CONTENT
      // ============================================
      
      books: {
        Row: { 
          id: string; 
          family_id: string; 
          child_id: string; 
          title: string; 
          description: string | null; 
          theme: string | null; 
          illustration_style: string | null; 
          status: string; 
          cover_url: string | null; 
          page_count: number; 
          language: string; 
          created_by: string | null; 
          created_at: string; 
          updated_at: string 
        };
        Insert: { 
          id?: string; 
          family_id: string; 
          child_id: string; 
          title: string; 
          description?: string | null; 
          theme?: string | null; 
          illustration_style?: string | null; 
          status?: string; 
          cover_url?: string | null; 
          page_count?: number; 
          language?: string; 
          created_by?: string | null 
        };
        Update: { 
          title?: string; 
          description?: string | null; 
          theme?: string | null; 
          status?: string; 
          cover_url?: string | null; 
          page_count?: number; 
          language?: string 
        };
      };
      
      book_pages: {
        Row: { 
          id: string; 
          book_id: string; 
          page_number: number; 
          text_content: string | null; 
          image_url: string | null; 
          image_prompt: string | null; 
          layout: string; 
          created_at: string 
        };
        Insert: { 
          id?: string; 
          book_id: string; 
          page_number: number; 
          text_content?: string | null; 
          image_url?: string | null; 
          image_prompt?: string | null; 
          layout?: string 
        };
        Update: { 
          text_content?: string | null; 
          image_url?: string | null; 
          image_prompt?: string | null; 
          layout?: string 
        };
      };
      
      book_translations: {
        Row: { 
          id: string; 
          book_id: string; 
          language: string; 
          translated_pages: Json; 
          created_at: string; 
          updated_at: string 
        };
        Insert: { 
          id?: string; 
          book_id: string; 
          language: string; 
          translated_pages: Json 
        };
        Update: { 
          translated_pages?: Json 
        };
      };
      
      story_memory: {
        Row: { 
          id: string; 
          child_id: string; 
          characters: Json; 
          story_events: Json; 
          ongoing_arcs: Json;
          preferences: Json; 
          created_at: string; 
          updated_at: string 
        };
        Insert: { 
          id?: string; 
          child_id: string; 
          characters?: Json; 
          story_events?: Json; 
          ongoing_arcs?: Json;
          preferences?: Json 
        };
        Update: { 
          characters?: Json; 
          story_events?: Json; 
          ongoing_arcs?: Json;
          preferences?: Json 
        };
      };
      
      // ============================================
      // VOICE & AUDIO
      // ============================================
      
      voice_profiles: {
        Row: { 
          id: string; 
          family_id: string; 
          user_id: string | null; 
          name: string; 
          elevenlabs_voice_id: string | null; 
          sample_audio_url: string | null; 
          status: string; 
          is_default: boolean; 
          created_at: string 
        };
        Insert: { 
          id?: string; 
          family_id: string; 
          user_id?: string | null; 
          name: string; 
          elevenlabs_voice_id?: string | null; 
          sample_audio_url?: string | null; 
          status?: string; 
          is_default?: boolean 
        };
        Update: { 
          name?: string; 
          elevenlabs_voice_id?: string | null; 
          status?: string; 
          is_default?: boolean 
        };
      };
      
      narrations: {
        Row: {
          id: string;
          book_id: string;
          voice_profile_id: string;
          page_number: number;
          audio_url: string | null;
          duration_seconds: number | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          voice_profile_id: string;
          page_number: number;
          audio_url?: string | null;
          duration_seconds?: number | null;
          status?: string;
        };
        Update: {
          audio_url?: string | null;
          duration_seconds?: number | null;
          status?: string;
        };
      };
      
      // ============================================
      // FAMILY MANAGEMENT & PARENTAL CONTROLS
      // ============================================
      
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: string;
          relationship: string | null;
          can_create_books: boolean;
          can_modify_children: boolean;
          can_modify_settings: boolean;
          can_manage_subscription: boolean;
          can_invite_members: boolean;
          verified_adult: boolean;
          verified_at: string | null;
          status: string;
          invited_by: string | null;
          invited_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role?: string;
          relationship?: string | null;
          can_create_books?: boolean;
          can_modify_children?: boolean;
          can_modify_settings?: boolean;
          can_manage_subscription?: boolean;
          can_invite_members?: boolean;
          verified_adult?: boolean;
          status?: string;
          invited_by?: string | null;
        };
        Update: {
          role?: string;
          relationship?: string | null;
          can_create_books?: boolean;
          can_modify_children?: boolean;
          can_modify_settings?: boolean;
          can_manage_subscription?: boolean;
          can_invite_members?: boolean;
          verified_adult?: boolean;
          verified_at?: string | null;
          status?: string;
        };
      };
      
      family_preferences: {
        Row: {
          id: string;
          family_id: string;
          settings_pin_hash: string | null;
          pin_attempts: number;
          pin_locked_until: string | null;
          cultural_background: string[] | null;
          religious_tradition: string | null;
          religious_observance_level: string | null;
          dietary_preferences: string[] | null;
          celebrate_religious_holidays: boolean;
          celebrate_secular_holidays: boolean;
          specific_holidays: string[] | null;
          excluded_holidays: string[] | null;
          allow_magic_fantasy: boolean;
          allow_mythology: string | null;
          allow_talking_animals: boolean;
          allow_supernatural_elements: boolean;
          family_structure: string | null;
          custom_family_notes: string | null;
          gender_representation: string | null;
          conflict_level: string | null;
          allow_mild_peril: boolean;
          include_educational_content: boolean;
          educational_focus: string[] | null;
          modesty_level: string | null;
          allow_music_themes: boolean;
          allow_dance_themes: boolean;
          excluded_themes: string[] | null;
          excluded_elements: string[] | null;
          custom_guidelines: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
        };
        Update: {
          cultural_background?: string[] | null;
          religious_tradition?: string | null;
          religious_observance_level?: string | null;
          dietary_preferences?: string[] | null;
          celebrate_religious_holidays?: boolean;
          celebrate_secular_holidays?: boolean;
          specific_holidays?: string[] | null;
          excluded_holidays?: string[] | null;
          allow_magic_fantasy?: boolean;
          allow_mythology?: string | null;
          allow_talking_animals?: boolean;
          allow_supernatural_elements?: boolean;
          family_structure?: string | null;
          custom_family_notes?: string | null;
          gender_representation?: string | null;
          conflict_level?: string | null;
          allow_mild_peril?: boolean;
          include_educational_content?: boolean;
          educational_focus?: string[] | null;
          modesty_level?: string | null;
          allow_music_themes?: boolean;
          allow_dance_themes?: boolean;
          excluded_themes?: string[] | null;
          excluded_elements?: string[] | null;
          custom_guidelines?: string | null;
        };
      };
      
      child_content_preferences: {
        Row: {
          id: string;
          child_id: string;
          use_family_defaults: boolean;
          allow_magic_fantasy: boolean;
          allow_scary_elements: boolean;
          conflict_level: string | null;
          avoid_themes: string[] | null;
          favorite_themes: string[] | null;
          needs_simple_language: boolean;
          needs_high_contrast_images: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
        };
        Update: {
          use_family_defaults?: boolean;
          allow_magic_fantasy?: boolean;
          allow_scary_elements?: boolean;
          conflict_level?: string | null;
          avoid_themes?: string[] | null;
          favorite_themes?: string[] | null;
          needs_simple_language?: boolean;
          needs_high_contrast_images?: boolean;
        };
      };
      
      parental_control_audit: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          action: string;
          details: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          action: string;
          details?: Json | null;
          ip_address?: string | null;
        };
        Update: never;
      };
      
      // ============================================
      // ONBOARDING
      // ============================================
      
      onboarding_sessions: {
        Row: {
          id: string;
          family_id: string;
          state: string;
          language: string;
          guardian_verified: boolean;
          guardian_relationship: string | null;
          guardian_name: string | null;
          family_name: string | null;
          family_structure: string | null;
          children: Json;
          cultural_background: string[] | null;
          cultural_notes: string | null;
          religious_tradition: string | null;
          observance_level: string | null;
          religious_notes: string | null;
          family_values: string[] | null;
          educational_goals: string[] | null;
          character_traits_to_encourage: string[] | null;
          topics_to_explore: string[] | null;
          topics_to_avoid: string[] | null;
          discovered_preferences: Json;
          conversation_history: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          state?: string;
          language?: string;
        };
        Update: {
          state?: string;
          guardian_verified?: boolean;
          guardian_relationship?: string | null;
          guardian_name?: string | null;
          family_name?: string | null;
          family_structure?: string | null;
          children?: Json;
          cultural_background?: string[] | null;
          cultural_notes?: string | null;
          religious_tradition?: string | null;
          observance_level?: string | null;
          religious_notes?: string | null;
          family_values?: string[] | null;
          educational_goals?: string[] | null;
          character_traits_to_encourage?: string[] | null;
          topics_to_explore?: string[] | null;
          topics_to_avoid?: string[] | null;
          discovered_preferences?: Json;
          conversation_history?: Json;
        };
      };
      
      // ============================================
      // SUBSCRIPTIONS & BILLING
      // ============================================
      
      subscriptions: {
        Row: { 
          id: string; 
          family_id: string; 
          stripe_customer_id: string | null; 
          stripe_subscription_id: string | null; 
          tier: string; 
          status: string; 
          current_period_end: string | null; 
          books_this_month: number; 
          created_at: string; 
          updated_at: string 
        };
        Insert: { 
          id?: string; 
          family_id: string; 
        };
        Update: { 
          stripe_customer_id?: string | null; 
          stripe_subscription_id?: string | null; 
          tier?: string; 
          status?: string; 
          current_period_end?: string | null; 
          books_this_month?: number 
        };
      };
      
      // ============================================
      // INVITATIONS & NOTIFICATIONS
      // ============================================
      
      family_invites: {
        Row: {
          id: string;
          family_id: string;
          email: string;
          role: string;
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          email: string;
          role: string;
          token: string;
          invited_by: string;
          expires_at: string;
        };
        Update: {
          accepted_at?: string | null;
        };
      };
      
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          data?: Json | null;
        };
        Update: {
          read?: boolean;
        };
      };
    };
  };
}

// ============================================
// TYPE HELPERS
// ============================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Core entities
export type Family = Tables<'families'>;
export type UserProfile = Tables<'user_profiles'>;
export type Child = Tables<'children'>;

// Books & Content
export type Book = Tables<'books'>;
export type BookPage = Tables<'book_pages'>;
export type BookTranslation = Tables<'book_translations'>;
export type StoryMemory = Tables<'story_memory'>;

// Voice & Audio
export type VoiceProfile = Tables<'voice_profiles'>;
export type Narration = Tables<'narrations'>;

// Family Management
export type FamilyMember = Tables<'family_members'>;
export type FamilyPreferences = Tables<'family_preferences'>;
export type ChildContentPreferences = Tables<'child_content_preferences'>;
export type ParentalControlAudit = Tables<'parental_control_audit'>;

// Onboarding
export type OnboardingSessionRow = Tables<'onboarding_sessions'>;

// Billing
export type Subscription = Tables<'subscriptions'>;

// Invitations
export type FamilyInvite = Tables<'family_invites'>;
export type Notification = Tables<'notifications'>;

// Gift Subscriptions
export interface GiftCode {
  id: string;
  code: string;
  tier: string;
  duration_months: number;
  purchased_by: string | null;
  purchaser_email: string;
  purchaser_name: string | null;
  stripe_payment_intent_id: string | null;
  amount_paid: number;
  currency: string;
  recipient_name: string | null;
  recipient_email: string | null;
  gift_message: string | null;
  occasion: string | null;
  send_to_recipient: boolean;
  send_date: string | null;
  gift_card_template: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  redeemed_family_id: string | null;
  subscription_id: string | null;
  status: 'active' | 'redeemed' | 'expired' | 'refunded';
  expires_at: string;
  created_at: string;
  updated_at: string;
}
