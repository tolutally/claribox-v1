# 🧪 End-to-End Testing Guide for Claribox Extension

Complete guide to preview, test, and debug the Claribox Chrome extension.

---

## 📦 Step 1: Build the Extension

The extension should already be building since you ran `./dev.sh`. Verify:

```bash
# Check if dist folder exists and has files
ls -la extension/dist/

# You should see:
# - entrypoints/
# - popup.js
# - popup.css
# - manifest.json (should be there)
```

If the build is not running:
```bash
cd extension
npm run dev
```

---

## 🔧 Step 2: Load Extension in Chrome

### 2.1 Open Chrome Extensions Page
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)

### 2.2 Load Unpacked Extension
1. Click **"Load unpacked"** button
2. Navigate to: `/Users/tobitowoju/claribox-v1/extension/dist`
3. Click **"Select"**

### 2.3 Verify Installation
You should see:
- ✅ **Claribox** extension card
- ✅ Extension ID (something like `abcdefghijklmnop...`)
- ✅ No errors in the card

**Common Issue**: If you see "manifest.json not found":
```bash
# The manifest might not be in dist yet
# Check if it's being copied
ls extension/dist/manifest.json

# If missing, manually copy it
cp extension/manifest.json extension/dist/manifest.json
```

---

## 🧪 Step 3: Test the Extension

### Test 1: Popup (Basic Functionality)
1. Click the **Claribox icon** in Chrome toolbar
2. You should see:
   - "Claribox" heading
   - "Gmail sidebar extension for email clarity"
   - "Open Gmail" button
3. Click "Open Gmail" → Should open Gmail in a new tab

**Expected**: ✅ Popup opens and button works

---

### Test 2: Content Script (Gmail Sidebar)
1. Go to `https://mail.google.com`
2. Wait for Gmail to fully load
3. Open **Chrome DevTools** (F12 or Cmd+Option+I)
4. Go to **Console** tab
5. Look for:
   ```
   Claribox content script loaded
   Sidebar container created
   ```

6. Check the **right side** of Gmail
   - You should see a **white sidebar** (320px wide)
   - It should be fixed to the right edge
   - It should have a subtle shadow

**Expected**: ✅ Sidebar appears on the right side of Gmail

---

### Test 3: Backend Connection
1. Keep Gmail open with DevTools
2. In the Console, test the backend:
   ```javascript
   fetch('http://localhost:3000/health')
     .then(r => r.json())
     .then(console.log)
   ```

3. You should see:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-11-26T...",
     "services": {
       "supabase": "connected",
       "prisma": "disconnected"
     },
     "uptime": 123.456
   }
   ```

**Expected**: ✅ Backend responds successfully

---

### Test 4: OAuth Flow (End-to-End)
1. In Gmail, open DevTools Console
2. Run:
   ```javascript
   window.open('http://localhost:3000/auth/google', '_blank')
   ```

3. You should:
   - See Google login page
   - Login with your account
   - Get redirected back to backend
   - See: `{"message": "Authentication successful", "user": {...}}`

4. Check Supabase:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to **Table Editor** → **users**
   - You should see your email with tokens stored

**Expected**: ✅ OAuth completes and user is saved to database

---

### Test 5: Email Classifier
1. In DevTools Console:
   ```javascript
   fetch('http://localhost:3000/api/classify', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       subject: 'URGENT: Project Deadline Tomorrow',
       sender: 'boss@company.com',
       body: 'We need this done ASAP. Please prioritize.'
     })
   })
   .then(r => r.json())
   .then(console.log)
   ```

2. You should see:
   ```json
   {
     "category": "IMPORTANT",
     "priority": "HIGH",
     "summary": "Marked as urgent in subject.",
     "actionRequired": true,
     "confidence": 0.8
   }
   ```

**Expected**: ✅ Classifier correctly identifies urgent email

---

## 🐛 Debugging Tips

### Extension Not Loading
```bash
# Rebuild extension
cd extension
npm run build

# Check for errors
cat extension/dist/manifest.json
```

### Sidebar Not Appearing
1. Open DevTools on Gmail
2. Check Console for errors
3. Check Elements tab → Look for `#claribox-sidebar`
4. If missing, check if content script loaded:
   ```javascript
   console.log('Content script check')
   ```

### CORS Errors
If you see CORS errors when calling backend:
1. Check backend is running: `curl http://localhost:3000/health`
2. Verify CORS settings in `backend/src/index.ts`:
   ```typescript
   origin: [
     'chrome-extension://*',
     'http://localhost:*',
     'https://mail.google.com'
   ]
   ```

### Hot Reload Not Working
The extension builder runs in watch mode, but Chrome doesn't auto-reload:
1. Go to `chrome://extensions/`
2. Click the **refresh icon** on the Claribox card
3. Reload Gmail page

---

## 📸 Visual Checklist

When everything is working, you should see:

**Gmail Page:**
```
┌─────────────────────────────────────────┬────────────┐
│                                         │            │
│         Gmail Interface                 │  Claribox  │
│                                         │  Sidebar   │
│         (Inbox, emails, etc.)           │  (white)   │
│                                         │            │
│                                         │  320px     │
└─────────────────────────────────────────┴────────────┘
```

**Chrome Toolbar:**
- Claribox icon visible
- Clicking it opens popup

**DevTools Console:**
- "Claribox content script loaded"
- "Sidebar container created"
- No red errors

---

## 🚀 Next Steps After Testing

Once basic tests pass:

1. **Add OAuth to Extension**
   - Create a login button in the sidebar
   - Use `chrome.identity.launchWebAuthFlow()` for OAuth

2. **Fetch Real Emails**
   - After OAuth, use tokens to call Gmail API
   - Display emails in sidebar

3. **Integrate Classifier**
   - Send fetched emails to `/api/classify`
   - Show categorized results in sidebar

4. **Build UI Components**
   - Important emails list
   - Follow-ups section
   - Noise summary

---

## 🆘 Still Having Issues?

Run the diagnostic:
```bash
# Check all services
curl http://localhost:3000/health

# Check extension files
ls -R extension/dist/

# Check console logs
# Open DevTools on Gmail and look for errors
```

If you see any errors, share them and I'll help debug!
