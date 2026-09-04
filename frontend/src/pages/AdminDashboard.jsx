import React, {
  useEffect,
  useState,
} from "react";

import {
  getAdminOverview,
  getAdminUsers,
  getPendingAdminCourses,
  updateAdminUserRole,
  updateAdminUserStatus,
  deleteAdminUser,
  decideAdminCourse,
} from "../services/admin";

import "../styles/AdminDashboard.css";


export default function AdminDashboard() {

  const [
    overview,
    setOverview,
  ] = useState({});


  const [
    users,
    setUsers,
  ] = useState([]);


  const [
    pendingCourses,
    setPendingCourses,
  ] = useState([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    roleFilter,
    setRoleFilter,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    notice,
    setNotice,
  ] = useState("");


  // ==========================================================
  // LOAD
  // ==========================================================

  async function loadAdmin() {

    try {

      setLoading(true);
      setError("");


      const [
        overviewData,
        usersData,
        coursesData,
      ] = await Promise.all([

        getAdminOverview(),

        getAdminUsers({
          search,
          role: roleFilter,
          status: statusFilter,
        }),

        getPendingAdminCourses(),

      ]);


      setOverview(
        overviewData || {}
      );


      setUsers(
        Array.isArray(usersData)
          ? usersData
          : []
      );


      setPendingCourses(
        Array.isArray(
          coursesData
        )
          ? coursesData
          : []
      );


    } catch (err) {

      console.error(
        "Admin dashboard error:",
        err
      );


      setError(
        err?.message ||
        "Unable to load admin panel."
      );


    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    loadAdmin();

  }, [
    roleFilter,
    statusFilter,
  ]);


  // ==========================================================
  // SEARCH
  // ==========================================================

  function handleSearch(
    event
  ) {

    event.preventDefault();

    loadAdmin();

  }


  // ==========================================================
  // USER STATUS
  // ==========================================================

  async function toggleUser(
    user
  ) {

    try {

      setActionLoading(
        `user-${user.id}`
      );

      setError("");
      setNotice("");


      await updateAdminUserStatus(
        user.id,
        !user.is_active
      );


      setNotice(
        user.is_active
          ? "User suspended successfully."
          : "User activated successfully."
      );


      await loadAdmin();

    } catch (err) {

      setError(
        err?.message ||
        "Unable to update user."
      );

    } finally {

      setActionLoading("");

    }

  }


  // ==========================================================
  // ROLE
  // ==========================================================

  async function changeRole(
    user,
    role
  ) {

    if (
      user.roles?.includes(
        role
      )
    ) {
      return;
    }


    try {

      setActionLoading(
        `role-${user.id}`
      );

      setError("");
      setNotice("");


      const data =
        await updateAdminUserRole(
          user.id,
          role,
          "assign"
        );


      setNotice(
        `${user.full_name || user.email} is now ${role}.`
      );


      setUsers(
        previous =>
          previous.map(
            item =>
              item.id === user.id
                ? {
                    ...item,
                    roles:
                      data.roles ||
                      item.roles,
                  }
                : item
          )
      );


    } catch (err) {

      setError(
        err?.message ||
        "Unable to change role."
      );

    } finally {

      setActionLoading("");

    }

  }


  // ==========================================================
  // DELETE
  // ==========================================================

  async function removeUser(
    user
  ) {

    const confirmed =
      window.confirm(
        `Delete ${user.full_name || user.email}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setActionLoading(
        `delete-${user.id}`
      );

      setError("");
      setNotice("");


      await deleteAdminUser(
        user.id
      );


      setNotice(
        "User deleted successfully."
      );


      setUsers(
        previous =>
          previous.filter(
            item =>
              item.id !== user.id
          )
      );


    } catch (err) {

      setError(
        err?.message ||
        "Unable to delete user."
      );

    } finally {

      setActionLoading("");

    }

  }


  // ==========================================================
  // COURSE DECISION
  // ==========================================================

  async function decideCourse(
    course,
    decision
  ) {

    try {

      setActionLoading(
        `course-${course.id}`
      );

      setError("");
      setNotice("");


      await decideAdminCourse(
        course.id,
        decision
      );


      setPendingCourses(
        previous =>
          previous.filter(
            item =>
              item.id !== course.id
          )
      );


      setNotice(
        decision === "approved"
          ? `"${course.title}" approved successfully.`
          : `"${course.title}" rejected successfully.`
      );


      const updated =
        await getAdminOverview();

      setOverview(
        updated || {}
      );


    } catch (err) {

      setError(
        err?.message ||
        "Unable to update course."
      );

    } finally {

      setActionLoading("");

    }

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="admin-page">

        <div className="admin-loading">

          <div className="admin-loading-icon">
            🛡️
          </div>

          <h2>
            Loading Admin Panel...
          </h2>

          <p>
            Preparing platform controls.
          </p>

        </div>

      </div>
    );

  }


  return (
    <div className="admin-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <section className="admin-hero">

        <div>

          <span className="admin-eyebrow">
            ADMINISTRATION
          </span>

          <h1>
            Admin Panel
          </h1>

          <p>
            Manage users, approve courses,
            and monitor the Learnly platform.
          </p>

        </div>


        <div className="admin-shield">
          🛡️
        </div>

      </section>


      {/* ====================================================
          MESSAGES
      ==================================================== */}

      {error && (

        <div className="admin-message admin-error">
          ⚠️ {error}
        </div>

      )}


      {notice && (

        <div className="admin-message admin-success">
          ✓ {notice}
        </div>

      )}


      {/* ====================================================
          PLATFORM STATS
      ==================================================== */}

      <section className="admin-stats">

        <AdminStat
          icon="👥"
          label="Total Users"
          value={
            overview.total_users || 0
          }
        />

        <AdminStat
          icon="🎓"
          label="Students"
          value={
            overview.students || 0
          }
        />

        <AdminStat
          icon="👨‍🏫"
          label="Instructors"
          value={
            overview.instructors || 0
          }
        />

        <AdminStat
          icon="📚"
          label="Courses"
          value={
            overview.total_courses || 0
          }
        />

        <AdminStat
          icon="⏳"
          label="Pending"
          value={
            overview.pending_courses || 0
          }
        />

        <AdminStat
          icon="📝"
          label="Enrollments"
          value={
            overview.total_enrollments || 0
          }
        />

        <AdminStat
          icon="📈"
          label="Avg Progress"
          value={`${Number(
            overview.average_progress || 0
          ).toFixed(1)}%`}
        />

        <AdminStat
          icon="🚫"
          label="Suspended"
          value={
            overview.suspended_users || 0
          }
        />

      </section>


      {/* ====================================================
          COURSE APPROVAL
      ==================================================== */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>

            <span className="admin-eyebrow">
              CONTENT GOVERNANCE
            </span>

            <h2>
              Course Approval Queue
            </h2>

            <p>
              Review courses submitted by instructors.
            </p>

          </div>

          <span className="admin-count">
            {pendingCourses.length}
            {" "}
            pending
          </span>

        </div>


        {pendingCourses.length === 0 ? (

          <div className="admin-empty">
            <div>✓</div>
            <h3>
              All caught up
            </h3>
            <p>
              There are no courses waiting for approval.
            </p>
          </div>

        ) : (

          <div className="admin-course-list">

            {pendingCourses.map(
              course => (

                <div
                  className="admin-course-card"
                  key={course.id}
                >

                  <div className="admin-course-image">

                    {course.thumbnail_url ? (

                      <img
                        src={
                          course.thumbnail_url
                        }
                        alt={
                          course.title
                        }
                      />

                    ) : (

                      <span>
                        📚
                      </span>

                    )}

                  </div>


                  <div className="admin-course-info">

                    <span className="admin-course-category">
                      {
                        course.category ||
                        "General"
                      }
                    </span>

                    <h3>
                      {course.title}
                    </h3>

                    <p>
                      {
                        course.description ||
                        "No description available."
                      }
                    </p>

                    <div className="admin-course-meta">

                      <span>
                        👨‍🏫{" "}
                        {
                          course.instructor_name
                        }
                      </span>

                      <span>
                        👥{" "}
                        {
                          course.student_count
                        }{" "}
                        students
                      </span>

                      <span>
                        📦{" "}
                        {
                          course.module_count
                        }{" "}
                        modules
                      </span>

                    </div>

                  </div>


                  <div className="admin-course-actions">

                    <button
                      className="admin-approve"
                      disabled={
                        actionLoading ===
                        `course-${course.id}`
                      }
                      onClick={() =>
                        decideCourse(
                          course,
                          "approved"
                        )
                      }
                    >
                      ✓ Approve
                    </button>


                    <button
                      className="admin-reject"
                      disabled={
                        actionLoading ===
                        `course-${course.id}`
                      }
                      onClick={() =>
                        decideCourse(
                          course,
                          "rejected"
                        )
                      }
                    >
                      ✕ Reject
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* ====================================================
          USERS
      ==================================================== */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>

            <span className="admin-eyebrow">
              USER MANAGEMENT
            </span>

            <h2>
              Users
            </h2>

            <p>
              Manage accounts and platform roles.
            </p>

          </div>

        </div>


        {/* FILTERS */}

        <form
          className="admin-filters"
          onSubmit={
            handleSearch
          }
        >

          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search name or email..."
          />


          <select
            value={roleFilter}
            onChange={event =>
              setRoleFilter(
                event.target.value
              )
            }
          >

            <option value="">
              All roles
            </option>

            <option value="student">
              Student
            </option>

            <option value="instructor">
              Instructor
            </option>

            <option value="admin">
              Admin
            </option>

          </select>


          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(
                event.target.value
              )
            }
          >

            <option value="">
              All status
            </option>

            <option value="active">
              Active
            </option>

            <option value="suspended">
              Suspended
            </option>

          </select>


          <button
            type="submit"
            className="admin-search-button"
          >
            Search
          </button>

        </form>


        {/* USERS TABLE */}

        {users.length === 0 ? (

          <div className="admin-empty">
            <div>👥</div>
            <h3>
              No users found
            </h3>
            <p>
              Try changing your search or filters.
            </p>
          </div>

        ) : (

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>

                <tr>

                  <th>
                    User
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Change Role
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {users.map(
                  user => (

                    <tr
                      key={user.id}
                    >

                      <td>

                        <div className="admin-user">

                          <div className="admin-avatar">
                            {String(
                              user.full_name ||
                              user.email ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <strong>
                              {
                                user.full_name ||
                                "Unnamed User"
                              }
                            </strong>

                            <span>
                              {
                                user.email
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      <td>

                        <div className="admin-role-list">

                          {user.roles?.map(
                            role => (

                              <span
                                key={role}
                                className={
                                  `admin-role role-${role}`
                                }
                              >
                                {role}
                              </span>

                            )
                          )}

                        </div>

                      </td>


                      <td>

                        <span
                          className={
                            user.is_active
                              ? "admin-status active"
                              : "admin-status suspended"
                          }
                        >
                          {user.is_active
                            ? "Active"
                            : "Suspended"}
                        </span>

                      </td>


                      <td>

                        <select
                          value={
                            user.roles?.includes(
                              "admin"
                            )
                              ? "admin"
                              : user.roles?.includes(
                                  "instructor"
                                )
                                ? "instructor"
                                : "student"
                          }
                          disabled={
                            actionLoading ===
                            `role-${user.id}`
                          }
                          onChange={event =>
                            changeRole(
                              user,
                              event.target.value
                            )
                          }
                        >

                          <option value="student">
                            Student
                          </option>

                          <option value="instructor">
                            Instructor
                          </option>

                          <option value="admin">
                            Admin
                          </option>

                        </select>

                      </td>


                      <td>

                        <div className="admin-actions">

                          <button
                            className={
                              user.is_active
                                ? "admin-action danger"
                                : "admin-action success"
                            }
                            disabled={
                              actionLoading ===
                              `user-${user.id}`
                            }
                            onClick={() =>
                              toggleUser(
                                user
                              )
                            }
                          >
                            {user.is_active
                              ? "Suspend"
                              : "Activate"}
                          </button>


                          <button
                            className="admin-action delete"
                            disabled={
                              actionLoading ===
                              `delete-${user.id}`
                            }
                            onClick={() =>
                              removeUser(
                                user
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}


// ============================================================
// STAT
// ============================================================

function AdminStat({
  icon,
  label,
  value,
}) {

  return (
    <div className="admin-stat">

      <div className="admin-stat-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}
