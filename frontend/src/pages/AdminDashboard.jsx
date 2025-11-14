import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data matching your screenshot exactly
  const [dashboardData, setDashboardData] = useState({
    totalComplaints: 4,
    complaintsBreakdown: [2, 4],
    pendingReview: "Pending Review",
    activeUsers: 1234,
    resolvedToday: "Resolved Today",
    issuesResolvedThisMonth: 0
  });

  useEffect(() => {
    // Simulate API loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Redirect non-admin users
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div className="not-authorized">
          <h2>Access Denied</h2>
          <p>You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Admin Header with Tabs */}
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <nav className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            🗂️ Manage Complaints
          </button>
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button 
            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📈 Reports
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="tab-content">
            {/* System Overview Section - Exactly like your screenshot */}
            <div className="system-overview">
              <h2>System Overview</h2>
              
              <div className="overview-grid">
                {/* Total Complaints Card */}
                <div className="complaints-card">
                  <div className="card-title">Total Complaints</div>
                  <div className="main-number">{dashboardData.totalComplaints}</div>
                  <div className="breakdown">
                    <div className="breakdown-item">{dashboardData.complaintsBreakdown[0]}</div>
                    <div className="breakdown-item">{dashboardData.complaintsBreakdown[1]}</div>
                    <div className="breakdown-item pending">{dashboardData.pendingReview}</div>
                  </div>
                </div>

                {/* Active Users Card */}
                <div className="users-card">
                  <div className="main-number">{dashboardData.activeUsers}</div>
                  <div className="card-label">{dashboardData.resolvedToday}</div>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            {/* Community Impact Section - Exactly like your screenshot */}
            <div className="community-impact">
              <h2>Community Impact</h2>
              <div className="impact-content">
                <p>
                  Thanks to citizen reports and community engagement, we have resolved{" "}
                  <span className="issues-count">{dashboardData.issuesResolvedThisMonth}</span>{" "}
                  issues this month, making our city cleaner and safer for everyone.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="tab-content">
            <h2>Manage Complaints</h2>
            <div className="coming-soon">
              <p>Complaint management interface coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <h2>User Management</h2>
            <div className="coming-soon">
              <p>User management interface coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="tab-content">
            <h2>Reports & Analytics</h2>
            <div className="coming-soon">
              <p>Reports and analytics interface coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;