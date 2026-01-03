# Vidyalaya - AI Tutor Platform

A full-stack MERN application for an AI-powered tutoring platform.

## 🚀 Quick Start

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `env.template`):
```bash
cp env.template .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vidyalaya
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=30d
```

5. Make sure MongoDB is running

6. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
Vidyalaya/
├── server/              # Backend (Node.js + Express + MongoDB)
│   ├── config/         # Database configuration
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── middleware/     # Auth & error handling middleware
│   └── server.js       # Entry point
│
└── client/             # Frontend (React + Vite + Tailwind)
    ├── src/
    │   ├── components/ # React components
    │   ├── context/    # React Context (Auth)
    │   ├── pages/      # Page components
    │   └── services/   # API services
    └── public/         # Static assets
```

## ✨ Features

### Backend
- User Authentication (Register/Login)
- JWT-based authentication
- Password hashing with bcrypt
- Input validation
- Error handling
- Role-based authorization
- MongoDB integration

### Frontend
- Modern, premium UI with Tailwind CSS
- User Registration & Login
- Protected Routes
- Automatic redirects based on auth status
- Responsive design
- Dark mode support
- JWT token management

## 🔐 Authentication Flow

1. **Not Authenticated:**
   - Accessing protected routes → Redirects to `/login`
   - Can access `/login` and `/signup`

2. **Authenticated:**
   - Accessing `/login` or `/signup` → Redirects to `/home`
   - Can access all protected routes
   - Token stored in localStorage

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- express-validator

### Frontend
- React 19
- Vite
- React Router
- Tailwind CSS
- Axios
- Context API

## 📖 Documentation

- [Backend README](server/README.md)
- [Frontend README](client/README.md)

## 🔄 Development Workflow

1. Start MongoDB
2. Start backend server (`cd server && npm run dev`)
3. Start frontend dev server (`cd client && npm run dev`)
4. Open `http://localhost:5173` in your browser

## 📄 License

ISC

