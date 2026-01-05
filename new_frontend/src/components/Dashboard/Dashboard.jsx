import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ProgressChart from "./ProgressChart";
import NudgeCard from "./NudgeCard";
import ReviewCard from "./ReviewCard";
import Navbar from "../Shared/Navbar";
import DSASheets from "./DSASheets";
import "./Dashboard.css";

const DashboardHome = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Authentication required");
    }
  }, [token]);

  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-grid">
          {/* Left - Progress Section */}
          <div className="dashboard-left">
            <h2 className="section-title">Your Progress</h2>
            <ProgressChart />
          </div>

          {/* Right - Stacked Nudge + Review */}
          <div className="dashboard-right">
            <div style={{ marginTop: "55px" }}>
              <NudgeCard />
              <ReviewCard />
            </div>
          </div>
        </div>

        {/* Active Sheets Section */}
        <div className="dashboard-active-sheets">
          <DSASheets />
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
