import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Users,
  Plus,
  Play,
  Clock,
  ChefHat,
  Trophy,
  BookOpen,
  Zap,
  Globe,
  Lock,
  UserPlus,
  Settings,
  Calendar,
  Star,
  Crown,
  Timer,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CookingSession {
  id: string;
  session_name: string;
  session_type: string;
  recipe_id: string;
  host_user_id: string;
  max_participants: number;
  is_active: boolean;
  session_data: any;
  started_at: string;
  participants?: any[];
  recipe?: any;
}

const CookingSessionLobby: React.FC = () => {
  const [sessions, setSessions] = useState<CookingSession[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSessions();
      // Set up real-time subscription for sessions
      const subscription = supabase
        .channel('cooking_sessions')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'cooking_sessions'
        }, () => {
          fetchSessions();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('cooking_sessions')
        .select(`
          *,
          recipe:recipes(id, title, image_url, difficulty, total_time_minutes),
          participants:cooking_session_participants(
            id,
            role,
            user_id,
            joined_at,
            profile:profiles(full_name, avatar_url)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(sessionsData || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load cooking sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('cooking_session_participants')
        .insert({
          session_id: sessionId,
          user_id: user?.id,
          role: 'participant'
        });

      if (error) throw error;

      toast({
        title: "Joined Session! 👨‍🍳",
        description: "You're now part of this cooking session"
      });

      await fetchSessions();
    } catch (error: any) {
      toast({
        title: "Failed to Join",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const CreateSessionForm = () => {
    const [sessionName, setSessionName] = useState('');
    const [sessionType, setSessionType] = useState('collaborative');
    const [maxParticipants, setMaxParticipants] = useState(4);
    const [recipeId, setRecipeId] = useState('');
    const [recipes, setRecipes] = useState<any[]>([]);

    useEffect(() => {
      // Fetch available recipes
      supabase
        .from('recipes')
        .select('id, title, difficulty')
        .eq('is_published', true)
        .limit(20)
        .then(({ data }) => setRecipes(data || []));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sessionName.trim() || !recipeId) return;

      try {
        const { error } = await supabase
          .from('cooking_sessions')
          .insert({
            session_name: sessionName,
            session_type: sessionType,
            recipe_id: recipeId,
            host_user_id: user?.id,
            max_participants: maxParticipants,
            session_data: {
              created_by: user?.id,
              settings: {
                allow_voice_chat: true,
                show_progress: true,
                competitive_mode: sessionType === 'competitive'
              }
            }
          });

        if (error) throw error;

        toast({
          title: "Session Created! 🎉",
          description: "Your cooking session is ready for participants"
        });

        setIsCreating(false);
        setSessionName('');
        setRecipeId('');
        await fetchSessions();
      } catch (error: any) {
        toast({
          title: "Creation Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className="border-dashed border-2 border-primary/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Cooking Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  id="sessionName"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Sunday Pasta Making"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sessionType">Session Type</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collaborative">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Collaborative - Cook together
                      </div>
                    </SelectItem>
                    <SelectItem value="competitive">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Competitive - Race to finish
                      </div>
                    </SelectItem>
                    <SelectItem value="learning">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Learning - Guided tutorial
                      </div>
                    </SelectItem>
                    <SelectItem value="masterclass">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Masterclass - Expert led
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recipe">Recipe</Label>
                <Select value={recipeId} onValueChange={setRecipeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.title} - {recipe.difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Select 
                  value={maxParticipants.toString()} 
                  onValueChange={(value) => setMaxParticipants(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 people</SelectItem>
                    <SelectItem value="4">4 people</SelectItem>
                    <SelectItem value="6">6 people</SelectItem>
                    <SelectItem value="8">8 people</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const SessionCard = ({ session }: { session: CookingSession }) => {
    const participantCount = session.participants?.length || 0;
    const isHost = session.host_user_id === user?.id;
    const isParticipant = session.participants?.some(p => p.user_id === user?.id);
    const canJoin = participantCount < session.max_participants && !isParticipant;

    const getSessionIcon = (type: string) => {
      switch (type) {
        case 'collaborative': return <Users className="w-5 h-5" />;
        case 'competitive': return <Trophy className="w-5 h-5" />;
        case 'learning': return <BookOpen className="w-5 h-5" />;
        case 'masterclass': return <Crown className="w-5 h-5" />;
        default: return <ChefHat className="w-5 h-5" />;
      }
    };

    const getSessionColor = (type: string) => {
      switch (type) {
        case 'collaborative': return 'text-blue-500';
        case 'competitive': return 'text-red-500';
        case 'learning': return 'text-green-500';
        case 'masterclass': return 'text-purple-500';
        default: return 'text-gray-500';
      }
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="relative"
      >
        <Card className="bg-gradient-to-br from-background via-background/50 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={getSessionColor(session.session_type)}>
                    {getSessionIcon(session.session_type)}
                  </span>
                  <CardTitle className="text-lg">{session.session_name}</CardTitle>
                  {isHost && (
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Host
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {participantCount}/{session.max_participants}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    {session.recipe?.total_time_minutes || 30}min
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {session.session_type}
                  </Badge>
                </div>
              </div>
              
              {session.recipe?.image_url && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={session.recipe.image_url}
                    alt={session.recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Recipe Info */}
            {session.recipe && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{session.recipe.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Difficulty: {session.recipe.difficulty}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1" />
                    Recipe
                  </Badge>
                </div>
              </div>
            )}

            {/* Participants */}
            {session.participants && session.participants.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Participants</Label>
                <div className="flex items-center gap-2 mt-2">
                  {session.participants.slice(0, 4).map((participant: any, index: number) => (
                    <Avatar key={participant.id} className="w-8 h-8">
                      <AvatarImage src={participant.profile?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {participant.profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {session.participants.length > 4 && (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">
                      +{session.participants.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Actions */}
            <div className="flex gap-2 pt-2">
              {isHost ? (
                <Button className="flex-1 bg-green-500 hover:bg-green-600">
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
              ) : canJoin ? (
                <Button 
                  onClick={() => joinSession(session.id)}
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
              ) : isParticipant ? (
                <Button variant="secondary" className="flex-1" disabled>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Joined
                </Button>
              ) : (
                <Button variant="outline" className="flex-1" disabled>
                  <Lock className="w-4 h-4 mr-2" />
                  Session Full
                </Button>
              )}
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Cooking Sessions
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Join collaborative cooking experiences with chefs and food lovers worldwide
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-xl font-semibold">{sessions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Participants</p>
              <p className="text-xl font-semibold">
                {sessions.reduce((total, session) => total + (session.participants?.length || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Masterclasses</p>
              <p className="text-xl font-semibold">
                {sessions.filter(s => s.session_type === 'masterclass').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trophy className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Competitions</p>
              <p className="text-xl font-semibold">
                {sessions.filter(s => s.session_type === 'competitive').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
          
          {isCreating ? (
            <CreateSessionForm />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card 
                className="border-dashed border-2 border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors h-full"
                onClick={() => setIsCreating(true)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">Create Session</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a new collaborative cooking experience
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CookingSessionLobby;