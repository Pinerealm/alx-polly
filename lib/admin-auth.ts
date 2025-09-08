import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Check if the current user is an admin using database role system
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return false;
  }
  
  // Check if user has admin role in database
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();
  
  if (roleError || !roleData) {
    return false;
  }
  
  return roleData.role === 'admin';
}

/**
 * Check if the current user is an admin and redirect if not
 * This should be used in server components and server actions
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/polls');
  }
}

/**
 * Get admin status for client-side components
 * @returns Promise<{ isAdmin: boolean; userId: string | null }>
 */
export async function getAdminStatus(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { isAdmin: false, userId: null };
  }
  
  // Check if user has admin role in database
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();
  
  const isAdmin = !roleError && roleData && roleData.role === 'admin';
  
  return {
    isAdmin,
    userId: user.id
  };
}
