import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getInstructorDashboard,
  getInstructorCourses,
  getInstructorAnalyticsOverview,
  getInstructorAnalyticsCourses,
  getInstructorAnalyticsStudents,
  getInstructorAnalyticsQuizzes,
  getInstructorRecentAttempts,
} from "../services/instructor";

import "../styles/InstructorDashboard.css";


// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function InstructorDashboard() {

  const navigate =
    useNavigate();


  const [
    stats,
    setStats,
  ] = useState({});


  const [
    courses,
    setCourses,
  ] = useState([]);


  const [
    analytics,
    setAnalytics,
  ] = useState({
    overview: {},
    courses: [],
    students: [],
    quizzes: [],
    recentAttempts: [],
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    analyticsLoading,
    setAnalyticsLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    analyticsError,
    setAnalyticsError,
  ] = useState("");


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  useEffect(() => {

    let mounted = true;


    async function loadDashboard() {

      try {

        setLoading(true);
        setError("");


        const dashboardData =
          await getInstructorDashboard();


        let coursesData = [];


        try {

          coursesData =
            await getInstructorCourses();

        } catch (courseError) {

          console.warn(
            "Could not load instructor courses:",
            courseError
          );

        }


        if (!mounted) {
          return;
        }


        setStats(
          dashboardData || {}
        );


        setCourses(
          Array.isArray(
            coursesData
          )
            ? coursesData
            : []
        );


      } catch (err) {

        console.error(
          "Instructor dashboard error:",
          err
        );


        if (!mounted) {
          return;
        }


        setError(
          err?.message ||
          "Unable to load instructor dashboard."
        );


      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    }


    loadDashboard();


    return () => {
      mounted = false;
    };

  }, []);


  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  useEffect(() => {

    let mounted = true;


    async function loadAnalytics() {

      try {

        setAnalyticsLoading(true);
        setAnalyticsError("");


        const [
          overview,
          courseAnalytics,
          studentAnalytics,
          quizAnalytics,
          recentAttempts,
        ] = await Promise.all([

          getInstructorAnalyticsOverview(),

          getInstructorAnalyticsCourses(),

          getInstructorAnalyticsStudents(),

          getInstructorAnalyticsQuizzes(),

          getInstructorRecentAttempts(),

        ]);


        if (!mounted) {
          return;
        }


        setAnalytics({

          overview:
            overview || {},

          courses:
            Array.isArray(
              courseAnalytics
            )
              ? courseAnalytics
              : [],

          students:
            Array.isArray(
              studentAnalytics
            )
              ? studentAnalytics
              : [],

          quizzes:
            Array.isArray(
              quizAnalytics
            )
              ? quizAnalytics
              : [],

          recentAttempts:
            Array.isArray(
              recentAttempts
            )
              ? recentAttempts
              : [],

        });


      } catch (err) {

        console.error(
          "Instructor analytics error:",
          err
        );


        if (!mounted) {
          return;
        }


        setAnalyticsError(
          err?.message ||
          "Unable to load instructor analytics."
        );


      } finally {

        if (mounted) {
          setAnalyticsLoading(false);
        }

      }

    }


    loadAnalytics();


    return () => {
      mounted = false;
    };

  }, []);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="instructor-page">

        <div className="instructor-loading">

          <div className="instructor-loading-icon">
            🤖
          </div>

          <h2>
            Loading instructor dashboard...
          </h2>

          <p>
            Preparing your teaching workspace.
          </p>

        </div>

      </div>
    );

  }


  // ==========================================================
  // DASHBOARD STATS
  // ==========================================================

  const totalCourses =
    stats?.total_courses ??
    stats?.courses_count ??
    courses.length ??
    0;


  const publishedCourses =
    stats?.published_courses ??
    0;


  const pendingCourses =
    stats?.pending_courses ??
    0;


  const rejectedCourses =
    stats?.rejected_courses ??
    0;


  const totalStudents =
    stats?.total_students ??
    0;


  const totalModules =
    stats?.total_modules ??
    0;


  const totalLectures =
    stats?.total_lectures ??
    0;


  // ==========================================================
  // ANALYTICS STATS
  // ==========================================================

  const overview =
    analytics.overview || {};


  const averageProgress =
    Number(
      overview.average_progress || 0
    );


  const averageQuizScore =
    Number(
      overview.average_quiz_score || 0
    );


  const highestQuizScore =
    Number(
      overview.highest_quiz_score || 0
    );


  const totalEnrollments =
    Number(
      overview.total_enrollments || 0
    );


  const completedLectures =
    Number(
      overview.completed_lectures || 0
    );


  const quizAttempts =
    Number(
      overview.total_quiz_attempts || 0
    );


  return (
    <div className="instructor-page">

      {/* ====================================================
          HERO
      ==================================================== */}

      <section className="instructor-hero">

        <div className="instructor-hero-content">

          <span className="instructor-eyebrow">
            INSTRUCTOR WORKSPACE
          </span>

          <h1>
            Instructor Dashboard
          </h1>

          <p>
            Manage your courses, track your
            learners, and build better
            learning experiences.
          </p>

          <div className="instructor-hero-actions">

            <button
              className="instructor-primary-button"
              onClick={() =>
                navigate(
                  "/instructor/courses/create"
                )
              }
            >
              + Create Course
            </button>

            <button
              className="instructor-secondary-button"
              onClick={() =>
                navigate(
                  "/instructor/courses"
                )
              }
            >
              Manage Courses →
            </button>

          </div>

        </div>


        <div className="instructor-hero-visual">

          <div className="instructor-hero-icon">
            🎓
          </div>

        </div>

      </section>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <div className="instructor-error">

          <strong>
            Unable to load dashboard
          </strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ====================================================
          MAIN STATS
      ==================================================== */}

      <section className="instructor-stats-grid">

        <InstructorStat
          icon="📚"
          label="Total Courses"
          value={totalCourses}
          description="Courses created"
        />

        <InstructorStat
          icon="✓"
          label="Published"
          value={publishedCourses}
          description="Approved courses"
        />

        <InstructorStat
          icon="⏳"
          label="Pending"
          value={pendingCourses}
          description="Awaiting approval"
        />

        <InstructorStat
          icon="✕"
          label="Rejected"
          value={rejectedCourses}
          description="Courses rejected"
        />

        <InstructorStat
          icon="👥"
          label="Students"
          value={totalStudents}
          description="Unique learners"
        />

        <InstructorStat
          icon="▦"
          label="Modules"
          value={totalModules}
          description="Course modules"
        />

        <InstructorStat
          icon="▶"
          label="Lectures"
          value={totalLectures}
          description="Total lectures"
        />

        <InstructorStat
          icon="🚀"
          label="Active Courses"
          value={publishedCourses}
          description="Currently published"
        />

      </section>


      {/* ====================================================
          MY COURSES
      ==================================================== */}

      <section className="instructor-section">

        <div className="instructor-section-header">

          <div>

            <span className="instructor-eyebrow">
              CONTENT
            </span>

            <h2>
              My Courses
            </h2>

            <p>
              Manage and monitor the
              courses you've created.
            </p>

          </div>

          <button
            className="instructor-text-button"
            onClick={() =>
              navigate(
                "/instructor/courses"
              )
            }
          >
            View all →
          </button>

        </div>


        {courses.length === 0 ? (

          <div className="instructor-empty">

            <div className="instructor-empty-icon">
              📚
            </div>

            <h3>
              No courses yet
            </h3>

            <p>
              Create your first course
              and start teaching learners.
            </p>

            <button
              className="instructor-primary-button"
              onClick={() =>
                navigate(
                  "/instructor/courses/create"
                )
              }
            >
              + Create your first course
            </button>

          </div>

        ) : (

          <div className="instructor-course-grid">

            {courses
              .slice(0, 6)
              .map(
                (
                  course,
                  index
                ) => {

                  const id =
                    course?.id ||
                    course?.course_id;


                  return (
                    <InstructorCourseCard
                      key={
                        id ||
                        index
                      }
                      course={course}
                      onManage={() => {

                        if (!id) {
                          return;
                        }

                        navigate(
                          `/instructor/courses/${id}`
                        );

                      }}
                    />
                  );

                }
              )}

          </div>

        )}

      </section>


      {/* ====================================================
          INSTRUCTOR ANALYTICS
      ==================================================== */}

      <section className="instructor-section">

        <div className="instructor-section-header">

          <div>

            <span className="instructor-eyebrow">
              PERFORMANCE
            </span>

            <h2>
              Instructor Analytics
            </h2>

            <p>
              Understand learner progress,
              course performance, and quiz results.
            </p>

          </div>

        </div>


        {analyticsLoading ? (

          <div className="instructor-analytics-loading">

            <div className="instructor-loading-icon">
              📊
            </div>

            <h3>
              Loading analytics...
            </h3>

            <p>
              Calculating course and learner performance.
            </p>

          </div>

        ) : analyticsError ? (

          <div className="instructor-error">

            <strong>
              Analytics unavailable
            </strong>

            <span>
              {analyticsError}
            </span>

          </div>

        ) : (

          <>

            {/* ----------------------------------------------
                ANALYTICS SUMMARY
            ---------------------------------------------- */}

            <div className="instructor-analytics-grid">

              <AnalyticsStat
                icon="📈"
                label="Average Progress"
                value={`${averageProgress.toFixed(1)}%`}
                description="Across all enrollments"
              />

              <AnalyticsStat
                icon="📝"
                label="Quiz Average"
                value={`${averageQuizScore.toFixed(1)}%`}
                description={`${quizAttempts} total attempts`}
              />

              <AnalyticsStat
                icon="🏆"
                label="Highest Quiz Score"
                value={`${highestQuizScore.toFixed(1)}%`}
                description="Best learner result"
              />

              <AnalyticsStat
                icon="👥"
                label="Enrollments"
                value={totalEnrollments}
                description="Total course enrollments"
              />

              <AnalyticsStat
                icon="▶"
                label="Completed Lectures"
                value={completedLectures}
                description="Learner completions"
              />

              <AnalyticsStat
                icon="🎯"
                label="Quiz Attempts"
                value={quizAttempts}
                description="Submitted quizzes"
              />

            </div>


            {/* ----------------------------------------------
                COURSE PERFORMANCE
            ---------------------------------------------- */}

            <AnalyticsPanel
              eyebrow="COURSE PERFORMANCE"
              title="Course Performance"
              description="Compare learner engagement across your courses."
            >

              {analytics.courses.length === 0 ? (

                <AnalyticsEmpty
                  text="No course analytics available yet."
                />

              ) : (

                <div className="analytics-course-list">

                  {analytics.courses.map(
                    (course) => (

                      <div
                        key={
                          course.course_id
                        }
                        className="analytics-course-row"
                      >

                        <div className="analytics-course-main">

                          <strong>
                            {course.course_title}
                          </strong>

                          <span>
                            {course.students} students
                            {" · "}
                            {course.modules} modules
                            {" · "}
                            {course.lectures} lectures
                          </span>

                        </div>


                        <div className="analytics-progress-area">

                          <div className="analytics-progress-header">

                            <span>
                              Progress
                            </span>

                            <strong>
                              {Number(
                                course.average_progress ||
                                0
                              ).toFixed(1)}
                              %
                            </strong>

                          </div>

                          <div className="analytics-progress-track">

                            <div
                              className="analytics-progress-fill"
                              style={{
                                width:
                                  `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      Number(
                                        course.average_progress ||
                                        0
                                      )
                                    )
                                  )}%`,
                              }}
                            />

                          </div>

                        </div>


                        <div className="analytics-course-score">

                          <strong>
                            {Number(
                              course.average_quiz_score ||
                              0
                            ).toFixed(1)}
                            %
                          </strong>

                          <span>
                            Quiz avg.
                          </span>

                        </div>


                        <div className="analytics-course-students">

                          <strong>
                            {course.completed_students}
                          </strong>

                          <span>
                            Completed
                          </span>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </AnalyticsPanel>


            {/* ----------------------------------------------
                STUDENT PERFORMANCE
            ---------------------------------------------- */}

            <AnalyticsPanel
              eyebrow="LEARNER PERFORMANCE"
              title="Student Performance"
              description="See how individual learners are progressing."
            >

              {analytics.students.length === 0 ? (

                <AnalyticsEmpty
                  text="No student analytics available yet."
                />

              ) : (

                <div className="analytics-table-wrapper">

                  <table className="analytics-table">

                    <thead>

                      <tr>

                        <th>
                          Student
                        </th>

                        <th>
                          Course
                        </th>

                        <th>
                          Progress
                        </th>

                        <th>
                          Quiz Average
                        </th>

                        <th>
                          Attempts
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {analytics.students
                        .slice(0, 15)
                        .map(
                          (
                            student,
                            index
                          ) => (

                            <tr
                              key={
                                `${student.student_id}-${student.course_id}-${index}`
                              }
                            >

                              <td>

                                <div className="analytics-student-name">

                                  <div className="analytics-avatar">
                                    {String(
                                      student.student_name ||
                                      "S"
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div>

                                    <strong>
                                      {
                                        student.student_name
                                      }
                                    </strong>

                                    <span>
                                      {
                                        student.email
                                      }
                                    </span>

                                  </div>

                                </div>

                              </td>


                              <td>
                                {
                                  student.course_title
                                }
                              </td>


                              <td>

                                <div className="analytics-table-progress">

                                  <span>
                                    {Number(
                                      student.progress ||
                                      0
                                    ).toFixed(0)}
                                    %
                                  </span>

                                  <div className="analytics-mini-track">

                                    <div
                                      style={{
                                        width:
                                          `${Math.min(
                                            100,
                                            Math.max(
                                              0,
                                              Number(
                                                student.progress ||
                                                0
                                              )
                                            )
                                          )}%`,
                                      }}
                                    />

                                  </div>

                                </div>

                              </td>


                              <td>
                                {Number(
                                  student.average_quiz_score ||
                                  0
                                ).toFixed(1)}
                                %
                              </td>


                              <td>
                                {
                                  student.quiz_attempts
                                }
                              </td>


                              <td>

                                <span
                                  className={
                                    `analytics-status analytics-status-${String(
                                      student.status ||
                                      ""
                                    )
                                      .toLowerCase()
                                      .replace(
                                        /\s+/g,
                                        "-"
                                      )}`
                                  }
                                >
                                  {
                                    student.status
                                  }
                                </span>

                              </td>

                            </tr>

                          )
                        )}

                    </tbody>

                  </table>

                </div>

              )}

            </AnalyticsPanel>


            {/* ----------------------------------------------
                QUIZ PERFORMANCE
            ---------------------------------------------- */}

            <AnalyticsPanel
              eyebrow="ASSESSMENTS"
              title="Quiz Performance"
              description="Monitor which quizzes are performing well."
            >

              {analytics.quizzes.length === 0 ? (

                <AnalyticsEmpty
                  text="No quiz attempts available yet."
                />

              ) : (

                <div className="analytics-quiz-grid">

                  {analytics.quizzes
                    .slice(0, 8)
                    .map(
                      (quiz) => (

                        <div
                          key={
                            quiz.quiz_id
                          }
                          className="analytics-quiz-card"
                        >

                          <div className="analytics-quiz-icon">
                            🎯
                          </div>

                          <div className="analytics-quiz-content">

                            <span>
                              {
                                quiz.course_title
                              }
                            </span>

                            <h3>
                              {
                                quiz.quiz_title
                              }
                            </h3>

                            <p>
                              {
                                quiz.question_count
                              }
                              {" "}
                              questions
                              {" · "}
                              {
                                quiz.attempts
                              }
                              {" "}
                              attempts
                            </p>

                          </div>

                          <div className="analytics-quiz-score">

                            <strong>
                              {Number(
                                quiz.average_score ||
                                0
                              ).toFixed(1)}
                              %
                            </strong>

                            <span>
                              Average
                            </span>

                          </div>

                        </div>

                      )
                    )}

                </div>

              )}

            </AnalyticsPanel>


            {/* ----------------------------------------------
                RECENT ATTEMPTS
            ---------------------------------------------- */}

            <AnalyticsPanel
              eyebrow="RECENT ACTIVITY"
              title="Recent Quiz Attempts"
              description="Latest assessment results from your learners."
            >

              {analytics.recentAttempts.length === 0 ? (

                <AnalyticsEmpty
                  text="No quiz attempts have been submitted yet."
                />

              ) : (

                <div className="analytics-attempt-list">

                  {analytics.recentAttempts.map(
                    (attempt) => (

                      <div
                        key={
                          attempt.attempt_id
                        }
                        className="analytics-attempt-row"
                      >

                        <div className="analytics-attempt-avatar">
                          {String(
                            attempt.student_name ||
                            "S"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="analytics-attempt-info">

                          <strong>
                            {
                              attempt.student_name
                            }
                          </strong>

                          <span>
                            {
                              attempt.quiz_title
                            }
                            {" · "}
                            {
                              attempt.course_title
                            }
                          </span>

                        </div>

                        <div className="analytics-attempt-score">

                          <strong>
                            {Number(
                              attempt.score ||
                              0
                            ).toFixed(1)}
                            %
                          </strong>

                          <span>
                            {
                              attempt.correct_answers
                            }
                            /
                            {
                              attempt.total_questions
                            }
                            correct
                          </span>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </AnalyticsPanel>

          </>

        )}

      </section>


      {/* ====================================================
          QUICK ACTIONS
      ==================================================== */}

      <section className="instructor-section">

        <div className="instructor-section-header">

          <div>

            <span className="instructor-eyebrow">
              QUICK ACTIONS
            </span>

            <h2>
              Teaching tools
            </h2>

          </div>

        </div>


        <div className="instructor-actions-grid">

          <QuickAction
            icon="➕"
            title="Create Course"
            description="Build a new course for your students."
            onClick={() =>
              navigate(
                "/instructor/courses/create"
              )
            }
          />


          <QuickAction
            icon="📚"
            title="Manage Courses"
            description="Edit your existing courses and content."
            onClick={() =>
              navigate(
                "/instructor/courses"
              )
            }
          />


          <QuickAction
            icon="📊"
            title="Analytics"
            description="View learner and course performance."
            onClick={() =>
              document
                .getElementById(
                  "instructor-analytics"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          />


          <QuickAction
            icon="🏆"
            title="Certificates"
            description="Manage certificates for completed courses."
            onClick={() =>
              alert(
                "Certificates will be available in the next phase."
              )
            }
          />

        </div>

      </section>

    </div>
  );
}


// ============================================================
// STAT
// ============================================================

function InstructorStat({
  icon,
  label,
  value,
  description,
}) {

  return (
    <div className="instructor-stat-card">

      <div className="instructor-stat-top">

        <div className="instructor-stat-icon">
          {icon}
        </div>

        <span>
          {label}
        </span>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </div>
  );
}


// ============================================================
// ANALYTICS STAT
// ============================================================

function AnalyticsStat({
  icon,
  label,
  value,
  description,
}) {

  return (
    <div className="instructor-analytics-stat">

      <div className="instructor-analytics-stat-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {description}
        </small>

      </div>

    </div>
  );
}


// ============================================================
// ANALYTICS PANEL
// ============================================================

function AnalyticsPanel({
  eyebrow,
  title,
  description,
  children,
}) {

  return (
    <div
      className="instructor-analytics-panel"
      id={
        title === "Course Performance"
          ? "instructor-analytics"
          : undefined
      }
    >

      <div className="instructor-analytics-panel-header">

        <div>

          <span className="instructor-eyebrow">
            {eyebrow}
          </span>

          <h3>
            {title}
          </h3>

          <p>
            {description}
          </p>

        </div>

      </div>

      {children}

    </div>
  );
}


// ============================================================
// ANALYTICS EMPTY
// ============================================================

function AnalyticsEmpty({
  text,
}) {

  return (
    <div className="analytics-empty">

      <div>
        📊
      </div>

      <p>
        {text}
      </p>

    </div>
  );
}


// ============================================================
// COURSE CARD
// ============================================================

function InstructorCourseCard({
  course,
  onManage,
}) {

  const status =
    String(
      course?.status ||
      course?.approval_status ||
      "draft"
    ).toLowerCase();


  const statusLabel =
    status === "approved"
      ? "Published"
      : status.charAt(0).toUpperCase() +
        status.slice(1);


  return (
    <article className="instructor-course-card">

      <div className="instructor-course-image">

        {course?.thumbnail_url ? (

          <img
            src={
              course.thumbnail_url
            }
            alt={
              course?.title ||
              "Course"
            }
          />

        ) : (

          <div className="instructor-course-placeholder">
            🎓
          </div>

        )}

        <span
          className={
            `instructor-course-status status-${status}`
          }
        >
          {statusLabel}
        </span>

      </div>


      <div className="instructor-course-body">

        <div className="instructor-course-category">
          {course?.category ||
            "General"}
        </div>

        <h3>
          {course?.title ||
            course?.name ||
            "Untitled Course"}
        </h3>

        <p>
          {course?.description ||
            "No course description available."}
        </p>


        <div className="instructor-course-metrics">

          <div>

            <strong>
              {course?.student_count ?? 0}
            </strong>

            <span>
              Students
            </span>

          </div>


          <div>

            <strong>
              {course?.module_count ??
                course?.modules_count ??
                0}
            </strong>

            <span>
              Modules
            </span>

          </div>


          <div>

            <strong>
              {course?.lecture_count ??
                course?.lectures_count ??
                0}
            </strong>

            <span>
              Lectures
            </span>

          </div>

        </div>


        <button
          className="instructor-manage-button"
          onClick={onManage}
        >
          Manage Course →
        </button>

      </div>

    </article>
  );
}


// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  icon,
  title,
  description,
  onClick,
}) {

  return (
    <button
      className="instructor-quick-action"
      onClick={onClick}
    >

      <div className="instructor-quick-icon">
        {icon}
      </div>

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

      <span className="instructor-quick-arrow">
        →
      </span>

    </button>
  );
}
