
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Eye, Heart, Clock } from "lucide-react";

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    pageViews: 12547,
    uniqueVisitors: 3421,
    avgSessionTime: '4m 32s',
    recipeViews: 8934,
    favoriteActions: 1245,
    searchQueries: 567
  });

  const [chartData] = useState([
    { name: 'Mon', views: 245, users: 89 },
    { name: 'Tue', views: 312, users: 124 },
    { name: 'Wed', views: 189, users: 67 },
    { name: 'Thu', views: 421, users: 156 },
    { name: 'Fri', views: 378, users: 143 },
    { name: 'Sat', views: 298, users: 112 },
    { name: 'Sun', views: 234, users: 87 }
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{analytics.pageViews.toLocaleString()}</div>
            <p className="text-xs text-blue-600">+12% from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{analytics.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-green-600">+8% from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Avg Session Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{analytics.avgSessionTime}</div>
            <p className="text-xs text-orange-600">+5% from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Recipe Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{analytics.recipeViews.toLocaleString()}</div>
            <p className="text-xs text-purple-600">+15% from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-700">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-800">{analytics.favoriteActions.toLocaleString()}</div>
            <p className="text-xs text-pink-600">+23% from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">Searches</CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-800">{analytics.searchQueries.toLocaleString()}</div>
            <p className="text-xs text-teal-600">+18% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Traffic Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            Weekly Traffic Overview
          </CardTitle>
          <CardDescription>Page views and unique visitors over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((day, index) => (
              <div key={day.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{day.name}</div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Views: <span className="font-semibold text-blue-600">{day.views}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Users: <span className="font-semibold text-green-600">{day.users}</span>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(day.views / 500) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Recipes */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Top Performing Recipes
          </CardTitle>
          <CardDescription>Most viewed recipes this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Kenyan Ugali with Sukuma Wiki', views: 1245, trend: '+15%' },
              { name: 'Nyama Choma Recipe', views: 987, trend: '+12%' },
              { name: 'Chapati from Scratch', views: 756, trend: '+8%' },
              { name: 'Samosa Recipe', views: 623, trend: '+22%' },
              { name: 'Githeri Recipe', views: 543, trend: '+5%' }
            ].map((recipe, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{recipe.name}</h4>
                  <p className="text-sm text-gray-500">{recipe.views} views</p>
                </div>
                <div className="text-green-600 text-sm font-medium">{recipe.trend}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
