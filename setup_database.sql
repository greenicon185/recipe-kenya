-- Database Setup Script for Recipe Haven
-- Run this script in your Supabase SQL editor to create the required tables

-- 1. Create user_preferences_v2 table
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

-- 2. Create user_settings table
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

-- 3. Create user_ai_preferences table
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
    learning_rate numeric DEFAULT 0.1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences_v2
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences_v2;
CREATE POLICY "Users can view their own preferences" ON public.user_preferences_v2
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences_v2;
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences_v2
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences_v2;
CREATE POLICY "Users can update their own preferences" ON public.user_preferences_v2
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences_v2;
CREATE POLICY "Users can delete their own preferences" ON public.user_preferences_v2
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_ai_preferences
DROP POLICY IF EXISTS "Users can view their own AI preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can view their own AI preferences" ON public.user_ai_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can insert their own AI preferences" ON public.user_ai_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own AI preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can update their own AI preferences" ON public.user_ai_preferences
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own AI preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can delete their own AI preferences" ON public.user_ai_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create or replace the handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_updated_at_user_preferences_v2 ON public.user_preferences_v2;
CREATE TRIGGER handle_updated_at_user_preferences_v2
    BEFORE UPDATE ON public.user_preferences_v2
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER handle_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_user_ai_preferences ON public.user_ai_preferences;
CREATE TRIGGER handle_updated_at_user_ai_preferences
    BEFORE UPDATE ON public.user_ai_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to initialize basic settings
CREATE OR REPLACE FUNCTION public.initialize_basic_user_settings(user_id uuid)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create recipe_views table for tracking user activity
CREATE TABLE IF NOT EXISTS public.recipe_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    view_type text DEFAULT 'view' CHECK (view_type IN ('view', 'search', 'favorite', 'cook')),
    search_term text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_recipe ON public.recipe_views(user_id, recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_time ON public.recipe_views(user_id, viewed_at DESC);

-- Enable RLS for recipe_views
ALTER TABLE public.recipe_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recipe_views
DROP POLICY IF EXISTS "Users can view their own recipe views" ON public.recipe_views;
CREATE POLICY "Users can view their own recipe views" ON public.recipe_views
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recipe views" ON public.recipe_views;
CREATE POLICY "Users can insert their own recipe views" ON public.recipe_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recipe views" ON public.recipe_views;
CREATE POLICY "Users can update their own recipe views" ON public.recipe_views
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recipe views" ON public.recipe_views;
CREATE POLICY "Users can delete their own recipe views" ON public.recipe_views
    FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Database tables created successfully!' as status; 