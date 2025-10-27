import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./Auth.css";

const API_URL = "http://localhost:5000/api/auth";

const GOOGLE_API_KEY = ""; // for google api key

const Login = () => {
  // get loginWithToken from context so we update React state after OTP
  const { login, register, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    otp: "",
  });

  const [regData, setRegData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    location: "",
    password: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "register") setIsRegister(true);
  }, [location.search]);

  const handleLoginChange = (e) =>
    setLoginData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleRegChange = (e) =>
    setRegData((p) => ({ ...p, [e.target.name]: e.target.value }));

  // --- LOGIN SUBMISSION ---
  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (forgotMode) {
        // --- OTP VERIFICATION SUBMISSION ---
        const response = await axios.post(`${API_URL}/verify-otp`, {
          email: loginData.email,
          otp: loginData.otp,
        });

        if (response.data?.success) {
          // Backend returned user and token
          const { user, token } = response.data;

          if (loginWithToken) {
            loginWithToken(token, user);
          } else {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            window.location.reload();
            return;
          }

          // Redirect based on role
          if (user?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          setError(response.data?.message || "Invalid or expired OTP.");
        }
      } else {
        // --- STANDARD PASSWORD LOGIN SUBMISSION ---
        const res = await login(loginData.email, loginData.password);

        if (res?.success) {
          // AuthContext login function already handled session creation (localStorage/state)
          if (res.user?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          setError(res?.message || "Invalid credentials.");
        }
      }
    } catch (err) {
      console.error("Login Submission Error:", err);
      // Catch network failures or unhandled backend exceptions
      setError("An error occurred during login (Network or Server Error)");
    } finally {
      setLoading(false);
    }
  };

  // --- REGISTRATION SUBMISSION ---
  const submitRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        name: regData.fullName,
        username: regData.username,
        email: regData.email,
        phone: regData.phone || undefined,
        location: regData.location,
        password: regData.password,
      };
      const res = await register(payload);
      if (res?.success) navigate("/dashboard");
      else setError(res?.message || "Registration failed.");
    } catch (err) {
      setError("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD: TRIGGER OTP SENDING ---
  const requestOtp = async () => {
    setError("");
    if (!loginData.email) {
      setError("Please enter your email to request a reset code.");
      return;
    }
    setLoading(true);

    try {
      // Calls the backend endpoint to send the email
      const response = await axios.post(`${API_URL}/send-otp`, {
        email: loginData.email,
      });

      if (response.data.success) {
        alert(response.data.message);
        setForgotMode(true); // Switch to OTP input field
      } else {
        setError(response.data.message || "Failed to request reset code.");
      }
    } catch (err) {
      setError("Could not connect to server to request reset code.");
    } finally {
      setLoading(false);
    }
  };

  // --- GEOLOCATION: GET CURRENT LOCATION ---
  const fillCurrentLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Made success callback async to handle API call
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let locationString = `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`; // Default coordinates

        // Attempt Reverse Geocoding if API key is present
        if (GOOGLE_API_KEY) {
          const REVERSE_GEOCODE_URL =
            "https://maps.googleapis.com/maps/api/geocode/json";
          try {
            const response = await axios.get(REVERSE_GEOCODE_URL, {
              params: {
                latlng: `${lat},${lon}`,
                key: GOOGLE_API_KEY,
              },
            });
            if (response.data.results && response.data.results.length > 0) {
              locationString = response.data.results[0].formatted_address;
            }
          } catch (apiError) {
            console.error("Reverse Geocoding Failed:", apiError);
            setError(
              "Location found, but failed to get street address. Using coordinates."
            );
          }
        }

        setRegData((p) => ({ ...p, location: locationString }));
        setLoading(false);
      },
      (err) => {
        setError("Unable to get location: " + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- TOGGLES ---
  const toggleForgotMode = () => {
    if (forgotMode) {
      // Toggling back to password mode
      setForgotMode(false);
    } else {
      // Toggling into forgot mode: request the OTP immediately
      requestOtp();
    }
  };

  const flipToRegister = () => {
    setIsRegister(true);
    setForgotMode(false);
    setError("");
  };
  const flipToLogin = () => {
    setIsRegister(false);
    setForgotMode(false);
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className={`auth-card-3d ${isRegister ? "flipped" : ""}`}>
          {/* FRONT - LOGIN */}
          <div className="auth-face auth-face-front">
            <div className="auth-header">
              <h1>Login to CleanStreet</h1>
              <h2>Join us and start cleaning up the streets!</h2>
            </div>
            <div className="cleanicon"></div>

            {error && <div className="alert alert-error">{error}</div>}

            <form className="auth-form face-font" onSubmit={submitLogin}>
              <div className="forms-group">
                <label className="forms-label">Email</label>
                <div className="input-group">
                  <i className="bi bi-envelope" />
                  <input
                    name="email"
                    type="email"
                    className="forms-control"
                    placeholder="your.email@example.com"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
              </div>

              {!forgotMode && (
                <div className="forms-group">
                  <label className="forms-label">Password</label>
                  <div className="input-group">
                    <i className="bi bi-lock" />
                    <input
                      name="password"
                      type="password"
                      className="forms-control"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {forgotMode && (
                <div className="forms-group">
                  <label className="forms-label">OTP</label>
                  <div className="input-group">
                    <i className="bi bi-key" />
                    <input
                      name="otp"
                      type="text"
                      className="forms-control"
                      placeholder="Enter the OTP sent to your email"
                      value={loginData.otp}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  className="link-btn small"
                  onClick={toggleForgotMode}
                  disabled={loading}
                >
                  {forgotMode ? "Back to password" : "Forgot password?"}
                </button>

                <button
                  type="button"
                  className="link-btn small"
                  onClick={flipToRegister}
                  disabled={loading}
                >
                  New here? Register
                </button>
              </div>

              <div className="forms-actions">
                <button
                  type="submit"
                  className="btn auth-btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? forgotMode
                      ? "Verifying..."
                      : "Logging in..."
                    : forgotMode
                    ? "Verify OTP"
                    : "Login"}
                </button>
              </div>
            </form>
          </div>

          {/* BACK - REGISTER */}
          <div className="auth-face auth-face-back">
            <div className="auth-header">
              <h1>Create Account</h1>
              <h2>Join us and start cleaning up the streets!</h2>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form className="auth-form" onSubmit={submitRegister}>
              {/* Top row: Full Name | Username */}
              <div className="forms-row two-columns">
                <div className="forms-col">
                  <label className="forms-label">Full Name</label>
                  <div className="input-group">
                    <i className="bi bi-person" />
                    <input
                      name="fullName"
                      type="text"
                      className="forms-control"
                      placeholder="your name: Rama Krishna"
                      value={regData.fullName}
                      onChange={handleRegChange}
                      required
                    />
                  </div>
                </div>

                <div className="forms-col">
                  <label className="forms-label">Username</label>
                  <div className="input-group">
                    <i className="bi bi-at" />
                    <input
                      name="username"
                      type="text"
                      className="forms-control"
                      placeholder="your username: RK"
                      value={regData.username}
                      onChange={handleRegChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="forms-group">
                <label className="forms-label">Email</label>
                <div className="input-group">
                  <i className="bi bi-envelope" />
                  <input
                    name="email"
                    type="email"
                    className="forms-control"
                    placeholder="your.email@example.com"
                    value={regData.email}
                    onChange={handleRegChange}
                    required
                  />
                </div>
              </div>

              {/* Phone and Location side-by-side */}
              <div className="forms-row two-columns">
                <div className="forms-col">
                  <label className="forms-label">Phone (Optional)</label>
                  <div className="input-group">
                    <i className="bi bi-telephone" />
                    <input
                      name="phone"
                      type="tel"
                      className="forms-control"
                      placeholder="e.g., +91 999 123 4567"
                      value={regData.phone}
                      onChange={handleRegChange}
                    />
                  </div>
                </div>

                <div className="forms-col">
                  <label className="forms-label">Location</label>
                  <div className="location-row">
                    <i className="bi bi-geo-alt" />
                    <input
                      name="location"
                      type="text"
                      className="forms-control location-input"
                      placeholder="Enter your city or click to locate"
                      value={regData.location}
                      onChange={handleRegChange}
                      required
                    />
                    <button
                      type="button"
                      className="location-btn"
                      onClick={fillCurrentLocation}
                      disabled={loading}
                      title="Use my location"
                    >
                      <i className="bi bi-geo-fill" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="forms-group">
                <label className="forms-label">Password</label>
                <div className="input-group">
                  <i className="bi bi-lock" />
                  <input
                    name="password"
                    type="password"
                    className="forms-control"
                    placeholder="Create a strong password"
                    value={regData.password}
                    onChange={handleRegChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button
                  type="button"
                  className="link-btn small"
                  onClick={flipToLogin}
                >
                  Already have an account? Login
                </button>
              </div>

              <div className="forms-actions">
                <button
                  type="submit"
                  className="btn auth-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
