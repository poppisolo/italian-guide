

# SEMI FORESTI — Gestionale Scuola di Italiano MVP

## Overview
A web management system for an Italian language school for foreigners, handling student registration, level testing, intelligent class creation, and volunteer teacher management.

## Design System
- **Primary Green:** #74A55A (sidebar, main actions)
- **Orange/Ocra:** #E18E23 (highlights, deadlines, AI buttons)
- **Light Green:** #B3D476 (card backgrounds, active states)
- **Components:** Shadcn/UI + Lucide React icons
- **Feedback:** Toast notifications only (no browser alerts)

## App Structure & Navigation

### Sidebar Navigation
- **Dashboard** (home/KPI)
- **Studenti** (student registry)
- **Test** (test sessions & results)
- **Class Builder** (intelligent class creation)
- **Registro** (teacher attendance & logbook)
- **Insegnanti** (volunteer profiles)
- Disabled future modules: Biblioteca, Laboratori, Ufficio

### Pages & Features

#### 1. Dashboard Segreteria (Desktop-first)
- KPI cards: students awaiting test, students awaiting class, active classes, available teachers
- Quick-action buttons to navigate to Test and Class Builder modules

#### 2. Studenti (Student Management)
- Table with search/filter by nationality, age, spoken languages
- Add student form with mandatory privacy consent checkbox (GDPR)
- Student detail view showing profile, test history, class assignment, status badge
- Status flow: "In attesa test" → "In attesa classe" → "Assegnato" / "Inattivo"

#### 3. Gestione Test (Test Management)
- Create test sessions with date selection
- Convoke students (status "In attesa test") to a session
- Batch result entry: level assignment (Alfa, Pre-A1, A1, A2, B1, B2) + notes
- On save, student status changes to "In attesa classe"

#### 4. Class Builder (AI-Assisted)
Multi-step wizard:
1. **Select Teacher** — pick a volunteer, see their availability slots and preferred level
2. **Smart Filter** — auto-show compatible students (matching schedule + level), sorted by enrollment date priority
3. **AI Suggest** — "Suggerisci con IA" button (simulated) that proposes an optimized student grouping
4. **Assign Table** — pick a physical table/room, check capacity
5. **Confirm** — create the class and generate recurring lesson instances

#### 5. Registro Insegnanti (Mobile-first)
- Today's lessons list for the logged-in teacher
- Toggle attendance (Present/Absent) per student with optional late minutes
- "Diario di bordo" text field for lesson topic and notes
- Clean, touch-friendly UI optimized for mobile

#### 6. Insegnanti (Volunteer Profiles)
- List of volunteers with availability, preferred level, membership expiry
- Edit availability slots and methodological notes

## Data Layer
All data managed with React state + mock data for MVP (no backend). Data structures follow the provided database schema:
- UTENTI, LINGUE_PARLATE, PROFILI_STUDENTI, PROFILI_VOLONTARI, DISPONIBILITA
- TAVOLI, CLASSI, ISCRIZIONI_CLASSI
- LEZIONI, PRESENZE

Mock data will be realistic and demonstrate all workflows.

## Key UX Details
- Responsive layout: sidebar collapses on mobile
- Toast notifications for all CRUD operations
- Confirmation modals for destructive actions
- Privacy consent required before any student data entry
- Disabled sidebar items for future modules (Biblioteca, Laboratori, Ufficio) with tooltip "Coming soon"

