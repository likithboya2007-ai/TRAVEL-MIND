import React, { useState } from 'react';
import { X, CheckCircle, Circle, Calendar, MapPin, Users, Trash2, Edit2, Save, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { BucketListTrip } from '../App';
import { ExpenseTracker } from './ExpenseTracker';

interface BucketListModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketList: BucketListTrip[];
  onToggleComplete: (tripId: string) => void;
  onUpdateNotes: (tripId: string, notes: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onLoadTrip: (trip: BucketListTrip) => void;
}

export const BucketListModal: React.FC<BucketListModalProps> = ({
  isOpen,
  onClose,
  bucketList,
  onToggleComplete,
  onUpdateNotes,
  onDeleteTrip,
  onLoadTrip,
}) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [expandedExpenses, setExpandedExpenses] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingTrips = bucketList.filter((t) => !t.isCompleted);
  const completedTrips = bucketList.filter((t) => t.isCompleted);

  const handleStartEdit = (tripId: string, currentNotes?: string) => {
    setEditingNotes(tripId);
    setNotesText(currentNotes || '');
  };

  const handleSaveNotes = (tripId: string) => {
    onUpdateNotes(tripId, notesText);
    setEditingNotes(null);
    setNotesText('');
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="bucket-list-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 id="bucket-list-title" className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🎯 Travel Bucket List
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {pendingTrips.length} pending · {completedTrips.length} completed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close bucket list"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {bucketList.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Bucket List is Empty
              </h3>
              <p className="text-gray-600 mb-6">
                Start planning your dream trips and add them to your bucket list!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Start Planning
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pending Trips */}
              {pendingTrips.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Circle className="w-5 h-5 text-blue-500" />
                    Planned Trips ({pendingTrips.length})
                  </h3>
                  <div className="space-y-4">
                    {pendingTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        isCompleted={false}
                        onToggleComplete={onToggleComplete}
                        onDeleteTrip={onDeleteTrip}
                        onLoadTrip={onLoadTrip}
                        editingNotes={editingNotes}
                        notesText={notesText}
                        setNotesText={setNotesText}
                        handleStartEdit={handleStartEdit}
                        handleSaveNotes={handleSaveNotes}
                        handleCancelEdit={handleCancelEdit}
                        expandedExpenses={expandedExpenses}
                        setExpandedExpenses={setExpandedExpenses}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Trips */}
              {completedTrips.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Completed Trips ({completedTrips.length})
                  </h3>
                  <div className="space-y-4">
                    {completedTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        isCompleted={true}
                        onToggleComplete={onToggleComplete}
                        onDeleteTrip={onDeleteTrip}
                        onLoadTrip={onLoadTrip}
                        editingNotes={editingNotes}
                        notesText={notesText}
                        setNotesText={setNotesText}
                        handleStartEdit={handleStartEdit}
                        handleSaveNotes={handleSaveNotes}
                        handleCancelEdit={handleCancelEdit}
                        expandedExpenses={expandedExpenses}
                        setExpandedExpenses={setExpandedExpenses}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TripCardProps {
  trip: BucketListTrip;
  isCompleted: boolean;
  onToggleComplete: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onLoadTrip: (trip: BucketListTrip) => void;
  editingNotes: string | null;
  notesText: string;
  setNotesText: (text: string) => void;
  handleStartEdit: (tripId: string, currentNotes?: string) => void;
  handleSaveNotes: (tripId: string) => void;
  handleCancelEdit: () => void;
  expandedExpenses: string | null;
  setExpandedExpenses: (tripId: string | null) => void;
}

const TripCard: React.FC<TripCardProps> = ({
  trip,
  isCompleted,
  onToggleComplete,
  onDeleteTrip,
  onLoadTrip,
  editingNotes,
  notesText,
  setNotesText,
  handleStartEdit,
  handleSaveNotes,
  handleCancelEdit,
  expandedExpenses,
  setExpandedExpenses,
}) => {
  const addedDate = new Date(trip.addedToBucketList).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const completedDate = trip.completedDate
    ? new Date(trip.completedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const isExpensesExpanded = expandedExpenses === trip.id;

  return (
    <div
      className={`p-5 rounded-xl border-2 transition-all ${
        isCompleted
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(trip.id)}
          className="mt-1 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
        >
          {isCompleted ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500 transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Trip Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h4
                className={`text-lg font-semibold mb-1 ${
                  isCompleted ? 'text-gray-700 line-through' : 'text-gray-900'
                }`}
              >
                {trip.destination.name}, {trip.destination.state}
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {trip.input.departureDate}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {trip.input.groupType}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {trip.input.days} days
                </span>
              </div>
            </div>

            {/* Budget */}
            <div className="text-right shrink-0">
              <span className="text-lg font-bold text-blue-600">
                ₹{trip.costBreakdown.totalEstimatedInr.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-500 block">total budget</span>
            </div>
          </div>

          {/* Dates */}
          <div className="mb-3 text-xs text-gray-500 space-y-1">
            <div>Added: {addedDate}</div>
            {completedDate && <div className="text-green-600">Completed: {completedDate}</div>}
          </div>

          {/* Notes Section */}
          <div className="mb-3">
            {editingNotes === trip.id ? (
              <div className="space-y-2">
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Add notes about this trip (memories, tips, highlights...)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveNotes(trip.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : trip.notes ? (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 relative group">
                <p className="pr-8">{trip.notes}</p>
                <button
                  onClick={() => handleStartEdit(trip.id, trip.notes)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Edit notes"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartEdit(trip.id)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Add notes
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => onLoadTrip(trip)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => setExpandedExpenses(isExpensesExpanded ? null : trip.id)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              <DollarSign className="w-4 h-4" />
              Track Expenses
              {isExpensesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                if (confirm('Remove this trip from your bucket list?')) {
                  onDeleteTrip(trip.id);
                }
              }}
              className="ml-auto p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Delete trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Expense Tracker - Collapsible */}
          {isExpensesExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <ExpenseTracker
                tripId={trip.id}
                plannedBudget={trip.costBreakdown.totalEstimatedInr}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
