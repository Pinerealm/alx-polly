'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

export interface AdminPoll {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  options: string[];
  user_email?: string;
}

/**
 * Get all polls for admin view - requires admin authorization
 */
export async function getAllPollsForAdmin(): Promise<{ polls: AdminPoll[]; error: string | null }> {
  try {
    // Require admin access
    await requireAdmin();
    
    const supabase = await createClient();
    
    // Get all polls with user email information
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        user_id,
        created_at,
        options
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching polls for admin:', error);
      return { polls: [], error: 'Failed to fetch polls' };
    }
    
    // Get user emails separately
    const userIds = [...new Set(polls?.map(poll => poll.user_id) || [])];
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    const userEmailMap = new Map();
    if (!usersError && users?.users) {
      users.users.forEach(user => {
        userEmailMap.set(user.id, user.email);
      });
    }
    
    // Transform the data to include user email
    const transformedPolls: AdminPoll[] = polls?.map(poll => ({
      id: poll.id,
      question: poll.question,
      user_id: poll.user_id,
      created_at: poll.created_at,
      options: poll.options,
      user_email: userEmailMap.get(poll.user_id) || 'Unknown'
    })) || [];
    
    return { polls: transformedPolls, error: null };
  } catch (error) {
    console.error('Admin action error:', error);
    return { polls: [], error: 'Unauthorized access' };
  }
}

/**
 * Delete a poll as admin - requires admin authorization
 */
export async function deletePollAsAdmin(pollId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Require admin access
    await requireAdmin();
    
    const supabase = await createClient();
    
    // Delete the poll (this will cascade delete votes due to foreign key constraint)
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);
    
    if (error) {
      console.error('Error deleting poll:', error);
      return { success: false, error: 'Failed to delete poll' };
    }
    
    // Revalidate the admin page to refresh the data
    revalidatePath('/admin');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Admin delete error:', error);
    return { success: false, error: 'Unauthorized access' };
  }
}
