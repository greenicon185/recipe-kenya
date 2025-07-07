import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Recipe {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
}

interface MealPlanEntry {
  id?: string;
  user_id: string;
  recipe_id: string;
  day: string;
  meal_type: string;
}

const SimpleMealPlanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch recipes
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, servings')
          .eq('is_published', true)
          .limit(20);

        if (recipesError) throw recipesError;
        setRecipes(recipesData || []);

        // Fetch existing meal plan
        const { data: mealPlanData, error: mealPlanError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id);

        if (mealPlanError) throw mealPlanError;
        setMealPlan(mealPlanData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          description: 'Failed to load meal planner data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

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
        description: 'Failed to add recipe to meal plan'
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
        description: 'Failed to remove recipe from meal plan'
      });
    }
  };

  const getMealForSlot = (day: string, mealType: string) => {
    const entry = mealPlan.find(m => m.day === day && m.meal_type === mealType);
    if (!entry) return null;
    return recipes.find(r => r.id === entry.recipe_id);
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
        <h1 className="text-3xl font-bold mb-6">Meal Planner</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recipe Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Recipes</h2>
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{recipe.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {recipe.prep_time_minutes}min prep
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {days.slice(0, 3).map(day => (
                        <select
                          key={day}
                          onChange={(e) => {
                            if (e.target.value) {
                              addToMealPlan(recipe.id, day, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="text-xs p-1 border rounded"
                          defaultValue=""
                        >
                          <option value="" disabled>Add to {day}</option>
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
          <div>
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
                          <div key={mealType} className="border rounded p-2 min-h-[60px]">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {mealType}
                            </div>
                            {meal ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium truncate">
                                  {meal.title}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs mt-1"
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
      </main>
      <Footer />
    </div>
  );
};

export default SimpleMealPlanner;