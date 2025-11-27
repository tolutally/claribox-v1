# 🎯 Quick Start: Test Claribox Side Panel

## ✅ Extension is Ready!

Your extension files are prepared at:
```
/Users/tobitowoju/claribox-v1/extension/dist
```

---

## 📋 Step-by-Step Testing

### Step 1: Load Extension in Chrome (2 minutes)

1. **Open Chrome** and go to:
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode**
   - Look for toggle in **top-right corner**
   - Click to enable

3. **Load the Extension**
   - Click **"Load unpacked"** button (top-left)
   - Navigate to: `/Users/tobitowoju/claribox-v1/extension/dist`
   - Click **"Select"**

4. **Verify**
   - You should see **"Claribox"** card
   - Extension should be **enabled** (toggle on)

---

### Step 2: Test the Side Panel (1 minute)

1. **Go to Gmail**: https://mail.google.com
   - Make sure you're logged in

2. **Open the Side Panel**
   - Click the **Claribox icon** in the Chrome toolbar (top-right)
   - OR Click the **Side Panel icon** in Chrome (square with sidebar on the right) and select "Claribox" from the dropdown.

3. **You should see:**
   - A native Chrome side panel opening on the right.
   - The Claribox UI ("Welcome" or "Sign in") inside it.
   - It should NOT cover your emails (Chrome resizes the page automatically).

✅ **Expected Result**: Native Side Panel works on Gmail.

---

### Step 3: Test Backend Connection (1 minute)

1. **Keep Gmail open with DevTools**

2. **In Console tab, paste this:**
   ```javascript
   fetch('http://localhost:3000/health')
     .then(r => r.json())
     .then(data => console.log('✅ Backend:', data))
     .catch(err => console.error('❌ Backend error:', err))
   ```

3. **You should see:**
   ```json
   ✅ Backend: {
     "status": "healthy",
     ...
   }
   ```

✅ **Expected Result**: Backend responds successfully

---

### Step 4: Test OAuth Flow (2 minutes)

1. **In the Side Panel**, click **"Sign in with Google"**
2. **You should:**
   - See Google login page
   - Login with your Google account
   - Grant permissions
   - Get redirected
   - See success message

✅ **Expected Result**: OAuth completes

---

## 🐛 Troubleshooting

### Side Panel Not Opening
- Make sure you are on `https://mail.google.com` (we restricted it to Gmail).
- Try clicking the extension icon again.
- Check `chrome://extensions` for errors.

### "Extension invalidated"
- If you see this, just go to `chrome://extensions` and click the refresh icon.

---

## 📸 What It Should Look Like

**Gmail with Native Side Panel:**
```
┌────────────────────────────┬──────────┐
│                            │          │
│   Gmail Inbox              │ Claribox │
│   (your emails)            │ Side     │
│                            │ Panel    │
│   (Resized automatically)  │ (Native) │
│                            │          │
└────────────────────────────┴──────────┘
```
