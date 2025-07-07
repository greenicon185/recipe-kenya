import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecipeCard from "@/components/RecipeCard";
import { getRecipes, getRecipesByCategory, Recipe } from "@/services/recipeService";
import { trackRecipeView } from "@/services/recommendationService";
import { useAuth } from "@/contexts/AuthContext";

const Category = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const { user } = useAuth();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCategory, setDisplayCategory] = useState("");
  
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      
      try {
        let fetchedRecipes: Recipe[] = [];
        
        if (category?.toLowerCase() === "all") {
          fetchedRecipes = await getRecipes();
          setDisplayCategory("All Recipes");
        } else if (category) {
          fetchedRecipes = await getRecipesByCategory(category);
          setDisplayCategory(category.charAt(0).toUpperCase() + category.slice(1));
        } else {
          fetchedRecipes = [];
          setDisplayCategory("Recipes");
        }
        
        // Apply search filter if present
        if (searchTerm) {
          const normalizedSearchTerm = searchTerm.toLowerCase();
          fetchedRecipes = fetchedRecipes.filter(recipe => {
            const titleMatch = recipe.title.toLowerCase().includes(normalizedSearchTerm);
            const descMatch = recipe.description?.toLowerCase().includes(normalizedSearchTerm);
            let ingredientMatch = false;
            if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
              if (typeof recipe.ingredients[0] === 'object' && recipe.ingredients[0]?.ingredient) {
                ingredientMatch = recipe.ingredients.some((i: any) =>
                  i.ingredient?.name?.toLowerCase().includes(normalizedSearchTerm)
                );
              } else if (typeof recipe.ingredients[0] === 'string') {
                ingredientMatch = recipe.ingredients.some((i: any) =>
                  typeof i === 'string' && i.toLowerCase().includes(normalizedSearchTerm)
                );
              }
            }
            return titleMatch || descMatch || ingredientMatch;
          });
          
          // Track search interaction for recommendations
          if (user && fetchedRecipes.length > 0) {
            // Track the first few recipes from search results
            const recipesToTrack = fetchedRecipes.slice(0, 3);
            recipesToTrack.forEach(recipe => {
              trackRecipeView(recipe.id, 'search', searchTerm);
            });
          }
        }
        
        setRecipes(fetchedRecipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipes();
  }, [category, searchTerm]);
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">
              {searchTerm 
                ? `Search Results for "${searchTerm}" in ${displayCategory}` 
                : displayCategory}
            </h1>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
            </div>
          ) : recipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No recipes found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No recipes matching "${searchTerm}" in ${displayCategory}` 
                  : `No recipes in ${displayCategory} category yet`}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Category;
