-- Fix recipe-cuisine relationship without conflicting data
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_cuisine_id_fkey;
ALTER TABLE recipes ADD CONSTRAINT recipes_cuisine_id_fkey 
  FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) ON DELETE SET NULL;

-- Add sample recipes without conflicting with existing cuisines
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
    (SELECT id FROM cuisines WHERE name ILIKE '%italian%' LIMIT 1),
    (SELECT id FROM recipe_categories LIMIT 1),
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
    (SELECT id FROM cuisines WHERE is_kenyan_local = true LIMIT 1),
    (SELECT id FROM recipe_categories LIMIT 1),
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
    'Molecular Chocolate Dessert',
    'Futuristic dessert with molecular gastronomy techniques',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    (SELECT id FROM cuisines WHERE name NOT ILIKE '%kenyan%' LIMIT 1),
    (SELECT id FROM recipe_categories LIMIT 1),
    'hard',
    30, 60, 90, 8,
    ARRAY['300g dark chocolate', '200ml cream', '50g butter', '2 eggs', 'gold leaf'],
    '{"steps": [{"step": 1, "instruction": "Melt chocolate using precision temperature control"}, {"step": 2, "instruction": "Prepare molecular mixture"}, {"step": 3, "instruction": "Use modern techniques for presentation"}, {"step": 4, "instruction": "Add finishing touches with gold leaf"}]}',
    '{"calories": 420, "protein": 8, "carbs": 35, "fat": 28, "fiber": 5}',
    ARRAY['vegetarian'],
    true, true, null
  )
ON CONFLICT (id) DO NOTHING;