import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  day: string;
  meal_type: string;
  created_at: string;
  updated_at: string;
  recipe?: {
    title: string;
    description: string;
  };
}

const MealPlans = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('meal_plans')
          .select('*, recipe:recipes(title, description)');
        if (error) throw error;
        setMealPlans(data as any || []);
      } catch (err) {
        console.error('Error fetching meal plans:', err);
        setError('Failed to load meal plans.');
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlans();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-32 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Meal Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mealPlans.map((mealPlan) => (
          <Card key={mealPlan.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{mealPlan.recipe?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{mealPlan.recipe?.description}</p>
              <p className="text-gray-500">Day: {mealPlan.day}</p>
              <p className="text-gray-500">Meal Type: {mealPlan.meal_type}</p>
              <p className="text-gray-500">Created: {new Date(mealPlan.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MealPlans; 