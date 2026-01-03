# Vidyalaya Client - Frontend Application

Modern React frontend for the Vidyalaya AI Tutor Platform built with Vite, React Router, and Tailwind CSS.

## Features

- ✅ Modern UI with Tailwind CSS
- ✅ User Authentication (Login/Signup)
- ✅ Protected Routes
- ✅ Automatic Redirects (unauthenticated → login, authenticated → home)
- ✅ JWT Token Management
- ✅ Responsive Design
- ✅ Dark Mode Support
- ✅ Premium UI/UX

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Context API** - State management

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

### 4. Build for Production

```bash
npm run build
```

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.jsx    # Route guard for authenticated pages
│   │   └── PublicRoute.jsx       # Route guard for public pages (login/signup)
│   ├── context/
│   │   └── AuthContext.jsx       # Authentication context
│   ├── pages/
│   │   ├── Login.jsx             # Login page
│   │   ├── Signup.jsx            # Signup page
│   │   └── Home.jsx              # Home page (protected)
│   ├── services/
│   │   └── api.js                # API service with axios
│   ├── App.jsx                   # Main app component with routes
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles (Tailwind)
├── public/                       # Static assets
├── index.html                    # HTML template
├── tailwind.config.js            # Tailwind configuration
├── vite.config.js                # Vite configuration
└── package.json                  # Dependencies
```

## Routing

- `/` - Redirects to `/home`
- `/login` - Login page (public, redirects to home if authenticated)
- `/signup` - Signup page (public, redirects to home if authenticated)
- `/home` - Home page (protected, redirects to login if not authenticated)

## Authentication Flow

1. User visits any route
2. If not authenticated and accessing protected route → redirect to `/login`
3. If authenticated and accessing login/signup → redirect to `/home`
4. JWT token stored in localStorage
5. Token automatically included in API requests via axios interceptor

## API Integration

The app communicates with the backend API at the URL specified in `VITE_API_URL`. Make sure your backend server is running before starting the frontend.

## Development

- **Hot Module Replacement (HMR)** - Changes reflect instantly
- **Fast Refresh** - React component state preserved during development
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
