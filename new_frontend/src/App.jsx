import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Import Navigate
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Signup from "./components/Auth/Signup";
import VerifyOTP from "./components/Auth/VerifyOTP";
import Login from "./components/Auth/Login";
import ProtectedRoute from "./components/Shared/ProtectedRoute";
import Dashboard from "./components/Dashboard/Dashboard";
import DSASheets from "./components/Dashboard/DSASheets";
import Problems from "./components/Problems/Problems";
import Analysis from "./components/Analysis/Analysis";
import ForgotPassword from "./components/Auth/ForgotPassword"; // Import ForgotPassword component

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} /> {/* Redirect home to login */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sheets"
            element={
              <ProtectedRoute>
                <DSASheets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/problems/:sheet_id"
            element={
              <ProtectedRoute>
                <Problems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <Analysis />
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Add ForgotPassword route */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
