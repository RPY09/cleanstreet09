import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./ReportIssue.css";
import "ol/ol.css";
import Swal from "sweetalert2"; // use npm import (ensure package installed)

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
import { toLonLat } from "ol/proj";

// Utility Imports
import { reverseGeocode, getInitialCenterForAddress } from "../utils/MapUtils";

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
    address: "",
    landmark: "",
    description: "",
  });

  // Image state (array)
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const issueTypes = [
    { value: "pothole", label: "Pothole", icon: "bi-cone-striped" },
    { value: "garbage", label: "Garbage Dump", icon: "bi-trash3" },
    {
      value: "streetlight",
      label: "Broken Streetlight",
      icon: "bi-lightbulb-off",
    },
    { value: "water_leak", label: "Water Leak", icon: "bi-droplet" },
    { value: "other", label: "Other", icon: "bi-exclamation-circle" },
  ];

  const priorityLevels = [
    { value: "low", label: "Low", icon: "bi-arrow-down-circle" },
    { value: "medium", label: "Medium", icon: "bi-dash-circle" },
    { value: "high", label: "High", icon: "bi-arrow-up-circle" },
  ];

  // Initialize map: calculate center from user's stored address (if any) else default
  useEffect(() => {
    let mounted = true;
    const markerStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: "https://openlayers.org/en/latest/examples/data/icon.png",
      }),
    });

    // async initializer so we can forward-geocode user's address if available
    const initMap = async () => {
      // get projected center using user's saved location (user.location) if available
      const centerProjected = await getInitialCenterForAddress(user?.location);

      const initialMap = new Map({
        target: mapElement.current,
        layers: [
          new TileLayer({ source: new OSM() }),
          new VectorLayer({ source: markerSource, style: markerStyle }),
        ],
        view: new View({
          center: centerProjected,
          zoom: 12,
        }),
      });

      if (!mounted) {
        initialMap.setTarget(undefined);
        return;
      }

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
    };

    initMap();

    return () => {
      mounted = false;
      if (map) {
        map.setTarget(undefined);
      }
    };
    // we intentionally include user?.location so map recenters when logged-in user's location changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerSource, user?.location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle up to 3 images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation with SweetAlert2
    if (!selectedLocation) {
      Swal.fire({
        icon: "warning",
        title: "Location Required",
        text: "Please select a location on the map by clicking on it.",
        background: "linear-gradient(to bottom, #D3F1DE, #81B79D)",
        color: "#1B1B1B",
        confirmButtonColor: "#005347",
      });
      return;
    }

    if (!formData.title || !formData.issueType || !formData.description) {
      Swal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please fill in all required fields.",
        background: "linear-gradient(to bottom, #D3F1DE, #81B79D)",
        color: "#1B1B1B",
        confirmButtonColor: "#005347",
      });
      return;
    }

    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    // Append up to 3 images
    imageFiles.forEach((file) => {
      data.append("images", file); // backend should expect 'images' as array
    });

    data.append("latitude", selectedLocation[1]);
    data.append("longitude", selectedLocation[0]);

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Authorization Failed",
        text: "Please log in again to submit an issue.",
        background: "linear-gradient(to bottom, #D3F1DE, #81B79D)",
        color: "#1B1B1B",
        confirmButtonColor: "#005347",
      });
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

      Swal.fire({
        icon: "success",
        title: "Issue Reported Successfully!",
        text: "Thank you for making your community better.",
        background: "linear-gradient(to bottom, #D3F1DE, #81B79D)",
        color: "#1B1B1B",
        confirmButtonColor: "#005347",
        timer: 3000,
        timerProgressBar: true,
      });

      // Reset form and images
      setFormData({
        title: "",
        issueType: "",
        priority: "medium",
        address: "",
        landmark: "",
        description: "",
      });
      setImageFiles([]);
      setImagePreviews([]);
      setSelectedLocation(null);
      markerSource.clear();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to connect to server or report issue.";

      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: errorMessage,
        background: "linear-gradient(to bottom, #D3F1DE, #81B79D)",
        color: "#1B1B1B",
        confirmButtonColor: "#005347",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="report-issue-page">
        <div className="not-authorized">
          <h2>
            <i className="bi bi-lock"></i> You need to be logged in to submit
            civic issues.
          </h2>
          <p>Help make your community cleaner and safer by reporting issues.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-issue-page">
      <div className="container">
        <div className="report-header">
          <h1>
            <i className="bi bi-megaphone"></i> Report Civic Issue
          </h1>
          <p>Help make your community cleaner and safer</p>
        </div>

        <div className="report-content-grid">
          {/* Form Section */}
          <div className="form-section">
            <h3>
              <i className="bi bi-card-checklist"></i> Issue Details
            </h3>
            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-text-left"></i> Issue Title *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief title for the issue"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-tags"></i> Issue Type *
                  </label>
                  <select
                    className="form-control"
                    name="issueType"
                    value={formData.issueType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select type...</option>
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
                  <label className="form-label">
                    <i className="bi bi-speedometer2"></i> Priority Level *
                  </label>
                  <select
                    className="form-control"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                  >
                    {priorityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-signpost-2"></i> Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-geo-alt"></i> Address (Click on map)
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={formData.address}
                  readOnly
                  placeholder="Select location on map"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-pencil-square"></i> Description *
                </label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe the issue in detail..."
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-image"></i> Upload Images (Max 3)
                </label>
                <div className="custom-file-upload">
                  <span className="file-name-display">
                    {imageFiles.length === 0
                      ? "No files chosen"
                      : imageFiles.map((file) => file.name).join(", ")}
                  </span>
                  <button
                    type="button"
                    className="btn-upload"
                    onClick={() => document.getElementById("imageFile").click()}
                  >
                    <i className="bi bi-folder2-open"></i> Browse
                  </button>
                  <input
                    type="file"
                    id="imageFile"
                    className="file-input-hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Image Previews and Submit */}
              <div className="form-bottom-section">
                <div className="image-preview-list">
                  {imagePreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="image-preview-container has-image"
                    >
                      <img src={preview} alt={`Preview ${idx + 1}`} />
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="bi bi-hourglass-split spinning"></i>{" "}
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send"></i> Submit Issue
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Map Section */}
          <div className="form-section map-card">
            <h3>
              <i className="bi bi-map"></i> Select Location on Map
            </h3>
            <div ref={mapElement} className="map-placeholder"></div>
            {selectedLocation && (
              <div className="location-selected-text">
                <i className="bi bi-pin-map-fill"></i> Location selected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
