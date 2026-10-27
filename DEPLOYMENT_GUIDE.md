# 🚀 TravelMind AI - Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Prepare Your Repository
✅ **Already Done!** Your code is pushed to GitHub.

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com/)**
   - Sign up with your GitHub account

2. **Import Your Project**
   - Click "Add New Project"
   - Select your `TRAVEL-MIND` repository
   - Click "Import"

3. **Configure Environment Variables**
   Add these in Vercel's environment settings:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_PLACES_API_KEY=your_google_places_key
   MAPQUEST_API_KEY=your_mapquest_key
   ```

   **Where to find these values:**
   - Check your `.env.local` file for current values
   - Supabase: Project Settings → API
   - Groq: https://console.groq.com/keys
   - Google Places: https://console.cloud.google.com/apis/credentials
   - MapQuest: https://developer.mapquest.com/user/me/apps

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-app.vercel.app`

### Step 3: Configure Supabase for Production

1. **Add Vercel URL to Supabase**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL: `https://your-app.vercel.app`
   - Add to redirect URLs: `https://your-app.vercel.app/auth/callback`

2. **Test Authentication**
   - Try signing up on your live site
   - Verify email confirmation works

---

## Alternative: Deploy to Netlify

### Quick Deploy to Netlify

1. **Go to [Netlify](https://www.netlify.com/)**
   - Sign up with GitHub

2. **Import Repository**
   - Click "Add new site" → "Import an existing project"
   - Select your `TRAVEL-MIND` repository

3. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

4. **Add Environment Variables**
   Same as Vercel (Step 2, #3 above)

5. **Deploy**
   - Click "Deploy site"
   - Update Supabase URLs with Netlify domain

---

## Post-Deployment Checklist

### ✅ Verify These Work:
- [ ] Homepage loads correctly
- [ ] User can sign up/sign in
- [ ] AI chat responds to messages
- [ ] Itinerary generation works
- [ ] Maps display correctly
- [ ] All 7 features work:
  1. Multi-city itineraries
  2. Group trip planning
  3. Budget optimization
  4. Real-time collaboration
  5. Offline access
  6. Custom POI recommendations
  7. Activity booking

### 🔒 Security Check:
- [ ] Environment variables are set (not using .env.local)
- [ ] API keys are secure (not exposed in client)
- [ ] CORS is configured correctly
- [ ] Rate limiting is active

### 📊 Monitoring (Optional):
- Set up Vercel Analytics
- Add error tracking (Sentry)
- Monitor API usage (Groq, Google, MapQuest)

---

## Continuous Deployment

### Automatic Deployments (Already Active!)

Every time you push to GitHub:
1. Vercel/Netlify automatically detects changes
2. Runs build and tests
3. Deploys new version
4. No manual intervention needed!

**Branches:**
- `main` → Production deployment
- Other branches → Preview deployments

---

## Troubleshooting

### Build Fails on Vercel/Netlify

**Issue:** TypeScript errors
```bash
# Fix locally first:
npm run build
npm run test
```

**Issue:** Missing environment variables
- Double-check all 5 env vars are set in Vercel/Netlify dashboard

### Authentication Not Working

**Issue:** Redirect loops or "Invalid redirect URL"
- Add your production URL to Supabase → Authentication → URL Configuration
- Format: `https://your-app.vercel.app/auth/callback`

### API Errors in Production

**Issue:** Groq API returns 401
- Verify `GROQ_API_KEY` is set correctly in Vercel env vars
- Check API key is valid at https://console.groq.com/keys

**Issue:** Google Maps not loading
- Check `GOOGLE_PLACES_API_KEY` is set
- Verify API key has Places API enabled
- Add production domain to allowed referrers

---

## Cost Estimation

### Free Tier Limits:
- **Vercel:** 100GB bandwidth/month (plenty for starting)
- **Supabase:** 500MB database, 2GB bandwidth
- **Groq:** Free tier available (check current limits)
- **Google Places:** $200 free credits/month
- **MapQuest:** 15,000 requests/month free

**Expected costs for low-traffic app:** $0-$10/month

---

## Custom Domain (Optional)

### Add Your Own Domain

1. **Buy a domain** (Namecheap, Google Domains, etc.)

2. **In Vercel/Netlify:**
   - Go to Domains
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Update Supabase:**
   - Add custom domain to redirect URLs

4. **SSL Certificate:**
   - Automatically handled by Vercel/Netlify

---

## Next Steps After Deployment

1. **Share your app!**
   - Share the live URL with users
   - Post on social media

2. **Monitor usage:**
   - Check Vercel analytics
   - Monitor API quotas

3. **Iterate:**
   - Gather user feedback
   - Add new features
   - Optimize performance

---

## Need Help?

**Resources:**
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs

**Common Issues:**
- Check the "Troubleshooting" section above
- Review build logs in Vercel/Netlify dashboard
- Verify all environment variables are set

---

## Summary

**You're ready to deploy!** 

1. Push code to GitHub ✅ (Done!)
2. Import to Vercel ⏭️ (Next step)
3. Add environment variables ⏭️
4. Deploy and test ⏭️

Your app will be live in **under 5 minutes**! 🚀
