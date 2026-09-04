import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getInstructorCourses,
} from "../services/instructor";

import "../styles/InstructorCourses.css";


export default function InstructorCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const data = await getInstructorCourses();

      setCourses(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        "Failed to load instructor courses:",
        err
      );

      setError(
        err?.message ||
        "Unable to load instructor courses."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadCourses();
  }, []);


  function getCourseId(course) {
    return (
      course?.id ||
      course?.course_id ||
      course?.uuid
    );
  }


  function getTitle(course) {
    return (
      course?.title ||
      course?.name ||
      course?.course_name ||
      "Untitled Course"
    );
  }


  function getDescription(course) {
    return (
      course?.description ||
      "No description available."
    );
  }


  function getStatus(course) {
    return String(
      course?.status ||
      course?.approval_status ||
      course?.state ||
      "draft"
    ).toLowerCase();
  }


  function statusClass(status) {
    if (
      status === "published" ||
      status === "approved" ||
      status === "active"
    ) {
      return "status-published";
    }

    if (
      status === "pending" ||
      status === "draft"
    ) {
      return "status-pending";
    }

    if (status === "rejected") {
      return "status-rejected";
    }

    return "status-default";
  }


  return (
    <div className="instructor-courses-page">

      {/* HEADER */}

      <div className="courses-page-header">

        <div>

          <span className="section-eyebrow">
            INSTRUCTOR WORKSPACE
          </span>

          <h1>
            My Courses
          </h1>

          <p>
            Create, manage and organize
            your courses and learning content.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate(
              "/instructor/courses/create"
            )
          }
        >
          + Create Course
        </button>

      </div>


      {/* LOADING */}

      {loading && (
        <div className="courses-state">

          <div className="loading-spinner" />

          <p>
            Loading your courses...
          </p>

        </div>
      )}


      {/* ERROR */}

      {!loading && error && (
        <div className="courses-error">

          <div className="error-icon">
            ⚠️
          </div>

          <h3>
            Unable to load courses
          </h3>

          <p>
            {error}
          </p>

          <button
            className="secondary-button"
            onClick={loadCourses}
          >
            Try Again
          </button>

        </div>
      )}


      {/* EMPTY */}

      {!loading &&
        !error &&
        courses.length === 0 && (

          <div className="courses-empty">

            <div className="empty-course-icon">
              📚
            </div>

            <h2>
              No courses yet
            </h2>

            <p>
              Create your first course
              and start building your
              learning content.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  "/instructor/courses/create"
                )
              }
            >
              + Create Your First Course
            </button>

          </div>
        )}


      {/* COURSE GRID */}

      {!loading &&
        !error &&
        courses.length > 0 && (

          <div className="courses-grid">

            {courses.map(
              (course, index) => {

                const courseId =
                  getCourseId(course);

                const status =
                  getStatus(course);

                return (
                  <article
                    className="instructor-course-card"
                    key={
                      courseId ||
                      index
                    }
                  >

                    {/* IMAGE */}

                    <div className="course-cover">

                      {(
                        course?.thumbnail_url ||
                        course?.thumbnail ||
                        course?.image
                      ) ? (

                        <img
                          src={
                            course.thumbnail_url ||
                            course.thumbnail ||
                            course.image
                          }
                          alt={getTitle(course)}
                        />

                      ) : (

                        <div className="course-cover-placeholder">
                          🎓
                        </div>

                      )}

                      <span
                        className={`course-status ${statusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>

                    </div>


                    {/* BODY */}

                    <div className="course-card-body">

                      <h2>
                        {getTitle(course)}
                      </h2>

                      <p>
                        {getDescription(course)}
                      </p>


                      <div className="course-meta">

                        <span>
                          📦{" "}
                          {
                            course?.modules_count ??
                            course?.module_count ??
                            0
                          }{" "}
                          Modules
                        </span>

                        <span>
                          ▶️{" "}
                          {
                            course?.lectures_count ??
                            course?.lecture_count ??
                            0
                          }{" "}
                          Lectures
                        </span>

                        <span>
                          👥{" "}
                          {
                            course?.student_count ??
                            course?.students_count ??
                            0
                          }{" "}
                          Students
                        </span>

                      </div>


                      {/* ACTIONS */}

                      <div className="course-actions">

                        <button
                          className="secondary-button"
                          disabled={!courseId}
                          onClick={() => {
                            if (!courseId) return;

                            navigate(
                              `/instructor/courses/${courseId}`
                            );
                          }}
                        >
                          Manage
                        </button>

                        <button
                          className="outline-button"
                          disabled={!courseId}
                          onClick={() => {
                            if (!courseId) return;

                            navigate(
                              `/instructor/courses/${courseId}/edit`
                            );
                          }}
                        >
                          Edit
                        </button>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

    </div>
  );
}
