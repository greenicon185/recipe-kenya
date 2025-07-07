import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecipeCard from "@/components/RecipeCard";
import SearchBar from "@/components/SearchBar";
import { getFeaturedRecipes, getRecipes, Recipe } from "@/services/recipeService";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { getAIPoweredRecommendations, getOrCreateUserPreferences, UserPreference, createSampleRecipes } from "@/services/recommendationService";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<UserPreference | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        
        // Get featured recipes with error handling
        try {
          const featured = await getFeaturedRecipes();
          setFeaturedRecipes(featured || []);
        } catch (error) {
          console.error('Error fetching featured recipes:', error);
          setFeaturedRecipes([]);
        }
        
        // Get recent recipes with error handling
        try {
          const recent = await getRecipes({ limit: 8 });
          setRecentRecipes(recent || []);
          
          // If no recipes found, try to create sample recipes
          if (!recent || recent.length === 0) {
            console.log('No recipes found, creating sample recipes...');
            await createSampleRecipes();
            // Try fetching again
            const retryRecent = await getRecipes({ limit: 8 });
            setRecentRecipes(retryRecent || []);
          }
        } catch (error) {
          console.error('Error fetching recent recipes:', error);
          setRecentRecipes([]);
        }
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipes();
  }, []);
  
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (!user) return;
      setAiLoading(true);
      try {
        console.log('Fetching AI recommendations for user:', user.id);
        
        // Fetch user preferences first
        const preferences = await getOrCreateUserPreferences(user.id);
        console.log('User preferences:', preferences);
        setUserPreferences(preferences as any);
        
        // Get AI recommendations with preferences - with timeout
        console.log('Calling AI recommendations with timeout...');
        const aiPromise = getAIPoweredRecommendations(user.id);
        const aiData = await Promise.race([
          aiPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI recommendations timeout')), 5000)
          )
        ]) as Recipe[];
        console.log('AI recommendations:', aiData);
        setAiRecipes(aiData || []);
      } catch (e) {
        console.error('Error fetching AI recommendations:', e);
        // Don't set aiRecipes to empty array, let it show the fallback message
        setAiRecipes([]);
      } finally {
        setAiLoading(false);
      }
    };
    fetchAIRecommendations();
  }, [user]);
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading recipes...</p>
            </div>
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
        <section className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Discover Authentic Kenyan Recipes
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 opacity-90">
              From traditional Kikuyu dishes to coastal Swahili delicacies. Explore the rich culinary heritage of Kenya.
            </p>
            
            {/* Hero Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <SearchBar placeholder="Search for recipes..." className="w-full" />
            </div>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/cuisines">
                <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                  Explore Cuisines
                </Button>
              </Link>
              <Link to="/category/all">
                <Button size="lg" className="bg-white text-orange-600 border border-white shadow-lg hover:bg-orange-100">
                  Browse All Recipes
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Recommended Recipes (AI-Powered) */}
        {user && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="bg-purple-600 h-6 w-2 rounded mr-3"></span>
                Recommended Recipes
                <span className="ml-2 inline-flex items-center gap-1 text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full shadow">
                  <svg className="w-4 h-4 mr-1 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"/></svg>
                  AI-Powered
                </span>
              </h2>
              
              {/* Show personalization info */}
              {userPreferences && (
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                    <strong>Personalized for you:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.dietary_restrictions && userPreferences.dietary_restrictions.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Dietary:</span>
                        {userPreferences.dietary_restrictions.map((restriction) => (
                          <Badge key={restriction} variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300">
                            {restriction.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {userPreferences.cooking_skill_level && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Skill:</span>
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300">
                          {userPreferences.cooking_skill_level}
                        </Badge>
                      </div>
                    )}
                    {userPreferences.cooking_time_preference && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Time:</span>
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300">
                          {userPreferences.cooking_time_preference}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    💡 These preferences help our AI recommend recipes that match your dietary needs and cooking style.
                  </p>
                </div>
              )}
              
              {aiLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <div className="text-purple-600 text-lg font-medium">Loading personalized recommendations...</div>
                  <div className="text-sm text-purple-500 mt-2">Analyzing your preferences and finding the perfect recipes</div>
                </div>
              ) : aiRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="text-gray-600 text-lg font-medium mb-2">
                      {userPreferences ? 
                        "No personalized recommendations found" :
                        "Set your preferences to get personalized recommendations!"
                      }
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      {userPreferences ? 
                        "We couldn't find recipes that match your current preferences. Try adjusting your settings or explore our featured recipes below!" :
                        "Tell us about your dietary preferences and cooking style to get personalized recipe recommendations."
                      }
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-center flex-wrap">
                    {!userPreferences && (
                      <Link to="/settings">
                        <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
                          Set Preferences
                        </Button>
                      </Link>
                    )}
                    <Link to="/category/all">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        Explore All Recipes
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="text-sm text-gray-400 mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-500">💡</span>
                      <span className="font-medium">How AI recommendations work:</span>
                    </div>
                    <ul className="text-left text-xs space-y-1">
                      <li>• Analyzes your dietary restrictions and allergies</li>
                      <li>• Considers your cooking skill level and time preferences</li>
                      <li>• Learns from your favorite cuisines and meal types</li>
                      <li>• Updates recommendations as you interact with recipes</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        
        {/* Featured Recipes */}
        {featuredRecipes.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="bg-orange-600 h-6 w-2 rounded mr-3"></span>
                Featured Recipes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          </section>
        )}
        
        {/* Recent Recipes */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="bg-red-600 h-6 w-2 rounded mr-3"></span>
              Latest Recipes
            </h2>
            {recentRecipes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recentRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link to="/category/all">
                    <Button variant="outline" size="lg" className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white">
                      View All Recipes
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No recipes available at the moment.</p>
                <p className="text-sm text-gray-500">Check back later for delicious Kenyan recipes!</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Quick Categories */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-center">Popular Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Breakfast', link: '/category/breakfast', color: 'bg-yellow-500' },
                { name: 'Lunch', link: '/category/lunch', color: 'bg-green-500' },
                { name: 'Dinner', link: '/category/dinner', color: 'bg-blue-500' },
                { name: 'Desserts', link: '/category/desserts', color: 'bg-pink-500' }
              ].map((category) => (
                <Link key={category.name} to={category.link}>
                  <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 ${category.color} rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg`}>
                        {category.name.charAt(0)}
                      </div>
                      <h3 className="font-semibold">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 border-t bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to start cooking?</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
              Join our community of food lovers and discover new flavors from Kenya and around the world.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                Join Our Community
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
