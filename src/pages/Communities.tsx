import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCommunities, createCommunity, Community, checkMembership, joinCommunity } from "@/services/communityService";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Plus, Calendar, UserPlus } from "lucide-react";
import { toast } from "sonner";

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    cover_image_url: "",
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const data = await getCommunities();
      
      // Check membership for each community if user is logged in
      if (user) {
        const communitiesWithMembership = await Promise.all(
          data.map(async (community: Community) => {
            const isMember = await checkMembership(community.id);
            return { ...community, is_member: isMember };
          })
        );
        setCommunities(communitiesWithMembership);
      } else {
        setCommunities(data);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to create a community');
      return;
    }

    try {
      setCreating(true);
      await createCommunity(newCommunity);
      toast.success('Community created successfully!');
      setIsCreateOpen(false);
      setNewCommunity({ name: "", description: "", cover_image_url: "" });
      fetchCommunities();
    } catch (error) {
      console.error('Error creating community:', error);
      toast.error('Failed to create community');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      toast.error('Please sign in to join communities');
      return;
    }

    try {
      await joinCommunity(communityId);
      toast.success('Joined community successfully!');
      fetchCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community');
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
              <p className="mt-4 text-gray-600">Loading communities...</p>
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
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Recipe Communities</h1>
              <p className="text-xl mb-8 opacity-90">
                Join communities, share your recipes, and discover new culinary adventures
              </p>
              
              {user && (
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Community
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Community</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCommunity} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Community Name</Label>
                        <Input
                          id="name"
                          value={newCommunity.name}
                          onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                          placeholder="e.g., Kenyan Street Food Lovers"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newCommunity.description}
                          onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                          placeholder="Tell people what your community is about..."
                          rows={3}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cover_image">Cover Image URL (optional)</Label>
                        <Input
                          id="cover_image"
                          type="url"
                          value={newCommunity.cover_image_url}
                          onChange={(e) => setNewCommunity({ ...newCommunity, cover_image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={creating}>
                        {creating ? 'Creating...' : 'Create Community'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </section>

        {/* Communities Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {communities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map((community) => (
                  <Card key={community.id} className="hover:shadow-lg transition-shadow duration-200">
                    {community.cover_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={community.cover_image_url}
                          alt={community.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{community.name}</CardTitle>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {community.description}
                          </p>
                        </div>
                        {community.is_member && (
                          <Badge variant="secondary" className="ml-2">
                            Member
                          </Badge>
                        )}
                      </div>
                      
                      {community.creator && (
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <span>Created by {community.creator.full_name || community.creator.username}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{community.member_count || 0} members</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{new Date(community.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex gap-2">
                        <Link to={`/communities/${community.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Community
                          </Button>
                        </Link>
                        {user && !community.is_member && (
                          <Button
                            size="sm"
                            onClick={() => handleJoinCommunity(community.id)}
                            className="px-3"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Communities Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Be the first to create a recipe community and start sharing your culinary creations!
                </p>
                {user ? (
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Community
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Community</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateCommunity} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Community Name</Label>
                          <Input
                            id="name"
                            value={newCommunity.name}
                            onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                            placeholder="e.g., Kenyan Street Food Lovers"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newCommunity.description}
                            onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                            placeholder="Tell people what your community is about..."
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cover_image">Cover Image URL (optional)</Label>
                          <Input
                            id="cover_image"
                            type="url"
                            value={newCommunity.cover_image_url}
                            onChange={(e) => setNewCommunity({ ...newCommunity, cover_image_url: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={creating}>
                          {creating ? 'Creating...' : 'Create Community'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Link to="/auth">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Sign In to Create Community
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Communities;