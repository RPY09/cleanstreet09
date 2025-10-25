import React from 'react';
import './Dashboard.css';

const Dashboard = ({ 
  statsData = {}, 
  activityData = [], 
  onReportIssue, 
  onViewComplaints, 
  onViewMap 
}) => {
  // Default empty state - data will come from backend
  const defaultStats = {
    totalIssues: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  };

  const defaultActivities = [];

  const stats = { ...defaultStats, ...statsData };
  const activities = activityData.length ? activityData : defaultActivities;

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'status-resolved';
      case 'reported': return 'status-reported';
      case 'updated': return 'status-updated';
      case 'in progress': return 'status-in-progress';
      default: return 'status-default';
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1># CleanStreet</h1>
      </header>

      <div className="dashboard-content">
        {/* Stats Section */}
        <section className="stats-section">
          <h2>Dashboard</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value" data-testid="total-issues">
                {stats.totalIssues}
              </div>
              <div className="stat-label">Total Issues</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" data-testid="pending-issues">
                {stats.pending}
              </div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" data-testid="inprogress-issues">
                {stats.inProgress}
              </div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" data-testid="resolved-issues">
                {stats.resolved}
              </div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* Recent Activity Section */}
        <section className="activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-table">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className="activity-row">
                  <div className="activity-details">
                    <div className="issue-title">{activity.issue}</div>
                    <div className="issue-time">{activity.time}</div>
                  </div>
                  <div className={`activity-status ${getStatusClass(activity.status)}`}>
                    {activity.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                No recent activity
              </div>
            )}
          </div>
        </section>

        <hr className="divider" />

        {/* Quick Actions Section */}
        <section className="actions-section">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button 
              className="action-button report-button"
              onClick={onReportIssue}
            >
              + Report New Issue
            </button>
            <button 
              className="action-button view-button"
              onClick={onViewComplaints}
            >
              View All Complaints
            </button>
            <button 
              className="action-button map-button"
              onClick={onViewMap}
            >
              Issue Map
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;