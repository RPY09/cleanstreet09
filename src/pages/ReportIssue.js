// src/pages/ReportIssue.js (FINAL CORRECTED CODE with Map Integration)
import React, { useState, useEffect, useRef } from "react"; // Added useRef
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./ReportIssue.css";

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
  const mapElement = useRef(); // Reference for the map container element

  // Map state management
  const [map, setMap] = useState(null);
  const [markerSource] = useState(new VectorSource());
  const [selectedLocation, setSelectedLocation] = useState(null); // Stores [lon, lat]

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

  // --- MAP INITIALIZATION AND CLICK HANDLER ---
  useEffect(() => {
    // 1. Define the marker style
    const markerStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1], // Center the icon bottom
        src: "https://openlayers.org/en/latest/examples/data/icon.png", // Basic icon
      }),
    });

    // 2. Create the Map instance
    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: markerSource, style: markerStyle }),
      ],
      view: new View({
        center: initialCenter, // Default center (from MapUtils)
        zoom: 12,
      }),
    });

    setMap(initialMap);

    // 3. Define the click listener
    initialMap.on("click", async (evt) => {
      const coords = toLonLat(evt.coordinate); // Convert map coordinates to [lon, lat]
      setSelectedLocation(coords);

      // --- Update Marker Position ---
      markerSource.clear();
      const marker = new Feature({
        geometry: new Point(evt.coordinate),
      });
      markerSource.addFeature(marker);

      // --- Reverse Geocoding to get address ---
      setLoading(true);
      const addressString = await reverseGeocode(coords[0], coords[1]);

      // 4. Update the address input field directly
      setFormData((prev) => ({
        ...prev,
        address: addressString,
      }));
      setLoading(false);
    });

    return () => initialMap.setTarget(undefined); // Cleanup on unmount
  }, [markerSource]);

  // --- FORM HANDLERS (Unchanged) ---
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // ... (rest of the form submission logic using FormData is the same) ...
    // The final submission will now include the map-selected address in formData.address

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
      setSelectedLocation(null); // Clear selected location
      markerSource.clear(); // Clear map marker
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
      // ... (Not Authorized Block is the same) ...
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

  // --- FINAL JSX RETURN ---
  return (
    <div className="report-issue-page">
      <div className="container">
        <div className="report-header">
          <h1>Report a Civic Issue</h1>
          <p>Help make your community cleaner and safer by reporting issues</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-section">
            <h3>Issue Details</h3>

            <div className="form-row">
              {/* Title and IssueType fields are here (unchanged) */}
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Issue Title
                </label>
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
                <label htmlFor="issueType" className="form-label">
                  Issue Type
                </label>
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
              {/* Priority field is here (unchanged) */}
              <div className="form-group">
                <label htmlFor="priority" className="form-label">
                  Priority Level
                </label>
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

              {/* Address Field: Now linked to the map */}
              <div className="form-group">
                <label htmlFor="address" className="form-label">
                  Address (Selected on Map)
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="form-control"
                  placeholder="Address will be populated from the map"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  // Making it read-only encourages map use, but allows manual override
                />
              </div>
            </div>

            {/* Landmark, Description, and Image Upload fields (unchanged) */}
            <div className="form-group">
              {" "}
              {/* Landmark */}
              <label htmlFor="landmark" className="form-label">
                Nearby Landmark (Optional)
              </label>
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

            <div className="form-group">
              {" "}
              {/* Description */}
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="5"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            {/* Image Upload and Preview (unchanged) */}
            <div className="form-group">
              <label htmlFor="image" className="form-label">
                Upload Image (Optional)
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                className="form-control"
                onChange={handleImageChange}
              />
            </div>
            {imagePreview && (
              <div
                className="image-preview-container"
                style={{ marginTop: "15px", maxWidth: "300px" }}
              >
                <img
                  src={imagePreview}
                  alt="Issue Preview"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </div>
            )}
          </div>

          {/* --- MAP INTEGRATION --- */}
          <div className="form-section">
            <h3>Location on Map: Click to Pinpoint Issue</h3>
            <div
              ref={mapElement} // <-- OpenLayers renders here
              className="map-placeholder"
            >
              {loading && (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  Retrieving address...
                </div>
              )}
            </div>
            {selectedLocation && (
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "0.9em",
                  color: "#007bff",
                }}
              >
                Location Selected: {formData.address}
              </p>
            )}
          </div>

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
