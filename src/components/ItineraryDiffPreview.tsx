import React from 'react';
import { FileEdit, Check, X } from 'lucide-react';

export interface ItineraryChange {
  type: 'replace' | 'remove' | 'add' | 'move';
  day: number;
  order?: number;
  oldStop?: any;
  newStop?: any;
  stop?: any;
  fromDay?: number;
  fromOrder?: number;
  toDay?: number;
  toOrder?: number;
}

interface ItineraryDiffPreviewProps {
  changes: ItineraryChange[];
  onApply: () => void;
  onDiscard: () => void;
}

export const ItineraryDiffPreview: React.FC<ItineraryDiffPreviewProps> = ({
  changes,
  onApply,
  onDiscard,
}) => {
  if (!changes || changes.length === 0) return null;

  return (
    <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 my-3">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <FileEdit className="w-5 h-5 text-blue-600" />
        Proposed Changes ({changes.length})
      </h4>

      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {changes.map((change, idx) => (
          <div key={idx} className="bg-white rounded-lg p-3 text-sm border border-blue-200">
            {change.type === 'replace' && (
              <>
                <div className="text-red-600 line-through mb-1">
                  <span className="font-medium">Day {change.day}, Stop {(change.order || 0) + 1}:</span>{' '}
                  {change.oldStop?.name} 
                  <span className="text-xs ml-2">
                    (₹{change.oldStop?.cost || change.oldStop?.estimatedCostInr || 0})
                  </span>
                </div>
                <div className="text-green-600">
                  → {change.newStop?.name}
                  <span className="text-xs ml-2">
                    (₹{change.newStop?.cost || 0})
                  </span>
                </div>
              </>
            )}

            {change.type === 'remove' && (
              <div className="text-red-600 line-through">
                <span className="font-medium">Day {change.day}, Stop {(change.order || 0) + 1}:</span>{' '}
                {change.stop?.name} (removed)
              </div>
            )}

            {change.type === 'add' && (
              <div className="text-green-600">
                + <span className="font-medium">Day {change.day}:</span>{' '}
                {change.stop?.name}
                <span className="text-xs ml-2">
                  (₹{change.stop?.cost || 0})
                </span>
              </div>
            )}

            {change.type === 'move' && (
              <div className="text-blue-600">
                <span className="font-medium">Move:</span>{' '}
                {change.stop?.name} from Day {change.fromDay} to Day {change.toDay}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onApply}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Check className="w-4 h-4" />
          Apply Changes
        </button>
        <button
          onClick={onDiscard}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
        >
          <X className="w-4 h-4" />
          Discard
        </button>
      </div>
    </div>
  );
};
