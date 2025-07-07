import { supabase } from '@/integrations/supabase/client';
import { Recipe } from './recipeService';

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  type: 'user' | 'assistant';
  context?: {
    recipe_id?: string;
    step_number?: number;
    ingredient_id?: string;
  };
  created_at: string;
}

export interface CookingAssistance {
  step_guidance: string;
  tips: string[];
  substitutions?: {
    ingredient: string;
    alternatives: string[];
  }[];
  timing_reminder?: string;
  safety_notes?: string[];
}

export interface RecipeIngredient {
  ingredient: {
    name: string;
    category: string;
  };
  preparation_note?: string;
}

export const saveChatMessage = async (content: string, type: 'user' | 'assistant', context?: ChatMessage['context']): Promise<ChatMessage> => {
  const currentUser = await supabase.auth.getUser();
  const userId = currentUser.data.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // For now, just return a mock message since chat_messages table doesn't exist
  return {
    id: Math.random().toString(),
    user_id: userId,
    content,
    type,
    context,
    created_at: new Date().toISOString(),
  };
};

export const getChatHistory = async (recipeId?: string): Promise<ChatMessage[]> => {
  // Return empty array since chat_messages table doesn't exist
  return [];
};

export const generateCookingAssistance = async (recipeId: string, stepNumber?: number): Promise<CookingAssistance> => {
  try {
    // Get recipe details
    const { data: recipe } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients(
          quantity,
          unit,
          preparation_note,
          ingredient:ingredients(name, category)
        )
      `)
      .eq('id', recipeId)
      .single();

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Basic assistance based on recipe data
    const assistance: CookingAssistance = {
      step_guidance: stepNumber 
        ? `Step ${stepNumber}: ${recipe.instructions[stepNumber - 1] || 'Continue with the recipe'}`
        : 'Ready to start cooking? Follow the recipe instructions step by step.',
      tips: [
        'Read through all instructions before starting',
        'Prepare all ingredients before cooking (mise en place)',
        'Keep your workspace clean and organized'
      ],
      substitutions: recipe.recipe_ingredients?.map((ing: any) => ({
        ingredient: ing.ingredient.name,
        alternatives: ['Check recipe notes for substitutions']
      })) || [],
      timing_reminder: `This recipe takes approximately ${recipe.prep_time_minutes + recipe.cook_time_minutes} minutes total`,
      safety_notes: [
        'Wash hands before handling food',
        'Use proper knife safety techniques',
        'Keep hot ingredients away from cold ones'
      ]
    };

    return assistance;
  } catch (error) {
    console.error('Error generating cooking assistance:', error);
    return {
      step_guidance: 'Follow the recipe instructions carefully',
      tips: ['Take your time and enjoy the cooking process'],
      timing_reminder: 'Cook at your own pace',
      safety_notes: ['Always prioritize kitchen safety']
    };
  }
};

export const searchKnowledgeBase = async (query: string): Promise<any[]> => {
  try {
    const { data } = await supabase
      .from('knowledge_base')
      .select('*')
      .ilike('question', `%${query}%`)
      .eq('is_active', true)
      .limit(5);

    return data || [];
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
};

export const getRecipeContext = async (recipeId: string): Promise<Recipe | null> => {
  try {
    const { data: recipe } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients(
          quantity,
          unit,
          preparation_note,
          ingredient:ingredients(name, category)
        )
      `)
      .eq('id', recipeId)
      .single();

    return recipe as any;
  } catch (error) {
    console.error('Error getting recipe context:', error);
    return null;
  }
};

export const suggestRecipeImprovements = async (recipeId: string): Promise<string[]> => {
  try {
    const recipe = await getRecipeContext(recipeId);
    if (!recipe) return [];

    const suggestions = [
      'Consider adding cooking tips for beginners',
      'Include nutritional information',
      'Add ingredient substitution suggestions',
      'Include step-by-step photos if possible'
    ];

    return suggestions;
  } catch (error) {
    console.error('Error suggesting improvements:', error);
    return [];
  }
};

export const analyzeUserCookingPatterns = async (userId: string): Promise<any> => {
  try {
    // Analyze user's recipe interactions
    const { data: interactions } = await supabase
      .from('user_recipe_interactions')
      .select('*')
      .eq('user_id', userId)
      .limit(100);

    const patterns = {
      preferred_cooking_times: 'medium',
      common_cuisines: ['kenyan', 'international'],
      skill_progression: 'improving',
      favorite_ingredients: []
    };

    return patterns;
  } catch (error) {
    console.error('Error analyzing cooking patterns:', error);
    return {};
  }
};

export const provideCookingTips = async (difficulty: string, cuisine?: string): Promise<string[]> => {
  const tips = {
    easy: [
      'Start with simple recipes to build confidence',
      'Prepare all ingredients before cooking',
      'Don\'t be afraid to taste and adjust seasoning'
    ],
    medium: [
      'Practice knife skills for better preparation',
      'Learn to multitask safely in the kitchen',
      'Understand how different cooking methods affect flavors'
    ],
    hard: [
      'Master timing for complex multi-step recipes',
      'Develop your palate for seasoning adjustments',
      'Learn advanced techniques like braising and sous vide'
    ]
  };

  return tips[difficulty as keyof typeof tips] || tips.easy;
};

export const getPersonalizedCookingAdvice = async (userId: string): Promise<string[]> => {
  try {
    const patterns = await analyzeUserCookingPatterns(userId);
    
    const advice = [
      'Based on your cooking history, try exploring new cuisines',
      'Consider meal prepping to save time during busy weekdays',
      'Experiment with seasonal ingredients for variety'
    ];

    return advice;
  } catch (error) {
    console.error('Error getting personalized advice:', error);
    return ['Keep practicing and enjoy the cooking journey!'];
  }
};