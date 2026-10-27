import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { voteStop, getStopVotes, getAllStopVotes } from '../stopVotingService';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('stopVotingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('voteStop', () => {
    it('should vote on a stop successfully', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
      } as any);

      const mockVote = {
        id: 'vote-123',
        trip_id: 'trip-123',
        stop_id: 'stop-123',
        user_id: 'user-123',
        vote: 1,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockVote, error: null }),
      });

      const mockUpsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      const result = await voteStop('trip-123', 'stop-123', 1);

      expect(supabase.from).toHaveBeenCalledWith('stop_votes');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          trip_id: 'trip-123',
          stop_id: 'stop-123',
          user_id: 'user-123',
          vote: 1,
        },
        { onConflict: 'trip_id,stop_id,user_id' }
      );
      expect(result).toEqual(mockVote);
    });

    it('should throw error if not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
      } as any);

      await expect(voteStop('trip-123', 'stop-123', 1)).rejects.toThrow('Not authenticated');
    });
  });

  describe('getStopVotes', () => {
    it('should get vote counts for a stop', async () => {
      const mockVotes = [
        { vote: 1 },
        { vote: 1 },
        { vote: 1 },
        { vote: -1 },
        { vote: -1 },
      ];

      const mockEq2 = vi.fn().mockResolvedValue({ data: mockVotes, error: null });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getStopVotes('trip-123', 'stop-123');

      expect(result).toEqual({
        upvotes: 3,
        downvotes: 2,
        score: 1,
      });
    });

    it('should handle no votes', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ data: [], error: null });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getStopVotes('trip-123', 'stop-123');

      expect(result).toEqual({
        upvotes: 0,
        downvotes: 0,
        score: 0,
      });
    });
  });

  describe('getAllStopVotes', () => {
    it('should get all votes for a trip', async () => {
      const mockVotes = [
        { stop_id: 'stop-1', vote: 1 },
        { stop_id: 'stop-1', vote: 1 },
        { stop_id: 'stop-1', vote: -1 },
        { stop_id: 'stop-2', vote: 1 },
        { stop_id: 'stop-2', vote: -1 },
        { stop_id: 'stop-2', vote: -1 },
      ];

      const mockEq = vi.fn().mockResolvedValue({ data: mockVotes, error: null });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getAllStopVotes('trip-123');

      expect(result.size).toBe(2);
      expect(result.get('stop-1')).toEqual({
        upvotes: 2,
        downvotes: 1,
        score: 1,
      });
      expect(result.get('stop-2')).toEqual({
        upvotes: 1,
        downvotes: 2,
        score: -1,
      });
    });

    it('should return empty map for no votes', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getAllStopVotes('trip-123');

      expect(result.size).toBe(0);
    });
  });
});
