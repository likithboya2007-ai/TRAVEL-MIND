# Implementation Plan: User-Facing Features

This plan implements 7 user-facing features for TravelMind AI as specified in `.kiro/specs/user-features.md`.

**Implementation Order**: Guest Mode → Sharing & Export → Budget Fit → Personalized Recommendations → Group Trips → PWA → Multi-City Trips

**Note**: This plan has been decomposed into FEAT artifacts for parallel-safe execution. See `.agents/tasks/user-features/` for detailed feature specifications.

---

## Feature 1: Guest Mode

- [ ] 1. Create `src/utils/authGate.ts` with `requireAuth(user, onShowAuthModal, feature)` utility function.
      Returns false and shows toast if user is null, true otherwise.
      Files: `src/utils/authGate.ts` (new)
      Verify: `npm run test` — new unit tests pass

- [ ] 2. Remove hard auth wall from `src/App.tsx` lines 520-570.
      Allow HeroSection, DestinationShowcase, TripPlanner to render for guests.
      Move auth modal to conditional state-based rendering.
      Files: `src/App.tsx`
      Verify: Manual test in incognito — home page loads without auth prompt

- [ ] 3. Add auth gates to trip actions in `src/components/TripPlanner.tsx`.
      Wrap handleSaveTrip, handleAddToBucketList, expense tracker, copilot with requireAuth checks.
      Files: `src/components/TripPlanner.tsx`
      Verify: Manual test as guest — clicking Save shows toast and auth modal

- [ ] 4. Add `showAuthModal` state and setter to `src/contexts/AuthContext.tsx`.
      Expose via context for programmatic auth modal triggering.
      Files: `src/contexts/AuthContext.tsx`
      Verify: `npm run lint` passes

- [ ] 5. Implement guest trip localStorage with key `guest_itinerary_{timestamp}`.
      Store generated trips locally for guests. Show "Sign in to save permanently" hint.
      Files: `src/components/TripPlanner.tsx`, `src/App.tsx`
      Verify: Manual test — guest trip persists in localStorage after generation

- [ ] 6. Add guest trip migration on login.
      Check localStorage for guest trips, offer import modal, clear after import.
      Files: `src/App.tsx`
      Verify: Manual test — login after guest session offers to import trips

- [ ] 7. Update `src/components/Header.tsx` to show "Sign In" button when user is null.
      Files: `src/components/Header.tsx`
      Verify: Manual test — guest sees Sign In button in header

- [ ] 8. Add visual badges/hints on gated features.
      Show "Sign in required" tooltip on Save, Bucket List, Expenses, Copilot buttons for guests.
      Files: `src/components/TripPlanner.tsx`
      Verify: Manual test — hover tooltips show for guest users

---

## Feature 2: Sharing & Export

- [ ] 1. Run `migrations/004_trip_sharing.sql` in Supabase SQL Editor.
      Adds share_id, is_public columns and RLS policy for public read access.
      Files: `migrations/004_trip_sharing.sql`
      Verify: Check Supabase dashboard — columns exist, policy active

- [ ] 2. Create `src/services/shareService.ts` with share link generation.
      Implement generateShareLink(tripId), revokeShareLink(tripId) using nanoid(10).
      Files: `src/services/shareService.ts` (new)
      Verify: `npm run test` — share service tests pass

- [ ] 3. Create `src/pages/SharedTrip.tsx` for read-only shared trip view.
      Fetch trip by share_id, render with TravelMap, BudgetBreakdown, ActivitiesItinerary.
      Show "Shared trip" watermark and "Create your own trip" CTA.
      Files: `src/pages/SharedTrip.tsx` (new)
      Verify: Manual test in incognito — /trip/:shareId loads without auth

- [ ] 4. Add `/trip/:shareId` route to `src/App.tsx`.
      Files: `src/App.tsx`
      Verify: `npm run lint` passes

- [ ] 5. Create `src/services/pdfExport.ts` using @react-pdf/renderer.
      Implement exportTripToPDF(itinerary, mapSnapshot) with itinerary, budget, map image.
      Use html2canvas to capture map element.
      Files: `src/services/pdfExport.ts` (new)
      Verify: Manual test — PDF downloads with correct content

- [ ] 6. Create `src/services/calendarExport.ts` using ical-generator.
      Implement exportToCalendar(itinerary) creating .ics with one event per stop.
      Parse timeOfDay for start times, use durationHours for end times.
      Files: `src/services/calendarExport.ts` (new)
      Verify: Manual test — .ics imports to Google Calendar correctly

- [ ] 7. Add shareTrip() to `src/services/shareService.ts`.
      Use navigator.share() if available, fallback to WhatsApp Web URL.
      Files: `src/services/shareService.ts`
      Verify: Manual test on mobile — native share appears

- [ ] 8. Add Share button to `src/components/TripPlanner.tsx` action bar.
      Open modal with: Generate Link, Export PDF, Add to Calendar, Share via WhatsApp, Revoke.
      Files: `src/components/TripPlanner.tsx`
      Verify: Manual test — all share actions work

- [ ] 9. Create `src/components/ShareModal.tsx` for sharing options UI.
      Show loading states, success/error toasts for each action.
      Files: `src/components/ShareModal.tsx` (new)
      Verify: Manual test — modal displays correctly with all options

---

## Feature 3: Budget Fit

- [ ] 1. Add `costTier` and `costMultiplier` to Destination interface in `src/data/destinations.ts`.
      Update all 6 destinations: goa, jaipur, hampi, ladakh, kerala, pondicherry.
      Files: `src/data/destinations.ts`
      Verify: `npm run lint` passes

- [ ] 2. Update accommodation cost calculation in `src/utils/plannerLogic.ts`.
      Multiply base costs by destination.costMultiplier in calculateAccommodationCost().
      Files: `src/utils/plannerLogic.ts`
      Verify: `npm run test` — planner tests pass with new calculations

- [ ] 3. Update transport cost calculation in `src/utils/plannerLogic.ts`.
      Multiply base costs by destination.costMultiplier in calculateTransportCost().
      Files: `src/utils/plannerLogic.ts`
      Verify: `npm run test` — planner tests pass

- [ ] 4. Create `src/utils/budgetOptimizer.ts` with fitToBudget() function.
      Implement three-tier optimization: stay → transport → activities.
      Return BudgetFitResult with adjustedItinerary, changes[], finalCost.
      Files: `src/utils/budgetOptimizer.ts` (new)
      Verify: `npm run test` — budgetOptimizer tests pass

- [ ] 5. Create `src/components/BudgetFitModal.tsx` to display proposed changes.
      Show adjustment table, new total, Apply/Cancel buttons.
      Files: `src/components/BudgetFitModal.tsx` (new)
      Verify: Manual test — modal shows specific changes with savings

- [ ] 6. Add "Fit to My Budget" button to `src/components/TripPlanner.tsx`.
      Show when varianceInr < 0. On Apply, update itinerary state and show toast.
      Files: `src/components/TripPlanner.tsx`
      Verify: Manual test — button appears when over budget, applies changes correctly

- [ ] 7. Add unit tests in `src/utils/budgetOptimizer.test.ts`.
      Cover: stay only, stay+transport, all three adjustments, impossible budget.
      Files: `src/utils/budgetOptimizer.test.ts` (new)
      Verify: `npm run test` — all budget optimizer tests pass

---

## Feature 4: Personalized Recommendations

- [ ] 1. Create `src/utils/recommendationEngine.ts` with TripFeatures interface.
      Implement extractFeatures(itinerary) returning mood, categories, budgetBand, region, duration.
      Files: `src/utils/recommendationEngine.ts` (new)
      Verify: `npm run test` — feature extraction tests pass

- [ ] 2. Implement getRegion(state) helper in recommendationEngine.
      Map state names to regions (north, south, east, west, central).
      Files: `src/utils/recommendationEngine.ts`
      Verify: `npm run test` — region mapping tests pass

- [ ] 3. Implement calculateSimilarity(userProfile, destination).
      Score 0-1 based on: mood (0.3), category overlap (0.4), budget (0.2), region diversity (0.1).
      Files: `src/utils/recommendationEngine.ts`
      Verify: `npm run test` — similarity scoring tests pass

- [ ] 4. Implement getRecommendations(userId) async function.
      Fetch user trips, build profile, score destinations, filter visited, return top 5 with reasons.
      Files: `src/utils/recommendationEngine.ts`
      Verify: `npm run test` — recommendation tests pass

- [ ] 5. Implement generateReason(profile, destination) helper.
      Create human-readable reasons like "Because you enjoy Adventure trips".
      Files: `src/utils/recommendationEngine.ts`
      Verify: Manual test — reasons are clear and accurate

- [ ] 6. Handle cold start with getPopularDestinations().
      Return top 5 popular destinations when user has no trip history.
      Files: `src/utils/recommendationEngine.ts`
      Verify: `npm run test` — cold start returns popular destinations

- [ ] 7. Create `src/components/RecommendedDestinations.tsx` component.
      Display cards with image, name, state, reason, "Plan Trip" button.
      Files: `src/components/RecommendedDestinations.tsx` (new)
      Verify: Manual test — recommendations display correctly

- [ ] 8. Add RecommendedDestinations to `src/App.tsx` home page.
      Position below DestinationShowcase. Only render if user logged in.
      Files: `src/App.tsx`
      Verify: Manual test — section appears for logged-in users only

---

## Feature 5: Group Trips

- [ ] 1. Run `migrations/005_group_trips.sql` in Supabase SQL Editor.
      Creates trip_members, stop_votes tables, extends trip_expenses, adds RLS policies.
      Files: `migrations/005_group_trips.sql`
      Verify: Check Supabase dashboard — tables exist, policies active

- [ ] 2. Create `src/services/groupTripService.ts` for member management.
      Implement inviteCollaborator(), acceptInvitation(), listMembers().
      Files: `src/services/groupTripService.ts` (new)
      Verify: `npm run test` — service tests pass

- [ ] 3. Create `src/hooks/useRealtimeTrip.ts` for Supabase Realtime sync.
      Subscribe to trip updates, show toast on changes, return updated itinerary.
      Files: `src/hooks/useRealtimeTrip.ts` (new)
      Verify: Manual test with 2 browsers — changes sync in real-time

- [ ] 4. Integrate useRealtimeTrip in `src/components/TripPlanner.tsx`.
      Files: `src/components/TripPlanner.tsx`
      Verify: Manual test — real-time updates work in trip planner

- [ ] 5. Create `src/services/stopVotingService.ts` for stop voting.
      Implement voteStop(), getStopVotes() aggregating upvotes/downvotes.
      Files: `src/services/stopVotingService.ts` (new)
      Verify: `npm run test` — voting service tests pass

- [ ] 6. Create `src/components/StopVoteButtons.tsx` component.
      Display upvote/downvote counts and buttons, show vote score.
      Files: `src/components/StopVoteButtons.tsx` (new)
      Verify: Manual test — voting buttons work, counts update

- [ ] 7. Integrate StopVoteButtons into `src/components/ActivitiesItinerary.tsx`.
      Show for trips with multiple members only.
      Files: `src/components/ActivitiesItinerary.tsx`
      Verify: Manual test — vote buttons appear on multi-member trips

- [ ] 8. Create `src/services/expenseSplitService.ts` for expense splitting.
      Implement splitExpense(), calculateOweSummary() with greedy settlement algorithm.
      Files: `src/services/expenseSplitService.ts` (new)
      Verify: `npm run test` — settlement calculation tests pass, balances sum to zero

- [ ] 9. Create `src/components/ExpenseSplitSummary.tsx` for settlement display.
      Show "Who Owes Whom" section in ExpenseTracker with settlement list.
      Files: `src/components/ExpenseSplitSummary.tsx` (new)
      Verify: Manual test — settlements display correctly

- [ ] 10. Create `src/components/InviteModal.tsx` for member invitations.
       Email input, role dropdown, Send button, member list with remove.
       Files: `src/components/InviteModal.tsx` (new)
       Verify: Manual test — invite flow works end-to-end

- [ ] 11. Add Invite button to trip header in TripPlanner.
       Show for trip owner only.
       Files: `src/components/TripPlanner.tsx`
       Verify: Manual test — owner sees Invite button, others don't

---

## Feature 6: PWA

- [ ] 1. Create `public/manifest.json` with app metadata.
      Include name, icons, start_url, display: standalone, theme_color.
      Files: `public/manifest.json` (new)
      Verify: Check browser DevTools > Application > Manifest

- [ ] 2. Create placeholder icon files.
      Create `public/icon-192.png` and `public/icon-512.png`.
      Files: `public/icon-192.png` (new), `public/icon-512.png` (new)
      Verify: Icons display in manifest preview

- [ ] 3. Link manifest in `index.html`.
      Add `<link rel="manifest" href="/manifest.json">` to <head>.
      Files: `index.html`
      Verify: `npm run build` succeeds

- [ ] 4. Create `public/sw.js` service worker.
      Install: cache static assets. Fetch: network-first for nav, cache-first for map tiles. Activate: clean old caches.
      Files: `public/sw.js` (new)
      Verify: Check DevTools > Application > Service Workers

- [ ] 5. Create `public/offline.html` fallback page.
      Simple offline message with app styling.
      Files: `public/offline.html` (new)
      Verify: Go offline, navigate, see offline page

- [ ] 6. Create `src/serviceWorkerRegistration.ts`.
      Implement register() and unregister() functions.
      Files: `src/serviceWorkerRegistration.ts` (new)
      Verify: `npm run lint` passes

- [ ] 7. Register service worker in `src/main.tsx`.
      Call register() after ReactDOM.createRoot().render().
      Files: `src/main.tsx`
      Verify: Check DevTools — SW registers on page load

- [ ] 8. Create `src/utils/offlineCache.ts` for itinerary caching.
      Implement cacheCurrentItinerary(), getCachedItinerary() using Cache API.
      Files: `src/utils/offlineCache.ts` (new)
      Verify: Manual test — cached itinerary accessible offline

- [ ] 9. Call cacheCurrentItinerary in TripPlanner after trip generation.
      Files: `src/components/TripPlanner.tsx`
      Verify: Manual test — itinerary cached after generation

- [ ] 10. Create `src/hooks/useInstallPrompt.ts`.
       Listen for beforeinstallprompt, expose promptInstall() and isInstallable.
       Files: `src/hooks/useInstallPrompt.ts` (new)
       Verify: Manual test on desktop Chrome — hook detects installability

- [ ] 11. Create `src/components/InstallBanner.tsx`.
       Show "Install TravelMind AI" banner when isInstallable is true. Dismissible.
       Files: `src/components/InstallBanner.tsx` (new)
       Verify: Manual test — banner appears, install works

- [ ] 12. Add InstallBanner to `src/App.tsx` at top.
       Files: `src/App.tsx`
       Verify: Manual test — banner positioned correctly

---

## Feature 7: Multi-City Trips

- [ ] 1. Add MultiCityLeg and MultiCityTrip interfaces to `src/utils/plannerLogic.ts`.
      Define structure with legs[], totalDays, totalCostInr, transportToNext fields.
      Files: `src/utils/plannerLogic.ts`
      Verify: `npm run lint` passes

- [ ] 2. Implement calculateInterCityTransport() in plannerLogic.
      Calculate duration and cost based on haversine distance and mode.
      Files: `src/utils/plannerLogic.ts`
      Verify: `npm run test` — transport calculation tests pass

- [ ] 3. Implement generateMultiCityTrip() in plannerLogic.
      Call generateTripPlan for each leg, calculate transports, accumulate costs.
      Files: `src/utils/plannerLogic.ts`
      Verify: `npm run test` — multi-city generation tests pass

- [ ] 4. Create `src/components/MultiCityPlanner.tsx` input form.
      Leg array with destination dropdown, days input, Add/Remove buttons (2-4 legs).
      Files: `src/components/MultiCityPlanner.tsx` (new)
      Verify: Manual test — form allows 2-4 legs

- [ ] 5. Create `src/components/MultiCityItinerary.tsx` display component.
      Show numbered leg cards with itineraries, transport connection cards, total cost.
      Files: `src/components/MultiCityItinerary.tsx` (new)
      Verify: Manual test — itinerary displays correctly with transports

- [ ] 6. Add `/multi-city` route to `src/App.tsx`.
      Files: `src/App.tsx`
      Verify: Navigate to /multi-city, verify form loads

- [ ] 7. Add "Plan Multi-City Trip" navigation link.
      Add to Header or home page.
      Files: `src/components/Header.tsx` or `src/App.tsx`
      Verify: Manual test — link navigates to multi-city planner

- [ ] 8. Add multi-city support to savedTripsService.
      Save with is_multi_city flag, display with "Multi-City" badge in saved trips.
      Files: `src/services/savedTripsService.ts`
      Verify: Manual test — multi-city trips save and load correctly

- [ ] 9. Add unit tests in `src/utils/plannerLogic.test.ts`.
      Cover: 2-leg generation, cost calculation, date continuity, transport calculation.
      Files: `src/utils/plannerLogic.test.ts`
      Verify: `npm run test` — all multi-city tests pass

---

## Final Verification

After implementing all features:

1. Run `npm run lint` — TypeScript strict mode must pass with no errors
2. Run `npm run test` — All unit tests must pass
3. Run `npm run build` — Production build must succeed
4. Manual regression testing:
   - Existing features (save trips, bucket list, expenses, copilot) still work
   - No console errors on any page
   - All toast notifications work (no alert() calls)
   - Auth flow works for both guest and logged-in users

---

## Dependencies Already Installed

Per task description, these are already in package.json:
- `@react-pdf/renderer` - PDF export
- `ical-generator` - Calendar export
- `html2canvas` - Map snapshot capture
- `nanoid` - Share ID generation

No additional installations required.
