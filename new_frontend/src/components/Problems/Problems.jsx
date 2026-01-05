import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Problems.css";
import Navbar from "../Shared/Navbar";
import ConfirmModal from '../ConfirmModal/ConfirmModal';

const normalizeStatus = (raw) => {
  if (raw === null || raw === undefined) return "Unsolved";
  const s = String(raw).trim().toLowerCase();
  if (["solved", "done", "1", "true", "completed"].includes(s)) return "Solved";
  if (["attempted", "in_progress", "in-progress", "trying", "partial", "2"].includes(s))
    return "Attempted";
  return "Unsolved";
};

const Problems = () => {
  const { sheet_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState({});
  const [reflection, setReflection] = useState({});
  const [showReflectionBox, setShowReflectionBox] = useState({});
  const [hasExistingReflection, setHasExistingReflection] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const problemsPerPage = 15;

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    const fetchProblems = async () => {
      if (!token || !user) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/progress/sheet/${sheet_id}${location.search || ""}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401) {
          navigate("/login", { state: { from: location.pathname, message: "Session expired" } });
          return;
        }

        if (!response.ok) {
          const body = await response.text().catch(() => null);
          throw new Error(`HTTP ${response.status}: ${body}`);
        }

        const data = await response.json();
        const rawProblems = (data && data.problems) || [];

        const normalized = rawProblems.map((p) => ({
          ...p,
          problem_status: normalizeStatus(p.problem_status ?? p.status ?? p.progress),
          problem_url: p.URL || p.url || p.link || p.problem_url || null,
        }));

        setProblems(normalized);
        await preloadReflections(normalized);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    const preloadReflections = async (problems) => {
      for (const p of problems) {
        try {
          const res = await fetch(
            `http://localhost:5000/reflections/user/${user.user_id}/${p.problem_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.ok) {
            const data = await res.json();
            const normalizedReflection = {
              reflection_text: data.reflection_text || data.text || "",
              sentiment: data.sentiment || "Neutral",
              keywords: data.keywords || "",
            };
            // Reflection exists but collapsed by default
            setHasExistingReflection((prev) => ({ ...prev, [p.problem_id]: true }));
            setReflection((prev) => ({ ...prev, [p.problem_id]: normalizedReflection }));
            if (!hasExistingReflection[p.problem_id])
              setShowReflectionBox((prev) => ({ ...prev, [p.problem_id]: false }));
          }
        } catch {
          // ignore missing reflection errors
        }
      }
    };

    fetchProblems();
  }, [sheet_id, token, user, navigate, location.pathname, location.search]);

  const updateProblemStatus = async (problem_id, newStatus) => {
    const prevProblems = [...problems];
    setProblems((ps) =>
      ps.map((p) => (p.problem_id === problem_id ? { ...p, problem_status: newStatus } : p))
    );
    setUpdating((u) => ({ ...u, [problem_id]: true }));

    try {
      const res = await fetch("http://localhost:5000/progress/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problem_id, problem_status: newStatus }),
      });

      if (res.status === 401) {
        navigate("/login", { state: { from: location.pathname, message: "Session expired" } });
        return;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => null);
        throw new Error(`HTTP ${res.status}: ${body}`);
      }

      // Show reflection box when problem is marked as Solved
      if (newStatus === "Solved") {
        // Initialize an empty reflection if none exists
        if (!reflection[problem_id]) {
          setReflection((prev) => ({
            ...prev,
            [problem_id]: { reflection_text: "", sentiment: "Neutral", keywords: "" },
          }));
        }
        // Set hasExistingReflection to false for new reflections
        setHasExistingReflection((prev) => ({
          ...prev,
          [problem_id]: false,
        }));
        // Show the reflection box
        setShowReflectionBox((prev) => ({
          ...prev,
          [problem_id]: true,
        }));
      }
    } catch (err) {
      setProblems(prevProblems);
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setUpdating((u) => {
        const copy = { ...u };
        delete copy[problem_id];
        return copy;
      });
    }
  };

  const submitReflection = async (problem_id) => {
    const reflectionText = reflection[problem_id]?.reflection_text;
    if (!reflectionText?.trim()) return;

    const isEdit = hasExistingReflection[problem_id];
    try {
      if (isEdit) {
        await editReflection(problem_id);
      } else {
        const res = await fetch("http://localhost:5000/reflections/add", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ problem_id, reflection_text: reflectionText }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => null);
          throw new Error(`HTTP ${res.status}: ${body}`);
        }

        setHasExistingReflection((prev) => ({ ...prev, [problem_id]: true }));
        setShowReflectionBox((prev) => ({ ...prev, [problem_id]: false }));
        showToast("Reflection saved successfully!", "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to save reflection", "error");
    }
  };

  const editReflection = async (problem_id) => {
    // Get reflection text from the correct state structure
    const reflectionText = reflection[problem_id]?.reflection_text;
    if (!reflectionText?.trim()) return;

    try {
      const res = await fetch(
        `http://localhost:5000/reflections/user/${user.user_id}/${problem_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reflection_text: reflectionText }),
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => null);
        throw new Error(`HTTP ${res.status}: ${body}`);
      }

      // Update local state to reflect changes
      setReflection((prev) => ({
        ...prev,
        [problem_id]: {
          ...prev[problem_id],
          reflection_text: reflectionText
        }
      }));
      setShowReflectionBox((prev) => ({ ...prev, [problem_id]: false }));
      showToast("Reflection updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update reflection", "error");
    }
  };

  const viewReflection = async (problem_id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/reflections/user/${user.user_id}/${problem_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        if (res.status === 404) {
          setHasExistingReflection((prev) => ({ ...prev, [problem_id]: false }));
          showToast("No reflection found for this problem", "info");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setReflection((prev) => ({
        ...prev,
        [problem_id]: {
          reflection_text: data.reflection_text || data.text || "",
          sentiment: data.sentiment || "Neutral",
          keywords: data.keywords || "",
        },
      }));
      setShowReflectionBox((prev) => ({ ...prev, [problem_id]: true }));
    } catch {
      showToast("Failed to load reflection", "error");
    }
  };

  const closeReflectionView = (problem_id) => {
    setShowReflectionBox((prev) => ({ ...prev, [problem_id]: false }));
  };

  const deleteReflection = async (problem_id) => {
    setProblemToDelete(problem_id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const problem_id = problemToDelete;
    setShowDeleteModal(false);
    setProblemToDelete(null);

    try {
      const res = await fetch(
        `http://localhost:5000/reflections/user/${user.user_id}/${problem_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => null);
        throw new Error(`HTTP ${res.status}: ${body}`);
      }

      setReflection((prev) => {
        const newReflection = { ...prev };
        delete newReflection[problem_id];
        return newReflection;
      });
      setHasExistingReflection((prev) => ({
        ...prev,
        [problem_id]: false
      }));
      setShowReflectionBox((prev) => ({
        ...prev,
        [problem_id]: false
      }));
      showToast("Reflection deleted successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete reflection", "error");
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesDifficulty =
      difficultyFilter === "All" || problem.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "All" || problem.problem_status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesDifficulty && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);
  const startIndex = (currentPage - 1) * problemsPerPage;
  const endIndex = startIndex + problemsPerPage;
  const currentProblems = filteredProblems.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading)
    return (
      <div className="problems-page">
        <div className="loading-container">
          <div className="skeleton-circle"></div>
          <p className="loading-text">Loading problems...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="problems-page">
        <div className="error-container">
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <p className="error-message">{error}</p>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="problems-page">
        {toast.show && (
          <div className={`toast-notification ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === "success" ? "✓" : "⚠"}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        )}

        <div className="problems-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                {location.state?.sheetName || `Sheet ${sheet_id}`}
              </h1>
            </div>
            <div className="filters">
              <select
                className="filter-dropdown"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <select
                className="filter-dropdown"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Unsolved">Unsolved</option>
                <option value="Attempted">Attempted</option>
                <option value="Solved">Solved</option>
              </select>
            </div>
          </div>

          <div className="problems-list">
            {currentProblems.map((problem) => {
              const statusClass = (problem.problem_status || "Unsolved").toLowerCase();
              const difficultyClass = String(problem.difficulty || "").toLowerCase();
              const href = problem.problem_url;
              const reflectionData = reflection[problem.problem_id];
              const isOpen = showReflectionBox[problem.problem_id];

              return (
                <div key={problem.problem_id} className="problem-card">
                  <div className="problem-header">
                    <div className="problem-title-section">
                      <h3 className="problem-title">{problem.title}</h3>
                      <div className="problem-badges">
                        <span className={`tag tag-${difficultyClass}`}>
                          {problem.difficulty || "Unknown"}
                        </span>
                        <span className="platform-badge">
                          {problem.platform || "Platform"}
                        </span>
                      </div>
                    </div>

                    <div className="status-control">
                      <label className="status-label">Status</label>
                      <select
                        className={`status-dropdown ${statusClass}`}
                        value={problem.problem_status}
                        onChange={(e) =>
                          updateProblemStatus(problem.problem_id, e.target.value)
                        }
                        disabled={!!updating[problem.problem_id]}
                      >
                        <option value="Unsolved">Unsolved</option>
                        <option value="Attempted">Attempted</option>
                        <option value="Solved">Solved</option>
                      </select>
                    </div>
                  </div>

                  {/* Only show existing reflection display when it exists and is open */}
                  {isOpen && hasExistingReflection[problem.problem_id] && (
                    <div className="reflection-display">
                      <div className="reflection-header">
                        <h4 className="reflection-title">📝 Your Reflection</h4>
                        {reflection[problem.problem_id]?.sentiment && (
                          <span className={`sentiment-badge sentiment-${reflection[problem.problem_id].sentiment.toLowerCase()}`}>
                            {reflection[problem.problem_id].sentiment}
                          </span>
                        )}
                      </div>
                      <textarea
                        className="reflection-textarea"
                        value={reflection[problem.problem_id]?.reflection_text || ""}
                        onChange={(e) =>
                          setReflection((prev) => ({
                            ...prev,
                            [problem.problem_id]: {
                              ...prev[problem.problem_id],
                              reflection_text: e.target.value,
                            },
                          }))
                        }
                        placeholder="Write your thoughts about solving this problem..."
                      />
                      <div className="reflection-actions">
                        <button
                          className="btn-primary"
                          onClick={() => editReflection(problem.problem_id)}
                        >
                          Save Changes
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => closeReflectionView(problem.problem_id)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => deleteReflection(problem.problem_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Only show View Reflection button when there's an existing reflection and box is closed */}
                  {!isOpen && hasExistingReflection[problem.problem_id] && (
                    <div className="reflection-actions">
                      <button
                        className="btn-outline"
                        onClick={() => viewReflection(problem.problem_id)}
                      >
                        📖 View Reflection
                      </button>
                    </div>
                  )}

                  {/* Only show Add Reflection form when problem is solved and no existing reflection */}
                  {showReflectionBox[problem.problem_id] && !hasExistingReflection[problem.problem_id] && (
                    <div className="reflection-input-container">
                      <h4 className="reflection-title">📝 Add Your Reflection</h4>
                      <textarea
                        className="reflection-textarea"
                        value={reflection[problem.problem_id]?.reflection_text || ""}
                        onChange={(e) =>
                          setReflection((prev) => ({
                            ...prev,
                            [problem.problem_id]: {
                              ...prev[problem.problem_id],
                              reflection_text: e.target.value,
                            },
                          }))
                        }
                        placeholder="Write your thoughts about solving this problem..."
                      />
                      <div className="reflection-actions">
                        <button
                          className="btn-primary"
                          onClick={() => submitReflection(problem.problem_id)}
                        >
                          Save Reflection
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => closeReflectionView(problem.problem_id)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="problem-actions">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-solve"
                      >
                        Solve on {problem.platform || "site"} →
                      </a>
                    ) : (
                      <button className="btn-solve disabled" disabled>
                        No link available
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        message="Are you sure you want to delete this reflection?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setProblemToDelete(null);
        }}
      />
    </>
  );
};

export default Problems;
