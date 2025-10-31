import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./Auth.css";

// Access SweetAlert2 from window (loaded via CDN)
const Swal = window.Swal;

const API_URL = "http://localhost:5000/api/auth";
const GOOGLE_API_KEY = ""; // for google api key

const Login = () => {
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
          const { user, token } = response.data;

          if (loginWithToken) {
            loginWithToken(token, user);
          } else {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            window.location.reload();
            return;
          }

          // Success alert
          Swal.fire({
            icon: "success",
            title: "Password Reset Successfully!",
            text: "You can now login with your new password.",
            background:
              "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
            color: "var(--text-on-light)",
            confirmButtonColor: "var(--g-3)",
            timer: 2000,
            timerProgressBar: true,
          });

          // Redirect based on role
          if (user?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Invalid OTP",
            text: response.data?.message || "Invalid or expired OTP.",
            background:
              "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
            color: "var(--text-on-light)",
            confirmButtonColor: "var(--g-3)",
          });
          setError(response.data?.message || "Invalid or expired OTP.");
        }
      } else {
        // --- STANDARD PASSWORD LOGIN SUBMISSION ---
        const res = await login(loginData.email, loginData.password);

        if (res?.success) {
          Swal.fire({
            icon: "success",
            title: "Login Successful!",
            text: `Welcome back, ${res.user?.name || "User"}!`,
            background:
              "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
            color: "var(--text-on-light)",
            confirmButtonColor: "var(--g-3)",
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });

          if (res.user?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: res?.message || "Invalid credentials.",
            background:
              "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
            color: "var(--text-on-light)",
            confirmButtonColor: "var(--g-3)",
          });
          setError(res?.message || "Invalid credentials.");
        }
      }
    } catch (err) {
      console.error("Login Submission Error:", err);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "An error occurred during login. Please check your connection and try again.",
        background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
        color: "var(--text-on-light)",
        confirmButtonColor: "var(--g-3)",
      });
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

      if (res?.success) {
        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Your account has been created. Welcome to CleanStreet!",
          background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
          color: "var(--text-on-light)",
          confirmButtonColor: "var(--g-3)",
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          navigate("/dashboard");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: res?.message || "Registration failed. Please try again.",
          background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
          color: "var(--text-on-light)",
          confirmButtonColor: "var(--g-3)",
        });
        setError(res?.message || "Registration failed.");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Registration Error",
        text: "An error occurred during registration. Please try again.",
        background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
        color: "var(--text-on-light)",
        confirmButtonColor: "var(--g-3)",
      });
      setError("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD: TRIGGER OTP SENDING ---
  const requestOtp = async () => {
    setError("");

    if (!loginData.email) {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter your email to request a reset code.",
        background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
        color: "var(--text-on-light)",
        confirmButtonColor: "var(--g-3)",
      });
      setError("Please enter your email to request a reset code.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/send-otp`, {
        email: loginData.email,
      });

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: response.data.message || "Check your email for the reset code.",
          background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
          color: "var(--text-on-light)",
          confirmButtonColor: "var(--g-3)",
        });
        setForgotMode(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Send OTP",
          text: response.data.message || "Failed to request reset code.",
          background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
          color: "var(--text-on-light)",
          confirmButtonColor: "var(--g-3)",
        });
        setError(response.data.message || "Failed to request reset code.");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Could not connect to server to request reset code.",
        background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
        color: "var(--text-on-light)",
        confirmButtonColor: "var(--g-3)",
      });
      setError("Could not connect to server to request reset code.");
    } finally {
      setLoading(false);
    }
  };

  // --- GEOLOCATION: GET CURRENT LOCATION ---
  const fillCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "Geolocation Not Supported",
        text: "Geolocation is not supported by your browser.",
        background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
        color: "var(--text-on-light)",
        confirmButtonColor: "var(--g-3)",
      });
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let locationString = `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;

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
            Swal.fire({
              icon: "warning",
              title: "Location Found",
              text: "Location found, but failed to get street address. Using coordinates.",
              background:
                "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
              color: "var(--text-on-light)",
              confirmButtonColor: "var(--g-3)",
            });
          }
        }

        setRegData((p) => ({ ...p, location: locationString }));

        Swal.fire({
          icon: "success",
          title: "Location Retrieved",
          text: "Your current location has been filled in.",
          background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
          color: "var(--text-on-light)",
          confirmButtonColor: "var(--g-3)",
          timer: 1500,
          timerProgressBar: true,
        });

        setLoading(false);
      },
      (err) => {
        Swal.fire({
          icon: "error",
          title: "Location Error",
          text: "Unable to get location: " + err.message,
          background: "linear-gradient(180deg, var(--g-pale), var(--g-accent))",
          color: "var(--text-on-light)",
          confirmButtonColor: "var(--g-3)",
        });
        setError("Unable to get location: " + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- TOGGLES ---
  const toggleForgotMode = () => {
    if (forgotMode) {
      setForgotMode(false);
    } else {
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
        <div className={`card-3d ${isRegister ? "flipped" : ""}`}>
          {/* LOGIN SIDE */}
          <div className="card-face card-front">
            <div className="auth-card">
              <div className="logo-section">
                <h2 className="logo-text">🧹 CleanStreet</h2>
                <p className="tagline">Keep the streets clean</p>
              </div>

              <h3 className="form-title">
                {forgotMode ? "Reset Password" : "Login"}
              </h3>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={submitLogin}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                {forgotMode ? (
                  <div className="form-group">
                    <label>Enter OTP</label>
                    <input
                      type="text"
                      name="otp"
                      value={loginData.otp}
                      onChange={handleLoginChange}
                      placeholder="6-digit code"
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : forgotMode
                    ? "Verify OTP"
                    : "Login"}
                </button>

                <div className="link-row">
                  <button
                    type="button"
                    className="link-btn"
                    onClick={toggleForgotMode}
                  >
                    {forgotMode ? "← Back to login" : "Forgot password?"}
                  </button>
                </div>
              </form>

              <div className="card-footer">
                <p>
                  Don't have an account?{" "}
                  <button className="flip-link" onClick={flipToRegister}>
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* REGISTER SIDE */}
          <div className="card-face card-back">
            <div className="auth-card">
              <div className="logo-section">
                <h2 className="logo-text">🧹 CleanStreet</h2>
                <p className="tagline">Join the community</p>
              </div>

              <h3 className="form-title">Create Account</h3>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={submitRegister}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={regData.fullName}
                    onChange={handleRegChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={regData.username}
                    onChange={handleRegChange}
                    placeholder="johndoe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={regData.email}
                    onChange={handleRegChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone (optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={regData.phone}
                    onChange={handleRegChange}
                    placeholder="+91 1234567890"
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      name="location"
                      value={regData.location}
                      onChange={handleRegChange}
                      placeholder="City, State"
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-location"
                      onClick={fillCurrentLocation}
                      disabled={loading}
                    >
                      📍
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={regData.password}
                    onChange={handleRegChange}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Creating..." : "Sign Up"}
                </button>
              </form>

              <div className="card-footer">
                <p>
                  Already have an account?{" "}
                  <button className="flip-link" onClick={flipToLogin}>
                    Login
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
