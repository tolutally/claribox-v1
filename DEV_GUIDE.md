# 🚀 Claribox Development Guide

Quick reference for running the Claribox development environment.

## Quick Start

```bash
# Start everything at once
./dev.sh
```

This will:
- ✅ Check and install dependencies if needed
- ✅ Start the backend API server (port 3000)
- ✅ Start the extension build watcher
- ✅ Run both in parallel with live reload

## Individual Commands

### Backend Only
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

### Extension Only
```bash
npm run dev:extension
# or
cd extension && npm run dev
```

### Both (using concurrently)
```bash
npm run dev
```

## What's Running?

When you run `./dev.sh`, you'll have:

1. **Backend API** at `http://localhost:3000`
   - Health check: `http://localhost:3000/health`
   - API docs: `http://localhost:3000/docs`
   - OAuth: `http://localhost:3000/auth/google`

2. **Extension** building in watch mode
   - Output: `extension/dist/`
   - Load in Chrome: `chrome://extensions` → Load unpacked → select `extension/dist`

## Environment Setup

Make sure your `.env` files are configured:

### Backend (`backend/.env`)
```bash
# Supabase
SUPABASE_URL="https://ntnpcsqpmtemwzaktolg.supabase.co"
SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"

# OpenAI (optional for AI classification)
OPENAI_API_KEY="sk-..."

# Other settings
PORT=3000
NODE_ENV="development"
```

## Testing the Setup

1. **Test Backend**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test OAuth**:
   Visit `http://localhost:3000/auth/google` in your browser

3. **Test Classifier**:
   ```bash
   curl -X POST http://localhost:3000/api/classify \
     -H "Content-Type: application/json" \
     -d '{"subject":"Urgent: Review needed","sender":"boss@company.com","body":"Please review this ASAP"}'
   ```

4. **Load Extension**:
   - Open Chrome
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `claribox-v1/extension/dist`

## Stopping

Press `Ctrl+C` in the terminal where `./dev.sh` is running. This will stop both servers.

## Troubleshooting

### Port already in use
```bash
# Find what's using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Dependencies out of sync
```bash
npm run clean
npm run setup
```

### Extension not loading
```bash
cd extension
npm run build
# Then reload in chrome://extensions
```

## Next Steps

- Set up your OpenAI API key for AI classification
- Deploy migrations: `./scripts/supabase.sh deploy`
- Test the full OAuth flow
- Build the email processing worker
