# ⚡ TaskFlow — Modern React REST API Frontend

A responsive, high-performance React frontend that consumes the Node.js / Express Task Manager REST API built in WA-2. Built with **React 19**, **Vite**, **React Router v7**, and a vanilla CSS design system featuring dark mode aesthetics, glassmorphism, micro-animations, and client-side form validation.

---

## 🌟 Key Features

### 1. 🧭 Multi-Page Client-Side Routing (React Router)
- **`/tasks` (Task List View)**: Main workspace with search input (debounced), status & priority filters, pagination controls, dynamic stats counters, quick status toggling, and empty states.
- **`/tasks/:id` (Task Detail View)**: Detailed overview of task specifications, user ID, priority indicators, relative due-date calculations with overdue alerts, formatted timestamps, inline quick-status changer, and delete action.
- **`/tasks/new` (Create Task Form)**: Client-side validated form with real-time character counters, inline field error messages, and immediate navigation upon creation.
- **`/tasks/:id/edit` (Edit Task Form)**: Re-usable form pre-populated from the API with full field validation and server-error mapping.
- **`/login` & `/register` (Authentication)**: Supports JWT user registration, login, and a **One-Click Demo Login** button for instant evaluation.
- **`*` (404 Not Found Page)**: Dedicated fallback route for non-existent paths with a quick return link.

### 2. 🔌 Real REST API Integration (No Mock Data)
- Connects directly to the backend Express server running on `http://localhost:3000` via Vite reverse proxy (`/api/*`).
- Handles JWT authentication via `Authorization: Bearer <token>` in local storage.
- User isolation: Only shows and manages tasks belonging to the authenticated account.

### 3. 🛡️ Robust Loading & Error States (Graceful Degradation)
- **Live Backend Health Indicator**: An interactive badge in the header shows real-time connectivity (`API Online` / `API Offline`) by pinging `GET /api/health`.
- **Skeleton Pulse Cards**: Modern animated skeleton loaders during initial task retrieval and navigation.
- **Error Banners with Retry**: When the backend server is stopped or a request fails, a diagnostic error alert appears with an immediate "Try Again" button—preventing any blank screens or silent failures.
- **Toast Notifications**: Non-intrusive feedback toasts for task creation, status updates, edits, and deletions.

### 4. 📝 Client-Side Form Validation
- **Title**: Required, 3 to 200 characters.
- **Description**: Maximum 2000 characters with live character counter.
- **Status**: Validated against `pending`, `in_progress`, `completed`.
- **Priority**: Validated against `low`, `medium`, `high`.
- **Due Date**: Date validation and overdue detection.
- **Touched State Tracking**: Only surfaces validation cues when the user has interacted with a field or attempted submission.
- **Submit Protection**: Submit buttons are disabled during active network requests with an inline spinner.

### 5. 🎨 Design & Aesthetics
- Deep Dark Theme (`#090c10`) with radial gradient glows and glassmorphism cards (`backdrop-filter: blur(12px)`).
- Modern typography via Google Fonts (**Plus Jakarta Sans**).
- Status & priority color coding (Emerald, Amber, Rose, Indigo).
- Fully responsive across desktop, tablet, and mobile screens with a responsive navigation drawer.

---

## 🚀 Quick Start Guide

### 1. Ensure Backend Server is Running
In a separate terminal, navigate to your backend project and start it:
```bash
cd "D:\Projects\Rest API with Node"
npm run dev
# Or: node src/server.js
```
The backend will listen at `http://localhost:3000` (`GET /api/health`).

### 2. Run the React Frontend
In this directory (`D:\Projects\React_FrontEnd`):
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Testing the Requirements

1. **Verify Authentication & Real Data**:
   - Open `http://localhost:5173`.
   - Click the **"One-Click Demo Login"** button in the header or list banner to sign in instantly as `alex.demo@taskflow.dev`.
   - Click **"Seed Sample Tasks"** to populate realistic data if the database is fresh.
2. **Test Route 1 (List View)**:
   - Filter by status (`Pending`, `In Progress`, `Completed`) or priority (`High`, `Medium`, `Low`).
   - Type in the search box to verify debounced real-time search.
   - Click the circle icon on any task card to quickly toggle its completion status.
3. **Test Route 2 (Detail View)**:
   - Click on any task title to navigate to `/tasks/:id`.
   - Review metadata (Task ID, Assigned User ID, Timestamps).
   - Use the **Quick Status Update** dropdown to change status.
4. **Test Route 3 (Create & Edit Form with Validation)**:
   - Click **"New Task"** (`/tasks/new`).
   - Try clicking **"Create Task"** with an empty title: observe the client-side validation message ("Task title is required").
   - Type 1 or 2 characters: observe "Title must be at least 3 characters long."
   - Fill in a valid title and save: observe the redirect to the task details page.
   - Click **"Edit Task"** (`/tasks/:id/edit`), modify details, and save.
5. **Test Graceful Error Handling**:
   - Stop the backend process in your terminal.
   - Notice the header badge turns to **"API Offline"** and task actions display friendly diagnostic banners with a **"Try Again"** button rather than crashing.

---

## 📁 Project Architecture

```
src/
├── api/
│   └── client.js            # Fetch wrapper with JWT headers, error handling & health checks
├── context/
│   ├── AuthContext.jsx      # Authentication state, login/register, demo provision & health check
│   └── ToastContext.jsx     # Global notification toast messages
├── components/
│   ├── Navbar.jsx           # Responsive header with branding, navigation, and user status
│   ├── BackendStatus.jsx    # Real-time API connectivity badge (Online/Offline/Checking)
│   ├── TaskCard.jsx         # Card component with status badge, priority bar, overdue pill & quick toggle
│   ├── TaskFilter.jsx       # Search input, status & priority dropdowns, page size selector
│   ├── TaskStats.jsx        # Summary cards (Total, Pending, In Progress, Completed)
│   ├── LoadingSpinner.jsx   # Animated spinners and skeleton pulse cards
│   ├── ErrorAlert.jsx       # Alert banner with backend offline diagnostics & retry button
│   └── ConfirmModal.jsx     # Accessible delete confirmation modal
├── pages/
│   ├── TaskListPage.jsx     # Route 1: List view with filters, pagination, and stats
│   ├── TaskDetailPage.jsx   # Route 2: Detail view with full attributes and quick update
│   ├── TaskFormPage.jsx     # Route 3: Create & Edit form with client-side validation
│   ├── AuthPage.jsx         # Sign in & registration with one-click demo login
│   └── NotFoundPage.jsx     # 404 Not Found fallback route
├── hooks/
│   └── useDebounce.js       # Debounce hook for responsive search filtering
├── styles/
│   └── index.css            # Complete CSS design system and responsive styles
├── App.jsx                  # Main application routing and context providers
└── main.jsx                 # Application entry point
```
