import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: 'user' | 'admin' | 'super_admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as any;
};

export const createUser = async (userData: {
  email: string;
  password: string;
  full_name: string;
  username: string;
  role?: 'user' | 'admin';
}) => {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (authError) throw authError;

  // Create profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user!.id,
      full_name: userData.full_name,
      username: userData.username,
      role: userData.role || 'user',
      email: userData.email,
    })
    .select()
    .single();

  if (profileError) throw profileError;
  return profileData as any;
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(userData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as any;
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any;
};

export const deleteUser = async (userId: string) => {
  // Delete profile first
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) throw profileError;

  // Delete auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;
};

export const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'super_admin') => {
  const { data, error } = await supabase
    .from('profiles')
    .update({} as any)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}; 