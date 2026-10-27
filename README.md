# TravelMind AI

> AI-powered intelligent travel planning platform for personalized trip itineraries

TravelMind AI is a modern web application that helps travelers plan perfect trips with AI-generated itineraries, real-time weather forecasts, interactive maps, and smart budget optimization.

## Features

### Core Travel Planning
- **Smart Itinerary Generation** - AI-powered day-by-day plans based on mood, energy level, and preferences
- **Dynamic Destination Selection** - Browse curated destinations or search globally with Nominatim geocoding
- **Intelligent Scheduling** - Automatic time slot allocation preventing overlaps and attraction repetition
- **Budget Optimization** - Real-time cost breakdown with accommodation, transport, food, and activity estimates

### AI-Powered Copilot
- **Conversational Assistant** - Context-aware travel advice using Groq AI (GPT-OSS-120B)
- **Trip Context Integration** - Copilot understands your current itinerary and preferences
- **Smart Recommendations** - Personalized suggestions for activities, dining, and hidden gems

### Advanced Features
- **Authentication & User Accounts** - Secure sign-up/sign-in with Supabase Auth
- **Saved Trips & Bucket List** - Sync trips across devices with RLS-protected database
- **Weather Forecasting** - 7-day forecasts with Open-Meteo integration
- **Interactive Maps** - Leaflet maps with attraction markers and route visualization
- **Turn-by-Turn Routing** - OpenRouteService integration for driving, cycling, and walking directions
- **Real Booking Links** - Direct integration with MakeMyTrip, Booking.com, Zomato, and more

## Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Fully typed codebase
- **Vite** - Lightning-fast build tool
- **Tailwind CSS v4** - Modern utility-first styling
- **Motion** - Smooth animations and transitions
- **Leaflet** - Interactive map components

### Backend & APIs
- **Supabase** - Authentication, PostgreSQL database with RLS
- **Express** - Dev API server for local development
- **Vercel Serverless Functions** - Production API deployment
- **Groq AI** - Fast LLM inference for copilot
- **OpenRouteService** - Routing and directions
- **Open-Meteo** - Weather forecasting
- **Nominatim** - Global geocoding

### Security & Best Practices
- **JWT Authentication** - Token-based API security
- **Rate Limiting** - Per-user request throttling (20 chat/10min, 60 routing/10min)
- **CORS Allowlist** - Origin-restricted API access
- **Input Validation** - Zod schema validation on all endpoints
- **Row-Level Security** - Database policies ensuring data isolation

## Environment Variables

Create a `.env.local` file in the root directory:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes | - |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) | Yes | - |
| `GROQ_API_KEY` | Groq API key for AI copilot | Yes | - |
| `GROQ_MODEL` | Groq model to use | No | `openai/gpt-oss-120b` |
| `OPENROUTE_API_KEY` | OpenRouteService API key | Yes | - |
| `API_PORT` | Local dev server port | No | `3001` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | No | `http://localhost:5173,http://localhost:3000` |
| `CHAT_RATE_LIMIT` | Chat requests per window | No | `20` |
| `ROUTING_RATE_LIMIT` | Routing requests per window | No | `60` |
| `RATE_LIMIT_WINDOW` | Rate limit window in milliseconds | No | `600000` (10 min) |

See `.env.example` for a template.

## Setup

### Prerequisites
- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm** or **bun** - Package manager
- **Supabase Account** - [Sign up](https://supabase.com/)
- **Groq API Key** - [Get free key](https://console.groq.com/)
- **OpenRouteService API Key** - [Register](https://openrouteservice.org/dev/#/signup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd travelmind-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Set up Supabase database**
   
   Run the migration in Supabase SQL Editor:
   ```bash
   # Copy contents of migrations/001_saved_trips.sql
   # Paste and run in Supabase dashboard > SQL Editor
   ```

5. **Start development servers**
   ```bash
   # Option 1: Run both frontend and API server concurrently
   npm run dev:all
   
   # Option 2: Run separately
   npm run dev      # Frontend on http://localhost:5173
   npm run dev:api  # API server on http://localhost:3001
   ```

6. **Open the app**
   ```
   http://localhost:5173
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:api` | Start Express API server (backend only) |
| `npm run dev:all` | Start both frontend and backend concurrently |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | Run TypeScript type checking |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |

## Architecture

### Frontend Architecture
```
src/
├── components/         # React components
├── contexts/          # React context providers (Auth, Toast)
├── data/              # Static data (destinations, attractions)
├── services/          # API service layers
│   ├── aiCopilotService.ts
│   ├── routingService.ts
│   ├── savedTripsService.ts
│   ├── bucketListService.ts
│   └── ...
├── utils/             # Business logic
│   └── plannerLogic.ts  # Core itinerary generation
├── lib/               # Third-party integrations
│   └── supabase.ts
└── types/             # TypeScript type definitions
```

### Backend Architecture
```
api/
├── _lib/              # Shared handlers (dev + serverless)
│   ├── chat.ts        # Groq AI handler
│   ├── routing.ts     # OpenRouteService handler
│   ├── rateLimiter.ts # In-memory rate limiting
│   ├── schemas.ts     # Zod validation schemas
│   └── supabase.ts    # Server-side Supabase client
├── chat.ts            # Serverless function wrapper
└── routing.ts         # Serverless function wrapper

server.js              # Express dev server
```

### Database Schema

**`saved_trips`** (RLS enabled)
- `id` - UUID primary key
- `user_id` - Foreign key to `auth.users`
- `trip_data` - JSONB (full itinerary)
- `destination_name`, `destination_state`, `start_city` - Denormalized for queries
- `departure_date`, `days`, `total_cost_inr`, `mood` - Trip metadata
- `is_visited`, `visited_date`, `notes` - User status tracking
- `created_at`, `updated_at` - Timestamps

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure environment variables in Vercel dashboard**
   - Add all variables from `.env.local`
   - Ensure `VITE_` prefixed vars are available to frontend

4. **Serverless functions will auto-deploy**
   - `api/chat.ts` → `/api/chat`
   - `api/routing.ts` → `/api/routing`

### Other Platforms
- **Netlify** - Compatible with Netlify Functions
- **Railway** - Deploy as full-stack Node app
- **Self-hosted** - Use `npm run build` + serve `dist/` + run `server.js`

## Testing

### Run Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test -- --coverage
```

### Manual Testing Checklist
- [ ] Sign up / Sign in flows
- [ ] Create 14-day trip (verify no attraction repeats)
- [ ] Save trip (verify persists across devices)
- [ ] Add trip to bucket list
- [ ] Use AI copilot with trip context
- [ ] Test rate limiting (exceed 20 chat requests in 10 min)
- [ ] Test unauthenticated API calls (should get 401)
- [ ] Test routing with turn-by-turn directions
- [ ] Check toast notifications (no alert() calls)

## Contributing

### Code Style
- Follow existing TypeScript strict mode conventions
- Run `npm run lint` before committing
- Add tests for new features
- Keep components under 300 lines

### Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates
- `refactor:` - Code refactoring
- `test:` - Test additions/updates

## Roadmap

### Phase 2 (Planned)
- [ ] Geographic clustering for route optimization
- [ ] Multi-day accommodation booking
- [ ] Collaborative trip planning (share with friends)
- [ ] Offline mode with service worker
- [ ] Mobile app (React Native)
- [ ] Export to PDF/Google Calendar

### Known Limitations
- Weather forecasts use mock data for destinations without real integration
- Attraction database covers major Indian destinations (global destinations use exploratory blocks)
- In-memory rate limiter resets on server restart (use Upstash Redis for production)

## License

MIT

## Support

- **Documentation** - See `docs/` folder for detailed guides
- **Issues** - Report bugs via GitHub Issues
- **Discussions** - Feature requests and questions welcome

---

Built with ❤️ by the TravelMind AI Team
