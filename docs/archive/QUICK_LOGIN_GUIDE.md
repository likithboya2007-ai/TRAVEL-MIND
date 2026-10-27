# Quick Login Guide for TravelMind AI

## 🚀 First Time User

### Step 1: Sign Up
1. Open http://localhost:5173
2. Click **"Sign Up"** button
3. Enter your email (e.g., `test@example.com`)
4. Enter a password (minimum 6 characters)
5. Click **"Sign up"**

### Step 2: Handle Email Verification (if error occurs)

**If you see "localhost can't be reached" error:**

This happens because Supabase email verification is enabled. You have 2 options:

#### Option A: Disable Email Verification (Recommended for Development)
1. Go to https://supabase.com/dashboard
2. Select your project: `travelmind-ai`
3. Go to **Authentication** → **Providers** → **Email**
4. Toggle OFF: **"Confirm email"**
5. Click **Save**
6. Go back to http://localhost:5173 and try signing up again

#### Option B: Manually Verify in Supabase
1. Go to https://supabase.com/dashboard
2. Select your project: `travelmind-ai`
3. Go to **Authentication** → **Users**
4. Find your email
5. Click the 3 dots → **"Confirm email"**
6. Go back to http://localhost:5173 and sign in

---

## 🔐 Returning User

1. Open http://localhost:5173
2. Click **"Sign In"** button
3. Enter your email
4. Enter your password
5. Click **"Sign in"**
6. ✅ You should see the TravelMind AI dashboard!

---

## 🧪 Test Credentials (if you want to create a test account)

```
Email: test@travelmind.com
Password: test123456
```

---

## ✅ After Login

Once logged in, you can:
- ✈️ Create a new trip
- 🗺️ View destinations
- 🤖 Use AI Copilot to plan your trip
- 💾 Save trips to your account

---

## 🆘 Troubleshooting

### "Failed to get AI response"
✅ **FIXED!** Server now uses `openai/gpt-oss-120b` model

### "localhost can't be reached" (email verification)
📖 See `DISABLE_EMAIL_VERIFICATION.md`

### Can't login after signup
- Check if email verification is disabled in Supabase
- OR manually verify your email in Supabase dashboard
