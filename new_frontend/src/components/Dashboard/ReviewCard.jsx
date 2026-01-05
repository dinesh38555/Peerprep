import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "./ReviewCard.css";

const ReviewCard = () => {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noReviewMsg, setNoReviewMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError("");
        setNoReviewMsg("");

        const response = await fetch("http://localhost:5000/reflections/review-today", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 404) {
          setReviews([]);
          setNoReviewMsg("No problems to review today! 🎉");
          return;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const data = await response.json();
        if (data && data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
        } else if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        } else {
          setReviews([]);
          setNoReviewMsg("No problems to review today! 🎉");
        }
      } catch (err) {
        setError(`Failed to fetch reviews: ${err.message}`);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  const handleToggleComplete = async (id) => {
    const review = reviews.find((r) => r.problem_id === id);
    if (!review) return;

    const newStatus = !review.completed;
    setReviews((prev) =>
      prev
        .map((r) =>
          r.problem_id === id ? { ...r, completed: newStatus } : r
        )
        .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
    );

    try {
      const response = await fetch("http://localhost:5000/reflections/update-completion", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problem_id: id, completed: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update completion status");
    } catch (err) {
      setReviews((prev) =>
        prev
          .map((r) =>
            r.problem_id === id ? { ...r, completed: !newStatus } : r
          )
          .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
      );
      setError(`Failed to update: ${err.message}`);
    }
  };

  return (
    <div className="review-card">
      <h3 className="card-heading">Today's Review</h3>

      {loading ? (
        <p className="review-placeholder">Loading reviews...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="review-placeholder">{noReviewMsg || "No problems to review today! 🎉"}</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r) => (
            <li
              key={r.problem_id}
              className={`review-item ${r.completed ? "completed" : ""}`}
            >
              <div className="review-item-content">
                <input
                  type="checkbox"
                  checked={r.completed || false}
                  onChange={() => handleToggleComplete(r.problem_id)}
                />
                <span className="review-problem">
                  {r.title || r.name || `Problem ${r.problem_id}`}
                </span>
              </div>
              {r.difficulty && (
                <span className={`tag tag-${r.difficulty.toLowerCase()}`}>
                  {r.difficulty}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewCard;
