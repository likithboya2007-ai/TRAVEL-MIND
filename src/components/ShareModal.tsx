import { useState } from 'react';
import { X, Share2, Copy, FileDown, Calendar } from 'lucide-react';
import type { GeneratedItinerary } from '../utils/plannerLogic';
import { generateShareLink, revokeShareLink, shareTrip } from '../services/shareService';
import { useToast } from '../contexts/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: GeneratedItinerary;
  tripId?: string;
}

export function ShareModal({ isOpen, onClose, itinerary, tripId }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    if (!tripId) {
      showError('Please save your trip first');
      return;
    }
    
    setLoading(true);
    try {
      const url = await generateShareLink(tripId);
      setShareUrl(url);
      navigator.clipboard.writeText(url);
      success('Link copied to clipboard!');
    } catch (error) {
      showError('Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!tripId) return;
    
    setLoading(true);
    try {
      await revokeShareLink(tripId);
      setShareUrl('');
      success('Share link revoked');
    } catch (error) {
      showError('Failed to revoke link');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await shareTrip(itinerary, shareUrl);
    } catch (error) {
      // Silently fail if user cancels
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-4">Share Trip</h2>

        <div className="space-y-3">
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <Copy size={20} />
            <span>{shareUrl ? 'Copy Link Again' : 'Generate Share Link'}</span>
          </button>

          {shareUrl && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm break-all">
              {shareUrl}
            </div>
          )}

          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <Share2 size={20} />
            <span>Share via WhatsApp</span>
          </button>

          {shareUrl && (
            <button
              onClick={handleRevoke}
              disabled={loading}
              className="w-full flex items-center gap-3 p-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <X size={20} />
              <span>Revoke Link</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
