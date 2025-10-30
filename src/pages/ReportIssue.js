// src/pages/ReportIssue.js (Updated for new layout)
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./ReportIssue.css";
import 'ol/ol.css'; 

// OpenLayers Imports
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import { toLonLat, fromLonLat } from "ol/proj";

// Utility Imports
import { reverseGeocode, initialCenter } from "../utils/MapUtils";

const API_URL = "http://localhost:5000/api/issues";

const ReportIssue = () => {
  const { user } = useAuth();
  const mapElement = useRef(); 

  // Map state management
  const [map, setMap] = useState(null);
  const [markerSource] = useState(new VectorSource());
  const [selectedLocation, setSelectedLocation] = useState(null); 

  const [formData, setFormData] = useState({
    title: "",
    issueType: "",
    priority: "medium",
    address: "", // This will be updated by the map click
    landmark: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const issueTypes = [
    { value: "pothole", label: "Pothole" },
    { value: "garbage", label: "Garbage Dump" },
    { value: "streetlight", label: "Broken Streetlight" },
    { value: "water_leak", label: "Water Leak" },
    { value: "other", label: "Other" },
  ];

  const priorityLevels = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  // --- MAP INITIALIZATION AND CLICK HANDLER (No changes here) ---
  useEffect(() => {
    const markerStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: "https://openlayers.org/en/latest/examples/data/icon.png",
      }),
    });

    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: markerSource, style: markerStyle }),
      ],
      view: new View({
        center: initialCenter, 
        zoom: 12,
      }),
    });

    setMap(initialMap);

    initialMap.on("click", async (evt) => {
      const coords = toLonLat(evt.coordinate); 
      setSelectedLocation(coords);

      markerSource.clear();
      const marker = new Feature({
        geometry: new Point(evt.coordinate),
      });
      markerSource.addFeature(marker);

      setLoading(true);
      const addressString = await reverseGeocode(coords[0], coords[1]);

      setFormData((prev) => ({
        ...prev,
        address: addressString,
      }));
      setLoading(false);
    });

    return () => initialMap.setTarget(undefined); 
  }, [markerSource]);

  // --- FORM HANDLERS (handleImageChange is slightly modified) ---
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // --- handleSubmit (No changes here) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    if (imageFile) {
      data.append("image", imageFile);
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authorization failed. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_URL, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess(response.data.message || "Issue reported successfully!");

      // Reset form on success
      setFormData({
        title: "",
        issueType: "",
        priority: "medium",
        address: "",
        landmark: "",
        description: "",
      });
      setImageFile(null);
      setImagePreview(null);
      setSelectedLocation(null); 
      markerSource.clear(); 
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to connect to server or report issue.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="report-issue-page">
        <div className="container">
          <div className="not-authorized">
            <h2>Please log in to report issues</h2>
            <p>You need to be logged in to submit civic issues.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- FINAL JSX RETURN (UPDATED STRUCTURE) ---
  return (
    <div className="report-issue-page">
      <div className="container">
        <div className="report-header">
          <h1>Report Issue</h1>
          <p>Help make your community cleaner and safer by reporting issues</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="report-form">
          
          {/* New 2-Column Grid Wrapper */}
          <div className="report-content-grid">
            
            {/* --- Left Card: Issue Details --- */}
            <div className="form-section details-card">
              <h3>Issue Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title" className="form-label">Issue Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-control"
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="issueType" className="form-label">Issue Type</label>
                  <select
                    id="issueType"
                    name="issueType"
                    className="form-control"
                    value={formData.issueType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select issue type</option>
                    {issueTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priority" className="form-label">Priority Level</label>
                  <select
                    id="priority"
                    name="priority"
                    className="form-control"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    {priorityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="address" className="form-label">Address (from Map)</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className="form-control"
                    placeholder="Click on map to select address"
                    value={formData.address}
                    onChange={handleChange} // Allow manual override
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                 <div className="form-group">
                  <label htmlFor="landmark" className="form-label">Nearby Landmark (Optional)</label>
                  <input
                    type="text"
                    id="landmark"
                    name="landmark"
                    className="form-control"
                    placeholder="e.g., Near City Hall"
                    value={formData.landmark}
                    onChange={handleChange}
                  />
                </div>
                
                {/* --- New Custom File Input --- */}
                <div className="form-group">
                  <label htmlFor="image" className="form-label">Upload file</label>
                  <div className="custom-file-upload">
                    <span className="file-name-display">
                      {imageFile ? imageFile.name : "Select a file to upload"}
                    </span>
                    <label htmlFor="image" className="btn-upload">
                      Upload File
                    </label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input-hidden"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  rows="4" // Shortened for new layout
                  placeholder="Describe the issue in detail..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Issue Preview" />
                </div>
              )}
              
            </div>
            
            {/* --- Right Card: Map --- */}
            <div className="form-section map-card">
              <h3>Location on Map</h3>
              <div ref={mapElement} className="map-placeholder">
                {loading && (
                  <div className="map-loading">
                    Retrieving address...
                  </div>
                )}
              </div>
              {selectedLocation && (
                <p className="location-selected-text">
                  Location Selected: {formData.address}
                </p>
              )}
            </div>
          </div>
          
          {/* --- Submit Button (Moved) --- */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;