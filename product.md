Product Specification

A Gmail sidebar extension that shows only what matters.

1. 📌 Product Overview
Inbox Clarity is a Chrome extension + backend service that helps users reduce email anxiety and information overload by:

Highlighting important emails

Surfacing follow-ups

Grouping and counting noise

Delivering a daily digest

Providing a persistent Gmail sidebar with at-a-glance clarity

The goal:
“Show me what matters in my inbox at a glance — without changing how I work.”

2. 🧭 Guiding Product Principles

Read-only: MVP never modifies, sends, or deletes user emails

Clarity over automation: No AI email-writing, only insights

Familiar UI: The sidebar feels like a native Gmail panel

Fast: User should see useful context in < 1 second

Privacy-first: Store minimal email metadata; avoid storing raw content

Trustworthiness: Simple, transparent, non-destructive

3. 🎯 MVP Feature Set (Final)
Core, must-have features:

Gmail right-side collapsible sidebar

Summary counts: Important • Follow-ups • Noise

Important Emails view

Follow-Ups view

Noise summary (grouped, non-destructive)

Daily Email Digest (5 important, follow-ups, noise)

Read-only Gmail OAuth

Backend classification engine (rule-based + AI enhancements)

API layer

Background worker to fetch & classify emails

Not in MVP:

AI reply drafting

Sending email

Auto-archiving

Outlook integration

Mobile app

Team/shared inbox features

Meeting notes/notetaker

4. 🏗️ Architecture
Chrome Extension (wxt.dev)
 → Sidebar UI (React + Tailwind)
 → Calls Email Insight API (REST)

Email Insight API (Node.js + Fastify)
 → Handles OAuth
 → Calls Gmail API
 → Stores data in PostgreSQL
 → Runs classification engine
 → Generates digest
 → Sends daily digest email via SendGrid

Background Worker (Cron)
 → Fetches new emails
 → Updates threads
 → Runs classification
 → Writes insights & daily digest

5. 🧩 Technical Stack (Final Decision)
Browser Extension

wxt.dev (extension framework + build system)

React (TypeScript)

Tailwind CSS

Radix UI Primitives (optional)

Backend

Node.js + Fastify (TypeScript)

PostgreSQL (Prisma ORM)

SendGrid or Postmark for digest emails

Redis (optional, for caching)

External Integration

Google OAuth 2.0

Gmail REST API (Read-only scope)

6. 🔐 OAuth / Permissions

Gmail Scope

https://www.googleapis.com/auth/gmail.readonly


App never:

Sends email

Edits or deletes emails

Creates labels or rules

7. 👤 Target User

Busy professionals drowning in email

Startup founders, executives, product managers, consultants

People overwhelmed by newsletters / notifications / CC’d emails

People suffering from inbox anxiety

User mindset:
“I don’t want another inbox. I want clarity in my existing inbox.”

8. 🧑‍💻 Core User Flows
8.1 Onboarding (First-time user)

User installs Chrome extension

Sidebar appears with “Connect Gmail”

User clicks → OAuth flow opens

Backend exchanges code for tokens

Sidebar shows “Analyzing your inbox…” skeleton

Within seconds → summary + lists load

8.2 Returning User

Open Gmail

Sidebar loads instantly with cached insights

Background refresh triggers silently

8.3 Token Expired

API returns 401

Sidebar shows “Reconnect Gmail” button

8.4 No Important Emails

Show empty state: “Nothing critical right now 🎉”

9. 📡 REST API Contract (Final)

Base URL: https://api.inboxclarity.app

9.1 Authentication
POST /auth/google/callback

Handles OAuth token exchange.

Response:

{
  "token": "<jwt>",
  "user": { "id": "123", "email": "jane@example.com" }
}

9.2 Today’s Summary
GET /summary/today

Response:

{
  "date": "2025-11-26",
  "importantCount": 5,
  "followUpCount": 3,
  "noiseCount": 42,
  "missedImportantCount": 1
}

9.3 Important Emails
GET /emails/important

Response:

{
  "items": [
    {
      "threadId": "thr_1",
      "subject": "Kickoff Meeting Tomorrow",
      "from": "boss@company.com",
      "snippet": "Reminder we need...",
      "lastTimestamp": "2025-11-26T12:03:00Z",
      "importanceScore": 0.91,
      "hasDeadline": true,
      "deadlineAt": "2025-11-27T14:00:00Z"
    }
  ]
}

9.4 Follow-Ups
GET /emails/followups
{
  "items": [
    {
      "threadId": "thr_2",
      "subject": "Proposal Review Needed",
      "from": "client@example.com",
      "daysSinceLastMessage": 3,
      "waitingForReply": true
    }
  ]
}

9.5 Noise Summary
GET /emails/noise
{
  "count": 42,
  "topSources": [
    { "sender": "newsletter@news.com", "count": 10 }
  ]
}

9.6 Today's Digest
GET /digest/today
9.7 User Preferences
GET /user/preferences
PUT /user/preferences
10. 📂 Data Model
10.1 User
id: string
email: string
timezone: string

10.2 GoogleAccountConnection
accessToken: string
refreshToken: string
expiryDate: string

10.3 EmailThread
gmailThreadId: string
subject: string
participants: string[]
lastTimestamp: string
lastFrom: string
lastSnippet: string
lastLabels: string[]

10.4 EmailInsight
category: "IMPORTANT" | "FOLLOW_UP" | "NOISE" | "FYI"
importanceScore: number
requiresReply: boolean
waitingForReply: boolean
hasDeadline: boolean
deadlineAt?: string

10.5 DailyDigest
importantThreadIds: string[]
followUpThreadIds: string[]
noiseCount: number

11. 🧠 Classification Logic (MVP)
Rule-based first:
Noise

List-Unsubscribe header

Sender contains: no-reply, newsletter, mailer

Gmail label: CATEGORY_PROMOTIONS, CATEGORY_SOCIAL

CC-only emails

Important

User in To:

Known important senders (learned over time)

Deadlines detected

Follow-up

User last sender + no reply for X days

Contains action verbs (“can you”, “please review”, “send me”)

AI refinement (optional)

LLM can:

Nudge importance score ±0.2

Identify deadlines

Identify requests or commitments

12. 🎨 Sidebar UI Specification
Position:

Right side of Gmail

Fixed width: 320px

Collapsible: 40px strip

Independent scroll container

Sections:
1. Header

App icon

Title: “Today’s Clarity”

Collapse button

2. Summary Chips

Important (red/amber)

Follow-ups (blue)

Noise (grey)

3. Important Today

List of 3–5 emails:

Subject

Sender

Age (e.g., 3h)

Importance pill

Click → opens Gmail thread

4. Follow-Ups

Subject

Days since last message

“Open in Gmail” button

5. Noise Summary

Total count

Top senders

“View noise” (optional)

13. 🧪 Non-Functional Requirements

Sidebar skeleton loads in < 300ms

API responses load in < 500ms (cached)

Background processing runs every 15–30 minutes

Daily digest delivered at user’s local time

14. 🔐 Security Rules

Gmail scope is read-only

No modifying, sending, or deleting emails

OAuth tokens encrypted at rest

No storing raw email bodies unless absolutely needed

Logs must not contain email content

15. 🛣️ Roadmap (Post-MVP)
v1.1

Important sender memory

Focus mode

v1.2

Push notifications

Chrome popup quick-view

Archive-all-noise

v2.0

Mobile viewer app

WhatsApp / iMessage digest

Menu bar companion

v3.0

Outlook Add-in

Shared team inbox insights

AI draft replies

16. 📎 Appendix
Gmail fetch strategy

users.messages.list

filter: q="newer_than:3d"

users.messages.get

format: metadata or full

Classification cadence

Every 15 minutes OR triggered post-login