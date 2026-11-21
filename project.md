## Problem Statement

Traditional productivity tools force users to fragment their workflow across three disconnected apps: to-do lists (which lack time context), calendars (which clutter daily execution with rigid monthly grids), and habit/fitness trackers (which isolate performance data from daily schedules).

Existing calendar apps struggle with hyper-flexible intraday recurrence (such as "morning and night" or "3 times a day"), while standard to-do apps treat all tasks identically—offering simple binary completion checkboxes rather than allowing users to log quantitative performance metrics (e.g., distance run, pages read, calories burned) on specific recurring tasks to analyze trends and optimize habits over time.

## Core Features

### 1. Day-Centric Timeline View (Time-Blocked To-Do)

- **Hourly Intraday Grid:** Instead of an overwhelming monthly overview, the primary interface is a clean, vertical 24-hour timeline focused on Today (with quick swipe/arrow navigation to adjacent days).
- **Visual Time Blocks:** Tasks render at their scheduled hour with duration blocks, overlapping indicators, and a live "current time" laser line.
- **Unscheduled Inbox:** A collapsible top/side drawer for floating tasks that need to be dragged onto the daily timeline when ready.

### 2. Hyper-Flexible Recurrence Engine

- **Standard & Custom Intervals:** Supports one-time tasks, daily, every $N$ days, bi-weekly, specific weekdays (e.g., Mon/Wed/Fri), or monthly rules.
- **Intraday Multi-Trigger Scheduling:** Allows a single task template to fire multiple times within the same day—either at specific times (e.g., 08:00 AM and 09:00 PM) or evenly spaced intervals (3 times a day).
- **Exception Handling:** Edit or skip a single occurrence (e.g., moving today's 6:00 PM run to 7:30 PM) without breaking the underlying recurrence rule.

### 3. Selective Metric Tracking & Logging

- **Trackable Toggle:** When creating or editing a task, users can toggle "Enable Data Tracking" (keeping simple chores like "Buy groceries" lightweight).
- **Custom Metric Schemas:** Define what to measure per task—numeric values with units (e.g., km, minutes, pages, kg), ratings (1–5 energy level), or multi-field logs (e.g., `Distance: 5 km` + `Pace: 5:30/km`).
- **Inline Completion Prompt:** Checking off a tracked task opens a quick-entry popover to log the day's numbers before marking it complete.

### 4. Performance Analytics & Optimization Charts

- **Interactive Trend Graphs:** View line charts, bar graphs, and moving averages over customizable windows (7D, 30D, 90D, All-Time) for any tracked task.
- **Optimal Window Insights:** Correlate performance data with completion timestamps and days of the week (e.g., highlighting that your 6:00 PM runs average 15% faster pace on Tuesdays than Fridays, or identifying streak consistency).

### 5. Native-Like PWA Experience

- **Installable & Offline-Ready:** Installs directly to mobile home screens and desktop docks with full-screen UI.
- **Local Queue & Sync:** Check off tasks and log metrics offline; a service worker queues mutations in IndexedDB and syncs to MongoDB once connectivity returns.
- **Web Push Reminders:** Optional browser/mobile notifications triggered prior to scheduled time blocks.

## Architectural Solutions (How to Solve the Hard Parts)

### Solving Complex Recurrence Without Bloating the Database

- **The Challenge:** Storing every future instance of a "3x daily" task infinitely will quickly exhaust MongoDB Atlas's 512MB Free Tier.
- **The Solution (Virtual Expansion + Materialized Logs):**
    1. Store only the Task Rule document in MongoDB using industry-standard iCalendar `RRULE` strings (via the `rrule.js` library) paired with an array of intraday timestamps (e.g., `["08:00", "14:00", "20:00"]`).
    2. Compute task appearances dynamically on the fly for whatever date range the user is currently viewing.
    3. Only write an Activity Log document to MongoDB when a user actually completes, skips, reschedules, or logs metric data for a specific date/time instance.

### MongoDB Data Schema Design

- **`tasks` Collection:** Stores `userId`, `title`, `durationMinutes`, `rruleString`, `intradayTimes[]`, `isTracked` (boolean), and `trackingConfig` (`{ metricName, unit, targetValue }`).
- **`taskLogs` Collection:** Stores `taskId`, `userId`, `scheduledDate`, `scheduledTime`, `status` (`completed` | `skipped` | `rescheduled`), `loggedValue` (number/object), and `completedAt`. Indexed on `{ userId: 1, scheduledDate: 1 }` for sub-millisecond daily timeline queries.

## Recommended JavaScript Tech Stack

| Layer                  | Technology                                    | Why It Fits                                                                                                                                                       |
| :--------------------- | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Next.js (App Router)                          | Unified frontend + serverless backend API routes/Server Actions in TypeScript; built-in `app/manifest.ts` support for PWAs.                                       |
| **Styling & UI**       | Tailwind CSS + shadcn/ui                      | Rapid development of accessible modals, drawers, and responsive mobile-first layouts.                                                                             |
| **Recurrence Logic**   | `rrule` (`rrule.js`)                          | Battle-tested library for generating and parsing complex RFC-5545 recurrence patterns.                                                                            |
| **Charts & Analytics** | Recharts or Tremor                            | Lightweight, responsive React charting libraries ideal for line graphs, tooltips, and trend lines.                                                                |
| **Database & ODM**     | MongoDB Atlas (M0 Free) + Mongoose            | Document model naturally fits flexible `trackingConfig` schemas; 512MB easily holds years of personal text/metric logs.                                           |
| **PWA & Offline**      | Serwist (or native Service Worker) + Dexie.js | Serwist handles asset caching and Web Push; Dexie.js wraps IndexedDB for offline task logging.                                                                    |
| **Auth**               | Auth.js (NextAuth) or Better Auth             | Simple Google/GitHub OAuth integration with MongoDB adapters.                                                                                                     |
| **Hosting & CI/CD**    | Vercel + GitHub Actions                       | Zero-config deployment on Vercel; GitHub Actions can run automated linting/tests on PRs and trigger daily cron jobs (e.g., digest emails or streak calculations). |

## NOTE

Watch Out for One Serverless Trap (MongoDB Connections)

Because Vercel uses serverless functions (which spin up and down on demand), naive Mongoose setup can create a new database connection on every API call and quickly hit MongoDB's 500-connection limit.
To prevent this, cache Mongoose connection globally (global.mongoose) inside your Next.js database utility file so warm serverless instances reuse existing connections instead of opening new ones.
