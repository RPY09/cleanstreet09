import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import { reverseGeocode } from "../utils/MapUtils";
import "./Auth.css";
import "./Profile.css";

const Profile = () => {
  const { user, updateProfile, loading } = useAuth();

  // State Management
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
    bio: user?.bio || "",
  });

  const [locationLoading, setLocationLoading] = useState(false);

  // OTP / password UI state (for security section)
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Handler for form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handler for form submission (Save Changes)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError("");

    try {
      const result = await updateProfile(formData);

      if (result.success) {
        alert(result.message);
        setEditMode(false);
      } else {
        setUpdateError(result.message);
      }
    } catch (error) {
      setUpdateError("An unexpected error occurred during update.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handler for Cancel button (resets form to current global state)
  const handleCancel = () => {
    setEditMode(false);
    setUpdateError("");
    // Reset form data to the current global user state (using optional chaining for safety)
    setFormData({
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      location: user?.location || "",
      bio: user?.bio || "",
    });
  };

  // Format the member since date
  const formattedMemberSince = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString()
    : "N/A";

  // Get initial for avatar
  const avatarInitial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account settings and personal information.</p>
        </div>

        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="user-card">
              <div className="user-avatar">{avatarInitial}</div>
              <div className="user-info">
                <h3>{user?.name}</h3>
                <p className="username">@{user?.username}</p>
                <p className="user-role">{user?.role}</p>
              </div>
              <p className="member-since">
                Member Since: {formattedMemberSince}
              </p>
            </div>

            {/* Profile Navigation */}
            <nav className="profile-nav">
              <button
                className={`nav-item ${
                  activeTab === "profile" ? "active" : ""
                }`}
                onClick={() => setActiveTab("profile")}
              >
                👤 Personal Details
              </button>
              <button
                className={`nav-item ${
                  activeTab === "security" ? "active" : ""
                }`}
                onClick={() => setActiveTab("security")}
              >
                🔒 Security & Privacy
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className={`profile-content ${editMode ? "editing" : ""}`}>
            {activeTab === "profile" && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>{editMode ? "Edit Profile" : "Personal Details"}</h2>
                  {!editMode && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {updateError && (
                  <div className="alert alert-error">{updateError}</div>
                )}

                {/* Profile View Mode */}
                {!editMode ? (
                  <div className="profile-details">
                    <div className="detail-group">
                      <label>Full Name</label>
                      <p>{user?.name}</p>
                    </div>
                    <div className="detail-group">
                      <label>Username</label>
                      <p>@{user?.username}</p>
                    </div>
                    <div className="detail-group">
                      <label>Email</label>
                      <p>{user?.email}</p>
                    </div>
                    <div className="detail-group">
                      <label>Phone Number</label>
                      <p>{user?.phone || "Not provided"}</p>
                    </div>
                    <div className="detail-group">
                      <label>Location</label>
                      <p>{user?.location || "Not set"}</p>
                    </div>
                    <div className="detail-group">
                      <label>Bio</label>
                      <p>{user?.bio || "No bio set yet."}</p>
                    </div>
                  </div>
                ) : (
                  // Profile Edit Mode (Form)
                  <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="username" className="form-label">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className="form-control"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      {/* Email is typically read-only */}
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                                      <label htmlFor="location" className="form-label">
                                        Location
                                      </label>
                                      <div className="location-row">
                                        <i className="bi bi-geo-alt" />
                                        <input
                                          type="text"
                                          id="location"
                                          name="location"
                                          className="forms-control location-input"
                                          value={formData.location}
                                          onChange={handleChange}
                                          required
                                        />
                                        <button
                                          type="button"
                                          className="location-btn"
                                          onClick={async () => {
                                            if (!navigator.geolocation) {
                                              Swal.fire({
                                                icon: "warning",
                                                title: "Geolocation",
                                                text: "Geolocation is not supported by your browser.",
                                              });
                                              return;
                                            }

                                            try {
                                              setLocationLoading(true);
                                              navigator.geolocation.getCurrentPosition(
                                                async (pos) => {
                                                  const lat = pos.coords.latitude;
                                                  const lon = pos.coords.longitude;
                                                  let locationString = `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;

                                                  try {
                                                    // try to get a human-friendly address
                                                    locationString = await reverseGeocode(lon, lat);
                                                  } catch (err) {
                                                    console.error("Reverse geocode failed:", err);
                                                  }

                                                  setFormData((p) => ({ ...p, location: locationString }));
                                                  setLocationLoading(false);
                                                  Swal.fire({
                                                    icon: "success",
                                                    title: "Location Updated",
                                                    text: "Address fetched and filled into the form.",
                                                  });
                                                },
                                                (err) => {
                                                  console.error("Geolocation error:", err);
                                                  setLocationLoading(false);
                                                  Swal.fire({
                                                    icon: "error",
                                                    title: "Location error",
                                                    text: "Unable to get location: " + err.message,
                                                  });
                                                },
                                                { enableHighAccuracy: true, timeout: 10000 }
                                              );
                                            } catch (err) {
                                              console.error("fillCurrentLocation error:", err);
                                              setLocationLoading(false);
                                            }
                                          }}
                                          disabled={locationLoading}
                                          title="Use my location"
                                        >
                                          <i className="bi bi-geo-fill" />
                                        </button>
                                      </div>
                                      {locationLoading && (
                                        <small className="location-loading-msg">Getting your location...</small>
                                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="bio" className="form-label">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        className="form-control"
                        rows="3"
                        value={formData.bio}
                        onChange={handleChange}
                      ></textarea>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleCancel}
                        disabled={updateLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={updateLoading}
                      >
                        {updateLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="tab-content">
                <h2>Security & Privacy</h2>

                {/* --- Placeholder Content (What you see now) --- 
    <div className="coming-soon">
      <h3>Password Management</h3>
      <p>Password change form and multi-factor authentication options will be here.</p>
    </div>
    */}

                {/* ---Password Change Form  --- */}
                <div className="security-section">
                  <h3>Change Password (OTP)</h3>
                  <form className="password-form">
                    <div className="form-group otp-group">
                      <label htmlFor="otp" className="form-label">
                        OTP (sent to your registered phone/email)
                      </label>
                      <div className="otp-row" style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          id="otp"
                          name="otp"
                          className="form-control"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter OTP"
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-secondary otp-btn"
                          onClick={async () => {
                            // Send OTP to user's registered email via backend
                            const emailToUse = formData.email || user?.email;
                            if (!emailToUse) {
                              Swal.fire({
                                icon: "warning",
                                title: "No email",
                                text: "Please ensure your account has a valid email to receive OTP.",
                              });
                              return;
                            }

                            try {
                              setSendingOtp(true);
                              const resp = await axios.post(
                                "http://localhost:5000/api/auth/send-otp",
                                { email: emailToUse }
                              );

                              if (resp.data?.success) {
                                setOtpSent(true);
                                Swal.fire({
                                  icon: "success",
                                  title: "OTP Sent",
                                  text: resp.data.message || "OTP sent to your email.",
                                });
                              } else {
                                Swal.fire({
                                  icon: "error",
                                  title: "Send Failed",
                                  text: resp.data?.message || "Failed to send OTP.",
                                });
                              }
                            } catch (err) {
                              console.error("Send OTP error:", err);
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: err.response?.data?.message || "Error sending OTP."
                              });
                            } finally {
                              setSendingOtp(false);
                            }
                          }}
                          disabled={sendingOtp || otpSent}
                        >
                          {sendingOtp ? "Sending..." : otpSent ? "Sent" : "Send OTP"}
                        </button>
                      </div>
                      {otpSent && (
                        <small className="help-text">OTP sent — enter it above to verify.</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="new-password" className="form-label">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        name="newPassword"
                        className="form-control"
                        required
                        minLength="6"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirm-password" className="form-label">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirm-password"
                        name="confirmPassword"
                        className="form-control"
                        required
                        minLength="6"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
