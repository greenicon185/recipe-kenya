-- Fix all RLS issues by enabling RLS and creating policies for tables that need them

-- Enable RLS for tables that have policies but RLS is disabled
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_list_items
CREATE POLICY "Users can manage their own shopping list items"
ON public.shopping_list_items
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.shopping_lists 
        WHERE id = shopping_list_items.shopping_list_id 
        AND user_id = auth.uid()
    )
);

-- Create RLS policies for meal_plan_recipes
CREATE POLICY "Users can manage their own meal plan recipes"
ON public.meal_plan_recipes
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.meal_plans 
        WHERE id = meal_plan_recipes.meal_plan_id 
        AND user_id = auth.uid()
    )
);

-- Create RLS policies for recipe_ingredients (public read, admin write)
CREATE POLICY "Anyone can view recipe ingredients"
ON public.recipe_ingredients
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage recipe ingredients"
ON public.recipe_ingredients
FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin');

-- Create RLS policies for ingredients (public read, admin write)
CREATE POLICY "Anyone can view ingredients"
ON public.ingredients
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage ingredients"
ON public.ingredients
FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin');

-- Create RLS policies for admin_analytics (admin only)
CREATE POLICY "Admins can manage analytics"
ON public.admin_analytics
FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin');

-- Fix function search paths by updating functions to have secure search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_basic_user_settings(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN (
        SELECT role
        FROM public.admins
        WHERE id = user_id
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.hash_password(password_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Use pgcrypto's crypt function with a random salt
  RETURN crypt(password_text, gen_salt('bf'));
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_email()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN 'macloydmeliproject@gmail.com';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN '@Meli2025';
END;
$function$;

CREATE OR REPLACE FUNCTION public.health_check()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_admin_password(p_email text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    stored_hash TEXT;
BEGIN
    -- Get the stored password hash
    SELECT password_hash INTO stored_hash
    FROM public.admins
    WHERE email = p_email;

    -- If no admin found with this email
    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Compare the provided password with the stored hash
    RETURN stored_hash = crypt(p_password, stored_hash);
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_recipe_view(recipe_id uuid, view_type text DEFAULT 'view'::text, search_term text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.recipe_views (recipe_id, user_id, view_type, search_term)
    VALUES (recipe_id, auth.uid(), view_type, search_term)
    ON CONFLICT (user_id, recipe_id) 
    DO UPDATE SET 
        viewed_at = timezone('utc'::text, now()),
        view_type = EXCLUDED.view_type,
        search_term = COALESCE(EXCLUDED.search_term, recipe_views.search_term);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_taste_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- This will be called by the AI service to update taste profiles
    -- For now, just update the timestamp
    UPDATE public.user_taste_profiles 
    SET last_updated = now() 
    WHERE user_id = NEW.user_id;
    
    -- If no profile exists, we'll let the AI service create it
    RETURN NEW;
END;
$function$;