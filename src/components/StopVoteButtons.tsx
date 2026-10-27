import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { voteStop, getStopVotes } from '../services/stopVotingService';

interface StopVoteButtonsProps {
  tripId: string;
  stopId: string;
  currentVote?: 1 | -1 | null;
}

export const StopVoteButtons: React.FC<StopVoteButtonsProps> = ({
  tripId,
  stopId,
  currentVote: initialVote,
}) => {
  const [currentVote, setCurrentVote] = useState<1 | -1 | null>(initialVote || null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVotes();
  }, [tripId, stopId]);

  const loadVotes = async () => {
    try {
      const votes = await getStopVotes(tripId, stopId);
      setUpvotes(votes.upvotes);
      setDownvotes(votes.downvotes);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load votes:', err);
      }
    }
  };

  const handleVote = async (vote: 1 | -1) => {
    setLoading(true);
    try {
      // Toggle vote if same, otherwise set new vote
      const newVote = currentVote === vote ? null : vote;

      if (newVote !== null) {
        await voteStop(tripId, stopId, newVote);
      }

      setCurrentVote(newVote);
      await loadVotes();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Vote error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          currentVote === 1
            ? 'bg-green-100 text-green-700 border-green-300'
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
        aria-label="Upvote"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        <span>{upvotes}</span>
      </button>

      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          currentVote === -1
            ? 'bg-red-100 text-red-700 border-red-300'
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
        aria-label="Downvote"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
        <span>{downvotes}</span>
      </button>
    </div>
  );
};
