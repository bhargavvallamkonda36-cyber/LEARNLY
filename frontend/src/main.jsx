import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

import "./styles.css";

import {
  getAccessToken,
  getStoredUser,
  saveAuth,
  clearAuth,
  getRoles,
  isInstructor,
  migrateAuthStorage,
} from "./services/auth";

// ============================================================
// EXISTING PROJECT PAGES
// ============================================================

import Dashboard from "./pages/Dashboard";
import MyLearning from "./pages/MyLearning";
import AITutor from "./pages/AITutor";
import Profile from "./pages/Profile";

import CourseLearning from "./pages/CourseLearning";
import CourseModuleSelector from "./pages/CourseModuleSelector";
import LecturePlayer from "./pages/LecturePlayer";

// ============================================================
// INSTRUCTOR
// ============================================================

import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorCourses from "./pages/InstructorCourses";
import InstructorCourseCreate from "./pages/InstructorCourseCreate";
import InstructorCourseBuilder from "./pages/InstructorCourseBuilder";
import InstructorCourseEdit from "./pages/InstructorCourseEdit";

// ============================================================
// ADMIN
// ============================================================

import AdminDashboard from "./pages/AdminDashboard";

// ============================================================
// API CONFIGURATION
// ============================================================

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const CLEAN_API_BASE =
  RAW_API_BASE.replace(/\/+$/, "");

const API_BASE = CLEAN_API_BASE.endsWith(
  "/api/v1"
)
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api/v1`;

// ============================================================
// AUTH STORAGE
// ============================================================

migrateAuthStorage();

const getToken = getAccessToken;

// ============================================================
// ROLE HELPERS
// ============================================================

function isAdmin(user) {
  if (!user) {
    return false;
  }

  try {
    const roles = getRoles(user);

    return roles.some(
      (role) =>
        String(role).toLowerCase() === "admin"
    );
  } catch {
    const roles = Array.isArray(user?.roles)
      ? user.roles
      : [];

    return roles.some((role) => {
      const name =
        typeof role === "string"
          ? role
          : role?.name;

      return (
        String(name || "").toLowerCase() ===
        "admin"
      );
    });
  }
}

// ============================================================
// DEFAULT ROUTE
// ============================================================

function getDefaultRoute(user) {
  if (isAdmin(user)) {
    return "/admin";
  }

  if (isInstructor(user)) {
    return "/instructor/dashboard";
  }

  return "/dashboard";
}

// ============================================================
// API HELPER
// ============================================================

async function apiFetch(path, options = {}) {
  const token = getToken();

  let normalizedPath = path || "";

  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }

  /*
   * Prevent accidental:
   *
   * /api/v1/api/v1/...
   *
   * This is especially useful when a service passes
   * an already-prefixed endpoint.
   */
  if (
    normalizedPath.startsWith(
      "/api/v1/api/v1"
    )
  ) {
    normalizedPath =
      normalizedPath.replace(
        "/api/v1/api/v1",
        "/api/v1"
      );
  }

  /*
   * If a service passes a full /api/v1 URL path,
   * remove the duplicated prefix because API_BASE
   * already contains /api/v1.
   */
  if (
    normalizedPath.startsWith(
      "/api/v1/"
    )
  ) {
    normalizedPath =
      normalizedPath.substring(
        "/api/v1".length
      );
  }

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE}${normalizedPath}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    const connectionError =
      new Error(
        `Cannot connect to Learnly backend at ${API_BASE}. Make sure FastAPI is running.`
      );

    connectionError.status = 0;

    throw connectionError;
  }

  let data = null;

  const text =
    await response.text();

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
    }

    const detail =
      typeof data?.detail ===
      "string"
        ? data.detail
        : Array.isArray(
            data?.detail
          )
          ? data.detail
              .map(
                (item) =>
                  item?.msg || item
              )
              .join(", ")
          : data?.message ||
            (typeof data === "string"
              ? data
              : `Request failed with status ${response.status}`);

    const error =
      new Error(detail);

    error.status =
      response.status;

    error.data = data;

    throw error;
  }

  return data;
}

// ============================================================
// LOGIN PAGE
// ============================================================

function LoginFallback() {
  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState(
      "student@lmsai.com"
    );

  const [password, setPassword] =
    useState(
      "Student@123"
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function login(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_BASE}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              email:
                email.trim()
                  .toLowerCase(),

              password,
            }),
          }
        );

      const text =
        await response.text();

      let data = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        const message =
          typeof data?.detail ===
          "string"
            ? data.detail
            : Array.isArray(
                data?.detail
              )
              ? data.detail
                  .map(
                    (item) =>
                      item?.msg ||
                      item
                  )
                  .join(", ")
              : data?.message ||
                (typeof data ===
                "string"
                  ? data
                  : `Login failed (${response.status})`);

        throw new Error(
          message
        );
      }

      if (
        !data?.access_token
      ) {
        throw new Error(
          "Login succeeded but no access token was returned."
        );
      }

      saveAuth(data);

      const user =
        data.user ||
        getStoredUser();

      if (isAdmin(user)) {
        navigate(
          "/admin",
          {
            replace: true,
          }
        );

        return;
      }

      if (isInstructor(user)) {
        navigate(
          "/instructor/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }

  function useStudentDemo() {
    setEmail(
      "student@lmsai.com"
    );

    setPassword(
      "Student@123"
    );

    setError("");
  }

  function openInstructorDemo() {
    setEmail(
      "instructor@lmsai.com"
    );

    setPassword(
      "Instructor@123"
    );

    setError(
      "Instructor demo credentials loaded. Click Sign in."
    );
  }

  function openAdminDemo() {
    setEmail(
      "admin@lmsai.com"
    );

    setPassword(
      "Admin@123"
    );

    setError(
      "Admin demo credentials loaded. Click Sign in."
    );
  }

  return (
    <div className="login-page">

      <div className="login-brand-panel">

        <div className="login-brand">

          <div className="brand-icon">
            🤖
          </div>

          <span>
            learnly
          </span>

        </div>

        <div className="login-brand-content">

          <div className="eyebrow">
            LEARNLY LMS
          </div>

          <h1>
            Learn at your pace.
            <br />

            <span>
              Think with AI.
            </span>
          </h1>

          <p>
            Courses, progress tracking
            and an intelligent tutor
            in one place.
          </p>

        </div>

      </div>

      <div className="login-form-panel">

        <div className="login-card">

          <div className="login-card-brand">

            <div className="brand-icon">
              🤖
            </div>

            <span>
              learnly
            </span>

          </div>

          <h2>
            Welcome back
          </h2>

          <p className="login-subtitle">
            Sign in to continue learning.
          </p>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form
            onSubmit={login}
          >

            <label htmlFor="login-email">
              Email
            </label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              className="primary-button login-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>

          <div className="create-account-section">
            <span>Don't have an account?</span>

            <Link
              to="/register"
              className="create-account-link"
            >
              Create new account
            </Link>
          </div>

          <div className="demo-box">

            <strong>
              Demo student
            </strong>

            <button
              type="button"
              className="demo-link"
              onClick={
                useStudentDemo
              }
            >
              student@lmsai.com / Student@123
            </button>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={
              openInstructorDemo
            }
          >
            Open Instructor Demo
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={
              openAdminDemo
            }
          >
            Open Admin Demo
          </button>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// CREATE NEW ACCOUNT / REGISTER PAGE
// ============================================================

function Register() {
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password: form.password,
        }),
      });

      const text = await response.text();

      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        const message =
          typeof data?.detail === "string"
            ? data.detail
            : Array.isArray(data?.detail)
              ? data.detail.map((item) => item?.msg || item).join(", ")
              : data?.message ||
                (typeof data === "string"
                  ? data
                  : `Registration failed (${response.status})`);

        throw new Error(message);
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setForm({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);

      if (
        err instanceof TypeError &&
        err.message.toLowerCase().includes("fetch")
      ) {
        setError(
          `Unable to connect to the server at ${API_BASE}. Make sure FastAPI is running on port 8000.`
        );
      } else {
        setError(err.message || "Unable to create account.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-background">
        <div className="register-glow register-glow-one"></div>
        <div className="register-glow register-glow-two"></div>
      </div>

      <div className="register-container">
        <div className="register-brand">
          <div className="brand-icon">🤖</div>

          <div>
            <div className="register-brand-name">learnly</div>
            <div className="register-brand-subtitle">
              LEARNLY LMS
            </div>
          </div>
        </div>

        <div className="register-card">
          <div className="register-header">
            <div className="register-label">JOIN LEARNLY</div>

            <h1>Create your account.</h1>

            <p>
              Start learning with courses, progress tracking and
              AI-powered learning.
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

          <form
            onSubmit={handleSubmit}
            className="register-form"
          >
            <div className="register-field">
              <label htmlFor="register-full-name">
                Full Name
              </label>

              <input
                id="register-full-name"
                name="full_name"
                type="text"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={handleChange}
                autoComplete="name"
                disabled={loading}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-email">
                Email
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-password">
                Password
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
                minLength={8}
                required
              />

              <small>
                Password must contain at least 8 characters.
              </small>
            </div>

            <div className="register-field">
              <label htmlFor="register-confirm-password">
                Confirm Password
              </label>

              <input
                id="register-confirm-password"
                name="confirm_password"
                type="password"
                placeholder="Confirm your password"
                value={form.confirm_password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
                minLength={8}
                required
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

          <Link
            to="/login"
            className="register-login-button"
          >
            Back to Sign In
          </Link>

          <div className="register-note">
            <span>🎓</span>

            <p>
              New accounts are created as student accounts.
              Instructor and Admin access is managed separately.
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

// ============================================================
// AUTH GUARD
// ============================================================

function RequireAuth({
  children,
}) {
  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// STUDENT GUARD
// ============================================================

function StudentRoute({
  children,
}) {
  const user =
    getStoredUser();

  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (isAdmin(user)) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (
    user &&
    isInstructor(user)
  ) {
    return (
      <Navigate
        to="/instructor/dashboard"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// INSTRUCTOR GUARD
// ============================================================

function InstructorRoute({
  children,
}) {
  const user =
    getStoredUser();

  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (isAdmin(user)) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (!isInstructor(user)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// ADMIN GUARD
// ============================================================

function AdminRoute({
  children,
}) {
  const user =
    getStoredUser();

  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isAdmin(user)) {

    if (
      isInstructor(user)
    ) {
      return (
        <Navigate
          to="/instructor/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// LOGOUT
// ============================================================

function Logout() {

  useEffect(() => {
    clearAuth();
  }, []);

  return (
    <Navigate
      to="/login"
      replace
    />
  );
}

// ============================================================
// TOP HEADER
// ============================================================

function TopHeader({
  user,
}) {
  const navigate =
    useNavigate();

  const initials =
    user?.full_name
      ?.split(" ")
      .map(
        (word) => word[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "DA";

  return (
    <header className="app-header">

      <div>

        <div className="header-eyebrow">
          LEARNING MANAGEMENT SYSTEM
        </div>

        <div className="header-title">
          Learn smarter with AI
        </div>

      </div>

      <button
        className="profile-avatar"
        onClick={() =>
          navigate("/profile")
        }
        title="Profile"
      >
        {initials}
      </button>

    </header>
  );
}

// ============================================================
// STUDENT SIDEBAR
// ============================================================

function StudentSidebar() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const user =
    getStoredUser();

  const links = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "▦",
    },
    {
      path: "/courses",
      label: "Courses",
      icon: "▱",
    },
    {
      path: "/my-learning",
      label: "My Learning",
      icon: "♧",
    },
    {
      path: "/ai-tutor",
      label: "AI Tutor",
      icon: "♙",
    },
    {
      path: "/profile",
      label: "Profile",
      icon: "♙",
    },
  ];

  function active(path) {
    if (
      path === "/dashboard"
    ) {
      return (
        location.pathname ===
        "/dashboard"
      );
    }

    return location.pathname.startsWith(
      path
    );
  }

  function logout() {
    clearAuth();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  return (
    <aside className="app-sidebar">

      <div className="sidebar-brand">

        <div className="brand-icon">
          🤖
        </div>

        <span>
          learnly
        </span>

      </div>

      <div className="sidebar-section-title">
        MAIN MENU
      </div>

      <nav className="sidebar-nav">

        {links.map(
          (item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                active(item.path)
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >

              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </Link>
          )
        )}

      </nav>

      <div className="sidebar-bottom">

        <div className="user-mini">

          <div className="user-avatar">
            {user?.full_name
              ?.charAt(0)
              ?.toUpperCase() ||
              "D"}
          </div>

          <div>

            <strong>
              {user?.full_name ||
                "Demo Student"}
            </strong>

            <span>
              {user?.email ||
                "student@lmsai.com"}
            </span>

          </div>

        </div>

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          → Sign out
        </button>

      </div>

    </aside>
  );
}

// ============================================================
// STUDENT LAYOUT
// ============================================================

function StudentLayout({
  children,
}) {
  const user =
    getStoredUser();

  return (
    <div className="app-shell">

      <StudentSidebar />

      <div className="app-main">

        <TopHeader
          user={user}
        />

        <main className="page-content">
          {children}
        </main>

      </div>

    </div>
  );
}

// ============================================================
// INSTRUCTOR SIDEBAR
// ============================================================

function InstructorSidebar() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const user =
    getStoredUser();

  const links = [
    {
      path: "/instructor/dashboard",
      label: "Dashboard",
      icon: "▦",
    },
    {
      path: "/instructor/courses",
      label: "Courses",
      icon: "▱",
    },
    {
      path: "/instructor/create-course",
      label: "Create Course",
      icon: "+",
    },
    {
      path: "/dashboard",
      label: "Student View",
      icon: "♙",
    },
  ];

  function active(path) {
    if (
      path === "/dashboard"
    ) {
      return (
        location.pathname ===
        "/dashboard"
      );
    }

    return (
      location.pathname ===
      path
    );
  }

  function logout() {
    clearAuth();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  return (
    <aside className="app-sidebar instructor-sidebar">

      <div className="sidebar-brand">

        <div className="brand-icon">
          🤖
        </div>

        <span>
          learnly
        </span>

      </div>

      <div className="sidebar-section-title">
        INSTRUCTOR WORKSPACE
      </div>

      <nav className="sidebar-nav">

        {links.map(
          (item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                active(item.path)
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >

              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </Link>
          )
        )}

      </nav>

      <div className="sidebar-bottom">

        <div className="user-mini">

          <div className="user-avatar">

            {user?.full_name
              ?.charAt(0)
              ?.toUpperCase() ||
              "I"}

          </div>

          <div>

            <strong>
              {user?.full_name ||
                "Instructor"}
            </strong>

            <span>
              {user?.email ||
                "instructor"}
            </span>

          </div>

        </div>

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          → Sign out
        </button>

      </div>

    </aside>
  );
}

// ============================================================
// INSTRUCTOR LAYOUT
// ============================================================

function InstructorLayout({
  children,
}) {
  const user =
    getStoredUser();

  return (
    <div className="app-shell">

      <InstructorSidebar />

      <div className="app-main">

        <TopHeader
          user={user}
        />

        <main className="page-content">
          {children}
        </main>

      </div>

    </div>
  );
}

// ============================================================
// ADMIN SIDEBAR
// ============================================================

function AdminSidebar() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const user =
    getStoredUser();

  function active(path) {
    if (
      path === "/admin"
    ) {
      return (
        location.pathname ===
          "/admin" ||
        location.pathname ===
          "/admin/dashboard"
      );
    }

    return location.pathname.startsWith(
      path
    );
  }

  function logout() {
    clearAuth();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  return (
    <aside className="app-sidebar admin-sidebar">

      <div className="sidebar-brand">

        <div className="brand-icon">
          🤖
        </div>

        <span>
          learnly
        </span>

      </div>

      <div className="sidebar-section-title">
        ADMIN WORKSPACE
      </div>

      <nav className="sidebar-nav">

        <Link
          to="/admin"
          className={
            active("/admin")
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >

          <span className="sidebar-icon">
            🛡️
          </span>

          <span>
            Admin Panel
          </span>

        </Link>

        <Link
          to="/dashboard"
          className="sidebar-link"
        >

          <span className="sidebar-icon">
            🎓
          </span>

          <span>
            Student View
          </span>

        </Link>

        <Link
          to="/instructor/dashboard"
          className="sidebar-link"
        >

          <span className="sidebar-icon">
            👨‍🏫
          </span>

          <span>
            Instructor View
          </span>

        </Link>

      </nav>

      <div className="sidebar-bottom">

        <div className="user-mini">

          <div className="user-avatar">
            🛡️
          </div>

          <div>

            <strong>
              {user?.full_name ||
                "Administrator"}
            </strong>

            <span>
              {user?.email ||
                "admin@lmsai.com"}
            </span>

          </div>

        </div>

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          → Sign out
        </button>

      </div>

    </aside>
  );
}

// ============================================================
// ADMIN LAYOUT
// ============================================================

function AdminLayout({
  children,
}) {
  const user =
    getStoredUser();

  return (
    <div className="app-shell">

      <AdminSidebar />

      <div className="app-main">

        <TopHeader
          user={user}
        />

        <main className="page-content">
          {children}
        </main>

      </div>

    </div>
  );
}

// ============================================================
// COURSES PAGE
// ============================================================

function Courses() {
  const navigate =
    useNavigate();

  const [courses, setCourses] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [level, setLevel] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const data =
        await apiFetch(
          "/courses"
        );

      const list =
        Array.isArray(data)
          ? data
          : data?.courses ||
            data?.items ||
            data?.results ||
            [];

      setCourses(list);
    } catch (err) {
      console.error(
        "Courses error:",
        err
      );

      if (
        err.status === 401
      ) {
        clearAuth();

        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }

      setError(
        err.message ||
          "Unable to load courses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses =
    courses.filter(
      (course) => {

        const title =
          String(
            course.title ||
              course.name ||
              ""
          ).toLowerCase();

        const description =
          String(
            course.description ||
              ""
          ).toLowerCase();

        const category =
          String(
            course.category ||
              course.topic ||
              ""
          ).toLowerCase();

        const searchText =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          !searchText ||
          title.includes(
            searchText
          ) ||
          description.includes(
            searchText
          ) ||
          category.includes(
            searchText
          );

        const courseLevel =
          String(
            course.level ||
              course.difficulty ||
              ""
          ).toLowerCase();

        const matchesLevel =
          !level ||
          courseLevel ===
            level.toLowerCase();

        return (
          matchesSearch &&
          matchesLevel
        );
      }
    );

  function openCourse(course) {
    const id =
      course.id ||
      course.course_id ||
      course.uuid;

    if (!id) {
      return;
    }

    navigate(
      `/courses/${id}`
    );
  }

  return (
    <div className="courses-page">

      <div className="page-heading">

        <div>

          <div className="eyebrow">
            LEARN
          </div>

          <h1>
            Courses
          </h1>

          <p>
            Explore courses and build
            your skills.
          </p>

        </div>

      </div>

      <div className="search-row">

        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />

        <select
          value={level}
          onChange={(event) =>
            setLevel(
              event.target.value
            )
          }
        >

          <option value="">
            All levels
          </option>

          <option value="beginner">
            Beginner
          </option>

          <option value="intermediate">
            Intermediate
          </option>

          <option value="advanced">
            Advanced
          </option>

        </select>

        <button
          className="primary-button"
          type="button"
          onClick={() => {}}
        >
          Search
        </button>

      </div>

      {loading && (
        <div className="empty-state">
          <h3>
            Loading courses...
          </h3>
        </div>
      )}

      {error && (
        <div className="error-box">
          <strong>
            Unable to load courses
          </strong>

          <p>
            {error}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        filteredCourses.length ===
          0 && (
          <div className="empty-state">

            <div className="empty-icon">
              📚
            </div>

            <h3>
              No courses found
            </h3>

            <p>
              Try another search or
              check back later.
            </p>

          </div>
        )}

      <div className="course-grid">

        {!loading &&
          filteredCourses.map(
            (course) => (

              <div
                className="course-card"
                key={
                  course.id ||
                  course.course_id ||
                  course.uuid
                }
              >

                <div className="course-card-image">

                  <span className="course-category">
                    {course.category ||
                      course.topic ||
                      "Programming"}
                  </span>

                  <div className="course-robot">
                    🤖
                  </div>

                </div>

                <div className="course-card-body">

                  <div className="course-meta">
                    {course.level ||
                      course.difficulty ||
                      "Beginner"}
                    {" · "}
                    {course.price
                      ? `₹${course.price}`
                      : "Free"}
                  </div>

                  <h3>
                    {course.title ||
                      course.name ||
                      "Untitled Course"}
                  </h3>

                  <p>
                    {course.description ||
                      "Start learning this course with Learnly."}
                  </p>

                  <button
                    className="primary-button full-width"
                    onClick={() =>
                      openCourse(
                        course
                      )
                    }
                  >
                    View course
                  </button>

                </div>

              </div>
            )
          )}

      </div>

    </div>
  );
}

// ============================================================
// COURSE ROUTER
// ============================================================

function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [courseContent, setCourseContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCoursePage() {
      if (!courseId) {
        if (mounted) {
          setError("Course ID is missing from the URL.");
          setLoading(false);
          setContentLoading(false);
        }
        return;
      }

      setLoading(true);
      setContentLoading(true);
      setError("");

      try {
        const courseData = await apiFetch(
          `/courses/${courseId}`
        );

        if (!mounted) {
          return;
        }

        setCourse(courseData);

        try {
          const contentData = await apiFetch(
            `/courses/${courseId}/content`
          );

          if (!mounted) {
            return;
          }

          const modules = Array.isArray(contentData)
            ? contentData
            : Array.isArray(contentData?.modules)
              ? contentData.modules
              : [];

          setCourseContent(modules);
        } catch (contentError) {
          console.error(
            "Course content loading error:",
            contentError
          );

          if (mounted) {
            setCourseContent([]);
          }
        } finally {
          if (mounted) {
            setContentLoading(false);
          }
        }

        try {
          const enrollmentData = await apiFetch(
            "/enrollments/me"
          );

          if (!mounted) {
            return;
          }

          const enrollments = Array.isArray(enrollmentData)
            ? enrollmentData
            : Array.isArray(enrollmentData?.items)
              ? enrollmentData.items
              : [];

          const alreadyEnrolled = enrollments.some(
            (enrollment) =>
              String(enrollment?.course_id) === String(courseId)
          );

          setEnrolled(alreadyEnrolled);
        } catch (enrollmentError) {
          console.error(
            "Enrollment check error:",
            enrollmentError
          );

          if (mounted) {
            setEnrolled(false);
          }
        }
      } catch (err) {
        console.error(
          "Course loading error:",
          err
        );

        if (mounted) {
          setError(
            err.message ||
              "Unable to load this course."
          );
          setCourse(null);
          setCourseContent([]);
          setContentLoading(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCoursePage();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  async function handleEnroll() {
    if (!courseId) {
      setError("Course ID is missing from the URL.");
      return;
    }

    try {
      setEnrolling(true);
      setError("");

      await apiFetch(
        `/courses/${courseId}/enroll`,
        {
          method: "POST",
        }
      );

      setEnrolled(true);
    } catch (err) {
      console.error(
        "Enrollment error:",
        err
      );

      const message =
        err.message ||
        "Unable to enroll in this course.";

      if (
        message.toLowerCase().includes("already")
      ) {
        setEnrolled(true);
      } else {
        setError(message);
      }
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="course-detail-page">
        <button
          type="button"
          className="course-back-button"
          onClick={() => navigate("/courses")}
        >
          ← Back to Courses
        </button>

        <div className="loading-card">
          Loading course...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <button
          type="button"
          className="course-back-button"
          onClick={() => navigate("/courses")}
        >
          ← Back to Courses
        </button>

        <div className="error-box">
          <strong>Unable to load course</strong>
          <p>
            {error || "Course not found."}
          </p>
        </div>
      </div>
    );
  }

  const price = Number(course.price || 0);
  const difficulty =
    course.difficulty ||
    course.level ||
    "Beginner";

  return (
    <div className="course-detail-page">

      <button
        type="button"
        className="course-back-button"
        onClick={() => navigate("/courses")}
      >
        ← Back to Courses
      </button>

      {error && (
        <div className="error-box">
          <strong>Something went wrong</strong>
          <p>{error}</p>
        </div>
      )}

      <section className="course-detail-hero">

        <div className="course-detail-image">

          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title || "Course"}
            />
          ) : (
            <div className="course-detail-placeholder">
              🤖
            </div>
          )}

        </div>

        <div className="course-detail-info">

          <span className="course-detail-badge">
            {course.category || "Programming"}
          </span>

          <h1>
            {course.title || "Untitled Course"}
          </h1>

          <p className="course-detail-description">
            {course.description ||
              "Start learning this course with Learnly."}
          </p>

          <div className="course-detail-meta">

            <span>
              📚 {difficulty}
            </span>

            <span>
              💰{" "}
              {price === 0
                ? "Free"
                : `₹${price}`}
            </span>

            <span>
              📖{" "}
              {courseContent.length}{" "}
              {courseContent.length === 1
                ? "Module"
                : "Modules"}
            </span>

          </div>

          {enrolled ? (
            <button
              type="button"
              className="primary-button course-enroll-button"
              onClick={() =>
                navigate(
                  `/courses/${courseId}/learn`
                )
              }
            >
              ✓ Enrolled — Continue Learning →
            </button>
          ) : (
            <button
              type="button"
              className="primary-button course-enroll-button"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling
                ? "Enrolling..."
                : "Enroll in Course"}
            </button>
          )}

        </div>

      </section>

      <section className="course-detail-section">

        <div className="course-section-label">
          COURSE INFORMATION
        </div>

        <h2>
          About this course
        </h2>

        <div className="course-information-card">
          <p>
            {course.description ||
              "This course is designed to help you learn step by step with Learnly."}
          </p>
        </div>

      </section>

      <section className="course-detail-section">

        <div className="course-section-label">
          COURSE CONTENT
        </div>

        <div className="course-content-heading">

          <div>
            <h2>
              Modules & Lectures
            </h2>

            <p>
              {courseContent.length > 0
                ? `${courseContent.length} ${
                    courseContent.length === 1
                      ? "module"
                      : "modules"
                  } available`
                : "No modules have been added yet."}
            </p>
          </div>

        </div>

        {contentLoading ? (
          <div className="loading-card">
            Loading modules and lectures...
          </div>
        ) : courseContent.length === 0 ? (
          <div className="empty-course-card">

            <div className="empty-icon">
              📖
            </div>

            <h3>
              Course content coming soon
            </h3>

            <p>
              Modules and lectures will appear here
              when they are added by the instructor.
            </p>

          </div>
        ) : (
          <div className="course-modules-list">

            {courseContent.map(
              (module, moduleIndex) => {

                const lectures = Array.isArray(
                  module?.lectures
                )
                  ? module.lectures
                  : [];

                return (
                  <article
                    className="course-module-card"
                    key={
                      module?.id ||
                      `module-${moduleIndex}`
                    }
                  >

                    <div className="course-module-header">

                      <div>
                        <span className="course-module-number">
                          MODULE {moduleIndex + 1}
                        </span>

                        <h3>
                          {module?.title ||
                            `Module ${moduleIndex + 1}`}
                        </h3>
                      </div>

                      <span className="course-module-count">
                        {lectures.length}{" "}
                        {lectures.length === 1
                          ? "Lecture"
                          : "Lectures"}
                      </span>

                    </div>

                    {lectures.length > 0 ? (
                      <div className="course-lectures-list">

                        {lectures.map(
                          (lecture, lectureIndex) => (
                            <div
                              className="course-lecture-item"
                              key={
                                lecture?.id ||
                                `lecture-${moduleIndex}-${lectureIndex}`
                              }
                            >

                              <div className="course-lecture-index">
                                {lectureIndex + 1}
                              </div>

                              <div className="course-lecture-content">

                                <h4>
                                  {lecture?.title ||
                                    `Lecture ${lectureIndex + 1}`}
                                </h4>

                                {lecture?.description && (
                                  <p>
                                    {lecture.description}
                                  </p>
                                )}

                                <div className="course-lecture-meta">

                                  {lecture?.duration_seconds ? (
                                    <span>
                                      ⏱{" "}
                                      {Math.max(
                                        1,
                                        Math.round(
                                          Number(
                                            lecture.duration_seconds
                                          ) / 60
                                        )
                                      )}{" "}
                                      min
                                    </span>
                                  ) : null}

                                  <span>
                                    {lecture?.video_url
                                      ? "▶ Video"
                                      : "📄 Lecture"}
                                  </span>

                                </div>

                              </div>

                            </div>
                          )
                        )}

                      </div>
                    ) : (
                      <p className="course-module-empty">
                        No lectures in this module yet.
                      </p>
                    )}

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

    </div>
  );
}

// ============================================================
// NOT FOUND
// ============================================================

function NotFound() {
  const navigate =
    useNavigate();

  return (
    <div className="empty-state not-found">

      <div className="empty-icon">
        🔎
      </div>

      <h1>
        Page not found
      </h1>

      <p>
        The page you are looking for
        does not exist.
      </p>

      <button
        className="primary-button"
        onClick={() =>
          navigate("/dashboard")
        }
      >
        Go to Dashboard
      </button>

    </div>
  );
}

// ============================================================
// APP ROUTES
// ============================================================

function App() {
  return (
    <Routes>

      {/* ======================================================
          PUBLIC
      ====================================================== */}

      <Route
        path="/login"
        element={
          <LoginFallback />
        }
      />

      <Route
        path="/logout"
        element={
          <Logout />
        }
      />

      <Route
        path="/register"
        element={
          <Register />
        }
      />

      {/* ======================================================
          STUDENT
      ====================================================== */}

      <Route
        path="/dashboard"
        element={
          <StudentRoute>

            <StudentLayout>

              <Dashboard />

            </StudentLayout>

          </StudentRoute>
        }
      />

      <Route
        path="/courses"
        element={
          <StudentRoute>

            <StudentLayout>

              <Courses />

            </StudentLayout>

          </StudentRoute>
        }
      />

      <Route
        path="/courses/:courseId"
        element={
          <StudentRoute>

            <StudentLayout>

              <CoursePage />

            </StudentLayout>

          </StudentRoute>
        }
      />

      <Route
        path="/courses/:courseId/learn"
        element={
          <StudentRoute>

            <StudentLayout>

              <CourseLearning />

            </StudentLayout>

          </StudentRoute>
        }
      />

      <Route
        path="/courses/:courseId/modules"
        element={
          <StudentRoute>

            <StudentLayout>

              <CourseModuleSelector />

            </StudentLayout>

          </StudentRoute>
        }
      />

      <Route
        path="/lecture/:lectureId"
        element={
          <StudentRoute>

            <StudentLayout>

              <LecturePlayer />

            </StudentLayout>

          </StudentRoute>
        }
      />

      <Route
        path="/my-learning"
        element={
          <StudentRoute>

            <StudentLayout>

              <MyLearning />

            </StudentLayout>

          </StudentRoute>
        }
      />

      <Route
        path="/ai-tutor"
        element={
          <StudentRoute>

            <StudentLayout>

              <AITutor />

            </StudentLayout>

          </StudentRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <StudentRoute>

            <StudentLayout>

              <Profile />

            </StudentLayout>

          </StudentRoute>
        }
      />

      {/* ======================================================
          INSTRUCTOR
      ====================================================== */}

      <Route
        path="/instructor"
        element={
          <InstructorRoute>

            <Navigate
              to="/instructor/dashboard"
              replace
            />

          </InstructorRoute>
        }
      />

      <Route
        path="/instructor/dashboard"
        element={
          <InstructorRoute>

            <InstructorLayout>

              <InstructorDashboard />

            </InstructorLayout>

          </InstructorRoute>
        }
      />

      <Route
        path="/instructor/courses"
        element={
          <InstructorRoute>

            <InstructorLayout>

              <InstructorCourses />

            </InstructorLayout>

          </InstructorRoute>
        }
      />

      <Route
        path="/instructor/create-course"
        element={
          <InstructorRoute>

            <InstructorLayout>

              <InstructorCourseCreate />

            </InstructorLayout>

          </InstructorRoute>
        }
      />

      <Route
        path="/instructor/courses/create"
        element={
          <InstructorRoute>

            <InstructorLayout>

              <InstructorCourseCreate />

            </InstructorLayout>

          </InstructorRoute>
        }
      />

      <Route
        path="/instructor/course-builder"
        element={
          <InstructorRoute>

            <InstructorLayout>

              <InstructorCourseBuilder />

            </InstructorLayout>

          </InstructorRoute>
        }
      />

      <Route
        path="/instructor/courses/:courseId"
        element={
          <InstructorRoute>

            <InstructorLayout>

              <InstructorCourseBuilder />

            </InstructorLayout>

          </InstructorRoute>
        }
      />

      <Route
        path="/instructor/courses/:courseId/builder"
        element={
          <InstructorRoute>

            <InstructorLayout>

              <InstructorCourseBuilder />

            </InstructorLayout>

          </InstructorRoute>
        }
      />

      <Route
        path="/instructor/courses/:courseId/edit"
        element={
          <InstructorRoute>

            <InstructorLayout>

              <InstructorCourseEdit />

            </InstructorLayout>

          </InstructorRoute>
        }
      />

      {/* ======================================================
          ADMIN
      ====================================================== */}

      <Route
        path="/admin"
        element={
          <AdminRoute>

            <AdminLayout>

              <AdminDashboard />

            </AdminLayout>

          </AdminRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>

            <AdminLayout>

              <AdminDashboard />

            </AdminLayout>

          </AdminRoute>
        }
      />

      {/* ======================================================
          ROOT
      ====================================================== */}

      <Route
        path="/"
        element={
          getToken() ? (
            <Navigate
              to={getDefaultRoute(
                getStoredUser()
              )}
              replace
            />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      {/* ======================================================
          404
      ====================================================== */}

      <Route
        path="*"
        element={
          <NotFound />
        }
      />

    </Routes>
  );
}

// ============================================================
// GLOBAL INLINE STYLES
// ============================================================

const injectedStyles = `

.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  background: #070910;
  color: #f7f7fb;
}

.login-brand-panel {
  min-height: 100vh;
  padding: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(
      circle at 50% 45%,
      rgba(100, 65, 255, 0.22),
      transparent 45%
    ),
    #070910;
}

.login-brand,
.login-card-brand,
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 25px;
  font-weight: 800;
}

.brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(
    135deg,
    #6848ff,
    #32a9ff
  );
  font-size: 25px;
}

.login-brand-content {
  margin-top: 100px;
}

.eyebrow,
.header-eyebrow,
.sidebar-section-title {
  color: #8ea7e6;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

.login-brand-content h1 {
  margin: 18px 0;
  font-size: clamp(48px, 5vw, 72px);
  line-height: 0.98;
}

.login-brand-content h1 span {
  color: #9274ff;
}

.login-brand-content p {
  color: #9eabd0;
  font-size: 20px;
  max-width: 620px;
}

.login-form-panel {
  display: grid;
  place-items: center;
  padding: 40px;
  border-left: 1px solid #202638;
}

.login-card {
  width: min(100%, 560px);
  padding: 48px;
  border-radius: 26px;
  background: #111522;
  border: 1px solid #293148;
  box-shadow: 0 30px 90px rgba(0,0,0,.35);
}

.login-card h2 {
  margin: 40px 0 8px;
  font-size: 38px;
}

.login-subtitle {
  color: #92a0c5;
  margin-bottom: 32px;
}

.login-card label {
  display: block;
  margin: 18px 0 8px;
  color: #aebbe0;
}

.login-card input,
.search-row input,
.search-row select {
  width: 100%;
  box-sizing: border-box;
  padding: 17px 18px;
  border-radius: 12px;
  border: 1px solid #30384e;
  outline: none;
  background: #090d16;
  color: white;
  font-size: 16px;
}

.login-card input:focus,
.search-row input:focus,
.search-row select:focus {
  border-color: #7954ff;
  box-shadow: 0 0 0 3px rgba(121,84,255,.12);
}

.primary-button,
.secondary-button {
  border: 0;
  border-radius: 12px;
  padding: 15px 24px;
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.primary-button {
  background: linear-gradient(
    135deg,
    #714cff,
    #7c48ff
  );
}

.primary-button:hover {
  filter: brightness(1.08);
}

.secondary-button {
  background: #171d2d;
  border: 1px solid #30384e;
}

.login-button {
  width: 100%;
  margin-top: 25px;
}

.login-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.demo-box {
  margin-top: 24px;
  padding: 18px;
  border-radius: 12px;
  text-align: center;
  background: #171d2d;
  color: #8fa2ce;
}

.demo-box strong {
  display: block;
  margin-bottom: 5px;
  color: white;
}

.demo-link {
  border: 0;
  background: transparent;
  color: #9e85ff;
  cursor: pointer;
}

.login-card > .secondary-button {
  width: 100%;
  margin-top: 14px;
}

.login-error {
  margin: 15px 0;
  padding: 14px;
  border: 1px solid #7b3448;
  border-radius: 10px;
  background: #24121c;
  color: #ffb2c3;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  background: #070910;
  color: #f7f7fb;
}

.app-sidebar {
  width: 280px;
  min-height: 100vh;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  background: #0a0e17;
  border-right: 1px solid #202638;
}

.sidebar-brand {
  margin-bottom: 58px;
}

.sidebar-section-title {
  margin: 0 10px 20px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px 14px;
  border-radius: 13px;
  text-decoration: none;
  color: #8fa0c6;
  transition: .2s;
}

.sidebar-link:hover {
  background: #121827;
  color: white;
}

.sidebar-link.active {
  background: #191f33;
  color: white;
  box-shadow: inset 3px 0 0 #784cff;
}

.sidebar-icon {
  width: 22px;
  text-align: center;
  font-size: 18px;
}

.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid #242b3c;
  padding-top: 24px;
}

.user-mini {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: linear-gradient(
    135deg,
    #6948ff,
    #3aaaff
  );
  color: white;
  font-weight: 800;
}

.user-mini strong,
.user-mini span {
  display: block;
}

.user-mini strong {
  color: white;
  margin-bottom: 4px;
}

.user-mini span {
  color: #7181a7;
  font-size: 13px;
  word-break: break-word;
}

.sidebar-logout {
  margin-top: 25px;
  padding: 10px 0;
  border: 0;
  background: transparent;
  color: #a8b4d4;
  cursor: pointer;
  font-size: 16px;
}

.sidebar-logout:hover {
  color: white;
}

.app-main {
  flex: 1;
  min-width: 0;
}

.app-header {
  min-height: 112px;
  padding: 0 34px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #202638;
}

.header-title {
  margin-top: 8px;
  font-weight: 800;
  font-size: 18px;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 15px;
  background: linear-gradient(
    135deg,
    #704bff,
    #45a9ff
  );
  color: white;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
}

.page-content {
  padding: 45px;
}

.admin-sidebar .sidebar-section-title {
  color: #a48fff;
}

.admin-sidebar .sidebar-link.active {
  background:
    linear-gradient(
      135deg,
      rgba(112, 76, 255, .20),
      rgba(69, 133, 255, .10)
    );
  box-shadow:
    inset 3px 0 0 #7954ff;
}

.page-heading {
  margin-bottom: 30px;
}

.page-heading h1 {
  margin: 12px 0 5px;
  font-size: 42px;
}

.page-heading p {
  color: #8d9dc2;
  font-size: 17px;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr 220px 120px;
  gap: 12px;
  margin-bottom: 32px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(320px, 1fr)
  );
  gap: 22px;
}

.course-card {
  overflow: hidden;
  border: 1px solid #252d40;
  border-radius: 18px;
  background: #111622;
}

.course-card-image {
  height: 210px;
  position: relative;
  display: grid;
  place-items: center;
  background:
    radial-gradient(
      circle,
      rgba(110,76,255,.65),
      transparent 65%
    ),
    #1b1d46;
}

.course-category {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(113,76,255,.25);
  color: #b59cff;
  font-size: 12px;
  font-weight: 800;
}

.course-robot {
  font-size: 58px;
}

.course-card-body {
  padding: 24px;
}

.course-meta {
  color: #79a0dd;
  font-size: 13px;
  margin-bottom: 12px;
}

.course-card-body h3 {
  font-size: 22px;
  margin: 0 0 10px;
}

.course-card-body p {
  color: #8d9abb;
  min-height: 70px;
  line-height: 1.6;
}

.full-width {
  width: 100%;
}

.empty-state {
  padding: 70px 30px;
  text-align: center;
  border: 1px solid #252d40;
  border-radius: 18px;
  background: #101521;
}

.empty-state h3,
.empty-state h1 {
  margin-bottom: 10px;
}

.empty-state p {
  color: #8492b5;
}

.empty-icon {
  font-size: 50px;
  margin-bottom: 15px;
}

.error-box {
  margin-bottom: 25px;
  padding: 20px;
  border: 1px solid #733448;
  border-radius: 14px;
  background: #21121b;
  color: #ffb3c3;
}

.error-box p {
  margin-bottom: 0;
}

.not-found {
  min-height: 60vh;
}

.profile-page {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.profile-heading {
  margin-bottom: 30px;
}

.profile-overview-card,
.profile-details-card {
  width: 100%;
  background: #111622;
  border: 1px solid #252d40;
  border-radius: 20px;
  box-shadow: 0 20px 55px rgba(0, 0, 0, .18);
}

.profile-overview-card {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 30px;
  margin-bottom: 22px;
}

.profile-large-avatar {
  width: 104px;
  height: 104px;
  flex: 0 0 104px;
  border-radius: 26px;
  display: grid;
  place-items: center;
  background: linear-gradient(
    135deg,
    #704bff,
    #45a9ff
  );
  color: white;
  font-size: 34px;
  font-weight: 900;
}

.profile-overview-info {
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.profile-name-row h2 {
  margin: 0;
  font-size: 30px;
}

.profile-overview-info > p {
  margin: 8px 0 10px;
  color: #91a0c2;
  font-size: 16px;
}

.profile-status {
  color: #7ed9ad;
  font-size: 13px;
  font-weight: 700;
}

.profile-details-card {
  padding: 30px;
}

.profile-section-heading,
.profile-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 22px;
  border-bottom: 1px solid #252d40;
  margin-bottom: 22px;
}

.profile-section-heading h2,
.profile-section-header h2 {
  margin: 9px 0 0;
  font-size: 24px;
}

.profile-section-heading p,
.profile-section-header p {
  color: #8d9abb;
}

.profile-section-note,
.profile-account-label {
  color: #6f80a5;
  font-size: 13px;
}

.profile-details-grid,
.profile-info-grid {
  display: grid;
  grid-template-columns: repeat(
    2,
    minmax(0, 1fr)
  );
  gap: 14px;
}

.profile-detail-item,
.profile-info-item {
  min-width: 0;
  padding: 18px 20px;
  border: 1px solid #252d40;
  border-radius: 14px;
  background: #0c111c;
}

.profile-detail-label,
.profile-detail-value,
.profile-info-label {
  display: block;
}

.profile-detail-label,
.profile-info-label {
  margin-bottom: 8px;
  color: #7182a8;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.profile-detail-value,
.profile-info-item strong {
  color: #f5f7ff;
  font-size: 16px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.profile-actions {
  margin-top: 22px;
}

.profile-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.profile-edit-button {
  border: 1px solid #5d46d8;
  border-radius: 12px;
  padding: 13px 18px;
  background: #17152e;
  color: #b6a5ff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.profile-edit-button:hover {
  background: #211c42;
}

.profile-alert {
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.profile-alert-error {
  border: 1px solid #713449;
  background: #21131c;
  color: #ffb4c5;
}

.profile-alert-success {
  border: 1px solid #285e4c;
  background: #10251e;
  color: #8be0b9;
}

.profile-form-grid,
.profile-edit-grid {
  display: grid;
  grid-template-columns: repeat(
    2,
    minmax(0, 1fr)
  );
  gap: 18px;
}

.profile-field,
.profile-edit-field {
  min-width: 0;
}

.profile-field label,
.profile-edit-field label {
  display: block;
  margin-bottom: 8px;
  color: #7182a8;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.profile-field input,
.profile-field select,
.profile-edit-field input,
.profile-edit-field select {
  width: 100%;
  box-sizing: border-box;
  padding: 15px 16px;
  border: 1px solid #30384e;
  border-radius: 12px;
  outline: none;
  background: #090d16;
  color: white;
  font-size: 15px;
}

.profile-field input:focus,
.profile-field select:focus,
.profile-edit-field input:focus,
.profile-edit-field select:focus {
  border-color: #7954ff;
  box-shadow: 0 0 0 3px rgba(121, 84, 255, .12);
}

.profile-field input:disabled,
.profile-edit-field input:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.profile-field small,
.profile-edit-field small {
  display: block;
  margin-top: 7px;
  color: #687797;
  font-size: 12px;
}

.profile-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid #252d40;
}

.profile-form-actions button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.profile-cancel-button {
  border: 1px solid #30384e;
  border-radius: 12px;
  padding: 15px 24px;
  background: #171d2d;
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.profile-save-button {
  border: 0;
  border-radius: 12px;
  padding: 15px 24px;
  background: linear-gradient(
    135deg,
    #714cff,
    #7c48ff
  );
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.profile-save-button:disabled,
.profile-cancel-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.profile-back-button {
  margin-top: 22px;
  border: 1px solid #30384e;
  border-radius: 12px;
  padding: 13px 20px;
  background: #171d2d;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.profile-summary-card {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 30px;
  margin-bottom: 22px;
  background: #111622;
  border: 1px solid #252d40;
  border-radius: 20px;
}

.profile-summary-info {
  min-width: 0;
}

.profile-role {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  background: #1d2340;
  color: #a98dff;
  font-size: 13px;
  font-weight: 800;
}

.profile-email {
  margin: 8px 0 10px;
  color: #91a0c2;
  font-size: 16px;
}

.profile-status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 7px;
  border-radius: 50%;
  background: #7ed9ad;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-loading {
  min-height: 300px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 15px;
  color: #8d9dc2;
}

.profile-spinner,
.button-spinner {
  border: 3px solid #30384e;
  border-top-color: #7954ff;
  border-radius: 50%;
  animation: profile-spin .8s linear infinite;
}

.profile-spinner {
  width: 36px;
  height: 36px;
}

.button-spinner {
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes profile-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1000px) {

  .login-page {
    grid-template-columns: 1fr;
  }

  .login-brand-panel {
    display: none;
  }

  .app-sidebar {
    width: 230px;
  }

  .page-content {
    padding: 30px;
  }
}

@media (max-width: 760px) {

  .app-sidebar {
    width: 76px;
    padding: 25px 12px;
  }

  .sidebar-brand span,
  .sidebar-section-title,
  .sidebar-link span:last-child,
  .user-mini div:last-child,
  .sidebar-logout {
    display: none;
  }

  .sidebar-brand {
    justify-content: center;
  }

  .sidebar-link {
    justify-content: center;
  }

  .sidebar-bottom {
    display: flex;
    justify-content: center;
  }

  .search-row {
    grid-template-columns: 1fr;
  }

  .page-content {
    padding: 22px;
  }

  .app-header {
    padding: 0 20px;
  }

  .login-card {
    padding: 30px;
  }

  .profile-details-grid,
  .profile-info-grid,
  .profile-form-grid,
  .profile-edit-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 500px) {

  .login-form-panel {
    padding: 15px;
  }

  .login-card {
    padding: 25px 20px;
  }

  .course-grid {
    grid-template-columns: 1fr;
  }

  .page-content {
    padding: 18px;
  }

  .page-heading h1 {
    font-size: 34px;
  }

  .app-header {
    min-height: 90px;
  }
}
`;

// ============================================================
// INJECT STYLES
// ============================================================

function InjectedStyles() {
  useEffect(() => {

    const oldStyle =
      document.querySelector(
        'style[data-learnly-main-styles="true"]'
      );

    if (oldStyle) {
      oldStyle.remove();
    }

    const style =
      document.createElement(
        "style"
      );

    style.setAttribute(
      "data-learnly-main-styles",
      "true"
    );

    style.textContent =
      injectedStyles;

    document.head.appendChild(
      style
    );

    return () => {
      style.remove();
    };

  }, []);

  return null;
}

// ============================================================
// ROOT
// ============================================================

function Root() {
  return (
    <>
      <InjectedStyles />

      <BrowserRouter>

        <App />

      </BrowserRouter>
    </>
  );
}

// ============================================================
// START APPLICATION
// ============================================================

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <Root />
);
