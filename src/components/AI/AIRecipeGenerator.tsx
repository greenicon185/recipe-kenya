import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Brain, 
  ChefHat, 
  Clock, 
  Users, 
  Zap, 
  Send, 
  Loader2,
  Star,
  Wand2,
  Cpu,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIRecipeGeneratorProps {
  onRecipeGenerated?: (recipe: any) => void;
}

const AIRecipeGenerator: React.FC<AIRecipeGeneratorProps> = ({ onRecipeGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [servings, setServings] = useState('4');
  const [cookingTime, setCookingTime] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [generationStats, setGenerationStats] = useState<any>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const cuisineOptions = [
    'Kenyan', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 
    'American', 'French', 'Indian', 'Thai', 'Japanese'
  ];

  const difficultyOptions = [
    { value: 'easy', label: 'Easy (15-30 min)', icon: '🟢' },
    { value: 'medium', label: 'Medium (30-60 min)', icon: '🟡' },
    { value: 'hard', label: 'Hard (60+ min)', icon: '🔴' }
  ];

  const timeOptions = [
    '15 minutes', '30 minutes', '45 minutes', 
    '1 hour', '1.5 hours', '2+ hours'
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 
    'Keto', 'Halal', 'Kosher', 'Low-carb'
  ];

  const toggleDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const generateRecipe = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe what you'd like to cook",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();

    try {
      // Call AI recipe generation edge function
      const { data, error } = await supabase.functions.invoke('ai-recipe-generator', {
        body: {
          prompt: prompt.trim(),
          cuisine,
          difficulty,
          servings: parseInt(servings),
          cookingTime,
          dietaryRestrictions
        }
      });

      if (error) throw error;

      const generationTime = Date.now() - startTime;
      
      setGeneratedRecipe(data.recipe);
      setGenerationStats({
        generationTime,
        model: data.model,
        tokensUsed: data.tokensUsed || 'N/A'
      });

      // Save to database for history
      if (data.recipe) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from('ai_recipe_generations').insert({
            user_id: userData.user.id,
            prompt: prompt.trim(),
            generated_recipe: data.recipe,
            model_used: data.model || 'gpt-4',
            generation_time_ms: generationTime
          });
        }
      }

      toast({
        title: "Recipe Generated! 🎉",
        description: `AI created your ${data.recipe?.title || 'custom recipe'} in ${(generationTime / 1000).toFixed(1)}s`
      });

      if (onRecipeGenerated) {
        onRecipeGenerated(data.recipe);
      }

    } catch (error: any) {
      console.error('Recipe generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate recipe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedRecipe = async () => {
    if (!generatedRecipe) return;

    try {
      const { error } = await supabase.from('recipes').insert({
        title: generatedRecipe.title,
        description: generatedRecipe.description,
        ingredients: generatedRecipe.ingredients,
        instructions: { steps: generatedRecipe.instructions },
        prep_time_minutes: generatedRecipe.prepTime,
        cook_time_minutes: generatedRecipe.cookTime,
        total_time_minutes: (generatedRecipe.prepTime || 0) + (generatedRecipe.cookTime || 0),
        servings: generatedRecipe.servings,
        difficulty: generatedRecipe.difficulty,
        is_published: true,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      // Update generation record as saved
      await supabase
        .from('ai_recipe_generations')
        .update({ was_saved: true })
        .eq('generated_recipe->title', generatedRecipe.title)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      toast({
        title: "Recipe Saved! 📝",
        description: "Your AI-generated recipe has been added to the collection"
      });

    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save recipe",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Recipe Generator
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Describe your cravings, and our AI chef will craft the perfect recipe for you
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-background via-background/50 to-purple/5 border-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                Recipe Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form ref={formRef} className="space-y-4">
                {/* Main Prompt */}
                <div>
                  <Label htmlFor="prompt" className="text-base font-medium">
                    What would you like to cook? *
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="E.g., A spicy Kenyan-inspired pasta with vegetables and coconut milk..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] mt-2"
                  />
                </div>

                <Separator />

                {/* Quick Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cuisine Style</Label>
                    <Select value={cuisine} onValueChange={setCuisine}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Any cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuisineOptions.map(c => (
                          <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Any difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map(d => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.icon} {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Servings</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Cooking Time</Label>
                    <Select value={cookingTime} onValueChange={setCookingTime}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Any time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <Label className="text-base font-medium">Dietary Preferences</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dietaryOptions.map(diet => (
                      <Badge
                        key={diet}
                        variant={dietaryRestrictions.includes(diet) ? "default" : "outline"}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => toggleDietaryRestriction(diet)}
                      >
                        {diet}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateRecipe}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-6 text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      AI is crafting your recipe...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Recipe with AI
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Generated Recipe */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-background via-background/50 to-green/5 border-green/20 min-h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-green-500" />
                Generated Recipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-96 text-center"
                  >
                    <div className="relative">
                      <Cpu className="w-16 h-16 text-purple-500 animate-pulse" />
                      <div className="absolute -inset-2 bg-purple-500/20 rounded-full animate-ping" />
                    </div>
                    <h3 className="text-xl font-semibold mt-4 mb-2">AI Chef at Work</h3>
                    <p className="text-muted-foreground mb-4">
                      Analyzing ingredients, balancing flavors, and crafting the perfect recipe...
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lightbulb className="w-4 h-4 animate-pulse" />
                      Pro tip: The more specific your description, the better the result!
                    </div>
                  </motion.div>
                ) : generatedRecipe ? (
                  <motion.div
                    key="recipe"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Recipe Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">{generatedRecipe.title}</h3>
                      <p className="text-muted-foreground">{generatedRecipe.description}</p>
                      
                      {/* Stats */}
                      <div className="flex justify-center gap-4 mt-4">
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          {generatedRecipe.totalTime || '30'} min
                        </Badge>
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          {generatedRecipe.servings || servings} servings
                        </Badge>
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          {generatedRecipe.difficulty || difficulty || 'Medium'}
                        </Badge>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Ingredients
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {generatedRecipe.ingredients?.map((ingredient: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-green-500">•</span>
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Instructions */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        Instructions
                      </h4>
                      <ol className="space-y-2 text-sm">
                        {generatedRecipe.instructions?.map((instruction: string, index: number) => (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                              {index + 1}
                            </span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Generation Stats */}
                    {generationStats && (
                      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <span>Generated by {generationStats.model}</span>
                          <span>{(generationStats.generationTime / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={saveGeneratedRecipe}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Save Recipe
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setGeneratedRecipe(null)}
                        className="flex-1"
                      >
                        Generate New
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-96 text-center"
                  >
                    <Zap className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ready to Create</h3>
                    <p className="text-muted-foreground">
                      Describe your ideal dish and let AI work its magic
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AIRecipeGenerator;