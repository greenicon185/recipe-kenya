import { supabase } from '@/integrations/supabase/client';

export interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string;
  created_by: string;
  created_at: string;
  creator?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  member_count?: number;
  is_member?: boolean;
}

export interface CommunityPost {
  id: string;
  community_id: string;
  user_id: string;
  recipe_id?: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  recipe?: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    difficulty: string;
    prep_time_minutes: number;
    cook_time_minutes: number;
  };
  comments_count?: number;
  reactions_count?: number;
  user_reaction?: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

// Community management
export const getCommunities = async () => {
  const { data, error } = await supabase
    .from('communities')
    .select(`
      *,
      creator:profiles!communities_created_by_fkey(username, full_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any;
};

export const getCommunity = async (id: string) => {
  const { data, error } = await supabase
    .from('communities')
    .select(`
      *,
      creator:profiles!communities_created_by_fkey(username, full_name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as any;
};

export const createCommunity = async (communityData: {
  name: string;
  description: string;
  cover_image_url?: string;
}) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('communities')
    .insert({
      ...communityData,
      created_by: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-join the creator as a member
  await joinCommunity(data.id);

  return data as any;
};

export const updateCommunity = async (id: string, updates: Partial<Community>) => {
  const { data, error } = await supabase
    .from('communities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
};

export const deleteCommunity = async (id: string) => {
  const { error } = await supabase
    .from('communities')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Community membership
export const joinCommunity = async (communityId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('community_members')
    .insert({
      community_id: communityId,
      user_id: user.user.id,
      role: 'member',
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
};

export const leaveCommunity = async (communityId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.user.id);

  if (error) throw error;
};

export const getCommunityMembers = async (communityId: string) => {
  const { data, error } = await supabase
    .from('community_members')
    .select(`
      *,
      user:profiles!community_members_user_id_fkey(username, full_name, avatar_url)
    `)
    .eq('community_id', communityId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return data as any;
};

export const checkMembership = async (communityId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data, error } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', user.user.id)
    .single();

  return !error && !!data;
};

// Community posts
export const getCommunityPosts = async (communityId: string) => {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      author:profiles!community_posts_user_id_fkey(username, full_name, avatar_url),
      recipe:recipes(id, title, description, image_url, difficulty, prep_time_minutes, cook_time_minutes)
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any;
};

export const createPost = async (postData: {
  community_id: string;
  content: string;
  recipe_id?: string;
  image_url?: string;
}) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      ...postData,
      user_id: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
};

export const updatePost = async (id: string, updates: { content?: string; image_url?: string }) => {
  const { data, error } = await supabase
    .from('community_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
};

export const deletePost = async (id: string) => {
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Comments
export const getPostComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('community_post_comments')
    .select(`
      *,
      author:profiles!community_post_comments_user_id_fkey(username, full_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as any;
};

export const createComment = async (commentData: {
  post_id: string;
  content: string;
}) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('community_post_comments')
    .insert({
      ...commentData,
      user_id: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
};

export const deleteComment = async (id: string) => {
  const { error } = await supabase
    .from('community_post_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Reactions
export const toggleReaction = async (postId: string, reactionType: string = 'like') => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('community_post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.user.id)
    .eq('reaction_type', reactionType)
    .single();

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from('community_post_reactions')
      .delete()
      .eq('id', existing.id);
    
    if (error) throw error;
    return { action: 'removed' };
  } else {
    // Add reaction
    const { data, error } = await supabase
      .from('community_post_reactions')
      .insert({
        post_id: postId,
        user_id: user.user.id,
        reaction_type: reactionType,
      })
      .select()
      .single();

    if (error) throw error;
    return { action: 'added', data };
  }
};

export const getPostReactions = async (postId: string) => {
  const { data, error } = await supabase
    .from('community_post_reactions')
    .select('reaction_type, user_id')
    .eq('post_id', postId);

  if (error) throw error;
  return data as any;
};