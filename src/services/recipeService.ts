import { supabase } from '@/integrations/supabase/client';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine_id?: string;
  category_id?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes?: number;
  servings: number;
  instructions: string[];
  image_url: string;
  video_url?: string;
  nutritional_info?: NutritionalInfo;
  dietary_restrictions?: ('vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'nut_free' | 'halal' | 'kosher')[];
  is_featured: boolean;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  cuisine?: { name: string };
  category?: { name: string };
  ingredients?: RecipeIngredient[];
  reviews?: RecipeReview[];
  average_rating?: number;
  review_count?: number;
}

export interface RecipeIngredient {
  id: string;
  ingredient: {
    id: string;
    name: string;
  };
  quantity: number;
  unit: string;
  preparation_note?: string;
  is_optional: boolean;
  display_order?: number;
}

export interface RecipeReview {
  id: string;
  user_id: string;
  rating: number;
  comment?: string;
  cooking_time_actual?: number;
  difficulty_actual?: 'easy' | 'medium' | 'hard';
  would_make_again?: boolean;
  created_at: string;
  profile: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface Cuisine {
  id: string;
  name: string;
  description: string;
  origin_country: string;
  is_kenyan_local: boolean;
  image_url?: string;
}

export interface RecipeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Ingredient {
  id: string;
  name: string;
  description: string;
  category: string;
  common_unit: string;
  calories_per_100g: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  serving_size: string;
}

export interface RecipeComment {
  id: string;
  recipe_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  replies?: RecipeComment[];
}

// Recipe operations
export const getRecipes = async (options?: {
  cuisine_id?: string;
  category_id?: string;
  featured?: boolean;
  limit?: number;
  search?: string;
}) => {
  let query = supabase
    .from('recipes')
    .select(`
      *,
      cuisine:cuisines(name),
      category:recipe_categories(name),
      recipe_ingredients(
        id,
        quantity,
        unit,
        preparation_note,
        is_optional,
        display_order,
        ingredient:ingredients(id, name)
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (options?.cuisine_id) {
    query = query.eq('cuisine_id', options.cuisine_id);
  }
  
  if (options?.category_id) {
    query = query.eq('category_id', options.category_id);
  }
  
  if (options?.featured) {
    query = query.eq('is_featured', true);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as any;
};

export const getAllRecipes = async () => {
  return await getRecipes();
};

export const getFeaturedRecipes = async () => {
  return await getRecipes({ featured: true, limit: 6 });
};

// Fixed: Case-insensitive category lookup
export const getRecipesByCategory = async (categoryName: string) => {
  const { data: category } = await supabase
    .from('recipe_categories')
    .select('id')
    .ilike('name', categoryName.toLowerCase())
    .single();
  
  if (category) {
    return await getRecipes({ category_id: category.id });
  }
  return [];
};

export const getRecipe = async (id: string) => {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      cuisine:cuisines(name),
      category:recipe_categories(name),
      recipe_ingredients(
        id,
        quantity,
        unit,
        preparation_note,
        is_optional,
        display_order,
        ingredient:ingredients(id, name)
      ),
      ingredients
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as any;
};

export const getRecipeById = async (id: string) => {
  return await getRecipe(id);
};

export const createRecipe = async (recipeData: any) => {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateRecipe = async (id: string, recipeData: any) => {
  const { data, error } = await supabase
    .from('recipes')
    .update({ ...recipeData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRecipe = async (id: string) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Cuisine operations
export const getCuisines = async () => {
  const { data, error } = await supabase
    .from('cuisines')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Cuisine[];
};

// Category operations
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('recipe_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as RecipeCategory[];
};

export const getAllCategories = async () => {
  const categories = await getCategories();
  return categories.map(cat => cat.name);
};

// Ingredient operations
export const getIngredients = async () => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Ingredient[];
};

// Review operations
export const getRecipeReviews = async (recipeId: string) => {
  const { data, error } = await supabase
    .from('recipe_reviews')
    .select(`
      *,
      profile:profiles(full_name, username, avatar_url)
    `)
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as RecipeReview[];
};

export const createReview = async (reviewData: {
  recipe_id: string;
  rating: number;
  comment?: string;
  cooking_time_actual?: number;
  difficulty_actual?: 'easy' | 'medium' | 'hard';
  would_make_again?: boolean;
}) => {
  const { data, error } = await supabase
    .from('recipe_reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateReview = async (reviewId: string, updateData: { rating?: number; comment?: string }) => {
  const { data, error } = await supabase
    .from('recipe_reviews')
    .update(updateData)
    .eq('id', reviewId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteReview = async (reviewId: string) => {
  const { error } = await supabase
    .from('recipe_reviews')
    .delete()
    .eq('id', reviewId);
  if (error) throw error;
};

// Favorites operations
export const addToFavorites = async (recipeId: string) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');
  const { data, error } = await supabase
    .from('user_favorites')
    .insert({ recipe_id: recipeId, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeFromFavorites = async (recipeId: string) => {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('recipe_id', recipeId);

  if (error) throw error;
};

export const getUserFavorites = async () => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      *,
      recipe:recipes(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Interaction tracking for AI
export const trackRecipeInteraction = async (
  recipeId: string,
  interactionType: 'view' | 'favorite' | 'cook' | 'share' | 'print',
  interactionData?: any
) => {
  const { error } = await supabase
    .from('recipe_interactions')
    .insert({
      recipe_id: recipeId,
      interaction_type: interactionType,
      interaction_data: interactionData
    });

  if (error) console.error('Error tracking interaction:', error);
};

// New admin-specific functions for user management
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles(role)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'moderator' | 'super_admin') => {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ 
      user_id: userId, 
      role: role,
      assigned_at: new Date().toISOString()
    });

  if (error) throw error;
};

export const getSystemStats = async () => {
  const [recipesResult, usersResult, interactionsResult] = await Promise.all([
    supabase.from('recipes').select('*', { count: 'exact' }),
    supabase.from('profiles').select('*', { count: 'exact' }),
    supabase.from('recipe_interactions').select('*', { count: 'exact' })
  ]);

  return {
    totalRecipes: recipesResult.count || 0,
    totalUsers: usersResult.count || 0,
    totalInteractions: interactionsResult.count || 0
  };
};

export const calculateRecipeNutrition = async (recipeId: string): Promise<NutritionalInfo | null> => {
  const { data: recipe } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients(
        quantity,
        unit,
        ingredient:ingredients(
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          fiber_per_100g,
          sugar_per_100g,
          sodium_per_100g,
          cholesterol_per_100g
        )
      )
    `)
    .eq('id', recipeId)
    .single();

  if (!recipe) return null;

  const nutritionalInfo: NutritionalInfo = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0,
    serving_size: `${recipe.servings} servings`,
  };

  recipe.recipe_ingredients.forEach((item: any) => {
    const conversionFactor = convertToGrams(item.quantity, item.unit) / 100;
    const ingredient = item.ingredient;
    
    if (ingredient) {
      nutritionalInfo.calories += (ingredient.calories_per_100g || 0) * conversionFactor;
      nutritionalInfo.protein += (ingredient.protein_per_100g || 0) * conversionFactor;
      nutritionalInfo.carbohydrates += (ingredient.carbs_per_100g || 0) * conversionFactor;
      nutritionalInfo.fat += (ingredient.fat_per_100g || 0) * conversionFactor;
      nutritionalInfo.fiber += (ingredient.fiber_per_100g || 0) * conversionFactor;
      nutritionalInfo.sugar += (ingredient.sugar_per_100g || 0) * conversionFactor;
      nutritionalInfo.sodium += (ingredient.sodium_per_100g || 0) * conversionFactor;
      nutritionalInfo.cholesterol += (ingredient.cholesterol_per_100g || 0) * conversionFactor;
    }
  });

  // Convert per recipe to per serving
  const perServingNutritionalInfo = { ...nutritionalInfo };
  const numericKeys = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium', 'cholesterol'] as const;
  
  numericKeys.forEach((key) => {
    perServingNutritionalInfo[key] = Math.round(perServingNutritionalInfo[key] / recipe.servings);
  });

  return perServingNutritionalInfo;
};

export const getRecipeComments = async (recipeId: string) => {
  const { data: comments, error } = await supabase
    .from('recipe_reviews')
    .select(`
      *,
      profile:profiles(username, full_name, avatar_url),
      replies:recipe_comments(
        *,
        profile:profiles(username, full_name, avatar_url)
      )
    `)
    .eq('recipe_id', recipeId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return comments as any;
};

export const addRecipeComment = async (
  recipeId: string,
  content: string,
  parentCommentId?: string
) => {
  const { data: comment, error } = await supabase
    .from('recipe_reviews')
    .insert({
      recipe_id: recipeId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      comment: content,
    })
    .select(`
      *,
      profile:profiles(username, full_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return comment as any;
};

export const updateRecipeComment = async (commentId: string, content: string) => {
  const { data: comment, error } = await supabase
    .from('recipe_reviews')
    .update({ comment: content })
    .eq('id', commentId)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .select(`
      *,
      profile:profiles(username, full_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return comment as any;
};

export const deleteRecipeComment = async (commentId: string) => {
  const { error } = await supabase
    .from('recipe_reviews')
    .delete()
    .eq('id', commentId)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

  if (error) throw error;
};

export const shareRecipe = async (recipeId: string, userIds: string[]) => {
  const currentUser = await supabase.auth.getUser();
  const userId = currentUser.data.user?.id;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const shares = userIds.map((targetUserId) => ({
    recipe_id: recipeId,
    shared_by: userId,
    shared_with: targetUserId,
  }));

  const { data, error } = await supabase
    .from('recipe_reviews')
    .insert(shares)
    .select();

  if (error) throw error;
  return data;
};

export const getSharedRecipes = async () => {
  const { data: recipes, error } = await (supabase as any)
    .from('recipe_reviews')
    .select(`
      *,
      recipe:recipes(*),
      shared_by_profile:profiles!recipe_shares_shared_by_fkey(username, full_name, avatar_url)
    `)
    .eq('shared_with', (await supabase.auth.getUser()).data.user?.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return recipes;
};

// Helper function to convert various units to grams
const convertToGrams = (quantity: number, unit: string): number => {
  const conversions: { [key: string]: number } = {
    g: 1,
    kg: 1000,
    mg: 0.001,
    oz: 28.3495,
    lb: 453.592,
    cup: 236.588, // Approximate for water-based liquids
    tbsp: 14.7868,
    tsp: 4.92892,
    ml: 1, // Approximate for water-based liquids
    l: 1000, // Approximate for water-based liquids
  };

  const normalizedUnit = unit.toLowerCase().replace(/[^a-z]/g, '');
  return quantity * (conversions[normalizedUnit] || 1);
};
