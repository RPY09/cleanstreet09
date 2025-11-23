import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";
import axios from "axios";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";

import CleanStreetPointer from "../assets/cleanstreetPointer.png";
import RedPointer from "../assets/redpointer.png";
import YellowPointer from "../assets/yellowpointer.png";

const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getCoordinatesFromPostalCode = async (postalCode, locationText) => {
  try {
    const query = postalCode || locationText;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`
    );

    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }

    return { lat: 17.385, lng: 78.4867 };
  } catch (err) {
    return { lat: 17.385, lng: 78.4867 };
  }
};

const AdminDashboard = () => {
  const { user } = useAuth();

  const isGlobalAdmin = user?.role === "globaladmin";

  const [stats, setStats] = useState({
    totalIssues: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [activities, setActivities] = useState([]);
  const [mapIssues, setMapIssues] = useState([]);

  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const olMap = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const vectorLayerRef = useRef(
    new VectorLayer({ source: vectorSourceRef.current })
  );

  const fetchIssues = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${BACKEND_URL}/api/issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Combine various issue arrays returned by backend
      const lists = [
        res.data?.localIssues,
        res.data?.myAreaReports,
        res.data?.otherIssues,
        res.data?.otherReports,
        res.data?.issues,
      ];

      const all = [];
      lists.forEach((l) => Array.isArray(l) && all.push(...l));

      if (all.length === 0 && Array.isArray(res.data)) {
        all.push(...res.data);
      }

      // Deduplicate
      const seen = new Set();
      const unique = [];

      for (const issue of all) {
        const id = issue?._id || issue?.id;
        if (!id) continue;

        if (!seen.has(id)) {
          seen.add(id);
          unique.push(issue);
        }
      }

      const userPostal = (user?.postalCode || "").trim();
      let issuesToDisplay = [];

      if (isGlobalAdmin) {
        // Global Admin sees ALL issues
        issuesToDisplay = unique;
      } else {
        issuesToDisplay = unique.filter(
          (i) => (i.postalCode || "").toString().trim() === userPostal
        );
      }

      const sorted = [...issuesToDisplay].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setActivities(sorted.slice(0, 3));

      setStats({
        totalIssues: issuesToDisplay.length,
        pending: issuesToDisplay.filter(
          (i) => (i.status || "").toLowerCase() === "reported"
        ).length,
        inProgress: issuesToDisplay.filter(
          (i) => (i.status || "").toLowerCase() === "in progress"
        ).length,
        resolved: issuesToDisplay.filter(
          (i) => (i.status || "").toLowerCase() === "resolved"
        ).length,
      });

      setMapIssues(issuesToDisplay);
    } catch (err) {
      console.error("Error fetching issues:", err);
    }
  }, [user, isGlobalAdmin]);

  useEffect(() => {
    // Only fetch if user object is available (user logged in)
    if (user) {
      fetchIssues();
    }
  }, [user, fetchIssues]);

  useEffect(() => {
    if (!showMap || !user) return;

    const initMap = async () => {
      let coords;

      if (isGlobalAdmin) {
        // Center of India for global admin (or a better global center)
        coords = { lat: 20.5937, lng: 78.9629 };
      } else {
        coords = await getCoordinatesFromPostalCode(
          user.postalCode,
          user.location
        );
      }

      const center = fromLonLat([coords.lng, coords.lat]);

      if (!olMap.current) {
        olMap.current = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({ source: new OSM() }),
            vectorLayerRef.current,
          ],
          view: new View({
            center,
            zoom: isGlobalAdmin ? 5 : 14,
          }),
        });
      } else {
        olMap.current.setTarget(mapRef.current);
        olMap.current.getView().setCenter(center);
        olMap.current.getView().setZoom(isGlobalAdmin ? 5 : 14);
      }

      vectorSourceRef.current.clear();

      const features = mapIssues
        .map((issue) => {
          const lng =
            issue.location?.lng ||
            issue.longitude ||
            issue.location?.coordinates?.[0];

          const lat =
            issue.location?.lat ||
            issue.latitude ||
            issue.location?.coordinates?.[1];

          if (!lng || !lat) return null;

          const priority = (issue.priority || "").toLowerCase();
          let icon = CleanStreetPointer;

          if (priority === "high") icon = RedPointer;
          else if (priority === "medium") icon = YellowPointer;

          const feature = new Feature({
            geometry: new Point(fromLonLat([Number(lng), Number(lat)])),
          });

          feature.setStyle(
            new Style({
              image: new Icon({
                src: icon,
                scale: 0.06,
                anchor: [0.5, 1],
              }),
            })
          );

          return feature;
        })
        .filter(Boolean);

      vectorSourceRef.current.addFeatures(features);

      setTimeout(() => {
        olMap.current.updateSize();
        olMap.current.getView().setCenter(center);
      }, 400);
    };

    initMap();

    return () => {
      if (olMap.current) olMap.current.setTarget(null);
    };
  }, [showMap, mapIssues, user, isGlobalAdmin]);

  const getStatusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "resolved") return "status-resolved";
    if (s === "reported") return "status-reported";
    if (s === "in progress") return "status-in-progress";
    return "";
  };

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">
        {isGlobalAdmin ? "Global Admin Dashboard" : "Dashboard"}
      </h1>

      <p className="dashboard-subtitle">
        {isGlobalAdmin
          ? "You are viewing all complaints across all areas."
          : "See what issues your community is reporting and show your support"}
      </p>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <i className="bi bi-exclamation-triangle"></i>
          <h2>{stats.totalIssues}</h2>
          <p>{isGlobalAdmin ? "Total Issues (All Areas)" : "Total Issues"}</p>
        </div>

        <div className="stat-card">
          <i className="bi bi-clock-history"></i>
          <h2>{stats.pending}</h2>
          <p>Pending</p>
        </div>

        <div className="stat-card">
          <i className="bi bi-hourglass-split"></i>
          <h2>{stats.inProgress}</h2>
          <p>In Progress</p>
        </div>

        <div className="stat-card">
          <i className="bi bi-check2-circle"></i>
          <h2>{stats.resolved}</h2>
          <p>Resolved</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-actions-container">
        <div className="activity-section">
          <h3>
            {isGlobalAdmin
              ? "Recent Activity (All Areas)"
              : "Recent Activity (Your Area)"}
          </h3>

          <div className="activity-table">
            {activities.length ? (
              activities.map((a) => (
                <div key={a._id} className="activity-row">
                  <div className="activity-left">
                    <i
                      className={`bi ${
                        a.status === "resolved"
                          ? "bi-check2-circle"
                          : a.status === "reported"
                          ? "bi-plus-circle"
                          : "bi-hourglass-split"
                      }`}
                    ></i>
                    <div>
                      <h4>{a.title}</h4>
                      <p>{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <span
                    className={`activity-status ${getStatusClass(a.status)}`}
                  >
                    {a.status
                      ? a.status.charAt(0).toUpperCase() + a.status.slice(1)
                      : "Reported"}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-activity">
                {isGlobalAdmin
                  ? "No activity found in the system"
                  : "No recent activity in your area"}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>

          <Link to="/report-issue" className="btns primary">
            <i className="bi bi-plus-lg me-2"></i> Report New Issue
          </Link>

          <Link to="/complaints" className="btns secondary">
            <i className="bi bi-list-ul me-2"></i> View All Complaints
          </Link>

          <button className="btns secondary" onClick={() => setShowMap(true)}>
            <i className="bi bi-geo-alt-fill me-2"></i> Issue Map
          </button>
        </div>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="modal-overlay" onClick={() => setShowMap(false)}>
          <div
            className="modal-box map-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              {isGlobalAdmin
                ? "Reported Issues Across All Areas"
                : "Reported Issues Map"}
            </h2>

            <div ref={mapRef} id="issueMap" className="map-container"></div>

            <button className="btn close-btn" onClick={() => setShowMap(false)}>
              <i className="bi bi-x-lg"></i> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
