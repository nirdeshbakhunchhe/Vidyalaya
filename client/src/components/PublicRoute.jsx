import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Always allow access to public pages (login/signup),
  // even if a token already exists in localStorage.
  return children;
};

export default PublicRoute;

