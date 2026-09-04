import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


// ============================================================
// API BASE URL
// ============================================================
//
// Supports BOTH:
//
// VITE_API_BASE_URL=http://127.0.0.1:8000
//
// and
//
// VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
//
// We normalize it so /api/v1 is NEVER duplicated.
// ============================================================

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const API_BASE_URL =
  RAW_API_BASE_URL
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "");

const API_URL =
  `${API_BASE_URL}/api/v1`;


// ============================================================
// EMPTY FORM
// ============================================================

const emptyForm = {
  full_name: "",
  email: "",
  username: "",
  student_id: "",
  phone: "",
  department: "",
  year: "",
  college: "",
  avatar_url: "",
};


// ============================================================
// GET TOKEN
// ============================================================

function getToken() {

  return (
    localStorage.getItem(
      "access_token"
    ) ||

    localStorage.getItem(
      "token"
    ) ||

    sessionStorage.getItem(
      "access_token"
    ) ||

    sessionStorage.getItem(
      "token"
    )
  );
}


// ============================================================
// CLEAR SESSION
// ============================================================

function clearSession() {

  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "user"
  );

  sessionStorage.removeItem(
    "access_token"
  );

  sessionStorage.removeItem(
    "token"
  );
}


// ============================================================
// INITIALS
// ============================================================

function getInitials(name = "") {

  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (words.length === 0) {
    return "U";
  }


  if (words.length === 1) {

    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }


  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase();
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateValue) {

  if (!dateValue) {
    return "Not provided";
  }


  const date =
    new Date(dateValue);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "Not provided";
  }


  return date.toLocaleDateString(
    "en-US",
    {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }
  );
}


// ============================================================
// DISPLAY VALUE
// ============================================================

function displayValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "Not provided";
  }


  return value;
}


// ============================================================
// USER -> FORM
// ============================================================

function userToForm(data) {

  return {

    full_name:
      data?.full_name || "",

    email:
      data?.email || "",

    username:
      data?.username || "",

    student_id:
      data?.student_id || "",

    phone:
      data?.phone || "",

    department:
      data?.department || "",

    year:
      data?.year || "",

    college:
      data?.college || "",

    avatar_url:
      data?.avatar_url || "",
  };
}


// ============================================================
// PROFILE
// ============================================================

export default function Profile() {

  const navigate =
    useNavigate();


  const [user, setUser] =
    useState(null);


  const [form, setForm] =
    useState(emptyForm);


  const [loading, setLoading] =
    useState(true);


  const [saving, setSaving] =
    useState(false);


  const [editing, setEditing] =
    useState(false);


  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {

    loadProfile();

  }, []);


  async function loadProfile() {

    setLoading(true);

    setError("");


    const token =
      getToken();


    if (!token) {

      setError(
        "Your session has expired. Please login again."
      );

      setLoading(false);

      return;
    }


    try {

      // ======================================================
      // IMPORTANT
      // ======================================================
      //
      // API_URL =
      // http://127.0.0.1:8000/api/v1
      //
      // Final endpoint:
      // http://127.0.0.1:8000/api/v1/auth/me
      // ======================================================

      const response =
        await fetch(
          `${API_URL}/auth/me`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/json",
            },
          }
        );


      // ------------------------------------------------------
      // UNAUTHORIZED
      // ------------------------------------------------------

      if (
        response.status === 401
      ) {

        clearSession();

        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }


      const data =
        await response
          .json()
          .catch(
            () => null
          );


      if (!response.ok) {

        throw new Error(
          typeof data?.detail ===
          "string"

            ? data.detail

            : "Could not load profile."
        );
      }


      // ------------------------------------------------------
      // SAVE USER
      // ------------------------------------------------------

      setUser(data);

      setForm(
        userToForm(data)
      );


      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

    } catch (err) {

      console.error(
        "Profile loading error:",
        err
      );


      setError(
        err.message ||
        "Could not refresh profile."
      );

    } finally {

      setLoading(false);
    }
  }


  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

  function handleChange(event) {

    const {
      name,
      value,
    } = event.target;


    setForm(
      previous => ({
        ...previous,
        [name]: value,
      })
    );


    setError("");

    setSuccess("");
  }


  // ==========================================================
  // EDIT
  // ==========================================================

  function handleEdit() {

    if (!user) {
      return;
    }


    setForm(
      userToForm(user)
    );


    setError("");

    setSuccess("");

    setEditing(true);
  }


  // ==========================================================
  // CANCEL
  // ==========================================================

  function handleCancel() {

    if (user) {

      setForm(
        userToForm(user)
      );
    }


    setEditing(false);

    setError("");

    setSuccess("");
  }


  // ==========================================================
  // SAVE
  // ==========================================================

  async function handleSave(event) {

    event.preventDefault();


    setSaving(true);

    setError("");

    setSuccess("");


    const token =
      getToken();


    if (!token) {

      setError(
        "Your session has expired. Please login again."
      );

      setSaving(false);

      return;
    }


    // ========================================================
    // CLEAN VALUES
    // ========================================================

    const fullName =
      form.full_name.trim();


    const email =
      form.email
        .trim()
        .toLowerCase();


    const username =
      form.username.trim();


    const studentId =
      form.student_id.trim();


    const phone =
      form.phone.trim();


    const department =
      form.department.trim();


    const year =
      form.year.trim();


    const college =
      form.college.trim();


    const avatarUrl =
      form.avatar_url.trim();


    // ========================================================
    // VALIDATE NAME
    // ========================================================

    if (
      fullName.length < 2
    ) {

      setError(
        "Full name must contain at least 2 characters."
      );

      setSaving(false);

      return;
    }


    // ========================================================
    // VALIDATE EMAIL
    // ========================================================

    if (!email) {

      setError(
        "Email is required."
      );

      setSaving(false);

      return;
    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailPattern.test(email)
    ) {

      setError(
        "Please enter a valid email address."
      );

      setSaving(false);

      return;
    }


    // ========================================================
    // PAYLOAD
    // ========================================================

    const payload = {

      full_name:
        fullName,

      email:
        email,

      username:
        username || null,

      student_id:
        studentId || null,

      phone:
        phone || null,

      department:
        department || null,

      year:
        year || null,

      college:
        college || null,

      avatar_url:
        avatarUrl || null,
    };


    console.log(
      "PROFILE UPDATE PAYLOAD:",
      payload
    );


    try {

      // ======================================================
      // PATCH
      // ======================================================

      const response =
        await fetch(
          `${API_URL}/auth/me`,
          {
            method: "PATCH",

            headers: {

              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );


      const data =
        await response
          .json()
          .catch(
            () => null
          );


      // ======================================================
      // 401
      // ======================================================

      if (
        response.status === 401
      ) {

        clearSession();

        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }


      // ======================================================
      // 409
      // ======================================================

      if (
        response.status === 409
      ) {

        throw new Error(
          data?.detail ||
          "Email, Username, or Student ID already exists."
        );
      }


      // ======================================================
      // 422
      // ======================================================

      if (
        response.status === 422
      ) {

        let message =
          "Please check your profile information.";


        if (
          Array.isArray(
            data?.detail
          )
        ) {

          message =
            data.detail
              .map(
                item =>
                  item.msg ||
                  "Invalid value"
              )
              .join(", ");
        }


        throw new Error(
          message
        );
      }


      // ======================================================
      // OTHER ERROR
      // ======================================================

      if (!response.ok) {

        throw new Error(
          typeof data?.detail ===
          "string"

            ? data.detail

            : "Could not update your profile."
        );
      }


      // ======================================================
      // SUCCESS
      // ======================================================

      setUser(data);

      setForm(
        userToForm(data)
      );

      setEditing(false);


      setSuccess(
        "Profile updated successfully."
      );


      // ======================================================
      // UPDATE LOCAL STORAGE
      // ======================================================

      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );


      // ======================================================
      // NOTIFY APP
      // ======================================================

      window.dispatchEvent(
        new CustomEvent(
          "learnly:user-updated",
          {
            detail: data,
          }
        )
      );


      console.log(
        "PROFILE UPDATED:",
        data
      );


      // ======================================================
      // CLEAR SUCCESS
      // ======================================================

      setTimeout(
        () => {
          setSuccess("");
        },
        4000
      );

    } catch (err) {

      console.error(
        "Profile update error:",
        err
      );


      setError(
        err.message ||
        "Could not update your profile."
      );

    } finally {

      setSaving(false);
    }
  }


  // ==========================================================
  // BACK
  // ==========================================================

  function handleBack() {

    navigate(-1);
  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <main className="page-content profile-page">

        <div className="profile-loading">

          <div className="profile-spinner"></div>

          <p>
            Loading your profile...
          </p>

        </div>

      </main>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main className="page-content profile-page">


      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="profile-heading">

        <div>

          <div className="eyebrow">
            ACCOUNT
          </div>

          <h1>
            My Profile
          </h1>

          <p>
            View and manage your Learnly
            student details.
          </p>

        </div>


        {!editing && (

          <button
            type="button"
            className="profile-edit-button"
            onClick={handleEdit}
          >
            ✎ Edit Profile
          </button>

        )}

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <div
          className="
            profile-alert
            profile-alert-error
          "
        >

          <strong>
            Profile update failed
          </strong>

          <span>
            {error}
          </span>


          {error
            .toLowerCase()
            .includes("session") && (

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
            >
              Go to Login
            </button>

          )}

        </div>

      )}


      {/* ====================================================
          SUCCESS
      ==================================================== */}

      {success && (

        <div
          className="
            profile-alert
            profile-alert-success
          "
        >

          <strong>
            Success
          </strong>

          <span>
            {success}
          </span>

        </div>

      )}


      {user && (

        <>


          {/* ==================================================
              PROFILE SUMMARY
          ================================================== */}

          <section
            className="profile-summary-card"
          >

            <div className="profile-avatar">

              {user.avatar_url && (

                <img
                  src={user.avatar_url}
                  alt={
                    user.full_name ||
                    "Profile"
                  }
                  onError={
                    (event) => {
                      event.currentTarget.style.display =
                        "none";
                    }
                  }
                />

              )}


              {!user.avatar_url && (

                <span>
                  {getInitials(
                    user.full_name
                  )}
                </span>

              )}

            </div>


            <div
              className="
                profile-summary-info
              "
            >

              <div
                className="
                  profile-name-row
                "
              >

                <h2>
                  {displayValue(
                    user.full_name
                  )}
                </h2>


                {user.roles?.length > 0 && (

                  <span
                    className="
                      profile-role
                    "
                  >
                    {user.roles.join(
                      ", "
                    )}
                  </span>

                )}

              </div>


              <p
                className="
                  profile-email
                "
              >
                {displayValue(
                  user.email
                )}
              </p>


              <div
                className="
                  profile-status
                "
              >

                <span
                  className="
                    profile-status-dot
                  "
                ></span>

                {user.is_active
                  ? "Active account"
                  : "Inactive account"}

              </div>

            </div>

          </section>


          {/* ==================================================
              EDIT FORM
          ================================================== */}

          {editing ? (

            <form
              className="
                profile-details-card
                profile-edit-card
              "
              onSubmit={handleSave}
            >


              <div
                className="
                  profile-section-header
                "
              >

                <div>

                  <div className="eyebrow">
                    PERSONAL INFORMATION
                  </div>

                  <h2>
                    Edit Student Details
                  </h2>

                  <p>
                    Update your information
                    and save the changes.
                  </p>

                </div>

              </div>


              <div
                className="
                  profile-form-grid
                "
              >


                {/* ==========================================
                    FULL NAME
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="full_name">
                    FULL NAME
                  </label>

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    minLength={2}
                    maxLength={150}
                    required
                  />

                </div>


                {/* ==========================================
                    EMAIL
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="email">
                    EMAIL
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />

                  <small>
                    This will also become your new login email.
                  </small>

                </div>


                {/* ==========================================
                    USERNAME
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="username">
                    USERNAME
                  </label>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    maxLength={100}
                  />

                </div>


                {/* ==========================================
                    ROLE
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label>
                    ROLE
                  </label>

                  <input
                    type="text"
                    value={
                      user.roles?.join(", ") ||
                      "student"
                    }
                    disabled
                  />

                </div>


                {/* ==========================================
                    STUDENT ID
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="student_id">
                    STUDENT ID
                  </label>

                  <input
                    id="student_id"
                    name="student_id"
                    type="text"
                    value={form.student_id}
                    onChange={handleChange}
                    placeholder="Enter student ID"
                    maxLength={100}
                  />

                </div>


                {/* ==========================================
                    PHONE
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="phone">
                    PHONE
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    maxLength={30}
                  />

                </div>


                {/* ==========================================
                    DEPARTMENT
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="department">
                    DEPARTMENT
                  </label>

                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="Enter department"
                    maxLength={150}
                  />

                </div>


                {/* ==========================================
                    YEAR
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="year">
                    YEAR
                  </label>

                  <select
                    id="year"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select year
                    </option>

                    <option value="1st Year">
                      1st Year
                    </option>

                    <option value="2nd Year">
                      2nd Year
                    </option>

                    <option value="3rd Year">
                      3rd Year
                    </option>

                    <option value="4th Year">
                      4th Year
                    </option>

                    <option value="Graduate">
                      Graduate
                    </option>

                  </select>

                </div>


                {/* ==========================================
                    COLLEGE
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="college">
                    COLLEGE / INSTITUTION
                  </label>

                  <input
                    id="college"
                    name="college"
                    type="text"
                    value={form.college}
                    onChange={handleChange}
                    placeholder="Enter college / institution"
                    maxLength={200}
                  />

                </div>


                {/* ==========================================
                    PROFILE IMAGE
                ========================================== */}

                <div
                  className="
                    profile-field
                  "
                >

                  <label htmlFor="avatar_url">
                    PROFILE IMAGE URL
                  </label>

                  <input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    value={form.avatar_url}
                    onChange={handleChange}
                    placeholder="https://example.com/profile.jpg"
                    maxLength={1000}
                  />

                  <small>
                    Optional. Paste a public image URL.
                  </small>

                </div>

              </div>


              {/* ==================================================
                  ACTIONS
              ================================================== */}

              <div
                className="
                  profile-form-actions
                "
              >

                <button
                  type="button"
                  className="
                    profile-cancel-button
                  "
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="
                    profile-save-button
                  "
                  disabled={saving}
                >

                  {saving ? (

                    <>
                      <span
                        className="
                          button-spinner
                        "
                      ></span>

                      Saving...
                    </>

                  ) : (

                    "✓ Save Changes"

                  )}

                </button>

              </div>

            </form>

          ) : (


            /* ==================================================
               NORMAL PROFILE VIEW
            ================================================== */

            <section
              className="
                profile-details-card
              "
            >

              <div
                className="
                  profile-section-header
                "
              >

                <div>

                  <div className="eyebrow">
                    PERSONAL INFORMATION
                  </div>

                  <h2>
                    Student Details
                  </h2>

                </div>


                <span
                  className="
                    profile-account-label
                  "
                >
                  Account information
                </span>

              </div>


              <div
                className="
                  profile-info-grid
                "
              >

                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    FULL NAME
                  </span>

                  <strong>
                    {displayValue(
                      user.full_name
                    )}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    EMAIL
                  </span>

                  <strong>
                    {displayValue(
                      user.email
                    )}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    USERNAME
                  </span>

                  <strong>
                    {displayValue(
                      user.username
                    )}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    ROLE
                  </span>

                  <strong>
                    {user.roles?.length
                      ? user.roles.join(", ")
                      : "student"}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    STUDENT ID
                  </span>

                  <strong>
                    {displayValue(
                      user.student_id
                    )}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    PHONE
                  </span>

                  <strong>
                    {displayValue(
                      user.phone
                    )}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    DEPARTMENT
                  </span>

                  <strong>
                    {displayValue(
                      user.department
                    )}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    YEAR
                  </span>

                  <strong>
                    {displayValue(
                      user.year
                    )}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    COLLEGE / INSTITUTION
                  </span>

                  <strong>
                    {displayValue(
                      user.college
                    )}
                  </strong>

                </div>


                <div className="profile-info-item">

                  <span
                    className="
                      profile-info-label
                    "
                  >
                    JOINED
                  </span>

                  <strong>
                    {formatDate(
                      user.created_at
                    )}
                  </strong>

                </div>

              </div>

            </section>

          )}


          {/* ==================================================
              BACK
          ================================================== */}

          {!editing && (

            <button
              type="button"
              className="
                profile-back-button
              "
              onClick={handleBack}
            >
              ← Go back
            </button>

          )}

        </>

      )}

    </main>
  );
}
