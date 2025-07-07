import { supabase } from '@/integrations/supabase/client';

export interface Supermarket {
  id: string;
  name: string;
  description: string;
  website_url: string;
  logo_url: string;
  location: string;
  is_active: boolean;
}

export interface SupermarketIngredient {
  id: string;
  supermarket_id: string;
  ingredient_id: string;
  price: number;
  currency: string;
  unit: string;
  quantity: number;
  product_url: string;
  in_stock: boolean;
  last_updated: string;
  ingredient?: {
    name: string;
    description: string;
  };
  supermarket?: {
    name: string;
    logo_url: string;
  };
}

export const getSupermarkets = async () => {
  const { data, error } = await supabase
    .from('supermarkets')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as Supermarket[];
};

export const getSupermarketIngredients = async (
  supermarketId: string,
  options?: {
    inStockOnly?: boolean;
    ingredientIds?: string[];
  }
) => {
  let query = supabase
    .from('supermarket_ingredients')
    .select(`
      *,
      ingredient:ingredients(name, description),
      supermarket:supermarkets(name, logo_url)
    `)
    .eq('supermarket_id', supermarketId);

  if (options?.inStockOnly) {
    query = query.eq('in_stock', true);
  }

  if (options?.ingredientIds) {
    query = query.in('ingredient_id', options.ingredientIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as SupermarketIngredient[];
};

export const getIngredientAvailability = async (ingredientId: string) => {
  const { data, error } = await supabase
    .from('supermarket_ingredients')
    .select(`
      *,
      supermarket:supermarkets(name, logo_url)
    `)
    .eq('ingredient_id', ingredientId)
    .eq('in_stock', true)
    .order('price');

  if (error) throw error;
  return data as SupermarketIngredient[];
};

export const updateSupermarketIngredient = async (
  supermarketId: string,
  ingredientId: string,
  data: Partial<SupermarketIngredient>
) => {
  const { data: updatedData, error } = await supabase
    .from('supermarket_ingredients')
    .update(data)
    .eq('supermarket_id', supermarketId)
    .eq('ingredient_id', ingredientId)
    .select()
    .single();

  if (error) throw error;
  return updatedData as SupermarketIngredient;
}; 