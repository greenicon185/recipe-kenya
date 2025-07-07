
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Utensils, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Recipe } from "@/services/recipeService";
import { trackRecipeView } from "@/services/recommendationService";
import { useAuth } from "@/contexts/AuthContext";

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const { user } = useAuth();

  const handleCardClick = () => {
    if (user) {
      trackRecipeView(recipe.id, 'view');
    }
  };

  return (
    <Link to={`/recipe/${recipe.id}`} onClick={handleCardClick}>
      <Card className="overflow-hidden recipe-card h-full hover:shadow-lg transition-shadow">
        <div className="relative h-48 overflow-hidden">
          <img
            src={recipe.image_url || "https://images.unsplash.com/photo-1546548970-71785318a17b?w=400"}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          {recipe.is_featured && (
            <span className="absolute top-2 right-2 bg-orange-600 text-white text-xs font-semibold px-2 py-1 rounded">
              Featured
            </span>
          )}
          <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-2 text-sm">
            {recipe.category?.name || 'Recipe'}
          </span>
        </div>
        <CardContent className="pt-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2">{recipe.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
          
          <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min</span>
            </div>
            <div className="flex items-center">
              <Utensils size={14} className="mr-1" />
              <span>{recipe.servings} servings</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${
              recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {recipe.difficulty}
            </span>
            
            {recipe.average_rating && (
              <div className="flex items-center">
                <Star size={14} className="text-yellow-400 fill-current mr-1" />
                <span className="text-sm font-medium">{recipe.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default RecipeCard;
