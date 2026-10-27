import React, { useState } from 'react';
import { X, Bookmark, Trash2, Calendar, MapPin, ArrowRight, Eye, CheckCircle2, XCircle, Edit3, Save } from 'lucide-react';
import { GeneratedItinerary } from '../utils/plannerLogic';

export interface TripHistory extends GeneratedItinerary {
  savedDate: string; // ISO date when saved
  isCompleted?: boolean;
  completedDate?: string;
  tripNotes?: string;
  lastViewed?: string;
}

interface SavedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTrips: TripHistory[];
  onLoadTrip: (trip: TripHistory) => void;
  onDeleteTrip: (tripId: string) => void;
  onToggleComplete?: (tripId: string) => void;
  onUpdateNotes?: (tripId: string, notes: string) => void;
}

export const SavedTripsModal: React.FC<SavedTripsModalProps> = ({
  isOpen,
  onClose,
  savedTrips,
  onLoadTrip,
  onDeleteTrip,
  onToggleComplete,
  onUpdateNotes,
}) => {
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'upcoming'>('all');

  if (!isOpen) return null;

  const filteredTrips = savedTrips.filter(trip => {
    if (filterStatus === 'completed') return trip.isCompleted;
    if (filterStatus === 'upcoming') return !trip.isCompleted;
    return true;
  });

  const handleEditNotes = (trip: TripHistory) => {
    setEditingNotesId(trip.id);
    setNotesInput(trip.tripNotes || '');
  };

  const handleSaveNotes = (tripId: string) => {
    if (onUpdateNotes) {
      onUpdateNotes(tripId, notesInput);
    }
    setEditingNotesId(null);
    setNotesInput('');
  };

  const toggleExpand = (tripId: string) => {
    setExpandedTripId(expandedTripId === tripId ? null : tripId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-trips-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-gray-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer z-10"
          aria-label="Close trip history"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 border border-blue-200 flex items-center justify-center shadow-sm">
              <Bookmark className="w-5 h-5 fill-blue-500/20" />
            </div>
            <div>
              <h3 id="saved-trips-title" className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
                Trip History
              </h3>
              <p className="text-xs text-gray-600">
                All your saved trips ({savedTrips.length} total)
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                filterStatus === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All Trips ({savedTrips.length})
            </button>
            <button
              onClick={() => setFilterStatus('upcoming')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                filterStatus === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming ({savedTrips.filter(t => !t.isCompleted).length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                filterStatus === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({savedTrips.filter(t => t.isCompleted).length})
            </button>
          </div>
        </div>

        {/* Trip List */}
        {filteredTrips.length === 0 ? (
          <div className="py-12 text-center text-gray-600 space-y-3">
            <p className="text-sm">
              {filterStatus === 'all' 
                ? "You haven't saved any trips yet."
                : filterStatus === 'completed'
                ? "No completed trips yet. Mark trips as completed after you travel!"
                : "No upcoming trips. Start planning your next adventure!"}
            </p>
            <p className="text-xs text-gray-500">
              Plan a trip and click "Save Trip" to add it to your history.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => {
              const isExpanded = expandedTripId === trip.id;
              const isEditingNotes = editingNotesId === trip.id;

              return (
                <div
                  key={trip.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    trip.isCompleted 
                      ? 'bg-green-50/50 border-green-200 hover:border-green-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Trip Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {trip.isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Saved: {new Date(trip.savedDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{trip.destination.name}, {trip.destination.state}</span>
                        <span aria-hidden="true" className="text-gray-400">·</span>
                        <span className="text-gray-600">{trip.input.days} Days</span>
                      </div>

                      <h4 className="font-semibold text-gray-900 text-base mb-1">
                        From {trip.input.startCity} · {trip.input.mood}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-gray-600 font-sans tabular-nums flex-wrap">
                        <span>Departure: {trip.input.departureDate}</span>
                        <span className="text-blue-600 font-medium">₹{trip.costBreakdown.totalEstimatedInr.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {onToggleComplete && (
                        <button
                          onClick={() => onToggleComplete(trip.id)}
                          className={`p-2 rounded-xl transition-all ${
                            trip.isCompleted
                              ? 'text-green-600 bg-green-50 hover:bg-green-100'
                              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={trip.isCompleted ? 'Mark as upcoming' : 'Mark as completed'}
                        >
                          {trip.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(trip.id)}
                        className="p-2 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          onLoadTrip(trip);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        Load
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onDeleteTrip(trip.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 cursor-pointer"
                        title="Delete trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Trip Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">Trip Notes</label>
                          {onUpdateNotes && !isEditingNotes && (
                            <button
                              onClick={() => handleEditNotes(trip)}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              {trip.tripNotes ? 'Edit' : 'Add Notes'}
                            </button>
                          )}
                        </div>

                        {isEditingNotes ? (
                          <div className="space-y-2">
                            <textarea
                              value={notesInput}
                              onChange={(e) => setNotesInput(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={3}
                              placeholder="Add your travel memories, tips, or experiences..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNotes(trip.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Save Notes
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNotesId(null);
                                  setNotesInput('');
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-xl border border-gray-200">
                            {trip.tripNotes || 'No notes added yet. Click "Add Notes" to share your experiences!'}
                          </p>
                        )}
                      </div>

                      {/* Itinerary Preview */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Itinerary Preview</h5>
                        <div className="space-y-2">
                          {trip.days.slice(0, 3).map((day, idx) => (
                            <div key={idx} className="text-xs bg-white p-2 rounded-lg border border-gray-200">
                              <span className="font-semibold text-blue-600">Day {day.dayNumber}:</span>{' '}
                              <span className="text-gray-600">{day.theme}</span>
                            </div>
                          ))}
                          {trip.days.length > 3 && (
                            <p className="text-xs text-gray-500 text-center">+ {trip.days.length - 3} more days</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
