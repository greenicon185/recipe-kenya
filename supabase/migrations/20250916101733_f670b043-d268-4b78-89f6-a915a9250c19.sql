-- Fix recipe-cuisine relationship and add comprehensive enhancements

-- First, fix the foreign key relationship between recipes and cuisines
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_cuisine_id_fkey;
ALTER TABLE recipes ADD CONSTRAINT recipes_cuisine_id_fkey 
  FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) ON DELETE SET NULL;

-- Add sample data to ensure recipes can be displayed
INSERT INTO cuisines (id, name, description, origin_country, is_kenyan_local, image_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Italian', 'Rich flavors from Italy', 'Italy', false, 'https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=400'),
  ('22222222-2222-2222-2222-222222222222', 'Kenyan', 'Traditional Kenyan dishes', 'Kenya', true, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'),
  ('33333333-3333-3333-3333-333333333333', 'Asian', 'Diverse Asian flavors', 'Asia', false, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  origin_country = EXCLUDED.origin_country,
  is_kenyan_local = EXCLUDED.is_kenyan_local,
  image_url = EXCLUDED.image_url;

-- Add sample recipe categories
INSERT INTO recipe_categories (id, name, description, icon) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Main Course', 'Hearty main dishes', '🍽️'),
  ('55555555-5555-5555-5555-555555555555', 'Dessert', 'Sweet treats', '🍰'),
  ('66666666-6666-6666-6666-666666666666', 'Appetizer', 'Start your meal right', '🥗')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- Add comprehensive sample recipes
INSERT INTO recipes (
  id, title, description, image_url, cuisine_id, category_id, 
  difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes, 
  servings, ingredients, instructions, nutritional_info, 
  dietary_restrictions, is_featured, is_published, created_by
) VALUES
  (
    '77777777-7777-7777-7777-777777777777',
    'AI-Enhanced Pasta Carbonara',
    'A futuristic take on classic carbonara with precision cooking techniques',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'medium',
    15, 20, 35, 4,
    ARRAY['400g spaghetti', '200g pancetta', '4 eggs', '100g parmesan', 'black pepper'],
    '{"steps": [{"step": 1, "instruction": "Boil pasta in salted water"}, {"step": 2, "instruction": "Cook pancetta until crispy"}, {"step": 3, "instruction": "Mix eggs and cheese"}, {"step": 4, "instruction": "Combine everything with pasta"}]}',
    '{"calories": 580, "protein": 25, "carbs": 65, "fat": 22, "fiber": 3}',
    ARRAY['gluten'],
    true, true, null
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'Kenyan Ugali with AR Cooking Guide',
    'Traditional Kenyan staple enhanced with augmented reality cooking assistance',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444',
    'easy',
    5, 15, 20, 6,
    ARRAY['2 cups maize flour', '3 cups water', '1 tsp salt'],
    '{"steps": [{"step": 1, "instruction": "Boil water with salt"}, {"step": 2, "instruction": "Gradually add maize flour while stirring"}, {"step": 3, "instruction": "Cook for 10-15 minutes stirring constantly"}, {"step": 4, "instruction": "Serve hot with your favorite stew"}]}',
    '{"calories": 220, "protein": 6, "carbs": 46, "fat": 1, "fiber": 4}',
    ARRAY['gluten-free', 'vegan'],
    true, true, null
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    '3D Printed Chocolate Dessert',
    'Futuristic dessert created with precision 3D printing technology',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    '33333333-3333-3333-3333-333333333333',
    '55555555-5555-5555-5555-555555555555',
    'hard',
    30, 60, 90, 8,
    ARRAY['300g dark chocolate', '200ml cream', '50g butter', '2 eggs', 'gold leaf'],
    '{"steps": [{"step": 1, "instruction": "Melt chocolate using precision temperature control"}, {"step": 2, "instruction": "Prepare 3D printing mixture"}, {"step": 3, "instruction": "Print dessert using food-grade 3D printer"}, {"step": 4, "instruction": "Add finishing touches with gold leaf"}]}',
    '{"calories": 420, "protein": 8, "carbs": 35, "fat": 28, "fiber": 5}',
    ARRAY['vegetarian'],
    true, true, null
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  cuisine_id = EXCLUDED.cuisine_id,
  category_id = EXCLUDED.category_id,
  difficulty = EXCLUDED.difficulty,
  prep_time_minutes = EXCLUDED.prep_time_minutes,
  cook_time_minutes = EXCLUDED.cook_time_minutes,
  total_time_minutes = EXCLUDED.total_time_minutes,
  servings = EXCLUDED.servings,
  ingredients = EXCLUDED.ingredients,
  instructions = EXCLUDED.instructions,
  nutritional_info = EXCLUDED.nutritional_info,
  dietary_restrictions = EXCLUDED.dietary_restrictions,
  is_featured = EXCLUDED.is_featured,
  is_published = EXCLUDED.is_published;

-- Create advanced 3D recipe visualization table
CREATE TABLE IF NOT EXISTS recipe_3d_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  model_url TEXT,
  model_type TEXT DEFAULT '3d_scene' CHECK (model_type IN ('3d_scene', 'ar_model', 'vr_experience')),
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE recipe_3d_models ENABLE ROW LEVEL SECURITY;

-- Create policies for 3D models
CREATE POLICY "3D models are viewable by everyone" 
ON recipe_3d_models FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage 3D models" 
ON recipe_3d_models FOR ALL 
USING (get_user_role(auth.uid()) = 'super_admin');

-- Create smart kitchen integration table
CREATE TABLE IF NOT EXISTS smart_kitchen_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('oven', 'stove', 'refrigerator', 'scale', 'thermometer', 'timer')),
  device_data JSONB DEFAULT '{}',
  is_connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for smart devices
ALTER TABLE smart_kitchen_devices ENABLE ROW LEVEL SECURITY;

-- Create policies for smart devices
CREATE POLICY "Users can manage their own devices" 
ON smart_kitchen_devices FOR ALL 
USING (auth.uid() = user_id);

-- Create collaborative cooking sessions table
CREATE TABLE IF NOT EXISTS cooking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  session_type TEXT DEFAULT 'collaborative' CHECK (session_type IN ('collaborative', 'competitive', 'learning')),
  max_participants INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  session_data JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for cooking sessions
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for cooking sessions
CREATE POLICY "Sessions are viewable by everyone" 
ON cooking_sessions FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create sessions" 
ON cooking_sessions FOR INSERT 
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can manage their sessions" 
ON cooking_sessions FOR ALL 
USING (auth.uid() = host_user_id);

-- Create session participants table
CREATE TABLE IF NOT EXISTS cooking_session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'assistant', 'observer')),
  progress_data JSONB DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(session_id, user_id)
);

-- Enable RLS for session participants
ALTER TABLE cooking_session_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for session participants
CREATE POLICY "Participants can view session data" 
ON cooking_session_participants FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM cooking_sessions cs 
  WHERE cs.id = cooking_session_participants.session_id 
  AND cs.host_user_id = auth.uid()
));

CREATE POLICY "Users can join sessions" 
ON cooking_session_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create gamification system
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements
CREATE POLICY "Users can view their own achievements" 
ON user_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements" 
ON user_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create AI recipe generation history
CREATE TABLE IF NOT EXISTS ai_recipe_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_recipe JSONB NOT NULL,
  model_used TEXT DEFAULT 'gpt-4',
  generation_time_ms INTEGER,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  was_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for AI generations
ALTER TABLE ai_recipe_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for AI generations
CREATE POLICY "Users can manage their AI generations" 
ON ai_recipe_generations FOR ALL 
USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_recipe_3d_models_updated_at
  BEFORE UPDATE ON recipe_3d_models
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_cooking_sessions_updated_at
  BEFORE UPDATE ON cooking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Grant permissions
GRANT ALL ON recipe_3d_models TO authenticated;
GRANT ALL ON smart_kitchen_devices TO authenticated;
GRANT ALL ON cooking_sessions TO authenticated;
GRANT ALL ON cooking_session_participants TO authenticated;
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON ai_recipe_generations TO authenticated;