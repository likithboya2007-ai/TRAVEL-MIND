# Spec: Stabilize Backend and Fixes

## Overview
Stabilize TravelMind AI's backend architecture, add proper authentication/security, fix logic bugs, and improve tooling for production readiness.

## Goals
1. Create unified API layer shared between dev and production
2. Secure all endpoints with authentication and rate limiting
3. Move saved trips from localStorage to Supabase with RLS
4. Fix attraction repetition and time slot calculation bugs
5. Add proper testing infrastructure and CI/CD
6. Clean up project structure and documentation

## Requirements

### 1. Unified API Layer

#### 1.1 Shared Handler Modules
- **Create** `api/_lib/chat.ts` - Shared Groq chat handler
  - Accept (message, tripContext, conversationHistory, token)
  - Verify Supabase token
  - Apply rate limiting
  - Call Groq with `openai/gpt-oss-120b`
  - Return response or error
  
- **Create** `api/_lib/routing.ts` - Shared routing handler
  - Accept (coordinates, profile, options, token)
  - Verify Supabase token
  - Apply rate limiting
  - Call OpenRouteService
  - Return route data or error

#### 1.2 Update Endpoints
- **Update** `server.js` - Use shared handlers from `api/_lib/`
- **Update** `api/chat.ts` - Use `api/_lib/chat.ts` handler
- **Create** `api/routing.ts` - New serverless function using `api/_lib/routing.ts`

#### 1.3 Remove Broken Gemini Code
- **Remove** `@google/genai` import from `api/chat.ts` (doesn't exist)
- **Remove** `@google/genai` from `package.json` dependencies
- **Ensure** all AI calls use Groq with model from `GROQ_MODEL` env var (default: `openai/gpt-oss-120b`)

### 2. Secure the Endpoints

#### 2.1 Authentication
- **Add** token verification to both `/api/chat` and `/api/routing`
- **Verify** using `supabase.auth.getUser(token)` server-side
- **Return** 401 Unauthorized if token invalid/missing
- **Update** `src/services/aiCopilotService.ts` to send `Authorization: Bearer <token>`
- **Update** `src/services/routingService.ts` to send `Authorization: Bearer <token>`

#### 2.2 Rate Limiting
- **Create** `api/_lib/rateLimiter.ts` - In-memory rate limiter
  - Track per user ID (from token)
  - Chat: 20 requests per 10 minutes
  - Routing: 60 requests per 10 minutes
  - Structure for easy Upstash/Redis swap later
- **Apply** rate limiting before processing requests
- **Return** 429 Too Many Requests when exceeded

#### 2.3 CORS Configuration
- **Replace** `Access-Control-Allow-Origin: *` with allowlist
- **Read** from `ALLOWED_ORIGINS` env var (comma-separated)
- **Default** to `http://localhost:5173,http://localhost:3000` for dev

#### 2.4 Input Validation
- **Install** `zod` dependency
- **Create** `api/_lib/schemas.ts` - Request validation schemas
  - Chat: validate message (max 2000 chars), history (max 20 messages)
  - Routing: validate coordinates array, profile string
- **Validate** all request bodies before processing
- **Return** 400 Bad Request with sanitized error for invalid input

#### 2.5 Error Handling
- **Never** return raw `error.message` to client
- **Return** generic error messages: "Failed to process request"
- **Log** detailed errors server-side for debugging
- **Use** appropriate status codes (400, 401, 429, 500)

### 3. Database Consistency

#### 3.1 Database Migration
- **Create** `migrations/001_saved_trips.sql`
  ```sql
  CREATE TABLE saved_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    trip_data JSONB NOT NULL,
    saved_date TIMESTAMP DEFAULT NOW(),
    last_viewed TIMESTAMP DEFAULT NOW(),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date TIMESTAMP,
    trip_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- RLS Policies
  ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own trips"
    ON saved_trips FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own trips"
    ON saved_trips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own trips"
    ON saved_trips FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete own trips"
    ON saved_trips FOR DELETE
    USING (auth.uid() = user_id);

  -- Indexes
  CREATE INDEX idx_saved_trips_user ON saved_trips(user_id);
  CREATE INDEX idx_saved_trips_date ON saved_trips(saved_date DESC);
  ```

#### 3.2 Saved Trips Service
- **Create** `src/services/savedTripsService.ts` (mirror `bucketListService.ts`)
  - `getAll()` - Fetch user's saved trips
  - `save(trip)` - Save new trip
  - `update(id, data)` - Update trip
  - `delete(id)` - Delete trip
  - `toggleComplete(id, completed)` - Mark as completed
  - `updateNotes(id, notes)` - Update trip notes

#### 3.3 LocalStorage Migration
- **Add** one-time migration in `src/App.tsx` on mount when user logs in
  - Check `localStorage.getItem('travelmind_saved_trips')`
  - If exists, parse and save each trip to Supabase via `savedTripsService`
  - Clear localStorage key after successful migration
  - Show toast: "X trips migrated to your account"

#### 3.4 Update SavedTrip Interface
- **Fix** `src/lib/supabase.ts` - Remove duplicate `TripExpense` interface
- **Ensure** `SavedTrip` interface matches database schema

#### 3.5 Update Components
- **Update** `src/App.tsx` - Use `savedTripsService` instead of localStorage
- **Update** `src/components/SavedTripsModal.tsx` - Load from Supabase

### 4. Bug Fixes in plannerLogic.ts

#### 4.1 Attraction Repetition Bug
**Problem:** When `days * stopsPerDay > attractions.length`, attractions repeat due to modulo cycling

**Fix:**
- Track used attractions in a Set
- When pool exhausted, add "Free time / explore on your own" blocks
- Never reuse same attraction
- Label clearly: `{ name: "Free Time", category: "Relaxation", description: "Explore on your own" }`

**Code location:** `src/utils/plannerLogic.ts` - `generateTripPlan()` function

#### 4.2 Time Slot Calculation Bug
**Problem:** 
- Inconsistent start/end times (3rd slot starts 05:30 PM but end computed from `9 + s*4`)
- Slots can overlap

**Fix:**
- Compute `endTime = startTime + attraction.durationHours`
- Use consistent 12-hour formatting
- Ensure no overlap between slots in same day
- Validate total day duration doesn't exceed reasonable hours (8 AM - 10 PM)

**Code location:** `src/utils/plannerLogic.ts` - Time slot generation in `generateTripPlan()`

#### 4.3 Travellers Count Bug
**Problem:** Uses `GROUP_SIZE_MAP` instead of `input.travellers` (Friends hard-coded to 3)

**Fix:**
- Use `input.travellers` directly for all calculations
- Remove dependency on `GROUP_SIZE_MAP` for traveller count
- Keep `GROUP_SIZE_MAP` only for group type descriptions/preferences

**Code location:** `src/utils/plannerLogic.ts` - Budget calculations

#### 4.4 Accommodation Cost Scaling
**Problem:** Stay cost doesn't scale with rooms needed

**Fix:**
- Calculate rooms: `Math.ceil(input.travellers / 2)`
- Multiply room cost by number of rooms
- Update formula: `accommodationCost = roomsNeeded * pricePerNight * days`

**Code location:** `src/utils/plannerLogic.ts` - `calculateBudget()` function

#### 4.5 False Geographic Clustering Claim
**Problem:** Insight claims "routes clustered by proximity" but it's not implemented

**Fix:**
- Remove insight: "Day routes clustered by geographic proximity"
- Add comment: `// TODO Phase 2: Implement geographic clustering`
- Keep other valid insights

**Code location:** `src/utils/plannerLogic.ts` - Insights generation

### 5. Small Fixes

#### 5.1 Google Maps Place ID Fix
**Problem:** `query_place_id` receives `"lat,lng"` but Google expects Place ID

**Fix:**
- Change to `query=${lat},${lng}` in Maps search URL
- Or use `query=${encodeURIComponent(placeName)}&query_place_id=` (without lat/lng)
- Update `generateGoogleMapsSearch()` and `generateGoogleMapsDirections()`

**Code location:** `src/services/linkGeneratorService.ts`

#### 5.2 Replace alert() with Toast System
**Create toast system:**
- **Add** `src/contexts/ToastContext.tsx` - Toast provider with state management
- **Add** `src/components/Toast.tsx` - Toast notification component
  - Success, error, warning, info variants
  - Auto-dismiss after 3-5 seconds
  - Stacked display (bottom-right corner)
  - Smooth animations

**Replace all `alert()` calls:**
- `src/App.tsx` - 4 alert calls
- `src/components/BucketListModal.tsx` - error alerts
- `src/services/` - Any error alerts
- Use: `toast.success("Trip saved!")`, `toast.error("Failed to save")`

### 6. Tooling and Cleanup

#### 6.1 Add Vitest
- **Install** `vitest` and `@vitest/ui` as devDependencies
- **Create** `vitest.config.ts` - Vitest configuration
- **Convert** existing test files to Vitest:
  - `src/utils/plannerLogic.test.ts` - Convert from node:test
  - `src/services/weatherService.test.ts` - Convert from node:test
  - `src/services/searchServices.test.ts` - Convert from node:test
- **Add** script: `"test": "vitest run"` to `package.json`
- **Add** script: `"test:watch": "vitest"` for development
- **Add** script: `"test:ui": "vitest --ui"` for UI mode

#### 6.2 GitHub Actions CI
- **Create** `.github/workflows/ci.yml`
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 20
        - run: npm ci
        - run: npm run lint
        - run: npm run test
        - run: npm run build
  ```

#### 6.3 Package Rename
- **Update** `package.json`:
  - `"name": "travelmind-ai"`
  - `"version": "1.0.0"`
  - `"description": "AI-powered travel planning platform"`
  - Add `"repository"`, `"author"`, `"license"` fields

#### 6.4 Project Cleanup
- **Create** `docs/archive/` directory
- **Move** ~20 root-level `.md` files to `docs/archive/`:
  - Keep: `README.md`, `LICENSE` (if exists)
  - Move rest: `HOTEL_RESTAURANT_BOOKING.md`, `TRANSPORT_BOOKING_INTEGRATION.md`, etc.
- **Delete** `dist/` directory (build output)
- **Delete** `.aistudio/` directory (AI artifacts)
- **Update** `.gitignore`:
  ```
  dist/
  .aistudio/
  node_modules/
  .env
  .env.local
  *.log
  ```

#### 6.5 Documentation
- **Rewrite** `README.md` with:
  - Project description and features
  - Architecture overview (Frontend, Backend, Database, APIs)
  - Environment variables table with descriptions
  - Setup instructions (install, env vars, database)
  - Available scripts (`dev`, `build`, `test`, `lint`)
  - Deployment guide (Vercel recommended)
  - Contributing guidelines
  - License

- **Update** `.env.example` with all required variables:
  ```
  # Supabase
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

  # Groq AI
  GROQ_API_KEY=your_groq_api_key
  GROQ_MODEL=openai/gpt-oss-120b

  # OpenRouteService
  OPENROUTE_API_KEY=your_openroute_api_key

  # API Configuration
  API_PORT=3001
  ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

  # Rate Limiting
  CHAT_RATE_LIMIT=20
  ROUTING_RATE_LIMIT=60
  RATE_LIMIT_WINDOW=600000
  ```

## Acceptance Criteria

### Functional
- [ ] `npm run lint` passes (tsc --noEmit)
- [ ] `npm run test` passes (all tests green)
- [ ] `npm run build` completes without errors
- [ ] Unauthenticated calls to `/api/chat` return 401
- [ ] Unauthenticated calls to `/api/routing` return 401
- [ ] Rate limits enforced (429 after exceeding limits)
- [ ] No attraction repeats in 14-day trip plan
- [ ] Time slots don't overlap within a day
- [ ] Saved trips persist across devices (Supabase)
- [ ] LocalStorage trips migrated on first login
- [ ] Toast notifications work (no alert() calls)
- [ ] Google Maps links work correctly

### Technical
- [ ] Shared handler modules in `api/_lib/`
- [ ] Both dev server and serverless functions use shared code
- [ ] Zod validation on all API endpoints
- [ ] CORS restricted to allowlist
- [ ] No sensitive env vars in client bundle
- [ ] Database migration file created
- [ ] RLS policies active on `saved_trips` table
- [ ] Vitest test suite running
- [ ] GitHub Actions CI workflow active

### Documentation
- [ ] README.md comprehensive and up-to-date
- [ ] .env.example includes all variables
- [ ] Architecture documented
- [ ] Setup instructions clear
- [ ] Old docs moved to `docs/archive/`

## Implementation Order

1. **Phase 1: Security & API** (Critical)
   - Create shared handler modules
   - Add authentication checks
   - Implement rate limiting
   - Add input validation
   - Update CORS

2. **Phase 2: Database** (High Priority)
   - Create migration file
   - Build savedTripsService
   - Implement localStorage migration
   - Update App.tsx

3. **Phase 3: Bug Fixes** (High Priority)
   - Fix attraction repetition
   - Fix time slot calculations
   - Fix traveller count usage
   - Fix accommodation scaling
   - Remove false insight

4. **Phase 4: UX Improvements** (Medium Priority)
   - Build toast system
   - Replace all alerts
   - Fix Google Maps links

5. **Phase 5: Testing & CI** (Medium Priority)
   - Set up Vitest
   - Convert existing tests
   - Add new test cases
   - Create GitHub Actions workflow

6. **Phase 6: Cleanup** (Low Priority)
   - Rename package
   - Move docs to archive
   - Update .gitignore
   - Rewrite README.md
   - Update .env.example

## Testing Strategy

### Unit Tests
- `plannerLogic.ts` - All bug fixes
- `rateLimiter.ts` - Rate limiting logic
- `savedTripsService.ts` - CRUD operations
- `schemas.ts` - Zod validation

### Integration Tests
- API endpoints with auth
- LocalStorage migration flow
- Rate limiting behavior

### Manual Testing
- Sign in/out flows
- Create 14-day trip (no repeats)
- Save trip (persists across devices)
- Exceed rate limits (get 429)
- Try unauthenticated API call (get 401)

## Dependencies to Add

```json
{
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0"
  }
}
```

## Dependencies to Remove

```json
{
  "dependencies": {
    "@google/genai": "remove if present"
  }
}
```

## Migration Notes

### Breaking Changes
- Saved trips move from localStorage to Supabase (one-time auto-migration)
- API endpoints now require authentication (401 if unauthenticated)
- Rate limits applied (users may hit 429 if excessive usage)

### User Impact
- **Positive**: Trips sync across devices
- **Positive**: More secure API
- **Neutral**: May need to sign in more often
- **Neutral**: Rate limits prevent abuse

## Success Metrics

- Zero TypeScript errors
- 100% test pass rate
- No security vulnerabilities
- All acceptance criteria met
- Clean, maintainable codebase ready for production

## Timeline Estimate

- Phase 1 (Security): 3-4 hours
- Phase 2 (Database): 2-3 hours
- Phase 3 (Bug Fixes): 2-3 hours
- Phase 4 (Toast System): 1-2 hours
- Phase 5 (Testing/CI): 2-3 hours
- Phase 6 (Cleanup): 1-2 hours

**Total: 11-17 hours** of focused development
