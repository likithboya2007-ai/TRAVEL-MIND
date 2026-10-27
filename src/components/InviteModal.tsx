import React, { useState, useEffect } from 'react';
import { X, Mail, UserPlus, Trash2, Loader2 } from 'lucide-react';
import {
  inviteCollaborator,
  getTripMembers,
  removeMember,
  TripMember,
} from '../services/groupTripService';

interface InviteModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ tripId, isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tripId) {
      loadMembers();
    }
  }, [isOpen, tripId]);

  const loadMembers = async () => {
    try {
      const data = await getTripMembers(tripId);
      setMembers(data);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load members:', err);
      }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await inviteCollaborator(tripId, email, role);
      setEmail('');
      setRole('editor');
      await loadMembers();
    } catch (err: any) {
      setError('Failed to send invitation. Please try again.');
      if (import.meta.env.DEV) {
        console.error('Invite error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this member from the trip?')) return;

    try {
      await removeMember(tripId, memberId);
      await loadMembers();
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Remove error:', err);
      }
      alert('Failed to remove member');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-700 border-purple-200',
      editor: 'bg-blue-100 text-blue-700 border-blue-200',
      viewer: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      accepted: 'bg-green-100 text-green-700 border-green-200',
      invited: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      declined: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status as keyof typeof colors] || colors.invited;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Invite Collaborators</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="mb-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="editor"
                      checked={role === 'editor'}
                      onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Editor (can modify)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="viewer"
                      checked={role === 'viewer'}
                      onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Viewer (read-only)</span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Members List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Current Members ({members.length})
            </h4>
            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No members yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {member.invited_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRoleBadge(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(
                            member.status
                          )}`}
                        >
                          {member.status}
                        </span>
                      </div>
                    </div>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            Collaborators will receive an email invitation to join this trip
          </p>
        </div>
      </div>
    </div>
  );
};
