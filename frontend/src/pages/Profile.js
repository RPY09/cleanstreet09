import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import { reverseGeocode } from "../utils/MapUtils";
import "./Auth.css";
import "./Profile.css";

const swalOptions = (icon, title, text) => ({
  icon,
  title,
  text,
  background: "linear-gradient(to bottom, #F0FFF4, #E6F4EA)",
  color: "#05302f", // dark-teal text
  confirmButtonColor: "#16594f", // accent confirm color
});

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
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpVerifiedLocal, setOtpVerifiedLocal] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmNewPasswordValue, setConfirmNewPasswordValue] = useState("");

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
      // Ensure email is not sent in the payload (server ignores email on update but avoid confusion)
      const payload = {
        name: formData.name,
        username: formData.username,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
      };

      const result = await updateProfile(payload);

      if (result.success) {
        Swal.fire(swalOptions("success", "Success", result.message));
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

  const sendOrVerifyOtp = async () => {
    const emailToUse = formData.email || user?.email;
    if (!emailToUse) {
      Swal.fire(
        swalOptions(
          "warning",
          "No email",
          "Please ensure your account has a valid email to receive OTP."
        )
      );
      return;
    }

    // If OTP isn't sent yet, send it
    if (!otpSent) {
      try {
        setSendingOtp(true);
        const resp = await axios.post(
          "http://localhost:5000/api/auth/send-otp",
          {
            email: emailToUse,
          }
        );

        if (resp.data?.success) {
          setOtpSent(true);
          Swal.fire(
            swalOptions(
              "success",
              "OTP Sent",
              resp.data.message || "OTP sent to your email."
            )
          );
        } else {
          Swal.fire(
            swalOptions(
              "error",
              "Send Failed",
              resp.data?.message || "Failed to send OTP."
            )
          );
        }
      } catch (err) {
        console.error("Send OTP error:", err);
        Swal.fire(
          swalOptions(
            "error",
            "Error",
            err.response?.data?.message || "Error sending OTP."
          )
        );
      } finally {
        setSendingOtp(false);
      }
      return;
    }

    if (otpSent) {
      if (!otpValue) {
        Swal.fire(
          swalOptions(
            "warning",
            "Missing OTP",
            "Please enter the OTP sent to your email."
          )
        );
        return;
      }
      try {
        setVerifyingOtp(true);
        const resp = await axios.post(
          "http://localhost:5000/api/auth/verify-otp-only",
          {
            email: emailToUse,
            otp: otpValue,
          }
        );
        if (resp.data?.success) {
          setOtpVerifiedLocal(true);
          Swal.fire(
            swalOptions(
              "success",
              "OTP Verified",
              "You may now enter a new password."
            )
          );
        } else {
          Swal.fire(
            swalOptions(
              "error",
              "OTP Failed",
              resp.data?.message || "Invalid OTP."
            )
          );
        }
      } catch (err) {
        console.error("verifyOtpForReset error:", err);
        Swal.fire(
          swalOptions(
            "error",
            "Error",
            err.response?.data?.message || "Server error verifying OTP."
          )
        );
      } finally {
        setVerifyingOtp(false);
      }
    }
  };

  // Reset password using OTP (no current password required)
  const resetPassword = async (e) => {
    e.preventDefault();
    if (!otpVerifiedLocal) {
      Swal.fire(
        swalOptions("warning", "OTP required", "Please verify the OTP first.")
      );
      return;
    }

    if (!newPasswordValue || !confirmNewPasswordValue) {
      Swal.fire(
        swalOptions(
          "warning",
          "Missing password",
          "Please fill both password fields."
        )
      );
      return;
    }
    if (newPasswordValue !== confirmNewPasswordValue) {
      Swal.fire(
        swalOptions(
          "error",
          "Mismatch",
          "New password and confirmation do not match."
        )
      );
      return;
    }

    setResettingPassword(true);
    try {
      const emailToUse = formData.email || user.email;
      const resp = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
          email: emailToUse,
          otp: otpValue,
          newPassword: newPasswordValue,
        }
      );

      if (resp.data?.success) {
        setOtpVerifiedLocal(false);
        setOtpSent(false);
        setOtpValue("");
        setNewPasswordValue("");
        setConfirmNewPasswordValue("");
        Swal.fire(
          swalOptions(
            "success",
            "Password updated",
            resp.data.message || "Your password has been updated."
          )
        );
      } else {
        Swal.fire(
          swalOptions(
            "error",
            "Reset failed",
            resp.data?.message || "Failed to reset password."
          )
        );
      }
    } catch (err) {
      console.error("resetPassword error:", err);
      Swal.fire(
        swalOptions(
          "error",
          "Error",
          err.response?.data?.message || "Server error resetting password."
        )
      );
    } finally {
      setResettingPassword(false);
    }
  };

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
            <div className="users-card">
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
                <i className="bi bi-person-fill" />
                <span style={{ marginLeft: 8 }}>Personal Details</span>
              </button>
              <button
                className={`nav-item ${
                  activeTab === "security" ? "active" : ""
                }`}
                onClick={() => setActiveTab("security")}
              >
                <i className="bi bi-lock-fill" />
                <span style={{ marginLeft: 8 }}>Security & Privacy</span>
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
                      <i
                        className="bi bi-pencil-square"
                        style={{ marginRight: 8 }}
                      />{" "}
                      Edit Profile
                    </button>
                  )}
                </div>

                {updateError && (
                  <div className="alert alert-error">{updateError}</div>
                )}

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
                  <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        Full Name
                      </label>
                      <div className="input-group">
                        <i className="bi bi-person" />
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
                    </div>

                    <div className="form-group">
                      <label htmlFor="username" className="form-label">
                        Username
                      </label>
                      <div className="input-group">
                        <i className="bi bi-at" />
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
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <div className="input-group">
                        <i className="bi bi-envelope" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-control"
                          value={formData.email}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        Phone Number
                      </label>
                      <div className="input-group">
                        <i className="bi bi-telephone" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-control"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
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
                              Swal.fire(
                                swalOptions(
                                  "warning",
                                  "Geolocation",
                                  "Geolocation is not supported by your browser."
                                )
                              );
                              return;
                            }
                            try {
                              setLocationLoading(true);
                              navigator.geolocation.getCurrentPosition(
                                async (pos) => {
                                  const lat = pos.coords.latitude;
                                  const lon = pos.coords.longitude;
                                  let locationString = `Lat: ${lat.toFixed(
                                    6
                                  )}, Lng: ${lon.toFixed(6)}`;
                                  try {
                                    locationString = await reverseGeocode(
                                      lon,
                                      lat
                                    );
                                  } catch (err) {
                                    console.error(
                                      "Reverse geocode failed:",
                                      err
                                    );
                                  }
                                  setFormData((p) => ({
                                    ...p,
                                    location: locationString,
                                  }));
                                  setLocationLoading(false);
                                  Swal.fire(
                                    swalOptions(
                                      "success",
                                      "Location Updated",
                                      "Address fetched and filled into the form."
                                    )
                                  );
                                },
                                (err) => {
                                  console.error("Geolocation error:", err);
                                  setLocationLoading(false);
                                  Swal.fire(
                                    swalOptions(
                                      "error",
                                      "Location error",
                                      "Unable to get location: " + err.message
                                    )
                                  );
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
                        <small className="location-loading-msg">
                          Getting your location...
                        </small>
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

                <div className="security-section">
                  <h3>Change Password (OTP)</h3>

                  <form className="password-form" onSubmit={resetPassword}>
                    <div className="form-group otp-group">
                      <label htmlFor="otp" className="form-label">
                        OTP (sent to your registered email)
                      </label>

                      <div
                        className="otp-row"
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          id="otp"
                          name="otp"
                          className="form-control"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          placeholder="Enter OTP"
                          required
                        />

                        <button
                          type="button"
                          className="btn btn-secondary otp-btn"
                          onClick={sendOrVerifyOtp}
                          disabled={
                            sendingOtp ||
                            verifyingOtp ||
                            (otpSent && otpVerifiedLocal)
                          }
                          title={otpSent ? "Verify OTP" : "Send OTP"}
                        >
                          {/* Switch text + icon based on state */}
                          {!otpSent ? (
                            <>
                              <i
                                className="bi bi-send-check"
                                style={{ marginRight: 8 }}
                              />
                              Send
                            </>
                          ) : !otpVerifiedLocal ? (
                            <>
                              <i
                                className="bi bi-check2-circle"
                                style={{ marginRight: 8 }}
                              />
                              Verify
                            </>
                          ) : (
                            <>
                              <i
                                className="bi bi-lock-fill"
                                style={{ marginRight: 8 }}
                              />
                              Verified
                            </>
                          )}
                        </button>
                      </div>

                      {otpSent && (
                        <small className="help-text">
                          OTP sent — click Verify OTP to validate it.
                        </small>
                      )}
                      {otpVerifiedLocal && (
                        <small
                          className="help-text"
                          style={{ color: "#16594f" }}
                        >
                          OTP verified — you can now change your password.
                        </small>
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
                        value={newPasswordValue}
                        onChange={(e) => setNewPasswordValue(e.target.value)}
                        required
                        minLength="6"
                        disabled={!otpVerifiedLocal}
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
                        value={confirmNewPasswordValue}
                        onChange={(e) =>
                          setConfirmNewPasswordValue(e.target.value)
                        }
                        required
                        minLength="6"
                        disabled={!otpVerifiedLocal}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!otpVerifiedLocal || resettingPassword}
                    >
                      {resettingPassword ? "Updating..." : "Update Password"}
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
