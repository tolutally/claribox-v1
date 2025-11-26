📬 Claribox— MVP
A Gmail sidebar extension that shows only what matters in your inbox.

Inbox Clarity is a Chrome extension + backend service that helps users reduce email overwhelm by:

Highlighting important emails

Surfacing follow-ups

Grouping noise

Providing a daily digest

Displaying everything inside a right-side Gmail sidebar

The goal is to give users peace of mind and instant clarity without changing how they use Gmail.

🚀 Features (MVP)
✔️ Gmail Sidebar (Chrome Extension)

A persistent, collapsible sidebar injected into Gmail showing:

Today's Summary

Important emails count

Follow-ups count

Noise filtered

Important Emails List

Follow-Ups List

Noise Summary

1-click “Refresh Insights”

✔️ Daily Email Digest

A morning email summarizing:

5 important emails

Follow-ups

Missed important items

Noise count

✔️ Email Classification Engine

Hybrid rule-based + AI system categorizing threads into:

IMPORTANT

FOLLOW_UP

NOISE

FYI

✔️ Follow-Up Detection

Detects:

Emails you sent that haven’t been replied to

Threads requiring responses

Requests directed to you

Deadlines or commitments

✔️ Noise Grouping

Groups:

newsletters

promotions

notifications

CC-only emails

✔️ Read-Only Gmail OAuth

Secure Google login with read-only scopes for trust and safety.

🧱 Architecture
Chrome Extension → Email Insight API → Gmail API

                       ┌──────────────┐
CExtension ───────────▶│ REST API     │
                       │ (Backend)    │◀──────── Gmail API
                       └─────┬────────┘
                             │
                     ┌───────┴────────┐
                     │ Processing      │
                     │ (Classifier,    │
                     │ Follow-ups,     │
                     │ Digest builder) │
                     └───────┬────────┘
                             │
                     ┌───────┴────────┐
                     │ Database (DB)   │
                     └─────────────────┘

🧩 Components
1. Chrome Extension

Manifest V3

Injects sidebar panel into Gmail

React frontend

Calls backend REST APIs

Stores session token in chrome.storage

2. Backend / Email Insight API

Node.js (Express or Fastify) OR Python FastAPI

OAuth handling

Gmail fetching

Classification engine

Digest generator

REST endpoints

3. Processing Worker

Fetches latest emails

Runs classifier + follow-up engine

Populates database with insights

Runs digest builder daily

4. Database

Tables/collections:

User

GoogleAccountConnection

EmailThread

EmailInsight

DailyDigest

UserPreferences

📡 API Endpoints (MVP)
GET /summary/today

Returns counts for important, follow-ups, noise.

GET /emails/important

List of important threads.

GET /emails/followups

List of threads waiting for reply.

GET /emails/noise

Grouped noise info.

GET /digest/today

Full digest output.

GET /user/preferences

User preferences.

PUT /user/preferences

Update preferences.

POST /auth/google/callback

Handles OAuth token exchange.

🧠 Classification Logic (Simplified)

Rules-based
Detect:

direct-to-you emails

CC-only

newsletters/promotions

system notifications

important senders

Follow-up detection
Based on:

last message sent by user

no reply within threshold

request/action words

LLM signals

AI refinement (optional)
LLM detects urgency, deadlines, tone, action requests.

Produces:

category

importance score

follow-up flags

🛠 Tech Stack
Frontend

Chrome Extension (Manifest V3)

React + Tailwind

Content script + injected DOM panel

Backend

Node.js or Python FastAPI

PostgreSQL or MongoDB

Redis (optional, caching)

External

Gmail API (read-only)

Google OAuth 2.0

Email sender (SendGrid/SES/Postmark)

🔐 Security

Read-only Gmail scope

OAuth tokens encrypted in DB

No sending or modifying user emails

Data minimization: store metadata & derived insights only

GDPR-friendly design

🧪 Local Development Setup
1. Clone repo
git clone https://github.com/your-org/inbox-clarity.git
cd inbox-clarity

2. Install dependencies
npm install
# or
pip install -r requirements.txt

3. Set environment variables

Create .env:

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
DATABASE_URL=
SENDGRID_KEY=

4. Start backend API
npm run dev
# or
uvicorn app.main:app --reload

5. Load Chrome Extension

Go to chrome://extensions

Enable Developer Mode

Click “Load unpacked”

Select extension/ folder

🗂 Directory Structure (Example)
/backend
  /src
    api/
    services/
    workers/
    models/
    utils/
  README.md

/extension
  manifest.json
  content.js
  background.js
  src/
    components/
    pages/
    hooks/
    sidebar.jsx

/shared
  types/
  utils/

/docs
  architecture.md
  api-spec.md

🎯 Roadmap (Post-MVP)
v1.1

“Important sender” memory

Manual email labeling from sidebar

Focus mode (hide noise entirely)

v1.2

Push notifications

Chrome popup “Quick View”

v2.0

iOS/Android companion app

WhatsApp/iMessage morning summary

Menu bar app (Mac/Windows)

v3.0

Outlook add-in

Team/enterprise mode

AI reply suggestions (optional)

🧨 Key Product Principles

Read-only, non-destructive
Emails stay untouched unless user acts.

Clarity at a glance
No new behaviors. No reinventing email.

Speed > Complexity
Insights must be instant.

Trust is everything
Privacy-safe from day one.