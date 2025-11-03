import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIssues: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [activities, setActivities] = useState([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockStats = {
      totalIssues: 4,
      pending: 4,
      inProgress: 0,
      resolved: 0
    };

    const mockActivities = [
      { id: 1, title: 'Pothole on Main Street', status: 'resolved', time: '2 hours ago' },
      { id: 2, title: 'New Streetlight Issue', status: 'reported', time: '4 hours ago' },
      { id: 3, title: 'Garbage dump complaint', status: 'updated', time: '6 hours ago' }
    ];

    setStats(mockStats);
    setActivities(mockActivities);
  }, []);

  const getStatusClass = (status) => {
    const statusMap = {
      'resolved': 'status-resolved',
      'reported': 'status-reported',
      'updated': 'status-updated',
      'in_progress': 'status-in-progress'
    };
    return statusMap[status] || 'status-default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'resolved': 'Resolved',
      'reported': 'Reported',
      'updated': 'Updated',
      'in_progress': 'In Progress'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <h1>Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalIssues}</div>
            <div className="stat-label">Total Issues</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Recent Activity */}
        <section className="activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-table">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-row">
                <div className="activity-details">
                  <div className="issue-title">{activity.title}</div>
                  <div className="issue-time">{activity.time}</div>
                </div>
                <div className={`activity-status ${getStatusClass(activity.status)}`}>
                  {getStatusText(activity.status)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider"></div>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/report-issue" className="action-btn primary">
              + Report New Issue
            </Link>
            <Link to="/complaints" className="action-btn secondary">
              View All Complaints
            </Link>
            <button className="action-btn secondary">
              Issue Map
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;