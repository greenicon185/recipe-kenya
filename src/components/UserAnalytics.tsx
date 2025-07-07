
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Heart, Eye, Clock, Star, ChefHat, Award, TrendingUp, Calendar 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserStats {
  favoriteRecipes: number;
  reviewsGiven: number;
  recipesViewed: number;
  cookingTimeTotal: number;
  averageRating: number;
  achievementLevel: string;
  streakDays: number;
}

const UserAnalytics = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const cookingActivityData = [
    { name: 'Mon', recipes: 2, time: 45 },
    { name: 'Tue', recipes: 1, time: 30 },
    { name: 'Wed', recipes: 3, time: 90 },
    { name: 'Thu', recipes: 2, time: 60 },
    { name: 'Fri', recipes: 4, time: 120 },
    { name: 'Sat', recipes: 2, time: 75 },
    { name: 'Sun', recipes: 1, time: 40 },
  ];

  const cuisinePreferences = [
    { name: 'Kenyan', value: 40, color: '#0088FE' },
    { name: 'Italian', value: 25, color: '#00C49F' },
    { name: 'Indian', value: 20, color: '#FFBB28' },
    { name: 'Chinese', value: 15, color: '#FF8042' },
  ];

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const [favorites, reviews, interactions] = await Promise.all([
        supabase.from('user_favorites').select('id').eq('user_id', user.id),
        supabase.from('recipe_reviews').select('id, rating').eq('user_id', user.id),
        supabase.from('recipe_interactions').select('id').eq('user_id', user.id).eq('interaction_type', 'view')
      ]);

      const averageRating = reviews.data?.length 
        ? reviews.data.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.data.length 
        : 0;

      const userStats: UserStats = {
        favoriteRecipes: favorites.data?.length || 0,
        reviewsGiven: reviews.data?.length || 0,
        recipesViewed: interactions.data?.length || 0,
        cookingTimeTotal: Math.floor(Math.random() * 500) + 100, // Simulated
        averageRating: Math.round(averageRating * 10) / 10,
        achievementLevel: getAchievementLevel(favorites.data?.length || 0, reviews.data?.length || 0),
        streakDays: Math.floor(Math.random() * 30) + 1 // Simulated
      };

      setStats(userStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementLevel = (favorites: number, reviews: number) => {
    const totalActivity = favorites + reviews;
    if (totalActivity >= 50) return 'Master Chef';
    if (totalActivity >= 25) return 'Seasoned Cook';
    if (totalActivity >= 10) return 'Home Cook';
    return 'Cooking Enthusiast';
  };

  const getAchievementColor = (level: string) => {
    switch (level) {
      case 'Master Chef': return 'bg-yellow-500';
      case 'Seasoned Cook': return 'bg-orange-500';
      case 'Home Cook': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Your Cooking Journey</h2>

      {/* Achievement Badge */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full ${getAchievementColor(stats.achievementLevel)} flex items-center justify-center`}>
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{stats.achievementLevel}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {stats.streakDays} day cooking streak! 🔥
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Recipes</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteRecipes}</div>
            <p className="text-xs text-muted-foreground">
              Recipes you love
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews Given</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewsGiven}</div>
            <p className="text-xs text-muted-foreground">
              Avg rating: {stats.averageRating}/5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipes Viewed</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recipesViewed}</div>
            <p className="text-xs text-muted-foreground">
              Recipes explored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cooking Time</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cookingTimeTotal}m</div>
            <p className="text-xs text-muted-foreground">
              Total time cooking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Cooking Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cookingActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="recipes" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="time" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuisine Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cuisinePreferences}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cuisinePreferences.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Progress Towards Next Level */}
      <Card>
        <CardHeader>
          <CardTitle>Progress to Next Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Recipe Reviews</span>
                <span>{stats.reviewsGiven}/25</span>
              </div>
              <Progress value={(stats.reviewsGiven / 25) * 100} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Favorite Recipes</span>
                <span>{stats.favoriteRecipes}/30</span>
              </div>
              <Progress value={(stats.favoriteRecipes / 30) * 100} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Cooking Streak</span>
                <span>{stats.streakDays}/30 days</span>
              </div>
              <Progress value={(stats.streakDays / 30) * 100} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAnalytics;
