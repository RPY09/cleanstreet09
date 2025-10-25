import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingReview: 0,
    resolvedThisMonth: 0,
    totalUsers: 0
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockStats = {
      totalComplaints: 42,
      pendingReview: 12,
      resolvedThisMonth: 8,
      totalUsers: 156
    };
    setStats(mockStats);
  }, []);

  // Redirect non-admin users
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="not-authorized">
            <h2>Access Denied</h2>
            <p>You must be an administrator to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p>Manage complaints, users, and system analytics</p>
        </div>

        <div className="admin-layout">
          {/* Sidebar */}
          <nav className="admin-sidebar">
            <button 
              className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'complaints' ? 'active' : ''}`}
              onClick={() => setActiveTab('complaints')}
            >
              🗂️ Manage Complaints
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Users
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              📈 Reports
            </button>
          </nav>

          {/* Main Content */}
          <div className="admin-content">
            {activeTab === 'overview' && (
              <div className="tab-content">
                <h2>System Overview</h2>
                
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <div className="admin-stat-value">{stats.totalComplaints}</div>
                    <div className="admin-stat-label">Total Complaints</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-value">{stats.pendingReview}</div>
                    <div className="admin-stat-label">Pending Review</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-value">{stats.resolvedThisMonth}</div>
                    <div className="admin-stat-label">Resolved This Month</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-value">{stats.totalUsers}</div>
                    <div className="admin-stat-label">Total Users</div>
                  </div>
                </div>

                <div className="community-impact">
                  <h3>Community Impact</h3>
                  <div className="impact-card">
                    <p>
                      Thanks to citizen reports and community engagement, 
                      we've resolved <strong>{stats.resolvedThisMonth} issues</strong> this month, 
                      making our city cleaner and safer for everyone.
                    </p>
                  </div>
                </div>

                <div className="recent-activity">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-icon">🆕</div>
                      <div className="activity-content">
                        <strong>New complaint reported</strong>
                        <span>Pothole on Main Street</span>
                      </div>
                      <div className="activity-time">2 hours ago</div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon">✅</div>
                      <div className="activity-content">
                        <strong>Complaint resolved</strong>
                        <span>Broken streetlight on Oak Ave</span>
                      </div>
                      <div className="activity-time">5 hours ago</div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon">👤</div>
                      <div className="activity-content">
                        <strong>New user registered</strong>
                        <span>John Doe joined CleanStreet</span>
                      </div>
                      <div className="activity-time">1 day ago</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'complaints' && (
              <div className="tab-content">
                <h2>Manage Complaints</h2>
                <p>Review and manage all reported complaints</p>
                <div className="coming-soon">
                  <h3>Complaint Management Interface</h3>
                  <p>This section will allow you to view, filter, and manage all complaints.</p>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="tab-content">
                <h2>User Management</h2>
                <p>Manage user accounts and permissions</p>
                <div className="coming-soon">
                  <h3>User Management Interface</h3>
                  <p>This section will allow you to manage all user accounts.</p>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="tab-content">
                <h2>Analytics & Reports</h2>
                <p>View system analytics and generate reports</p>
                <div className="coming-soon">
                  <h3>Reporting Dashboard</h3>
                  <p>This section will provide detailed analytics and reporting features.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;