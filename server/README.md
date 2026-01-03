# Vidyalaya Server - Authentication Backend

Backend server for the Vidyalaya AI Tutor Platform built with Node.js, Express, and MongoDB.

## Features

- ✅ User Registration & Login
- ✅ JWT-based Authentication
- ✅ Password Hashing with bcrypt
- ✅ Input Validation with express-validator
- ✅ Error Handling Middleware
- ✅ Protected Routes with Middleware
- ✅ Role-based Authorization (student, teacher, admin)

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/vidyalaya
# For MongoDB Atlas (cloud), use: mongodb+srv://username:password@cluster.mongodb.net/vidyalaya

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d
```

**Important:** Change `JWT_SECRET` to a strong random string in production!

### 3. Start MongoDB

Make sure MongoDB is running on your system. If you haven't installed it:

- **Windows/Mac:** Download from [MongoDB Website](https://www.mongodb.com/try/download/community)
- **Docker:** `docker run -d -p 27017:27017 --name mongodb mongo`

Or use MongoDB Atlas (cloud) and update `MONGODB_URI` in `.env`.

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## API Endpoints

### Authentication Routes

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student" // optional: "student" | "teacher" | "admin"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### Get Current User (Protected)
- **GET** `/api/auth/me`
- **Headers:**
  ```
  Authorization: Bearer <jwt_token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "avatar": "",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

## Project Structure

```
server/
├── config/
│   └── database.js       # MongoDB connection
├── models/
│   └── User.js           # User model/schema
├── routes/
│   └── auth.js           # Authentication routes
├── middleware/
│   ├── auth.js           # JWT authentication middleware
│   └── errorHandler.js   # Error handling middleware
├── server.js             # Main server file
├── package.json          # Dependencies
└── .env                  # Environment variables (create this)
```

## Using the Authentication Middleware

To protect routes in your application:

```javascript
import { protect } from './middleware/auth.js';

router.get('/protected-route', protect, asyncHandler(async (req, res) => {
  // req.user contains the authenticated user
  res.json({ user: req.user });
}));
```

For role-based access:

```javascript
import { protect, authorize } from './middleware/auth.js';

router.get('/admin-route', protect, authorize('admin'), asyncHandler(async (req, res) => {
  // Only admins can access this route
  res.json({ message: 'Admin access granted' });
}));
```

## Error Handling

All routes use async error handling. Errors are automatically caught and formatted with appropriate status codes.

## Next Steps

- Add email verification
- Add password reset functionality
- Add refresh token support
- Add rate limiting
- Add request logging

