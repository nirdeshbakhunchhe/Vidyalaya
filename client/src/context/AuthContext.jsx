import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (user?.themePreference === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [user?.themePreference]);

  const toggleTheme = async () => {
    if (!user) return;
    const newTheme = user.themePreference === 'dark' ? 'light' : 'dark';
    
    // Optimistic UI update
    const previousTheme = user.themePreference;
    setUser(prev => ({ ...prev, themePreference: newTheme }));
    
    try {
      await authAPI.updateTheme(newTheme);
    } catch (error) {
      console.error('Failed to update theme:', error);
      // Revert optimistic update
      setUser(prev => ({ ...prev, themePreference: previousTheme }));
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token: newToken, user: userData } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  // Legacy helper; kept for compatibility (no longer auto‑logs in)
  const register = async (name, email, password, role = 'student') => {
    try {
      const data = await authAPI.signup({ name, email, password, role });
      return { success: data.success, message: data.message, email: data.email };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'Registration failed',
      };
    }
  };

  // signup now only triggers backend registration + OTP email; it does not log in.
  const signup = async (payload) => {
    const data = await authAPI.signup(payload);
    return data;
  };

  const verifyOtpAndLogin = async (email, otp) => {
    const data = await authAPI.verifyOtp(email, otp);
    if (data.pendingApproval) {
      return data;
    }
    const { token: newToken, user: userData } = data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    signup,
    verifyOtpAndLogin,
    logout,
    updateUser,
    toggleTheme,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};