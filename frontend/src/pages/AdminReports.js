import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminReports.css';

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    newUsersThisMonth: 0,
    complaintResolutionRate: 0,
    userGrowth: [],
    complaintTrends: [],
    systemMetrics: {}
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Demo data - no API calls
  const demoData = {
    totalUsers: 1254,
    activeUsers: 892,
    totalComplaints: 567,
    resolvedComplaints: 423,
    pendingComplaints: 144,
    newUsersThisMonth: 89,
    complaintResolutionRate: 74.6,
    userGrowth: [
      { month: 'Jan', users: 800 },
      { month: 'Feb', users: 920 },
      { month: 'Mar', users: 1050 },
      { month: 'Apr', users: 1120 },
      { month: 'May', users: 1200 },
      { month: 'Jun', users: 1254 }
    ],
    complaintTrends: [
      { category: 'Technical', count: 245 },
      { category: 'Billing', count: 130 },
      { category: 'Service', count: 125 },
      { category: 'Account', count: 67 }
    ],
    systemMetrics: {
      avgResponseTime: '2.4h',
      userSatisfaction: '4.2/5',
      systemUptime: '99.8%',
      activeSessions: 247,
      databaseSize: '2.4 GB'
    }
  };

  const fetchReportsData = () => {
    setLoading(true);
    // Simulate API call with setTimeout
    setTimeout(() => {
      setReports(demoData);
      setLoading(false);
    }, 1000);
  };

  const exportReport = (format) => {
    const dataStr = JSON.stringify(reports, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo_report_${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert(`Demo report exported as ${format.toUpperCase()}`);
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchReportsData();
    } else {
      setLoading(false);
    }
  }, [user, timeRange]);

  // Calculate additional metrics
  const userEngagementRate = reports.totalUsers > 0 
    ? Math.round((reports.activeUsers / reports.totalUsers) * 100) 
    : 0;

  // Redirect non-admin users
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-reports">
        <div className="container">
          <div className="not-authorized">
            <h2>Access Denied</h2>
            <p>You must be an administrator to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-reports">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            Loading reports data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      <div className="container">
        {/* Header Section */}
        <div className="reports-header">
          <div className="header-content">
            <h1>Analytics & Reports</h1>
            <p>View system analytics and generate detailed reports</p>
            <div className="demo-banner">
              <span>📊 Using Demo Data - No backend connection</span>
            </div>
          </div>
          <div className="header-actions">
            <div className="time-range-selector">
              <label htmlFor="timeRange">Time Range:</label>
              <select 
                id="timeRange"
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => exportReport('json')}
            >
              <span className="btn-icon">📥</span>
              Export Report
            </button>
          </div>
        </div>

        {/* Report Type Navigation */}
        <div className="reports-navigation">
          <button 
            className={`nav-btn ${selectedReport === 'overview' ? 'active' : ''}`}
            onClick={() => setSelectedReport('overview')}
          >
            <span className="nav-icon">📊</span>
            Overview
          </button>
          <button 
            className={`nav-btn ${selectedReport === 'users' ? 'active' : ''}`}
            onClick={() => setSelectedReport('users')}
          >
            <span className="nav-icon">👥</span>
            User Analytics
          </button>
          <button 
            className={`nav-btn ${selectedReport === 'complaints' ? 'active' : ''}`}
            onClick={() => setSelectedReport('complaints')}
          >
            <span className="nav-icon">⚠️</span>
            Complaint Reports
          </button>
          <button 
            className={`nav-btn ${selectedReport === 'system' ? 'active' : ''}`}
            onClick={() => setSelectedReport('system')}
          >
            <span className="nav-icon">⚙️</span>
            System Performance
          </button>
        </div>

        {/* Key Metrics Section */}
        <div className="section">
          <h2>Key Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">
                <span>👥</span>
              </div>
              <div className="metric-content">
                <h3>Total Users</h3>
                <p className="metric-value">{reports.totalUsers.toLocaleString()}</p>
                <p className="metric-change positive">
                  +{reports.newUsersThisMonth} this month
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <span>✅</span>
              </div>
              <div className="metric-content">
                <h3>Active Users</h3>
                <p className="metric-value">{reports.activeUsers.toLocaleString()}</p>
                <p className="metric-subtitle">
                  {userEngagementRate}% engagement rate
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <span>⚠️</span>
              </div>
              <div className="metric-content">
                <h3>Total Complaints</h3>
                <p className="metric-value">{reports.totalComplaints.toLocaleString()}</p>
                <p className="metric-subtitle">
                  {reports.pendingComplaints} pending resolution
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <span>🎯</span>
              </div>
              <div className="metric-content">
                <h3>Resolution Rate</h3>
                <p className="metric-value">{reports.complaintResolutionRate}%</p>
                <p className="metric-change positive">
                  {reports.resolvedComplaints} resolved • 2.4h avg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reporting Dashboard Section */}
        <div className="section">
          <div className="section-header">
            <h2>Reporting Dashboard</h2>
            <p>Demo analytics and performance metrics</p>
          </div>

          <div className="dashboard-grid">
            {/* Charts Section */}
            <div className="charts-section">
              <div className="chart-card large">
                <div className="chart-header">
                  <h4>User Growth Trend</h4>
                  <div className="chart-actions">
                    <span className="data-info">
                      {reports.userGrowth.length} months data
                    </span>
                    <button className="btn btn-outline" onClick={fetchReportsData}>
                      Refresh Data
                    </button>
                  </div>
                </div>
                <div className="chart-placeholder">
                  <div className="data-chart">
                    <div className="chart-bars">
                      {reports.userGrowth.map((item, index) => (
                        <div key={index} className="chart-bar-container">
                          <div 
                            className="chart-bar" 
                            style={{
                              height: `${(item.users / Math.max(...reports.userGrowth.map(g => g.users))) * 80}%`
                            }}
                            title={`${item.month}: ${item.users} users`}
                          ></div>
                          <span className="chart-label">{item.month}</span>
                        </div>
                      ))}
                    </div>
                    <p className="chart-description">
                      User growth over {reports.userGrowth.length} months
                    </p>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <h4>Complaint Distribution</h4>
                <div className="chart-placeholder">
                  <div className="data-chart">
                    <div className="complaint-categories">
                      {reports.complaintTrends.map((item, index) => (
                        <div key={index} className="category-item">
                          <span className="category-name">{item.category}</span>
                          <span className="category-count">{item.count}</span>
                        </div>
                      ))}
                    </div>
                    <p className="chart-description">
                      {reports.complaintTrends.length} complaint categories
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="reports-sidebar">
              {/* Quick Stats */}
              <div className="sidebar-card">
                <h5>System Performance</h5>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-label">Avg. Response Time</span>
                    <span className="stat-value">{reports.systemMetrics.avgResponseTime}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">User Satisfaction</span>
                    <span className="stat-value">{reports.systemMetrics.userSatisfaction}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">System Uptime</span>
                    <span className="stat-value">{reports.systemMetrics.systemUptime}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Active Sessions</span>
                    <span className="stat-value">{reports.systemMetrics.activeSessions}</span>
                  </div>
                </div>
              </div>

              {/* Report Actions */}
              <div className="sidebar-card">
                <h5>Generate Reports</h5>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => exportReport('json')}>
                    <span className="action-icon">📊</span>
                    JSON Report
                  </button>
                  <button className="action-btn" onClick={() => exportReport('csv')}>
                    <span className="action-icon">📄</span>
                    CSV Export
                  </button>
                  <button className="action-btn" onClick={fetchReportsData}>
                    <span className="action-icon">🔄</span>
                    Refresh Data
                  </button>
                </div>
              </div>

              {/* Data Status */}
              <div className="sidebar-card">
                <h5>Data Status</h5>
                <div className="status-list">
                  <div className="status-item">
                    <span className="status-label">Data Source</span>
                    <span className="status-value">Demo Data</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Last Updated</span>
                    <span className="status-value">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Time Range</span>
                    <span className="status-value">{timeRange}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary Section */}
        <div className="section">
          <h3>Data Summary</h3>
          <div className="data-summary">
            <div className="summary-card">
              <h4>User Statistics</h4>
              <div className="summary-content">
                <p><strong>Total Registered:</strong> {reports.totalUsers.toLocaleString()}</p>
                <p><strong>Currently Active:</strong> {reports.activeUsers.toLocaleString()}</p>
                <p><strong>New This Month:</strong> {reports.newUsersThisMonth}</p>
                <p><strong>Engagement Rate:</strong> {userEngagementRate}%</p>
              </div>
            </div>
            <div className="summary-card">
              <h4>Complaint Analytics</h4>
              <div className="summary-content">
                <p><strong>Total Complaints:</strong> {reports.totalComplaints.toLocaleString()}</p>
                <p><strong>Resolved:</strong> {reports.resolvedComplaints.toLocaleString()}</p>
                <p><strong>Pending:</strong> {reports.pendingComplaints.toLocaleString()}</p>
                <p><strong>Resolution Rate:</strong> {reports.complaintResolutionRate}%</p>
              </div>
            </div>
            <div className="summary-card">
              <h4>System Health</h4>
              <div className="summary-content">
                <p><strong>Avg Response Time:</strong> {reports.systemMetrics.avgResponseTime}</p>
                <p><strong>User Satisfaction:</strong> {reports.systemMetrics.userSatisfaction}</p>
                <p><strong>System Uptime:</strong> {reports.systemMetrics.systemUptime}</p>
                <p><strong>Active Sessions:</strong> {reports.systemMetrics.activeSessions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;