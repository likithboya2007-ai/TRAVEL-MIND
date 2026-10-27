import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  inviteCollaborator,
  acceptInvitation,
  getTripMembers,
  removeMember,
} from '../groupTripService';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('groupTripService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('inviteCollaborator', () => {
    it('should invite a collaborator successfully', async () => {
      const mockData = {
        id: 'member-123',
        trip_id: 'trip-123',
        invited_email: 'friend@example.com',
        role: 'editor',
        status: 'invited',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await inviteCollaborator('trip-123', 'friend@example.com', 'editor');

      expect(supabase.from).toHaveBeenCalledWith('trip_members');
      expect(mockInsert).toHaveBeenCalledWith({
        trip_id: 'trip-123',
        invited_email: 'friend@example.com',
        role: 'editor',
        status: 'invited',
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error on invite failure', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      await expect(
        inviteCollaborator('trip-123', 'friend@example.com', 'editor')
      ).rejects.toThrow();
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
      } as any);

      const mockData = {
        id: 'member-123',
        trip_id: 'trip-123',
        user_id: 'user-123',
        invited_email: 'user@example.com',
        role: 'editor',
        status: 'accepted',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const mockEq2 = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await acceptInvitation('trip-123');

      expect(result).toEqual(mockData);
    });

    it('should throw error if not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
      } as any);

      await expect(acceptInvitation('trip-123')).rejects.toThrow('Not authenticated');
    });
  });

  describe('getTripMembers', () => {
    it('should get trip members successfully', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          trip_id: 'trip-123',
          invited_email: 'user1@example.com',
          role: 'owner',
          status: 'accepted',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'member-2',
          trip_id: 'trip-123',
          invited_email: 'user2@example.com',
          role: 'editor',
          status: 'invited',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockEq = vi.fn().mockResolvedValue({ data: mockMembers, error: null });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getTripMembers('trip-123');

      expect(result).toEqual(mockMembers);
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);

      await removeMember('trip-123', 'member-123');

      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
