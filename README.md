# CourtWatch

A full-stack real-time basketball court booking application built with React, TypeScript, Node.js, PostgreSQL, and Socket.IO.

---

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Socket.IO Client
- Axios
- React Router v6

**Backend**
- Node.js + Express
- PostgreSQL 
- Socket.IO
- JWT Authentication 
- bcrypt
- Multer (file uploads)
- express-validator

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repo

```bash
git clone https://github.com/shrxprxyx/BasketBall-Court-Tracking-App.git
```

### 2. Set up the database

Open `psql` and run:

```sql
\c basketballapp

CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE basketball_courts (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  surface    VARCHAR(50),
  status     VARCHAR(50) DEFAULT 'available',
  distance   NUMERIC(5,2) DEFAULT 0,
  players    INTEGER DEFAULT 0,
  photo      VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  court_id   INTEGER NOT NULL REFERENCES basketball_courts(id) ON DELETE CASCADE,
  timeslot   VARCHAR(100) NOT NULL,
  status     VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Configure the backend

Create `backend/.env`:

```env
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=basketballapp

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

PORT=8080
```

### 4. Install and run the backend

```bash
cd backend
npm install
node index.js
```

You should see:
```
Server running on port 8080
Connected to PostgreSQL
```

### 5. Install and run the frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Courts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courts` | Get all courts |
| POST | `/api/admin/court` | Add a court (multipart/form-data) |
| PUT | `/api/admin/court/:id` | Update a court |
| DELETE | `/api/admin/court/:id` | Delete a court |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get all bookings |
| POST | `/api/bookings` | Create a booking |
| PUT | `/api/bookings/:id` | Update booking status |
| DELETE | `/api/bookings/:id` | Cancel a booking |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| PUT | `/api/users/:id` | Update name/email/password |

---

## Real-Time Events (Socket.IO)

All events are emitted from the server to all connected clients automatically after any mutation.

| Event | Triggered when |
|-------|---------------|
| `usersUpdated` | A new user registers |
| `courtsUpdated` | A court is added, updated, or deleted |
| `bookingsUpdated` | A booking is created, updated, or deleted |

The admin dashboard, user dashboard, and bookings page all listen for these events and update instantly without a page refresh.

---

## User Roles

| Role | Access |
|------|--------|
| `user` | Browse courts, make/cancel bookings, view profile |
| `admin` | All of the above + manage courts, view all users and bookings in admin dashboard |

Role is set at registration and encoded in the JWT. After login, users are redirected to `/user-dashboard` or `/admin-dashboard` based on their role.

---

## Routes

```
/                    → Landing page
/signin              → Sign in / Sign up
/user-dashboard      → Court explorer (user)
/bookings            → Booking history (user)
/profile             → User profile + edit
/admin-dashboard     → Admin overview
/admin/courts        → Court management
```
