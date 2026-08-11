# TaskFlow — Task & Project Management App

A full-stack task management application with JWT-based authentication, built with **Flask**, **SQLAlchemy**, and vanilla **JavaScript**. Users can register, log in, and manage their own tasks with priorities, due dates, and status tracking — completely isolated per user via token-based auth.

**Live Demo:** _[add your Render link here after deploying]_

## Features

- 🔐 **JWT authentication** — secure register/login with hashed passwords (Werkzeug) and 24-hour token expiry
- ✅ **Full task CRUD** — create, read, update, delete tasks scoped to the logged-in user
- 🔎 **Filtering & sorting** — filter by status/priority, sort by due date, priority, or creation time
- 📊 **Live dashboard stats** — total/pending/in-progress/completed counts, high-priority open tasks
- 🎨 **Responsive single-page UI** — no frontend framework dependency, pure JS + Fetch API
- 🗄️ **SQLAlchemy ORM** with SQLite (dev) / swappable to MySQL or Postgres via `DATABASE_URL`

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask, Flask-JWT-Extended, Flask-SQLAlchemy |
| Database | SQLite (dev), MySQL/Postgres-ready |
| Frontend | HTML5, CSS3, Vanilla JavaScript (Fetch API) |
| Auth | JWT (JSON Web Tokens), password hashing via Werkzeug |
| Deployment | Gunicorn-ready, deployable to Render/Railway |

## Project Structure

```
taskflow/
├── app.py                 # Flask app, models, routes
├── requirements.txt
├── templates/
│   └── index.html         # Single-page frontend
└── static/
    ├── css/style.css
    └── js/app.js           # Auth + task CRUD logic (fetch-based)
```

## Setup — Run Locally

```bash
git clone https://github.com/<your-username>/taskflow.git
cd taskflow

python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

Visit `http://127.0.0.1:5000` in your browser. The SQLite database (`taskflow.db`) is created automatically on first run.

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | No | Create a new user account |
| POST | `/api/login` | No | Log in, returns JWT token |
| GET | `/api/me` | Yes | Get current user's profile |
| GET | `/api/tasks` | Yes | List tasks (supports `?status=`, `?priority=`, `?sort_by=`) |
| POST | `/api/tasks` | Yes | Create a new task |
| PUT | `/api/tasks/<id>` | Yes | Update a task |
| DELETE | `/api/tasks/<id>` | Yes | Delete a task |
| GET | `/api/tasks/stats` | Yes | Get task counts/summary |

Authenticated requests require the header: `Authorization: Bearer <token>`

## Deployment (Render — free tier)

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a new **Web Service** from your repo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add an environment variable `JWT_SECRET_KEY` with a strong random value.
6. Deploy — Render gives you a live `.onrender.com` URL to put on your resume.

## What This Project Demonstrates

- Secure, stateless authentication using JWT rather than server-side sessions
- RESTful API design with proper HTTP verbs and status codes
- Relational schema design with foreign-key-scoped ownership (users can only see their own tasks)
- Query parameter based filtering/sorting on the backend rather than client-side
- Clean separation between API layer and frontend consumption

## Author

**Krishnaraj M**
[GitHub](https://github.com/csekrishnarajm-code) · [LinkedIn](https://linkedin.com/in/krishnaraj-m)
