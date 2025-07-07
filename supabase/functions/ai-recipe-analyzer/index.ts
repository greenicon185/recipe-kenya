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
    const { recipe_id, analysis_type = 'full' } = await req.json();

    console.log(`Analyzing recipe ${recipe_id} with type ${analysis_type}`);

    // Get recipe data
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
        *,
        cuisine:cuisines(name),
        category:recipe_categories(name),
        recipe_ingredients(
          quantity, unit, preparation_note,
          ingredient:ingredients(name, category, nutritional_info)
        )
      `)
      .eq('id', recipe_id)
      .single();

    if (error || !recipe) {
      return new Response(JSON.stringify({ 
        error: 'Recipe not found',
        details: error?.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let analysis = {};

    switch (analysis_type) {
      case 'full':
        analysis = await performFullAnalysis(supabase, hf, recipe);
        break;
      case 'embedding':
        analysis = await generateRecipeEmbedding(hf, recipe);
        break;
      case 'nutrition':
        analysis = await analyzeNutrition(recipe);
        break;
      case 'flavor_profile':
        analysis = await analyzeFlavorProfile(hf, recipe);
        break;
      case 'complexity':
        analysis = await analyzeComplexity(recipe);
        break;
      default:
        analysis = await performFullAnalysis(supabase, hf, recipe);
    }

    // Store analysis results
    if (analysis_type === 'full' || analysis_type === 'embedding') {
      await storeAnalysisResults(supabase, recipe_id, analysis);
    }

    return new Response(JSON.stringify({ 
      recipe_id,
      analysis_type,
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recipe analyzer:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred while analyzing recipe',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performFullAnalysis(supabase: any, hf: any, recipe: any) {
  console.log('Performing full recipe analysis');

  const [
    embedding,
    nutrition,
    flavorProfile,
    complexity,
    tagsAnalysis,
    seasonality
  ] = await Promise.all([
    generateRecipeEmbedding(hf, recipe),
    analyzeNutrition(recipe),
    analyzeFlavorProfile(hf, recipe),
    analyzeComplexity(recipe),
    analyzeRecipeTags(hf, recipe),
    analyzeSeasonality(hf, recipe)
  ]);

  return {
    embedding,
    nutrition,
    flavor_profile: flavorProfile,
    complexity,
    tags: tagsAnalysis,
    seasonality,
    analysis_summary: generateAnalysisSummary({
      nutrition,
      flavorProfile,
      complexity,
      tagsAnalysis,
      seasonality
    })
  };
}

async function generateRecipeEmbedding(hf: any, recipe: any) {
  console.log('Generating recipe embedding');

  // Create comprehensive text representation
  const ingredients = recipe.recipe_ingredients
    ?.map((ri: any) => `${ri.quantity} ${ri.unit} ${ri.ingredient.name}`)
    .join(', ') || recipe.ingredients?.join(', ') || '';

  const instructions = Array.isArray(recipe.instructions) 
    ? recipe.instructions.join(' ') 
    : typeof recipe.instructions === 'string' 
      ? recipe.instructions 
      : '';

  const recipeText = [
    recipe.title,
    recipe.description,
    `Cuisine: ${recipe.cuisine?.name || 'unknown'}`,
    `Category: ${recipe.category?.name || 'main'}`,
    `Difficulty: ${recipe.difficulty}`,
    `Ingredients: ${ingredients}`,
    `Instructions: ${instructions}`,
    `Prep time: ${recipe.prep_time_minutes} minutes`,
    `Cook time: ${recipe.cook_time_minutes} minutes`
  ].filter(Boolean).join('. ');

  try {
    const embedding = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: recipeText
    });

    return {
      vector: embedding,
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      text_used: recipeText.substring(0, 500) + '...', // Store sample for debugging
      dimension: embedding.length
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

async function analyzeNutrition(recipe: any) {
  console.log('Analyzing nutrition');

  const nutrition = {
    calories_per_serving: 0,
    protein_per_serving: 0,
    carbs_per_serving: 0,
    fat_per_serving: 0,
    fiber_per_serving: 0,
    sodium_per_serving: 0,
    nutritional_balance: 'unknown',
    dietary_suitability: [],
    health_score: 0.5
  };

  // Use existing nutritional info if available
  if (recipe.nutritional_info) {
    const existing = recipe.nutritional_info;
    nutrition.calories_per_serving = existing.calories || 0;
    nutrition.protein_per_serving = existing.protein || 0;
    nutrition.carbs_per_serving = existing.carbohydrates || 0;
    nutrition.fat_per_serving = existing.fat || 0;
    nutrition.fiber_per_serving = existing.fiber || 0;
    nutrition.sodium_per_serving = existing.sodium || 0;
  } else {
    // Calculate from ingredients if recipe_ingredients are available
    if (recipe.recipe_ingredients?.length > 0) {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      recipe.recipe_ingredients.forEach((ri: any) => {
        const ingredient = ri.ingredient;
        const quantity = ri.quantity || 0;
        
        if (ingredient.nutritional_info) {
          const factor = convertToStandardUnit(quantity, ri.unit) / 100; // per 100g
          totalCalories += (ingredient.nutritional_info.calories || 0) * factor;
          totalProtein += (ingredient.nutritional_info.protein || 0) * factor;
          totalCarbs += (ingredient.nutritional_info.carbohydrates || 0) * factor;
          totalFat += (ingredient.nutritional_info.fat || 0) * factor;
        }
      });

      const servings = recipe.servings || 4;
      nutrition.calories_per_serving = Math.round(totalCalories / servings);
      nutrition.protein_per_serving = Math.round(totalProtein / servings);
      nutrition.carbs_per_serving = Math.round(totalCarbs / servings);
      nutrition.fat_per_serving = Math.round(totalFat / servings);
    }
  }

  // Calculate nutritional balance
  const totalMacros = nutrition.protein_per_serving + nutrition.carbs_per_serving + nutrition.fat_per_serving;
  if (totalMacros > 0) {
    const proteinRatio = nutrition.protein_per_serving / totalMacros;
    const carbRatio = nutrition.carbs_per_serving / totalMacros;
    const fatRatio = nutrition.fat_per_serving / totalMacros;

    if (proteinRatio > 0.3) nutrition.nutritional_balance = 'high_protein';
    else if (carbRatio > 0.6) nutrition.nutritional_balance = 'high_carb';
    else if (fatRatio > 0.4) nutrition.nutritional_balance = 'high_fat';
    else nutrition.nutritional_balance = 'balanced';
  }

  // Analyze dietary suitability
  nutrition.dietary_suitability = analyzeDietarySuitability(recipe);

  // Calculate health score
  nutrition.health_score = calculateHealthScore(nutrition, recipe);

  return nutrition;
}

async function analyzeFlavorProfile(hf: any, recipe: any) {
  console.log('Analyzing flavor profile');

  // Extract flavor-relevant information
  const ingredients = recipe.recipe_ingredients
    ?.map((ri: any) => ri.ingredient.name)
    .join(', ') || recipe.ingredients?.join(', ') || '';

  const flavorText = `${recipe.title} ${recipe.description} ingredients: ${ingredients}`;

  try {
    // Use AI to classify flavor profile
    const flavorAnalysis = await hf.textClassification({
      model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      inputs: flavorText
    });

    // Analyze ingredient-based flavor characteristics
    const flavorCharacteristics = analyzeFlavorCharacteristics(recipe);

    return {
      primary_flavors: flavorCharacteristics.primary,
      secondary_flavors: flavorCharacteristics.secondary,
      spice_level: flavorCharacteristics.spice_level,
      sweetness_level: flavorCharacteristics.sweetness_level,
      richness: flavorCharacteristics.richness,
      texture_profile: flavorCharacteristics.texture,
      flavor_complexity: flavorCharacteristics.complexity,
      ai_sentiment: flavorAnalysis?.[0] || null
    };
  } catch (error) {
    console.error('Error in AI flavor analysis:', error);
    return analyzeFlavorCharacteristics(recipe);
  }
}

async function analyzeComplexity(recipe: any) {
  console.log('Analyzing recipe complexity');

  const complexity = {
    skill_level_required: recipe.difficulty || 'medium',
    technique_complexity: 'basic',
    ingredient_complexity: 'simple',
    time_complexity: 'moderate',
    equipment_requirements: [],
    overall_complexity_score: 0.5
  };

  // Analyze instructions for technique complexity
  const instructions = Array.isArray(recipe.instructions) 
    ? recipe.instructions.join(' ') 
    : recipe.instructions || '';

  const complexTechniques = [
    'flambe', 'sous vide', 'confit', 'tempering', 'emulsify', 'fold', 'whip', 'knead',
    'braise', 'reduction', 'caramelize', 'deglaze', 'julienne', 'brunoise'
  ];

  const foundTechniques = complexTechniques.filter(technique => 
    instructions.toLowerCase().includes(technique)
  );

  if (foundTechniques.length > 2) complexity.technique_complexity = 'advanced';
  else if (foundTechniques.length > 0) complexity.technique_complexity = 'intermediate';

  // Analyze ingredient complexity
  const ingredientCount = recipe.recipe_ingredients?.length || recipe.ingredients?.length || 0;
  if (ingredientCount > 15) complexity.ingredient_complexity = 'complex';
  else if (ingredientCount > 8) complexity.ingredient_complexity = 'moderate';

  // Analyze time complexity
  const totalTime = recipe.total_time_minutes || 
    (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  if (totalTime > 120) complexity.time_complexity = 'long';
  else if (totalTime > 60) complexity.time_complexity = 'moderate';
  else if (totalTime <= 30) complexity.time_complexity = 'quick';

  // Identify equipment requirements
  const equipmentKeywords = {
    'blender': ['blend', 'puree', 'smooth'],
    'food_processor': ['process', 'chop finely'],
    'stand_mixer': ['whip', 'beat', 'mix thoroughly'],
    'specialty_pan': ['wok', 'cast iron', 'non-stick'],
    'thermometer': ['temperature', 'degrees', 'internal temp'],
    'scale': ['weigh', 'grams', 'ounces']
  };

  Object.entries(equipmentKeywords).forEach(([equipment, keywords]) => {
    if (keywords.some(keyword => instructions.toLowerCase().includes(keyword))) {
      complexity.equipment_requirements.push(equipment);
    }
  });

  // Calculate overall complexity score
  const scores = {
    skill: { easy: 0.2, medium: 0.5, hard: 0.8 }[complexity.skill_level_required] || 0.5,
    technique: { basic: 0.2, intermediate: 0.5, advanced: 0.8 }[complexity.technique_complexity] || 0.2,
    ingredient: { simple: 0.2, moderate: 0.5, complex: 0.8 }[complexity.ingredient_complexity] || 0.2,
    time: { quick: 0.2, moderate: 0.5, long: 0.8 }[complexity.time_complexity] || 0.5,
    equipment: Math.min(0.8, complexity.equipment_requirements.length * 0.2)
  };

  complexity.overall_complexity_score = 
    (scores.skill * 0.3 + scores.technique * 0.25 + scores.ingredient * 0.2 + 
     scores.time * 0.15 + scores.equipment * 0.1);

  return complexity;
}

async function analyzeRecipeTags(hf: any, recipe: any) {
  console.log('Analyzing recipe tags');

  const recipeText = `${recipe.title} ${recipe.description}`;
  
  const tags = {
    occasion_tags: [],
    meal_type_tags: [],
    season_tags: [],
    dietary_tags: recipe.dietary_restrictions || [],
    cooking_method_tags: [],
    texture_tags: [],
    temperature_tags: []
  };

  // Occasion analysis
  const occasionKeywords = {
    'holiday': ['christmas', 'thanksgiving', 'easter', 'halloween'],
    'party': ['party', 'celebration', 'gathering', 'crowd'],
    'comfort': ['comfort', 'cozy', 'warm', 'hearty'],
    'elegant': ['elegant', 'sophisticated', 'fancy', 'gourmet'],
    'casual': ['easy', 'simple', 'quick', 'everyday'],
    'romantic': ['romantic', 'date night', 'intimate']
  };

  Object.entries(occasionKeywords).forEach(([occasion, keywords]) => {
    if (keywords.some(keyword => recipeText.toLowerCase().includes(keyword))) {
      tags.occasion_tags.push(occasion);
    }
  });

  // Meal type analysis
  const mealKeywords = {
    'breakfast': ['breakfast', 'morning', 'brunch'],
    'lunch': ['lunch', 'midday', 'light meal'],
    'dinner': ['dinner', 'supper', 'main course'],
    'snack': ['snack', 'appetizer', 'finger food'],
    'dessert': ['dessert', 'sweet', 'cake', 'cookie']
  };

  Object.entries(mealKeywords).forEach(([meal, keywords]) => {
    if (keywords.some(keyword => recipeText.toLowerCase().includes(keyword))) {
      tags.meal_type_tags.push(meal);
    }
  });

  return tags;
}

async function analyzeSeasonality(hf: any, recipe: any) {
  console.log('Analyzing seasonality');

  const ingredients = recipe.recipe_ingredients
    ?.map((ri: any) => ri.ingredient.name)
    .join(' ') || recipe.ingredients?.join(' ') || '';

  const seasonalIngredients = {
    spring: ['asparagus', 'peas', 'artichoke', 'strawberry', 'rhubarb'],
    summer: ['tomato', 'corn', 'zucchini', 'berries', 'melon', 'peach'],
    fall: ['pumpkin', 'squash', 'apple', 'cranberry', 'sweet potato'],
    winter: ['citrus', 'root vegetables', 'cabbage', 'pomegranate']
  };

  const seasonality = {
    primary_season: 'year_round',
    seasonal_score: 0,
    seasonal_ingredients: [],
    temperature_preference: 'neutral'
  };

  // Analyze seasonal ingredients
  Object.entries(seasonalIngredients).forEach(([season, seasonIngredients]) => {
    const matches = seasonIngredients.filter(ingredient => 
      ingredients.toLowerCase().includes(ingredient)
    );
    
    if (matches.length > seasonality.seasonal_score) {
      seasonality.primary_season = season;
      seasonality.seasonal_score = matches.length;
      seasonality.seasonal_ingredients = matches;
    }
  });

  // Analyze temperature preference
  const recipeText = `${recipe.title} ${recipe.description}`.toLowerCase();
  if (recipeText.includes('cold') || recipeText.includes('chilled') || recipeText.includes('frozen')) {
    seasonality.temperature_preference = 'cold';
  } else if (recipeText.includes('hot') || recipeText.includes('warm') || recipeText.includes('heated')) {
    seasonality.temperature_preference = 'hot';
  }

  return seasonality;
}

async function storeAnalysisResults(supabase: any, recipeId: string, analysis: any) {
  console.log('Storing analysis results');

  // Store embedding if available
  if (analysis.embedding?.vector) {
    await supabase
      .from('recipe_embeddings')
      .upsert({
        recipe_id: recipeId,
        embedding_vector: analysis.embedding.vector,
        embedding_model: analysis.embedding.model,
        last_updated: new Date().toISOString()
      });
  }

  // Store additional analysis data (could create separate table if needed)
  // For now, we'll just log it
  console.log('Analysis completed for recipe:', recipeId);
}

function analyzeFlavorCharacteristics(recipe: any) {
  const ingredients = recipe.recipe_ingredients
    ?.map((ri: any) => ri.ingredient.name.toLowerCase())
    .join(' ') || recipe.ingredients?.map((i: string) => i.toLowerCase()).join(' ') || '';

  const characteristics = {
    primary: [],
    secondary: [],
    spice_level: 'mild',
    sweetness_level: 'balanced',
    richness: 'moderate',
    texture: 'mixed',
    complexity: 'moderate'
  };

  // Flavor analysis based on ingredients
  const flavorProfiles = {
    spicy: ['chili', 'pepper', 'cayenne', 'paprika', 'jalapeño', 'hot sauce'],
    sweet: ['sugar', 'honey', 'maple', 'chocolate', 'vanilla', 'fruit'],
    savory: ['garlic', 'onion', 'mushroom', 'cheese', 'herbs'],
    citrus: ['lemon', 'lime', 'orange', 'grapefruit'],
    earthy: ['mushroom', 'truffle', 'potato', 'root vegetables'],
    fresh: ['herbs', 'mint', 'basil', 'cilantro', 'parsley']
  };

  Object.entries(flavorProfiles).forEach(([flavor, keywords]) => {
    const matches = keywords.filter(keyword => ingredients.includes(keyword));
    if (matches.length > 0) {
      if (matches.length >= 2) {
        characteristics.primary.push(flavor);
      } else {
        characteristics.secondary.push(flavor);
      }
    }
  });

  // Spice level analysis
  const spicyIngredients = ['chili', 'pepper', 'cayenne', 'jalapeño', 'habanero'];
  const spiceCount = spicyIngredients.filter(spice => ingredients.includes(spice)).length;
  if (spiceCount >= 2) characteristics.spice_level = 'very_spicy';
  else if (spiceCount >= 1) characteristics.spice_level = 'spicy';

  return characteristics;
}

function analyzeDietarySuitability(recipe: any) {
  const suitability = [];
  const ingredients = recipe.recipe_ingredients
    ?.map((ri: any) => ri.ingredient.name.toLowerCase())
    .join(' ') || recipe.ingredients?.map((i: string) => i.toLowerCase()).join(' ') || '';

  // Check for common dietary restrictions
  if (!ingredients.includes('meat') && !ingredients.includes('chicken') && !ingredients.includes('beef')) {
    suitability.push('vegetarian_friendly');
  }

  if (!ingredients.includes('dairy') && !ingredients.includes('milk') && !ingredients.includes('cheese')) {
    suitability.push('dairy_free_adaptable');
  }

  if (!ingredients.includes('gluten') && !ingredients.includes('wheat') && !ingredients.includes('flour')) {
    suitability.push('gluten_free_friendly');
  }

  return suitability;
}

function calculateHealthScore(nutrition: any, recipe: any) {
  let score = 0.5; // Base score

  // Positive factors
  if (nutrition.protein_per_serving > 15) score += 0.1;
  if (nutrition.fiber_per_serving > 5) score += 0.1;
  if (nutrition.calories_per_serving < 500) score += 0.1;

  // Negative factors
  if (nutrition.sodium_per_serving > 800) score -= 0.1;
  if (nutrition.calories_per_serving > 800) score -= 0.1;

  // Ingredient-based factors
  const ingredients = recipe.recipe_ingredients
    ?.map((ri: any) => ri.ingredient.name.toLowerCase())
    .join(' ') || '';

  const healthyIngredients = ['vegetable', 'fruit', 'whole grain', 'lean protein'];
  const unhealthyIngredients = ['fried', 'processed', 'refined sugar'];

  healthyIngredients.forEach(ingredient => {
    if (ingredients.includes(ingredient)) score += 0.05;
  });

  unhealthyIngredients.forEach(ingredient => {
    if (ingredients.includes(ingredient)) score -= 0.05;
  });

  return Math.max(0, Math.min(1, score));
}

function generateAnalysisSummary(analysisData: any) {
  const summary = {
    highlights: [],
    recommendations: [],
    tags: []
  };

  // Generate highlights based on analysis
  if (analysisData.nutrition?.health_score > 0.7) {
    summary.highlights.push('High nutritional value');
  }

  if (analysisData.complexity?.overall_complexity_score < 0.3) {
    summary.highlights.push('Easy to prepare');
  }

  if (analysisData.flavorProfile?.flavor_complexity === 'complex') {
    summary.highlights.push('Complex flavor profile');
  }

  // Generate recommendations
  if (analysisData.complexity?.time_complexity === 'quick') {
    summary.recommendations.push('Perfect for busy weeknights');
  }

  if (analysisData.seasonality?.primary_season !== 'year_round') {
    summary.recommendations.push(`Best enjoyed during ${analysisData.seasonality.primary_season}`);
  }

  return summary;
}

function convertToStandardUnit(quantity: number, unit: string): number {
  // Convert various units to grams for nutritional calculation
  const conversions: { [key: string]: number } = {
    'kg': 1000,
    'g': 1,
    'lbs': 453.592,
    'oz': 28.3495,
    'cups': 240, // approximate for liquids
    'tbsp': 15,
    'tsp': 5,
    'ml': 1, // approximate density
    'l': 1000,
    'pieces': 100 // rough estimate
  };

  return quantity * (conversions[unit.toLowerCase()] || 100);
}