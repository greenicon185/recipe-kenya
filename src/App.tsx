import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import FloatingChatBot from "./components/FloatingChatBot";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RecipeDetail from "./pages/RecipeDetail";
import Category from "./pages/Category";
import Cuisines from "./pages/Cuisines";
import CuisineDetail from "./pages/CuisineDetail";
import Auth from "./pages/Auth";
import Favorites from "./pages/Favorites";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRecipeCreate from "./pages/admin/RecipeCreate";
import AdminRecipeEdit from "./pages/admin/RecipeEdit";
import AdminSettings from "./pages/admin/Settings";
import Users from "./pages/admin/Users";
import EnhancedAnalyticsPage from "./pages/admin/EnhancedAnalytics";
import Support from "./pages/admin/Support";
import ProtectedRoute from "./components/ProtectedRoute";
import Supermarkets from "./pages/Supermarkets";
import MealPlanner from './pages/MealPlanner';
import MealPlans from './pages/MealPlans';
import Settings from './pages/Settings';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';

// Optimized QueryClient with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/category/:category" element={<Category />} />
        <Route path="/cuisines" element={<Cuisines />} />
        <Route path="/cuisine/:id" element={<CuisineDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/supermarkets" element={<Supermarkets />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/meal-plans" element={<MealPlans />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/communities/:id" element={<CommunityDetail />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/recipes/create" element={
          <ProtectedRoute>
            <AdminRecipeCreate />
          </ProtectedRoute>
        } />
        <Route path="/admin/recipes/edit/:id" element={
          <ProtectedRoute>
            <AdminRecipeEdit />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute>
            <EnhancedAnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/support" element={
          <ProtectedRoute>
            <Support />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        } />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Show FloatingChatBot only on user pages, not admin pages */}
      {!isAdminRoute && <FloatingChatBot />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
