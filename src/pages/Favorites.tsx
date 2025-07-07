import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecipeCard from "@/components/RecipeCard";
import { getUserFavorites, removeFromFavorites } from "@/services/recipeService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Favorites = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await getUserFavorites();
        setFavorites(data || []);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [user]);
  
  const handleRemoveFavorite = async (recipeId: string) => {
    try {
      await removeFromFavorites(recipeId);
      setFavorites(favorites.filter(fav => fav.recipe.id !== recipeId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
            <p className="text-gray-600 mb-6">You need to be signed in to view your favorites.</p>
            <Link to="/auth">
              <Button className="bg-orange-600 hover:bg-orange-700">Sign In</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">My Favorite Recipes</h1>
          
          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="relative group">
                  <RecipeCard recipe={favorite.recipe} />
                  <Button
                    size="sm"
                    className="absolute top-2 right-2 bg-red-600 text-white hover:bg-red-700 opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveFavorite(favorite.recipe.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">Start exploring recipes and save your favorites!</p>
              <Link to="/category/all">
                <Button className="bg-orange-600 hover:bg-orange-700">Browse Recipes</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Favorites;
