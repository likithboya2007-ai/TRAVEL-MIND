# 🔧 Fix Email Verification Redirect

## Alternative Solution: Configure Site URL

If you want to **keep email verification** but fix the redirect issue, configure Supabase to use the correct URL.

---

## Steps to Fix Redirect

### 1. Go to Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2. Select Your Project
- Click on your travelmind-ai project

### 3. Go to Authentication Settings
- Left sidebar: **"Authentication"** → **"URL Configuration"**
- Or: Authentication → Settings → URL Configuration section

### 4. Set Site URL
Find **"Site URL"** field and enter:
```
http://localhost:5173
```

### 5. Set Redirect URLs
Find **"Redirect URLs"** and add:
```
http://localhost:5173/**
http://localhost:5173
```

**Important:** Include the `**` wildcard to allow all paths!

### 6. Save Changes
- Click **"Save"** button at the bottom

---

## How It Works Now

### Before Fix
```
User clicks verification link
   ↓
Tries to redirect to localhost
   ↓
❌ Fails (localhost not accessible from email)
```

### After Fix
```
User clicks verification link
   ↓
Redirects to http://localhost:5173
   ↓
✅ Works if server is running!
```

---

## Important Notes

### Server Must Be Running
When user clicks verification link:
- Your dev server **must be running** at `http://localhost:5173`
- If server is off, link will still fail

### Run Server Before Verification
```powershell
npm run dev:all
```

Then click the verification link in email.

### For Production
When you deploy to production (e.g., Vercel, Netlify):
1. Change Site URL to: `https://yourdomain.com`
2. Change Redirect URLs to: `https://yourdomain.com/**`

---

## Test After Configuration

### 1. Make Sure Server Is Running
```powershell
npm run dev:all
```

Keep it running!

### 2. Sign Up With New Email
```
Email: test3@example.com
Password: Test123!
```

### 3. Check Email
- Open verification email
- Make sure server is still running
- Click verification link

### 4. Should Work!
- ✅ Redirects to http://localhost:5173
- ✅ Shows success message or login page

---

## Still Doesn't Work?

### Option 1: Disable Email Verification
**Recommended for development!**

See `DISABLE_EMAIL_VERIFICATION.md` - Much simpler for testing.

### Option 2: Manual Verification
As admin, you can manually verify emails:

1. Go to Supabase Dashboard
2. Authentication → Users
3. Find the user
4. Click the user row
5. Find "Email Confirmed" field
6. Toggle it to **TRUE**
7. Save

Now user can sign in!

---

## 🎯 Recommended Approach

### For Development/Testing
**Disable email verification** - Fastest and easiest

### For Production
**Enable email verification** + Set correct Site URL to your domain

---

## ✅ Summary

**Problem:** Email verification link points to localhost  
**Quick Fix:** Disable email verification (see other doc)  
**Proper Fix:** Configure Site URL + keep server running  
**Best for Dev:** Just disable email verification  
**Best for Prod:** Configure with real domain  

Choose the solution that works best for you! 🚀
