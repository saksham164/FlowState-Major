# FlowState Viva Script + Examiner Q&A

## Part A: 2-Minute Viva Script (Use This First)

Good morning. My project is **FlowState**, an AI-assisted productivity and academic workflow platform.

The core problem I addressed is that users manage tasks, focus sessions, email action items, and study documents in separate tools. This causes context switching and missed commitments.  

FlowState integrates these workflows in one system. It includes task and focus management, analytics, rule-based AI insights, and subject-wise folder organization for academic resources.

Technically, the frontend is built with React and Vite, using modular context-based state management. The backend uses Node and Express for protected APIs, and Supabase is used for authentication, database storage, and file storage.

A key implemented feature is the **AI Insight Engine**. It analyzes recent focus-session behavior and generates personalized insights such as peak focus windows, break-rate patterns, and short-vs-long session tendencies. This is exposed through a protected endpoint and rendered as dashboard insight cards.

Another major feature is the **Subject Folder Explorer**. Users can create semester subjects, upload materials from local device or links, open/download resources, and delete materials for cleanup. Gmail-routed items can also be organized into matching subject folders.

From an engineering perspective, I focused on modularity, backward compatibility, and production-style UX improvements rather than rewriting core systems.  

In conclusion, FlowState is a practical full-stack system that combines productivity intelligence and academic organization in a single, scalable workflow platform.

Thank you.

---

## Part B: 5-Minute Extended Script (If Examiner Asks For More Detail)

FlowState is designed as a unified digital sanctuary for productivity and study management.

I structured the system in three layers:
1. **Frontend layer** for user interaction and visualization.
2. **Backend layer** for protected business logic, mainly analytics and insights.
3. **Data/platform layer** using Supabase for auth, relational tables, and storage.

The dashboard brings together:
- task stats
- focus session trends
- AI insight cards generated from real user behavior

The AI insight logic is rule-based and transparent. It does not generate random outputs; it computes metrics from focus session history:
- top 2-hour concentration window
- excessive break rate from session gaps
- short-session vs long-session productivity pattern

For academic workflow, I added:
- profile setup (institution, program, semester)
- subject folder creation
- material upload/link attachment
- dedicated folder explorer page for viewing and managing resources

I also implemented deletion support for uploaded materials and storage cleanup logic. This keeps both database records and storage assets clean.

I handled practical production issues during development:
- workspace path mismatch causing stale UI
- storage bucket and RLS policy blocks for file upload
- JSX rendering error in folder module

I solved these with targeted fixes while preserving existing architecture and avoiding risky rewrites.

Future enhancements include semantic search across notes, more advanced predictive insights, and secure signed-URL previews for stronger file privacy.

---

## Part C: Examiner Q&A Sheet

### 1) What is the novelty in your project?
FlowState combines productivity analytics and academic material organization in one workflow. The AI module gives explainable, rule-based insights from real focus behavior rather than generic tips.

### 2) Why did you choose rule-based AI instead of a full LLM pipeline?
Rule-based insights are deterministic, transparent, low-cost, and easy to validate in academic evaluation. It also avoids hallucination risk and is fast for real-time dashboard feedback.

### 3) What is your backend role in this project?
The backend exposes protected APIs, validates auth tokens, processes analytics logic, and returns per-user dynamic insights through `/api/insights`.

### 4) How do you ensure data is user-specific?
All queries are scoped with authenticated user identity (`user_id`). Storage paths also include user scope, and Supabase policies enforce access boundaries.

### 5) What tables are central to your academic folder feature?
Mainly `subject_folders` and `subject_materials`, linked to user identity. Files are stored in Supabase storage bucket `subject-files`.

### 6) How does file upload work?
Frontend sends file to Supabase storage under a user/subject path. Public URL is generated and saved as metadata in `subject_materials`.

### 7) Why did upload fail at one point?
Two reasons were encountered: missing storage bucket and RLS policy denial. After creating bucket and policies, upload works.

### 8) How does delete file work?
Delete action removes the database material row and attempts storage object removal using derived bucket path from saved URL.

### 9) What if storage delete fails but DB row is deleted?
The app reports partial cleanup error to user. This avoids orphaned UI records while still surfacing storage inconsistency.

### 10) How do AI insights update?
Insights refresh on load and through analytics refresh paths. They are recalculated per user based on latest session data.

### 11) How do you avoid over-claiming insights with little data?
Sparse-data handling returns neutral fallback messages instead of forcing strong conclusions.

### 12) What are your major frontend state management patterns?
Context-based modular providers (auth, subjects, analytics, tasks, inbox, theme) to centralize shared state and avoid prop-drilling.

### 13) What charts/visualization libraries are used?
Chart.js through React wrappers for productivity trend visualization.

### 14) What were the biggest engineering challenges?
- Path/environment mismatch leading to stale frontend
- Storage policy and bucket setup
- Integrating new pages without breaking existing layout/routing

### 15) How is scalability supported?
Feature modules are separated by context and page domains. API and data layers are extensible for additional analytics, automations, and collaboration features.

### 16) How did you ensure backward compatibility?
By extending existing contexts/routes/components instead of rewriting stable modules; no major dependency replacement was introduced.

### 17) How secure is this for production?
Current setup is production-oriented but can be hardened by private buckets + signed URLs, stricter RLS, audit logs, and server-side file validation.

### 18) Why is this project relevant academically?
It demonstrates practical full-stack engineering: authentication, secure data access, analytics logic, UI/UX iteration, and integration of AI-driven decision support.

### 19) What improvements would you implement next?
- signed URL preview flow
- semantic note search
- predictive workload balancing
- calendar-aware proactive suggestions

### 20) One-line conclusion for viva ending?
FlowState transforms disconnected productivity and academic processes into one intelligent, user-centered platform with measurable behavioral insights.

---

## Part D: Quick Answer Templates (Use Under Pressure)

- **Architecture in one line:** React frontend + Express API + Supabase auth/database/storage with modular contexts.
- **AI in one line:** Explainable rule-based analytics on focus sessions, returned as actionable insight cards.
- **Database in one line:** User-scoped relational model for profiles, subjects, and materials.
- **Security in one line:** Authenticated routes + user-bound queries + storage RLS policies.
- **Outcome in one line:** End-to-end productivity and academic workflow in a single interface.
