import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRecipe, Recipe, trackRecipeInteraction, addToFavorites, removeFromFavorites, getRecipeReviews, createReview, updateReview, deleteReview } from "@/services/recipeService";
import { trackRecipeView } from "@/services/recommendationService";
import { Clock, Users, Star, Heart, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getIngredientAvailability } from '@/services/supermarketService';
import { SupermarketIngredient } from '@/services/supermarketService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface RecipeIngredient {
  id: string;
  ingredient: {
    id: string;
    name: string;
  };
  quantity: number;
  unit: string;
  preparation_note?: string;
}

interface RecipeReview {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profile?: {
    username: string;
  };
}

interface IngredientWithAvailability extends RecipeIngredient {
  supermarketAvailability?: SupermarketIngredient[];
}

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientWithAvailability[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientWithAvailability | null>(null);
  const [reviews, setReviews] = useState<RecipeReview[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRecipe = async () => {
      if (id) {
        try {
          const fetchedRecipe = await getRecipe(id);
          setRecipe(fetchedRecipe);
          
          // Track view interaction
          if (user) {
            trackRecipeInteraction(id, 'view');
            trackRecipeView(id, 'view');
          }

          // Load supermarket availability for each ingredient
          if (Array.isArray(fetchedRecipe.ingredients) && fetchedRecipe.ingredients.length > 0) {
            if (typeof fetchedRecipe.ingredients[0] === 'object' && fetchedRecipe.ingredients[0]?.ingredient) {
              const ingredientsWithAvailability = await Promise.all(
                fetchedRecipe.ingredients.map(async (ingredient) => {
                  const availability = await getIngredientAvailability(ingredient.ingredient.id);
                  return {
                    ...ingredient,
                    supermarketAvailability: availability,
                  };
                })
              );
              setIngredients(ingredientsWithAvailability);
            } else {
              // If ingredients are just strings, skip supermarket availability
              setIngredients([]);
            }
          }

          // Check if recipe is favorited
          if (user && fetchedRecipe.id) {
            const { data } = await supabase
              .from('user_favorites')
              .select('id')
              .eq('user_id', user.id)
              .eq('recipe_id', fetchedRecipe.id)
              .single();
            setIsFavorited(!!data);
          }
        } catch (error) {
          console.error('Error fetching recipe:', error);
          navigate('/');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchRecipe();
  }, [id, navigate, user]);
  
  useEffect(() => {
    if (recipe?.id) {
      getRecipeReviews(recipe.id)
        .then((reviews) => setReviews(reviews as any))
        .catch((e) => console.error("Error loading reviews:", e));
    }
  }, [recipe?.id]);
  
  const adjustServings = (factor: number) => {
    if (servingMultiplier + factor > 0) {
      setServingMultiplier(servingMultiplier + factor);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save favorites.",
        variant: "destructive",
      });
      return;
    }

    if (!recipe) return;

    try {
      if (isFavorited) {
        await removeFromFavorites(recipe.id);
        setIsFavorited(false);
        toast({
          title: "Removed from favorites",
          description: "Recipe removed from your favorites.",
        });
      } else {
        await addToFavorites(recipe.id);
        setIsFavorited(true);
        trackRecipeInteraction(recipe.id, 'favorite');
        trackRecipeView(recipe.id, 'favorite');
        toast({
          title: "Added to favorites",
          description: "Recipe saved to your favorites.",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (recipe && navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href,
        });
        trackRecipeInteraction(recipe.id, 'share');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Recipe link copied to clipboard.",
      });
    }
  };

  const handlePrint = () => {
    if (recipe) {
      trackRecipeInteraction(recipe.id, 'print');
      window.print();
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingReview(true);
    try {
      const newReview = await createReview({
        recipe_id: recipe!.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews([newReview, ...reviews]);
      setReviewRating(0);
      setReviewComment("");
      toast({ title: "Review submitted!" });
    } catch (error) {
      toast({ title: "Error submitting review", description: String(error), variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review: RecipeReview) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const handleUpdateReview = async (reviewId: string) => {
    try {
      const updated = await updateReview(reviewId, { rating: editRating, comment: editComment });
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, rating: updated.rating, comment: updated.comment } : r));
      setEditingReviewId(null);
      toast({ title: "Review updated!" });
    } catch (error) {
      toast({ title: "Error updating review", description: String(error), variant: "destructive" });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
      setDeletingReviewId(null);
      toast({ title: "Review deleted!" });
    } catch (error) {
      toast({ title: "Error deleting review", description: String(error), variant: "destructive" });
    }
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4">Loading recipe...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!recipe) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Recipe not found</h2>
            <p className="mb-4">The recipe you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Recipe Hero */}
        <div className="relative h-72 md:h-96">
          <img 
            src={recipe.image_url || "https://images.unsplash.com/photo-1546548970-71785318a17b?w=800"} 
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">{recipe.title}</h1>
              <p className="text-white text-lg opacity-90 max-w-2xl">{recipe.description}</p>
            </div>
          </div>
        </div>
        
        {/* Recipe Info */}
        <div className="container mx-auto px-4 py-8">
          {/* Recipe Meta */}
          <Card className="-mt-10 md:-mt-16 relative mb-8 max-w-5xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-6 items-center justify-around mb-4">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Prep Time</p>
                    <p className="font-semibold">{recipe.prep_time_minutes || 0} mins</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Cook Time</p>
                    <p className="font-semibold">{recipe.cook_time_minutes || 0} mins</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Total Time</p>
                    <p className="font-semibold">{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} mins</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-orange-600 mr-2" />
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500 mr-2">Servings</p>
                    <div className="flex items-center border rounded">
                      <button 
                        onClick={() => adjustServings(-1)}
                        className="px-2 py-1 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="px-2 font-semibold">{(recipe.servings || 1) * servingMultiplier}</span>
                      <button 
                        onClick={() => adjustServings(1)}
                        className="px-2 py-1 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dietary Restrictions */}
              {Array.isArray(recipe.dietary_restrictions) && recipe.dietary_restrictions.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center justify-center mb-4">
                  <span className="text-sm text-gray-500 mr-2">Dietary:</span>
                  {recipe.dietary_restrictions.map((restriction) => (
                    <span
                      key={restriction}
                      className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full border border-green-200 capitalize"
                    >
                      {restriction.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant={isFavorited ? "default" : "outline"}
                  onClick={handleFavorite}
                  className={`flex items-center gap-2 ${isFavorited ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' : ''}`}
                >
                  <Heart size={16} className={isFavorited ? "fill-current" : ""} />
                  {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                </Button>
                <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
                  <Share2 size={16} />
                  Share
                </Button>
                <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                  <Printer size={16} />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recipe Content */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Ingredients */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b">Ingredients</h2>
                  <ul className="space-y-2">
                    {/* If detailed ingredients exist, show them */}
                    {ingredients && ingredients.length > 0 ? (
                      ingredients.map((ingredient) => (
                        <li key={ingredient.id} className="flex items-center justify-between">
                          <span>
                            {(ingredient.quantity * servingMultiplier).toFixed(1)} {ingredient.unit} {ingredient.ingredient.name}
                            {ingredient.preparation_note && (
                              <span className="text-gray-500 text-sm block">{ingredient.preparation_note}</span>
                            )}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedIngredient(ingredient)}
                              >
                                Where to Buy
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Where to buy {ingredient.ingredient.name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {ingredient.supermarketAvailability?.length ? (
                                  ingredient.supermarketAvailability.map((availability) => (
                                    <div
                                      key={availability.id}
                                      className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                      <div className="flex items-center space-x-4">
                                        <img
                                          src={availability.supermarket?.logo_url}
                                          alt={availability.supermarket?.name}
                                          className="w-12 h-12 object-contain"
                                        />
                                        <div>
                                          <p className="font-semibold">
                                            {availability.supermarket?.name}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            {availability.price} {availability.currency} per{' '}
                                            {availability.quantity} {availability.unit}
                                          </p>
                                        </div>
                                      </div>
                                      <a
                                        href={availability.product_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Button>View Product</Button>
                                      </a>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-center text-gray-500">
                                    No supermarket availability information found
                                  </p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </li>
                      ))
                    ) : (
                      // Otherwise, show the simple array from the new column
                      Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
                        recipe.ingredients.map((ingredient: any, idx: number) => (
                          <li key={idx}>{ingredient}</li>
                        ))
                      ) : (
                        <li>No ingredients listed.</li>
                      )
                    )}
                  </ul>
                  <div className="mt-6 flex justify-center">
                    <Button asChild size="lg" className="w-full md:w-auto">
                      <a href="/supermarkets">Buy ingredients</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Instructions */}
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b">Instructions</h2>
                  <ol className="space-y-6">
                    {Array.isArray(recipe.instructions) ? recipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex">
                        <div className="bg-orange-600 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <span>{instruction}</span>
                      </li>
                    )) : (
                      <li className="flex">
                        <div className="bg-orange-600 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                          1
                        </div>
                        <span>{recipe.instructions}</span>
                      </li>
                    )}
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      {/* User Reviews & Ratings Section */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">User Reviews & Ratings</h2>
            {/* Average Rating */}
            <div className="flex items-center mb-4">
              <Star className="text-yellow-500 mr-2" />
              <span className="text-lg font-semibold">
                {reviews.length > 0
                  ? (
                      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
                    ).toFixed(1)
                  : "No ratings yet"}
              </span>
              <span className="ml-2 text-gray-500">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            </div>
            {/* Review Form */}
            {user ? (
              <form onSubmit={handleSubmitReview} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="mr-2">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer ${star <= reviewRating ? "text-yellow-500" : "text-gray-300"}`}
                      onClick={() => setReviewRating(star)}
                      data-testid={`star-${star}`}
                    />
                  ))}
                </div>
                <Textarea
                  placeholder="Write your review..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="mb-2"
                  required
                />
                <Button type="submit" disabled={submittingReview || reviewRating === 0}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            ) : (
              <div className="mb-6 text-gray-500">Sign in to leave a review.</div>
            )}
            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-gray-500">No reviews yet. Be the first to review this recipe!</div>
              ) : (
                reviews.map((review) => {
                  const isOwnReview = user && review.user_id === user.id;
                  const isEditing = editingReviewId === review.id;
                  return (
                    <div key={review.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{review.profile?.username || "User"}</span>
                        <div className="flex items-center text-yellow-500">
                          <Star className="w-4 h-4" />
                          <span className="ml-1">{review.rating}</span>
                        </div>
                      </div>
                      {isEditing ? (
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            handleUpdateReview(review.id);
                          }}
                          className="mt-2 space-y-2"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="mr-2">Edit Rating:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 cursor-pointer ${star <= editRating ? "text-yellow-500" : "text-gray-300"}`}
                                onClick={() => setEditRating(star)}
                              />
                            ))}
                          </div>
                          <Textarea
                            value={editComment}
                            onChange={e => setEditComment(e.target.value)}
                            required
                          />
                          <div className="flex gap-2 mt-2">
                            <Button type="submit" size="sm">Save</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingReviewId(null)}>Cancel</Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                          </p>
                          {isOwnReview && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditReview(review)}>Edit</Button>
                              <Button size="sm" variant="destructive" onClick={() => setDeletingReviewId(review.id)}>Delete</Button>
                            </div>
                          )}
                          {/* Delete confirmation */}
                          {deletingReviewId === review.id && (
                            <div className="mt-2 flex gap-2 items-center">
                              <span>Are you sure?</span>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteReview(review.id)}>Yes, delete</Button>
                              <Button size="sm" variant="outline" onClick={() => setDeletingReviewId(null)}>Cancel</Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecipeDetail;
