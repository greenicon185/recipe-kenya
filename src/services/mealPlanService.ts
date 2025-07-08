import { supabase } from '@/integrations/supabase/client';
import { Recipe } from './recipeService';

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  notes?: string;
  recipe?: {
    title: string;
    image_url: string;
  };
}

export const getMealPlans = async (userId: string) => {
  const { data: mealPlans, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipe:recipes(
        title,
        image_url
      )
    `)
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) throw error;
  return mealPlans?.map(plan => ({
    ...plan,
    date: plan.day,
    servings: 1
  })) as MealPlan[];
};

export const addMealPlan = async (
  userId: string,
  recipeId: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  servings: number = 1,
  notes?: string
) => {
  const { data: mealPlan, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      recipe_id: recipeId,
      day: date,
      meal_type: mealType,
    })
    .select(`
      *,
      recipe:recipes(
        title,
        image_url
      )
    `)
    .single();

  if (error) throw error;
  return {
    ...mealPlan,
    date: mealPlan.day,
    servings: 1
  } as MealPlan;
};

export const updateMealPlan = async (
  id: string,
  data: Partial<MealPlan>
) => {
  const { data: mealPlan, error } = await supabase
    .from('meal_plans')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      recipe:recipes(
        title,
        image_url
      )
    `)
    .single();

  if (error) throw error;
  return {
    ...mealPlan,
    date: mealPlan.day,
    servings: 1
  } as MealPlan;
};

export const removeMealPlan = async (id: string) => {
  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getMealPlanByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
) => {
  const { data: mealPlans, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipe:recipes(
        title,
        image_url
      )
    `)
    .eq('user_id', userId)
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

export const generateShoppingListFromMealPlan = async (
  userId: string,
  startDate: string,
  endDate: string
) => {
  // Get all meal plans in the date range
  const mealPlans = await getMealPlanByDateRange(userId, startDate, endDate);

  // Get all unique recipe IDs
  const recipeIds = [...new Set(mealPlans.map(plan => plan.recipe_id))];

  // Get all recipes with their ingredients
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select(`
      id,
      recipe_ingredients(
        id,
        quantity,
        unit,
        ingredient:ingredients(
          id,
          name
        )
      )
    `)
    .in('id', recipeIds);

  if (error) throw error;

  // Create a new shopping list
  const { data: shoppingList, error: shoppingListError } = await supabase
    .from('shopping_lists')
    .insert({
      name: `Shopping List for ${startDate} to ${endDate}`,
      user_id: userId,
    })
    .select()
    .single();

  if (shoppingListError) throw shoppingListError;

  // Add ingredients to shopping list
  const shoppingListItems = recipes.flatMap(recipe => {
    const recipeMealPlans = mealPlans.filter(plan => plan.recipe_id === recipe.id);
    const totalServings = recipeMealPlans.reduce((sum, plan) => sum + plan.servings, 0);

    return recipe.recipe_ingredients.map(ingredient => ({
      shopping_list_id: shoppingList.id,
      ingredient_id: ingredient.ingredient.id,
      quantity: ingredient.quantity * totalServings,
      unit: ingredient.unit,
      recipe_id: recipe.id,
      is_checked: false,
    }));
  });

  const { error: itemsError } = await supabase
    .from('shopping_list_items')
    .insert(shoppingListItems);

  if (itemsError) throw itemsError;

  return shoppingList;
}; 