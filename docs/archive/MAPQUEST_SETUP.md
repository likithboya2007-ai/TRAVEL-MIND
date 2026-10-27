# MapQuest API - Free Alternative to OpenRouteService

## 🆓 Why MapQuest?

**MapQuest is BETTER than OpenRouteService for free tier:**

| Feature | MapQuest GO (FREE) | OpenRouteService (FREE) |
|---------|-------------------|------------------------|
| **Free Transactions** | **50,000 one-time** | 2,000/day (~60,000/month) |
| **After Free Tier** | **$0.0045/transaction** | Limited to 40 requests/day for directions |
| **Signup** | ✅ Simple, instant | ❌ Email verification issues |
| **API Stability** | ✅ Enterprise-grade | ⚠️ Community-maintained |
| **Support** | ✅ Email support included | ⚠️ Community forums only |

## 📝 Step 1: Sign Up for MapQuest Developer Account

1. **Go to:** https://developer.mapquest.com/
2. Click **"Sign Up"** (top right corner)
3. Fill in the form:
   - Email address
   - Password
   - First/Last name
   - Company (optional - can put "Personal Project")
4. Agree to Terms of Service
5. Click **"Create Account"**
6. **Verify your email** (check inbox/spam)

## 🔑 Step 2: Get Your API Key

1. **After email verification**, log in at: https://developer.mapquest.com/user/login
2. Go to **"My Keys"** or **"Manage Keys"** in your dashboard
3. You'll see your default application key
4. **Copy the Consumer Key** (this is your API key)
   - Format: Usually starts with alphanumeric characters
   - Length: ~32 characters

## 🔧 Step 3: Update Your `.env.local` File

Replace the OpenRouteService key with your MapQuest key:

```env
# Supabase Configuration (Client-side)
VITE_SUPABASE_URL=https://yahxymghrgynlwwrskta.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaHh5bWdocmd5bmx3d3Jza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njc3NjgsImV4cCI6MjEwODM0Mzc2OH0.xMFOISBT-5aomRIHCApbJakTQ7REM9TfcSdnHnPewDs

# API Keys (Server-side only)
GEMINI_API_KEY=your_gemini_key_here
MAPQUEST_API_KEY=your_mapquest_consumer_key_here
```

**Note:** Remove `OPENROUTE_API_KEY` line - we're using MapQuest instead!

## 💻 Step 4: I'll Update the Code

I'll modify the routing service to use MapQuest's Directions API instead of OpenRouteService.

**Changes needed:**
1. Update `server.js` - change `/api/routing` to call MapQuest API
2. Update `routingService.ts` - adapt to MapQuest response format
3. Update documentation

**Want me to make these changes now?** (say "yes" and I'll update the code)

## 📊 MapQuest API Comparison

### Directions API Endpoint
```
https://www.mapquestapi.com/directions/v2/route
```

### Request Format
```json
{
  "locations": [
    { "latLng": { "lat": 28.7041, "lng": 77.1025 } },
    { "latLng": { "lat": 26.9124, "lng": 75.7873 } }
  ],
  "options": {
    "unit": "k",
    "routeType": "fastest",
    "narrativeType": "text"
  }
}
```

### Response Features
- ✅ Turn-by-turn directions
- ✅ Distance and duration
- ✅ Route polyline (encoded)
- ✅ Traffic data (on paid plans)
- ✅ Multiple route types (fastest, shortest, pedestrian, bicycle)

## 🎯 Free Tier Limits

**MapQuest GO Plan (FREE):**
- 50,000 **one-time** free transactions
- Credits expire: January 1, 2027
- Then pay-as-you-go: **$0.0045/transaction** (very cheap!)
- No monthly minimum
- Includes: Directions, Geocoding, Search, Maps APIs

**What counts as a transaction?**
- 1 route calculation = 1 transaction
- 1 geocoding request = 1 transaction
- Map tile loads also count (but we're not using MapQuest maps)

## 📖 Official Documentation

- **Developer Portal:** https://developer.mapquest.com/
- **Directions API Docs:** https://developer.mapquest.com/documentation/directions-api/
- **API Reference:** https://developer.mapquest.com/documentation/directions-api/route/get/
- **Pricing:** https://developer.mapquest.com/plans

## 🆚 Comparison with OpenRouteService

### MapQuest Advantages:
- ✅ **Simpler signup** (no email verification issues)
- ✅ **Larger free tier** (50,000 vs ~1,200/month for directions)
- ✅ **Enterprise support**
- ✅ **Better uptime** (commercial-grade infrastructure)
- ✅ **Clearer pricing** after free tier

### OpenRouteService Advantages:
- ✅ Open-source
- ✅ Based on OpenStreetMap data
- ✅ More customization options
- ✅ Higher daily limits (if you need >50k one-time)

## 🚀 After Setup

Once you have your MapQuest key:
1. Paste it in `.env.local` as `MAPQUEST_API_KEY=your_key_here`
2. Tell me "update code for mapquest"
3. I'll modify the routing service to use MapQuest
4. Restart: `taskkill /F /IM node.exe` then `npm run dev:all`
5. Test routing on a multi-stop trip

## ❓ Troubleshooting

### "Invalid API key" error
- Make sure you copied the **Consumer Key** (not the Secret Key)
- Check for extra spaces or line breaks when pasting
- Verify the key is active in your MapQuest dashboard

### "Rate limit exceeded"
- Check your usage at: https://developer.mapquest.com/user/me/apps
- Free tier: 50,000 transactions then pay-per-use

### Need more transactions?
- Upgrade to **Basic Plan**: $119/mo for 30,000 monthly transactions
- Or stay on **MapQuest GO** and pay only $0.0045 per transaction after 50k

---

**Ready to switch to MapQuest?** Get your API key and I'll update the code! 🚀
