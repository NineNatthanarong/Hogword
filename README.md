# HogWord - English Sentence Practice Application

A gamified English learning application that helps users practice creating sentences with vocabulary words. This project demonstrates a modern full-stack application architecture with a FastAPI backend and Next.js frontend.

> **Note:** This is a legacy project maintained for design showcase purposes. The frontend runs with dummy data and does not require backend connectivity.

## 🎯 Project Overview

HogWord is an interactive English learning platform where users:
- Receive vocabulary words at different difficulty levels (beginner, intermediate, advanced)
- Practice creating sentences using those words
- Receive AI-powered feedback and scoring (1-10 scale)
- Track their progress through analytics and daily statistics
- Build consistent learning habits through gamification

## 🏗️ Architecture

### Frontend (Next.js 16 + TypeScript)
- **Framework:** Next.js 16 with App Router
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts for data visualization
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Backend (FastAPI + Python)
- **Framework:** FastAPI with async support
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT-based auth
- **AI Integration:** n8n webhooks for sentence validation
- **Deployment:** Docker containerization

## 📁 Project Structure

```
AIE312-Final-Project/
├── front-end/                  # Next.js application
│   ├── app/
│   │   ├── page.tsx           # Login/Signup page
│   │   ├── challenge/         # Word challenge interface
│   │   ├── summary/           # Analytics dashboard
│   │   └── components/        # Reusable UI components
│   └── package.json
│
└── back-end/                   # FastAPI application
    └── hogword/
        ├── app/
        │   ├── routers/       # API endpoints
        │   ├── services/      # Business logic
        │   ├── models/        # Data schemas
        │   └── db/            # Database connections
        ├── Dockerfile
        ├── docker-compose.yml
        └── requirements.txt
```

## 🚀 Getting Started

### Frontend Setup (Standalone - No Backend Required)

The frontend now runs with dummy data for design showcase:

```bash
cd front-end
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

**Features available in demo mode:**
- Complete UI/UX design showcase
- Interactive word challenge interface
- Analytics dashboard with sample data
- Responsive design across all devices

### Backend Setup (Optional - For Full Functionality)

<details>
<summary>Click to expand backend setup instructions</summary>

#### Prerequisites
- Python 3.9+
- PostgreSQL (via Supabase)
- n8n instance for AI validation

#### Installation

1. Navigate to backend directory:
```bash
cd back-end/hogword
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

4. Set up database:
```bash
# Run schema.sql in your Supabase SQL Editor
```

5. Run locally:
```bash
uvicorn app.main:app --reload
```

#### Docker Deployment

```bash
docker-compose up -d
```

</details>

## 💻 Technologies Used

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Recharts** - Data visualization library
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database with real-time features
- **n8n** - Workflow automation for AI integration
- **Docker** - Containerization platform
- **JWT** - Token-based authentication

## 🎨 Features

### User Authentication
- Simple email/password authentication
- Automatic login persistence
- Secure token-based sessions

### Challenge Mode
- Daily vocabulary word assignments
- Three difficulty levels
- Real-time sentence validation
- AI-powered scoring and feedback
- Sentence correction suggestions
- Skip functionality with tracking

### Analytics Dashboard
- Daily and overall average scores
- 7-day word practice trends
- Score distribution by difficulty level
- Performance scatter plots
- Skip statistics
- Historical data visualization

## 📱 Screenshots

The application features a clean, modern design with:
- Gradient backgrounds and soft shadows
- Smooth animations and transitions
- Responsive layouts for mobile and desktop
- Intuitive user interface
- Clear data visualizations

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack development with modern technologies
- RESTful API design and implementation
- Database design and optimization
- Authentication and authorization
- Real-time data synchronization
- Responsive UI/UX design
- Docker containerization
- Cloud deployment strategies

## 📝 License

This project is part of the AIE312 course final project.

## 👤 Author

Developed as part of the AIE312 Final Project