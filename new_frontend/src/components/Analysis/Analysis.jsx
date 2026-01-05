import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Shared/Navbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const Analysis = () => {
  const { token } = useAuth();
  const [progressData, setProgressData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [reviewStatus, setReviewStatus] = useState({ items: [], count: 0, daysAhead: 14 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [progressRes, sentimentRes, reviewRes] = await Promise.all([
          fetch("http://localhost:5000/analysis/progress?days=30", {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("http://localhost:5000/analysis/sentiment?days=30&window=7", {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("http://localhost:5000/analysis/review-status?days=14&limit=100", {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!progressRes.ok || !sentimentRes.ok || !reviewRes.ok) {
          throw new Error("Failed to load analysis data");
        }

        const progressJson = await progressRes.json();
        const sentimentJson = await sentimentRes.json();
        const reviewJson = await reviewRes.json();

        setProgressData(progressJson.data || []);
        setSentimentData(
          sentimentJson.daily?.map((d, i) => ({
            date: d.date,
            Positive: +(sentimentJson.rolling.rollingPositive[i] * 100).toFixed(2),
            Neutral: +(sentimentJson.rolling.rollingNeutral[i] * 100).toFixed(2),
            Negative: +(sentimentJson.rolling.rollingNegative[i] * 100).toFixed(2),
          })) || []
        );
        setReviewStatus({
          items: reviewJson.items || [],
          count: reviewJson.count || 0,
          daysAhead: reviewJson.daysAhead || 14,
        });
        setError("");
      } catch (err) {
        console.error("Failed to load analysis data:", err);
        setError("Unable to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
        }}>
          <p style={{ color: "#f3f4f6", fontWeight: "600", marginBottom: "8px" }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontSize: "14px", margin: "4px 0" }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return { bg: "#d1fae5", text: "#065f46" };
      case "medium":
        return { bg: "#fed7aa", text: "#92400e" };
      case "hard":
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: "#e5e7eb", text: "#374151" };
    }
  };

  // Get sentiment badge color
  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return { bg: "#d1fae5", text: "#065f46" };
      case "neutral":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "negative":
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: "#e5e7eb", text: "#374151" };
    }
  };

  if (loading) {
    return (
      <div className="analysis-container p-8">
        <div className="skeleton-loader">
          <div className="skeleton-circle"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-container p-8">
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
    <div className="analysis-container p-8 space-y-10">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: "#1f2937" }}>
          Analytics Dashboard
        </h2>
        <p className="text-gray-600">Track your progress and sentiment trends</p>
      </div>

      {/* Progress Chart */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
      }}>
        <h3 className="text-xl font-semibold mb-6" style={{ color: "#1f2937" }}>
          Problem Progress (30 Days)
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis 
              dataKey="date" 
              stroke="#374151"
              style={{ fontSize: "12px", fontWeight: "500" }}
              tick={{ fill: "#374151" }}
            />
            <YAxis 
              stroke="#374151"
              style={{ fontSize: "12px", fontWeight: "500" }}
              tick={{ fill: "#374151" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: "#374151", fontWeight: "500" }}>{value}</span>
              )}
            />
            <Bar dataKey="Solved" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Attempted" stackId="a" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sentiment Chart */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
      }}>
        <h3 className="text-xl font-semibold mb-6" style={{ color: "#1f2937" }}>
          Reflection Sentiment Trend
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={sentimentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis 
              dataKey="date" 
              stroke="#374151"
              style={{ fontSize: "12px", fontWeight: "500" }}
              tick={{ fill: "#374151" }}
            />
            <YAxis 
              domain={[0, 100]} 
              tickFormatter={(v) => `${v}%`}
              stroke="#374151"
              style={{ fontSize: "12px", fontWeight: "500" }}
              tick={{ fill: "#374151" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: "#374151", fontWeight: "500" }}>{value}</span>
              )}
            />
            <Line 
              type="monotone" 
              dataKey="Positive" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{ r: 6, fill: "#10b981" }}
            />
            <Line 
              type="monotone" 
              dataKey="Neutral" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6, fill: "#3b82f6" }}
            />
            <Line 
              type="monotone" 
              dataKey="Negative" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#ef4444" }}
              activeDot={{ r: 6, fill: "#ef4444" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Review Status Section */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
      }}>
        <div style={{ marginBottom: "20px" }}>
          <h3 className="text-xl font-semibold" style={{ color: "#1f2937" }}>
            Upcoming Reviews
          </h3>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>
            {reviewStatus.count} problem{reviewStatus.count !== 1 ? "s" : ""} scheduled for review in the next {reviewStatus.daysAhead} days
          </p>
        </div>

        {reviewStatus.count === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#6b7280",
          }}>
            <p style={{ fontSize: "16px" }}>No reviews scheduled</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Complete more problems to schedule reviews
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {reviewStatus.items.map((item) => {
              const diffColor = getDifficultyColor(item.difficulty);
              const sentColor = getSentimentColor(item.sentiment);
              
              return (
                <div
                  key={item.reflection_id}
                  style={{
                    padding: "16px",
                    marginBottom: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: item.completed ? "#f9fafb" : "#ffffff",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        color: "#1f2937", 
                        fontWeight: "600", 
                        fontSize: "16px",
                        marginBottom: "8px",
                      }}>
                        {item.title}
                      </h4>
                      
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: diffColor.bg,
                          color: diffColor.text,
                        }}>
                          {item.difficulty}
                        </span>
                        
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: sentColor.bg,
                          color: sentColor.text,
                        }}>
                          {item.sentiment}
                        </span>
                        
                        {item.completed && (
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                          }}>
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      
                      <p style={{ color: "#6b7280", fontSize: "13px" }}>
                        Review Date: {formatDate(item.review_date)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Analysis;
