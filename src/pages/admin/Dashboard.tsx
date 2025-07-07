
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecipes, Recipe, deleteRecipe } from "@/services/recipeService";
import { Edit, Trash2, Eye, Plus, ChefHat, Users, Star, TrendingUp, Activity, Settings, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import AdminAnalytics from "@/components/AdminAnalytics";
import SupportTickets from "@/components/SupportTickets";
import UserManagement from "@/components/UserManagement";

interface OverviewStats {
  totalUsers: number;
  totalRecipes: number;
  totalInteractions: number;
  supportTickets: number;
  newUsersToday: number;
  activeUsers: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

const AdminDashboard = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalUsers: 0,
    totalRecipes: 0,
    totalInteractions: 0,
    supportTickets: 0,
    newUsersToday: 0,
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recipes
      const recipesData = await getRecipes();
      setRecipes(recipesData);

      // Set mock stats for now to ensure the dashboard loads
      setOverviewStats({
        totalUsers: 45,
        totalRecipes: recipesData.length,
        totalInteractions: 234,
        supportTickets: 12,
        newUsersToday: 3,
        activeUsers: 28
      });

      // Set mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'recipe_created',
          description: 'New recipe "Kenyan Ugali" was created',
          timestamp: new Date().toISOString(),
          user: 'admin'
        },
        {
          id: '2',
          type: 'user_registered',
          description: 'New user registered',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'user123'
        },
        {
          id: '3',
          type: 'recipe_reviewed',
          description: 'Recipe received a 5-star review',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: 'foodlover'
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values even on error to prevent infinite loading
      setOverviewStats({
        totalUsers: 0,
        totalRecipes: 0,
        totalInteractions: 0,
        supportTickets: 0,
        newUsersToday: 0,
        activeUsers: 0
      });
      setRecentActivity([]);
      
      toast({
        title: "Error loading dashboard",
        description: "Some data may not be available.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteRecipe(id);
      setRecipes(recipes.filter(recipe => recipe.id !== id));
      toast({
        title: "Recipe deleted",
        description: "The recipe has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Error deleting recipe",
        description: "There was an error deleting the recipe.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">{overviewStats.totalUsers}</div>
                  <p className="text-xs text-blue-600">
                    +{overviewStats.newUsersToday} today
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Total Recipes</CardTitle>
                  <ChefHat className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-800">{overviewStats.totalRecipes}</div>
                  <p className="text-xs text-orange-600">
                    {recipes.filter(r => r.is_published).length} published
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">User Interactions</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">{overviewStats.totalInteractions}</div>
                  <p className="text-xs text-green-600">
                    {overviewStats.activeUsers} active users
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Support Tickets</CardTitle>
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-800">{overviewStats.supportTickets}</div>
                  <p className="text-xs text-purple-600">
                    Active tickets
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest user activities and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No recent activity found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-6">
            {/* Recipe Management */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ChefHat className="h-6 w-6 text-orange-600" />
                Recipe Management
              </h2>
              <Link to="/admin/recipes/create">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus size={16} className="mr-2" />
                  Add New Recipe
                </Button>
              </Link>
            </div>

            {/* Recipes Grid */}
            {recipes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ChefHat size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No recipes found. Start by creating your first recipe!</p>
                  <Link to="/admin/recipes/create">
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Plus size={16} className="mr-2" />
                      Create First Recipe
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <Card key={recipe.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200">
                    <div className="aspect-video relative">
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {recipe.is_featured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Star size={12} className="mr-1" />
                            Featured
                          </Badge>
                        )}
                        {!recipe.is_published && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-lg">{recipe.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {recipe.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                        <span>{recipe.cuisine?.name}</span>
                        <span>{recipe.total_time_minutes} mins</span>
                        <Badge variant="outline">{recipe.difficulty}</Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link to={`/recipe/${recipe.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </Link>
                        
                        <Link to={`/admin/recipes/edit/${recipe.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit size={14} />
                          </Button>
                        </Link>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(recipe.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="support">
            <SupportTickets />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  System Settings
                </CardTitle>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">System settings panel coming soon!</p>
                  <p className="text-sm text-gray-500">This will include site configuration, email settings, and more.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
