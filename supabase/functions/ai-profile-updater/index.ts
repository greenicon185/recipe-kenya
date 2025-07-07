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
    const { user_id } = await req.json();

    console.log(`Updating taste profile for user ${user_id}`);

    // 1. Get user's interaction history
    const userInteractions = await getUserInteractions(supabase, user_id);
    
    if (userInteractions.length < 5) {
      console.log('Not enough interactions to build meaningful profile');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Insufficient data for profile update',
        interactions_count: userInteractions.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Analyze interaction patterns
    const interactionAnalysis = analyzeInteractionPatterns(userInteractions);

    // 3. Generate AI embeddings for liked recipes
    const tasteProfile = await generateTasteProfile(supabase, hf, user_id, userInteractions, interactionAnalysis);

    // 4. Update or create taste profile
    await updateTasteProfile(supabase, user_id, tasteProfile);

    // 5. Update recipe similarities based on new profile
    await updateRecipeSimilarities(supabase, hf, user_id, tasteProfile);

    return new Response(JSON.stringify({ 
      success: true,
      profile_updated: true,
      confidence_score: tasteProfile.confidence_score,
      dominant_cuisines: tasteProfile.dominant_cuisines,
      preferred_ingredients: tasteProfile.preferred_ingredients.slice(0, 10),
      interactions_analyzed: userInteractions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating taste profile:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred while updating taste profile',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUserInteractions(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_recipe_interactions')
    .select(`
      *,
      recipes!inner(
        id, title, description, ingredients, difficulty,
        cuisine:cuisines(name),
        category:recipe_categories(name)
      )
    `)
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
    .order('created_at', { ascending: false });
  
  return data || [];
}

function analyzeInteractionPatterns(interactions: any[]) {
  const patterns = {
    liked_cuisines: new Map<string, number>(),
    liked_difficulties: new Map<string, number>(),
    liked_ingredients: new Map<string, number>(),
    avoided_cuisines: new Map<string, number>(),
    avoided_ingredients: new Map<string, number>(),
    time_preferences: new Map<string, number>(),
    cooking_patterns: {
      quick_meals: 0,
      elaborate_meals: 0,
      weekend_cooking: 0,
      weekday_cooking: 0
    }
  };

  interactions.forEach(interaction => {
    const recipe = interaction.recipes;
    const isPositive = ['like', 'cook', 'save', 'rate'].includes(interaction.interaction_type);
    const isNegative = ['skip'].includes(interaction.interaction_type);
    const weight = interaction.interaction_strength || 1.0;

    // Cuisine preferences
    if (recipe.cuisine?.name) {
      if (isPositive) {
        patterns.liked_cuisines.set(
          recipe.cuisine.name, 
          (patterns.liked_cuisines.get(recipe.cuisine.name) || 0) + weight
        );
      } else if (isNegative) {
        patterns.avoided_cuisines.set(
          recipe.cuisine.name,
          (patterns.avoided_cuisines.get(recipe.cuisine.name) || 0) + weight
        );
      }
    }

    // Difficulty preferences
    if (isPositive) {
      patterns.liked_difficulties.set(
        recipe.difficulty,
        (patterns.liked_difficulties.get(recipe.difficulty) || 0) + weight
      );
    }

    // Ingredient preferences
    recipe.ingredients?.forEach((ingredient: string) => {
      if (isPositive) {
        patterns.liked_ingredients.set(
          ingredient,
          (patterns.liked_ingredients.get(ingredient) || 0) + weight
        );
      } else if (isNegative) {
        patterns.avoided_ingredients.set(
          ingredient,
          (patterns.avoided_ingredients.get(ingredient) || 0) + weight
        );
      }
    });

    // Time-based patterns
    if (interaction.session_context?.time_of_day !== undefined) {
      const timeSlot = getTimeSlot(interaction.session_context.time_of_day);
      if (isPositive) {
        patterns.time_preferences.set(
          timeSlot,
          (patterns.time_preferences.get(timeSlot) || 0) + weight
        );
      }
    }

    // Cooking complexity patterns
    if (isPositive) {
      const totalTime = recipe.total_time_minutes || recipe.prep_time_minutes + recipe.cook_time_minutes;
      if (totalTime <= 30) {
        patterns.cooking_patterns.quick_meals += weight;
      } else if (totalTime >= 60) {
        patterns.cooking_patterns.elaborate_meals += weight;
      }

      const dayOfWeek = interaction.session_context?.day_of_week;
      if (dayOfWeek !== undefined) {
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
          patterns.cooking_patterns.weekend_cooking += weight;
        } else {
          patterns.cooking_patterns.weekday_cooking += weight;
        }
      }
    }
  });

  return patterns;
}

async function generateTasteProfile(supabase: any, hf: any, userId: string, interactions: any[], patterns: any) {
  console.log('Generating AI taste profile');

  // Get top liked recipes for embedding generation
  const likedRecipes = interactions
    .filter(i => ['like', 'cook', 'save'].includes(i.interaction_type))
    .map(i => i.recipes)
    .slice(0, 20); // Top 20 liked recipes

  // Generate embeddings for liked recipes
  const recipeEmbeddings = [];
  for (const recipe of likedRecipes) {
    try {
      const recipeText = `${recipe.title} ${recipe.description} ${recipe.ingredients?.join(' ')} ${recipe.cuisine?.name || ''}`;
      const embedding = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: recipeText
      });
      
      recipeEmbeddings.push(embedding);
    } catch (error) {
      console.error('Error generating embedding for recipe:', recipe.id, error);
    }
  }

  // Calculate average embedding as taste profile vector
  let profileVector = [];
  if (recipeEmbeddings.length > 0) {
    const embeddingLength = recipeEmbeddings[0].length;
    profileVector = new Array(embeddingLength).fill(0);

    recipeEmbeddings.forEach(embedding => {
      embedding.forEach((value: number, index: number) => {
        profileVector[index] += value;
      });
    });

    profileVector = profileVector.map(sum => sum / recipeEmbeddings.length);
  }

  // Extract top preferences
  const dominantCuisines = Array.from(patterns.liked_cuisines.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  const preferredIngredients = Array.from(patterns.liked_ingredients.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(entry => entry[0]);

  const avoidedPatterns = [
    ...Array.from(patterns.avoided_cuisines.entries()).map(([cuisine, count]) => `cuisine:${cuisine}`),
    ...Array.from(patterns.avoided_ingredients.entries()).slice(0, 10).map(([ingredient, count]) => `ingredient:${ingredient}`)
  ];

  // Calculate confidence score based on data quality
  const confidenceScore = calculateConfidenceScore(interactions, patterns);

  return {
    profile_vector: profileVector,
    confidence_score: confidenceScore,
    dominant_cuisines: dominantCuisines,
    preferred_ingredients: preferredIngredients,
    avoided_patterns: avoidedPatterns,
    interaction_summary: {
      total_interactions: interactions.length,
      positive_interactions: interactions.filter(i => ['like', 'cook', 'save'].includes(i.interaction_type)).length,
      cuisine_diversity: patterns.liked_cuisines.size,
      ingredient_diversity: patterns.liked_ingredients.size,
      cooking_style: determineCookingStyle(patterns)
    }
  };
}

async function updateTasteProfile(supabase: any, userId: string, tasteProfile: any) {
  const { error } = await supabase
    .from('user_taste_profiles')
    .upsert({
      user_id: userId,
      profile_vector: tasteProfile.profile_vector,
      confidence_score: tasteProfile.confidence_score,
      dominant_cuisines: tasteProfile.dominant_cuisines,
      preferred_ingredients: tasteProfile.preferred_ingredients,
      avoided_patterns: tasteProfile.avoided_patterns,
      last_updated: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating taste profile:', error);
    throw error;
  }
}

async function updateRecipeSimilarities(supabase: any, hf: any, userId: string, tasteProfile: any) {
  if (!tasteProfile.profile_vector?.length) return;

  console.log('Updating recipe similarities based on taste profile');

  // Get user's most interacted recipes
  const { data: userRecipes } = await supabase
    .from('user_recipe_interactions')
    .select('recipe_id')
    .eq('user_id', userId)
    .in('interaction_type', ['like', 'cook', 'save'])
    .limit(10);

  if (!userRecipes?.length) return;

  // Get all recipes to calculate similarities
  const { data: allRecipes } = await supabase
    .from('recipes')
    .select('id, title, description, ingredients')
    .eq('is_published', true)
    .limit(100);

  if (!allRecipes) return;

  const similarities = [];

  for (const userRecipe of userRecipes) {
    for (const recipe of allRecipes) {
      if (recipe.id === userRecipe.recipe_id) continue;

      try {
        const recipeText = `${recipe.title} ${recipe.description} ${recipe.ingredients?.join(' ')}`;
        const recipeEmbedding = await hf.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: recipeText
        });

        const similarity = cosineSimilarity(tasteProfile.profile_vector, recipeEmbedding);

        if (similarity > 0.5) { // Only store meaningful similarities
          similarities.push({
            recipe_a_id: userRecipe.recipe_id,
            recipe_b_id: recipe.id,
            similarity_score: similarity,
            similarity_type: 'taste_profile',
            last_calculated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error calculating similarity:', error);
      }
    }
  }

  // Batch insert similarities
  if (similarities.length > 0) {
    const { error } = await supabase
      .from('recipe_similarity')
      .upsert(similarities);

    if (error) {
      console.error('Error updating recipe similarities:', error);
    } else {
      console.log(`Updated ${similarities.length} recipe similarities`);
    }
  }
}

function getTimeSlot(hour: number): string {
  if (hour < 6) return 'late_night';
  if (hour < 10) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'late_night';
}

function calculateConfidenceScore(interactions: any[], patterns: any): number {
  let score = 0;

  // Base score from interaction count
  const interactionCount = interactions.length;
  score += Math.min(0.4, interactionCount / 50); // Max 0.4 for 50+ interactions

  // Diversity bonus
  const cuisineDiversity = patterns.liked_cuisines.size;
  score += Math.min(0.2, cuisineDiversity / 10); // Max 0.2 for 10+ cuisines

  const ingredientDiversity = patterns.liked_ingredients.size;
  score += Math.min(0.2, ingredientDiversity / 25); // Max 0.2 for 25+ ingredients

  // Consistency bonus (repeated positive interactions)
  const positeRepeats = Array.from(patterns.liked_cuisines.values()).filter(count => count > 2).length;
  score += Math.min(0.2, positeRepeats / 5); // Max 0.2 for consistent preferences

  return Math.min(1.0, score);
}

function determineCookingStyle(patterns: any): string {
  const { cooking_patterns } = patterns;
  
  if (cooking_patterns.quick_meals > cooking_patterns.elaborate_meals * 2) {
    return 'quick_and_easy';
  } else if (cooking_patterns.elaborate_meals > cooking_patterns.quick_meals) {
    return 'elaborate_cooking';
  } else if (cooking_patterns.weekend_cooking > cooking_patterns.weekday_cooking) {
    return 'weekend_chef';
  }
  
  return 'balanced';
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}