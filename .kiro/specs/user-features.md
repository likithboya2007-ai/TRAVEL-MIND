# Spec: User-Facing Features

**Status**: Draft  
**Priority**: High  
**Implementation Order**: 1 → 2 → 3 → 5 → 4 → 6 → 7

---

## Overview

Add 7 user-facing features to enhance TravelMind AI's accessibility, collaboration, personalization, and export capabilities. Each feature is independently shippable.

---

## Feature 1: Guest Mode

**Goal**: Remove hard login wall; let users explore without signup.

### Current State
- `App.tsx` lines 520-570: Shows auth modal if `!user`, blocks all access
- All features require authentication

### Requirements

#### 1.1 Remove Login Wall
- **Change**: App.tsx no longer blocks rendering if `!user`
- **Show**: Full home page, destination browser, trip planner form
- **Allow**: Generate trip plans as guest (no save to database)

#### 1.2 Conditional Feature Gates
Prompt for login when guest tries to:
- **Save trip** (`onSaveTrip` in TripPlanner)
- **Add to bucket list** (`onAddToBucketList`)
- **Track expenses** (ExpenseTracker component)
- **Open AI copilot** (TravelCopilot button)

**Implementation**:
```typescript
// src/utils/authGate.ts
export function requireAuth(
  user: User | null,
  onShowAuthModal: () => void,
  feature: string
): boolean {
  if (!user) {
    toast.info(`Sign in to ${feature}`);
    onShowAuthModal();
    return false;
  }
  return true;
}
```

Usage in TripPlanner:
```typescript
const handleSaveTrip = () => {
  if (!requireAuth(user, () => setShowAuthModal(true), 'save trips')) return;
  // ... existing save logic
};
```

#### 1.3 UI Changes
- **Header**: Show "Sign In" button instead of blocking page
- **Feature Cards**: Add "Sign in required" badge on gated features
- **Toast**: Friendly "Sign in to unlock [feature]" messages

#### 1.4 State Management
- **Guest trips**: Store in `localStorage` (key: `guest_itinerary_${Date.now()}`)
- **Migration**: On login, offer to "Save your current trip?"

### Acceptance Criteria
- ✅ Guest can visit home page without auth modal
- ✅ Guest can search destinations and generate trips
- ✅ Guest sees "Sign in" prompt on Save/Bucket/Expenses/Copilot
- ✅ Logged-in users unchanged (no regression)
- ✅ Guest trip persists in localStorage until login or clear

### Files to Modify
- `src/App.tsx`: Remove auth wall, add conditional modal
- `src/components/TripPlanner.tsx`: Add auth gates to actions
- `src/components/Header.tsx`: Add "Sign In" button
- `src/utils/authGate.ts`: New utility
- `src/contexts/AuthContext.tsx`: Add `showAuthModal` state

### Testing
- Unit: `authGate.test.ts` (user null → false, user present → true)
- Integration: E2E flow (guest generates trip → tries to save → sees modal → logs in → saves)

---

## Feature 2: Sharing and Export

**Goal**: Share trips via link, export to PDF/calendar, native share.

### 2.1 Shareable Read-Only Link

#### Database Schema
```sql
-- Migration: 004_trip_sharing.sql
ALTER TABLE saved_trips ADD COLUMN share_id TEXT UNIQUE;
ALTER TABLE saved_trips ADD COLUMN is_public BOOLEAN DEFAULT false;

CREATE INDEX idx_saved_trips_share_id ON saved_trips(share_id) WHERE is_public = true;

-- RLS: Public read access for shared trips
CREATE POLICY "Public can view shared trips" ON saved_trips
  FOR SELECT
  USING (is_public = true AND share_id IS NOT NULL);
```

#### Implementation
1. **Generate Share ID**: On "Share" button click:
   ```typescript
   const shareId = nanoid(10); // e.g., "aB3cD4eF5g"
   await supabase
     .from('saved_trips')
     .update({ share_id: shareId, is_public: true })
     .eq('id', tripId);
   
   const shareUrl = `${window.location.origin}/trip/${shareId}`;
   navigator.clipboard.writeText(shareUrl);
   toast.success('Link copied to clipboard!');
   ```

2. **Read-Only Route**: `/trip/:shareId`
   - New component: `src/pages/SharedTrip.tsx`
   - Fetch via `share_id` (public RLS policy allows)
   - Show itinerary, map, budget (no edit buttons)
   - Add "Create your own trip" CTA

3. **Revoke Sharing**:
   ```typescript
   await supabase
     .from('saved_trips')
     .update({ is_public: false })
     .eq('id', tripId);
   ```

#### UI
- **Button**: "Share" icon in TripPlanner actions
- **Modal**: Show share link, "Copy" button, "Revoke" button
- **Shared page**: Read-only view with watermark "Shared by [username]"

### 2.2 Export to PDF

#### Implementation
Use `@react-pdf/renderer` (client-side, no server needed):

```typescript
// src/services/pdfExport.ts
import { Document, Page, Text, View, Image, pdf } from '@react-pdf/renderer';

export async function exportTripToPDF(itinerary: GeneratedItinerary, mapSnapshot: string) {
  const MyDocument = (
    <Document>
      <Page size="A4">
        <View>
          <Text>{itinerary.destination.name} Trip Plan</Text>
          {itinerary.days.map((day, i) => (
            <View key={i}>
              <Text>Day {i + 1}</Text>
              {day.stops.map(stop => (
                <Text key={stop.id}>• {stop.name} ({stop.timeOfDay})</Text>
              ))}
            </View>
          ))}
          <Text>Budget: ₹{itinerary.costBreakdown.totalEstimatedInr}</Text>
          <Image src={mapSnapshot} />
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(MyDocument).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${itinerary.destination.name}_trip.pdf`;
  a.click();
}
```

**Map Snapshot**: Use `leaflet-image` or `html2canvas` to capture map canvas:
```typescript
import html2canvas from 'html2canvas';

const mapElement = document.getElementById('travel-map');
const canvas = await html2canvas(mapElement);
const mapSnapshot = canvas.toDataURL('image/png');
```

#### UI
- **Button**: "Export PDF" in trip actions
- **Loading**: Show spinner while generating (can take 2-3s)
- **Download**: Auto-download with filename `{destination}_trip.pdf`

### 2.3 Export to Calendar (.ics)

#### Implementation
```typescript
// src/services/calendarExport.ts
import ical from 'ical-generator';

export function exportToCalendar(itinerary: GeneratedItinerary) {
  const calendar = ical({ name: `${itinerary.destination.name} Trip` });

  itinerary.days.forEach((day, dayIndex) => {
    const baseDate = new Date(itinerary.input.startDate || Date.now());
    baseDate.setDate(baseDate.getDate() + dayIndex);

    day.stops.forEach(stop => {
      const startTime = parseTimeOfDay(stop.timeOfDay); // "09:00"
      const start = new Date(baseDate);
      start.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));

      const end = new Date(start);
      end.setHours(start.getHours() + (stop.durationHours || 2));

      calendar.createEvent({
        start,
        end,
        summary: stop.name,
        description: stop.description,
        location: `${stop.lat},${stop.lng}`,
        url: `https://www.google.com/maps?q=${stop.lat},${stop.lng}`
      });
    });
  });

  const blob = new Blob([calendar.toString()], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${itinerary.destination.name}_trip.ics`;
  a.click();
}
```

#### UI
- **Button**: "Add to Calendar" in trip actions
- **Format**: `.ics` file (compatible with Google Calendar, Outlook, Apple Calendar)

### 2.4 WhatsApp / Native Share

#### Implementation
```typescript
// src/services/shareService.ts
export async function shareTrip(itinerary: GeneratedItinerary, shareUrl?: string) {
  const text = `Check out my ${itinerary.days.length}-day trip to ${itinerary.destination.name}! ${shareUrl || ''}`;

  if (navigator.share) {
    // Native share (mobile)
    await navigator.share({
      title: `${itinerary.destination.name} Trip`,
      text,
      url: shareUrl
    });
  } else {
    // Fallback: WhatsApp Web
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }
}
```

#### UI
- **Button**: "Share" with dropdown (Link, WhatsApp, More)
- **Icon**: Share icon with platform icons
- **Fallback**: Copy link if native share unavailable

### Acceptance Criteria (Feature 2)
- ✅ "Share" button generates unique link, copies to clipboard
- ✅ `/trip/:shareId` loads read-only trip from public RLS policy
- ✅ "Export PDF" downloads PDF with itinerary, map, budget
- ✅ "Add to Calendar" downloads `.ics` with all stops as events
- ✅ "Share" uses native share on mobile, WhatsApp fallback on desktop
- ✅ "Revoke" makes share link inaccessible

### Files
- `migrations/004_trip_sharing.sql`
- `src/pages/SharedTrip.tsx` (new)
- `src/services/pdfExport.ts` (new)
- `src/services/calendarExport.ts` (new)
- `src/services/shareService.ts` (new)
- `src/components/TripPlanner.tsx`: Add export buttons

### Dependencies
```json
{
  "@react-pdf/renderer": "^4.0.0",
  "ical-generator": "^8.0.0",
  "html2canvas": "^1.4.1",
  "nanoid": "^5.0.0"
}
```

---

## Feature 3: Budget Fit

**Goal**: Auto-downgrade trip elements to fit user's budget.

### Current State
- Budget is input, planner estimates costs
- If estimate > budget, user manually adjusts
- No tier system for cities

### Requirements

#### 3.1 City Cost Tiers

Add to `src/data/destinations.ts`:
```typescript
export type CostTier = 'metro' | 'tier-2' | 'hill' | 'beach';

export interface Destination {
  // ... existing fields
  costTier: CostTier;
  costMultiplier: number; // 1.0 baseline, metro=1.5, hill=1.3, beach=1.2, tier-2=0.8
}

// Update all destinations:
const goa: Destination = {
  // ...
  costTier: 'beach',
  costMultiplier: 1.2
};
```

#### 3.2 Cost Calculation Updates

Modify `src/utils/plannerLogic.ts`:
```typescript
function calculateAccommodationCost(
  destination: Destination,
  stayTier: 'budget' | 'mid' | 'luxury',
  nights: number,
  rooms: number
): number {
  const baseCosts = { budget: 1500, mid: 3500, luxury: 8000 };
  return baseCosts[stayTier] * nights * rooms * destination.costMultiplier;
}

function calculateTransportCost(
  destination: Destination,
  mode: 'bus' | 'train' | 'flight',
  travellers: number
): number {
  const baseCosts = { bus: 800, train: 1500, flight: 5000 };
  return baseCosts[mode] * travellers * destination.costMultiplier;
}
```

#### 3.3 Budget Fit Algorithm

```typescript
// src/utils/budgetOptimizer.ts
export interface BudgetFitResult {
  adjustedItinerary: GeneratedItinerary;
  changes: BudgetAdjustment[];
  finalCost: number;
}

export interface BudgetAdjustment {
  type: 'stay' | 'transport' | 'activity';
  from: string;
  to: string;
  savedInr: number;
}

export function fitToBudget(
  itinerary: GeneratedItinerary,
  targetBudget: number
): BudgetFitResult {
  const clone = structuredClone(itinerary);
  const changes: BudgetAdjustment[] = [];
  let currentCost = clone.costBreakdown.totalEstimatedInr;

  // Strategy 1: Downgrade stay tier
  if (currentCost > targetBudget && clone.input.stayTier !== 'budget') {
    const oldTier = clone.input.stayTier;
    const newTier = oldTier === 'luxury' ? 'mid' : 'budget';
    const oldCost = clone.costBreakdown.stayInr;
    
    clone.input.stayTier = newTier;
    clone.costBreakdown.stayInr = calculateAccommodationCost(
      clone.destination,
      newTier,
      clone.days.length,
      Math.ceil(clone.input.travellers / 2)
    );
    
    const savedInr = oldCost - clone.costBreakdown.stayInr;
    changes.push({ type: 'stay', from: oldTier, to: newTier, savedInr });
    currentCost -= savedInr;
  }

  // Strategy 2: Downgrade transport mode
  if (currentCost > targetBudget && clone.input.transportMode === 'flight') {
    const oldMode = clone.input.transportMode;
    const newMode = 'train';
    const oldCost = clone.costBreakdown.transportInr;
    
    clone.input.transportMode = newMode;
    clone.costBreakdown.transportInr = calculateTransportCost(
      clone.destination,
      newMode,
      clone.input.travellers
    );
    
    const savedInr = oldCost - clone.costBreakdown.transportInr;
    changes.push({ type: 'transport', from: oldMode, to: newMode, savedInr });
    currentCost -= savedInr;
  }

  // Strategy 3: Remove paid activities (highest cost first)
  if (currentCost > targetBudget) {
    const paidStops = clone.days
      .flatMap((day, dayIdx) =>
        day.stops.map((stop, stopIdx) => ({ stop, dayIdx, stopIdx }))
      )
      .filter(({ stop }) => (stop.estimatedCostInr || 0) > 0)
      .sort((a, b) => (b.stop.estimatedCostInr || 0) - (a.stop.estimatedCostInr || 0));

    for (const { stop, dayIdx, stopIdx } of paidStops) {
      if (currentCost <= targetBudget) break;
      
      const savedInr = stop.estimatedCostInr || 0;
      clone.days[dayIdx].stops.splice(stopIdx, 1);
      changes.push({
        type: 'activity',
        from: stop.name,
        to: 'removed',
        savedInr
      });
      currentCost -= savedInr;
    }
  }

  // Recalculate total
  clone.costBreakdown.totalEstimatedInr = currentCost;
  clone.costBreakdown.varianceInr = targetBudget - currentCost;
  clone.costBreakdown.budgetStatus = currentCost <= targetBudget ? 'balanced' : 'tight';

  return { adjustedItinerary: clone, changes, finalCost: currentCost };
}
```

#### 3.4 UI

**Button**: "Fit to My Budget" (only shown if `costBreakdown.varianceInr < 0`)

**Modal**: Shows adjustments before applying:
```
┌─────────────────────────────────────────┐
│  Fit to Budget: ₹25,000                │
├─────────────────────────────────────────┤
│  Changes to make:                       │
│  ✓ Stay: Luxury → Mid (Save ₹12,000)   │
│  ✓ Transport: Flight → Train (₹3,200)  │
│  ✓ Remove: Water Park (Save ₹1,500)    │
│                                          │
│  New Total: ₹24,800 (under budget!)    │
│                                          │
│  [Cancel]  [Apply Changes]              │
└─────────────────────────────────────────┘
```

**After Apply**: Update itinerary state, show toast "Budget optimized! Saved ₹16,700"

### Acceptance Criteria
- ✅ All destinations have `costTier` and `costMultiplier`
- ✅ Cost calculations use tier multipliers
- ✅ "Fit to Budget" button visible when over budget
- ✅ Algorithm tries stay → transport → activities in order
- ✅ Modal shows all changes with savings
- ✅ Apply updates itinerary and shows new costs
- ✅ Final cost ≤ target budget (or closest possible)

### Files
- `src/data/destinations.ts`: Add `costTier`, `costMultiplier` to all 6 destinations
- `src/utils/budgetOptimizer.ts`: New module
- `src/utils/budgetOptimizer.test.ts`: Unit tests
- `src/utils/plannerLogic.ts`: Update cost calculations
- `src/components/TripPlanner.tsx`: Add "Fit to Budget" button
- `src/components/BudgetFitModal.tsx`: New component

### Testing
- Unit: `budgetOptimizer.test.ts` (various scenarios: only stay, stay+transport, all 3)
- Integration: Over-budget trip → click Fit → under budget

---

## Feature 4: Group Trips

**Goal**: Invite collaborators, live sync, upvote/downvote stops, split expenses.

### 4.1 Database Schema

```sql
-- Migration: 005_group_trips.sql

-- Trip members table
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES saved_trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);
CREATE INDEX idx_trip_members_email ON trip_members(invited_email) WHERE status = 'invited';

-- Stop votes table
CREATE TABLE stop_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES saved_trips(id) ON DELETE CASCADE,
  stop_id TEXT NOT NULL, -- References itinerary.days[].stops[].id
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)), -- -1 downvote, 1 upvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, stop_id, user_id)
);

CREATE INDEX idx_stop_votes_trip_stop ON stop_votes(trip_id, stop_id);

-- Expense splits table
ALTER TABLE trip_expenses ADD COLUMN paid_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE trip_expenses ADD COLUMN split_between UUID[] DEFAULT ARRAY[]::UUID[];

-- RLS Policies
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view trip members" ON trip_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trip_members.trip_id AND user_id = auth.uid())
  );

CREATE POLICY "Owners can manage members" ON trip_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_id = trip_members.trip_id AND user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Members can vote" ON stop_votes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_id = stop_votes.trip_id AND user_id = auth.uid() AND status = 'accepted'
    )
  );
```

### 4.2 Invite Collaborators

```typescript
// src/services/groupTripService.ts
export async function inviteCollaborator(
  tripId: string,
  email: string,
  role: 'editor' | 'viewer'
) {
  const { data, error } = await supabase
    .from('trip_members')
    .insert({
      trip_id: tripId,
      invited_email: email,
      role,
      status: 'invited'
    });

  if (error) throw error;

  // Send email invitation (via Supabase Edge Function or SendGrid)
  await supabase.functions.invoke('send-trip-invitation', {
    body: { email, tripId, role }
  });

  return data;
}

export async function acceptInvitation(tripId: string, userId: string) {
  await supabase
    .from('trip_members')
    .update({ user_id: userId, status: 'accepted' })
    .eq('trip_id', tripId)
    .eq('invited_email', userId); // Match by email lookup
}
```

**UI**:
- **Button**: "Invite" in trip header
- **Modal**: Email input, role dropdown, send button
- **Badge**: "Shared with 3 people" indicator

### 4.3 Live Sync with Supabase Realtime

```typescript
// src/hooks/useRealtimeTrip.ts
export function useRealtimeTrip(tripId: string) {
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);

  useEffect(() => {
    // Subscribe to trip changes
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'saved_trips',
          filter: `id=eq.${tripId}`
        },
        (payload) => {
          setItinerary(payload.new.itinerary_data);
          toast.info('Trip updated by collaborator');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return itinerary;
}
```

### 4.4 Upvote/Downvote Stops

```typescript
// src/services/stopVotingService.ts
export async function voteStop(
  tripId: string,
  stopId: string,
  vote: 1 | -1
) {
  const { data, error } = await supabase
    .from('stop_votes')
    .upsert({
      trip_id: tripId,
      stop_id: stopId,
      user_id: (await supabase.auth.getUser()).data.user!.id,
      vote
    });

  if (error) throw error;
  return data;
}

export async function getStopVotes(tripId: string, stopId: string) {
  const { data } = await supabase
    .from('stop_votes')
    .select('vote')
    .eq('trip_id', tripId)
    .eq('stop_id', stopId);

  const upvotes = data?.filter(v => v.vote === 1).length || 0;
  const downvotes = data?.filter(v => v.vote === -1).length || 0;

  return { upvotes, downvotes, score: upvotes - downvotes };
}
```

**UI**: Each stop shows:
```
┌──────────────────────────────────┐
│  Fort Aguada                      │
│  👍 3  👎 1  (Score: +2)         │
│  [👍 Upvote]  [👎 Downvote]      │
└──────────────────────────────────┘
```

### 4.5 Expense Splitting

```typescript
// src/services/expenseSplitService.ts
export interface ExpenseSplit {
  expenseId: string;
  paidBy: User;
  splitBetween: User[];
  amountPerPerson: number;
}

export async function splitExpense(
  tripId: string,
  expense: TripExpense,
  splitBetween: string[] // user IDs
) {
  const amountPerPerson = expense.amountInr / splitBetween.length;

  await supabase
    .from('trip_expenses')
    .update({
      paid_by_user_id: expense.userId,
      split_between: splitBetween
    })
    .eq('id', expense.id);

  return amountPerPerson;
}

export function calculateOweSummary(expenses: TripExpense[], members: User[]) {
  const balances = new Map<string, number>(); // userId → net balance

  expenses.forEach(expense => {
    if (!expense.split_between?.length) return;

    const paidBy = expense.paid_by_user_id;
    const amountPerPerson = expense.amountInr / expense.split_between.length;

    // Payer gets positive balance
    balances.set(paidBy, (balances.get(paidBy) || 0) + expense.amountInr);

    // Splitters get negative balance
    expense.split_between.forEach(userId => {
      balances.set(userId, (balances.get(userId) || 0) - amountPerPerson);
    });
  });

  // Generate "who owes whom"
  const settlements: { from: User; to: User; amount: number }[] = [];
  const debtors = Array.from(balances.entries()).filter(([_, bal]) => bal < 0);
  const creditors = Array.from(balances.entries()).filter(([_, bal]) => bal > 0);

  debtors.forEach(([debtorId, debt]) => {
    creditors.forEach(([creditorId, credit]) => {
      if (debt >= 0 || credit <= 0) return;

      const amount = Math.min(Math.abs(debt), credit);
      settlements.push({
        from: members.find(m => m.id === debtorId)!,
        to: members.find(m => m.id === creditorId)!,
        amount
      });

      balances.set(debtorId, balances.get(debtorId)! + amount);
      balances.set(creditorId, balances.get(creditorId)! - amount);
    });
  });

  return settlements;
}
```

**UI**: In ExpenseTracker, show "Split" section:
```
┌─────────────────────────────────────┐
│  Who Owes Whom                      │
├─────────────────────────────────────┤
│  Alice → Bob: ₹1,200                │
│  Charlie → Bob: ₹800                │
│  Alice → Dave: ₹500                 │
└─────────────────────────────────────┘
```

### Acceptance Criteria
- ✅ Owner can invite by email (editor/viewer roles)
- ✅ Invitee receives email, can accept/decline
- ✅ Realtime sync: changes by one member visible to others
- ✅ Members can upvote/downvote stops, see scores
- ✅ Expenses can be split, "who owes whom" calculated correctly
- ✅ RLS ensures members only access their trips

### Files
- `migrations/005_group_trips.sql`
- `src/services/groupTripService.ts` (new)
- `src/services/stopVotingService.ts` (new)
- `src/services/expenseSplitService.ts` (new)
- `src/hooks/useRealtimeTrip.ts` (new)
- `src/components/InviteModal.tsx` (new)
- `src/components/StopVoteButtons.tsx` (new)
- `src/components/ExpenseSplitSummary.tsx` (new)

---

## Feature 5: Personalized Recommendations

**Goal**: Content-based recommender from user history, show on home page.

### 5.1 Feature Extraction

```typescript
// src/utils/recommendationEngine.ts

export interface TripFeatures {
  mood: string;
  categories: string[]; // Attraction categories
  budgetBand: 'low' | 'mid' | 'high';
  region: 'north' | 'south' | 'east' | 'west' | 'central';
  duration: number;
}

export function extractFeatures(itinerary: GeneratedItinerary): TripFeatures {
  const categories = Array.from(
    new Set(itinerary.days.flatMap(d => d.stops.map(s => s.category)))
  );

  const budgetBand =
    itinerary.costBreakdown.totalEstimatedInr < 15000
      ? 'low'
      : itinerary.costBreakdown.totalEstimatedInr < 40000
      ? 'mid'
      : 'high';

  const region = getRegion(itinerary.destination.state);

  return {
    mood: itinerary.input.mood,
    categories,
    budgetBand,
    region,
    duration: itinerary.days.length
  };
}

function getRegion(state: string): TripFeatures['region'] {
  const regions = {
    north: ['Rajasthan', 'Himachal Pradesh', 'Uttarakhand', 'Punjab', 'Haryana', 'Delhi'],
    south: ['Karnataka', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'],
    east: ['West Bengal', 'Odisha', 'Meghalaya', 'Assam', 'Sikkim'],
    west: ['Goa', 'Maharashtra', 'Gujarat'],
    central: ['Madhya Pradesh', 'Chhattisgarh']
  };

  for (const [region, states] of Object.entries(regions)) {
    if (states.includes(state)) return region as TripFeatures['region'];
  }
  return 'central';
}
```

### 5.2 Similarity Scoring

```typescript
export function calculateSimilarity(
  userProfile: TripFeatures,
  destination: Destination
): number {
  let score = 0;

  // Mood match (weight: 0.3)
  if (destination.mood === userProfile.mood) score += 0.3;

  // Category overlap (weight: 0.4)
  const destCategories = destination.attractions.map(a => a.category);
  const overlap = userProfile.categories.filter(c => destCategories.includes(c)).length;
  const categoryScore = overlap / Math.max(userProfile.categories.length, destCategories.length);
  score += categoryScore * 0.4;

  // Budget band (weight: 0.2)
  const destBudget = estimateDestinationBudget(destination);
  if (destBudget === userProfile.budgetBand) score += 0.2;

  // Region diversity (weight: 0.1) - prefer different regions
  const destRegion = getRegion(destination.state);
  if (destRegion !== userProfile.region) score += 0.1;

  return score;
}

function estimateDestinationBudget(destination: Destination): TripFeatures['budgetBand'] {
  // Heuristic based on costMultiplier
  if (destination.costMultiplier < 1.0) return 'low';
  if (destination.costMultiplier < 1.3) return 'mid';
  return 'high';
}
```

### 5.3 Recommendation Logic

```typescript
export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  // Fetch user's saved, bucket list, and completed trips
  const { data: trips } = await supabase
    .from('saved_trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!trips || trips.length === 0) {
    // Cold start: return popular destinations
    return getPopularDestinations();
  }

  // Build user profile (average features)
  const profiles = trips.map(t => extractFeatures(t.itinerary_data));
  const userProfile: TripFeatures = {
    mood: mostFrequent(profiles.map(p => p.mood)),
    categories: Array.from(new Set(profiles.flatMap(p => p.categories))),
    budgetBand: mostFrequent(profiles.map(p => p.budgetBand)),
    region: mostFrequent(profiles.map(p => p.region)),
    duration: Math.round(average(profiles.map(p => p.duration)))
  };

  // Score all destinations
  const allDestinations = getAllDestinations(); // from destinations.ts
  const scored = allDestinations
    .filter(dest => !trips.some(t => t.itinerary_data.destination.id === dest.id)) // Exclude visited
    .map(dest => ({
      destination: dest,
      score: calculateSimilarity(userProfile, dest),
      reason: generateReason(userProfile, dest)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}

function generateReason(profile: TripFeatures, destination: Destination): string {
  const reasons = [];
  
  if (destination.mood === profile.mood) {
    reasons.push(`you enjoy ${profile.mood} trips`);
  }
  
  const commonCategories = profile.categories.filter(c =>
    destination.attractions.some(a => a.category === c)
  );
  if (commonCategories.length > 0) {
    reasons.push(`you like ${commonCategories.slice(0, 2).join(' and ')}`);
  }
  
  return reasons.length > 0 ? `Because ${reasons.join(', and ')}` : 'Popular destination';
}
```

### 5.4 UI Component

```typescript
// src/components/RecommendedDestinations.tsx
export function RecommendedDestinations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (user) {
      getRecommendations(user.id).then(setRecommendations);
    }
  }, [user]);

  if (!recommendations.length) return null;

  return (
    <section className="py-12 px-6">
      <h2 className="text-2xl font-bold mb-6">Recommended for You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map(rec => (
          <div key={rec.destination.id} className="border rounded-lg p-4">
            <img src={rec.destination.heroImage} alt={rec.destination.name} className="w-full h-40 object-cover rounded mb-4" />
            <h3 className="font-semibold">{rec.destination.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{rec.destination.state}</p>
            <p className="text-xs text-blue-600 mb-4">{rec.reason}</p>
            <button
              className="btn-primary w-full"
              onClick={() => navigateToPlanner(rec.destination)}
            >
              Plan Trip
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### Acceptance Criteria
- ✅ `extractFeatures` returns mood, categories, budget, region, duration
- ✅ `calculateSimilarity` scores destinations 0-1
- ✅ `getRecommendations` returns top 5 with reasons
- ✅ Cold start (no history) returns popular destinations
- ✅ Home page shows "Recommended for You" for logged-in users
- ✅ Click recommendation navigates to planner with pre-filled destination

### Files
- `src/utils/recommendationEngine.ts` (new)
- `src/utils/recommendationEngine.test.ts` (unit tests)
- `src/components/RecommendedDestinations.tsx` (new)
- `src/App.tsx`: Add component to home page

### Testing
- Unit: Various user profiles, verify similarity scores
- Edge: Cold start (no trips), single trip, diverse trips

---

## Feature 6: PWA (Progressive Web App)

**Goal**: Installable, offline-capable with cached itinerary and map tiles.

### 6.1 PWA Manifest

```json
// public/manifest.json
{
  "name": "TravelMind AI",
  "short_name": "TravelMind",
  "description": "AI-powered travel planning for intelligent trip itineraries",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["travel", "lifestyle"],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

### 6.2 Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'travelmind-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Fetch: Network-first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Cache map tiles
  if (event.request.url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open('map-tiles').then(cache =>
        cache.match(event.request).then(response =>
          response || fetch(event.request).then(res => {
            cache.put(event.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== 'map-tiles')
          .map(key => caches.delete(key))
      )
    )
  );
});
```

### 6.3 Register Service Worker

```typescript
// src/serviceWorkerRegistration.ts
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}
```

Call in `main.tsx`:
```typescript
import { register } from './serviceWorkerRegistration';

// After ReactDOM.createRoot(...).render(...)
register();
```

### 6.4 Offline Itinerary Cache

```typescript
// src/utils/offlineCache.ts
export async function cacheCurrentItinerary(itinerary: GeneratedItinerary) {
  const cache = await caches.open('itinerary');
  const response = new Response(JSON.stringify(itinerary), {
    headers: { 'Content-Type': 'application/json' }
  });
  await cache.put('/current-itinerary', response);
}

export async function getCachedItinerary(): Promise<GeneratedItinerary | null> {
  const cache = await caches.open('itinerary');
  const response = await cache.match('/current-itinerary');
  return response ? response.json() : null;
}
```

**Usage**: Call `cacheCurrentItinerary` after generating a trip, load from cache on offline load.

### 6.5 Install Prompt

```typescript
// src/hooks/useInstallPrompt.ts
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return { isInstallable, promptInstall };
}
```

**UI**: Show "Install App" banner at top when `isInstallable === true`.

### Acceptance Criteria
- ✅ App installable on mobile (Add to Home Screen)
- ✅ Offline: home page and cached itinerary load
- ✅ Map tiles cached, visible offline
- ✅ "Install App" prompt shown to eligible users
- ✅ Service worker caches static assets and API responses

### Files
- `public/manifest.json` (new)
- `public/sw.js` (new)
- `public/offline.html` (new)
- `public/icon-192.png`, `public/icon-512.png` (new)
- `src/serviceWorkerRegistration.ts` (new)
- `src/utils/offlineCache.ts` (new)
- `src/hooks/useInstallPrompt.ts` (new)
- `src/main.tsx`: Register SW
- `index.html`: Link to manifest

---

## Feature 7: Multi-City Trips

**Goal**: Plan trips with 2-4 legs (cities), show transport links between them.

### 7.1 Data Model

```typescript
// src/utils/plannerLogic.ts
export interface MultiCityLeg {
  legNumber: number;
  destination: Destination;
  days: number;
  startDate: Date;
  endDate: Date;
  itinerary: GeneratedItinerary;
  transportToNext?: {
    mode: 'flight' | 'train' | 'bus';
    durationHours: number;
    costInr: number;
  };
}

export interface MultiCityTrip {
  id: string;
  legs: MultiCityLeg[];
  totalDays: number;
  totalCostInr: number;
  createdAt: string;
}
```

### 7.2 Multi-City Input Form

```typescript
// src/components/MultiCityPlanner.tsx
export function MultiCityPlanner() {
  const [legs, setLegs] = useState<LegInput[]>([
    { destination: null, days: 3 },
    { destination: null, days: 2 }
  ]);

  const addLeg = () => {
    if (legs.length < 4) {
      setLegs([...legs, { destination: null, days: 2 }]);
    }
  };

  const removeLeg = (index: number) => {
    if (legs.length > 2) {
      setLegs(legs.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <h2>Plan Multi-City Trip</h2>
      {legs.map((leg, i) => (
        <div key={i}>
          <label>City {i + 1}</label>
          <select
            value={leg.destination?.id || ''}
            onChange={e => updateLeg(i, 'destination', destinations.find(d => d.id === e.target.value))}
          >
            <option value="">Select destination</option>
            {destinations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          
          <label>Days</label>
          <input
            type="number"
            min="1"
            max="7"
            value={leg.days}
            onChange={e => updateLeg(i, 'days', parseInt(e.target.value))}
          />
          
          {i > 0 && <button onClick={() => removeLeg(i)}>Remove</button>}
        </div>
      ))}
      
      {legs.length < 4 && <button onClick={addLeg}>+ Add City</button>}
      
      <button onClick={handleGenerate}>Generate Multi-City Trip</button>
    </div>
  );
}
```

### 7.3 Generate Multi-City Itinerary

```typescript
export async function generateMultiCityTrip(
  legs: LegInput[],
  baseInput: TripInput
): Promise<MultiCityTrip> {
  const multiCityTrip: MultiCityTrip = {
    id: `multi_${Date.now()}`,
    legs: [],
    totalDays: legs.reduce((sum, leg) => sum + leg.days, 0),
    totalCostInr: 0,
    createdAt: new Date().toISOString()
  };

  let currentDate = new Date(baseInput.startDate || Date.now());

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const legInput: TripInput = {
      ...baseInput,
      destination: leg.destination!,
      days: leg.days,
      startDate: currentDate
    };

    // Generate itinerary for this leg
    const itinerary = await generateTripPlan(legInput);

    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + leg.days);

    // Calculate transport to next city
    let transportToNext: MultiCityLeg['transportToNext'];
    if (i < legs.length - 1) {
      const nextLeg = legs[i + 1];
      transportToNext = calculateInterCityTransport(
        leg.destination!,
        nextLeg.destination!,
        baseInput.transportMode || 'train'
      );
      currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() + 1); // Travel day
    }

    multiCityTrip.legs.push({
      legNumber: i + 1,
      destination: leg.destination!,
      days: leg.days,
      startDate: new Date(currentDate),
      endDate,
      itinerary,
      transportToNext
    });

    multiCityTrip.totalCostInr += itinerary.costBreakdown.totalEstimatedInr;
    if (transportToNext) {
      multiCityTrip.totalCostInr += transportToNext.costInr;
    }
  }

  return multiCityTrip;
}

function calculateInterCityTransport(
  from: Destination,
  to: Destination,
  mode: 'flight' | 'train' | 'bus'
): MultiCityLeg['transportToNext'] {
  const distance = haversineDistance(
    from.coordinates.lat,
    from.coordinates.lng,
    to.coordinates.lat,
    to.coordinates.lng
  );

  const durationMap = {
    flight: distance / 600, // ~600 km/h
    train: distance / 80,   // ~80 km/h
    bus: distance / 60      // ~60 km/h
  };

  const costMap = {
    flight: distance * 8,
    train: distance * 1.5,
    bus: distance * 1
  };

  return {
    mode,
    durationHours: Math.round(durationMap[mode]),
    costInr: Math.round(costMap[mode])
  };
}
```

### 7.4 Multi-City Display

```typescript
// src/components/MultiCityItinerary.tsx
export function MultiCityItinerary({ trip }: { trip: MultiCityTrip }) {
  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-4 rounded">
        <h2>Multi-City Trip</h2>
        <p>{trip.legs.length} cities • {trip.totalDays} days • ₹{trip.totalCostInr}</p>
      </div>

      {trip.legs.map((leg, i) => (
        <div key={leg.legNumber} className="border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              {leg.legNumber}
            </div>
            <div>
              <h3 className="font-bold">{leg.destination.name}</h3>
              <p className="text-sm text-gray-600">
                {leg.days} days • {formatDate(leg.startDate)} - {formatDate(leg.endDate)}
              </p>
            </div>
          </div>

          {/* Render itinerary */}
          <ActivitiesItinerary itinerary={leg.itinerary} />

          {/* Transport to next city */}
          {leg.transportToNext && (
            <div className="mt-6 bg-gray-50 p-4 rounded flex items-center gap-4">
              <div className="text-2xl">
                {leg.transportToNext.mode === 'flight' ? '✈️' : leg.transportToNext.mode === 'train' ? '🚆' : '🚌'}
              </div>
              <div>
                <p className="font-semibold">
                  Travel to {trip.legs[i + 1].destination.name}
                </p>
                <p className="text-sm text-gray-600">
                  {leg.transportToNext.durationHours}h • ₹{leg.transportToNext.costInr}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="bg-green-50 p-4 rounded">
        <p className="font-bold">Total Trip Cost: ₹{trip.totalCostInr}</p>
        <p className="text-sm text-gray-600">
          Includes {trip.legs.length} cities and {trip.legs.length - 1} inter-city transports
        </p>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- ✅ User can add 2-4 city legs
- ✅ Each leg reuses existing planner logic
- ✅ Inter-city transport calculated (mode, duration, cost)
- ✅ Timeline shows continuous dates across legs
- ✅ Total cost includes all legs + transports
- ✅ UI shows numbered legs with travel connections
- ✅ Save multi-city trip to database

### Files
- `src/components/MultiCityPlanner.tsx` (new)
- `src/components/MultiCityItinerary.tsx` (new)
- `src/utils/plannerLogic.ts`: Add `generateMultiCityTrip`, `MultiCityTrip` interface
- `src/utils/plannerLogic.test.ts`: Add multi-city tests
- `src/App.tsx`: Add route for `/multi-city`

---

## Implementation Order

1. **Guest Mode** (Fastest, removes barrier)
2. **Sharing & Export** (High value, viral growth)
3. **Budget Fit** (Improves user satisfaction)
4. **Personalized Recommendations** (Engagement)
5. **Group Trips** (Complex, realtime + splits)
6. **PWA** (Infrastructure, offline)
7. **Multi-City** (Advanced use case)

---

## Testing Strategy

### Unit Tests
- `authGate.test.ts`: Null user → false, present → true
- `budgetOptimizer.test.ts`: Various scenarios (stay, transport, activities)
- `recommendationEngine.test.ts`: Similarity scoring, cold start
- `expenseSplitService.test.ts`: Settlement calculations
- `plannerLogic.test.ts`: Multi-city generation

### Integration Tests
- Guest flow: generate → save (blocked) → login → save
- Share: create link → open in incognito → verify read-only
- Budget fit: over budget → click Fit → under budget
- Group: invite → accept → realtime update visible
- Multi-city: 3 legs → correct dates + costs

### E2E Tests (Optional)
- Install PWA, go offline, verify itinerary loads
- Export PDF, verify content
- Invite collaborator, verify email + acceptance flow

---

## Dependencies to Add

```json
{
  "@react-pdf/renderer": "^4.0.0",
  "ical-generator": "^8.0.0",
  "html2canvas": "^1.4.1",
  "nanoid": "^5.0.0"
}
```

---

## Migrations Summary

1. `004_trip_sharing.sql`: `share_id`, `is_public` columns + RLS
2. `005_group_trips.sql`: `trip_members`, `stop_votes`, expense splits

---

## Success Metrics

- **Guest Mode**: % of trips generated by guests, conversion to signup
- **Sharing**: % of trips shared, click-through on shared links
- **Budget Fit**: % of over-budget trips using feature, avg savings
- **Recommendations**: Click-through rate on recommended destinations
- **Group Trips**: % of trips with >1 member, upvotes per stop
- **PWA**: Install rate, offline sessions
- **Multi-City**: % of trips with >1 leg, avg legs per trip

---

**End of Spec**
