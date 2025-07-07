import { supabase } from '@/integrations/supabase/client';
import { Recipe } from './recipeService';

// Enhanced User Preference Interfaces
export interface UserPreference {
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced';
  preferred_meal_types?: string[];
  allergies?: string[];
  cooking_time_preference?: 'quick' | 'medium' | 'lengthy';
  spice_tolerance?: 'mild' | 'medium' | 'hot' | 'very_hot';
  serving_size_preference?: 'small' | 'medium' | 'large';
  budget_preference?: 'budget' | 'moderate' | 'premium';
  equipment_available?: string[];
  dietary_goals?: string[];
  health_conditions?: string[];
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'en' | 'sw' | 'fr' | 'es';
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  newsletter_subscription?: boolean;
  privacy_level?: 'private' | 'friends' | 'public';
  auto_save_meal_plans?: boolean;
  show_nutritional_info?: boolean;
  show_cooking_tips?: boolean;
  default_servings?: number;
  measurement_system?: 'metric' | 'imperial';
  timezone?: string;
}

export interface UserDietaryProfile {
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  weight_goal?: 'lose' | 'maintain' | 'gain';
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  medical_conditions?: string[];
  medications?: string[];
  supplements?: string[];
}

export interface UserCookingProfile {
  cooking_experience_years?: number;
  kitchen_size?: 'small' | 'medium' | 'large';
  available_equipment?: string[];
  cooking_frequency?: 'daily' | 'few_times_week' | 'weekly' | 'occasionally' | 'rarely';
  preferred_cooking_methods?: string[];
  time_available_weekdays?: number; // minutes
  time_available_weekends?: number; // minutes
  batch_cooking_preference?: boolean;
  meal_prep_preference?: boolean;
}

export interface UserSocialPreferences {
  share_recipes?: boolean;
  share_meal_plans?: boolean;
  share_reviews?: boolean;
  allow_followers?: boolean;
  show_profile_to_public?: boolean;
  receive_follow_requests?: boolean;
  notification_frequency?: 'immediate' | 'daily' | 'weekly' | 'never';
}

export interface UserAIPreferences {
  ai_recommendations_enabled?: boolean;
  recommendation_frequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  include_new_recipes?: boolean;
  include_popular_recipes?: boolean;
  include_seasonal_recipes?: boolean;
  include_healthy_recipes?: boolean;
  include_quick_recipes?: boolean;
  max_recommendations_per_day?: number;
  learning_rate?: number;
}

export interface UserNotificationPreferences {
  new_recipes?: boolean;
  recipe_recommendations?: boolean;
  meal_plan_reminders?: boolean;
  shopping_list_reminders?: boolean;
  social_interactions?: boolean;
  system_updates?: boolean;
  marketing_emails?: boolean;
  weekly_digest?: boolean;
  monthly_report?: boolean;
}

export interface UserPrivacySettings {
  profile_visibility?: 'private' | 'friends' | 'public';
  recipe_visibility?: 'private' | 'friends' | 'public';
  review_visibility?: 'private' | 'friends' | 'public';
  meal_plan_visibility?: 'private' | 'friends' | 'public';
  shopping_list_visibility?: 'private' | 'friends' | 'public';
  allow_data_analytics?: boolean;
  allow_personalization?: boolean;
  allow_third_party_tracking?: boolean;
}

export interface UserAccessibilitySettings {
  font_size?: 'small' | 'medium' | 'large' | 'extra_large';
  high_contrast?: boolean;
  screen_reader_friendly?: boolean;
  reduce_motion?: boolean;
  auto_play_videos?: boolean;
  show_alt_text?: boolean;
  keyboard_navigation?: boolean;
}

export interface UserIntegrationSettings {
  google_calendar_sync?: boolean;
  apple_health_sync?: boolean;
  fitbit_sync?: boolean;
  myfitnesspal_sync?: boolean;
  instacart_integration?: boolean;
  uber_eats_integration?: boolean;
  pinterest_sync?: boolean;
  instagram_sync?: boolean;
}

// Complete user profile interface
export interface CompleteUserProfile {
  preferences: UserPreference;
  settings: UserSettings;
  dietary_profile: UserDietaryProfile;
  cooking_profile: UserCookingProfile;
  social_preferences: UserSocialPreferences;
  ai_preferences: UserAIPreferences;
  notification_preferences: UserNotificationPreferences;
  privacy_settings: UserPrivacySettings;
  accessibility_settings: UserAccessibilitySettings;
  integration_settings: UserIntegrationSettings;
}

export const getPersonalizedRecipes = async () => {
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  let query = supabase
    .from('recipes')
    .select(`
      *,
      cuisine:cuisines(name),
      category:recipe_categories(name),
      recipe_ingredients(
        ingredient:ingredients(name, category)
      )
    `)
    .eq('is_published', true);

  if (preferences?.dietary_restrictions) {
    query = query.contains('dietary_restrictions', preferences.dietary_restrictions);
  }

  if (preferences?.cooking_time_preference === 'quick') {
    query = query.lt('total_time_minutes', 30);
  } else if (preferences?.cooking_time_preference === 'medium') {
    query = query.gte('total_time_minutes', 30).lt('total_time_minutes', 60);
  }

  if (preferences?.cooking_skill_level) {
    query = query.eq('difficulty', preferences.cooking_skill_level);
  }

  const { data: recipes, error } = await query.limit(10);
  if (error) throw error;
  return recipes as Recipe[];
};

export const getSimilarRecipes = async (recipeId: string) => {
  const { data: sourceRecipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  if (!sourceRecipe) return [];

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select(`
      *,
      cuisine:cuisines(name),
      category:recipe_categories(name)
    `)
    .eq('cuisine_id', sourceRecipe.cuisine_id)
    .eq('is_published', true)
    .neq('id', recipeId)
    .limit(6);

  if (error) throw error;
  return recipes as Recipe[];
};

export const getWeeklyMealPlan = async () => {
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const weekDays = 7;
  const mealPlan: { [key: string]: Recipe[] } = {};

  for (let day = 0; day < weekDays; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dayKey = date.toISOString().split('T')[0];
    mealPlan[dayKey] = [];

    for (const mealType of mealTypes) {
      const { data: recipes } = await supabase
        .from('recipes')
        .select(`
          *,
          cuisine:cuisines(name),
          category:recipe_categories(name)
        `)
        .eq('is_published', true)
        .contains('dietary_restrictions', preferences?.dietary_restrictions || [])
        .eq('meal_type', mealType)
        .limit(1);

      if (recipes?.[0]) {
        mealPlan[dayKey].push(recipes[0]);
      }
    }
  }

  return mealPlan;
};

export const getSeasonalRecipes = async () => {
  const currentMonth = new Date().getMonth() + 1;
  const season = getSeason(currentMonth);

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select(`
      *,
      cuisine:cuisines(name),
      category:recipe_categories(name),
      recipe_ingredients(
        ingredient:ingredients(name, category)
      )
    `)
    .eq('is_published', true)
    .contains('tags', [season])
    .limit(10);

  if (error) throw error;
  return recipes as Recipe[];
};

const getSeason = (month: number): string => {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

export const getPopularRecipesByTime = async (timeRange: 'day' | 'week' | 'month' | 'year') => {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const { data: recipes, error } = await supabase
    .rpc('get_popular_recipes', {
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      limit_count: 10
    });

  if (error) throw error;
  return recipes as Recipe[];
};

export const updateUserPreferences = async (preferences: Partial<UserPreference>) => {
  const { data, error } = await supabase
    .from('user_preferences_v2')
    .upsert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserSettings = async (settings: Partial<UserSettings>) => {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserAIPreferences = async (aiPreferences: Partial<UserAIPreferences>) => {
  try {
    console.log('Starting updateUserAIPreferences with:', aiPreferences);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('User authenticated:', user.id);

    // First, try to get existing preferences to ensure the record exists
    const existingPreferences = await getUserAIPreferences(user.id);
    console.log('Existing AI preferences:', existingPreferences);
    
    // Prepare the data to upsert
    const dataToUpsert = {
      user_id: user.id,
      ...aiPreferences,
      updated_at: new Date().toISOString()
    };

    console.log('Data to upsert:', dataToUpsert);

    const { data, error } = await supabase
      .from('user_ai_preferences')
      .upsert(dataToUpsert)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating AI preferences:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`AI preferences update failed: ${error.message}`);
    }
    
    console.log('AI preferences updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to update AI preferences:', error);
    throw error;
  }
};

export const updateUserDietaryProfile = async (dietaryProfile: Partial<UserDietaryProfile>) => {
  const { data, error } = await supabase
    .from('user_dietary_profile')
    .upsert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      ...dietaryProfile,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserCookingProfile = async (cookingProfile: Partial<UserCookingProfile>) => {
  const { data, error } = await supabase
    .from('user_cooking_profile')
    .upsert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      ...cookingProfile,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences_v2')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    // Return null if there's a schema error, allowing fallback to default preferences
    return null;
  }
};

export const getUserSettings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
};

export const getUserDietaryProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_dietary_profile')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error fetching user dietary profile:', error);
    return null;
  }
};

export const getUserCookingProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_cooking_profile')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error fetching user cooking profile:', error);
    return null;
  }
};

export const getUserAIPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user AI preferences:', error);
      throw error;
    }
    
    // If no record exists, return default preferences
    if (!data) {
      return {
        ai_recommendations_enabled: true,
        recommendation_frequency: 'daily',
        include_new_recipes: true,
        include_popular_recipes: true,
        include_seasonal_recipes: true,
        include_healthy_recipes: true,
        include_quick_recipes: true,
        max_recommendations_per_day: 10,
        learning_rate: 0.1
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user AI preferences:', error);
    // Return default preferences if there's an error
    return {
      ai_recommendations_enabled: true,
      recommendation_frequency: 'daily',
      include_new_recipes: true,
      include_popular_recipes: true,
      include_seasonal_recipes: true,
      include_healthy_recipes: true,
      include_quick_recipes: true,
      max_recommendations_per_day: 10,
      learning_rate: 0.1
    };
  }
};

export const getCompleteUserProfile = async (userId: string): Promise<CompleteUserProfile | null> => {
  try {
    // Fetch data from individual tables
    const [preferences, settings, aiPreferences] = await Promise.all([
      getUserPreferences(userId),
      getUserSettings(userId),
      getUserAIPreferences(userId)
    ]);

    return {
      preferences: preferences || {},
      settings: settings || {},
      dietary_profile: {},
      cooking_profile: {},
      social_preferences: {},
      ai_preferences: aiPreferences || {},
      notification_preferences: {},
      privacy_settings: {},
      accessibility_settings: {},
      integration_settings: {}
    };
  } catch (error) {
    console.error('Error fetching complete user profile:', error);
    return null;
  }
};

export const createDefaultPreferences = async (userId: string) => {
  try {
    const defaultPreferences: UserPreference = {
      dietary_restrictions: [],
      favorite_cuisines: [],
      cooking_skill_level: 'beginner',
      preferred_meal_types: [],
      allergies: [],
      cooking_time_preference: 'medium',
      spice_tolerance: 'medium',
      serving_size_preference: 'medium',
      budget_preference: 'moderate',
      equipment_available: [],
      dietary_goals: [],
      health_conditions: []
    };

    const { data, error } = await supabase
      .from('user_preferences_v2')
      .insert({
        user_id: userId,
        ...defaultPreferences
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating default preferences:', error);
    // Return a default preferences object if database insertion fails
    return {
      id: 'default',
      user_id: userId,
      dietary_restrictions: [],
      favorite_cuisines: [],
      cooking_skill_level: 'beginner',
      preferred_meal_types: [],
      allergies: [],
      cooking_time_preference: 'medium',
      spice_tolerance: 'medium',
      serving_size_preference: 'medium',
      budget_preference: 'moderate',
      equipment_available: [],
      dietary_goals: [],
      health_conditions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

export const createDefaultSettings = async (userId: string) => {
  try {
    const defaultSettings: UserSettings = {
      theme: 'light',
      language: 'en',
      notifications_enabled: true,
      email_notifications: true,
      push_notifications: true,
      newsletter_subscription: false,
      privacy_level: 'public',
      auto_save_meal_plans: true,
      show_nutritional_info: true,
      show_cooking_tips: true,
      default_servings: 4,
      measurement_system: 'metric',
      timezone: 'UTC'
    };

    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        ...defaultSettings
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating default settings:', error);
    return null;
  }
};

export const createDefaultAIPreferences = async (userId: string) => {
  try {
    const defaultAIPreferences: UserAIPreferences = {
      ai_recommendations_enabled: true,
      recommendation_frequency: 'daily',
      include_new_recipes: true,
      include_popular_recipes: true,
      include_seasonal_recipes: true,
      include_healthy_recipes: true,
      include_quick_recipes: true,
      max_recommendations_per_day: 10,
      learning_rate: 0.1
    };

    const { data, error } = await supabase
      .from('user_ai_preferences')
      .upsert({
        user_id: userId,
        ...defaultAIPreferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating default AI preferences:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error creating default AI preferences:', error);
    // Return a default preferences object if database insertion fails
    return {
      ai_recommendations_enabled: true,
      recommendation_frequency: 'daily',
      include_new_recipes: true,
      include_popular_recipes: true,
      include_seasonal_recipes: true,
      include_healthy_recipes: true,
      include_quick_recipes: true,
      max_recommendations_per_day: 10,
      learning_rate: 0.1
    };
  }
};

export const initializeUserProfile = async (userId: string) => {
  try {
    // Call the database function to initialize basic settings
    const { error } = await supabase.rpc('initialize_basic_user_settings', {
      user_id: userId
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    // Fallback: try to create preferences manually
    try {
      await createDefaultPreferences(userId);
      await createDefaultSettings(userId);
      await createDefaultAIPreferences(userId);
      return true;
    } catch (fallbackError) {
      console.error('Fallback initialization also failed:', fallbackError);
      return false;
    }
  }
};

export const getOrCreateUserPreferences = async (userId: string) => {
  try {
    const preferences = await getUserPreferences(userId);
    if (preferences) {
      return preferences;
    }
    // If no preferences exist, create default ones
    return await createDefaultPreferences(userId);
  } catch (error) {
    console.error('Error getting or creating user preferences:', error);
    // Return a fallback preferences object
    return {
      id: 'fallback',
      user_id: userId,
      dietary_restrictions: [],
      favorite_cuisines: [],
      cooking_skill_level: 'beginner',
      preferred_meal_types: [],
      allergies: [],
      cooking_time_preference: 'medium',
      spice_tolerance: 'medium',
      serving_size_preference: 'medium',
      budget_preference: 'moderate',
      equipment_available: [],
      dietary_goals: [],
      health_conditions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

export const getAIPoweredRecommendations = async (userId: string) => {
  try {
    console.log('Starting AI recommendations for user:', userId);
    
    // Fetch user preferences for personalization
    const preferences = await getUserPreferences(userId);
    console.log('Fetched preferences:', preferences);
    
    const aiPreferences = await getUserAIPreferences(userId);
    console.log('Fetched AI preferences:', aiPreferences);

    // If AI recommendations are disabled, return empty array
    if (aiPreferences && !aiPreferences.ai_recommendations_enabled) {
      return [];
    }

    const maxRecommendations = Math.max(aiPreferences?.max_recommendations_per_day || 6, 3);
    const recommendations: Recipe[] = [];
    const usedIds = new Set<string>();

    // Helper function to add recipes without duplicates
    const addUniqueRecipes = (recipes: Recipe[], maxCount: number) => {
      const uniqueRecipes = recipes.filter(r => !usedIds.has(r.id));
      const toAdd = uniqueRecipes.slice(0, maxCount);
      toAdd.forEach(r => usedIds.add(r.id));
      recommendations.push(...toAdd);
      return toAdd.length;
    };

    // Helper function to safely build query with exclusion
    const buildQueryWithExclusion = (baseQuery: any) => {
      if (usedIds.size > 0) {
        const ids = Array.from(usedIds);
        if (ids.length > 0) {
          return baseQuery.not('id', 'in', `(${ids.map(id => `'${id}'`).join(',')})`);
        }
      }
      return baseQuery;
    };

    // Helper function to fetch recipes with error handling
    const fetchRecipesSafely = async (query: any, source: string) => {
      try {
        const { data, error } = await query;
        if (error) {
          console.error(`Error fetching ${source}:`, error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.error(`Exception fetching ${source}:`, err);
        return [];
      }
    };

    // 1. PRIORITY: Get user's favorite recipes first (highest priority)
    console.log('Fetching user favorites...');
    const { data: userFavorites } = await supabase
      .from('user_favorites')
      .select(`
        recipe:recipes(
          *,
          cuisine:cuisines(name),
          category:recipe_categories(name),
          recipe_ingredients(
            ingredient:ingredients(name, category)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('recipe.is_published', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (userFavorites && userFavorites.length > 0) {
      const favoriteRecipes = userFavorites.map(fav => fav.recipe).filter(Boolean);
      const addedCount = addUniqueRecipes(favoriteRecipes, 3);
      console.log(`Added ${addedCount} favorite recipes to recommendations`);
    }

    // 2. Get recent search history and find similar recipes
    console.log('Fetching search history...');
    try {
      const { data: searchHistory } = await supabase
        .from('recipe_views')
        .select(`
          recipe:recipes(
            *,
            cuisine:cuisines(name),
            category:recipe_categories(name),
            recipe_ingredients(
              ingredient:ingredients(name, category)
            )
          )
        `)
        .eq('user_id', userId)
        .eq('recipe.is_published', true)
        .order('viewed_at', { ascending: false })
        .limit(5);

      if (searchHistory && searchHistory.length > 0) {
        const recentViewedRecipes = searchHistory.map(view => view.recipe).filter(Boolean);
        
        // Get categories from recently viewed recipes
        const recentCategories = recentViewedRecipes
          .map(r => r.category_id)
          .filter(Boolean)
          .slice(0, 2);

        // Find recipes from the same categories
        if (recentCategories.length > 0) {
          let categoryQuery = supabase
            .from('recipes')
            .select(`
              *,
              cuisine:cuisines(name),
              category:recipe_categories(name),
              recipe_ingredients(
                ingredient:ingredients(name, category)
              )
            `)
            .eq('is_published', true)
            .in('category_id', recentCategories);
          
          categoryQuery = buildQueryWithExclusion(categoryQuery);
          const categoryRecipes = await fetchRecipesSafely(categoryQuery.limit(3), 'category recipes');

          if (categoryRecipes.length > 0) {
            const addedCount = addUniqueRecipes(categoryRecipes, 3);
            console.log(`Added ${addedCount} recipes from recent categories`);
          }
        }
      }
    } catch (error) {
      console.log('Recipe views table not available, skipping search history:', error);
    }

    // 3. Get recipes similar to favorites (same cuisine/category)
    if (userFavorites && userFavorites.length > 0) {
      const favoriteRecipes = userFavorites.map(fav => fav.recipe).filter(Boolean);
      
      // Get cuisines and categories from favorites
      const favoriteCuisines = favoriteRecipes.map(r => r.cuisine_id).filter(Boolean);
      const favoriteCategories = favoriteRecipes.map(r => r.category_id).filter(Boolean);

      if (favoriteCuisines.length > 0 || favoriteCategories.length > 0) {
        let similarQuery = supabase
          .from('recipes')
          .select(`
            *,
            cuisine:cuisines(name),
            category:recipe_categories(name),
            recipe_ingredients(
              ingredient:ingredients(name, category)
            )
          `)
          .eq('is_published', true);

        if (favoriteCuisines.length > 0) {
          similarQuery = similarQuery.in('cuisine_id', favoriteCuisines);
        }
        if (favoriteCategories.length > 0) {
          similarQuery = similarQuery.in('category_id', favoriteCategories);
        }

        similarQuery = buildQueryWithExclusion(similarQuery);
        const similarRecipes = await fetchRecipesSafely(similarQuery.limit(3), 'similar recipes');
        
        if (similarRecipes.length > 0) {
          const addedCount = addUniqueRecipes(similarRecipes, 3);
          console.log(`Added ${addedCount} similar recipes to favorites`);
        }
      }
    }

    // 4. Get popular/featured recipes
    console.log('Fetching featured recipes...');
    let featuredQuery = supabase
      .from('recipes')
      .select(`
        *,
        cuisine:cuisines(name),
        category:recipe_categories(name),
        recipe_ingredients(
          ingredient:ingredients(name, category)
        )
      `)
      .eq('is_published', true)
      .eq('is_featured', true);
    
    featuredQuery = buildQueryWithExclusion(featuredQuery);
    const featuredRecipes = await fetchRecipesSafely(featuredQuery.limit(3), 'featured recipes');

    if (featuredRecipes.length > 0) {
      const addedCount = addUniqueRecipes(featuredRecipes, 3);
      console.log(`Added ${addedCount} featured recipes`);
    }

    // 5. Apply dietary restrictions and preferences
    if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      console.log('Fetching dietary-restricted recipes...');
      let dietaryQuery = supabase
        .from('recipes')
        .select(`
          *,
          cuisine:cuisines(name),
          category:recipe_categories(name),
          recipe_ingredients(
            ingredient:ingredients(name, category)
          )
        `)
        .eq('is_published', true)
        .overlaps('dietary_restrictions', preferences.dietary_restrictions);
      
      dietaryQuery = buildQueryWithExclusion(dietaryQuery);
      const dietaryRecipes = await fetchRecipesSafely(dietaryQuery.limit(3), 'dietary recipes');

      if (dietaryRecipes.length > 0) {
        const addedCount = addUniqueRecipes(dietaryRecipes, 3);
        console.log(`Added ${addedCount} dietary-restricted recipes`);
      }
    }

    // 6. Apply cooking time preference
    if (preferences?.cooking_time_preference && recommendations.length < maxRecommendations) {
      console.log('Fetching time-preference recipes...');
      let timeQuery = supabase
        .from('recipes')
        .select(`
          *,
          cuisine:cuisines(name),
          category:recipe_categories(name),
          recipe_ingredients(
            ingredient:ingredients(name, category)
          )
        `)
        .eq('is_published', true);

      if (preferences.cooking_time_preference === 'quick') {
        timeQuery = timeQuery.lt('total_time_minutes', 30);
      } else if (preferences.cooking_time_preference === 'medium') {
        timeQuery = timeQuery.gte('total_time_minutes', 30).lt('total_time_minutes', 60);
      } else if (preferences.cooking_time_preference === 'lengthy') {
        timeQuery = timeQuery.gte('total_time_minutes', 60);
      }

      timeQuery = buildQueryWithExclusion(timeQuery);
      const timeRecipes = await fetchRecipesSafely(timeQuery.limit(3), 'time-preference recipes');
      
      if (timeRecipes.length > 0) {
        const addedCount = addUniqueRecipes(timeRecipes, 3);
        console.log(`Added ${addedCount} time-preference recipes`);
      }
    }

    // 7. Fill remaining slots with any available recipes
    const remainingSlots = maxRecommendations - recommendations.length;
    if (remainingSlots > 0) {
      console.log(`Filling ${remainingSlots} remaining slots...`);
      let remainingQuery = supabase
        .from('recipes')
        .select(`
          *,
          cuisine:cuisines(name),
          category:recipe_categories(name),
          recipe_ingredients(
            ingredient:ingredients(name, category)
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      remainingQuery = buildQueryWithExclusion(remainingQuery);
      const remainingRecipes = await fetchRecipesSafely(remainingQuery.limit(remainingSlots), 'remaining recipes');

      if (remainingRecipes.length > 0) {
        const addedCount = addUniqueRecipes(remainingRecipes, remainingSlots);
        console.log(`Added ${addedCount} remaining recipes`);
      }
    }

    // FINAL: If still not enough, fetch any published recipes (no filters, no exclusions)
    if (recommendations.length < 3) {
      const { data: anyRecipes } = await supabase
        .from('recipes')
        .select(`
          *,
          cuisine:cuisines(name),
          category:recipe_categories(name),
          recipe_ingredients(
            ingredient:ingredients(name, category)
          )
        `)
        .eq('is_published', true)
        .limit(3);

      if (anyRecipes && anyRecipes.length > 0) {
        const existingIds = new Set(recommendations.map(r => r.id));
        anyRecipes.forEach(r => {
          if (!existingIds.has(r.id)) recommendations.push(r);
        });
      }
    }

    console.log('Final recommendations:', recommendations);
    console.log('Total recommendations found:', recommendations.length);
    
    // Ensure we return at least 3 recommendations, but no more than maxRecommendations
    const finalRecommendations = recommendations.slice(0, Math.max(3, maxRecommendations));
    console.log('Final recommendations to return:', finalRecommendations.length);
    
    return finalRecommendations as Recipe[];
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return [];
  }
};

// Helper function to check and create database tables if they don't exist
export const ensureDatabaseTables = async () => {
  try {
    console.log('Checking if database tables exist...');
    
    // Try to query each table to see if they exist
    const tables = ['user_preferences_v2', 'user_settings', 'user_ai_preferences'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.error(`Table ${table} does not exist:`, error);
          return false;
        }
      } catch (err) {
        console.error(`Error checking table ${table}:`, err);
        return false;
      }
    }
    
    console.log('All required tables exist');
    return true;
  } catch (error) {
    console.error('Error ensuring database tables:', error);
    return false;
  }
};

// Function to track recipe views for recommendations
export const trackRecipeView = async (recipeId: string, viewType: 'view' | 'search' | 'favorite' | 'cook' = 'view', searchTerm?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try to use the database function first
    const { error: functionError } = await supabase.rpc('track_recipe_view', {
      recipe_id: recipeId,
      view_type: viewType,
      search_term: searchTerm
    });

    if (functionError) {
      // Fallback: direct insert
      const { error } = await supabase
        .from('recipe_views')
        .upsert({
          recipe_id: recipeId,
          user_id: user.id,
          view_type: viewType,
          search_term: searchTerm,
          viewed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking recipe view:', error);
      }
    }
  } catch (error) {
    console.error('Error in trackRecipeView:', error);
  }
};

// Helper function to create sample categories and cuisines
export const createSampleCategoriesAndCuisines = async () => {
  try {
    console.log('Creating sample categories and cuisines...');

    // Create sample categories
    const categories = [
      { name: 'Breakfast', description: 'Morning meals and brunch' },
      { name: 'Lunch', description: 'Midday meals' },
      { name: 'Dinner', description: 'Evening meals' },
      { name: 'Snacks', description: 'Quick bites and appetizers' },
      { name: 'Desserts', description: 'Sweet treats and desserts' },
      { name: 'Beverages', description: 'Drinks and cocktails' },
      { name: 'Soups', description: 'Warm and cold soups' },
      { name: 'Salads', description: 'Fresh and healthy salads' },
      { name: 'Main Dishes', description: 'Primary course meals' },
      { name: 'Side Dishes', description: 'Accompanying dishes' }
    ];

    const { data: categoryData, error: categoryError } = await supabase
      .from('recipe_categories')
      .upsert(categories, { onConflict: 'name' })
      .select();

    if (categoryError) {
      console.error('Error creating categories:', categoryError);
    } else {
      console.log('Categories created:', categoryData);
    }

    // Create sample cuisines
    const cuisines = [
      { name: 'Kenyan', description: 'Traditional Kenyan cuisine' },
      { name: 'Italian', description: 'Classic Italian dishes' },
      { name: 'Chinese', description: 'Authentic Chinese cuisine' },
      { name: 'Indian', description: 'Spicy Indian dishes' },
      { name: 'Mexican', description: 'Flavorful Mexican cuisine' },
      { name: 'American', description: 'Classic American dishes' },
      { name: 'Mediterranean', description: 'Healthy Mediterranean cuisine' },
      { name: 'Thai', description: 'Aromatic Thai dishes' },
      { name: 'Japanese', description: 'Elegant Japanese cuisine' },
      { name: 'French', description: 'Sophisticated French dishes' }
    ];

    const { data: cuisineData, error: cuisineError } = await supabase
      .from('cuisines')
      .upsert(cuisines, { onConflict: 'name' })
      .select();

    if (cuisineError) {
      console.error('Error creating cuisines:', cuisineError);
    } else {
      console.log('Cuisines created:', cuisineData);
    }

    return { categories: categoryData, cuisines: cuisineData };
  } catch (error) {
    console.error('Error in createSampleCategoriesAndCuisines:', error);
    return { categories: [], cuisines: [] };
  }
};

// Helper function to create sample recipes for testing
export const createSampleRecipes = async () => {
  try {
    // Check if recipes already exist
    const { data: existingRecipes } = await supabase
      .from('recipes')
      .select('id')
      .limit(1);

    if (existingRecipes && existingRecipes.length > 0) {
      console.log('Sample recipes already exist');
      return;
    }

    console.log('Creating sample recipes...');

    // First, ensure we have categories and cuisines
    const { categories, cuisines } = await createSampleCategoriesAndCuisines();
    
    // Get category and cuisine IDs
    const breakfastCategory = categories?.find(c => c.name === 'Breakfast')?.id;
    const lunchCategory = categories?.find(c => c.name === 'Lunch')?.id;
    const dinnerCategory = categories?.find(c => c.name === 'Dinner')?.id;
    const snacksCategory = categories?.find(c => c.name === 'Snacks')?.id;
    const dessertsCategory = categories?.find(c => c.name === 'Desserts')?.id;
    
    const kenyanCuisine = cuisines?.find(c => c.name === 'Kenyan')?.id;
    const italianCuisine = cuisines?.find(c => c.name === 'Italian')?.id;
    const chineseCuisine = cuisines?.find(c => c.name === 'Chinese')?.id;
    const indianCuisine = cuisines?.find(c => c.name === 'Indian')?.id;
    const mexicanCuisine = cuisines?.find(c => c.name === 'Mexican')?.id;

    // Sample recipes data with proper categories and cuisines
    const sampleRecipes = [
      {
        title: 'Ugali with Sukuma Wiki',
        description: 'Traditional Kenyan staple with collard greens',
        difficulty: 'easy',
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        total_time_minutes: 30,
        servings: 4,
        category_id: dinnerCategory,
        cuisine_id: kenyanCuisine,
        instructions: [
          'Boil water in a large pot',
          'Gradually add maize flour while stirring',
          'Continue stirring until thick and smooth',
          'Wash and chop sukuma wiki',
          'Cook sukuma wiki with onions and tomatoes',
          'Serve ugali with sukuma wiki'
        ],
        image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        dietary_restrictions: ['vegetarian', 'vegan', 'gluten_free'],
        is_featured: true,
        is_published: true
      },
      {
        title: 'Nyama Choma',
        description: 'Grilled meat, a Kenyan favorite',
        difficulty: 'medium',
        prep_time_minutes: 30,
        cook_time_minutes: 45,
        total_time_minutes: 75,
        servings: 6,
        category_id: dinnerCategory,
        cuisine_id: kenyanCuisine,
        instructions: [
          'Marinate meat with spices and herbs',
          'Prepare charcoal grill',
          'Grill meat until well done',
          'Serve with kachumbari and ugali'
        ],
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947',
        dietary_restrictions: [],
        is_featured: true,
        is_published: true
      },
      {
        title: 'Chapati',
        description: 'Soft flatbread, perfect with any meal',
        difficulty: 'medium',
        prep_time_minutes: 20,
        cook_time_minutes: 15,
        total_time_minutes: 35,
        servings: 8,
        category_id: dinnerCategory,
        cuisine_id: kenyanCuisine,
        instructions: [
          'Mix flour, water, and oil to make dough',
          'Knead dough until smooth',
          'Divide into balls and roll flat',
          'Cook on hot griddle until golden'
        ],
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b',
        dietary_restrictions: ['vegetarian'],
        is_featured: false,
        is_published: true
      },
      {
        title: 'Spaghetti Carbonara',
        description: 'Classic Italian pasta with eggs and cheese',
        difficulty: 'medium',
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        total_time_minutes: 25,
        servings: 4,
        category_id: dinnerCategory,
        cuisine_id: italianCuisine,
        instructions: [
          'Cook spaghetti according to package directions',
          'Fry pancetta until crispy',
          'Mix eggs and cheese in a bowl',
          'Combine hot pasta with egg mixture',
          'Add pancetta and black pepper'
        ],
        image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5',
        dietary_restrictions: [],
        is_featured: true,
        is_published: true
      },
      {
        title: 'Kung Pao Chicken',
        description: 'Spicy Chinese chicken with peanuts',
        difficulty: 'medium',
        prep_time_minutes: 20,
        cook_time_minutes: 10,
        total_time_minutes: 30,
        servings: 4,
        category_id: dinnerCategory,
        cuisine_id: chineseCuisine,
        instructions: [
          'Marinate chicken with soy sauce and cornstarch',
          'Stir-fry chicken until golden',
          'Add vegetables and sauce',
          'Garnish with peanuts and green onions'
        ],
        image_url: 'https://images.unsplash.com/photo-1563379091339-03246963d4a9',
        dietary_restrictions: [],
        is_featured: false,
        is_published: true
      },
      {
        title: 'Butter Chicken',
        description: 'Creamy Indian curry with tender chicken',
        difficulty: 'medium',
        prep_time_minutes: 25,
        cook_time_minutes: 35,
        total_time_minutes: 60,
        servings: 6,
        category_id: dinnerCategory,
        cuisine_id: indianCuisine,
        instructions: [
          'Marinate chicken in yogurt and spices',
          'Grill or bake chicken until charred',
          'Prepare creamy tomato sauce',
          'Simmer chicken in sauce until tender'
        ],
        image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641',
        dietary_restrictions: [],
        is_featured: true,
        is_published: true
      },
      {
        title: 'Tacos al Pastor',
        description: 'Mexican pork tacos with pineapple',
        difficulty: 'hard',
        prep_time_minutes: 30,
        cook_time_minutes: 45,
        total_time_minutes: 75,
        servings: 6,
        category_id: dinnerCategory,
        cuisine_id: mexicanCuisine,
        instructions: [
          'Marinate pork with achiote and spices',
          'Stack meat on vertical spit',
          'Grill with pineapple until charred',
          'Serve in corn tortillas with salsa'
        ],
        image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47',
        dietary_restrictions: [],
        is_featured: false,
        is_published: true
      },
      {
        title: 'Avocado Toast',
        description: 'Healthy breakfast with smashed avocado',
        difficulty: 'easy',
        prep_time_minutes: 5,
        cook_time_minutes: 5,
        total_time_minutes: 10,
        servings: 2,
        category_id: breakfastCategory,
        cuisine_id: null,
        instructions: [
          'Toast bread until golden',
          'Mash ripe avocado with salt and pepper',
          'Spread avocado on toast',
          'Top with red pepper flakes and olive oil'
        ],
        image_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d',
        dietary_restrictions: ['vegetarian', 'vegan'],
        is_featured: false,
        is_published: true
      },
      {
        title: 'Caesar Salad',
        description: 'Classic salad with romaine and parmesan',
        difficulty: 'easy',
        prep_time_minutes: 15,
        cook_time_minutes: 0,
        total_time_minutes: 15,
        servings: 4,
        category_id: lunchCategory,
        cuisine_id: null,
        instructions: [
          'Wash and chop romaine lettuce',
          'Make Caesar dressing with anchovies and garlic',
          'Toss lettuce with dressing',
          'Top with croutons and parmesan cheese'
        ],
        image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1',
        dietary_restrictions: ['vegetarian'],
        is_featured: false,
        is_published: true
      },
      {
        title: 'Chocolate Chip Cookies',
        description: 'Classic homemade chocolate chip cookies',
        difficulty: 'easy',
        prep_time_minutes: 15,
        cook_time_minutes: 12,
        total_time_minutes: 27,
        servings: 24,
        category_id: dessertsCategory,
        cuisine_id: null,
        instructions: [
          'Cream butter and sugars together',
          'Add eggs and vanilla',
          'Mix in flour and chocolate chips',
          'Bake at 375°F for 10-12 minutes'
        ],
        image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e',
        dietary_restrictions: ['vegetarian'],
        is_featured: true,
        is_published: true
      }
    ];

    // Insert sample recipes
    const { data, error } = await supabase
      .from('recipes')
      .insert(sampleRecipes)
      .select();

    if (error) {
      console.error('Error creating sample recipes:', error);
    } else {
      console.log('Sample recipes created successfully:', data);
    }
  } catch (error) {
    console.error('Error in createSampleRecipes:', error);
  }
}; 