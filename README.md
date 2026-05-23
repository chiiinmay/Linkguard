# LinkGuard AI — Full Stack Setup

## Project Structure
```
linkguard/
├── frontend/          # React + Tailwind CSS + Vite
├── backend/           # Node.js + Express + Supabase
└── ml-service/        # Python FastAPI + BERT/sklearn
```

## Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account
- Google Safe Browsing API key
- VirusTotal API key (optional)

## Quick Start

### 1. Clone & install
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# ML Service
cd ml-service && pip install -r requirements.txt
```

### 2. Environment variables
Copy `.env.example` to `.env` in each folder and fill in your keys.

### 3. Database
Run `backend/supabase/schema.sql` in your Supabase SQL editor.

### 4. Train ML models (first run only)
```bash
cd ml-service && python train.py
```

### 5. Run all services
```bash
# Terminal 1 — Frontend (port 5173)
cd frontend && npm run dev

# Terminal 2 — Backend (port 3000)
cd backend && npm run dev

# Terminal 3 — ML Service (port 8000)
cd ml-service && uvicorn main:app --reload
```
