import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { DestinationShowcase } from './components/DestinationShowcase';
import { TripPlanner } from './components/TripPlanner';
import { MultiCityPlanner } from './components/MultiCityPlanner';
import { SavedTripsModal, TripHistory } from './components/SavedTripsModal';
import { BucketListModal } from './components/BucketListModal';
import { AuthModal } from './components/AuthModal';
import { TravelCopilot, CopilotButton } from './components/TravelCopilot';
import { ToastContainer } from './components/Toast';
import { TripContext, ItineraryChange } from './services/aiCopilotService';
import { Footer } from './components/Footer';
import { RecommendedDestinations } from './components/RecommendedDestinations';
import { SharedTrip } from './pages/SharedTrip';
import {
  MoodType,
  GroupType,
  EnergyType,
  GeneratedItinerary,
  DayPlan,
} from './utils/plannerLogic';
import { GeocodedPlace, GlobalDestinationDetails } from './types/search';
import { Destination } from './data/destinations';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { bucketListService } from './services/bucketListService';
import { savedTripsService } from './services/savedTripsService';
import { SavedTrip } from './lib/supabase';

export interface BucketListTrip extends GeneratedItinerary {
  dbId?: string; // Database ID
  addedToBucketList: string;
  isCompleted: boolean;
  completedDate?: string;
  notes?: string;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [currentDestinationId, setCurrentDestinationId] = useState<string>('goa');
  const [customDestinations, setCustomDestinations] = useState<Destination[]>([]);
  const [currentMood, setCurrentMood] = useState<MoodType>('Adventure');
  const [currentGroup, setCurrentGroup] = useState<GroupType>('Couple');
  const [currentEnergy, setCurrentEnergy] = useState<EnergyType>('Balanced');
  const [savedTrips, setSavedTrips] = useState<TripHistory[]>([]);
  const [bucketList, setBucketList] = useState<BucketListTrip[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [isBucketListOpen, setIsBucketListOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [loadingBucketList, setLoadingBucketList] = useState<boolean>(false);
  const [loadingSavedTrips, setLoadingSavedTrips] = useState<boolean>(false);
  const [copilotTripContext, setCopilotTripContext] = useState<TripContext | undefined>(undefined);
  const [updateItineraryCallback, setUpdateItineraryCallback] = useState<((updatedDays: DayPlan[]) => void) | null>(null);
  const [showMultiCity, setShowMultiCity] = useState<boolean>(false);

  // Load saved trips and bucket list from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadSavedTripsFromDB();
      loadBucketListFromDB();
      migrateSavedTripsFromLocalStorage();
    }
  }, [user]);

  const migrateSavedTripsFromLocalStorage = async () => {
    if (!user) return;
    
    try {
      // Migrate saved trips
      const storedTrips = localStorage.getItem('travelmind_guest_trips');
      const storedBucket = localStorage.getItem('travelmind_guest_bucket');
      
      let migratedCount = 0;
      let bucketMigratedCount = 0;
      
      // Migrate saved trips
      if (storedTrips) {
        const localTrips = JSON.parse(storedTrips) as GeneratedItinerary[];
        if (localTrips.length > 0) {
          console.log(`Migrating ${localTrips.length} saved trips from guest mode...`);
          
          for (const localTrip of localTrips) {
            try {
              await savedTripsService.save(localTrip);
              migratedCount++;
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error('Failed to migrate saved trip:', error);
              }
            }
          }
          
          if (migratedCount > 0) {
            localStorage.removeItem('travelmind_guest_trips');
            toast.success(`Imported ${migratedCount} saved trip${migratedCount > 1 ? 's' : ''} to your account!`);
          }
        }
      }
      
      // Migrate bucket list trips
      if (storedBucket) {
        const localBucket = JSON.parse(storedBucket) as GeneratedItinerary[];
        if (localBucket.length > 0) {
          console.log(`Migrating ${localBucket.length} bucket list trips from guest mode...`);
          
          for (const localTrip of localBucket) {
            try {
              await bucketListService.save(localTrip);
              bucketMigratedCount++;
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error('Failed to migrate bucket list trip:', error);
              }
            }
          }
          
          if (bucketMigratedCount > 0) {
            localStorage.removeItem('travelmind_guest_bucket');
            toast.success(`Imported ${bucketMigratedCount} bucket list trip${bucketMigratedCount > 1 ? 's' : ''} to your account!`);
          }
        }
      }
      
      // Reload from DB to show migrated trips
      if (migratedCount > 0) {
        loadSavedTripsFromDB();
      }
      if (bucketMigratedCount > 0) {
        loadBucketListFromDB();
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to migrate guest trips:', error);
      }
    }
  };

  const loadSavedTripsFromDB = async () => {
    if (!user) return;
    
    setLoadingSavedTrips(true);
    try {
      const trips = await savedTripsService.getAll();
      const tripHistories: TripHistory[] = trips.map((dbTrip: SavedTrip) => ({
        ...dbTrip.trip_data,
        savedDate: dbTrip.created_at,
        isCompleted: dbTrip.is_visited,
        completedDate: dbTrip.visited_date || undefined,
        tripNotes: dbTrip.notes || undefined,
        lastViewed: dbTrip.updated_at,
      }));
      setSavedTrips(tripHistories);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load saved trips:', error);
      }
    } finally {
      setLoadingSavedTrips(false);
    }
  };

  const loadBucketListFromDB = async () => {
    if (!user) return;
    
    setLoadingBucketList(true);
    try {
      const trips = await bucketListService.getAll();
      const bucketTrips: BucketListTrip[] = trips.map((dbTrip: SavedTrip) => ({
        ...dbTrip.trip_data,
        dbId: dbTrip.id,
        addedToBucketList: dbTrip.created_at,
        isCompleted: dbTrip.is_visited,
        completedDate: dbTrip.visited_date || undefined,
        notes: dbTrip.notes || undefined,
      }));
      setBucketList(bucketTrips);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load bucket list:', error);
      }
    } finally {
      setLoadingBucketList(false);
    }
  };

  const handleSaveTrip = async (trip: GeneratedItinerary) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      // Check if trip already exists
      const existingTrip = savedTrips.find(t => t.id === trip.id);
      
      if (existingTrip) {
        // Update existing trip
        const dbTrip = await savedTripsService.getAll();
        const existingDbTrip = dbTrip.find(t => t.trip_data.id === trip.id);
        
        if (existingDbTrip) {
          await savedTripsService.update(existingDbTrip.id, trip);
        }
      } else {
        // Save new trip
        await savedTripsService.save(trip);
      }
      
      // Reload trips from database
      await loadSavedTripsFromDB();
      toast.success('Trip saved successfully!');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to save trip:', error);
      }
      toast.error('Failed to save trip. Please try again.');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    const trip = savedTrips.find((t) => t.id === tripId);
    if (!trip) return;

    try {
      // Find the database ID
      const dbTrips = await savedTripsService.getAll();
      const dbTrip = dbTrips.find(t => t.trip_data.id === tripId);
      
      if (dbTrip) {
        await savedTripsService.delete(dbTrip.id);
        const updated = savedTrips.filter((t) => t.id !== tripId);
        setSavedTrips(updated);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete trip:', error);
      }
      toast.error('Failed to delete trip. Please try again.');
    }
  };

  const handleAddToBucketList = async (trip: GeneratedItinerary) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const savedTrip = await bucketListService.save(trip);
      const bucketTrip: BucketListTrip = {
        ...trip,
        dbId: savedTrip.id,
        addedToBucketList: savedTrip.created_at,
        isCompleted: false,
      };
      
      setBucketList([bucketTrip, ...bucketList]);
      toast.success('Trip added to your bucket list!');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to add to bucket list:', error);
      }
      toast.error('Failed to save trip. Please try again.');
    }
  };

  const handleToggleCompleteHistory = async (tripId: string) => {
    const trip = savedTrips.find((t) => t.id === tripId);
    if (!trip) return;

    const newIsCompleted = !trip.isCompleted;

    try {
      // Find the database ID
      const dbTrips = await savedTripsService.getAll();
      const dbTrip = dbTrips.find(t => t.trip_data.id === tripId);
      
      if (dbTrip) {
        await savedTripsService.toggleComplete(dbTrip.id, newIsCompleted);
        
        const updated = savedTrips.map((t) => {
          if (t.id === tripId) {
            return {
              ...t,
              isCompleted: newIsCompleted,
              completedDate: newIsCompleted ? new Date().toISOString() : undefined,
            };
          }
          return t;
        });
        setSavedTrips(updated);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to update trip status:', error);
      }
      toast.error('Failed to update trip. Please try again.');
    }
  };

  const handleUpdateTripNotes = async (tripId: string, notes: string) => {
    const trip = savedTrips.find((t) => t.id === tripId);
    if (!trip) return;

    try {
      // Find the database ID
      const dbTrips = await savedTripsService.getAll();
      const dbTrip = dbTrips.find(t => t.trip_data.id === tripId);
      
      if (dbTrip) {
        await savedTripsService.updateNotes(dbTrip.id, notes);
        
        const updated = savedTrips.map((t) => {
          if (t.id === tripId) {
            return { ...t, tripNotes: notes };
          }
          return t;
        });
        setSavedTrips(updated);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to update trip notes:', error);
      }
      toast.error('Failed to update notes. Please try again.');
    }
  };

  const handleToggleComplete = async (tripId: string) => {
    const trip = bucketList.find((t) => t.id === tripId);
    if (!trip || !trip.dbId) return;

    const newIsCompleted = !trip.isCompleted;

    try {
      await bucketListService.toggleVisited(trip.dbId, newIsCompleted);
      
      const updated = bucketList.map((t) => {
        if (t.id === tripId) {
          return {
            ...t,
            isCompleted: newIsCompleted,
            completedDate: newIsCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });
      setBucketList(updated);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to update trip status:', error);
      }
      toast.error('Failed to update trip. Please try again.');
    }
  };

  const handleUpdateNotes = async (tripId: string, notes: string) => {
    const trip = bucketList.find((t) => t.id === tripId);
    if (!trip || !trip.dbId) return;

    try {
      await bucketListService.updateNotes(trip.dbId, notes);
      
      const updated = bucketList.map((t) => {
        if (t.id === tripId) {
          return { ...t, notes };
        }
        return t;
      });
      setBucketList(updated);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to update notes:', error);
      }
      toast.error('Failed to update notes. Please try again.');
    }
  };

  const handleDeleteFromBucketList = async (tripId: string) => {
    const trip = bucketList.find((t) => t.id === tripId);
    if (!trip || !trip.dbId) return;

    try {
      await bucketListService.delete(trip.dbId);
      const updated = bucketList.filter((t) => t.id !== tripId);
      setBucketList(updated);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete trip:', error);
      }
      toast.error('Failed to delete trip. Please try again.');
    }
  };

  // Handle copilot itinerary changes
  const handleApplyItineraryChanges = (changes: ItineraryChange[]) => {
    if (!copilotTripContext?.currentItinerary || !updateItineraryCallback) {
      if (import.meta.env.DEV) {
        console.error('No itinerary context or update callback available');
      }
      return;
    }

    try {
      // Apply changes to the current itinerary
      const updatedDays = applyChangesToItinerary(
        copilotTripContext.currentItinerary,
        changes
      );

      // Update the itinerary in TripPlanner via callback
      updateItineraryCallback(updatedDays);

      // Update the copilot context with the new itinerary
      setCopilotTripContext({
        ...copilotTripContext,
        currentItinerary: updatedDays,
      });

      toast.success(`Applied ${changes.length} change(s) to your itinerary`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to apply changes:', error);
      }
      toast.error('Failed to apply changes. Please try again.');
    }
  };

  // Apply itinerary changes based on tool calls
  function applyChangesToItinerary(itinerary: DayPlan[], changes: ItineraryChange[]): DayPlan[] {
    // Deep clone to avoid mutating original
    const clone = JSON.parse(JSON.stringify(itinerary));

    changes.forEach((change) => {
      const day = clone[change.day - 1];
      if (!day) {
        console.warn(`Day ${change.day} not found in itinerary`);
        return;
      }

      switch (change.type) {
        case 'replace':
          if (day.stops[change.order] !== undefined) {
            // Preserve stop structure while updating key fields
            day.stops[change.order] = {
              ...day.stops[change.order],
              name: change.newStop.name,
              category: change.newStop.category || day.stops[change.order].category,
              durationHours: change.newStop.duration || change.newStop.durationHours || day.stops[change.order].durationHours,
              estimatedCostInr: change.newStop.cost || change.newStop.estimatedCostInr || day.stops[change.order].estimatedCostInr,
            };
          }
          break;

        case 'remove':
          if (change.order !== undefined) {
            day.stops.splice(change.order, 1);
            // Reorder remaining stops
            day.stops.forEach((stop: any, idx: number) => {
              stop.orderInDay = idx + 1;
            });
          }
          break;

        case 'add':
          if (change.stop) {
            // Create a new stop with proper structure
            const newStop = {
              id: `copilot-${Date.now()}-${Math.random()}`,
              name: change.stop.name,
              category: change.stop.category,
              durationHours: change.stop.duration || change.stop.durationHours || 2,
              estimatedCostInr: change.stop.cost || change.stop.estimatedCostInr || 0,
              timeOfDay: change.stop.timeOfDay || 'afternoon',
              lat: change.stop.lat || day.stops[0]?.lat || 0,
              lng: change.stop.lng || day.stops[0]?.lng || 0,
              description: change.stop.description || `AI-suggested activity`,
              highlight: change.stop.highlight || `Recommended by AI copilot`,
              bestFor: change.stop.bestFor || [],
              dayNumber: change.day,
              orderInDay: day.stops.length + 1,
              startTime: change.stop.time || '14:00',
              endTime: change.stop.time || '16:00',
              recommendationReason: 'Added by AI copilot',
            };
            day.stops.push(newStop);
          }
          break;

        case 'move':
          if (change.fromDay && change.fromOrder !== undefined && change.toDay && change.toOrder !== undefined) {
            const fromDay = clone[change.fromDay - 1];
            const toDay = clone[change.toDay - 1];
            
            if (fromDay && toDay && fromDay.stops[change.fromOrder]) {
              // Remove from source day
              const [movedStop] = fromDay.stops.splice(change.fromOrder, 1);
              
              // Update day number
              movedStop.dayNumber = change.toDay;
              
              // Insert into target day
              toDay.stops.splice(change.toOrder, 0, movedStop);
              
              // Reorder both days
              fromDay.stops.forEach((stop: any, idx: number) => {
                stop.orderInDay = idx + 1;
              });
              toDay.stops.forEach((stop: any, idx: number) => {
                stop.orderInDay = idx + 1;
              });
            }
          }
          break;
      }

      // Recalculate day cost
      day.estimatedDayCostInr = day.stops.reduce(
        (sum: number, stop: any) => sum + (stop.estimatedCostInr || 0),
        0
      );
    });

    return clone;
  }

  const handleSelectSearchedPlace = (
    place: GeocodedPlace,
    photoUrl?: string,
    details?: GlobalDestinationDetails
  ) => {
    const customId = `place-${place.id}`;
    const newDest: Destination = {
      id: customId,
      name: place.name,
      state: place.state || place.country,
      tagline: place.displayName,
      description:
        details?.description ||
        `Explore ${place.name}, ${place.country}. Verified geographic coordinates: ${place.lat.toFixed(4)}°, ${place.lng.toFixed(4)}°.`,
      editorialQuote: `Discovering the distinct atmosphere, cultural heritage, and geography of ${place.name}.`,
      image: photoUrl || '/src/assets/images/dest_goa_1792602056666.jpg',
      lat: place.lat,
      lng: place.lng,
      defaultDays: 4,
      suggestedBudgetInr: 35000,
      costTier: 'tier-2',
      costMultiplier: 1.0,
      categories: ['Adventure', 'Culture', 'Photography'],
      bestMonths: 'Year-round',
      temperature: 'Seasonal',
      attractions: [],
      highlights: [place.name, place.formattedType, place.country],
      localFood: [],
    };

    setCustomDestinations((prev) => {
      const filtered = prev.filter((d) => d.id !== customId);
      return [newDest, ...filtered];
    });

    setCurrentDestinationId(customId);
  };

  const handleScrollToPlanner = (destId?: string) => {
    if (destId) {
      setCurrentDestinationId(destId);
    }
    const plannerEl = document.getElementById('planner');
    if (plannerEl) {
      plannerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading TravelMind AI...</p>
        </div>
      </div>
    );
  }

  // Main app component with all features
  const MainApp = () => (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Top Bar */}
      <Navigation
        savedCount={savedTrips.length}
        bucketListCount={bucketList.length}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        onOpenBucketList={() => setIsBucketListOpen(true)}
        onPlanClick={() => handleScrollToPlanner()}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection onStartPlanning={() => handleScrollToPlanner()} />

        {/* Multi-City Toggle Button */}
        {!showMultiCity && (
          <div className="py-6 px-6 bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto flex justify-center">
              <button
                onClick={() => setShowMultiCity(true)}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center gap-2"
              >
                <span>Plan Multi-City Trip (2-4 Cities)</span>
              </button>
            </div>
          </div>
        )}

        {/* Trip Planner Section */}
        {showMultiCity ? (
          <MultiCityPlanner
            onSaveTrip={handleSaveTrip}
            onAddToBucketList={handleAddToBucketList}
            onClose={() => setShowMultiCity(false)}
          />
        ) : (
          <TripPlanner
            initialDestinationId={currentDestinationId}
            customDestinations={customDestinations}
            currentMood={currentMood}
            currentGroup={currentGroup}
            currentEnergy={currentEnergy}
            onSaveTrip={handleSaveTrip}
            onAddToBucketList={handleAddToBucketList}
            onTripGenerated={setCopilotTripContext}
            onRegisterUpdateCallback={(callback) => setUpdateItineraryCallback(() => callback)}
          />
        )}

        {/* Recommended Destinations for logged-in users */}
        {user && <RecommendedDestinations />}

        {/* Popular Destinations Section */}
        <DestinationShowcase
          onAddToTrip={(id) => handleScrollToPlanner(id)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Saved Trips Modal */}
      <SavedTripsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedTrips={savedTrips}
        onLoadTrip={(trip) => {
          setCurrentDestinationId(trip.destination.id);
          setCurrentMood(trip.input.mood);
          setCurrentGroup(trip.input.groupType);
          setCurrentEnergy(trip.input.energyLevel);
          handleScrollToPlanner(trip.destination.id);
        }}
        onDeleteTrip={handleDeleteTrip}
        onToggleComplete={handleToggleCompleteHistory}
        onUpdateNotes={handleUpdateTripNotes}
      />

      {/* Bucket List Modal */}
      <BucketListModal
        isOpen={isBucketListOpen}
        onClose={() => setIsBucketListOpen(false)}
        bucketList={bucketList}
        onToggleComplete={handleToggleComplete}
        onUpdateNotes={handleUpdateNotes}
        onDeleteTrip={handleDeleteFromBucketList}
        onLoadTrip={(trip) => {
          setCurrentDestinationId(trip.destination.id);
          setCurrentMood(trip.input.mood);
          setCurrentGroup(trip.input.groupType);
          setCurrentEnergy(trip.input.energyLevel);
          handleScrollToPlanner(trip.destination.id);
          setIsBucketListOpen(false);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* AI Travel Copilot */}
      <TravelCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        tripContext={copilotTripContext}
        onApplyChanges={handleApplyItineraryChanges}
      />

      {/* Floating Copilot Button */}
      {!isCopilotOpen && (
        <CopilotButton
          onClick={() => setIsCopilotOpen(true)}
          hasContext={!!copilotTripContext}
        />
      )}
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );

  // Guest mode enabled - app is accessible to all users
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/trip/:shareId" element={<SharedTrip />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
