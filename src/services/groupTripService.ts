import { supabase } from '../lib/supabase';

export interface TripMember {
  id: string;
  trip_id: string;
  user_id?: string;
  invited_email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'invited' | 'accepted' | 'declined';
  created_at: string;
}

export async function inviteCollaborator(
  tripId: string,
  email: string,
  role: 'editor' | 'viewer'
): Promise<TripMember> {
  const { data, error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, invited_email: email, role, status: 'invited' })
    .select()
    .single();

  if (error) throw error;

  // TODO: Send email invitation via Edge Function or external service
  return data;
}

export async function acceptInvitation(tripId: string): Promise<TripMember> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trip_members')
    .update({ user_id: user.id, status: 'accepted' })
    .eq('trip_id', tripId)
    .eq('invited_email', user.email)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId);

  if (error) throw error;
  return data || [];
}

export async function removeMember(tripId: string, memberId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('id', memberId);

  if (error) throw error;
}
