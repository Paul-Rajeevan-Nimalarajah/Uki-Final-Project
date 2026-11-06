# LearnyMo — Topic-First Online Learning & Tutoring Platform

**LearnyMo** is a full-stack educational marketplace designed for Sri Lankan O/L and A/L students and verified teachers. Unlike traditional full-year tuition models, LearnyMo enables students to book classes for the exact **Topic**, **Unit**, **Past Paper**, or **Full Subject** they need—at a time that works for them.

---

## ✨ Key Features

### 🎓 For Students
- **7 Flexible Class Types**: Book **1-to-1 Sessions**, **Group Classes**, **Topic Classes**, **Unit Classes**, **Paper Classes**, **Full Subject Courses**, or **Multi-Day Series**.
- **Interactive Syllabus Tracker**: Track O/L and A/L syllabus units and topics with **Not Started**, **Not Clear**, and **Clear** statuses.
- **"Not Clear" Topic Demand Matching**: Marking any topic as *Not Clear* signals live demand to teachers and triggers automatic class recommendations when sessions are scheduled.
- **1–4–7 Scientific Study Planner**: Built-in spaced-repetition study planner (**Day 1 Learn • Day 4 Review • Day 7 Recall & Test**).
- **Bookings, Timetable & Protected Chat**: Manage class requests, pay securely, unlock dedicated booking chat with class cards, and join the live online classroom.

### 👨‍🏫 For Teachers
- **Real-Time Student Topic Demand**: View aggregated student demand (e.g., how many students marked a specific topic as *Not Clear*) and launch targeted classes in one click.
- **1-to-1 Request & Class Management**: Accept custom student booking requests or publish scheduled classes across all 7 class formats.
- **80% / 20% Revenue Split & Wallet**: Earn **80%** directly into the teacher wallet upon booking payment (with a **20%** platform service fee).
- **Verified Teacher Profiles**: Upload verification credentials, manage subjects and hourly rates, and build credibility with **Star Ratings** and **Repeat Student Rate** metrics.

### 🛡️ For Administrators
- **Teacher Verification Queue**: Review teacher qualification documents and approve or reject applications before teachers can publish classes or accept bookings.
- **Academic & Syllabus Management**: Create and manage Grades (`O/L`, `A/L`), Streams, Subjects, Units, and Topics.
- **Platform Oversight**: Manage user accounts, monitor marketplace bookings, and track platform commission revenue.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **React 19** (Vite)
- **React Router DOM v7**
- **Tailwind CSS v3**
- **Axios** (API communication)
- **Lucide React** (Icons)

### Backend (`/server`)
- **Node.js & Express 5** (ES Modules)
- **MongoDB & Mongoose**
- **JSON Web Tokens (JWT)** & **bcryptjs** (Role-based authentication & security)
- **Multer** (Verification document & file uploads)

---

## 📁 Project Structure

```text
UKI_Final_Project/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Axios configuration & API helpers
│   │   ├── components/         # Reusable UI components (Navbar, etc.)
│   │   ├── context/            # AuthContext for state & role management
│   │   ├── pages/              # Application views (Dashboard, Marketplace, Syllabus, Admin, etc.)
│   │   ├── App.jsx             # Route definitions & role-based guards
│   │   └── main.jsx            # Entry point
│   └── package.json
│
├── server/                     # Node.js + Express backend
│   ├── config/                 # Database & service configurations
│   ├── controllers/            # Route handlers (auth, academic, teacher, admin, marketplace)
│   ├── middleware/             # JWT auth, role authorization & teacher verification guards
│   ├── models/                 # Mongoose schemas (User, Academic, ClassSession, BookingRequest, TopicDemand)
│   ├── routes/                 # Express API route definitions
│   ├── utils/                  # Seed scripts & helper utilities
│   ├── uploads/                # Uploaded verification documents & assets
│   ├── server.js               # Express app entry point
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (Local instance or MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd UKI_Final_Project
```

### 2. Configure the Backend (`/server`)
Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend development server:
```bash
npm run dev
```
The server will run at `http://localhost:5000` and automatically seed demo accounts and sample syllabus/marketplace data if the database is empty.

### 3. Configure the Frontend (`/client`)
Open a new terminal, navigate to the `client` directory, and install dependencies:
```bash
cd client
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend will run at `http://localhost:5173`.

---

## 🔑 Demo Credentials (Auto-Seeded)

When the backend starts for the first time, sample users are automatically created by `server/utils/seedProductionData.js`:

| Role | Email | Password | Status |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@learnymo.lk` | `Admin@123` | Active Super Admin |
| **Teacher (Verified)** | `arjuna@learnymo.lk` | `Teacher@123` | Approved (`Combined Maths & Physics`) |
| **Teacher (Pending)** | `nimali@learnymo.lk` | `Teacher@123` | Pending Admin Verification |
| **Student** | `student@learnymo.lk` | `Student@123` | Active (`A/L Physical Science`) |

---

## 📡 Core API Endpoints

| Prefix | Description |
| :--- | :--- |
| `/api/health` | Backend health check |
| `/api/auth` | User registration, login & profile management |
| `/api/academic` | Grades, streams, subjects, units & syllabus hierarchy |
| `/api/teachers` | Teacher profiles, ratings & verification submissions |
| `/api/marketplace` | Class sessions, 1-to-1 bookings, payments, chat, study planner & topic demand |
| `/api/admin` | Teacher verification queue, user moderation & platform analytics |
| `/api/upload` | Document & file upload handling |

---

## 📄 License

This project is developed as part of the **Uki Coding School Final Project**.

