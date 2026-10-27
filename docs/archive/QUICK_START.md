# ⚡ Quick Start - TravelMind AI

## ✅ What's Configured

### Working Keys:
- ✅ **Supabase** (Database) - Configured and tested
- ✅ **OpenRouteService** (Routing/Maps) - Key added

### ⚠️ Needs Fixing:
- ❌ **Gemini AI** (Chatbot) - Key is corrupted

---

## 🔧 Step 1: Fix Gemini API Key (REQUIRED)

Your current Gemini key has formatting errors. Get a fresh one:

1. **Go to:** https://aistudio.google.com/app/apikey
2. **Delete the old key** (if it exists)
3. **Create new key** → Select your project → Click "Create key"
4. **Copy the ENTIRE key** (should be 39 characters, starts with `AIzaSy`)
5. **Open `.env.local`** and replace this line:
   ```env
   GEMINI_API_KEY=AIzaSyAQ.Ab8RN6KI-ZbOPvGWC55_RvQ8AtSTI85pe2pS9IeDMje2gpS09A
   ```
   With your new key:
   ```env
   GEMINI_API_KEY=AIzaSy_your_new_39_character_key_here
   ```

---

## 🚀 Step 2: Restart the App

Run these commands in PowerShell:

```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start the app
npm run dev:all
```

**You should see:**
```
VITE v8.3.5  ready in X ms
➜  Local:   http://localhost:5173/
Server running on http://localhost:3001
```

---

## 🧪 Step 3: Test Everything

### 1️⃣ Test Routing (OpenRouteService)
1. Open http://localhost:5173/
2. Generate a trip: "Rajasthan" → 7 days → "Cultural"
3. Check the map for **connected route lines** (not straight lines)
4. Click a waypoint → Should show **turn-by-turn directions**

**✅ Expected:** Real driving route with detailed directions  
**❌ If fails:** Check browser console (F12) for errors

---

### 2️⃣ Test AI Copilot (Gemini) - ONLY AFTER FIXING KEY
1. Generate any trip
2. Click **chat icon** (bottom right)
3. Type: "What should I pack for this trip?"
4. Press Enter

**✅ Expected:** AI responds with packing suggestions  
**❌ If fails:** Your Gemini key is still wrong - regenerate it

---

### 3️⃣ Test Database (Supabase)
1. Generate a trip
2. Click "Budget Tracker" tab
3. Add expense: Amount=50, Category=Food
4. Click "Save Trip"
5. Go to "My Trips" (navigation)

**✅ Expected:** Trip appears in saved trips  
**❌ If fails:** Check Supabase dashboard

---

## 🐛 Common Issues

### Issue: "Failed to fetch" errors
**Fix:** Make sure you ran `npm run dev:all` (not just `npm run dev`)

### Issue: AI Copilot doesn't respond
**Fix:** Your Gemini key is invalid. Steps:
1. Go to https://aistudio.google.com/app/apikey
2. Create a NEW key
3. Copy the FULL 39-character key
4. Update `.env.local`
5. Restart: `taskkill /F /IM node.exe` then `npm run dev:all`

### Issue: Map shows straight lines instead of roads
**Fix:** OpenRouteService key issue (but yours should work now!)

---

## 📋 Final Checklist

Before testing, verify your `.env.local` looks like this:

```env
# Supabase Configuration (Client-side)
VITE_SUPABASE_URL=https://yahxymghrgynlwwrskta.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaHh5bWdocmd5bmx3d3Jza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njc3NjgsImV4cCI6MjEwODM0Mzc2OH0.xMFOISBT-5aomRIHCApbJakTQ7REM9TfcSdnHnPewDs

# Gemini AI API Key (Server-side only)
GEMINI_API_KEY=AIzaSy___YOUR_39_CHAR_KEY_HERE___

# OpenRouteService API Key (Server-side only)
OPENROUTE_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFmM2FmMjM4M2I5ZjQ2MTA5NWNiZGY0YTVhY2U1YmEwIiwiaCI6Im11cm11cjY0In0=
```

---

## ✅ Success Indicators

When everything works:
- [ ] App loads at http://localhost:5173/
- [ ] Trip generation works
- [ ] 3D Globe is interactive
- [ ] Weather data appears
- [ ] **Map shows curved driving routes** (not straight lines) ✨
- [ ] **AI Copilot responds to questions** ✨
- [ ] Budget tracker saves expenses
- [ ] Saved trips persist after refresh
- [ ] No red errors in browser console (F12)

---

## 🎉 You're Almost There!

**All you need to do:**
1. Fix Gemini API key (get fresh one from Google AI Studio)
2. Restart the app
3. Test routing → Should work perfectly now! ✅
4. Test AI chat → Will work after you fix the Gemini key

**Your OpenRouteService key is now configured!** 🚀
