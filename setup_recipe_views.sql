-- Add recipe_views table for tracking user search/view history
-- This enables dynamic recommendations based on user behavior

-- Create recipe_views table
CREATE TABLE IF NOT EXISTS public.recipe_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    view_type text DEFAULT 'view' CHECK (view_type IN ('view', 'search', 'favorite', 'cook')),
    search_term text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_id ON public.recipe_views(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_recipe_id ON public.recipe_views(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_viewed_at ON public.recipe_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_recipe ON public.recipe_views(user_id, recipe_id);

-- Enable Row Level Security
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

-- Create function to track recipe views
CREATE OR REPLACE FUNCTION public.track_recipe_view(
    recipe_id uuid,
    view_type text DEFAULT 'view',
    search_term text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.recipe_views (recipe_id, user_id, view_type, search_term)
    VALUES (recipe_id, auth.uid(), view_type, search_term)
    ON CONFLICT (user_id, recipe_id) 
    DO UPDATE SET 
        viewed_at = timezone('utc'::text, now()),
        view_type = EXCLUDED.view_type,
        search_term = COALESCE(EXCLUDED.search_term, recipe_views.search_term);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Recipe views table created successfully!' as status; 