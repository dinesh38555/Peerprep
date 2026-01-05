// src/components/Auth/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./Signup.css";

/* SVG icons (eye, eye-off, copy) */
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 013.258-4.516m3.557-2.085A9.992 9.992 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.975 9.975 0 01-1.249 2.592M15 12a3 3 0 00-3-3m0 0a3 3 0 013 3m-3-3L3 3m9 9l9 9" />
  </svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="copy-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-2" />
    <rect x="8" y="3" width="13" height="13" rx="2" ry="2" strokeWidth={1.6} />
  </svg>
);

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    user_password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = async (value) => {
    try {
      if (!value) {
        toast.error("Nothing to copy");
        return;
      }
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Copy failed");
    }
  };

  const validateForm = () => {
    const { username, first_name, last_name, email, user_password, confirmPassword } = form;
    if (!username || !first_name || !last_name || !email || !user_password || !confirmPassword)
      return "All fields are required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>])[A-Za-z\d!@#$%^&*(),.?\":{}|<>]{8,}$/;
    if (!passwordRegex.test(user_password))
      return "Password must include uppercase, lowercase, number, and special character.";

    if (user_password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to send OTP");
        setLoading(false);
        return;
      }
      toast.success("OTP sent successfully! Check your email.");
      navigate("/verify-otp", { state: form });
    } catch (err) {
      console.error("Signup Error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create Your Account</h2>
        <p className="signup-subtitle">Join PeerPrep and start your personalized prep journey</p>

        <form onSubmit={handleSubmit}>
          {/* Consistent order: username → first/last → email → password → confirm */}
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" />
          </div>

          <div className="name-row">
            <div className="input-group">
              <label htmlFor="first_name">First Name</label>
              <input id="first_name" type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" />
            </div>
            <div className="input-group">
              <label htmlFor="last_name">Last Name</label>
              <input id="last_name" type="text" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" />
          </div>

          <div className="input-group password-group">
            <label htmlFor="user_password">Password</label>
            <div className="password-wrapper">
              <input
                id="user_password"
                type={showPassword ? "text" : "password"}
                name="user_password"
                value={form.user_password}
                onChange={handleChange}
                placeholder="Create a password"
                aria-describedby="password-requirements"
              />
              <button type="button" className="icon-btn toggle-password" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <button type="button" className="icon-btn copy-password" onClick={() => copyToClipboard(form.user_password)} aria-label="Copy password">
                <CopyIcon />
              </button>
            </div>
            <div id="password-requirements" className="field-hint">Min 8 chars, uppercase, lowercase, number, special char</div>
          </div>

          <div className="input-group password-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
              />
              <button type="button" className="icon-btn toggle-password" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle confirm password visibility">
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <button type="button" className="icon-btn copy-password" onClick={() => copyToClipboard(form.confirmPassword)} aria-label="Copy confirm password">
                <CopyIcon />
              </button>
            </div>
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Sending OTP..." : "Create Account"}
          </button>

          <p className="login-link">
            Already have an account?{" "}
            <span className="link-text" role="button" onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
