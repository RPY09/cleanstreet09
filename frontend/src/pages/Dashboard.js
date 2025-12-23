import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";
import axios from "axios";

// OpenLayers imports
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";

// Icons
import CleanStreetPointer from "../assets/cleanstreetPointer.png";
import RedPointer from "../assets/redpointer.png";
import YellowPointer from "../assets/yellowpointer.png";

const BACKEND_URL = process.env.REACT_APP_API_URL;

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
    }
    return { lat: 17.385, lng: 78.4867 };
  } catch {
    return { lat: 17.385, lng: 78.4867 };
  }
};

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
  const olMapRef = useRef(null);

  // ✅ FIXED: refs initialized safely
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);

  // ✅ Create OpenLayers objects AFTER render
  useEffect(() => {
    if (!vectorSourceRef.current) {
      vectorSourceRef.current = new VectorSource();
    }

    if (!vectorLayerRef.current) {
      vectorLayerRef.current = new VectorLayer({
        source: vectorSourceRef.current,
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadIssues = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/issues`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const lists = [
          res.data?.localIssues,
          res.data?.myAreaReports,
          res.data?.otherIssues,
          res.data?.otherReports,
          res.data?.issues,
        ];

        const flat = [];
        lists.forEach((l) => Array.isArray(l) && flat.push(...l));

        const seen = new Set();
        const unique = [];
        flat.forEach((i) => {
          if (i?._id && !seen.has(i._id)) {
            seen.add(i._id);
            unique.push(i);
          }
        });

        const userPostal = String(user.postalCode || "").trim();
        const myArea = unique.filter(
          (i) => String(i.postalCode || "").trim() === userPostal
        );

        setStats({
          totalIssues: myArea.length,
          pending: myArea.filter((i) => i.status === "reported").length,
          inProgress: myArea.filter((i) => i.status === "in progress").length,
          resolved: myArea.filter((i) => i.status === "resolved").length,
        });

        setActivities(
          [...myArea]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
        );

        setMapIssues(unique);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    loadIssues();
  }, [user]);

  // ✅ Map logic (safe)
  useEffect(() => {
    if (!showMap || !user || !vectorLayerRef.current) return;

    const initMap = async () => {
      const { lat, lng } = await getCoordinatesFromPostalCode(
        user.postalCode,
        user.location
      );

      const center = fromLonLat([lng, lat]);

      if (!olMapRef.current) {
        olMapRef.current = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({ source: new OSM() }),
            vectorLayerRef.current,
          ],
          view: new View({ center, zoom: 14 }),
        });
      } else {
        olMapRef.current.setTarget(mapRef.current);
        olMapRef.current.getView().setCenter(center);
      }

      vectorSourceRef.current.clear();

      const features = mapIssues
        .map((issue) => {
          const lng = issue.longitude || issue.location?.coordinates?.[0];
          const lat = issue.latitude || issue.location?.coordinates?.[1];

          if (!lng || !lat) return null;

          let icon = CleanStreetPointer;
          if (issue.priority === "high") icon = RedPointer;
          else if (issue.priority === "medium") icon = YellowPointer;

          const feature = new Feature({
            geometry: new Point(fromLonLat([lng, lat])),
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
    };

    initMap();

    return () => {
      if (olMapRef.current) olMapRef.current.setTarget(null);
    };
  }, [showMap, user, mapIssues]);

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <i className="bi bi-exclamation-triangle"></i>
          <h2>{stats.totalIssues}</h2>
          <p>Total Issues</p>
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

      <div className="quick-actions">
        <Link to="/report-issue" className="btns primary">
          Report Issue
        </Link>
        <button className="btns secondary" onClick={() => setShowMap(true)}>
          View Map
        </button>
      </div>

      {showMap && (
        <div className="modal-overlay" onClick={() => setShowMap(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Reported Issues Map</h2>
            <div ref={mapRef} className="map-container"></div>
            <button className="btn close-btn" onClick={() => setShowMap(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
