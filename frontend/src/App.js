// src/App.js

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"; // Added Navigate
import { AuthProvider, useAuth } from "./context/AuthContext"; // Added useAuth
import Navbar from "./components/Layout/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./components/Dashboard";
import ReportIssue from "./pages/ReportIssue";
import ViewComplaints from "./pages/ViewComplaints";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

// --- 1. Protected Route Component ---
// Redirects unauthenticated users to the Login page.
const ProtectedRoute = ({ element: Component, ...rest }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a loading screen while the app checks for a logged-in user in localStorage/API
    return <div className="loading-screen">Checking Authentication...</div>;
  }

  // If user is null (not logged in), redirect to login
  return user ? <Component {...rest} /> : <Navigate to="/login" replace />;
};

// --- 2. Admin Route Component ---
// Ensures the user is logged in AND has the 'admin' role.
const AdminRoute = ({ element: Component, ...rest }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Checking Authorization...</div>;
  }

  // If not logged in OR role is not 'admin', redirect to Home (or a specific unauthorized page)
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Allow access for logged-in admin
  return <Component {...rest} />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Navbar can access useAuth because it's inside AuthProvider */}
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes (Requires Login) */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute element={Dashboard} />}
              />
              <Route
                path="/report-issue"
                element={<ProtectedRoute element={ReportIssue} />}
              />
              <Route
                path="/complaints"
                element={<ProtectedRoute element={ViewComplaints} />}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute element={Profile} />}
              />

              {/* Admin Protected Route (Requires Admin Role) */}
              <Route
                path="/admin"
                element={<AdminRoute element={AdminDashboard} />}
              />

              {/* Fallback 404 Route */}
              <Route
                path="*"
                element={
                  <div className="container">
                    <h1>404 Not Found</h1>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
