import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";  
import "./Signup.css";

/* icons (eye, eye-off, copy) - reuse same SVGs as Signup (you can move to a shared file) */
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

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ usernameOrEmail: "", user_password: "" });
  const [otp, setOtp] = useState("");
  const [requireOtp, setRequireOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleResendOTP = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.usernameOrEmail }),
      });
      const data = await res.json();
      if (res.ok) toast.success("OTP resent successfully!");
      else toast.error(data.message || "Failed to resend OTP");
    } catch (err) {
      console.error("Resend OTP error:", err);
      toast.error("Network error. Try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!form.usernameOrEmail || !form.user_password) {
      toast.error("Enter username/email and password");
      return;
    }

    setLoading(true);
    try {
      const payload = requireOtp ? { ...form, otp: otp.trim() } : form;
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data.message?.includes("OTP sent")) {
        setRequireOtp(true);
        toast.success("OTP sent to your email. Please verify.");
        setLoading(false);
        return;
      }

      if (data.token && data.user) {
        login(data.user, data.token);
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login Error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Welcome Back</h2>
        <p className="signup-subtitle">Login to your PeerPrep account</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="usernameOrEmail">Username or Email</label>
            <input
              id="usernameOrEmail"
              type="text"
              name="usernameOrEmail"
              value={form.usernameOrEmail}
              onChange={handleChange}
              placeholder="Enter username or email"
            />
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
                placeholder="Enter password"
              />
              <button
                type="button"
                className="icon-btn toggle-password"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <button
                type="button"
                className="icon-btn copy-password"
                onClick={() => copyToClipboard(form.user_password)}
                aria-label="Copy password"
              >
                <CopyIcon />
              </button>
            </div>
          </div>

          {requireOtp && (
            <>
              <div className="input-group">
                <label htmlFor="otp">OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength={6}
                />
              </div>

              <p className="login-link">
                Didn’t receive OTP?{" "}
                <span className="link-text" onClick={handleResendOTP}>
                  Resend
                </span>
              </p>
            </>
          )}

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading
              ? requireOtp
                ? "Verifying..."
                : "Logging in..."
              : requireOtp
              ? "Verify OTP"
              : "Login"}
          </button>

          <p className="login-link">
            Don’t have an account?{" "}
            <span className="link-text" onClick={() => navigate("/signup")}>
              Sign up
            </span>
          </p>
          <p className="login-link">
            Forgot your password?{" "}
            <span className="link-text" onClick={() => navigate("/forgot-password")}>
              Reset Password
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
