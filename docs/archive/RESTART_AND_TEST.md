# TravelMind AI - Restart and Testing Guide

## ✅ Build Status
- TypeScript compilation: **PASSED**
- Production build: **PASSED** (736 KB bundle)
- Server-side API key refactoring: **COMPLETE**

---

## 🔐 Security Configuration

Your API keys are now **server-side only**:
- `GEMINI_API_KEY` - Used by `/api/chat` endpoint
- `OPENROUTE_API_KEY` - Used by `/api/routing` endpoint

These keys are **NOT exposed** in browser code.

Supabase keys remain client-side (safe for browser):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 🚀 Step 1: Verify Your `.env.local` File

Open `.env.local` and confirm it has this **exact format**:

```env
# Supabase Configuration (Client-side - safe for browser)
VITE_SUPABASE_URL=https://yahxymghrgynlwwrskta.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaHh5bWdocmd5bmx3d3Jza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njc3NjgsImV4cCI6MjEwODM0Mzc2OH0.xMFOISBT-5aomRIHCApbJakTQ7REM9TfcSdnHnPewDs

# API Keys (Server-side only - NOT exposed to browser)
GEMINI_API_KEY=your_gemini_key_here
OPENROUTE_API_KEY=your_openroute_key_here
```

### ⚠️ CRITICAL: Verify Your API Keys

**Gemini API Key:**
- Should be **exactly 39 characters**
- Format: `AIzaSy` followed by 33 more characters
- Example: `AIzaSyDxyz123abc456def789ghi012jkl345`
- **⚠️ YOUR KEY LOOKS CORRUPTED** - Has dots/periods in wrong places
- **MUST REGENERATE:** https://aistudio.google.com/app/apikey

**OpenRouteService API Key:**
- ✅ **CONFIGURED** - JWT format (starts with `eyJ`)
- Length: ~100 characters
- Your key: `eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFmM2FmMjM4M2I5ZjQ2MTA5NWNiZGY0YTVhY2U1YmEwIiwiaCI6Im11cm11cjY0In0=`

---

## 🔄 Step 2: Restart the Application

### Option A: Kill all Node processes (recommended)
```powershell
# Kill all Node.js processes
taskkill /F /IM node.exe

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start the app
npm run dev:all
```

### Option B: Manual restart
1. Press `Ctrl+C` in your terminal running `npm run dev:all`
2. Wait for it to fully stop
3. Run: `npm run dev:all`

### ✅ Success Indicators
You should see:
```
VITE v8.3.5  ready in X ms
➜  Local:   http://localhost:5173/
Server running on http://localhost:3001
```

---

## 🧪 Step 3: Test AI Copilot (Gemini API)

1. **Open the app:** http://localhost:5173/
2. **Generate a trip:**
   - Select mood: "Adventure"
   - Enter destination: "Ladakh"
   - Duration: 5 days
   - Click "Generate Trip"
3. **Open AI Copilot:**
   - Click the chat icon (bottom right)
   - Type: "What should I pack for this trip?"
   - Press Enter

### ✅ Expected Result:
- AI responds with packing suggestions
- No console errors

### ❌ If You See Errors:
- Check browser console (F12)
- If error mentions "API key", your `GEMINI_API_KEY` is invalid
- **Fix:** Get a fresh key from https://aistudio.google.com/app/apikey

---

## 🗺️ Step 4: Test Routing (OpenRouteService API)

1. **Generate a multi-stop trip:**
   - Select mood: "Cultural"
   - Enter destination: "Rajasthan"
   - Duration: 7 days
   - Click "Generate Trip"
2. **Check the map:**
   - You should see a route line connecting destinations
   - Click any waypoint marker
   - **Turn-by-turn directions should appear** in the sidebar

### ✅ Expected Result:
- Map shows a connected route (not just straight lines)
- Directions panel shows distance, duration, and turn-by-turn instructions

### ❌ If You See "Unable to load directions - Using direct route":
- Your `OPENROUTE_API_KEY` is missing or invalid
- **Fix:** Copy the complete key from https://openrouteservice.org/dev/#/home
- Make sure you copied the **entire** key (no truncation)

---

## 🏗️ Step 5: Test Database Features

### Test Budget Tracking:
1. Generate any trip
2. Click "Budget Tracker" tab
3. Add an expense:
   - Amount: 50
   - Category: Food
   - Description: Lunch
   - Click "Add Expense"

### Test Trip Saving:
1. After generating a trip, click "Save Trip"
2. Click "My Trips" (navigation)
3. Your trip should appear in the saved trips list

### ✅ Expected Result:
- No errors in console
- Data persists after page refresh

---

## 🐛 Troubleshooting

### Problem: "Failed to fetch" errors
**Cause:** Server not running or wrong port  
**Fix:** Make sure you ran `npm run dev:all` (not just `npm run dev`)

### Problem: AI Copilot returns generic errors
**Cause:** Invalid Gemini API key  
**Fix:**
1. Go to https://aistudio.google.com/app/apikey
2. Delete old key, create a new one
3. Copy the **complete** key (should be 39 chars starting with `AIzaSy`)
4. Paste into `.env.local` as `GEMINI_API_KEY=AIzaSy...`
5. Restart: `taskkill /F /IM node.exe` then `npm run dev:all`

### Problem: Routing still shows "direct route" fallback
**Cause:** Invalid OpenRouteService API key  
**Fix:**
1. Go to https://openrouteservice.org/dev/#/home
2. Find your **API Key** section
3. Click the copy icon to copy the **entire** key
4. Paste into `.env.local` as `OPENROUTE_API_KEY=...`
5. Restart the server

### Problem: Database operations fail
**Cause:** Supabase keys incorrect or RLS policies not configured  
**Check:**
1. `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Both migrations were run successfully (check Supabase Table Editor)

---

## 📋 Quick Test Checklist

- [ ] Server starts without errors
- [ ] App loads at http://localhost:5173/
- [ ] Trip generation works
- [ ] 3D Globe renders and is interactive
- [ ] Weather forecast shows data
- [ ] AI Copilot responds to questions (no API key errors)
- [ ] Map shows turn-by-turn directions (not direct lines)
- [ ] Budget tracker accepts expenses
- [ ] Save trip works and persists
- [ ] No red errors in browser console

---

## 🎉 All Features Working?

If everything passes, your app is fully configured! The refactoring successfully moved sensitive API keys server-side while keeping everything functional.

**Your API keys are now secure** - they never reach the browser, only the server uses them.
