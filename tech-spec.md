1. System Overview

Product goal:
Help users see what matters in their inbox at a glance by:

Highlighting important emails

Surfacing follow-ups

Grouping noise

Providing a daily digest

Showing everything in a Gmail right-side sidebar (Chrome extension)

Key constraints:

Read-only Gmail access (no sending, no modifying content for MVP)

Desktop Gmail only for v1 (mobile via digest email, later via app)

Privacy-safe: store minimal data (metadata + derived insights, not full raw content where avoidable)

2. High-Level Architecture
flowchart TD

subgraph FE[Frontends]
  CExt[Chrome Extension<br>Gmail Sidebar]
  DigestEmail[Daily Digest Email]
end

subgraph BE[Backend - Email Insight API]
  API[REST API Layer]
  Auth[Auth & OAuth Service]
  Processor[Email Processing Worker]
  Classifier[Classifier & Follow-up Engine]
  DigestBuilder[Digest Builder]
end

subgraph Data[Storage]
  DB[(Primary DB)]
  Cache[(Redis/Cache)]
end

subgraph Ext[External Services]
  GmailAPI[Gmail REST API]
  OAuthGoogle[Google OAuth 2.0]
  EmailSender[Transactional Email Service]
end

CExt --> API
DigestEmail --> API

API --> Auth
API --> DB
API --> Cache

Processor --> GmailAPI
Processor --> Classifier
Processor --> DB
Processor --> Cache

DigestBuilder --> DB
DigestBuilder --> EmailSender

Auth --> OAuthGoogle

3. Main Components
3.1 Chrome Extension (Gmail Sidebar)

Type: Manifest V3 Chrome extension

Role: Injects a React-based sidebar into Gmail’s UI, calls backend APIs, displays insights.

Key pieces:

service_worker (background)

content_script (runs on https://mail.google.com/*)

sidebar React app mounted in injected <div id="inbox-clarity-sidebar">

options page for basic settings (optional MVP)

3.2 Backend – Email Insight API

Tech suggestion: Node.js (Express/Fastify) or Python (FastAPI)

Responsibilities:

Handle auth & token exchange (Google OAuth)

Expose REST endpoints for:

Summaries

Important emails

Follow-ups

Noise groups

Daily digest

User preferences

Queue and run processing jobs (could be simple cron in MVP)

Talk to Gmail API to fetch and refresh email metadata/content

Run classification + follow-up logic

Persist derived data

3.3 Email Processing Worker

Can be a background process or scheduled cron within same codebase.

Responsibilities:

Fetch recent emails for each user (e.g., last 3–7 days or “since last processed”).

Normalize and store message metadata.

Run Classifier and Follow-up Engine.

Store EmailInsight records.

Precompute daily digest segments.

3.4 Classifier & Follow-Up Engine

Input: Email headers + snippet + (optionally) short body.
Output:

importance_score (0–1)

category ∈ { "IMPORTANT", "FOLLOW_UP", "NOISE", "FYI" }

requires_reply (boolean)

waiting_for_reply (boolean)

optional: reasons (for explainability/logging)

Uses rule-based logic first, then optional AI LLM for nuance.

3.5 Digest Builder

Runs once per day (per user) at user’s preferred time.

Builds a DailyDigest entry:

Top N important emails

Follow-up list

Missed important from yesterday

Noise summary

Sends digest via email through EmailSender (SendGrid, Postmark, SES).

4. Data Model (Core Entities)

Language: pseudo-TypeScript.

4.1 User
type User = {
  id: string;                // internal UUID
  googleUserId: string;      // sub from Google
  email: string;
  createdAt: string;
  updatedAt: string;
  onboardedAt?: string;
};

4.2 AccountConnection (Google OAuth tokens)
type GoogleAccountConnection = {
  id: string;
  userId: string;
  provider: "google";
  accessToken: string;       // encrypted at rest
  refreshToken: string;      // encrypted
  scope: string;             // e.g. "https://www.googleapis.com/auth/gmail.readonly"
  tokenType: string;
  expiryDate: string;        // ISO datetime
  createdAt: string;
  updatedAt: string;
};

4.3 EmailThread

We treat Gmail threads as unit-of-work.

type EmailThread = {
  id: string;                // internal UUID
  userId: string;
  gmailThreadId: string;
  lastMessageId: string;     // latest Gmail message ID
  subject: string;
  participants: string[];    // email addresses
  lastTimestamp: string;
  lastSnippet: string;
  lastFrom: string;
  lastTo: string[];
  lastCc: string[];
  lastLabels: string[];      // e.g. GMAIL labels
  createdAt: string;
  updatedAt: string;
};

4.4 EmailInsight
type EmailInsight = {
  id: string;
  userId: string;
  threadId: string;
  gmailThreadId: string;

  category: "IMPORTANT" | "FOLLOW_UP" | "NOISE" | "FYI";
  importanceScore: number;      // 0.0–1.0
  requiresReply: boolean;
  waitingForReply: boolean;
  hasDeadline: boolean;
  deadlineAt?: string;

  lastEvaluatedAt: string;
};

4.5 DailyDigest
type DailyDigest = {
  id: string;
  userId: string;
  date: string;      // 'YYYY-MM-DD' in user’s timezone
  generatedAt: string;

  importantThreadIds: string[];
  followUpThreadIds: string[];
  missedImportantThreadIds: string[];
  noiseCount: number;

  emailSent: boolean;
  emailSentAt?: string;
};

4.6 UserPreferences
type UserPreferences = {
  id: string;
  userId: string;
  timezone: string;          // e.g. "America/Halifax"
  digestTimeLocal: string;   // "08:30"
  followUpThresholdDays: number; // e.g. 2
  noiseLabels: string[];     // extra labels considered noise
  autoCollapseSidebar: boolean;
  createdAt: string;
  updatedAt: string;
};

5. Functional Requirements
5.1 Authentication / Onboarding

User clicks “Sign in with Google” in sidebar.

Chrome extension opens OAuth flow via backend.

Backend:

Exchanges code for tokens.

Stores tokens in GoogleAccountConnection.

Creates User and UserPreferences if new.

Extension then calls /summary/today etc. with session token (JWT).

5.2 Email Fetching

For each user with a valid token, the worker:

Fetch Strategy:

Use Gmail API: users.messages.list with:

q parameter like newer_than:3d OR q="after:<last_processed_timestamp>"

labelIds: ["INBOX"] primarily

For each message:

users.messages.get with format=metadata or format=full (MVP can start with metadata + snippet)

Extract:

From, To, Cc

Subject

internalDate

snippet

labelIds

Group messages by threadId and create/update EmailThread records.

5.3 Classification Logic (MVP)

Pseudo-logic:

function classify(thread: EmailThread, user: User): EmailInsight {

  const isDirectToUser = thread.lastTo.includes(user.email);
  const isCcOnly = !isDirectToUser && thread.lastCc.includes(user.email);
  const isNewsletter = detectNewsletter(thread);
  const isPromotion = detectPromotion(thread);
  const isSystemNotification = detectNotification(thread);
  const isFromImportantSender = isWhitelistedSender(thread.lastFrom, user);

  // Basic category
  let category: EmailInsight["category"] = "FYI";
  let importanceScore = 0.3;
  let requiresReply = false;
  let waitingForReply = false;

  // Noise
  if (isNewsletter || isPromotion || isSystemNotification || isCcOnly) {
    category = "NOISE";
    importanceScore = 0.1;
  }

  // Important by sender or direct address
  if (isDirectToUser || isFromImportantSender) {
    category = "IMPORTANT";
    importanceScore = 0.7;
  }

  // Follow-up detection
  const isWaiting = detectWaitingForReply(thread, user);
  if (isWaiting) {
    category = "FOLLOW_UP";
    importanceScore = 0.9;
    waitingForReply = true;
  }

  // Optional AI refinement
  const aiSignals = callLLMForSignals(thread);
  // e.g. adjust importanceScore +/- 0.1–0.2, flip category if strong evidence of urgency

  return {
    id: uuid(),
    userId: user.id,
    threadId: thread.id,
    gmailThreadId: thread.gmailThreadId,
    category,
    importanceScore,
    requiresReply,
    waitingForReply,
    hasDeadline: aiSignals.hasDeadline,
    deadlineAt: aiSignals.deadlineAt,
    lastEvaluatedAt: new Date().toISOString()
  };
}


Helper detection:

detectNewsletter: from headers like List-Unsubscribe, sender patterns (no-reply, mailer, etc.).

detectPromotion: labels from Gmail (CATEGORY_PROMOTIONS) or specific words in sender.

detectNotification: look for “notification”, “alert”, “no-reply”, “do-not-reply”.

Follow-Up detection (MVP rules):

You were last sender in the thread and:

No reply after followUpThresholdDays.

OR thread includes phrases:

“just checking in”, “following up”, “please confirm”, etc. (can use simple regex or LLM classification).

6. REST API Specification (MVP)

Base URL: https://api.yourapp.com

6.1 Authentication

POST /auth/google/callback

Used by OAuth redirect.

Input (query or body): code, state.

Behavior:

Exchange code with Google OAuth.

Create/lookup user.

Return JWT access token for extension.

Response:

{
  "token": "<jwt_token>",
  "user": {
    "id": "user-123",
    "email": "alice@example.com"
  }
}

6.2 Get Today’s Summary

GET /summary/today

Headers: Authorization: Bearer <jwt>

Query: optional date=YYYY-MM-DD (default: today in user timezone)

Response:

{
  "date": "2025-11-26",
  "importantCount": 5,
  "followUpCount": 3,
  "noiseCount": 42,
  "missedImportantCount": 1
}

6.3 Get Important Emails

GET /emails/important

Headers: Authorization: Bearer <jwt>

Query: limit, offset (pagination)

Response:

{
  "items": [
    {
      "threadId": "thr_1",
      "gmailThreadId": "178d4e...",
      "subject": "Project kickoff tomorrow",
      "from": "boss@example.com",
      "snippet": "Just a reminder that...",
      "lastTimestamp": "2025-11-26T12:03:00Z",
      "importanceScore": 0.91,
      "hasDeadline": true,
      "deadlineAt": "2025-11-27T14:00:00Z"
    }
  ],
  "nextOffset": 10
}

6.4 Get Follow-Up Emails

GET /emails/followups

Response:

{
  "items": [
    {
      "threadId": "thr_2",
      "gmailThreadId": "178d4f...",
      "subject": "Proposal review",
      "from": "client@example.com",
      "snippet": "Can you send the updated...",
      "lastTimestamp": "2025-11-24T15:45:00Z",
      "waitingForReply": true,
      "daysSinceLastMessage": 3
    }
  ]
}

6.5 Get Noise Summary

GET /emails/noise

Response (MVP):

{
  "count": 42,
  "topSources": [
    { "sender": "newsletter@xyz.com", "count": 10 },
    { "sender": "promo@shop.com", "count": 7 }
  ]
}

6.6 Get Today’s Digest Detail

GET /digest/today

Response:

{
  "date": "2025-11-26",
  "generatedAt": "2025-11-26T12:00:00Z",
  "importantThreads": [ /* same shape as /emails/important items */ ],
  "followUpThreads": [ /* same shape as /emails/followups items */ ],
  "missedImportantThreads": [ /* important threads from yesterday not seen */ ],
  "noiseCount": 42
}

6.7 User Preferences

GET /user/preferences

{
  "timezone": "America/Halifax",
  "digestTimeLocal": "08:30",
  "followUpThresholdDays": 2,
  "autoCollapseSidebar": false,
  "noiseLabels": []
}


PUT /user/preferences

Accepts partial or full update.

7. Chrome Extension Structure (Technical Spec)

Manifest v3 (simplified):

{
  "manifest_version": 3,
  "name": "Inbox Clarity",
  "version": "0.1.0",
  "permissions": ["scripting", "storage", "identity"],
  "host_permissions": [
    "https://mail.google.com/*",
    "https://api.yourapp.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://mail.google.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_title": "Inbox Clarity"
  }
}


Content script behaviour:

Wait until Gmail main UI is loaded (observe DOM for key element, e.g. [role="main"]).

Inject a container:

const sidebar = document.createElement('div');
sidebar.id = 'inbox-clarity-sidebar';
document.body.appendChild(sidebar);


Apply CSS to position sidebar on right, with fixed width and position: fixed or anchored inside Gmail layout.

Bootstrap React app into that div.

React app responsibilities:

On load:

Check if user is authenticated (token in chrome.storage).

If not authenticated: show “Connect Gmail (Sign in with Google)” button.

If authenticated: call /summary/today, /emails/important, /emails/followups, /emails/noise.

Render:

Top summary bar

Tabbed or stacked sections: Important / Follow-ups / Noise

Collapse/expand handle

8. Non-Functional Requirements

Performance:

Sidebar should load visible skeleton UI within < 300ms after content script runs.

API responses for summary endpoints should be < 500ms on average (served mostly from cache).

Scalability:

MVP: support up to ~1–5K active users with minimal infra (single DB + single app instance).

Reliability:

If backend unavailable, show a safe fallback message in sidebar (“We’re having trouble loading insights. Your emails are still safe in Gmail.”).

Privacy & Security:

Google OAuth scopes constrained to read-only Gmail.

Tokens encrypted at rest.

Avoid storing full email bodies unless absolutely necessary; prefer metadata + snippets.

Observability:

Basic logging of:

classification run duration

Gmail API errors

digest generation errors

9. Clear Invariants AI/Dev Can Rely On

Categories are exclusive: a thread can only be in ONE of IMPORTANT / FOLLOW_UP / NOISE / FYI at any given evaluation timestamp.

Follow-up implies priority: category === "FOLLOW_UP" implies importanceScore >= 0.8.

Digest is read-only representation of existing EmailInsight + EmailThread state; it does not execute new classification.

No write-side effects to Gmail in MVP:

No labels added

No emails archived/sent/modified from the system

All actions are view-only.

All date/times are stored in UTC in DB, with UserPreferences.timezone used only for display/digest scheduling.