# 📚 Academic Nexus

A mission-critical productivity dashboard for CSE students — built to survive congested exam weeks with intelligent task prioritization, countdown timers, and sprint scheduling.

## ✨ Features

- **Survival Mode** — Automatically activates during high-pressure weeks with burst study sessions
- **Hero Countdown** — Persistent countdown to the nearest critical deadline
- **Deadline Heat Map** — Visual workload distribution across the calendar
- **Gap Finder** — Identifies free study windows in your schedule
- **Project Kanban** — Track projects and tasks with subtask checklists
- **Sprint Generator** — Auto-generates study sprints from upcoming deadlines
- **CSV Export** — Export tasks and projects for offline use
- **Offline Support** — Firestore persistent local cache works without internet

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Shadcn/UI + Radix UI |
| Backend / DB | Firebase (Auth + Firestore) |
| Charts | Recharts |
| Testing | Vitest |

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/AbMehedi/nexus-study.git
cd nexus-study/nexus-academic
npm install
```

### 2. Configure Environment Variables

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Firebase project values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> Get these values from [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🧪 Running Tests

```bash
npm run test:run
```

## 📦 Deployment (Vercel)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AbMehedi/nexus-study)

### Manual Deploy

1. Push your code to GitHub (already done ✅)
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import `nexus-study`
3. Set the **Root Directory** to `nexus-academic`
4. Add all environment variables from `.env.example` in the Vercel dashboard
5. Click **Deploy**

## 🔐 Environment Variables

All variables are required. Set them in Vercel → Project → Settings → Environment Variables.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firestore Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

## 📁 Project Structure

```
nexus-academic/
├── app/
│   ├── (auth)/          # Login & Signup pages
│   ├── dashboard/       # Protected dashboard routes
│   │   ├── analytics/
│   │   ├── projects/
│   │   ├── schedule/
│   │   ├── settings/
│   │   └── tasks/
│   ├── layout.tsx       # Root layout with AuthProvider
│   └── page.tsx         # Auth routing gateway
├── components/
│   └── dashboard/       # All dashboard UI components
├── context/
│   └── AuthContext.tsx  # Firebase Auth state provider
├── hooks/               # Custom React hooks
├── lib/
│   ├── firebase.ts      # Firebase initialization
│   ├── firestore-service.ts # CRUD operations
│   ├── priority-engine.ts   # Task priority algorithm
│   ├── sprint-generator.ts  # Sprint scheduling logic
│   └── types.ts         # Shared TypeScript types
└── __tests__/           # Vitest test suites
```

## 📄 License

MIT — built for academic survival 🎓
