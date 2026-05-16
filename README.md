# PeerPrep — Personalized DSA Preparation & Reflection Platform

A full-stack web application that helps developers track DSA problem-solving progress, write structured reflections, and receive AI-powered adaptive review scheduling based on sentiment and confidence analysis.

---

## Features

**Authentication**
- OTP-based two-factor email verification at signup and login (bcrypt + nodemailer)
- Password reset flow with OTP validation and strength enforcement
- JWT-based session management with 7-day token expiry
- Auto-expiring OTP cleanup every 10 minutes

**Problem Tracking**
- Browse curated DSA sheets (NeetCode 150, Striver SDE Sheet, and more)
- Mark problems as Solved, Attempted, or Unsolved with toggle support
- Paginated problem lists with difficulty filtering
- Per-sheet and overall progress summaries

**Reflection & NLP Analysis**
- Write post-solve reflections for any problem
- Sentiment classification using HuggingFace (`cardiffnlp/twitter-roberta-base-sentiment`)
- Keyword extraction from reflection text
- Confidence scoring per reflection

**Adaptive Spaced Repetition**
- Review date computed from sentiment + problem difficulty + confidence score
- Negative sentiment → review in 1 day; Neutral → 3 days; Positive → 5 days
- Difficulty adjustment: Easy (+5 days), Medium (+2–4 days), Hard (+2 days)
- Low confidence (<0.5) adds 1 extra day
- Today's review queue with completion tracking

**Analytics Dashboard**
- Time-series progress charts with moving-average smoothing (configurable window)
- Sentiment trend analysis over configurable date ranges
- Upcoming review load view (next N days)
- Overall solved/attempted/unsolved breakdown

**Real-Time**
- WebSocket server with JWT-authenticated connections
- Invalid token → immediate connection rejection

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Context API, Axios |
| Backend | Node.js, Express.js |
| Database | MySQL (connection pool, limit 10) |
| Auth | bcryptjs, jsonwebtoken, nodemailer |
| NLP | HuggingFace Inference API (`@huggingface/inference`) |
| Real-Time | WebSocket (`ws`) |
| Other | keyword-extractor, dotenv, cors |

---

## Project Structure

```
Peerprep/
├── new_frontend/
│   └── src/
│       ├── components/
│       │   ├── Auth/          # Signup, Login, VerifyOTP, ForgotPassword
│       │   ├── Dashboard/     # Dashboard, DSASheets, ProgressChart, NudgeCard, ReviewCard
│       │   ├── Problems/      # Problems list with filtering and progress toggle
│       │   ├── Analysis/      # Analytics and sentiment dashboards
│       │   └── Shared/        # Navbar, ProtectedRoute
│       ├── context/           # AuthContext (global auth state)
│       └── api/               # Axios instance and API helpers
│
└── peerprep-backend/
    ├── controllers/           # authController, otpController, reflectionController,
    │                          # userProgressController, analysisController, sheetsController
    ├── routes/
    │   ├── private/           # JWT-protected: auth, progress, reflections, analysis
    │   └── public/            # Open: sheets, problems
    ├── middleware/            # authMiddleware (JWT verification)
    ├── Database/
    │   ├── Schema.sql         # Core tables
    │   └── Users_Schmea.sql   # Users, progress, reflections, OTP tables
    ├── db.js                  # MySQL connection pool
    └── server.js              # Express app + WebSocket server
```

---

## Database Schema

```sql
-- Core tables
problems        (problem_id, title, URL, platform, difficulty, category)
sheets          (sheet_id, name, description)
problem_sheets  (id, problem_id, sheet_id, sheet_order, sheet_title)

-- User tables
users           (user_id, username, email, user_password, first_name, last_name,
                 user_role ENUM, acc_status ENUM, time_created, time_updated)
user_progress   (progress_id, user_id, problem_id,
                 problem_status ENUM('Solved','Attempted','Unsolved'),
                 time_created, time_updated)
                 UNIQUE (user_id, problem_id)

-- Reflection & review
reflections     (reflection_id, user_id, problem_id, reflection_text,
                 sentiment ENUM('Positive','Neutral','Negative'),
                 keywords, confidence_score, review_date, completed,
                 created_at, updated_at)
                 UNIQUE (user_id, problem_id)

otp_verifications (id, email, otp, created_at, expires_at)
```

---

## API Endpoints

### Public
| Method | Route | Description |
|---|---|---|
| GET | `/sheets` | Get all DSA sheets |
| GET | `/problems` | Get problems (public) |

### Auth (`/auth`)
| Method | Route | Description |
|---|---|---|
| POST | `/auth/send-otp` | Send OTP to email |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/reset-password` | Reset password with OTP |
| POST | `/auth/signup` | Register (requires OTP) |
| POST | `/auth/login` | Login (issues JWT) |
| GET | `/auth/profile` | Get profile (protected) |

### Progress (`/progress`) — JWT required
| Method | Route | Description |
|---|---|---|
| GET | `/progress/sheet/:sheet_id` | Problems + user progress for a sheet |
| POST | `/progress/update` | Update problem status |
| GET | `/progress/summary` | Per-sheet progress summary |
| GET | `/progress/user/:user_id/sheets` | Sheet progress for user |

### Reflections (`/reflections`) — JWT required
| Method | Route | Description |
|---|---|---|
| POST | `/reflections/` | Add/update reflection (triggers NLP) |
| GET | `/reflections/` | Get all reflections for user |
| GET | `/reflections/:problem_id` | Get reflection for one problem |
| PUT | `/reflections/:problem_id` | Re-analyze and update reflection |
| DELETE | `/reflections/:problem_id` | Delete reflection |
| GET | `/reflections/today` | Get today's review queue |
| GET | `/reflections/all` | Full review history |
| PATCH | `/reflections/completion` | Update review completion status |

### Analysis (`/analysis`) — JWT required
| Method | Route | Description |
|---|---|---|
| GET | `/analysis/progress` | Time-series progress (filter by sheet/days) |
| GET | `/analysis/sentiment` | Sentiment trend with moving average |
| GET | `/analysis/review-status` | Upcoming review load |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MySQL 8+
- HuggingFace account (for NLP API token)
- Gmail account (for OTP emails)

### Backend Setup

```bash
cd peerprep-backend
npm install
```

Create a `.env` file:

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_NAME=peerprep

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

HF_TOKEN=your_huggingface_token
```

Run the database schema files in order:
```bash
mysql -u root -p peerprep < Database/Schema.sql
mysql -u root -p peerprep < Database/Users_Schmea.sql
mysql -u root -p peerprep < Database/Data/data.sql
```

Start the backend:
```bash
npm start
# Server runs at http://localhost:5000
```

### Frontend Setup

```bash
cd new_frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## How Spaced Repetition Works

When a user submits a reflection, the system computes a `review_date` automatically:

```
base_days          = sentiment score  → Negative: 1, Neutral: 3, Positive: 5
difficulty_days    = problem difficulty → Easy: +5, Medium: +2-4, Hard: +2
confidence_penalty = confidence < 0.5  → +1 day

review_date = today + base_days + difficulty_days + confidence_penalty
```

On the review date, the problem appears in the user's daily review queue. Completing it marks it done; incomplete reviews stay visible until resolved.

---
