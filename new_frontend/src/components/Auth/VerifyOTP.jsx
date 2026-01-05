// src/components/Auth/VerifyOTP.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./Signup.css";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupData, setSignupData] = useState(null);

  useEffect(() => {
    if (location.state) {
      setSignupData(location.state);
    } else {
      toast.error("Signup data missing. Please sign up again.");
      navigate("/signup");
    }
  }, [location, navigate]);

  const handleResendOTP = async () => {
    if (!signupData?.email) {
      toast.error("Email missing. Please sign up again.");
      navigate("/signup");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupData.email }),
      });
      const data = await res.json();

      if (res.ok) toast.success("OTP resent successfully!");
      else toast.error(data.message || "Failed to resend OTP");
    } catch (err) {
      console.error("Resend OTP error:", err);
      toast.error("Network error. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter your OTP.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...signupData, otp: otp.trim() };
      const res = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || "Signup failed");
        setLoading(false);
        return;
      }

      toast.success("Signup successful! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("Verify OTP Error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Email Verification</h2>
        <p className="signup-subtitle">
          Enter the OTP sent to <strong>{signupData?.email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Signup"}
          </button>

          <p className="login-link">
            Didn't receive OTP?{" "}
            <span className="link-text" onClick={handleResendOTP}>
              Resend
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
