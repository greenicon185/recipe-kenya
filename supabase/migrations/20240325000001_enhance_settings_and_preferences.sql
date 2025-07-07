-- Enhance Settings and Preferences System
-- This migration adds proper tables for user preferences, system settings, and user settings

-- 1. Create a new user_preferences table with specific columns for better performance
CREATE TABLE IF NOT EXISTS public.user_preferences_v2 (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dietary_restrictions text[] DEFAULT '{}',
    favorite_cuisines text[] DEFAULT '{}',
    cooking_skill_level text CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced')),
    preferred_meal_types text[] DEFAULT '{}',
    allergies text[] DEFAULT '{}',
    cooking_time_preference text CHECK (cooking_time_preference IN ('quick', 'medium', 'lengthy')),
    spice_tolerance text CHECK (spice_tolerance IN ('mild', 'medium', 'hot', 'very_hot')),
    serving_size_preference text CHECK (serving_size_preference IN ('small', 'medium', 'large')),
    budget_preference text CHECK (budget_preference IN ('budget', 'moderate', 'premium')),
    equipment_available text[] DEFAULT '{}',
    dietary_goals text[] DEFAULT '{}',
    health_conditions text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 2. Create user_settings table for user-specific application settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language text DEFAULT 'en' CHECK (language IN ('en', 'sw', 'fr', 'es')),
    notifications_enabled boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    newsletter_subscription boolean DEFAULT false,
    privacy_level text DEFAULT 'public' CHECK (privacy_level IN ('private', 'friends', 'public')),
    auto_save_meal_plans boolean DEFAULT true,
    show_nutritional_info boolean DEFAULT true,
    show_cooking_tips boolean DEFAULT true,
    default_servings integer DEFAULT 4,
    measurement_system text DEFAULT 'metric' CHECK (measurement_system IN ('metric', 'imperial')),
    timezone text DEFAULT 'UTC',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 3. Create user_dietary_profile table for detailed dietary information
CREATE TABLE IF NOT EXISTS public.user_dietary_profile (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    height_cm numeric,
    weight_kg numeric,
    age integer,
    gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    activity_level text CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    weight_goal text CHECK (weight_goal IN ('lose', 'maintain', 'gain')),
    target_calories integer,
    target_protein_g integer,
    target_carbs_g integer,
    target_fat_g integer,
    medical_conditions text[] DEFAULT '{}',
    medications text[] DEFAULT '{}',
    supplements text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 4. Create user_cooking_profile table for cooking-related preferences
CREATE TABLE IF NOT EXISTS public.user_cooking_profile (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cooking_experience_years integer DEFAULT 0,
    kitchen_size text CHECK (kitchen_size IN ('small', 'medium', 'large')),
    available_equipment text[] DEFAULT '{}',
    cooking_frequency text CHECK (cooking_frequency IN ('daily', 'few_times_week', 'weekly', 'occasionally', 'rarely')),
    preferred_cooking_methods text[] DEFAULT '{}',
    time_available_weekdays integer DEFAULT 30, -- minutes
    time_available_weekends integer DEFAULT 60, -- minutes
    batch_cooking_preference boolean DEFAULT false,
    meal_prep_preference boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 5. Create user_social_preferences table for social features
CREATE TABLE IF NOT EXISTS public.user_social_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    share_recipes boolean DEFAULT true,
    share_meal_plans boolean DEFAULT false,
    share_reviews boolean DEFAULT true,
    allow_followers boolean DEFAULT true,
    show_profile_to_public boolean DEFAULT true,
    receive_follow_requests boolean DEFAULT true,
    notification_frequency text DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly', 'never')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 6. Create user_ai_preferences table for AI recommendation settings
CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ai_recommendations_enabled boolean DEFAULT true,
    recommendation_frequency text DEFAULT 'daily' CHECK (recommendation_frequency IN ('daily', 'weekly', 'monthly', 'never')),
    include_new_recipes boolean DEFAULT true,
    include_popular_recipes boolean DEFAULT true,
    include_seasonal_recipes boolean DEFAULT true,
    include_healthy_recipes boolean DEFAULT true,
    include_quick_recipes boolean DEFAULT true,
    max_recommendations_per_day integer DEFAULT 10,
    learning_rate numeric DEFAULT 0.1, -- How quickly AI learns from user behavior
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 7. Create user_notification_preferences table for detailed notification settings
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    new_recipes boolean DEFAULT true,
    recipe_recommendations boolean DEFAULT true,
    meal_plan_reminders boolean DEFAULT true,
    shopping_list_reminders boolean DEFAULT true,
    social_interactions boolean DEFAULT true,
    system_updates boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    weekly_digest boolean DEFAULT true,
    monthly_report boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 8. Create user_privacy_settings table for privacy controls
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('private', 'friends', 'public')),
    recipe_visibility text DEFAULT 'public' CHECK (recipe_visibility IN ('private', 'friends', 'public')),
    review_visibility text DEFAULT 'public' CHECK (review_visibility IN ('private', 'friends', 'public')),
    meal_plan_visibility text DEFAULT 'private' CHECK (meal_plan_visibility IN ('private', 'friends', 'public')),
    shopping_list_visibility text DEFAULT 'private' CHECK (shopping_list_visibility IN ('private', 'friends', 'public')),
    allow_data_analytics boolean DEFAULT true,
    allow_personalization boolean DEFAULT true,
    allow_third_party_tracking boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 9. Create user_accessibility_settings table for accessibility features
CREATE TABLE IF NOT EXISTS public.user_accessibility_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra_large')),
    high_contrast boolean DEFAULT false,
    screen_reader_friendly boolean DEFAULT false,
    reduce_motion boolean DEFAULT false,
    auto_play_videos boolean DEFAULT true,
    show_alt_text boolean DEFAULT true,
    keyboard_navigation boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 10. Create user_integration_settings table for third-party integrations
CREATE TABLE IF NOT EXISTS public.user_integration_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    google_calendar_sync boolean DEFAULT false,
    apple_health_sync boolean DEFAULT false,
    fitbit_sync boolean DEFAULT false,
    myfitnesspal_sync boolean DEFAULT false,
    instacart_integration boolean DEFAULT false,
    uber_eats_integration boolean DEFAULT false,
    pinterest_sync boolean DEFAULT false,
    instagram_sync boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.user_preferences_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dietary_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cooking_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accessibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integration_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences_v2
CREATE POLICY "Users can view their own preferences" ON public.user_preferences_v2
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences_v2
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences_v2
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences_v2
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_dietary_profile
CREATE POLICY "Users can view their own dietary profile" ON public.user_dietary_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dietary profile" ON public.user_dietary_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dietary profile" ON public.user_dietary_profile
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dietary profile" ON public.user_dietary_profile
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_cooking_profile
CREATE POLICY "Users can view their own cooking profile" ON public.user_cooking_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cooking profile" ON public.user_cooking_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cooking profile" ON public.user_cooking_profile
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cooking profile" ON public.user_cooking_profile
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_social_preferences
CREATE POLICY "Users can view their own social preferences" ON public.user_social_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social preferences" ON public.user_social_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social preferences" ON public.user_social_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social preferences" ON public.user_social_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_ai_preferences
CREATE POLICY "Users can view their own AI preferences" ON public.user_ai_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI preferences" ON public.user_ai_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI preferences" ON public.user_ai_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI preferences" ON public.user_ai_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON public.user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON public.user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON public.user_notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" ON public.user_notification_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_privacy_settings
CREATE POLICY "Users can view their own privacy settings" ON public.user_privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings" ON public.user_privacy_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" ON public.user_privacy_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own privacy settings" ON public.user_privacy_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_accessibility_settings
CREATE POLICY "Users can view their own accessibility settings" ON public.user_accessibility_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accessibility settings" ON public.user_accessibility_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accessibility settings" ON public.user_accessibility_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accessibility settings" ON public.user_accessibility_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_integration_settings
CREATE POLICY "Users can view their own integration settings" ON public.user_integration_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration settings" ON public.user_integration_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration settings" ON public.user_integration_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integration settings" ON public.user_integration_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all new tables
CREATE TRIGGER handle_updated_at_user_preferences_v2
    BEFORE UPDATE ON public.user_preferences_v2
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_dietary_profile
    BEFORE UPDATE ON public.user_dietary_profile
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_cooking_profile
    BEFORE UPDATE ON public.user_cooking_profile
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_social_preferences
    BEFORE UPDATE ON public.user_social_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_ai_preferences
    BEFORE UPDATE ON public.user_ai_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_notification_preferences
    BEFORE UPDATE ON public.user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_privacy_settings
    BEFORE UPDATE ON public.user_privacy_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_accessibility_settings
    BEFORE UPDATE ON public.user_accessibility_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_integration_settings
    BEFORE UPDATE ON public.user_integration_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create functions to manage user preferences
CREATE OR REPLACE FUNCTION public.get_user_preferences_complete(user_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'preferences', COALESCE((SELECT row_to_json(p) FROM public.user_preferences_v2 p WHERE p.user_id = $1), '{}'::jsonb),
        'settings', COALESCE((SELECT row_to_json(s) FROM public.user_settings s WHERE s.user_id = $1), '{}'::jsonb),
        'dietary_profile', COALESCE((SELECT row_to_json(d) FROM public.user_dietary_profile d WHERE d.user_id = $1), '{}'::jsonb),
        'cooking_profile', COALESCE((SELECT row_to_json(c) FROM public.user_cooking_profile c WHERE c.user_id = $1), '{}'::jsonb),
        'social_preferences', COALESCE((SELECT row_to_json(sp) FROM public.user_social_preferences sp WHERE sp.user_id = $1), '{}'::jsonb),
        'ai_preferences', COALESCE((SELECT row_to_json(ap) FROM public.user_ai_preferences ap WHERE ap.user_id = $1), '{}'::jsonb),
        'notification_preferences', COALESCE((SELECT row_to_json(np) FROM public.user_notification_preferences np WHERE np.user_id = $1), '{}'::jsonb),
        'privacy_settings', COALESCE((SELECT row_to_json(ps) FROM public.user_privacy_settings ps WHERE ps.user_id = $1), '{}'::jsonb),
        'accessibility_settings', COALESCE((SELECT row_to_json(acs) FROM public.user_accessibility_settings acs WHERE acs.user_id = $1), '{}'::jsonb),
        'integration_settings', COALESCE((SELECT row_to_json(uis) FROM public.user_integration_settings uis WHERE uis.user_id = $1), '{}'::jsonb)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to initialize default settings for new users
CREATE OR REPLACE FUNCTION public.initialize_user_settings(user_id uuid)
RETURNS void AS $$
BEGIN
    -- Insert default user preferences
    INSERT INTO public.user_preferences_v2 (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default AI preferences
    INSERT INTO public.user_ai_preferences (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default notification preferences
    INSERT INTO public.user_notification_preferences (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default privacy settings
    INSERT INTO public.user_privacy_settings (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default accessibility settings
    INSERT INTO public.user_accessibility_settings (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default integration settings
    INSERT INTO public.user_integration_settings (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically initialize settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.initialize_user_settings(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 