import { supabase } from '@/integrations/supabase/client';

export interface RecommendationResult {
  recipe_id: string;
  score: number;
  reasons: string[];
  context: string;
}

export interface UserTasteProfile {
  id: string;
  user_id: string;
  profile_vector: number[];
  confidence_score: number;
  dominant_cuisines: string[];
  preferred_ingredients: string[];
  avoided_patterns: string[];
}

export interface MealPlanRecommendation {
  day: string;
  meal_type: string;
  recipe_id: string;
  recipe_title: string;
  nutritional_score: number;
  variety_score: number;
  preference_match: number;
  total_score: number;
}

// Enhanced recommendation service with multi-layered approach
export class AIRecipeService {
  
  // Track user interactions with enhanced context
  static async trackInteraction(
    recipeId: string,
    interactionType: 'view' | 'like' | 'cook' | 'rate' | 'save' | 'skip' | 'share',
    strength: number = 1.0,
    context: any = {}
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const sessionContext = {
        time_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        ...context
      };

      await supabase.from('user_recipe_interactions').insert({
        user_id: user.user.id,
        recipe_id: recipeId,
        interaction_type: interactionType,
        interaction_strength: strength,
        session_context: sessionContext
      });

      // Trigger AI profile update in background
      await this.updateUserTasteProfile(user.user.id);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  // Get AI-powered recommendations
  static async getPersonalizedRecommendations(
    userId: string,
    context: {
      limit?: number;
      meal_type?: string;
      time_of_day?: 'morning' | 'afternoon' | 'evening';
      weather?: string;
      occasion?: string;
    } = {}
  ): Promise<RecommendationResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          user_id: userId,
          context: {
            limit: context.limit || 10,
            meal_type: context.meal_type,
            time_of_day: context.time_of_day || this.getTimeOfDay(),
            weather: context.weather,
            occasion: context.occasion,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;
      return data.recommendations || [];
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      return this.getFallbackRecommendations(userId, context.limit || 10);
    }
  }

  // Get trending recipes with AI analysis
  static async getTrendingRecipes(limit: number = 10): Promise<RecommendationResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          type: 'trending',
          limit,
          context: {
            time_window: '7d', // last 7 days
            region: 'global'
          }
        }
      });

      if (error) throw error;
      return data.recommendations || [];
    } catch (error) {
      console.error('Error getting trending recipes:', error);
      return [];
    }
  }

  // Get recipe similarity using AI embeddings
  static async getSimilarRecipes(recipeId: string, limit: number = 5): Promise<RecommendationResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          type: 'similar',
          recipe_id: recipeId,
          limit
        }
      });

      if (error) throw error;
      return data.recommendations || [];
    } catch (error) {
      console.error('Error getting similar recipes:', error);
      return [];
    }
  }

  // Generate AI-powered meal plan
  static async generateMealPlan(
    userId: string,
    weekStart: string,
    preferences: {
      dietary_restrictions?: string[];
      budget_preference?: 'low' | 'medium' | 'high';
      cooking_time?: 'quick' | 'medium' | 'elaborate';
      cuisine_variety?: boolean;
      prep_optimization?: boolean;
    } = {}
  ): Promise<MealPlanRecommendation[]> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-meal-planner', {
        body: {
          user_id: userId,
          week_start: weekStart,
          preferences: {
            dietary_restrictions: preferences.dietary_restrictions || [],
            budget_preference: preferences.budget_preference || 'medium',
            cooking_time: preferences.cooking_time || 'medium',
            cuisine_variety: preferences.cuisine_variety !== false,
            prep_optimization: preferences.prep_optimization !== false,
            ...preferences
          }
        }
      });

      if (error) throw error;
      return data.meal_plan || [];
    } catch (error) {
      console.error('Error generating meal plan:', error);
      return [];
    }
  }

  // Update user taste profile based on interactions
  static async updateUserTasteProfile(userId: string) {
    try {
      await supabase.functions.invoke('ai-profile-updater', {
        body: { user_id: userId }
      });
    } catch (error) {
      console.error('Error updating taste profile:', error);
    }
  }

  // Get user's taste profile
  static async getUserTasteProfile(userId: string): Promise<UserTasteProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_taste_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting taste profile:', error);
      return null;
    }
  }

  // Provide feedback on meal plan
  static async provideMealPlanFeedback(
    mealPlanId: string,
    recipeId: string,
    feedback: {
      satisfaction_score: number;
      completion_rate: number;
      feedback_text?: string;
      feedback_tags?: string[];
      would_recommend?: boolean;
    }
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase.from('meal_plan_feedback').insert({
        user_id: user.user.id,
        meal_plan_id: mealPlanId,
        recipe_id: recipeId,
        ...feedback
      });

      // Update taste profile based on feedback
      await this.updateUserTasteProfile(user.user.id);
    } catch (error) {
      console.error('Error providing meal plan feedback:', error);
    }
  }

  // Set user nutrition targets
  static async setNutritionTargets(
    userId: string,
    targets: {
      daily_calories?: number;
      daily_protein?: number;
      daily_carbs?: number;
      daily_fat?: number;
      daily_fiber?: number;
      meal_distribution?: Record<string, number>;
    }
  ) {
    try {
      await supabase.from('user_nutrition_targets').upsert({
        user_id: userId,
        ...targets,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error setting nutrition targets:', error);
    }
  }

  // Set meal planning constraints
  static async setMealPlanningConstraints(
    userId: string,
    constraints: Array<{
      constraint_type: string;
      constraint_value: any;
      priority: number;
      is_hard_constraint: boolean;
    }>
  ) {
    try {
      // Clear existing constraints
      await supabase.from('meal_planning_constraints')
        .delete()
        .eq('user_id', userId);

      // Insert new constraints
      const constraintsWithUserId = constraints.map(c => ({
        ...c,
        user_id: userId
      }));

      await supabase.from('meal_planning_constraints')
        .insert(constraintsWithUserId);
    } catch (error) {
      console.error('Error setting meal planning constraints:', error);
    }
  }

  // Analyze recipe content with AI
  static async analyzeRecipeContent(recipeId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-recipe-analyzer', {
        body: { recipe_id: recipeId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error analyzing recipe content:', error);
      return null;
    }
  }

  // Helper methods
  private static getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private static async getFallbackRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    // Fallback to simple database query if AI fails
    try {
      const { data } = await supabase.rpc('get_user_recommendations', {
        p_user_id: userId,
        p_limit: limit
      });

      return (data || []).map((item: any) => ({
        recipe_id: item.recipe_id,
        score: item.recommendation_score,
        reasons: [item.recommendation_reason],
        context: 'fallback'
      }));
    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      return [];
    }
  }
}

// Convenience exports for backwards compatibility
export const getPersonalizedRecommendations = AIRecipeService.getPersonalizedRecommendations.bind(AIRecipeService);
export const getTrendingRecipes = AIRecipeService.getTrendingRecipes.bind(AIRecipeService);
export const generateMealPlan = AIRecipeService.generateMealPlan.bind(AIRecipeService);
export const trackRecipeInteraction = AIRecipeService.trackInteraction.bind(AIRecipeService);