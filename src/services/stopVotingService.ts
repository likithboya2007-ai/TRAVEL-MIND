import { supabase } from '../lib/supabase';

export interface StopVote {
  id: string;
  trip_id: string;
  stop_id: string;
  user_id: string;
  vote: 1 | -1;
  created_at: string;
}

export async function voteStop(
  tripId: string,
  stopId: string,
  vote: 1 | -1
): Promise<StopVote> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('stop_votes')
    .upsert(
      {
        trip_id: tripId,
        stop_id: stopId,
        user_id: user.id,
        vote,
      },
      { onConflict: 'trip_id,stop_id,user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStopVotes(
  tripId: string,
  stopId: string
): Promise<{ upvotes: number; downvotes: number; score: number }> {
  const { data, error } = await supabase
    .from('stop_votes')
    .select('vote')
    .eq('trip_id', tripId)
    .eq('stop_id', stopId);

  if (error) throw error;

  const upvotes = data?.filter((v) => v.vote === 1).length || 0;
  const downvotes = data?.filter((v) => v.vote === -1).length || 0;

  return { upvotes, downvotes, score: upvotes - downvotes };
}

export async function getAllStopVotes(
  tripId: string
): Promise<Map<string, { upvotes: number; downvotes: number; score: number }>> {
  const { data, error } = await supabase
    .from('stop_votes')
    .select('stop_id, vote')
    .eq('trip_id', tripId);

  if (error) throw error;

  const votesMap = new Map<string, { upvotes: number; downvotes: number; score: number }>();

  data?.forEach((vote) => {
    const current = votesMap.get(vote.stop_id) || { upvotes: 0, downvotes: 0, score: 0 };
    if (vote.vote === 1) {
      current.upvotes++;
      current.score++;
    } else {
      current.downvotes++;
      current.score--;
    }
    votesMap.set(vote.stop_id, current);
  });

  return votesMap;
}
