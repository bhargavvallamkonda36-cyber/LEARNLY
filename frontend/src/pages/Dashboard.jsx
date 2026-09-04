import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getDashboardStats,
  getDashboardCourses,
  getMyEnrollments,
  getDashboardCourseProgress,
  getLearningStreak,
  getId,
  getCourseName,
  getCourseImage,
  getProgressPercent,
} from "../services/dashboard";

import DashboardAnalytics from "../components/DashboardAnalytics";

import "../styles/Dashboard.css";


export default function Dashboard() {

  const navigate = useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    courses,
    setCourses,
  ] = useState([]);


  const [
    enrollments,
    setEnrollments,
  ] = useState([]);


  const [
    progressMap,
    setProgressMap,
  ] = useState({});


  const [
    serverStats,
    setServerStats,
  ] = useState(null);


  // ==========================================================
  // LEARNING STREAK STATE
  // ==========================================================

  const [
    streakData,
    setStreakData,
  ] = useState({
    streak: 0,
    today_active: false,
    last_learning_date: null,
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadDashboard() {

      try {

        setLoading(true);
        setError("");


        // ====================================================
        // LOAD MAIN DASHBOARD DATA
        // ====================================================

        const results =
          await Promise.allSettled([

            getDashboardCourses(),

            getMyEnrollments(),

            getDashboardStats(),

            getLearningStreak(),

          ]);


        if (cancelled) {
          return;
        }


        const courseResult =
          results[0];

        const enrollmentResult =
          results[1];

        const statsResult =
          results[2];

        const streakResult =
          results[3];


        // ====================================================
        // COURSES
        // ====================================================

        const loadedCourses =
          courseResult.status === "fulfilled"
            ? courseResult.value
            : [];


        // ====================================================
        // ENROLLMENTS
        // ====================================================

        const loadedEnrollments =
          enrollmentResult.status === "fulfilled"
            ? enrollmentResult.value
            : [];


        setCourses(
          Array.isArray(
            loadedCourses
          )
            ? loadedCourses
            : []
        );


        setEnrollments(
          Array.isArray(
            loadedEnrollments
          )
            ? loadedEnrollments
            : []
        );


        // ====================================================
        // SERVER STATS
        // ====================================================

        if (
          statsResult.status ===
          "fulfilled"
        ) {

          setServerStats(
            statsResult.value || null
          );

        }


        // ====================================================
        // LEARNING STREAK
        // ====================================================

        if (
          streakResult.status ===
          "fulfilled"
        ) {

          console.log(
            "Learning streak:",
            streakResult.value
          );


          setStreakData(
            streakResult.value || {
              streak: 0,
              today_active: false,
              last_learning_date: null,
            }
          );

        } else {

          console.error(
            "Learning streak API failed:",
            streakResult.reason
          );


          setStreakData({
            streak: 0,
            today_active: false,
            last_learning_date: null,
          });

        }


        // ====================================================
        // FIND ENROLLED COURSE IDS
        // ====================================================

        const enrolledIds =
          loadedEnrollments
            .map(
              (enrollment) =>
                enrollment.course_id ??
                enrollment.courseId ??
                enrollment.course?.id
            )
            .filter(Boolean);


        // ====================================================
        // LOAD COURSE PROGRESS
        // ====================================================

        if (
          enrolledIds.length > 0
        ) {

          const uniqueIds = [
            ...new Set(
              enrolledIds.map(
                (id) => String(id)
              )
            ),
          ];


          const progressResults =
            await Promise.allSettled(
              uniqueIds.map(
                async (courseId) => {

                  const progress =
                    await getDashboardCourseProgress(
                      courseId
                    );


                  return {
                    courseId:
                      String(courseId),

                    progress,
                  };

                }
              )
            );


          if (cancelled) {
            return;
          }


          const map = {};


          progressResults.forEach(
            (result) => {

              if (
                result.status ===
                "fulfilled"
              ) {

                map[
                  result.value.courseId
                ] =
                  result.value.progress;

              }

            }
          );


          setProgressMap(
            map
          );

        } else {

          setProgressMap({});

        }

      } catch (err) {

        console.error(
          "Dashboard error:",
          err
        );


        if (!cancelled) {

          setError(
            err.message ||
            "Unable to load dashboard."
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadDashboard();


    return () => {

      cancelled = true;

    };

  }, []);


  // ==========================================================
  // MATCH ENROLLED COURSES
  // ==========================================================

  const enrolledCourses =
    useMemo(() => {

      if (
        enrollments.length === 0
      ) {

        return [];

      }


      const result = [];


      enrollments.forEach(
        (enrollment) => {

          const courseId =
            enrollment.course_id ??
            enrollment.courseId ??
            enrollment.course?.id;


          if (!courseId) {

            return;

          }


          const matchingCourse =
            courses.find(
              (course) =>
                String(
                  getId(course)
                ) ===
                String(courseId)
            );


          if (matchingCourse) {

            result.push(
              matchingCourse
            );

          } else if (
            enrollment.course
          ) {

            result.push(
              enrollment.course
            );

          }

        }
      );


      return result;

    }, [
      courses,
      enrollments,
    ]);


  // ==========================================================
  // COURSE DATA WITH PROGRESS
  // ==========================================================

  const learningCourses =
    useMemo(() => {

      return enrolledCourses.map(
        (course) => {

          const courseId =
            getId(course);


          const progress =
            progressMap[
              String(courseId)
            ] || {};


          const percent =
            getProgressPercent(
              progress
            );


          return {

            ...course,

            courseId,

            percent,

            progress,

            name:
              getCourseName(
                course
              ),

            image:
              getCourseImage(
                course
              ),

          };

        }
      );

    }, [
      enrolledCourses,
      progressMap,
    ]);


  // ==========================================================
  // IN PROGRESS
  // ==========================================================

  const inProgressCourses =
    useMemo(() => {

      return learningCourses.filter(
        (course) =>
          course.percent > 0 &&
          course.percent < 100
      );

    }, [
      learningCourses,
    ]);


  // ==========================================================
  // COMPLETED
  // ==========================================================

  const completedCourses =
    useMemo(() => {

      return learningCourses.filter(
        (course) =>
          course.percent >= 100
      );

    }, [
      learningCourses,
    ]);


  // ==========================================================
  // NOT STARTED
  // ==========================================================

  const notStartedCourses =
    useMemo(() => {

      return learningCourses.filter(
        (course) =>
          course.percent <= 0
      );

    }, [
      learningCourses,
    ]);


  // ==========================================================
  // CONTINUE COURSE
  // ==========================================================

  const continueCourse =
    useMemo(() => {

      if (
        inProgressCourses.length >
        0
      ) {

        return inProgressCourses[0];

      }


      if (
        notStartedCourses.length >
        0
      ) {

        return notStartedCourses[0];

      }


      return null;

    }, [
      inProgressCourses,
      notStartedCourses,
    ]);


  // ==========================================================
  // OVERALL PROGRESS
  // ==========================================================

  const overallProgress =
    useMemo(() => {

      if (
        serverStats
      ) {

        const value =
          serverStats.overall_progress ??
          serverStats.progress_percent ??
          serverStats.progress_percentage;


        if (
          value !== undefined &&
          Number.isFinite(
            Number(value)
          )
        ) {

          return Math.round(
            Number(value)
          );

        }

      }


      if (
        learningCourses.length === 0
      ) {

        return 0;

      }


      const total =
        learningCourses.reduce(
          (
            sum,
            course
          ) =>
            sum +
            course.percent,
          0
        );


      return Math.round(
        total /
        learningCourses.length
      );

    }, [
      serverStats,
      learningCourses,
    ]);


  // ==========================================================
  // DASHBOARD STATS
  // ==========================================================

  const totalCourses =
    serverStats?.total_courses ??
    serverStats?.courses_count ??
    learningCourses.length;


  const totalCompleted =
    serverStats?.completed_courses ??
    serverStats?.completed_courses_count ??
    completedCourses.length;


  const totalInProgress =
    serverStats?.in_progress_courses ??
    serverStats?.active_courses ??
    inProgressCourses.length;


  // ==========================================================
  // LEARNING STREAK
  // ==========================================================

  const learningStreak =
    Number(
      streakData?.streak ?? 0
    );


  const safeLearningStreak =
    Number.isFinite(
      learningStreak
    )
      ? Math.max(
          0,
          Math.floor(
            learningStreak
          )
        )
      : 0;


  // ==========================================================
  // OPEN COURSE
  // ==========================================================

  function continueLearning(
    courseId
  ) {

    if (!courseId) {

      return;

    }


    navigate(
      `/courses/${courseId}/learn`
    );

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="dashboard-loading">

        <div className="dashboard-spinner"></div>

        <p>
          Loading your dashboard...
        </p>

      </div>

    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="dashboard-page">


      {/* ====================================================
          HEADER
          ==================================================== */}

      <section className="dashboard-header">

        <div>

          <span className="dashboard-eyebrow">
            LEARNLY LMS
          </span>


          <h1>
            Welcome back 👋
          </h1>


          <p>
            Continue your learning
            journey and keep making
            progress.
          </p>

        </div>


        <Link
          to="/courses"
          className="browse-courses-button"
        >
          Browse Courses
        </Link>

      </section>


      {/* ====================================================
          ERROR
          ==================================================== */}

      {error && (

        <div className="dashboard-error">

          ⚠️ {error}

        </div>

      )}


      {/* ====================================================
          STAT CARDS
          ==================================================== */}

      <section className="dashboard-stats">


        {/* TOTAL COURSES */}

        <div className="stat-card">

          <div className="stat-icon purple">
            📚
          </div>


          <div>

            <span>
              Total Courses
            </span>

            <strong>
              {totalCourses}
            </strong>

          </div>

        </div>


        {/* IN PROGRESS */}

        <div className="stat-card">

          <div className="stat-icon blue">
            ▶
          </div>


          <div>

            <span>
              In Progress
            </span>

            <strong>
              {totalInProgress}
            </strong>

          </div>

        </div>


        {/* COMPLETED */}

        <div className="stat-card">

          <div className="stat-icon green">
            ✓
          </div>


          <div>

            <span>
              Completed
            </span>

            <strong>
              {totalCompleted}
            </strong>

          </div>

        </div>


        {/* LEARNING STREAK */}

        <div className="stat-card">

          <div className="stat-icon orange">
            🔥
          </div>


          <div>

            <span>
              Learning Streak
            </span>


            <strong>

              {safeLearningStreak}{" "}

              {safeLearningStreak === 1
                ? "day"
                : "days"}

            </strong>

          </div>

        </div>


      </section>


      {/* ====================================================
          CONTINUE LEARNING
          ==================================================== */}

      {continueCourse && (

        <section className="continue-section">

          <div className="section-heading">

            <div>

              <span>
                KEEP GOING
              </span>

              <h2>
                Continue Learning
              </h2>

            </div>

          </div>


          <div className="continue-card">

            <div className="continue-image">

              {continueCourse.image ? (

                <img
                  src={
                    continueCourse.image
                  }
                  alt={
                    continueCourse.name
                  }
                />

              ) : (

                <div className="course-image-placeholder">
                  📘
                </div>

              )}

            </div>


            <div className="continue-info">

              <span className="course-status">

                {continueCourse.percent >
                0
                  ? "IN PROGRESS"
                  : "NOT STARTED"}

              </span>


              <h2>
                {continueCourse.name}
              </h2>


              <p>

                {continueCourse.description ||
                  "Continue where you left off and keep learning."}

              </p>


              <div className="continue-progress">

                <div className="progress-label">

                  <span>
                    Course Progress
                  </span>

                  <strong>

                    {
                      continueCourse
                        .percent
                    }%

                  </strong>

                </div>


                <div className="progress-track">

                  <div
                    style={{
                      width:
                        `${continueCourse.percent}%`,
                    }}
                  />

                </div>

              </div>


              <button
                className="continue-button"
                onClick={() =>
                  continueLearning(
                    continueCourse.courseId
                  )
                }
              >

                {continueCourse.percent >
                0
                  ? "Continue Learning →"
                  : "Start Learning →"}

              </button>

            </div>

          </div>

        </section>

      )}


      {/* ====================================================
          MY LEARNING
          ==================================================== */}

      <section className="my-learning-section">

        <div className="section-heading">

          <div>

            <span>
              YOUR LEARNING
            </span>

            <h2>
              My Courses
            </h2>

          </div>


          <Link to="/courses">
            View All →
          </Link>

        </div>


        {learningCourses.length === 0 ? (

          <div className="empty-dashboard">

            <div>
              📚
            </div>

            <h3>
              No courses yet
            </h3>

            <p>
              Explore available courses
              and start learning.
            </p>


            <Link
              to="/courses"
              className="empty-dashboard-button"
            >
              Explore Courses
            </Link>

          </div>

        ) : (

          <div className="course-grid">

            {learningCourses
              .slice(0, 6)
              .map(
                (course) => (

                  <div
                    className="dashboard-course-card"
                    key={
                      course.courseId
                    }
                  >

                    <div className="dashboard-course-image">

                      {course.image ? (

                        <img
                          src={
                            course.image
                          }
                          alt={
                            course.name
                          }
                        />

                      ) : (

                        <div>
                          📘
                        </div>

                      )}

                    </div>


                    <div className="dashboard-course-body">

                      <span className="dashboard-course-percent">

                        {
                          course.percent
                        }%

                      </span>


                      <h3>
                        {course.name}
                      </h3>


                      <div className="small-progress">

                        <div
                          style={{
                            width:
                              `${course.percent}%`,
                          }}
                        />

                      </div>


                      <div className="dashboard-course-footer">

                        <span>

                          {course.percent >=
                          100
                            ? "Completed"
                            : course.percent >
                              0
                            ? "In Progress"
                            : "Not Started"}

                        </span>


                        <button
                          onClick={() =>
                            continueLearning(
                              course.courseId
                            )
                          }
                        >

                          {course.percent >=
                          100
                            ? "Review"
                            : "Open →"}

                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

          </div>

        )}

      </section>


      {/* ====================================================
          COMPLETED COURSES
          ==================================================== */}

      {completedCourses.length >
        0 && (

        <section className="completed-section">

          <div className="section-heading">

            <div>

              <span>
                ACHIEVEMENTS
              </span>

              <h2>
                Completed Courses 🎉
              </h2>

            </div>

          </div>


          <div className="completed-list">

            {completedCourses
              .slice(0, 4)
              .map(
                (course) => (

                  <div
                    className="completed-course"
                    key={
                      course.courseId
                    }
                  >

                    <div className="completed-course-icon">
                      ✓
                    </div>


                    <div>

                      <strong>
                        {course.name}
                      </strong>

                      <span>
                        Course completed
                      </span>

                    </div>


                    <button
                      onClick={() =>
                        continueLearning(
                          course.courseId
                        )
                      }
                    >
                      Review
                    </button>

                  </div>

                )
              )}

          </div>

        </section>

      )}


      {/* ====================================================
          QUICK ACTIONS
          ==================================================== */}

      <section className="quick-actions-section">

        <div className="section-heading">

          <div>

            <span>
              QUICK ACTIONS
            </span>

            <h2>
              Keep Learning
            </h2>

          </div>

        </div>


        <div className="quick-action-grid">


          <Link
            to="/courses"
            className="quick-action-card"
          >

            <div>
              📚
            </div>

            <strong>
              Explore Courses
            </strong>

            <span>
              Find something new to learn.
            </span>

          </Link>


          <Link
            to="/ai-tutor"
            className="quick-action-card"
          >

            <div>
              🤖
            </div>

            <strong>
              Ask AI Tutor
            </strong>

            <span>
              Get help with your studies.
            </span>

          </Link>


          <Link
            to="/my-learning"
            className="quick-action-card"
          >

            <div>
              📈
            </div>

            <strong>
              My Learning
            </strong>

            <span>
              Track your learning activity.
            </span>

          </Link>


        </div>

      </section>


      {/* ====================================================
          LEARNING ANALYTICS
          ==================================================== */}

      <DashboardAnalytics />


    </div>

  );

}
