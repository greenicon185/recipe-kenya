-- Enhanced recommendation system tables and fixes

-- Fix RLS policy for recipe_interactions table
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.recipe_interactions;
CREATE POLICY "Users can insert their own interactions"
ON public.recipe_interactions
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add missing user_id column to recipe_interactions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'recipe_interactions' AND column_name = 'user_id') THEN
        ALTER TABLE public.recipe_interactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create enhanced user preference tracking
CREATE TABLE IF NOT EXISTS public.user_recipe_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL, -- 'view', 'like', 'cook', 'rate', 'save', 'skip', 'share'
    interaction_strength FLOAT DEFAULT 1.0, -- 0-1 score for AI learning
    session_context JSONB DEFAULT '{}', -- time_of_day, device, duration, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, recipe_id, interaction_type, created_at)
);

-- Create meal plan feedback table
CREATE TABLE IF NOT EXISTS public.meal_plan_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES public.weekly_meal_plans(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    completion_rate FLOAT DEFAULT 1.0, -- how much was actually cooked (0-1)
    feedback_text TEXT,
    feedback_tags TEXT[], -- 'too_spicy', 'too_time_consuming', 'loved_it', etc.
    would_recommend BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Recipe embeddings for AI similarity
CREATE TABLE IF NOT EXISTS public.recipe_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    embedding_vector FLOAT[] NOT NULL, -- Hugging Face embedding
    embedding_model TEXT DEFAULT 'sentence-transformers/all-MiniLM-L6-v2',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(recipe_id)
);

-- User taste profiles from AI analysis
CREATE TABLE IF NOT EXISTS public.user_taste_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_vector FLOAT[] NOT NULL, -- AI-learned preference vector
    confidence_score FLOAT DEFAULT 0.5, -- how confident we are in this profile
    dominant_cuisines TEXT[], -- top preferred cuisines
    preferred_ingredients TEXT[], -- commonly liked ingredients
    avoided_patterns TEXT[], -- patterns to avoid
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Contextual recommendation factors
CREATE TABLE IF NOT EXISTS public.contextual_factors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    factor_type TEXT NOT NULL, -- 'seasonal', 'weather', 'trending', 'time_of_day'
    factor_key TEXT NOT NULL, -- 'summer', 'rainy', 'weekend_dinner', etc.
    boost_recipes UUID[], -- recipe IDs to boost
    boost_ingredients TEXT[], -- ingredients to favor
    boost_cuisines TEXT[], -- cuisines to favor
    multiplier FLOAT DEFAULT 1.2, -- how much to boost (>1 = boost, <1 = reduce)
    active_from TIMESTAMP WITH TIME ZONE,
    active_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Recipe similarity matrix for collaborative filtering
CREATE TABLE IF NOT EXISTS public.recipe_similarity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_a_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    recipe_b_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL, -- 0-1, calculated by AI
    similarity_type TEXT DEFAULT 'ingredient_based', -- 'ingredient_based', 'taste_profile', 'user_behavior'
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(recipe_a_id, recipe_b_id, similarity_type)
);

-- Enhanced meal planning constraints
CREATE TABLE IF NOT EXISTS public.meal_planning_constraints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    constraint_type TEXT NOT NULL, -- 'max_prep_time', 'cuisine_rotation', 'ingredient_blacklist'
    constraint_value JSONB NOT NULL, -- flexible constraint definition
    priority INTEGER DEFAULT 5, -- 1-10, higher = more important
    is_hard_constraint BOOLEAN DEFAULT false, -- true = must satisfy, false = optimize for
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Weekly nutrition targets for meal planning
CREATE TABLE IF NOT EXISTS public.user_nutrition_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_calories INTEGER,
    daily_protein FLOAT,
    daily_carbs FLOAT,
    daily_fat FLOAT,
    daily_fiber FLOAT,
    meal_distribution JSONB DEFAULT '{"breakfast": 0.25, "lunch": 0.35, "dinner": 0.30, "snacks": 0.10}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_recipe_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_taste_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contextual_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_similarity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_planning_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nutrition_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_recipe_interactions
CREATE POLICY "Users can view their own interactions" ON public.user_recipe_interactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON public.user_recipe_interactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON public.user_recipe_interactions
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for meal_plan_feedback
CREATE POLICY "Users can manage their own feedback" ON public.meal_plan_feedback
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for recipe_embeddings (readable by all authenticated users)
CREATE POLICY "Recipe embeddings are readable by authenticated users" ON public.recipe_embeddings
FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for user_taste_profiles
CREATE POLICY "Users can manage their own taste profiles" ON public.user_taste_profiles
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for contextual_factors (readable by all)
CREATE POLICY "Contextual factors are readable by authenticated users" ON public.contextual_factors
FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for recipe_similarity (readable by all)
CREATE POLICY "Recipe similarity is readable by authenticated users" ON public.recipe_similarity
FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for meal_planning_constraints
CREATE POLICY "Users can manage their own planning constraints" ON public.meal_planning_constraints
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_nutrition_targets
CREATE POLICY "Users can manage their own nutrition targets" ON public.user_nutrition_targets
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_recipe_interactions_user_id ON public.user_recipe_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_interactions_recipe_id ON public.user_recipe_interactions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_interactions_type ON public.user_recipe_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_recipe_embeddings_recipe_id ON public.recipe_embeddings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_similarity_scores ON public.recipe_similarity(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_contextual_factors_active ON public.contextual_factors(is_active, factor_type);

-- Function to update taste profile based on interactions
CREATE OR REPLACE FUNCTION public.update_user_taste_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- This will be called by the AI service to update taste profiles
    -- For now, just update the timestamp
    UPDATE public.user_taste_profiles 
    SET last_updated = now() 
    WHERE user_id = NEW.user_id;
    
    -- If no profile exists, we'll let the AI service create it
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update taste profiles when interactions happen
DROP TRIGGER IF EXISTS trigger_update_taste_profile ON public.user_recipe_interactions;
CREATE TRIGGER trigger_update_taste_profile
    AFTER INSERT ON public.user_recipe_interactions
    FOR EACH ROW EXECUTE FUNCTION public.update_user_taste_profile();

-- Function to get recipe recommendations for a user
CREATE OR REPLACE FUNCTION public.get_user_recommendations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    recipe_id UUID,
    recommendation_score FLOAT,
    recommendation_reason TEXT
) AS $$
BEGIN
    -- This is a placeholder - the actual ML logic will be in the Edge Function
    -- For now, return recent recipes that user hasn't interacted with much
    RETURN QUERY
    SELECT 
        r.id as recipe_id,
        1.0 - (EXTRACT(epoch FROM (now() - r.created_at)) / 86400.0 / 30.0) as recommendation_score,
        'Recent recipe' as recommendation_reason
    FROM public.recipes r
    LEFT JOIN public.user_recipe_interactions uri ON r.id = uri.recipe_id AND uri.user_id = p_user_id
    WHERE r.is_published = true
    GROUP BY r.id, r.created_at
    ORDER BY recommendation_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;