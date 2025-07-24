-- Enable RLS and create policies for community tables

-- Communities table
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
CREATE POLICY "Communities are viewable by everyone" ON public.communities
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities" ON public.communities
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Community creators can update their own communities" ON public.communities
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Community creators can delete their own communities" ON public.communities
FOR DELETE USING (auth.uid() = created_by);

-- Community members table
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_members
CREATE POLICY "Community members are viewable by everyone" ON public.community_members
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join communities" ON public.community_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities they joined" ON public.community_members
FOR DELETE USING (auth.uid() = user_id);

-- Community posts table
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Community posts are viewable by everyone" ON public.community_posts
FOR SELECT USING (true);

CREATE POLICY "Community members can create posts" ON public.community_posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_posts.community_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Post authors can update their own posts" ON public.community_posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Post authors can delete their own posts" ON public.community_posts
FOR DELETE USING (auth.uid() = user_id);

-- Community post comments table
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_post_comments
CREATE POLICY "Comments are viewable by everyone" ON public.community_post_comments
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.community_post_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment authors can update their own comments" ON public.community_post_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Comment authors can delete their own comments" ON public.community_post_comments
FOR DELETE USING (auth.uid() = user_id);

-- Community post reactions table
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_post_reactions
CREATE POLICY "Reactions are viewable by everyone" ON public.community_post_reactions
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can react to posts" ON public.community_post_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON public.community_post_reactions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.community_post_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_reactions_post_id ON public.community_post_reactions(post_id);