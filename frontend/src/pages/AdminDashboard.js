import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
// Mocked statistics data
  const [stats, setStats] = useState({
    totalComplaints: 4,
    pendingReview: 4,
    resolvedThisMonth: 0,
    totalUsers: 1234
  });

  
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-page">
        <div className="admin-wrapper">
          <h2>Access Denied</h2>
          <p>You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

    
      <div className="admin-wrapper">

        <h2 className="admin-title">System Overview</h2>

        {/* Stats Grid */}
        <div className="stats-grid">

          <div className="stat-card">
            <i className="bi bi-list-ul stat-icon"></i>
            <h3 className="stat-value">{stats.totalComplaints}</h3>
            <p className="stat-label">Total Complaints</p>
          </div>

          <div className="stat-card">
            <i className="bi bi-hourglass-split stat-icon"></i>
            <h3 className="stat-value">{stats.pendingReview}</h3>
            <p className="stat-label">Pending Review</p>
          </div>

          <div className="stat-card">
            <i className="bi bi-bar-chart-line-fill stat-icon"></i>
            <h3 className="stat-value">{stats.totalUsers}</h3>
            <p className="stat-label">Active Users</p>
          </div>

          <div className="stat-card">
            <i className="bi bi-patch-check-fill stat-icon"></i>
            <h3 className="stat-value">{stats.resolvedThisMonth}</h3>
            <p className="stat-label">Resolved Today</p>
          </div>

        </div>

        {/* Community Impact */}
        <div className="impact-box">
          <h3>Community Impact</h3>
          <p>
            Thanks to citizen reports and community engagement,
            we have resolved <strong>{stats.resolvedThisMonth} issues</strong> 
            this month, making our city cleaner and safer for everyone.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
