import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";
import logo from "../../assets/logo.png"; 

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={() => navigate("/dashboard")}>
        <img src={logo} alt="PeerPrep Logo" className="navbar-logo" /> {/* Added logo */}
        <h2 className="navbar-logo-text">PeerPrep</h2> {/* Adjusted text class */}
      </div>

      <div className="navbar-links">
        <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
        <NavLink to="/sheets" className="nav-link">Sheets</NavLink>
        <NavLink to="/analysis" className="nav-link">Analysis</NavLink>
      </div>

      <div className="navbar-right">
        <span className="user-name">Hi, {user?.first_name}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
