import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

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

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulate API call - replace with actual backend integration
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = {
          id: 1,
          name: 'Demo User',
          username: 'demo_user',
          email: email,
          role: 'user',
          location: 'Downtown District',
          bio: 'Active citizen helping to improve our community through CleanStreet reporting',
          memberSince: '2025-01-07'
        };
        
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        resolve({ success: true, user: mockUser });
      }, 1000);
    });
  };

  const register = async (userData) => {
    // Simulate API call - replace with actual backend integration
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = {
          id: 1,
          ...userData,
          role: 'user',
          bio: 'Active citizen helping to improve our community through CleanStreet reporting',
          memberSince: new Date().toISOString().split('T')[0]
        };
        
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        resolve({ success: true, user: mockUser });
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};