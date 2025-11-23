import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminReports.css";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AdminReports = () => {
  const { user } = useAuth();

  const [reports, setReports] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    newUsersThisRange: 0,
    complaintResolutionRate: 0,
    userGrowth: [],
    complaintTrends: [],
    systemMetrics: {},
    lastUpdated: null,
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [error, setError] = useState(null);

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/reports?range=${timeRange}`);
      const data = res.data && res.data.success ? res.data : res.data || {};

      const mapped = {
        totalUsers: Number(data.totalUsers ?? 0),
        activeUsers: Number(data.activeUsers ?? data.totalUsers ?? 0),
        totalComplaints: Number(data.totalComplaints ?? 0),
        resolvedComplaints: Number(data.resolvedComplaints ?? 0),
        pendingComplaints: Number(data.pendingComplaints ?? 0),
        newUsersThisRange: Number(
          data.newUsersThisRange ?? data.newUsersThisMonth ?? 0
        ),
        complaintResolutionRate: Number(data.complaintResolutionRate ?? 0),
        userGrowth: Array.isArray(data.userGrowth) ? data.userGrowth : [],
        complaintTrends: Array.isArray(data.complaintTrends)
          ? data.complaintTrends
          : [],
        systemMetrics: data.systemMetrics ?? {},
        issueStatusCounts:
          typeof data.issueStatusCounts === "object" &&
          data.issueStatusCounts !== null
            ? data.issueStatusCounts
            : { reported: 0, "in progress": 0, resolved: 0, rejected: 0 },
        priorityCounts:
          typeof data.priorityCounts === "object" &&
          data.priorityCounts !== null
            ? data.priorityCounts
            : { high: 0, medium: 0, low: 0 },
        lastUpdated: new Date().toISOString(),
      };

      setReports(mapped);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to load reports. Check console for details.");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const exportReport = (format) => {
    if (format === "csv") {
      const rows = [
        ["metric", "value"],
        ["totalUsers", reports.totalUsers],
        ["activeUsers", reports.activeUsers],
        ["totalComplaints", reports.totalComplaints],
        ["resolvedComplaints", reports.resolvedComplaints],
        ["pendingComplaints", reports.pendingComplaints],
        ["newUsersThisRange", reports.newUsersThisRange],
        ["complaintResolutionRate", reports.complaintResolutionRate],
      ];
      const csvContent = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin_report_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      return;
    }

    const dataStr = JSON.stringify(reports, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_report_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // FIXED: Use (data || {}) as a fallback for Object.entries to prevent error
  const buildDonut = (data = {}, colors = []) => {
    if (!data || typeof data !== "object") {
      return "conic-gradient(#eee 0deg 360deg)";
    }

    const entries = Object.entries(data || {}); // <-- FIX 1: Defensive coding
    const total = entries.reduce((sum, [, v]) => sum + (Number(v) || 0), 0);

    if (total === 0) {
      return "conic-gradient(#eee 0deg 360deg)";
    }

    let start = 0;
    const gradientParts = entries.map(([key, value], i) => {
      const val = Number(value) || 0;
      const percent = (val / total) * 100;
      const color = colors[i % colors.length] || "#ccc";
      const seg = `${color} ${start}% ${start + percent}%`;
      start += percent;
      return seg;
    });

    return `conic-gradient(${gradientParts.join(", ")})`;
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (user && ["admin", "globaladmin"].includes(user.role)) {
        if (mounted) await fetchReportsData();
      } else {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user, timeRange, fetchReportsData]);

  const userEngagementRate =
    reports.totalUsers > 0
      ? Math.round((reports.activeUsers / reports.totalUsers) * 100)
      : 0;

  // Access control: only admins allowed
  if (!user || !["admin", "globaladmin"].includes(user.role)) {
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
            <p>View system analytics and generate detailed reports (live)</p>
          </div>
          <div className="header-actions">
            <button
              className="btn export-primary"
              onClick={() => exportReport("json")}
            >
              <span className="btn-icon">
                <i class="bi bi-download"></i>
              </span>
              Export Report
            </button>
          </div>
        </div>

        {error ? (
          <div className="section">
            <h3>Error</h3>
            <p style={{ color: "red" }}>{error}</p>
          </div>
        ) : null}

        {/* Key Metrics Section */}
        <div className="section">
          <h2>Key Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">
                <span>
                  <i class="bi bi-people"></i>
                </span>
              </div>
              <div className="metric-content">
                <h3>Total Users</h3>
                <p className="metric-value">
                  {reports.totalUsers.toLocaleString()}
                </p>
                <p className="metric-change positive">
                  <strong>New This Range:</strong> {reports.newUsersThisRange}
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <span>
                  <i class="bi bi-person-check"></i>
                </span>
              </div>
              <div className="metric-content">
                <h3>Active Users</h3>
                <p className="metric-value">
                  {reports.activeUsers.toLocaleString()}
                </p>
                <p className="metric-subtitle">
                  {userEngagementRate}% engagement rate
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <span>
                  <i class="bi bi-exclamation-triangle"></i>
                </span>
              </div>
              <div className="metric-content">
                <h3>Total Complaints</h3>
                <p className="metric-value">
                  {reports.totalComplaints.toLocaleString()}
                </p>
                <p className="metric-subtitle">
                  {reports.pendingComplaints} pending resolution
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <span>
                  <i class="bi bi-bullseye"></i>
                </span>
              </div>
              <div className="metric-content">
                <h3>Resolution Rate</h3>
                <p className="metric-value">
                  {reports.complaintResolutionRate}%
                </p>
                <p className="metric-change positive">
                  {reports.resolvedComplaints} resolved •{" "}
                  {reports.systemMetrics.avgResponseTime ?? "—"} avg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reporting Dashboard Section */}
        <div className="section">
          <div className="section-header">
            <div>
              <h2>Reporting Dashboard</h2>
              <p>Live analytics and performance metrics</p>
            </div>
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
                    <button
                      className="btn btn-outline"
                      onClick={fetchReportsData}
                    >
                      <i class="bi bi-arrow-clockwise"></i>
                      Refresh Data
                    </button>
                  </div>
                </div>
                <div className="chart-placeholder">
                  <div className="data-chart">
                    <div className="chart-bars">
                      {reports.userGrowth.length === 0 ? (
                        <div style={{ color: "#163832" }}>
                          No user growth data
                        </div>
                      ) : (
                        reports.userGrowth.map((item, index) => {
                          const max = Math.max(
                            ...reports.userGrowth.map((g) => g.users),
                            1
                          );
                          const heightPct = ((item.users || 0) / max) * 80;
                          return (
                            <div key={index} className="chart-bar-container">
                              <div
                                className="chart-bar"
                                style={{ height: `${heightPct}px` }}
                                title={`${item.month}: ${item.users} users`}
                              >
                                <div className="chart-bar-value">
                                  {item.users}
                                </div>
                              </div>
                              <span className="chart-label">{item.month}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <p className="chart-description">
                      User growth over {reports.userGrowth.length} months
                    </p>
                  </div>
                </div>
              </div>

              <div className="pie-charts-wrapper">
                {/* Issue Status Donut */}
                <div className="pie-card">
                  <h4>Issue Status Distribution</h4>

                  <div
                    className="donut"
                    style={{
                      background: buildDonut(reports.issueStatusCounts, [
                        "#051f20", // reported
                        "#235347", // in progress
                        "#daf1de", // resolved
                        "#9E9E9E", // rejected
                      ]),
                    }}
                  ></div>

                  <div className="donut-legend">
                    {/* FIX 2: Use (reports.issueStatusCounts || {}) */}
                    {Object.entries(reports.issueStatusCounts || {}).map(
                      ([label, value], i) => {
                        const statusTotal = Object.values(
                          reports.issueStatusCounts || {}
                        ).reduce((a, b) => a + b, 0);

                        const percent =
                          statusTotal > 0
                            ? ((value / statusTotal) * 100).toFixed(1)
                            : 0;

                        const colors = [
                          "#051f20",
                          "#235347",
                          "#daf1de",
                          "#9E9E9E",
                        ];

                        return (
                          <div key={i} className="legend-row">
                            <span
                              className="legend-color"
                              style={{ background: colors[i] }}
                            ></span>
                            <span className="legend-text">
                              {label} — <strong>{value}</strong> ({percent}%)
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Priority Donut */}
                <div className="pie-card">
                  <h4>Priority Distribution</h4>

                  <div
                    className="donut"
                    style={{
                      background: buildDonut(reports.priorityCounts, [
                        "#051f20", // high
                        "#235347", // medium
                        "#daf1de", // low
                      ]),
                    }}
                  ></div>

                  <div className="donut-legend">
                    {/* FIX 3: Use (reports.priorityCounts || {}) */}
                    {Object.entries(reports.priorityCounts || {}).map(
                      ([key, value], idx) => (
                        <div className="legend-row" key={key}>
                          <span
                            className="legend-color"
                            style={{
                              background: ["#051f20", "#235347", "#daf1de"][
                                idx
                              ],
                            }}
                          ></span>
                          <span className="legend-label">{key}</span>
                          <span className="legend-value">{value}</span>
                        </div>
                      )
                    )}
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
                    <span className="stat-value">
                      {reports.systemMetrics.avgResponseTime ?? "—"}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">User Satisfaction</span>
                    <span className="stat-value">
                      {reports.systemMetrics.userSatisfaction ?? "—"}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">System Uptime</span>
                    <span className="stat-value">
                      {reports.systemMetrics.systemUptime ?? "—"}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Active Sessions</span>
                    <span className="stat-value">
                      {reports.systemMetrics.activeSessions ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Actions */}
              <div className="sidebar-card">
                <h5>Generate Reports</h5>
                <div className="action-buttons">
                  <button
                    className="action-btn"
                    onClick={() => exportReport("json")}
                  >
                    <span className="action-icon">
                      <i class="bi bi-clipboard2-data"></i>
                    </span>
                    JSON Report
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => exportReport("csv")}
                  >
                    <span className="action-icon">
                      <i class="bi bi-pass"></i>
                    </span>
                    CSV Export
                  </button>
                  <button className="action-btn" onClick={fetchReportsData}>
                    <span className="action-icon">
                      <i class="bi bi-arrow-clockwise"></i>
                    </span>
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
                    <span className="status-value">Live Backend</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Last Updated</span>
                    <span className="status-value">
                      {reports.lastUpdated
                        ? new Date(reports.lastUpdated).toLocaleString()
                        : new Date().toLocaleString()}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Time Range</span>
                    <span className="status-value">{timeRange}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="chart-card full-width">
            <h4>Complaint Distribution</h4>
            <div className="chart-placeholder">
              <div className="data-chart">
                <div className="complaint-categories">
                  {reports.complaintTrends.length === 0 ? (
                    <div style={{ color: "#163832" }}>No complaint trends</div>
                  ) : (
                    reports.complaintTrends.map((item, index) => (
                      <div key={index} className="category-item">
                        <span className="category-name">{item.category}</span>
                        <span className="category-count">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
                <p className="chart-description">
                  {reports.complaintTrends.length} complaint categories
                </p>
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
                <p>
                  <strong>Total Registered:</strong>{" "}
                  {reports.totalUsers.toLocaleString()}
                </p>
                <p>
                  <strong>Currently Active:</strong>{" "}
                  {reports.activeUsers.toLocaleString()}
                </p>
                <p>
                  <strong>New This Range:</strong> {reports.newUsersThisRange}
                </p>
                <p>
                  <strong>Engagement Rate:</strong> {userEngagementRate}%
                </p>
              </div>
            </div>

            <div className="summary-card">
              <h4>Complaint Analytics</h4>
              <div className="summary-content">
                <p>
                  <strong>Total Complaints:</strong>{" "}
                  {reports.totalComplaints.toLocaleString()}
                </p>
                <p>
                  <strong>Resolved:</strong>{" "}
                  {reports.resolvedComplaints.toLocaleString()}
                </p>
                <p>
                  <strong>Pending:</strong>{" "}
                  {reports.pendingComplaints.toLocaleString()}
                </p>
                <p>
                  <strong>Resolution Rate:</strong>{" "}
                  {reports.complaintResolutionRate}%
                </p>
              </div>
            </div>

            <div className="summary-card">
              <h4>System Health</h4>
              <div className="summary-content">
                <p>
                  <strong>Avg Response Time:</strong>{" "}
                  {reports.systemMetrics.avgResponseTime ?? "—"}
                </p>
                <p>
                  <strong>User Satisfaction:</strong>{" "}
                  {reports.systemMetrics.userSatisfaction ?? "—"}
                </p>
                <p>
                  <strong>System Uptime:</strong>{" "}
                  {reports.systemMetrics.systemUptime ?? "—"}
                </p>
                <p>
                  <strong>Active Sessions:</strong>{" "}
                  {reports.systemMetrics.activeSessions ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
