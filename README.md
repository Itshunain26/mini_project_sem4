# 🎓 Student Mentorship & Guidance Portal

A full-stack web application connecting students with expert mentors for academic and career guidance.

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | HTML5, Vanilla CSS, Vanilla JS |
| Backend | Node.js + Express.js |
| Database | MySQL |
| Auth | JWT + bcrypt |

---

## 📁 Project Structure

```
ANTIGRAV/
├── backend/
│   ├── config/db.js          # MySQL2 pool connection
│   ├── controllers/          # Route handlers
│   ├── middleware/auth.js    # JWT auth middleware
│   ├── routes/               # Express routers
│   ├── schema.sql            # Full DB schema + seed data
│   ├── .env                  # Environment variables
│   └── server.js             # App entry point
├── frontend/
│   ├── index.html            # Landing page
│   ├── login.html            # Login
│   ├── register.html         # Register (Student / Mentor)
│   ├── student-dashboard.html
│   ├── mentor-dashboard.html
│   ├── admin-dashboard.html
│   ├── find-mentors.html
│   ├── sessions.html
│   ├── messages.html
│   ├── progress.html
│   ├── resources.html
│   ├── css/global.css        # Design system
│   └── js/api.js             # Centralized API helper
└── package.json
```

---

## ⚡ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `backend/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mentorship_portal
PORT=3000
JWT_SECRET=mentorship_portal_super_secret_key_2024
```

### 3. Create Database & Schema

Open MySQL Workbench (or terminal) and run:

```sql
SOURCE /path/to/ANTIGRAV/backend/schema.sql;
```

Or in MySQL CLI:
```bash
mysql -u root -p < backend/schema.sql
```

### 4. Run the Server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Open `http://localhost:3000`

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@mentorportal.com` | `password` |

> Register as Student or Mentor directly from the UI.

---

## 🗃️ Database Schema (11 Tables)

| Table | Purpose |
|-------|---------|
| `users` | All users with role (student/mentor/admin) |
| `student_profiles` | Major, year, GPA, goals |
| `mentor_profiles` | Title, company, expertise, rating |
| `categories` | Expertise categories (AI, Web Dev, etc.) |
| `mentor_categories` | Mentor ↔ Category mapping |
| `mentorship_requests` | Student → Mentor requests |
| `sessions` | Scheduled meetings |
| `session_feedback` | Post-session ratings & comments |
| `messages` | Chat messages between users |
| `resources` | Shared guides, articles, videos |
| `progress_goals` | Student goal tracking |

---

## 🚀 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Mentors
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mentors` | Browse mentors (search/filter) |
| GET | `/api/mentors/:id` | Mentor profile with reviews |
| PUT | `/api/mentors/profile` | Update mentor profile |

### Requests, Sessions, Messages, Resources, Progress
All under `/api/requests`, `/api/sessions`, `/api/messages`, `/api/resources`, `/api/progress`

### Admin
All under `/api/admin` — requires admin JWT

---

## 🎨 Features

- **Role-based access**: Student, Mentor, Admin dashboards
- **Mentor Discovery**: Search, filter by category, availability
- **Mentorship Requests**: Send, accept, reject requests
- **Session Scheduling**: Book 1-on-1 sessions with meeting links
- **Post-session Feedback**: Star ratings update mentor's average
- **Two-panel Messaging**: Real-time-style chat UI
- **Progress Tracker**: Goals with progress bars, milestones
- **Resource Library**: Shared guides/videos/articles with view tracking
- **Admin Dashboard**: Platform stats, user management
