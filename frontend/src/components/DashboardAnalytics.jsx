import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDashboardStats,
  getDashboardProgress,
  getQuizPerformance,
  getDashboardActivity,
} from "../services/dashboard";

import "../styles/DashboardAnalytics.css";


// ============================================================
// HELPERS
// ============================================================

function safeNumber(
  value,
  fallback = 0
) {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


function clampPercent(value) {

  return Math.min(
    100,
    Math.max(
      0,
      safeNumber(value)
    )
  );

}


function formatScore(value) {

  return `${Math.round(
    safeNumber(value)
  )}%`;

}


// ============================================================
// COMPONENT
// ============================================================

export default function DashboardAnalytics() {

  const [
    stats,
    setStats,
  ] = useState(null);


  const [
    progressData,
    setProgressData,
  ] = useState(null);


  const [
    quizData,
    setQuizData,
  ] = useState(null);


  const [
    activityData,
    setActivityData,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadAnalytics() {

      try {

        setLoading(true);
        setError("");


        const results =
          await Promise.allSettled([

            getDashboardStats(),

            getDashboardProgress(),

            getQuizPerformance(),

            getDashboardActivity(14),

          ]);


        if (cancelled) {
          return;
        }


        const [
          statsResult,
          progressResult,
          quizResult,
          activityResult,
        ] = results;


        if (
          statsResult.status ===
          "fulfilled"
        ) {

          setStats(
            statsResult.value || {}
          );

        }


        if (
          progressResult.status ===
          "fulfilled"
        ) {

          setProgressData(
            progressResult.value || {}
          );

        }


        if (
          quizResult.status ===
          "fulfilled"
        ) {

          setQuizData(
            quizResult.value || {}
          );

        }


        if (
          activityResult.status ===
          "fulfilled"
        ) {

          setActivityData(
            activityResult.value || {}
          );

        }


        const allFailed =
          results.every(
            (result) =>
              result.status ===
              "rejected"
          );


        if (allFailed) {

          throw new Error(
            "Unable to load learning analytics."
          );

        }

      } catch (err) {

        console.error(
          "Analytics error:",
          err
        );


        if (!cancelled) {

          setError(
            err.message ||
            "Unable to load analytics."
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadAnalytics();


    return () => {

      cancelled = true;

    };

  }, []);


  // ==========================================================
  // COURSE PROGRESS
  // ==========================================================

  const courseProgress =
    useMemo(() => {

      const courses =
        Array.isArray(
          progressData?.courses
        )
          ? progressData.courses
          : [];


      return courses.map(
        (course) => {

          const progress =
            clampPercent(
              course.progress_percent ??
              course.progress_percentage ??
              course.progress ??
              0
            );


          return {

            ...course,

            progress,

            title:
              course.course_title ||
              course.title ||
              course.course_name ||
              "Untitled Course",

          };

        }
      );

    }, [
      progressData,
    ]);


  // ==========================================================
  // QUIZ ATTEMPTS
  // ==========================================================

  const recentAttempts =
    useMemo(() => {

      return Array.isArray(
        quizData?.recent_attempts
      )
        ? quizData.recent_attempts
        : [];

    }, [
      quizData,
    ]);


  // ==========================================================
  // ACTIVITY
  // ==========================================================

  const activities =
    useMemo(() => {

      return Array.isArray(
        activityData?.activity
      )
        ? activityData.activity
        : [];

    }, [
      activityData,
    ]);


  // ==========================================================
  // ACTIVITY MAX
  // ==========================================================

  const activityMax =
    useMemo(() => {

      const values =
        activities.map(
          (item) =>
            safeNumber(
              item.activity_count
            )
        );


      return Math.max(
        1,
        ...values
      );

    }, [
      activities,
    ]);


  // ==========================================================
  // VALUES
  // ==========================================================

  const overallProgress =
    clampPercent(
      stats?.overall_progress ??
      stats?.progress_percent ??
      progressData?.overall_progress ??
      0
    );


  const averageQuizScore =
    clampPercent(
      quizData?.average_score ??
      stats?.average_quiz_score ??
      0
    );


  const highestQuizScore =
    clampPercent(
      quizData?.highest_score ??
      stats?.highest_quiz_score ??
      0
    );


  const learningStreak =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          stats?.learning_streak ??
          stats?.learning_streak_days ??
          stats?.streak ??
          0
        )
      )
    );


  const totalAttempts =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          quizData?.total_attempts ??
          stats?.total_quiz_attempts ??
          0
        )
      )
    );


  const passed =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          quizData?.passed ??
          stats?.passed_quizzes ??
          0
        )
      )
    );


  const failed =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          quizData?.failed ??
          stats?.failed_quizzes ??
          0
        )
      )
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <section className="analytics-section">

        <div className="analytics-heading">

          <span className="section-eyebrow">
            LEARNING ANALYTICS
          </span>

          <h2>
            Your learning performance
          </h2>

        </div>


        <div className="analytics-loading">

          <div className="analytics-spinner" />

          <span>
            Loading analytics...
          </span>

        </div>

      </section>

    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section className="analytics-section">


      {/* ====================================================
          HEADER
          ==================================================== */}

      <div className="analytics-heading">

        <div>

          <span className="section-eyebrow">
            LEARNING ANALYTICS
          </span>

          <h2>
            Your learning performance
          </h2>

          <p>
            Track your progress, quiz results,
            and learning activity.
          </p>

        </div>

      </div>


      {/* ====================================================
          ERROR
          ==================================================== */}

      {error && (

        <div className="analytics-error">
          ⚠️ {error}
        </div>

      )}


      {/* ====================================================
          SUMMARY CARDS
          ==================================================== */}

      <div className="analytics-summary-grid">


        {/* OVERALL */}

        <div className="analytics-card">

          <div className="analytics-card-top">

            <span className="analytics-icon">
              📈
            </span>

            <span className="analytics-label">
              Overall Progress
            </span>

          </div>


          <div className="analytics-big-value">

            {Math.round(
              overallProgress
            )}%

          </div>


          <div className="analytics-progress-track">

            <div
              className="analytics-progress-fill"
              style={{
                width:
                  `${overallProgress}%`,
              }}
            />

          </div>


          <span className="analytics-muted">
            Across your enrolled courses
          </span>

        </div>


        {/* QUIZ */}

        <div className="analytics-card">

          <div className="analytics-card-top">

            <span className="analytics-icon">
              📝
            </span>

            <span className="analytics-label">
              Average Quiz Score
            </span>

          </div>


          <div className="analytics-big-value">

            {formatScore(
              averageQuizScore
            )}

          </div>


          <div className="analytics-progress-track">

            <div
              className="analytics-progress-fill"
              style={{
                width:
                  `${averageQuizScore}%`,
              }}
            />

          </div>


          <span className="analytics-muted">

            {totalAttempts}{" "}
            quiz{" "}
            {totalAttempts === 1
              ? "attempt"
              : "attempts"}

          </span>

        </div>


        {/* STREAK */}

        <div className="analytics-card">

          <div className="analytics-card-top">

            <span className="analytics-icon">
              🔥
            </span>

            <span className="analytics-label">
              Learning Streak
            </span>

          </div>


          <div className="analytics-big-value">

            {learningStreak}

            <span className="analytics-unit">
              {" "}days
            </span>

          </div>


          <span className="analytics-status">

            {stats?.today_active
              ? "✓ Learning today"
              : "Start learning today"}

          </span>


          <span className="analytics-muted">
            Keep your momentum going
          </span>

        </div>

      </div>


      {/* ====================================================
          MAIN ANALYTICS
          ==================================================== */}

      <div className="analytics-main-grid">


        {/* ==================================================
            COURSE PROGRESS
            ================================================== */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">

            <div>

              <span className="analytics-panel-eyebrow">
                COURSES
              </span>

              <h3>
                Course Progress
              </h3>

            </div>


            <span className="analytics-panel-count">
              {courseProgress.length}
            </span>

          </div>


          {courseProgress.length === 0 ? (

            <div className="analytics-empty">

              <div>
                📚
              </div>

              <h4>
                No course progress yet
              </h4>

              <p>
                Enroll in a course to start
                tracking your progress.
              </p>

            </div>

          ) : (

            <div className="course-progress-list">

              {courseProgress
                .slice(0, 8)
                .map(
                  (
                    course,
                    index
                  ) => (

                    <div
                      className="course-progress-row"
                      key={
                        course.course_id ||
                        course.id ||
                        index
                      }
                    >

                      <div className="course-progress-info">

                        <div className="course-progress-title">

                          {course.title}

                        </div>


                        <span
                          className={
                            course.progress >= 100
                              ? "progress-status completed"
                              : course.progress > 0
                              ? "progress-status active"
                              : "progress-status not-started"
                          }
                        >

                          {course.progress >=
                          100
                            ? "Completed"
                            : course.progress > 0
                            ? "In progress"
                            : "Not started"}

                        </span>

                      </div>


                      <div className="course-progress-bar-area">

                        <div className="analytics-progress-track">

                          <div
                            className="analytics-progress-fill"
                            style={{
                              width:
                                `${course.progress}%`,
                            }}
                          />

                        </div>

                      </div>


                      <strong className="course-progress-percent">

                        {Math.round(
                          course.progress
                        )}%

                      </strong>

                    </div>

                  )
                )}

            </div>

          )}

        </div>


        {/* ==================================================
            QUIZ PERFORMANCE
            ================================================== */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">

            <div>

              <span className="analytics-panel-eyebrow">
                QUIZZES
              </span>

              <h3>
                Quiz Performance
              </h3>

            </div>


            <span className="analytics-panel-score">

              {formatScore(
                highestQuizScore
              )}

            </span>

          </div>


          <div className="quiz-performance-summary">


            {/* SCORE CIRCLE */}

            <div
              className="quiz-score-circle"
              style={{
                "--quiz-progress":
                  `${averageQuizScore}%`,
              }}
            >

              <div>

                <strong>

                  {Math.round(
                    averageQuizScore
                  )}%

                </strong>

                <span>
                  Average
                </span>

              </div>

            </div>


            {/* QUIZ STATS */}

            <div className="quiz-stat-list">

              <div className="quiz-stat">

                <span>
                  Attempts
                </span>

                <strong>
                  {totalAttempts}
                </strong>

              </div>


              <div className="quiz-stat">

                <span>
                  Passed
                </span>

                <strong>
                  {passed}
                </strong>

              </div>


              <div className="quiz-stat">

                <span>
                  Failed
                </span>

                <strong>
                  {failed}
                </strong>

              </div>


              <div className="quiz-stat">

                <span>
                  Highest
                </span>

                <strong>
                  {formatScore(
                    highestQuizScore
                  )}
                </strong>

              </div>

            </div>

          </div>


          {/* RECENT ATTEMPTS */}

          {recentAttempts.length > 0 && (

            <div className="recent-quiz-list">

              <div className="recent-quiz-heading">
                Recent Attempts
              </div>


              {recentAttempts
                .slice(0, 5)
                .map(
                  (
                    attempt,
                    index
                  ) => {

                    const score =
                      clampPercent(
                        attempt.score
                      );


                    return (

                      <div
                        className="recent-quiz-row"
                        key={
                          attempt.attempt_id ||
                          index
                        }
                      >

                        <div>

                          <strong>

                            {
                              attempt.quiz_title ||
                              "Quiz"
                            }

                          </strong>


                          <span>

                            {
                              attempt.correct_answers ??
                              0
                            }
                            /
                            {
                              attempt.total_questions ??
                              0
                            }{" "}
                            correct

                          </span>

                        </div>


                        <strong className="recent-quiz-score">

                          {Math.round(
                            score
                          )}%

                        </strong>

                      </div>

                    );

                  }
                )}

            </div>

          )}

        </div>

      </div>


      {/* ====================================================
          LEARNING ACTIVITY
          ==================================================== */}

      <div className="analytics-panel analytics-activity-panel">

        <div className="analytics-panel-header">

          <div>

            <span className="analytics-panel-eyebrow">
              ACTIVITY
            </span>

            <h3>
              Learning Activity
            </h3>

          </div>


          <span className="analytics-muted">

            Last {activityData?.days ?? 14} days

          </span>

        </div>


        {activities.length === 0 ? (

          <div className="analytics-empty">

            <div>
              📊
            </div>

            <h4>
              No learning activity yet
            </h4>

            <p>
              Your learning activity will appear
              here as you use Learnly.
            </p>

          </div>

        ) : (

          <div className="activity-chart">

            {activities.map(
              (
                item,
                index
              ) => {

                const count =
                  safeNumber(
                    item.activity_count
                  );


                const height =
                  count === 0
                    ? 4
                    : Math.max(
                        10,
                        (
                          count /
                          activityMax
                        ) * 100
                      );


                let label =
                  item.day ||
                  "";


                if (
                  item.date
                ) {

                  const date =
                    new Date(
                      `${item.date}T00:00:00`
                    );


                  if (
                    !Number.isNaN(
                      date.getTime()
                    )
                  ) {

                    label =
                      date.toLocaleDateString(
                        undefined,
                        {
                          weekday:
                            "short",
                        }
                      );

                  }

                }


                return (

                  <div
                    className="activity-column"
                    key={
                      item.date ||
                      index
                    }
                  >

                    <div className="activity-value">

                      {count > 0
                        ? count
                        : ""}

                    </div>


                    <div className="activity-bar-area">

                      <div
                        className={
                          count > 0
                            ? "activity-bar active"
                            : "activity-bar"
                        }
                        style={{
                          height:
                            `${height}%`,
                        }}
                        title={`${count} learning ${count === 1 ? "activity" : "activities"}`}
                      />

                    </div>


                    <span className="activity-day">

                      {label}

                    </span>

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>


    </section>

  );

}
