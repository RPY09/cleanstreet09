import React, { useState, useEffect, useRef } from "react";
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

const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Dashboard = () => {
  const { user } = useAuth();
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

  // --- Data Fetching ---
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BACKEND_URL}/api/issues`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allIssues = [
          ...(res.data.localIssues || []),
          ...(res.data.otherIssues || []),
        ];

        const issuesWithCoords = allIssues.filter(
          (issue) =>
            (issue.location && issue.location.lng && issue.location.lat) ||
            (issue.longitude && issue.latitude)
        );

        const userPostal = user?.postalCode || "";
        const areaIssues = allIssues.filter(
          (issue) => issue.postalCode === userPostal
        );

        const total = areaIssues.length;
        const pending = areaIssues.filter(
          (i) => i.status === "reported"
        ).length;
        const inProgress = areaIssues.filter(
          (i) => i.status === "in progress"
        ).length;
        const resolved = areaIssues.filter(
          (i) => i.status === "resolved"
        ).length;

        setStats({ totalIssues: total, pending, inProgress, resolved });

        setMapIssues(issuesWithCoords);

        setActivities(
          areaIssues.slice(0, 5).map((issue) => ({
            id: issue._id,
            title: issue.title,
            status: issue.status,
            time: new Date(issue.createdAt).toLocaleDateString(),
          }))
        );
      } catch (err) {
        console.error("Error fetching issues:", err);
      }
    };

    if (user) fetchIssues();
  }, [user]);

  // Get coordinates from postal code or address
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
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      } else {
        console.warn("No coordinates found for postal code:", postalCode);
        return { lat: 17.385, lng: 78.4867 }; // Default: Hyderabad
      }
    } catch (err) {
      console.error("Error fetching geocode:", err);
      return { lat: 17.385, lng: 78.4867 }; // fallback
    }
  };

  useEffect(() => {
    if (!showMap || !user) return;

    const initMap = async () => {
      const { lat, lng } = await getCoordinatesFromPostalCode(
        user.postalCode,
        user.location
      );

      if (mapRef.current && !olMap.current) {
        olMap.current = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
            vectorLayerRef.current,
          ],
          view: new View({
            center: fromLonLat([lng, lat]),
            zoom: 14,
          }),
        });
      }

      if (olMap.current) {
        olMap.current.getView().setCenter(fromLonLat([lng, lat]));
        olMap.current.getView().setZoom(14.3);
      }

      setTimeout(() => {
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

            if (!lng || !lat || isNaN(lng) || isNaN(lat)) return null;

            const feature = new Feature({
              geometry: new Point(fromLonLat([Number(lng), Number(lat)])),
            });
            feature.setStyle(
              new Style({
                image: new Icon({
                  src: CleanStreetPointer,
                  scale: 0.06,
                  anchor: [0.5, 1],
                }),
              })
            );
            return feature;
          })
          .filter(Boolean);

        vectorSourceRef.current.addFeatures(features);
        olMap.current.updateSize();
      }, 300);
    };

    initMap();

    return () => {
      if (!showMap && olMap.current) {
        olMap.current.setTarget(null);
        olMap.current = null;
      }
    };
  }, [showMap, user, mapIssues]);

  const getStatusClass = (status) => {
    const rawStatus = (status || "").toLowerCase().replace(/_/g, "-");
    const statusMap = {
      resolved: "status-resolved",
      reported: "status-reported",
      updated: "status-updated",
      "in-progress": "status-in-progress",
    };
    return statusMap[rawStatus] || "status-default";
  };

  const getStatusText = (status) => {
    const rawStatus = (status || "").toLowerCase().replace(/_/g, " ");
    const statusMap = {
      resolved: "Resolved",
      reported: "Reported",
      updated: "Updated",
      "in progress": "In Progress",
    };
    return (
      statusMap[rawStatus] || rawStatus.replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <h1>Dashboard</h1>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalIssues}</div>
            <div className="stat-label">Total Issues</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Reported (Pending)</div>
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

        {/* Activities */}
        <section className="activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-table">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="activity-row">
                  <div className="activity-details">
                    <div className="issue-title">{activity.title}</div>
                    <div className="issue-time">{activity.time}</div>
                  </div>
                  <div
                    className={`activity-status ${getStatusClass(
                      activity.status
                    )}`}
                  >
                    {getStatusText(activity.status)}
                  </div>
                </div>
              ))
            ) : (
              <div
                className="activity-row"
                style={{ justifyContent: "center" }}
              >
                No recent activity in your area.
              </div>
            )}
          </div>
        </section>

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
            <button
              className="action-btn secondary"
              onClick={() => setShowMap(true)}
            >
              Issue Map
            </button>
          </div>
        </section>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="modal-overlay" onClick={() => setShowMap(false)}>
          <div
            className="modal-box map-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>Reported Issues Map</h2>
            <div
              ref={mapRef}
              id="issueMap"
              style={{
                height: "400px",
                width: "100%",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            ></div>
            <button className="close-btn" onClick={() => setShowMap(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
