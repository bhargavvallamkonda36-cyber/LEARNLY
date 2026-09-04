import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const API_URL = API_BASE_URL.endsWith("/api/v1")
  ? API_BASE_URL
  : `${API_BASE_URL}/api/v1`;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        let message = "Unable to create account.";

        if (data?.detail) {
          if (Array.isArray(data.detail)) {
            message = data.detail
              .map((item) => item?.msg || "Invalid input.")
              .join(", ");
          } else if (typeof data.detail === "string") {
            message = data.detail;
          }
        }

        throw new Error(message);
      }

      setSuccess(
        "Account created successfully! Redirecting you to login..."
      );

      setForm({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      if (
        err instanceof TypeError &&
        err.message.toLowerCase().includes("fetch")
      ) {
        setError(
          "Unable to connect to the server. Please make sure the backend is running on port 8000."
        );
      } else {
        setError(err.message || "Unable to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-background">
        <div className="register-glow register-glow-one"></div>
        <div className="register-glow register-glow-two"></div>
      </div>

      <div className="register-container">
        <div className="register-brand">
          <div className="register-logo">🤖</div>

          <div>
            <div className="register-brand-name">learnly</div>
            <div className="register-brand-subtitle">LEARNLY LMS</div>
          </div>
        </div>

        <div className="register-card">
          <div className="register-header">
            <div className="register-label">JOIN LEARNLY</div>

            <h1>Create your account.</h1>

            <p>
              Start learning with courses, progress tracking and AI-powered
              learning.
            </p>
          </div>

          {error && (
            <div className="register-alert register-alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="register-alert register-alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label htmlFor="full_name">Full Name</label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={handleChange}
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div className="register-field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="register-field">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
              />

              <small>Password must contain at least 8 characters.</small>
            </div>

            <div className="register-field">
              <label htmlFor="confirm_password">Confirm Password</label>

              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="Confirm your password"
                value={form.confirm_password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="register-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="register-login-button">
            Back to Sign In
          </Link>

          <div className="register-note">
            <span>🎓</span>
            <p>
              New accounts are created as student accounts. Instructor and
              Admin access is managed separately.
            </p>
          </div>
        </div>

        <div className="register-footer">
          © {new Date().getFullYear()} Learnly LMS
        </div>
      </div>
    </div>
  );
}
