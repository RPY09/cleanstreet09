import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();
const API_URL = `${process.env.REACT_APP_API_URL}/api/auth`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // ✅ Lazy initialization (NO effect needed)
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // ✅ Effect only syncs external system (axios)
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // helper: set token + user everywhere
  const loginWithToken = (newToken, newUser) => {
    if (!newToken) return;

    localStorage.setItem("token", newToken);
    setToken(newToken);

    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { user: respUser, token: respToken } = response.data;

      if (respUser && respUser.location && !respUser.postalCode) {
        const extracted = respUser.location.match(/\b\d{6}\b/);
        if (extracted) respUser.postalCode = extracted[0];
      }

      loginWithToken(respToken, respUser);
      return { success: true, user: respUser };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Login failed. Please check your network.",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      const { user: respUser, token: respToken } = response.data;

      loginWithToken(respToken, respUser);
      return { success: true, user: respUser };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Registration failed. Please check your network.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (userData) => {
    try {
      const response = await axios.put(`${API_URL}/profile`, userData);
      if (response.data.success) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: "Update failed" };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Server error during profile update.",
      };
    }
  };

  const updatePassword = async (passwords) => {
    try {
      const response = await axios.put(`${API_URL}/change-password`, passwords);
      return response.data.success
        ? { success: true, message: response.data.message }
        : { success: false, message: "Password change failed" };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Server error during password update.",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        updateProfile,
        updatePassword,
        loginWithToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
