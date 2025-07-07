import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RefreshCw, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserPreferences, updateUserPreferences, UserPreference } from '@/services/recommendationService';
import { useAuth } from '@/contexts/AuthContext';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description: string;
  is_public: boolean;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreference | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Mock data for now - in a real app, this would come from your API
  useEffect(() => {
    const mockSettings: SystemSetting[] = [
      {
        id: '1',
        setting_key: 'site_name',
        setting_value: 'Recipe Haven',
        category: 'general',
        description: 'Name of the recipe website',
        is_public: true
      },
      {
        id: '2',
        setting_key: 'recipes_per_page',
        setting_value: 12,
        category: 'general',
        description: 'Number of recipes to display per page',
        is_public: false
      },
      {
        id: '3',
        setting_key: 'featured_recipes_count',
        setting_value: 6,
        category: 'general',
        description: 'Number of featured recipes on homepage',
        is_public: false
      },
      {
        id: '4',
        setting_key: 'allow_user_uploads',
        setting_value: true,
        category: 'features',
        description: 'Allow users to upload their own recipes',
        is_public: false
      },
      {
        id: '5',
        setting_key: 'maintenance_mode',
        setting_value: false,
        category: 'system',
        description: 'Enable maintenance mode',
        is_public: false
      }
    ];

    setTimeout(() => {
      setSettings(mockSettings);
      setLoading(false);
    }, 1000);
  }, []);

  // Fetch user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) return;
      try {
        const preferences = await getUserPreferences(user.id);
        setUserPreferences(preferences);
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };
    fetchUserPreferences();
  }, [user]);

  const handleSettingChange = (settingKey: string, value: any) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: value }
          : setting
      )
    );
  };

  const handlePreferenceChange = (key: keyof UserPreference, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSavingPreferences(true);
    
    try {
      await updateUserPreferences(userPreferences || {});
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving preferences",
        description: "There was an error updating your preferences.",
        variant: "destructive",
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Settings saved",
        description: "All settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was an error updating the settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (typeof setting.setting_value) {
      case 'boolean':
        return (
          <Switch
            checked={setting.setting_value}
            onCheckedChange={(value) => handleSettingChange(setting.setting_key, value)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={setting.setting_value}
            onChange={(e) => handleSettingChange(setting.setting_key, Number(e.target.value))}
            className="max-w-24"
          />
        );
      case 'string':
        if (setting.setting_value.length > 50) {
          return (
            <Textarea
              value={setting.setting_value}
              onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
              rows={3}
            />
          );
        }
        return (
          <Input
            value={setting.setting_value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
          />
        );
      default:
        return (
          <Input
            value={JSON.stringify(setting.setting_value)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(setting.setting_key, parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
          />
        );
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  if (loading) {
    return (
      <AdminLayout title="System Settings">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            <span className="text-lg font-medium">Configure system settings</span>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* User Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Personal Preferences
            </CardTitle>
            <CardDescription>
              Configure your dietary restrictions and cooking preferences for personalized AI recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dietary Restrictions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Dietary Restrictions</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dietaryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={userPreferences?.dietary_restrictions?.includes(option) || false}
                      onCheckedChange={(checked) => {
                        const current = userPreferences?.dietary_restrictions || [];
                        const updated = checked
                          ? [...current, option]
                          : current.filter(item => item !== option);
                        handlePreferenceChange('dietary_restrictions', updated);
                      }}
                    />
                    <Label htmlFor={option} className="text-sm capitalize">
                      {option.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Cooking Skill Level */}
            <div className="space-y-2">
              <Label htmlFor="skill-level" className="text-sm font-medium">
                Cooking Skill Level
              </Label>
              <Select
                value={userPreferences?.cooking_skill_level || ''}
                onValueChange={(value) => handlePreferenceChange('cooking_skill_level', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="time-preference" className="text-sm font-medium">
                Preferred Cooking Time
              </Label>
              <Select
                value={userPreferences?.cooking_time_preference || ''}
                onValueChange={(value) => handlePreferenceChange('cooking_time_preference', value)}
              >
                <SelectTrigger>
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

            {/* Favorite Cuisines */}
            <div className="space-y-2">
              <Label htmlFor="cuisines" className="text-sm font-medium">
                Favorite Cuisines (comma-separated)
              </Label>
              <Input
                id="cuisines"
                placeholder="e.g., Italian, Mexican, Indian"
                value={userPreferences?.favorite_cuisines?.join(', ') || ''}
                onChange={(e) => {
                  const cuisines = e.target.value
                    .split(',')
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
                  handlePreferenceChange('favorite_cuisines', cuisines);
                }}
              />
            </div>

            {/* Save Preferences Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSavePreferences}
                disabled={savingPreferences}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {savingPreferences ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {savingPreferences ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">{category} Settings</CardTitle>
              <CardDescription>
                Configure {category} related settings for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categorySettings.map((setting) => (
                <div key={setting.setting_key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label 
                        htmlFor={setting.setting_key}
                        className="text-sm font-medium capitalize"
                      >
                        {setting.setting_key.replace(/_/g, ' ')}
                      </Label>
                      <p className="text-xs text-gray-500">{setting.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {setting.is_public && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
