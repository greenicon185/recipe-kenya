import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  User, 
  ChefHat, 
  Brain, 
  Bell, 
  Shield, 
  Eye, 
  Palette,
  Save,
  RefreshCw,
  Palette as ThemeIcon,
  Globe,
  Smartphone,
  Mail,
  Calendar,
  Target,
  Clock,
  Utensils,
  Heart,
  Zap
} from 'lucide-react';
import {
  getUserPreferences,
  getUserSettings,
  getUserAIPreferences,
  updateUserPreferences,
  updateUserSettings,
  updateUserAIPreferences,
  createDefaultAIPreferences,
  createSampleRecipes,
  createSampleCategoriesAndCuisines,
  ensureDatabaseTables,
  trackRecipeView,
  UserPreference,
  UserSettings,
  UserAIPreferences
} from '@/services/recommendationService';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State for different settings sections
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [aiPreferences, setAiPreferences] = useState<UserAIPreferences | null>(null);

  // Dietary restrictions options
  const dietaryOptions = [
    'vegetarian',
    'vegan', 
    'gluten_free',
    'dairy_free',
    'nut_free',
    'halal',
    'kosher'
  ];

  // Cooking skill levels
  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  // Cooking time preferences
  const timePreferences = [
    { value: 'quick', label: 'Quick (< 30 min)' },
    { value: 'medium', label: 'Medium (30-60 min)' },
    { value: 'lengthy', label: 'Lengthy (> 60 min)' }
  ];

  // Spice tolerance options
  const spiceOptions = [
    { value: 'mild', label: 'Mild' },
    { value: 'medium', label: 'Medium' },
    { value: 'hot', label: 'Hot' },
    { value: 'very_hot', label: 'Very Hot' }
  ];

  // Serving size preferences
  const servingOptions = [
    { value: 'small', label: 'Small (1-2 servings)' },
    { value: 'medium', label: 'Medium (3-4 servings)' },
    { value: 'large', label: 'Large (5+ servings)' }
  ];

  // Budget preferences
  const budgetOptions = [
    { value: 'budget', label: 'Budget-friendly' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'premium', label: 'Premium' }
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' }
  ];

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'sw', label: 'Swahili' },
    { value: 'fr', label: 'French' },
    { value: 'es', label: 'Spanish' }
  ];

  // Measurement system options
  const measurementOptions = [
    { value: 'metric', label: 'Metric (kg, g, ml)' },
    { value: 'imperial', label: 'Imperial (lb, oz, cups)' }
  ];

  // AI recommendation frequency
  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'never', label: 'Never' }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [prefs, sett, ai] = await Promise.all([
          getUserPreferences(user.id),
          getUserSettings(user.id),
          getUserAIPreferences(user.id)
        ]);
        
        setPreferences(prefs as any);
        setSettings(sett as any);
        setAiPreferences(ai as any);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Error",
          description: "Failed to load your settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, toast]);

  // Ensure AI preferences are initialized
  useEffect(() => {
    const initializeAIPreferences = async () => {
      if (!user || aiPreferences) return;
      
      try {
        // If AI preferences are null, try to create default ones
        const defaultAI = await createDefaultAIPreferences(user.id);
        if (defaultAI) {
          setAiPreferences(defaultAI);
        }
      } catch (error) {
        console.error('Error initializing AI preferences:', error);
      }
    };

    initializeAIPreferences();
  }, [user, aiPreferences]);

  const handlePreferenceChange = (key: keyof UserPreference, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleAIPreferenceChange = (key: keyof UserAIPreferences, value: any) => {
    setAiPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // First, check if database tables exist
      const tablesExist = await ensureDatabaseTables();
      if (!tablesExist) {
        throw new Error('Database tables not found. Please run the database migrations first.');
      }
      
      const savePromises = [];
      
      if (preferences) {
        savePromises.push(updateUserPreferences(preferences));
      }
      
      if (settings) {
        savePromises.push(updateUserSettings(settings));
      }
      
      if (aiPreferences) {
        savePromises.push(updateUserAIPreferences(aiPreferences));
      }

      await Promise.all(savePromises);

      setHasUnsavedChanges(false);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to save your settings. Please try again.";
      
      if (error instanceof Error) {
        console.error('Settings save error:', error);
        if (error.message.includes('AI preferences')) {
          errorMessage = "Failed to save AI recommendation settings. Please check your connection and try again.";
        } else if (error.message.includes('not authenticated')) {
          errorMessage = "Please log in again to save your settings.";
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = "Database tables not found. Please contact support.";
        } else if (error.message.includes('permission denied')) {
          errorMessage = "Permission denied. Please check your account status.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
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
        <div className="container mx-auto px-4 py-4 md:py-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
              <SettingsIcon className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
              Settings
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Customize your experience and preferences for personalized recipe recommendations.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mb-4 md:mb-6">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 h-10 md:h-10 px-4 md:px-6"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
              <span className="sm:hidden">{saving ? 'Saving' : 'Save'}</span>
            </Button>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="preferences" className="space-y-4 md:space-y-6" onValueChange={setActiveTab}>
            <div className="relative">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-1 md:gap-2 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl shadow-sm">
                <TabsTrigger 
                  value="preferences" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm h-12 md:h-12 relative transition-all duration-200 ease-in-out hover:scale-105 data-[state=active]:shadow-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400"
                  aria-label="User preferences and cooking settings"
                >
                  <User className="h-3 w-3 md:h-4 md:w-4 transition-colors duration-200" />
                                     <span className="hidden sm:inline font-medium">Preferences</span>
                   <span className="sm:hidden font-medium">Prefs</span>
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full opacity-0 transition-opacity duration-200 data-[state=active]:opacity-100"></div>
                   {hasUnsavedChanges && (
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                   )}
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm h-12 md:h-12 relative transition-all duration-200 ease-in-out hover:scale-105 data-[state=active]:shadow-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
                  aria-label="AI recommendation settings"
                >
                  <Brain className="h-3 w-3 md:h-4 md:w-4 transition-colors duration-200" />
                                     <span className="hidden sm:inline font-medium">AI Settings</span>
                   <span className="sm:hidden font-medium">AI</span>
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full opacity-0 transition-opacity duration-200 data-[state=active]:opacity-100"></div>
                   {hasUnsavedChanges && (
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                   )}
                </TabsTrigger>
                <TabsTrigger 
                  value="app" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm h-12 md:h-12 relative transition-all duration-200 ease-in-out hover:scale-105 data-[state=active]:shadow-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                  aria-label="App appearance and language settings"
                >
                  <Palette className="h-3 w-3 md:h-4 md:w-4 transition-colors duration-200" />
                                     <span className="hidden sm:inline font-medium">App Settings</span>
                   <span className="sm:hidden font-medium">App</span>
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 transition-opacity duration-200 data-[state=active]:opacity-100"></div>
                   {hasUnsavedChanges && (
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                   )}
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm h-12 md:h-12 relative transition-all duration-200 ease-in-out hover:scale-105 data-[state=active]:shadow-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-yellow-600 dark:data-[state=active]:text-yellow-400"
                  aria-label="Notification preferences"
                >
                  <Bell className="h-3 w-3 md:h-4 md:w-4 transition-colors duration-200" />
                                     <span className="hidden sm:inline font-medium">Notifications</span>
                   <span className="sm:hidden font-medium">Notif</span>
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full opacity-0 transition-opacity duration-200 data-[state=active]:opacity-100"></div>
                   {hasUnsavedChanges && (
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                   )}
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm h-12 md:h-12 relative transition-all duration-200 ease-in-out hover:scale-105 data-[state=active]:shadow-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400"
                  aria-label="Privacy and data settings"
                >
                  <Shield className="h-3 w-3 md:h-4 md:w-4 transition-colors duration-200" />
                                     <span className="hidden sm:inline font-medium">Privacy</span>
                   <span className="sm:hidden font-medium">Privacy</span>
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-0 transition-opacity duration-200 data-[state=active]:opacity-100"></div>
                   {hasUnsavedChanges && (
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                   )}
                </TabsTrigger>
                {process.env.NODE_ENV === 'development' && (
                  <TabsTrigger 
                    value="development" 
                    className="flex items-center gap-1 md:gap-2 text-xs md:text-sm h-12 md:h-12 relative transition-all duration-200 ease-in-out hover:scale-105 data-[state=active]:shadow-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400"
                    aria-label="Development tools"
                  >
                    <Zap className="h-3 w-3 md:h-4 md:w-4 transition-colors duration-200" />
                    <span className="hidden sm:inline font-medium">Dev</span>
                    <span className="sm:hidden font-medium">Dev</span>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full opacity-0 transition-opacity duration-200 data-[state=active]:opacity-100"></div>
                  </TabsTrigger>
                )}
              </TabsList>
              
              {/* Tab Progress Indicator */}
              <div className="mt-3 flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              </div>
              
              {/* Navigation Helper */}
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">←</kbd> <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">→</kbd> to navigate tabs
                </p>
                {hasUnsavedChanges && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Unsaved changes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4 md:space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <ChefHat className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                    Cooking Preferences
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Tell us about your cooking style and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Cooking Skill Level */}
                  <div className="space-y-2">
                    <Label htmlFor="skill-level" className="text-sm md:text-base">Cooking Skill Level</Label>
                    <Select
                      value={preferences?.cooking_skill_level || ''}
                      onValueChange={(value) => handlePreferenceChange('cooking_skill_level', value)}
                    >
                      <SelectTrigger className="h-10 md:h-10">
                        <SelectValue placeholder="Select your skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cooking Time Preference */}
                  <div className="space-y-2">
                    <Label htmlFor="time-preference" className="text-sm md:text-base">Preferred Cooking Time</Label>
                    <Select
                      value={preferences?.cooking_time_preference || ''}
                      onValueChange={(value) => handlePreferenceChange('cooking_time_preference', value)}
                    >
                      <SelectTrigger className="h-10 md:h-10">
                        <SelectValue placeholder="Select your time preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {timePreferences.map((pref) => (
                          <SelectItem key={pref.value} value={pref.value}>
                            {pref.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Spice Tolerance */}
                  <div className="space-y-2">
                    <Label htmlFor="spice-tolerance" className="text-sm md:text-base">Spice Tolerance</Label>
                    <Select
                      value={preferences?.spice_tolerance || ''}
                      onValueChange={(value) => handlePreferenceChange('spice_tolerance', value)}
                    >
                      <SelectTrigger className="h-10 md:h-10">
                        <SelectValue placeholder="Select your spice tolerance" />
                      </SelectTrigger>
                      <SelectContent>
                        {spiceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Serving Size Preference */}
                  <div className="space-y-2">
                    <Label htmlFor="serving-size" className="text-sm md:text-base">Preferred Serving Size</Label>
                    <Select
                      value={preferences?.serving_size_preference || ''}
                      onValueChange={(value) => handlePreferenceChange('serving_size_preference', value)}
                    >
                      <SelectTrigger className="h-10 md:h-10">
                        <SelectValue placeholder="Select your serving size preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {servingOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget Preference */}
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-sm md:text-base">Budget Preference</Label>
                    <Select
                      value={preferences?.budget_preference || ''}
                      onValueChange={(value) => handlePreferenceChange('budget_preference', value)}
                    >
                      <SelectTrigger className="h-10 md:h-10">
                        <SelectValue placeholder="Select your budget preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Heart className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                    Dietary Preferences
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Set your dietary restrictions and health preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Dietary Restrictions */}
                  <div className="space-y-3">
                    <Label className="text-sm md:text-base">Dietary Restrictions</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {dietaryOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                          <Checkbox
                            id={option}
                            checked={preferences?.dietary_restrictions?.includes(option) || false}
                            onCheckedChange={(checked) => {
                              const current = preferences?.dietary_restrictions || [];
                              const updated = checked
                                ? [...current, option]
                                : current.filter(item => item !== option);
                              handlePreferenceChange('dietary_restrictions', updated);
                            }}
                          />
                          <Label htmlFor={option} className="text-sm capitalize cursor-pointer flex-1">
                            {option.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="space-y-2">
                    <Label htmlFor="allergies" className="text-sm md:text-base">Allergies (comma-separated)</Label>
                    <Input
                      id="allergies"
                      placeholder="e.g., peanuts, shellfish, soy"
                      value={preferences?.allergies?.join(', ') || ''}
                      onChange={(e) => {
                        const allergies = e.target.value
                          .split(',')
                          .map(item => item.trim())
                          .filter(item => item.length > 0);
                        handlePreferenceChange('allergies', allergies);
                      }}
                      className="h-10 md:h-10"
                    />
                  </div>

                  {/* Favorite Cuisines */}
                  <div className="space-y-2">
                    <Label htmlFor="cuisines" className="text-sm md:text-base">Favorite Cuisines (comma-separated)</Label>
                    <Input
                      id="cuisines"
                      placeholder="e.g., Italian, Mexican, Indian"
                      value={preferences?.favorite_cuisines?.join(', ') || ''}
                      onChange={(e) => {
                        const cuisines = e.target.value
                          .split(',')
                          .map(item => item.trim())
                          .filter(item => item.length > 0);
                        handlePreferenceChange('favorite_cuisines', cuisines);
                      }}
                      className="h-10 md:h-10"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Settings Tab */}
            <TabsContent value="ai" className="space-y-4 md:space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Brain className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                    AI Recommendation Settings
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Customize how AI provides personalized recipe recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* AI Recommendations Enabled */}
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1 flex-1 pr-4">
                      <Label className="text-sm md:text-base">Enable AI Recommendations</Label>
                      <p className="text-xs md:text-sm text-gray-500">
                        Allow AI to suggest personalized recipes based on your preferences
                      </p>
                    </div>
                    <Switch
                      checked={aiPreferences?.ai_recommendations_enabled || false}
                      onCheckedChange={(checked) => handleAIPreferenceChange('ai_recommendations_enabled', checked)}
                    />
                  </div>

                  {/* Recommendation Frequency */}
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Recommendation Frequency</Label>
                    <Select
                      value={aiPreferences?.recommendation_frequency || ''}
                      onValueChange={(value) => handleAIPreferenceChange('recommendation_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Filters */}
                  <div className="space-y-3">
                    <Label className="text-sm md:text-base">Include in Recommendations</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="new-recipes" className="text-sm md:text-base cursor-pointer flex-1">New Recipes</Label>
                        <Switch
                          id="new-recipes"
                          checked={aiPreferences?.include_new_recipes || false}
                          onCheckedChange={(checked) => handleAIPreferenceChange('include_new_recipes', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="popular-recipes" className="text-sm md:text-base cursor-pointer flex-1">Popular Recipes</Label>
                        <Switch
                          id="popular-recipes"
                          checked={aiPreferences?.include_popular_recipes || false}
                          onCheckedChange={(checked) => handleAIPreferenceChange('include_popular_recipes', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="seasonal-recipes" className="text-sm md:text-base cursor-pointer flex-1">Seasonal Recipes</Label>
                        <Switch
                          id="seasonal-recipes"
                          checked={aiPreferences?.include_seasonal_recipes || false}
                          onCheckedChange={(checked) => handleAIPreferenceChange('include_seasonal_recipes', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="healthy-recipes" className="text-sm md:text-base cursor-pointer flex-1">Healthy Recipes</Label>
                        <Switch
                          id="healthy-recipes"
                          checked={aiPreferences?.include_healthy_recipes || false}
                          onCheckedChange={(checked) => handleAIPreferenceChange('include_healthy_recipes', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="quick-recipes" className="text-sm md:text-base cursor-pointer flex-1">Quick Recipes</Label>
                        <Switch
                          id="quick-recipes"
                          checked={aiPreferences?.include_quick_recipes || false}
                          onCheckedChange={(checked) => handleAIPreferenceChange('include_quick_recipes', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Max Recommendations */}
                  <div className="space-y-2">
                    <Label htmlFor="max-recommendations" className="text-sm md:text-base">Maximum Recommendations per Day</Label>
                    <Input
                      id="max-recommendations"
                      type="number"
                      min="1"
                      max="50"
                      value={aiPreferences?.max_recommendations_per_day || 10}
                      onChange={(e) => handleAIPreferenceChange('max_recommendations_per_day', parseInt(e.target.value))}
                      className="h-10 md:h-10"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* App Settings Tab */}
            <TabsContent value="app" className="space-y-4 md:space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Palette className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    Appearance & Language
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Customize the look and language of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Theme */}
                  <div className="space-y-2">
                    <Label htmlFor="theme" className="text-sm md:text-base">Theme</Label>
                    <Select
                      value={settings?.theme || ''}
                      onValueChange={(value) => handleSettingChange('theme', value)}
                    >
                      <SelectTrigger className="h-10 md:h-10">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {themeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm md:text-base">Language</Label>
                    <Select
                      value={settings?.language || ''}
                      onValueChange={(value) => handleSettingChange('language', value)}
                    >
                      <SelectTrigger className="h-10 md:h-10">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Measurement System */}
                  <div className="space-y-2">
                    <Label htmlFor="measurement" className="text-sm md:text-base">Measurement System</Label>
                    <Select
                      value={settings?.measurement_system || ''}
                      onValueChange={(value) => handleSettingChange('measurement_system', value)}
                    >
                      <SelectTrigger className="h-10 md:h-10">
                        <SelectValue placeholder="Select measurement system" />
                      </SelectTrigger>
                      <SelectContent>
                        {measurementOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Default Servings */}
                  <div className="space-y-2">
                    <Label htmlFor="default-servings" className="text-sm md:text-base">Default Servings</Label>
                    <Input
                      id="default-servings"
                      type="number"
                      min="1"
                      max="20"
                      value={settings?.default_servings || 4}
                      onChange={(e) => handleSettingChange('default_servings', parseInt(e.target.value))}
                      className="h-10 md:h-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    Display Options
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Control what information is shown in recipes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1 flex-1 pr-4">
                      <Label className="text-sm md:text-base">Show Nutritional Information</Label>
                      <p className="text-xs md:text-sm text-gray-500">
                        Display calories, protein, carbs, and other nutritional data
                      </p>
                    </div>
                    <Switch
                      checked={settings?.show_nutritional_info || false}
                      onCheckedChange={(checked) => handleSettingChange('show_nutritional_info', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1 flex-1 pr-4">
                      <Label className="text-sm md:text-base">Show Cooking Tips</Label>
                      <p className="text-xs md:text-sm text-gray-500">
                        Display helpful tips and tricks while cooking
                      </p>
                    </div>
                    <Switch
                      checked={settings?.show_cooking_tips || false}
                      onCheckedChange={(checked) => handleSettingChange('show_cooking_tips', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1 flex-1 pr-4">
                      <Label className="text-sm md:text-base">Auto-save Meal Plans</Label>
                      <p className="text-xs md:text-sm text-gray-500">
                        Automatically save your meal plans as you create them
                      </p>
                    </div>
                    <Switch
                      checked={settings?.auto_save_meal_plans || false}
                      onCheckedChange={(checked) => handleSettingChange('auto_save_meal_plans', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4 md:space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Bell className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1 flex-1 pr-4">
                      <Label className="text-sm md:text-base">Enable Notifications</Label>
                      <p className="text-xs md:text-sm text-gray-500">
                        Receive notifications about new features and updates
                      </p>
                    </div>
                    <Switch
                      checked={settings?.notifications_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('notifications_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1 flex-1 pr-4">
                      <Label className="text-sm md:text-base">Email Notifications</Label>
                      <p className="text-xs md:text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings?.email_notifications || false}
                      onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1 flex-1 pr-4">
                      <Label className="text-sm md:text-base">Push Notifications</Label>
                      <p className="text-xs md:text-sm text-gray-500">
                        Receive push notifications on your device
                      </p>
                    </div>
                    <Switch
                      checked={settings?.push_notifications || false}
                      onCheckedChange={(checked) => handleSettingChange('push_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1 flex-1 pr-4">
                      <Label className="text-sm md:text-base">Newsletter Subscription</Label>
                      <p className="text-xs md:text-sm text-gray-500">
                        Receive weekly recipe newsletters and updates
                      </p>
                    </div>
                    <Switch
                      checked={settings?.newsletter_subscription || false}
                      onCheckedChange={(checked) => handleSettingChange('newsletter_subscription', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4 md:space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Control your privacy and data sharing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="privacy-level" className="text-sm md:text-base">Profile Visibility</Label>
                    <Select
                      value={settings?.privacy_level || ''}
                      onValueChange={(value) => handleSettingChange('privacy_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select privacy level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-sm md:text-base">Data Usage</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="space-y-1 flex-1 pr-4">
                          <Label className="text-sm md:text-base">Allow Data Analytics</Label>
                          <p className="text-xs md:text-sm text-gray-500">
                            Help us improve by sharing anonymous usage data
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="space-y-1 flex-1 pr-4">
                          <Label className="text-sm md:text-base">Personalization</Label>
                          <p className="text-xs md:text-sm text-gray-500">
                            Allow personalized recommendations based on your activity
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Development Tab - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <TabsContent value="development" className="space-y-4 md:space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
                <Card>
                  <CardHeader className="pb-4 md:pb-6">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <Zap className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                      Development Tools
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Tools for development and testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Sample Data</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Create sample categories, cuisines, and recipes for testing the recommendation system
                      </p>
                      <div className="space-y-2">
                        <Button 
                          onClick={async () => {
                            try {
                              await createSampleCategoriesAndCuisines();
                              toast({
                                title: "Success",
                                description: "Sample categories and cuisines created successfully!",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to create sample categories and cuisines.",
                                variant: "destructive",
                              });
                            }
                          }}
                          variant="outline"
                          className="w-full md:w-auto"
                        >
                          Create Categories & Cuisines
                        </Button>
                        <Button 
                          onClick={async () => {
                            try {
                              await createSampleRecipes();
                              toast({
                                title: "Success",
                                description: "Sample recipes created successfully!",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to create sample recipes.",
                                variant: "destructive",
                              });
                            }
                          }}
                          variant="outline"
                          className="w-full md:w-auto"
                        >
                          Create Sample Recipes
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Database Setup</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Check if required database tables exist and create them if needed
                      </p>
                      <div className="space-y-2">
                        <Button 
                          onClick={async () => {
                            try {
                              const tablesExist = await ensureDatabaseTables();
                              if (tablesExist) {
                                toast({
                                  title: "Success",
                                  description: "All database tables exist and are ready!",
                                });
                              } else {
                                toast({
                                  title: "Tables Missing",
                                  description: "Some database tables are missing. Please run the SQL script in Supabase.",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to check database tables.",
                                variant: "destructive",
                              });
                            }
                          }}
                          variant="outline"
                          className="w-full md:w-auto"
                        >
                          Check Database Tables
                        </Button>
                        <div className="text-xs text-gray-500">
                          💡 If tables are missing, copy the contents of <code className="bg-gray-100 px-1 rounded">setup_database.sql</code> and run it in your Supabase SQL editor.
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Recipe Views Tracking</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Create the recipe_views table for dynamic recommendations based on user behavior
                      </p>
                      <div className="space-y-2">
                        <Button 
                          onClick={async () => {
                            try {
                              // This will show instructions since we can't run SQL directly
                              toast({
                                title: "Setup Required",
                                description: "Copy setup_recipe_views.sql content and run it in Supabase SQL editor to enable dynamic recommendations.",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to check recipe views table.",
                                variant: "destructive",
                              });
                            }
                          }}
                          variant="outline"
                          className="w-full md:w-auto"
                        >
                          Setup Recipe Views
                        </Button>
                        <div className="text-xs text-gray-500">
                          💡 Copy <code className="bg-gray-100 px-1 rounded">setup_recipe_views.sql</code> content and run it in your Supabase SQL editor.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings; 