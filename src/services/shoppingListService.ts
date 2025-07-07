import { supabase } from '@/integrations/supabase/client';
import { RecipeIngredient } from '@/services/recipeService';

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  recipe_id?: string;
  custom_note?: string;
  ingredient?: {
    name: string;
    category: string;
  };
  recipe?: {
    title: string;
  };
}

export const createShoppingList = async (name: string) => {
  const { data: list, error } = await supabase
    .from('shopping_lists')
    .insert({
      name,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return list as ShoppingList;
};

export const getShoppingLists = async () => {
  const { data: lists, error } = await supabase
    .from('shopping_lists')
    .select(`
      *,
      items:shopping_list_items(
        *,
        ingredient:ingredients(name, category),
        recipe:recipes(title)
      )
    `)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return lists as ShoppingList[];
};

export const addRecipeToShoppingList = async (
  shoppingListId: string,
  recipeId: string,
  ingredients: RecipeIngredient[],
  servings: number = 1
) => {
  const items = ingredients.map((ingredient) => ({
    shopping_list_id: shoppingListId,
    ingredient_id: ingredient.ingredient.id,
    quantity: ingredient.quantity * servings,
    unit: ingredient.unit,
    recipe_id: recipeId,
    is_checked: false,
  }));

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert(items)
    .select();

  if (error) throw error;
  return data;
};

export const addCustomItemToShoppingList = async (
  shoppingListId: string,
  data: {
    ingredient_id: string;
    quantity: number;
    unit: string;
    custom_note?: string;
  }
) => {
  const { data: item, error } = await supabase
    .from('shopping_list_items')
    .insert({
      shopping_list_id: shoppingListId,
      ...data,
      is_checked: false,
    })
    .select()
    .single();

  if (error) throw error;
  return item as ShoppingListItem;
};

export const toggleShoppingListItem = async (itemId: string, isChecked: boolean) => {
  const { data: item, error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked: isChecked })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return item as ShoppingListItem;
};

export const removeShoppingListItem = async (itemId: string) => {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
};

export const deleteShoppingList = async (id: string) => {
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const clearCheckedItems = async (shoppingListId: string) => {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .match({
      shopping_list_id: shoppingListId,
      is_checked: true,
    });

  if (error) throw error;
};

export const optimizeShoppingList = async (shoppingListId: string) => {
  // Get all items in the list
  const { data: items, error } = await supabase
    .from('shopping_list_items')
    .select(`
      *,
      ingredient:ingredients(name, category)
    `)
    .eq('shopping_list_id', shoppingListId)
    .eq('is_checked', false);

  if (error) throw error;

  // Group items by ingredient and combine quantities where units match
  const groupedItems = items.reduce((acc: any, item) => {
    const key = `${item.ingredient_id}-${item.unit}`;
    if (!acc[key]) {
      acc[key] = { ...item, quantity: 0 };
    }
    acc[key].quantity += item.quantity;
    return acc;
  }, {});

  // Update the items with combined quantities
  const updates = Object.values(groupedItems).map((item: any) => ({
    id: item.id,
    quantity: item.quantity,
  }));

  const { error: updateError } = await supabase
    .from('shopping_list_items')
    .upsert(updates);

  if (updateError) throw updateError;

  // Delete duplicate items
  const itemIds = Object.values(groupedItems).map((item: any) => item.id);
  const { error: deleteError } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('shopping_list_id', shoppingListId)
    .not('id', 'in', itemIds);

  if (deleteError) throw deleteError;
}; 