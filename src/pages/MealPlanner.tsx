import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AIRecipeService } from '@/services/aiRecipeService';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, Loader2, Zap, Target } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  nutritional_info?: any;
}

interface MealPlanEntry {
  id?: string;
  user_id: string;
  recipe_id: string;
  day: string;
  meal_type: string;
}

interface WeeklyMealPlan {
  id: string;
  user_id: string;
  name: string;
  week_start: string;
  plan_data: any;
  created_at: string;
  updated_at: string;
  is_template?: boolean;
}

const MealPlanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch recipes
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, servings, nutritional_info')
          .eq('is_published', true)
          .limit(50);

        if (recipesError) throw recipesError;
        setRecipes(recipesData || []);

        // Fetch existing meal plan
        const { data: mealPlanData, error: mealPlanError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id);

        if (mealPlanError) throw mealPlanError;
        setMealPlan(mealPlanData || []);

        // Fetch weekly meal plans
        const { data: weeklyData, error: weeklyError } = await supabase
          .from('weekly_meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (weeklyError) throw weeklyError;
        setWeeklyPlans(weeklyData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          description: 'Failed to load meal planner data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const generateAIMealPlan = async () => {
    if (!user) return;

    try {
      setGeneratingPlan(true);
      
      const weekStart = new Date(currentWeek);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      
      const mealPlanData = await AIRecipeService.generateMealPlan(
        user.id,
        weekStart.toISOString().split('T')[0],
        {
          dietary_restrictions: [],
          budget_preference: 'medium',
          cooking_time: 'medium',
          cuisine_variety: true,
          prep_optimization: true,
        }
      );

      if (mealPlanData.length > 0) {
        // Convert AI recommendations to meal plan entries
        const mealEntries = mealPlanData.map(recommendation => ({
          user_id: user.id,
          recipe_id: recommendation.recipe_id,
          day: recommendation.day,
          meal_type: recommendation.meal_type
        }));

        // Save to database
        const { error } = await supabase
          .from('meal_plans')
          .upsert(mealEntries, {
            onConflict: 'user_id,recipe_id,day,meal_type'
          });

        if (error) throw error;

        // Update local state
        setMealPlan(prev => [...prev, ...mealEntries]);
        
        toast({
          description: 'AI meal plan generated successfully!'
        });
      }
    } catch (error) {
      console.error('Error generating AI meal plan:', error);
      toast({
        description: 'Failed to generate AI meal plan',
        variant: 'destructive'
      });
    } finally {
      setGeneratingPlan(false);
    }
  };

  const addToMealPlan = async (recipeId: string, day: string, mealType: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert([{
          user_id: user.id,
          recipe_id: recipeId,
          day,
          meal_type: mealType
        }])
        .select()
        .single();

      if (error) throw error;

      setMealPlan(prev => [...prev, data]);
      toast({
        description: 'Recipe added to meal plan!'
      });
    } catch (error) {
      console.error('Error adding to meal plan:', error);
      toast({
        description: 'Failed to add recipe to meal plan',
        variant: 'destructive'
      });
    }
  };

  const removeFromMealPlan = async (mealPlanId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId);

      if (error) throw error;

      setMealPlan(prev => prev.filter(entry => entry.id !== mealPlanId));
      toast({
        description: 'Recipe removed from meal plan!'
      });
    } catch (error) {
      console.error('Error removing from meal plan:', error);
      toast({
        description: 'Failed to remove recipe from meal plan',
        variant: 'destructive'
      });
    }
  };

  const getMealForSlot = (day: string, mealType: string) => {
    const entry = mealPlan.find(m => m.day === day && m.meal_type === mealType);
    if (!entry) return null;
    return recipes.find(r => r.id === entry.recipe_id);
  };

  const saveMealPlanAsTemplate = async () => {
    if (!user || mealPlan.length === 0) return;

    try {
      const weekStart = new Date(currentWeek);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

      const planData = {
        meals: mealPlan.reduce((acc, entry) => {
          if (!acc[entry.day]) acc[entry.day] = {};
          if (!acc[entry.day][entry.meal_type]) acc[entry.day][entry.meal_type] = [];
          acc[entry.day][entry.meal_type].push(entry.recipe_id);
          return acc;
        }, {} as any)
      };

      const { error } = await supabase
        .from('weekly_meal_plans')
        .insert([{
          user_id: user.id,
          name: `Meal Plan - ${weekStart.toLocaleDateString()}`,
          week_start: weekStart.toISOString().split('T')[0],
          plan_data: planData
        }]);

      if (error) throw error;

      toast({
        description: 'Meal plan saved as template!'
      });
    } catch (error) {
      console.error('Error saving meal plan:', error);
      toast({
        description: 'Failed to save meal plan',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">AI Meal Planner</h1>
          <div className="flex gap-2">
            <Button
              onClick={generateAIMealPlan}
              disabled={generatingPlan}
              className="flex items-center gap-2"
            >
              {generatingPlan ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Generate AI Plan
            </Button>
            <Button
              onClick={saveMealPlanAsTemplate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Save Plan
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recipe Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Available Recipes</h2>
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {recipes.slice(0, 10).map((recipe) => (
                <Card key={recipe.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{recipe.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {recipe.prep_time_minutes}min prep • {recipe.servings} servings
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      {days.slice(0, 2).map(day => (
                        <select
                          key={day}
                          onChange={(e) => {
                            if (e.target.value) {
                              addToMealPlan(recipe.id, day, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="text-xs p-1 border rounded w-20"
                          defaultValue=""
                        >
                          <option value="" disabled>{day.slice(0, 3)}</option>
                          {mealTypes.map(mealType => (
                            <option key={mealType} value={mealType}>
                              {mealType}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Meal Plan Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Weekly Meal Plan</h2>
            <div className="grid gap-4">
              {days.map((day) => (
                <Card key={day}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{day}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {mealTypes.map((mealType) => {
                        const meal = getMealForSlot(day, mealType);
                        const entry = mealPlan.find(m => m.day === day && m.meal_type === mealType);
                        
                        return (
                          <div key={mealType} className="border rounded p-2 min-h-[80px]">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {mealType}
                            </div>
                            {meal ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium truncate">
                                  {meal.title}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6"
                                  onClick={() => entry?.id && removeFromMealPlan(entry.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                No meal planned
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Saved Plans */}
        {weeklyPlans.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Saved Meal Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyPlans.slice(0, 6).map((plan) => (
                <Card key={plan.id} className="p-4">
                  <h4 className="font-medium mb-2">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Week of {new Date(plan.week_start).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Load
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MealPlanner;