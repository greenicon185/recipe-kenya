import { supabase } from '@/integrations/supabase/client';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  recipes?: { id: string; title: string; image_url: string }[];
}

export interface MealPlan {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id: string;
  servings: number;
  notes?: string;
  recipe?: {
    title: string;
    image_url: string;
  };
}

export const createCollection = async (data: {
  name: string;
  description?: string;
  is_public?: boolean;
}) => {
  const { data: collection, error } = await supabase
    .from('recipe_collections')
    .insert({
      ...data,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return collection as Collection;
};

export const getUserCollections = async () => {
  const { data: collections, error } = await supabase
    .from('recipe_collections')
    .select(`
      *,
      recipes:collection_recipes(
        recipe:recipes(
          id,
          title,
          image_url
        )
      )
    `)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return collections?.map(collection => ({
    ...collection,
    updated_at: collection.created_at,
    recipes: collection.recipes?.map((r: any) => r.recipe) || []
  })) as Collection[];
};

export const addRecipeToCollection = async (collectionId: string, recipeId: string) => {
  const { data, error } = await supabase
    .from('collection_recipes')
    .insert({
      collection_id: collectionId,
      recipe_id: recipeId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeRecipeFromCollection = async (collectionId: string, recipeId: string) => {
  const { error } = await supabase
    .from('collection_recipes')
    .delete()
    .match({
      collection_id: collectionId,
      recipe_id: recipeId,
    });

  if (error) throw error;
};

export const createMealPlan = async (data: {
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id: string;
  servings: number;
  notes?: string;
}) => {
  const { data: mealPlan, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      day: data.date,
      meal_type: data.meal_type,
      recipe_id: data.recipe_id,
    })
    .select()
    .single();

  if (error) throw error;
  return { 
    ...mealPlan, 
    date: mealPlan.day, 
    servings: 1 
  } as MealPlan;
};

export const getMealPlanByDateRange = async (startDate: string, endDate: string) => {
  const { data: mealPlans, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipe:recipes(
        title,
        image_url
      )
    `)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return mealPlans?.map(plan => ({
    ...plan,
    date: plan.day,
    servings: 1
  })) as MealPlan[];
};

export const updateMealPlan = async (id: string, data: Partial<MealPlan>) => {
  const { data: updatedMealPlan, error } = await supabase
    .from('meal_plans')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...updatedMealPlan,
    date: updatedMealPlan.day,
    servings: 1
  } as MealPlan;
};

export const deleteMealPlan = async (id: string) => {
  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', id);

  if (error) throw error;
}; 