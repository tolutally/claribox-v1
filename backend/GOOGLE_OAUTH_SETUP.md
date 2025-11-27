
# 🔐 Google OAuth Setup Guide

To enable "Sign in with Google" and Gmail access, you need to create credentials in the Google Cloud Console.

## 1. Create a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Claribox Dev").

## 2. Enable Gmail API
1. Go to **APIs & Services** > **Library**.
2. Search for "Gmail API".
3. Click **Enable**.

## 3. Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (or Internal if you have a Workspace).
3. Fill in App Name ("Claribox"), User Support Email, and Developer Contact Email.
4. **Scopes**: Add the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/gmail.readonly`
5. **Test Users**: Add your own email address so you can log in during development.

## 4. Create Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Application type: **Web application**.
4. Name: "Claribox Backend".
5. **Authorized redirect URIs**:
   - Add: `http://localhost:3000/auth/google/callback`
6. Click **Create**.

## 5. Update Environment Variables
Copy the **Client ID** and **Client Secret** and update your `backend/.env` file:

```bash
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
```

## 6. Test It!
1. Restart your backend: `npm run dev`
2. Visit: `http://localhost:3000/auth/google`
3. You should be redirected to Google, login, and then see "Authentication successful".
