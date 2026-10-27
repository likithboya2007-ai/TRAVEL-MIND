# 🐛 AI Copilot Not Working - Troubleshooting

## Problem
AI Copilot shows "Failed to get AI response" error.

---

## Quick Diagnostic Steps

### Step 1: Check Server Console
Look at the terminal where you ran `npm run dev:all`

**Look for these errors:**
- `Groq API Error:`
- `401 Unauthorized`
- `Invalid API key`
- `Network error`

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try using AI Copilot again
4. Look for errors (red text)

---

## Common Causes & Fixes

### Cause 1: Server Not Running
**Symptom:** "Failed to fetch" or "Network error"

**Fix:**
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Wait 3 seconds
Start-Sleep -Seconds 3

# Restart
npm run dev:all
```

**Verify server started:**
```
✅ API server running on http://localhost:3001
🤖 AI Copilot: Groq (llama-3.3-70b-versatile)
```

---

### Cause 2: Invalid Groq API Key
**Symptom:** "401 Unauthorized" or "Invalid API key"

The key you have might be expired or incorrect.

**Fix: Get New Groq API Key**

#### 1. Go to Groq Console
https://console.groq.com/

#### 2. Sign In or Sign Up
- If you have account: Sign in
- If new: Create free account

#### 3. Get API Key
- Go to **"API Keys"** section
- Click **"Create API Key"**
- Give it a name: "TravelMind AI"
- Click **"Create"**
- **Copy the key** (starts with `gsk_`)

#### 4. Update .env.local
Open `.env.local` and replace the Groq key:
```env
GROQ_API_KEY=gsk_YOUR_NEW_KEY_HERE
```

#### 5. Restart Server
```powershell
taskkill /F /IM node.exe
npm run dev:all
```

---

### Cause 3: Rate Limit Exceeded
**Symptom:** "Too many requests" or "Rate limit"

**Groq Free Tier Limits:**
- 30 requests per minute
- 14,400 requests per day

**Fix:**
- Wait 1 minute
- Try again
- If you hit daily limit, wait until tomorrow

**Check usage:**
https://console.groq.com/usage

---

### Cause 4: Groq Service Down
**Symptom:** "Service unavailable" or "502/503 errors"

**Check Groq Status:**
https://status.groq.com/

**Fix:**
- Wait a few minutes
- Try again
- If down for long time, temporarily switch to another AI service

---

## Test AI Manually

### Test 1: Check Server Endpoint
Open browser and go to:
```
http://localhost:3001
```

**Expected:** Should see something (not connection refused)

### Test 2: Test API with cURL
```powershell
curl -X POST http://localhost:3001/api/chat `
  -H "Content-Type: application/json" `
  -d '{"message":"Hello","tripContext":{"destination":"Goa","days":5,"budget":30000,"mood":"Adventure"}}'
```

**Expected:** Should get AI response (not error)

---

## Alternative: Use OpenAI Instead

If Groq doesn't work, you can switch to OpenAI:

### 1. Get OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create new key

### 2. Install OpenAI SDK
```powershell
npm install openai
```

### 3. Update server.js
I can help you modify the code if needed.

---

## Detailed Error Messages

### Error: "Failed to get AI response. Please try again."
**Likely causes:**
1. Server not running
2. Invalid API key
3. Network issue

**Check:**
- Is server running? (look for "API server running" message)
- Is API key correct in `.env.local`?
- Check server console for detailed error

### Error: "AI service temporarily unavailable"
**Likely cause:** API key not found in `.env.local`

**Check:**
```env
GROQ_API_KEY=gsk_...
```

Make sure:
- No spaces
- Starts with `gsk_`
- No quotes around the key
- File is saved

---

## Step-by-Step Restart Process

### 1. Stop Everything
```powershell
taskkill /F /IM node.exe
```

### 2. Verify .env.local
Open file and check:
```env
GROQ_API_KEY=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
```

### 3. Start Fresh
```powershell
npm run dev:all
```

### 4. Wait for Server
Look for:
```
✅ API server running on http://localhost:3001
🤖 AI Copilot: Groq (llama-3.3-70b-versatile)
```

### 5. Test AI
- Generate a trip
- Click AI Copilot icon
- Type a question
- Press Enter

---

## If Still Not Working

### Get Server Logs
1. Look at terminal output
2. Copy any error messages
3. Share them with me

### Check These Files
```
.env.local - Has GROQ_API_KEY?
server.js - Line ~70-140 (chat endpoint)
```

### Try Simplest Test
1. Make sure server is running
2. Open browser console (F12)
3. Run this in console:
```javascript
fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: 'Hello',
    tripContext: {destination: 'Test', days: 3, budget: 10000, mood: 'Adventure'}
  })
}).then(r => r.json()).then(console.log)
```

**Should get AI response!**

---

## Quick Verification Checklist

- [ ] Server is running (`npm run dev:all`)
- [ ] See "API server running on http://localhost:3001"
- [ ] `.env.local` has GROQ_API_KEY
- [ ] Key starts with `gsk_`
- [ ] No extra spaces in .env.local
- [ ] Browser can reach http://localhost:3001
- [ ] No firewall blocking localhost
- [ ] No antivirus blocking Node.js

---

## 🆘 Emergency Fix: Use Free Public AI

If you can't get Groq working, I can modify the code to use a free public AI API temporarily.

Just let me know and I'll implement a backup solution!

---

**Most Common Fix:** Get a new Groq API key from https://console.groq.com/ 🔑
