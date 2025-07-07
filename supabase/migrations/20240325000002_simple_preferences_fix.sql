-- Simple Preferences and Settings Migration
-- This focuses on the essential tables needed for current functionality

-- 1. Create user_preferences_v2 table with specific columns
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

-- Create RLS policies for user_ai_preferences
CREATE POLICY "Users can view their own AI preferences" ON public.user_ai_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI preferences" ON public.user_ai_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI preferences" ON public.user_ai_preferences
    FOR UPDATE USING (auth.uid() = user_id);

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
CREATE TRIGGER handle_updated_at_user_preferences_v2
    BEFORE UPDATE ON public.user_preferences_v2
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_ai_preferences
    BEFORE UPDATE ON public.user_ai_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create simple function to initialize basic settings
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