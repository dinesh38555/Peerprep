import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";

const ProgressChart = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({ total: 0, solved: 0, attempted: 0, unsolved: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchOverview = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("http://localhost:5000/progress/summary?overview=true", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTotals({
          total: data.total || 0,
          solved: data.solved || 0,
          attempted: data.attempted || 0,
          unsolved: data.unsolved || 0,
        });
        setError("");
      } catch (err) {
        console.error("Failed to load progress overview:", err);
        setError("Unable to load progress");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, [token]);

  const data = [
    { name: "Solved", value: totals.solved },
    { name: "Attempted", value: totals.attempted },
    { name: "Unsolved", value: totals.unsolved },
  ];

  const total = totals.total || data.reduce((s, e) => s + e.value, 0);
  const solvedPercent = total ? Math.round((data[0].value / total) * 100) : 0;

  const COLORS = [
    "url(#solvedGradient)",
    "url(#attemptedGradient)",
    "url(#unsolvedGradient)",
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const tooltipData = payload[0].payload;
      const percentage = total ? ((tooltipData.value / total) * 100).toFixed(1) : "0.0";
      return (
        <div className="tooltip-content">
          <p className="tooltip-label">{tooltipData.name}</p>
          <p className="tooltip-value">
            {tooltipData.value}{" "}
            <span className="tooltip-percent">({percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom center label - BETTER POSITIONING
  const renderCenterLabel = () => {
    return (
      <g>
        <text
          x="50%"
          y="45%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: "2.8rem",
            fontWeight: "700",
            fill: "#1f2937",
            letterSpacing: "-0.5px",
          }}
        >
          {solvedPercent}%
        </text>
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: "0.9rem",
            fontWeight: "600",
            fill: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "1.2px",
          }}
        >
          Solved
        </text>
      </g>
    );
  };

  return (
    <div className="progress-card">
      {/* Header Section */}
      <div className="progress-header">
        <div>
          <h3 className="progress-title">Progress Overview</h3>
          <p className="progress-subtitle">Your problem-solving journey</p>
        </div>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-label">Total Problems</span>
            <span className="stat-value">{total}</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="chart-wrapper">
        {isLoading ? (
          <div className="skeleton-loader">
            <div className="skeleton-circle"></div>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <defs>
                <linearGradient
                  id="solvedGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <linearGradient
                  id="attemptedGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <linearGradient
                  id="unsolvedGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
              </defs>

              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                cornerRadius={8}
                stroke="none"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.15))",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </Pie>

              {renderCenterLabel()}

              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span className="legend-text">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Grid */}
      <div className="progress-stats-grid">
        {data.map((item, index) => {
          const percentage = total ? ((item.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" data-index={index}>
                <div className="stat-icon-inner"></div>
              </div>
              <div className="stat-content">
                <p className="stat-card-label">{item.name}</p>
                <p className="stat-card-value">
                  {item.value}
                  <span className="stat-card-percent">{percentage}%</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressChart;
