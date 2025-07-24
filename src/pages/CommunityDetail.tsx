import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  getCommunity, 
  getCommunityPosts, 
  getCommunityMembers, 
  checkMembership, 
  joinCommunity, 
  leaveCommunity,
  createPost,
  toggleReaction,
  getPostComments,
  createComment,
  Community, 
  CommunityPost, 
  CommunityMember 
} from "@/services/communityService";
import { getRecipes } from "@/services/recipeService";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Calendar, UserPlus, UserMinus, Heart, MessageCircle, Share2, Plus, Clock, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", recipe_id: "" });
  const [availableRecipes, setAvailableRecipes] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchCommunityData();
    }
  }, [id, user]);

  const fetchCommunityData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [communityData, postsData, membersData] = await Promise.all([
        getCommunity(id),
        getCommunityPosts(id),
        getCommunityMembers(id)
      ]);

      setCommunity(communityData);
      setPosts(postsData);
      setMembers(membersData);

      if (user) {
        const membershipStatus = await checkMembership(id);
        setIsMember(membershipStatus);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
      toast.error('Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRecipes = async () => {
    if (!user) return;
    try {
      const recipes = await getRecipes({ limit: 100 });
      setAvailableRecipes(recipes);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
    }
  };

  const handleJoinLeave = async () => {
    if (!user || !id) {
      toast.error('Please sign in first');
      return;
    }

    try {
      if (isMember) {
        await leaveCommunity(id);
        toast.success('Left community');
      } else {
        await joinCommunity(id);
        toast.success('Joined community!');
      }
      setIsMember(!isMember);
      fetchCommunityData();
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      toast.error('Failed to update membership');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    try {
      await createPost({
        community_id: id,
        content: newPost.content,
        recipe_id: newPost.recipe_id || undefined,
      });
      toast.success('Post created successfully!');
      setIsPostDialogOpen(false);
      setNewPost({ content: "", recipe_id: "" });
      fetchCommunityData();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleReaction = async (postId: string) => {
    if (!user) {
      toast.error('Please sign in to react');
      return;
    }

    try {
      await toggleReaction(postId, 'like');
      fetchCommunityData();
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to react');
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const commentsData = await getPostComments(postId);
      setComments(commentsData);
      setSelectedPost(postId);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      await createComment({
        post_id: postId,
        content: newComment,
      });
      setNewComment("");
      fetchComments(postId);
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading community...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800">Community not found</h2>
              <Link to="/communities">
                <Button className="mt-4">Back to Communities</Button>
              </Link>
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
        {/* Community Header */}
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
                <p className="text-lg opacity-90 mb-4">{community.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{members.length} members</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
                  </div>
                  {community.creator && (
                    <div className="flex items-center">
                      <span>by {community.creator.full_name || community.creator.username}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                {user && (
                  <>
                    <Button
                      onClick={handleJoinLeave}
                      variant={isMember ? "secondary" : "default"}
                      className={isMember ? "bg-white text-purple-600 hover:bg-gray-100" : "bg-white text-purple-600 hover:bg-gray-100"}
                    >
                      {isMember ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Leave
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join
                        </>
                      )}
                    </Button>
                    
                    {isMember && (
                      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-white text-purple-600 hover:bg-gray-100"
                            onClick={fetchUserRecipes}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            New Post
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Post</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                              <Label htmlFor="content">What would you like to share?</Label>
                              <Textarea
                                id="content"
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                placeholder="Share your cooking experience, ask questions, or start a discussion..."
                                rows={4}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="recipe">Attach a recipe (optional)</Label>
                              <Select value={newPost.recipe_id} onValueChange={(value) => setNewPost({ ...newPost, recipe_id: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a recipe to share" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRecipes.map((recipe) => (
                                    <SelectItem key={recipe.id} value={recipe.id}>
                                      {recipe.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="submit" className="w-full">
                              Create Post
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Community Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Posts */}
              <div className="lg:col-span-3">
                <h2 className="text-2xl font-bold mb-6">Community Posts</h2>
                
                {posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <Card key={post.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={post.author?.avatar_url} />
                                <AvatarFallback>
                                  {(post.author?.full_name || post.author?.username || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">
                                  {post.author?.full_name || post.author?.username}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(post.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <p className="text-gray-700 mb-4">{post.content}</p>
                          
                          {post.recipe && (
                            <Card className="mb-4 bg-gray-50">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  {post.recipe.image_url && (
                                    <img
                                      src={post.recipe.image_url}
                                      alt={post.recipe.title}
                                      className="w-20 h-20 object-cover rounded-lg"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-1">{post.recipe.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{post.recipe.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>{(post.recipe.prep_time_minutes || 0) + (post.recipe.cook_time_minutes || 0)} min</span>
                                      </div>
                                      <div className="flex items-center">
                                        <ChefHat className="w-4 h-4 mr-1" />
                                        <span>{post.recipe.difficulty}</span>
                                      </div>
                                    </div>
                                    <Link to={`/recipe/${post.recipe.id}`}>
                                      <Button size="sm" className="mt-2">View Recipe</Button>
                                    </Link>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          
                          <div className="flex items-center gap-4 pt-4 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReaction(post.id)}
                              className="text-gray-600 hover:text-red-600"
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              Like
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchComments(post.id)}
                              className="text-gray-600"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Comment
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600">
                              <Share2 className="w-4 h-4 mr-1" />
                              Share
                            </Button>
                          </div>
                          
                          {selectedPost === post.id && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="space-y-3 mb-4">
                                {comments.map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={comment.author?.avatar_url} />
                                      <AvatarFallback>
                                        {(comment.author?.full_name || comment.author?.username || 'U').charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="bg-gray-100 rounded-lg p-3">
                                        <h5 className="font-semibold text-sm">
                                          {comment.author?.full_name || comment.author?.username}
                                        </h5>
                                        <p className="text-sm">{comment.content}</p>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {user && (
                                <div className="flex gap-2">
                                  <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={2}
                                    className="flex-1"
                                  />
                                  <Button onClick={() => handleComment(post.id)}>
                                    Post
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-gray-600 mb-4">
                      Be the first to share something in this community!
                    </p>
                    {user && isMember && (
                      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={fetchUserRecipes}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Post
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Post</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                              <Label htmlFor="content">What would you like to share?</Label>
                              <Textarea
                                id="content"
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                placeholder="Share your cooking experience, ask questions, or start a discussion..."
                                rows={4}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="recipe">Attach a recipe (optional)</Label>
                              <Select value={newPost.recipe_id} onValueChange={(value) => setNewPost({ ...newPost, recipe_id: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a recipe to share" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRecipes.map((recipe) => (
                                    <SelectItem key={recipe.id} value={recipe.id}>
                                      {recipe.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="submit" className="w-full">
                              Create Post
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Members ({members.length})</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {members.slice(0, 10).map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.user?.avatar_url} />
                            <AvatarFallback>
                              {(member.user?.full_name || member.user?.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {member.user?.full_name || member.user?.username}
                            </p>
                            {member.role !== 'member' && (
                              <Badge variant="secondary" className="text-xs">
                                {member.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {members.length > 10 && (
                        <p className="text-sm text-gray-500">
                          +{members.length - 10} more members
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default CommunityDetail;