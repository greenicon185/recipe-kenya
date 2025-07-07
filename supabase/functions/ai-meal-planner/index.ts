import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));
    const { user_id, week_start, preferences = {} } = await req.json();

    console.log(`Generating AI meal plan for user ${user_id}, week ${week_start}`);

    // 1. Get user profile and constraints
    const [userProfile, nutritionTargets, constraints] = await Promise.all([
      getUserProfile(supabase, user_id),
      getNutritionTargets(supabase, user_id),
      getMealPlanningConstraints(supabase, user_id)
    ]);

    // 2. Generate meal plan using AI optimization
    const mealPlan = await generateOptimalMealPlan(
      supabase, hf, user_id, week_start, userProfile, nutritionTargets, constraints, preferences
    );

    // 3. Validate and optimize the meal plan
    const optimizedPlan = await optimizeMealPlan(supabase, mealPlan, nutritionTargets, constraints);

    // 4. Save the meal plan
    const savedPlan = await saveMealPlan(supabase, user_id, week_start, optimizedPlan);

    return new Response(JSON.stringify({ 
      meal_plan: optimizedPlan,
      meal_plan_id: savedPlan.id,
      optimization_summary: savedPlan.optimization_summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI meal planner:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred while generating meal plan',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateOptimalMealPlan(
  supabase: any, hf: any, userId: string, weekStart: string, 
  userProfile: any, nutritionTargets: any, constraints: any[], preferences: any
) {
  console.log('Generating optimal meal plan with AI');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  // Get candidate recipes for each meal type
  const candidateRecipes = await getCandidateRecipes(supabase, userProfile, preferences, constraints);
  
  const mealPlan = [];
  const weeklyNutrition = initializeWeeklyNutrition();
  const usedRecipes = new Set();
  const ingredientUsage = new Map();

  for (const day of days) {
    const dailyMeals = {};
    const dailyNutrition = initializeDailyNutrition();

    for (const mealType of mealTypes) {
      const targetCalories = calculateMealCalories(nutritionTargets, mealType);
      
      // Use AI to select the best recipe for this meal slot
      const selectedRecipe = await selectOptimalRecipe(
        hf, candidateRecipes[mealType], {
          targetCalories,
          dailyNutrition,
          weeklyNutrition,
          usedRecipes,
          ingredientUsage,
          day,
          mealType,
          userProfile,
          constraints,
          preferences
        }
      );

      if (selectedRecipe) {
        dailyMeals[mealType] = selectedRecipe;
        updateNutritionTracking(dailyNutrition, weeklyNutrition, selectedRecipe);
        updateIngredientUsage(ingredientUsage, selectedRecipe);
        
        // Limit recipe repetition based on preferences
        if (preferences.cuisine_variety) {
          usedRecipes.add(selectedRecipe.id);
        }

        mealPlan.push({
          day,
          meal_type: mealType,
          recipe_id: selectedRecipe.id,
          recipe_title: selectedRecipe.title,
          recipe_image: selectedRecipe.image_url,
          nutritional_score: selectedRecipe.nutritional_score,
          variety_score: selectedRecipe.variety_score,
          preference_match: selectedRecipe.preference_match,
          total_score: selectedRecipe.total_score,
          servings: calculateOptimalServings(selectedRecipe, targetCalories)
        });
      }
    }
  }

  return mealPlan;
}

async function selectOptimalRecipe(hf: any, candidates: any[], context: any) {
  if (!candidates.length) return null;

  // Score each candidate recipe using AI and constraints
  const scoredCandidates = await Promise.all(
    candidates.map(async (recipe) => {
      const scores = await calculateMealPlanScore(hf, recipe, context);
      return {
        ...recipe,
        ...scores,
        total_score: scores.nutritional_score * 0.4 + 
                    scores.variety_score * 0.3 + 
                    scores.preference_match * 0.3
      };
    })
  );

  // Apply constraint filtering
  const validCandidates = scoredCandidates.filter(recipe => 
    satisfiesHardConstraints(recipe, context.constraints)
  );

  if (!validCandidates.length) {
    console.warn('No recipes satisfy hard constraints, using soft constraints only');
    return scoredCandidates.sort((a, b) => b.total_score - a.total_score)[0];
  }

  // Return the highest scoring valid recipe
  return validCandidates.sort((a, b) => b.total_score - a.total_score)[0];
}

async function calculateMealPlanScore(hf: any, recipe: any, context: any) {
  // Nutritional score - how well does this fit the meal's nutritional targets
  const nutritionalScore = calculateNutritionalFit(recipe, context);
  
  // Variety score - how diverse is this choice
  const varietyScore = calculateVarietyScore(recipe, context);
  
  // Preference match - how well does this match user preferences
  const preferenceMatch = await calculatePreferenceMatch(hf, recipe, context);

  return {
    nutritional_score: nutritionalScore,
    variety_score: varietyScore,
    preference_match: preferenceMatch
  };
}

function calculateNutritionalFit(recipe: any, context: any) {
  const targetCalories = context.targetCalories;
  const recipeCalories = recipe.nutritional_info?.calories || 400; // Default estimate
  
  // Score based on how close the calories are to target
  const caloriesDiff = Math.abs(recipeCalories - targetCalories);
  const caloriesScore = Math.max(0, 1 - (caloriesDiff / targetCalories));
  
  // Additional nutritional balance scoring could be added here
  
  return caloriesScore;
}

function calculateVarietyScore(recipe: any, context: any) {
  let score = 1.0;
  
  // Penalize if recipe was used recently
  if (context.usedRecipes.has(recipe.id)) {
    score *= 0.3; // Heavy penalty for repetition
  }
  
  // Bonus for ingredient diversity
  const ingredientOverlap = calculateIngredientOverlap(recipe, context.ingredientUsage);
  score *= (1 - ingredientOverlap * 0.5); // Penalize ingredient repetition
  
  // Cuisine variety bonus
  const cuisineFrequency = getCuisineFrequency(recipe.cuisine?.name, context);
  if (cuisineFrequency > 2) score *= 0.7; // Penalize over-used cuisines
  
  return Math.max(0.1, score);
}

async function calculatePreferenceMatch(hf: any, recipe: any, context: any) {
  const userProfile = context.userProfile;
  let score = 0.5; // Base score

  // Dietary restrictions
  if (userProfile.dietary_restrictions?.length > 0) {
    const hasConflict = userProfile.dietary_restrictions.some((restriction: string) =>
      recipe.dietary_restrictions && !recipe.dietary_restrictions.includes(restriction)
    );
    if (hasConflict) return 0.1; // Very low score for dietary conflicts
    score += 0.2;
  }

  // Preferred cuisines
  if (userProfile.favorite_cuisines?.includes(recipe.cuisine?.name)) {
    score += 0.3;
  }

  // Cooking time preferences
  if (userProfile.cooking_time_preference === 'quick' && recipe.total_time_minutes <= 30) {
    score += 0.2;
  } else if (userProfile.cooking_time_preference === 'elaborate' && recipe.total_time_minutes >= 60) {
    score += 0.2;
  }

  return Math.min(1.0, score);
}

function satisfiesHardConstraints(recipe: any, constraints: any[]) {
  const hardConstraints = constraints.filter(c => c.is_hard_constraint);
  
  for (const constraint of hardConstraints) {
    if (!satisfiesConstraint(recipe, constraint)) {
      return false;
    }
  }
  
  return true;
}

function satisfiesConstraint(recipe: any, constraint: any) {
  switch (constraint.constraint_type) {
    case 'max_prep_time':
      return recipe.prep_time_minutes <= constraint.constraint_value.max_minutes;
    
    case 'max_total_time':
      return recipe.total_time_minutes <= constraint.constraint_value.max_minutes;
    
    case 'ingredient_blacklist':
      const blacklist = constraint.constraint_value.ingredients || [];
      return !recipe.ingredients?.some((ing: string) => 
        blacklist.some((black: string) => ing.toLowerCase().includes(black.toLowerCase()))
      );
    
    case 'cuisine_blacklist':
      const cuisineBlacklist = constraint.constraint_value.cuisines || [];
      return !cuisineBlacklist.includes(recipe.cuisine?.name);
    
    case 'max_difficulty':
      const difficultyMap = { easy: 1, medium: 2, hard: 3 };
      const maxDifficulty = difficultyMap[constraint.constraint_value.level] || 3;
      const recipeDifficulty = difficultyMap[recipe.difficulty] || 2;
      return recipeDifficulty <= maxDifficulty;
    
    default:
      return true;
  }
}

async function optimizeMealPlan(supabase: any, mealPlan: any[], nutritionTargets: any, constraints: any[]) {
  console.log('Optimizing meal plan');
  
  // Calculate nutrition summary
  const nutritionSummary = calculateWeeklyNutrition(mealPlan);
  
  // Check for optimization opportunities
  const optimizations = [];
  
  // Nutrition balance optimization
  if (nutritionTargets.daily_calories) {
    const avgCalories = nutritionSummary.total_calories / 7;
    const caloriesDiff = Math.abs(avgCalories - nutritionTargets.daily_calories);
    if (caloriesDiff > nutritionTargets.daily_calories * 0.1) {
      optimizations.push(`Calorie target variance: ${caloriesDiff.toFixed(0)} calories/day`);
    }
  }
  
  // Variety optimization
  const cuisineVariety = calculateCuisineVariety(mealPlan);
  if (cuisineVariety < 3) {
    optimizations.push('Consider adding more cuisine variety');
  }
  
  // Ingredient efficiency optimization
  const ingredientEfficiency = calculateIngredientEfficiency(mealPlan);
  optimizations.push(`Ingredient efficiency: ${(ingredientEfficiency * 100).toFixed(1)}%`);
  
  return mealPlan.map(meal => ({
    ...meal,
    optimization_notes: optimizations
  }));
}

async function saveMealPlan(supabase: any, userId: string, weekStart: string, mealPlan: any[]) {
  // Save weekly meal plan
  const { data: weeklyPlan, error } = await supabase
    .from('weekly_meal_plans')
    .insert({
      user_id: userId,
      week_start: weekStart,
      name: `AI Generated Plan - Week of ${weekStart}`,
      plan_data: {
        meals: mealPlan,
        generated_at: new Date().toISOString(),
        generation_method: 'ai_optimized'
      }
    })
    .select()
    .single();

  if (error) throw error;

  // Save individual meal plans for backward compatibility
  const mealPlanInserts = mealPlan.map(meal => ({
    user_id: userId,
    recipe_id: meal.recipe_id,
    day: meal.day,
    meal_type: meal.meal_type
  }));

  await supabase.from('meal_plans').insert(mealPlanInserts);

  return {
    id: weeklyPlan.id,
    optimization_summary: {
      total_meals: mealPlan.length,
      cuisine_variety: calculateCuisineVariety(mealPlan),
      ingredient_efficiency: calculateIngredientEfficiency(mealPlan),
      nutrition_balance: calculateNutritionBalance(mealPlan)
    }
  };
}

// Helper functions
async function getUserProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_preferences_v2')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data || {};
}

async function getNutritionTargets(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_nutrition_targets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data || {
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 250,
    daily_fat: 70,
    meal_distribution: { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 }
  };
}

async function getMealPlanningConstraints(supabase: any, userId: string) {
  const { data } = await supabase
    .from('meal_planning_constraints')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: false });
  
  return data || [];
}

async function getCandidateRecipes(supabase: any, userProfile: any, preferences: any, constraints: any[]) {
  const baseQuery = supabase
    .from('recipes')
    .select(`
      id, title, image_url, difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes,
      ingredients, nutritional_info, dietary_restrictions,
      cuisine:cuisines(name),
      category:recipe_categories(name)
    `)
    .eq('is_published', true);

  // Apply dietary restrictions
  let query = baseQuery;
  if (userProfile.dietary_restrictions?.length > 0) {
    query = query.overlaps('dietary_restrictions', userProfile.dietary_restrictions);
  }

  const { data: allRecipes } = await query.limit(200);
  if (!allRecipes) return { breakfast: [], lunch: [], dinner: [], snack: [] };

  // Categorize recipes by meal type
  const categorized = {
    breakfast: allRecipes.filter(r => isBreakfastSuitable(r)),
    lunch: allRecipes.filter(r => isLunchSuitable(r)),
    dinner: allRecipes.filter(r => isDinnerSuitable(r)),
    snack: allRecipes.filter(r => isSnackSuitable(r))
  };

  return categorized;
}

function isBreakfastSuitable(recipe: any) {
  const category = recipe.category?.name?.toLowerCase() || '';
  const title = recipe.title?.toLowerCase() || '';
  
  return category.includes('breakfast') || 
         title.includes('breakfast') ||
         title.includes('pancake') ||
         title.includes('omelet') ||
         recipe.total_time_minutes <= 30;
}

function isLunchSuitable(recipe: any) {
  return recipe.total_time_minutes <= 60 && !isBreakfastSuitable(recipe);
}

function isDinnerSuitable(recipe: any) {
  const category = recipe.category?.name?.toLowerCase() || '';
  return category.includes('dinner') || 
         category.includes('main') ||
         recipe.total_time_minutes >= 30;
}

function isSnackSuitable(recipe: any) {
  const category = recipe.category?.name?.toLowerCase() || '';
  return category.includes('snack') ||
         category.includes('appetizer') ||
         recipe.total_time_minutes <= 20;
}

function calculateMealCalories(nutritionTargets: any, mealType: string) {
  const distribution = nutritionTargets.meal_distribution || {
    breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10
  };
  
  const dailyCalories = nutritionTargets.daily_calories || 2000;
  return dailyCalories * (distribution[mealType] || 0.25);
}

function initializeWeeklyNutrition() {
  return {
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0
  };
}

function initializeDailyNutrition() {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
}

function updateNutritionTracking(dailyNutrition: any, weeklyNutrition: any, recipe: any) {
  const nutrition = recipe.nutritional_info || {};
  
  dailyNutrition.calories += nutrition.calories || 0;
  dailyNutrition.protein += nutrition.protein || 0;
  dailyNutrition.carbs += nutrition.carbohydrates || 0;
  dailyNutrition.fat += nutrition.fat || 0;
  
  weeklyNutrition.total_calories += nutrition.calories || 0;
  weeklyNutrition.total_protein += nutrition.protein || 0;
  weeklyNutrition.total_carbs += nutrition.carbohydrates || 0;
  weeklyNutrition.total_fat += nutrition.fat || 0;
}

function updateIngredientUsage(ingredientUsage: Map<string, number>, recipe: any) {
  recipe.ingredients?.forEach((ingredient: string) => {
    const current = ingredientUsage.get(ingredient) || 0;
    ingredientUsage.set(ingredient, current + 1);
  });
}

function calculateOptimalServings(recipe: any, targetCalories: number) {
  const recipeCalories = recipe.nutritional_info?.calories || 400;
  const baseServings = recipe.servings || 4;
  const caloriesPerServing = recipeCalories / baseServings;
  
  return Math.max(1, Math.round(targetCalories / caloriesPerServing));
}

function calculateIngredientOverlap(recipe: any, ingredientUsage: Map<string, number>) {
  if (!recipe.ingredients?.length) return 0;
  
  let overlapCount = 0;
  recipe.ingredients.forEach((ingredient: string) => {
    if (ingredientUsage.has(ingredient)) {
      overlapCount++;
    }
  });
  
  return overlapCount / recipe.ingredients.length;
}

function getCuisineFrequency(cuisine: string, context: any) {
  // This would need to be implemented based on the current meal plan context
  return 0;
}

function calculateWeeklyNutrition(mealPlan: any[]) {
  return mealPlan.reduce((total, meal) => {
    const nutrition = meal.nutritional_info || {};
    return {
      total_calories: total.total_calories + (nutrition.calories || 0),
      total_protein: total.total_protein + (nutrition.protein || 0),
      total_carbs: total.total_carbs + (nutrition.carbohydrates || 0),
      total_fat: total.total_fat + (nutrition.fat || 0)
    };
  }, { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
}

function calculateCuisineVariety(mealPlan: any[]) {
  const cuisines = new Set(mealPlan.map(meal => meal.cuisine?.name).filter(Boolean));
  return cuisines.size;
}

function calculateIngredientEfficiency(mealPlan: any[]) {
  const allIngredients = new Set();
  const uniqueIngredients = new Set();
  
  mealPlan.forEach(meal => {
    meal.ingredients?.forEach((ingredient: string) => {
      allIngredients.add(ingredient);
      uniqueIngredients.add(ingredient);
    });
  });
  
  return uniqueIngredients.size / Math.max(1, allIngredients.size);
}

function calculateNutritionBalance(mealPlan: any[]) {
  const nutrition = calculateWeeklyNutrition(mealPlan);
  const avgDaily = {
    calories: nutrition.total_calories / 7,
    protein: nutrition.total_protein / 7,
    carbs: nutrition.total_carbs / 7,
    fat: nutrition.total_fat / 7
  };
  
  // Simple balance score based on recommended ratios
  const proteinPercent = (avgDaily.protein * 4) / avgDaily.calories;
  const carbPercent = (avgDaily.carbs * 4) / avgDaily.calories;
  const fatPercent = (avgDaily.fat * 9) / avgDaily.calories;
  
  const idealProtein = 0.25; // 25% of calories from protein
  const idealCarb = 0.45;    // 45% of calories from carbs
  const idealFat = 0.30;     // 30% of calories from fat
  
  const balance = 1 - (
    Math.abs(proteinPercent - idealProtein) +
    Math.abs(carbPercent - idealCarb) +
    Math.abs(fatPercent - idealFat)
  ) / 3;
  
  return Math.max(0, balance);
}