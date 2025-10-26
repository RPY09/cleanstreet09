import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();
const API_URL = "http://localhost:5000/api/auth";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem("user");
    // In a production app check the validity of the JWT token here
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { user, token } = response.data;

      // Store token and user data upon success
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true, user: user };
    } catch (error) {
      // Get error message from the backend response (e.g., 'Invalid credentials')
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your network.";
      return { success: false, message: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);

      const { user, token } = response.data;

      // Store token and user data upon success
      localStorage.setItem("token", token);
      localStorage.removeItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true, user: user };
    } catch (error) {
      // Get error message from the backend response (e.g., 'Email already registered')
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please check your network.";
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // Clear the token too
  };

  const updateProfile = async (userData) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(`${API_URL}/profile`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const updatedUser = response.data.user;

        // Update local state and localStorage with the new data
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        return {
          success: true,
          user: updatedUser,
          message: response.data.message,
        };
      }
      return {
        success: false,
        message: response.data.message || "Update failed.",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Server error during profile update.";
      return { success: false, message: errorMessage };
    }
  };

  // ...
  // Add updateProfile to the returned value object
  const value = {
    user,
    login,
    register,
    logout,
    loading,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
