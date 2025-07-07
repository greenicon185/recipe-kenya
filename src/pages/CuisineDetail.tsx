
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecipeCard from "@/components/RecipeCard";
import { getRecipes, Recipe } from "@/services/recipeService";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Cuisine {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  origin_country?: string;
  is_kenyan_local: boolean;
}

const CuisineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch cuisine details
        const { data: cuisineData, error: cuisineError } = await supabase
          .from('cuisines')
          .select('*')
          .eq('id', id)
          .single();
        
        if (cuisineError) throw cuisineError;
        
        // Fetch all recipes and filter by cuisine
        const allRecipes = await getRecipes();
        const cuisineRecipes = allRecipes.filter(recipe => recipe.cuisine_id === id);
        
        setCuisine(cuisineData);
        setRecipes(cuisineRecipes || []);
      } catch (error) {
        console.error('Error fetching cuisine data:', error);
        setError('Failed to load cuisine information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <Skeleton className="h-48 w-full rounded-lg mb-4" />
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !cuisine) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Cuisine Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The cuisine you are looking for does not exist.'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-64 bg-gradient-to-r from-orange-600 to-red-600 text-white">
          {cuisine.image_url && (
            <div className="absolute inset-0">
              <img
                src={cuisine.image_url}
                alt={cuisine.name}
                className="w-full h-full object-cover opacity-50"
              />
            </div>
          )}
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">{cuisine.name}</h1>
              <p className="text-xl opacity-90 max-w-2xl">{cuisine.description}</p>
              {cuisine.origin_country && (
                <p className="text-lg mt-2 opacity-75">From {cuisine.origin_country}</p>
              )}
            </div>
          </div>
        </section>
        
        {/* Recipes Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className={`h-6 w-2 rounded mr-3 ${cuisine.is_kenyan_local ? 'bg-green-600' : 'bg-blue-600'}`}></span>
              {cuisine.name} Recipes ({recipes.length})
            </h2>
            
            {recipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No recipes found</h3>
                <p className="text-gray-600">No recipes available for this cuisine yet.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default CuisineDetail;
