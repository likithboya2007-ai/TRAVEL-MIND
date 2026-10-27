import { describe, it, expect, vi } from 'vitest';
import { requireAuth, getFeatureDisplayName } from './authGate';

describe('authGate', () => {
  describe('requireAuth', () => {
    it('returns true when user is authenticated', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' } as any;
      const mockShowModal = vi.fn();

      const result = requireAuth(mockUser, mockShowModal, 'save trips');

      expect(result).toBe(true);
      expect(mockShowModal).not.toHaveBeenCalled();
    });

    it('returns false and shows modal when user is null', () => {
      const mockShowModal = vi.fn();

      const result = requireAuth(null, mockShowModal, 'save trips');

      expect(result).toBe(false);
      expect(mockShowModal).toHaveBeenCalledOnce();
    });

    it('handles different feature names', () => {
      const mockShowModal = vi.fn();

      requireAuth(null, mockShowModal, 'bucket list');
      expect(mockShowModal).toHaveBeenCalled();

      requireAuth(null, mockShowModal, 'expenses');
      expect(mockShowModal).toHaveBeenCalled();

      requireAuth(null, mockShowModal, 'copilot');
      expect(mockShowModal).toHaveBeenCalled();
    });
  });

  describe('getFeatureDisplayName', () => {
    it('returns correct display names for known features', () => {
      expect(getFeatureDisplayName('save trips')).toBe('save your trips');
      expect(getFeatureDisplayName('bucket list')).toBe('add to bucket list');
      expect(getFeatureDisplayName('expenses')).toBe('track expenses');
      expect(getFeatureDisplayName('copilot')).toBe('use AI copilot');
    });

    it('returns original name for unknown features', () => {
      expect(getFeatureDisplayName('unknown')).toBe('unknown');
    });
  });
});
