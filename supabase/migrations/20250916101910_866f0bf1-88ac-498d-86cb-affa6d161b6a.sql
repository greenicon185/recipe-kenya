-- Fix foreign key relationship only
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_cuisine_id_fkey;
ALTER TABLE recipes ADD CONSTRAINT recipes_cuisine_id_fkey 
  FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) ON DELETE SET NULL;

-- Create advanced tables for futuristic features
CREATE TABLE IF NOT EXISTS recipe_3d_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  model_url TEXT,
  model_type TEXT DEFAULT '3d_scene' CHECK (model_type IN ('3d_scene', 'ar_model', 'vr_experience')),
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS smart_kitchen_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('oven', 'stove', 'refrigerator', 'scale', 'thermometer', 'timer', 'air_fryer', 'pressure_cooker')),
  device_data JSONB DEFAULT '{}',
  is_connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS cooking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  session_type TEXT DEFAULT 'collaborative' CHECK (session_type IN ('collaborative', 'competitive', 'learning', 'masterclass')),
  max_participants INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  session_data JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS cooking_session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'assistant', 'observer', 'mentor')),
  progress_data JSONB DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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

-- Enable RLS for all new tables
ALTER TABLE recipe_3d_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_kitchen_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recipe_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for 3D models
CREATE POLICY "3D models are viewable by everyone" 
ON recipe_3d_models FOR SELECT USING (true);

CREATE POLICY "Admins can manage 3D models" 
ON recipe_3d_models FOR ALL 
USING (get_user_role(auth.uid()) = 'super_admin');

-- Create policies for smart devices
CREATE POLICY "Users can manage their own devices" 
ON smart_kitchen_devices FOR ALL 
USING (auth.uid() = user_id);

-- Create policies for cooking sessions
CREATE POLICY "Sessions are viewable by everyone" 
ON cooking_sessions FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create sessions" 
ON cooking_sessions FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can manage their sessions" 
ON cooking_sessions FOR ALL USING (auth.uid() = host_user_id);

-- Create policies for session participants
CREATE POLICY "Participants can view session data" 
ON cooking_session_participants FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM cooking_sessions cs 
  WHERE cs.id = cooking_session_participants.session_id 
  AND cs.host_user_id = auth.uid()
));

CREATE POLICY "Users can join sessions" 
ON cooking_session_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for achievements
CREATE POLICY "Users can view their own achievements" 
ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements" 
ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for AI generations
CREATE POLICY "Users can manage their AI generations" 
ON ai_recipe_generations FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_recipe_3d_models_updated_at
  BEFORE UPDATE ON recipe_3d_models
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_cooking_sessions_updated_at
  BEFORE UPDATE ON cooking_sessions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Grant permissions
GRANT ALL ON recipe_3d_models TO authenticated;
GRANT ALL ON smart_kitchen_devices TO authenticated;
GRANT ALL ON cooking_sessions TO authenticated;
GRANT ALL ON cooking_session_participants TO authenticated;
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON ai_recipe_generations TO authenticated;