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
    const { user_id, type = 'personalized', recipe_id, context = {}, limit = 10 } = await req.json();

    console.log(`Processing ${type} recommendations for user ${user_id}`);

    let recommendations = [];

    switch (type) {
      case 'personalized':
        recommendations = await getPersonalizedRecommendations(supabase, hf, user_id, context, limit);
        break;
      case 'trending':
        recommendations = await getTrendingRecommendations(supabase, hf, context, limit);
        break;
      case 'similar':
        recommendations = await getSimilarRecipes(supabase, hf, recipe_id, limit);
        break;
      default:
        recommendations = await getPersonalizedRecommendations(supabase, hf, user_id, context, limit);
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI recommendations:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred while generating recommendations',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getPersonalizedRecommendations(supabase: any, hf: any, userId: string, context: any, limit: number) {
  console.log('Getting personalized recommendations for user:', userId);
  
  // 1. Get user preferences and interaction history
  const [userPrefs, userInteractions, userTasteProfile] = await Promise.all([
    getUserPreferences(supabase, userId),
    getUserInteractions(supabase, userId),
    getUserTasteProfile(supabase, userId)
  ]);

  // 2. Get candidate recipes
  const candidateRecipes = await getCandidateRecipes(supabase, userPrefs, context);
  
  // 3. Calculate multi-layered scores for each recipe
  const scoredRecipes = await Promise.all(
    candidateRecipes.map(async (recipe: any) => {
      const scores = await calculateRecommendationScore(
        supabase, hf, recipe, userPrefs, userInteractions, userTasteProfile, context
      );
      
      return {
        recipe_id: recipe.id,
        score: scores.totalScore,
        reasons: scores.reasons,
        context: 'personalized',
        breakdown: scores.breakdown
      };
    })
  );

  // 4. Sort by score and apply final filters
  return scoredRecipes
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function getTrendingRecommendations(supabase: any, hf: any, context: any, limit: number) {
  console.log('Getting trending recommendations');
  
  // Get recipes with high recent interaction rates
  const { data: trendingData } = await supabase
    .from('user_recipe_interactions')
    .select(`
      recipe_id,
      recipes!inner(id, title, image_url, difficulty, cuisine_id, created_at),
      count(*) as interaction_count
    `)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .in('interaction_type', ['view', 'like', 'cook', 'save'])
    .group('recipe_id, recipes.id, recipes.title, recipes.image_url, recipes.difficulty, recipes.cuisine_id, recipes.created_at')
    .order('interaction_count', { ascending: false })
    .limit(limit * 2);

  if (!trendingData?.length) {
    // Fallback to recent recipes
    const { data: recentRecipes } = await supabase
      .from('recipes')
      .select('id, title, image_url, difficulty, cuisine_id, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    return recentRecipes?.map((recipe: any) => ({
      recipe_id: recipe.id,
      score: 0.8,
      reasons: ['Recently added recipe'],
      context: 'trending'
    })) || [];
  }

  // Calculate trending scores with decay
  const now = new Date();
  return trendingData.map((item: any) => {
    const daysSinceCreated = (now.getTime() - new Date(item.recipes.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0.1, 1 - (daysSinceCreated / 30)); // Decay over 30 days
    const popularityScore = Math.min(1.0, item.interaction_count / 100); // Normalize to max 100 interactions
    
    return {
      recipe_id: item.recipe_id,
      score: (popularityScore * 0.7) + (recencyScore * 0.3),
      reasons: [`Trending recipe with ${item.interaction_count} recent interactions`],
      context: 'trending'
    };
  }).slice(0, limit);
}

async function getSimilarRecipes(supabase: any, hf: any, recipeId: string, limit: number) {
  console.log('Getting similar recipes for:', recipeId);
  
  // First check if we have pre-computed similarities
  const { data: similarityData } = await supabase
    .from('recipe_similarity')
    .select('recipe_b_id, similarity_score, similarity_type')
    .eq('recipe_a_id', recipeId)
    .order('similarity_score', { ascending: false })
    .limit(limit);

  if (similarityData?.length > 0) {
    return similarityData.map((item: any) => ({
      recipe_id: item.recipe_b_id,
      score: item.similarity_score,
      reasons: [`Similar ${item.similarity_type.replace('_', ' ')}`],
      context: 'similar'
    }));
  }

  // If no pre-computed similarities, generate them using AI
  return await generateSimilarityWithAI(supabase, hf, recipeId, limit);
}

async function generateSimilarityWithAI(supabase: any, hf: any, recipeId: string, limit: number) {
  // Get the target recipe
  const { data: targetRecipe } = await supabase
    .from('recipes')
    .select(`
      id, title, description, ingredients,
      cuisine:cuisines(name),
      category:recipe_categories(name)
    `)
    .eq('id', recipeId)
    .single();

  if (!targetRecipe) return [];

  // Get other recipes to compare
  const { data: allRecipes } = await supabase
    .from('recipes')
    .select(`
      id, title, description, ingredients,
      cuisine:cuisines(name),
      category:recipe_categories(name)
    `)
    .eq('is_published', true)
    .neq('id', recipeId)
    .limit(100); // Compare against top 100 recipes

  if (!allRecipes) return [];

  // Generate embeddings for similarity comparison
  const targetText = `${targetRecipe.title} ${targetRecipe.description} ${targetRecipe.ingredients?.join(' ')} ${targetRecipe.cuisine?.name || ''} ${targetRecipe.category?.name || ''}`;
  
  try {
    const targetEmbedding = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: targetText
    });

    const similarities = await Promise.all(
      allRecipes.map(async (recipe: any) => {
        const recipeText = `${recipe.title} ${recipe.description} ${recipe.ingredients?.join(' ')} ${recipe.cuisine?.name || ''} ${recipe.category?.name || ''}`;
        
        try {
          const recipeEmbedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: recipeText
          });

          const similarity = cosineSimilarity(targetEmbedding, recipeEmbedding);
          
          return {
            recipe_id: recipe.id,
            score: similarity,
            reasons: ['AI-calculated content similarity'],
            context: 'similar'
          };
        } catch (error) {
          console.error('Error calculating similarity for recipe:', recipe.id, error);
          return null;
        }
      })
    );

    return similarities
      .filter(item => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    console.error('Error generating AI similarities:', error);
    return [];
  }
}

async function calculateRecommendationScore(
  supabase: any, hf: any, recipe: any, userPrefs: any, userInteractions: any[], userTasteProfile: any, context: any) {
  let reasons = [];
  let breakdown = {};

  // Layer 1: User Preference Matching (40% weight)
  const preferenceScore = calculatePreferenceMatch(recipe, userPrefs);
  if (preferenceScore > 0.7) reasons.push('Matches your dietary preferences');
  breakdown.preference = preferenceScore;

  // Layer 2: Behavioral Patterns (30% weight)
  const behaviorScore = calculateBehavioralScore(recipe, userInteractions);
  if (behaviorScore > 0.6) reasons.push('Similar to recipes you\'ve enjoyed');
  breakdown.behavior = behaviorScore;

  // Layer 3: AI Semantic Analysis (20% weight)
  const aiScore = await calculateAIScore(hf, recipe, userTasteProfile);
  if (aiScore > 0.5) reasons.push('AI recommends based on your taste profile');
  breakdown.ai = aiScore;

  // Layer 4: Social Signals (10% weight)
  const socialScore = await calculateSocialScore(supabase, recipe);
  if (socialScore > 0.7) reasons.push('Popular among users with similar tastes');
  breakdown.social = socialScore;

  // Contextual adjustments
  const contextScore = calculateContextualScore(recipe, context);
  breakdown.context = contextScore;

  const totalScore = (
    preferenceScore * 0.4 +
    behaviorScore * 0.3 +
    aiScore * 0.2 +
    socialScore * 0.1
  ) * contextScore;

  return {
    totalScore: Math.min(1.0, Math.max(0.0, totalScore)),
    reasons,
    breakdown
  };
}

function calculatePreferenceMatch(recipe: any, userPrefs: any) {
  let score = 0.5; // Base score
  
  // Dietary restrictions match
  if (userPrefs.dietary_restrictions?.length > 0) {
    const hasConflict = userPrefs.dietary_restrictions.some((restriction: string) =>
      recipe.dietary_restrictions && !recipe.dietary_restrictions.includes(restriction)
    );
    if (hasConflict) score -= 0.3;
    else score += 0.2;
  }

  // Cuisine preference
  if (userPrefs.favorite_cuisines?.includes(recipe.cuisine?.name)) {
    score += 0.2;
  }

  // Cooking skill level
  if (userPrefs.cooking_skill_level) {
    const skillMap = { easy: 1, medium: 2, hard: 3 };
    const userSkill = skillMap[userPrefs.cooking_skill_level] || 2;
    const recipeSkill = skillMap[recipe.difficulty] || 2;
    
    if (recipeSkill <= userSkill) score += 0.1;
    else if (recipeSkill > userSkill + 1) score -= 0.2;
  }

  return Math.min(1.0, Math.max(0.0, score));
}

function calculateBehavioralScore(recipe: any, userInteractions: any[]) {
  if (!userInteractions.length) return 0.5;

  let score = 0.5;
  
  // Check interactions with similar recipes
  const similarInteractions = userInteractions.filter(interaction => {
    return interaction.recipe_cuisine === recipe.cuisine?.name ||
           interaction.recipe_difficulty === recipe.difficulty;
  });

  const positiveInteractions = similarInteractions.filter(i => 
    ['like', 'cook', 'save'].includes(i.interaction_type)
  ).length;
  
  const negativeInteractions = similarInteractions.filter(i => 
    ['skip'].includes(i.interaction_type)
  ).length;

  score += (positiveInteractions * 0.1) - (negativeInteractions * 0.05);
  
  return Math.min(1.0, Math.max(0.0, score));
}

async function calculateAIScore(hf: any, recipe: any, userTasteProfile: any) {
  if (!userTasteProfile?.profile_vector) return 0.5;

  try {
    // Generate recipe embedding
    const recipeText = `${recipe.title} ${recipe.description} ${recipe.ingredients?.join(' ')}`;
    const recipeEmbedding = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: recipeText
    });

    // Calculate similarity with user taste profile
    const similarity = cosineSimilarity(userTasteProfile.profile_vector, recipeEmbedding);
    return Math.min(1.0, Math.max(0.0, similarity));
  } catch (error) {
    console.error('Error calculating AI score:', error);
    return 0.5;
  }
}

async function calculateSocialScore(supabase: any, recipe: any) {
  const { data: stats } = await supabase
    .from('user_recipe_interactions')
    .select('interaction_type')
    .eq('recipe_id', recipe.id)
    .in('interaction_type', ['like', 'cook', 'save']);

  if (!stats?.length) return 0.5;

  const positiveInteractions = stats.length;
  return Math.min(1.0, positiveInteractions / 50); // Normalize to max 50 interactions
}

function calculateContextualScore(recipe: any, context: any) {
  let multiplier = 1.0;

  // Time of day adjustments
  if (context.time_of_day === 'morning' && recipe.category?.name?.toLowerCase().includes('breakfast')) {
    multiplier *= 1.3;
  } else if (context.time_of_day === 'evening' && recipe.category?.name?.toLowerCase().includes('dinner')) {
    multiplier *= 1.2;
  }

  // Cooking time preferences
  if (context.cooking_time === 'quick' && recipe.total_time_minutes <= 30) {
    multiplier *= 1.3;
  } else if (context.cooking_time === 'elaborate' && recipe.total_time_minutes >= 60) {
    multiplier *= 1.2;
  }

  return multiplier;
}

// Helper functions
async function getUserPreferences(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_preferences_v2')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data || {};
}

async function getUserInteractions(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_recipe_interactions')
    .select(`
      *,
      recipes!inner(cuisine_id, difficulty, category_id)
    `)
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });
  return data || [];
}

async function getUserTasteProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_taste_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

async function getCandidateRecipes(supabase: any, userPrefs: any, context: any) {
  let query = supabase
    .from('recipes')
    .select(`
      id, title, description, ingredients, difficulty, total_time_minutes,
      cuisine:cuisines(name),
      category:recipe_categories(name)
    `)
    .eq('is_published', true);

  // Filter by dietary restrictions
  if (userPrefs.dietary_restrictions?.length > 0) {
    query = query.overlaps('dietary_restrictions', userPrefs.dietary_restrictions);
  }

  const { data } = await query.limit(100);
  return data || [];
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