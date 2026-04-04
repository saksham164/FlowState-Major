# FlowState Viva Summary

## 1. Project Title
FlowState - AI-Assisted Productivity and Academic Workflow Platform

## 2. Problem Statement
Users typically manage tasks, focus sessions, email commitments, and academic documents across multiple disconnected tools. This causes context switching, missed deadlines, poor focus tracking, and fragmented study materials.

FlowState solves this by unifying:
- task management
- focus tracking
- analytics
- AI insights
- Gmail-assisted ingestion
- subject-based academic file organization

## 3. Objective
Build a production-style web application that helps users:
- capture and manage work/study tasks
- improve focus habits through measurable sessions
- receive rule-based AI guidance from real behavior data
- organize academic materials by semester and subject
- reduce manual effort via automation workflows

## 4. Tech Stack
### Frontend
- React (Vite)
- React Router
- Context API (modular state providers)
- Chart.js (`chart.js`, `react-chartjs-2`)
- Lucide React icons

### Backend
- Node.js + Express API
- RESTful routes with `/api/*` convention
- Auth middleware (Supabase JWT validation)

### Database and Platform
- Supabase
  - Postgres tables
  - Auth
  - Storage bucket for materials (`subject-files`)

## 5. Architecture (High-Level)
FlowState follows a modular client-server architecture:
- Frontend handles UI, routing, user interactions, and client contexts.
- Backend handles protected analytics/insight logic.
- Supabase stores relational user data and files.

Data flow:
1. User authenticates via Supabase Auth.
2. Frontend sends authenticated requests and reads/writes subject/task/session data.
3. Backend insight service processes focus session data and returns dynamic coaching insights.
4. Dashboard/Profile/Folders pages render personalized outputs.

## 6. Key Features Implemented
### A. Task and Productivity Workflow
- Task creation and tracking with status and priority handling.
- Focus timer/session tracking for productivity behavior.
- Dashboard with task/focus metrics.

### B. Rule-Based AI Insight Engine (Phase 7)
- Endpoint: `GET /api/insights`
- Logic:
  - Peak focus window detection (hour concentration)
  - Break-rate analysis (session gap behavior)
  - Short vs long session productivity pattern
- Returns:
  - insight cards (`title`, `message`, `tone`)
  - supporting metrics
  - generation timestamp

### C. Profile and Academic Setup
- User profile details:
  - full name, institution, program, phone, semester
- Subject folder setup:
  - subject name, optional code, semester mapping

### D. Subject Folder Material Management
- Add material by:
  - file upload from local device
  - external link
- Materials stored per subject folder.
- Dedicated Folder Explorer page (`/folders`) to browse all materials visually.
- Open/Download actions for materials.
- Delete support for material cleanup.

### E. Navigation and UX
- Standalone profile experience.
- Folder Explorer integrated into main workspace.
- Theme toggle support.
- Improved search/notification/topbar styling and dashboard polish.

## 7. Database Entities Used
Main entities used in the current implementation:
- `user_profiles`
- `subject_folders`
- `subject_materials`
- `focus_sessions`
- tasks/inbox related tables from existing project phases

Storage:
- Supabase Storage bucket: `subject-files`
- File path pattern: `auth.uid()/subjectId/timestamp-fileName`

## 8. Security and Access Control
- Protected routes via authentication.
- User-scoped reads/writes enforced by `user_id`.
- Supabase Storage policies required for upload/read/delete.
- Password change supported in Security section.

## 9. Notable Issues Faced and Fixes
1. Frontend path mismatch (`OneDrive` folder vs active local folder) caused old UI appearing.
   - Resolved by syncing changes into active workspace path.

2. Storage errors (`Bucket not found`, RLS violations) blocked uploads.
   - Resolved by creating correct bucket and adding required storage policies.

3. Folder Explorer action gaps.
   - Added dedicated folder page and material-level actions.

4. Build/runtime JSX error in `Folders.jsx`.
   - Resolved by correcting conditional render structure.

## 10. Engineering Decisions
- Reused existing architecture and contexts instead of rewriting.
- Kept backward compatibility with existing flows.
- Added modular enhancements (insights, folders, profile refinement) incrementally.
- Preserved dependency discipline (no major framework shifts).

## 11. Outcome
FlowState now supports:
- end-to-end productivity workflow
- dynamic AI-driven coaching based on behavior data
- academic subject folder management with resource lifecycle (add/open/download/delete)
- polished and navigable user experience aligned with production intent

## 12. Future Scope
- Smarter predictive insight scoring using longer history.
- Semantic search across uploaded notes.
- Advanced automation triggers from calendar/email signals.
- Collaboration features (shared subjects/folders).
- Private signed URL preview pipeline for secure document rendering.
