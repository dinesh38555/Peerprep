import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { fetchSheetProblems } from "../../api/problems";
import "./DSASheets.css"; 
import Navbar from "../Shared/Navbar";

const ActiveSheets = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New state variables for problems data
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [problemsData, setProblemsData] = useState({ problems: [], totalPages: 0 });
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemsPage, setProblemsPage] = useState(1);
  const [problemsDifficulty, setProblemsDifficulty] = useState('');

  useEffect(() => {
    const fetchSheets = async () => {
      if (!user || !token) {
        setError("User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/progress/summary", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 7000
        });
        setSheets(res.data);
        setError("");
      } catch (err) {
        console.error("Error fetching sheet progress:", err);
        const serverMsg = err.response?.data?.error || err.response?.data?.message;
        const status = err.response?.status;
        setError(serverMsg ? `Server ${status}: ${serverMsg}` : (err.message || "Unable to load your sheets right now."));
      } finally {
        setLoading(false);
      }
    };

    fetchSheets();
  }, [user, token]);

  // Load problems for a sheet (call when selecting a sheet or changing pagination/filter)
  const loadProblems = async (sheetId, opts = {}) => {
    try {
      setProblemsLoading(true);

      // compute difficulty param safely (avoids mixing ?? and || in one expression)
      const difficultyParam = (opts.difficulty ?? problemsDifficulty) || undefined;
      const pageParam = opts.page ?? problemsPage;
      const limitParam = opts.limit ?? 10;

      const res = await fetchSheetProblems(sheetId, {
        difficulty: difficultyParam,
        page: pageParam,
        limit: limitParam
      });

      setProblemsData(res);
      setProblemsPage(pageParam);
      setSelectedSheet(sheetId);
    } catch (err) {
      console.error('Failed to load problems', err);
      setProblemsData({ problems: [], totalPages: 0 });
    } finally {
      setProblemsLoading(false);
    }
  };

  const handleContinue = (sheet_id, e) => {
    e.stopPropagation(); // Prevent sheet card click event
    navigate(`/problems/${sheet_id}`, {
      state: { 
        sheetName: sheets.find(s => s.sheet_id === sheet_id)?.sheet_name
      }
    });
  };

  if (loading) {
    return (
      <div className="active-sheets-section">
        <h2 className="section-title">DSA Sheets</h2>
        <p className="section-subtext">Loading your progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="active-sheets-section">
        <h2 className="section-title">Active Sheets</h2>
        <p className="section-subtext error-text">{error}</p>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="dsa-sheets-section">
      <h2 className="section-title">DSA Sheets</h2>
      <div className="sheets-container">
        {sheets.map((sheet) => (
          <div key={sheet.sheet_id} className="sheet-card">
            <div className="sheet-header">
              <h3>{sheet.sheet_name}</h3>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${(sheet.solved_problems / sheet.total_problems) * 100}%`}}
                  />
                </div>
                <div className="progress-text">
                  <span>{sheet.solved_problems} / {sheet.total_problems} completed</span>
                  <span className="bold">{Math.round((sheet.solved_problems / sheet.total_problems) * 100)}%</span>
                </div>
              </div>
            </div>
            <button 
              className="continue-btn"
              onClick={(e) => handleContinue(sheet.sheet_id, e)}
            >
              Continue →
            </button>
          </div>
        ))}
      </div>

      {/* Problems panel (shows when a sheet is selected) */}
      {selectedSheet && (
        <div className="problems-panel" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <h3>Problems for sheet #{selectedSheet}</h3>
            <label>
              Difficulty:
              <select
                value={problemsDifficulty}
                onChange={e => {
                  setProblemsDifficulty(e.target.value);
                  setProblemsPage(1);
                  loadProblems(selectedSheet, { difficulty: e.target.value, page: 1 });
                }}
              >
                <option value=''>All</option>
                <option value='Easy'>Easy</option>
                <option value='Medium'>Medium</option>
                <option value='Hard'>Hard</option>
              </select>
            </label>
            <button onClick={() => { setSelectedSheet(null); setProblemsData({ problems: [], totalPages: 0 }); }}>
              Close
            </button>
          </div>

          {problemsLoading ? (
            <div>Loading problems...</div>
          ) : (
            <>
              <ul>
                {problemsData.problems.map(p => (
                  <li key={p.problem_id}>
                    {p.sheet_order}. <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
                    <small> — {p.platform} • {p.difficulty}</small>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 8 }}>
                <button
                  disabled={problemsPage <= 1}
                  onClick={() => loadProblems(selectedSheet, { page: problemsPage - 1 })}
                >
                  Prev
                </button>
                <span style={{ margin: '0 8px' }}>Page {problemsPage} of {problemsData.totalPages || 1}</span>
                <button
                  disabled={problemsPage >= (problemsData.totalPages || 1)}
                  onClick={() => loadProblems(selectedSheet, { page: problemsPage + 1 })}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default ActiveSheets;
