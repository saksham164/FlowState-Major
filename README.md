# 🌲 FlowState — The Digital Sanctuary

**FlowState** is a high-fidelity productivity application designed to bridge the gap between passive task tracking and active "Deep Work." It transforms your workspace into a **Digital Sanctuary** using atmospheric visual design and context-aware intelligence.

---

## ✨ Core Pillars

### 1. 🕯️ The Visual Sanctuary (Midnight Emerald)
FlowState uses a dual-theming system designed to match your mental state:
- **Midnight Emerald (Dark Mode)**: A deep, atmospheric forest aesthetic for late-night focus and "Cave" sessions.
- **Quiet Architect (Light Mode)**: A clean, high-contrast workspace for morning execution and planning.
- **Sanctuary Rounding**: Every major container features a soft **24px (radius-xl)** corner for a modern, tactile feel.
- **Interactive Depth**: A structural layering system using glassmorphism, multi-layered shadows, and 40px backdrop blurs.

### 2. 🧠 Contextual Intelligence
FlowState doesn't just track tasks; it understands your world:
- **Gmail Intelligence**: Edge Functions automatically sync your inbox, extracting sender metadata for informed triage.
- **Rule-Based Automation**: Define custom logic (e.g., "If sender contains 'Boss', priority is Urgent") to keep your sanctuary organized.
- **Hexagraph Analytics**: Visualizes your focus efficiency across different domains using dynamic radar charts.

### 3. ⚡ High-Intent Interaction
- **Deep Work Zone**: A smart session prompt that replaces the calendar, surfacing the highest-intent task with a physical "READY?" trigger.
- **Interactive Topbar**: A floating, high-z-index header with micro-animated icons (Bell, Avatar) and a frosted structural definition.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS (The Unified Sanctuary Design System) + Tailwind Utilities
- **State Management**: Context-based (Auth, Theme, Tasks, Rules, Inbox)
- **Charts**: Chart.js + React-Chartjs-2

### Infrastructure (BaaS)
- **Database**: PostgreSQL (Supabase) with Row Level Security (RLS)
- **Authentication**: Supabase Auth (JWT-based)
- **Automation**: Supabase Edge Functions (Deno) for heavy lifting (Gmail Sync, AI Logic)

---

## 📁 Project Architecture

```
FlowState/
├── frontend/           # The Digital Sanctuary UI
│   ├── src/
│   │   ├── components/ # Dashboard modules, Layout (Topbar/Sidebar)
│   │   ├── context/    # The Brain (Task, Theme, Rule, Inbox contexts)
│   │   ├── pages/      # Focus Mode, Analytics, Settings, Dashboard
│   │   └── services/   # Supabase & API clients
├── supabase/           # Infrastructure Layer
│   ├── functions/      # Edge Functions (sync-gmail, etc.)
│   └── migrations/     # Database Schema (RLS, Triggers, Views)
└── README.md           # The Manual (You are here)
```

---

## 🛠️ Restoration: Phase 7 Highlights

The project recently underwent a massive **Visual restoration** (Phase 7) to eliminate "flat" UI elements and restore the premium Sanctuary aesthetic:
- [x] **24px Rounding Standard**: Softened every major container globally.
- [x] **Interactivity Unlocked**: Fixed CSS specificity conflicts in the Topbar, making all icons alive and tactile.
- [x] **Deep Work Zone**: Swapped the static calendar for a high-intent focus prompt.
- [x] **Contrast & Depth**: Deepened backgrounds and elevated cards for a "layered" physical feel.

---

## 🚀 Running Locally

1. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. **Supabase**:
   Ensure your `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

*“FlowState is not a tool; it’s a mental enclosure.”* 🌲🕯️
