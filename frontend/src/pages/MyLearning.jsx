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
  getDashboardCourses,
  getMyEnrollments,
  getDashboardCourseProgress,
  getId,
  getCourseName,
  getCourseImage,
  getProgressPercent,
} from "../services/dashboard";

import "../styles/MyLearning.css";


export default function MyLearning() {

  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [courses, setCourses] = useState([]);

  const [enrollments, setEnrollments] = useState([]);

  const [progressMap, setProgressMap] = useState({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ==========================================================
  // LOAD MY LEARNING
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadMyLearning() {

      try {

        setLoading(true);
        setError("");


        const results =
          await Promise.allSettled([
            getDashboardCourses(),
            getMyEnrollments(),
          ]);


        if (cancelled) {
          return;
        }


        const coursesResult =
          results[0];

        const enrollmentsResult =
          results[1];


        const loadedCourses =
          coursesResult.status === "fulfilled"
            ? coursesResult.value
            : [];


        const loadedEnrollments =
          enrollmentsResult.status === "fulfilled"
            ? enrollmentsResult.value
            : [];


        setCourses(
          Array.isArray(loadedCourses)
            ? loadedCourses
            : []
        );


        setEnrollments(
          Array.isArray(loadedEnrollments)
            ? loadedEnrollments
            : []
        );


        // ======================================================
        // FIND ENROLLED COURSE IDS
        // ======================================================

        const enrolledIds =
          loadedEnrollments
            .map(
              (enrollment) =>
                enrollment.course_id ??
                enrollment.courseId ??
                enrollment.course?.id
            )
            .filter(Boolean);


        const uniqueIds = [
          ...new Set(
            enrolledIds.map(
              (id) => String(id)
            )
          ),
        ];


        // ======================================================
        // LOAD PROGRESS
        // ======================================================

        if (uniqueIds.length > 0) {

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


          setProgressMap(map);

        }

      } catch (err) {

        console.error(
          "My Learning error:",
          err
        );


        if (!cancelled) {

          setError(
            err.message ||
            "Unable to load your learning."
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    loadMyLearning();


    return () => {
      cancelled = true;
    };

  }, []);


  // ==========================================================
  // MATCH ENROLLED COURSES
  // ==========================================================

  const learningCourses =
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


          const course =
            matchingCourse ||
            enrollment.course;


          if (!course) {
            return;
          }


          const progress =
            progressMap[
              String(courseId)
            ] || {};


          const percent =
            getProgressPercent(
              progress
            );


          result.push({

            ...course,

            courseId,

            name:
              getCourseName(
                course
              ),

            image:
              getCourseImage(
                course
              ),

            percent,

            progress,

            enrollment,

          });

        }
      );


      return result;

    }, [
      courses,
      enrollments,
      progressMap,
    ]);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const completedCourses =
    learningCourses.filter(
      (course) =>
        course.percent >= 100
    );


  const inProgressCourses =
    learningCourses.filter(
      (course) =>
        course.percent > 0 &&
        course.percent < 100
    );


  const notStartedCourses =
    learningCourses.filter(
      (course) =>
        course.percent <= 0
    );


  const overallProgress =
    learningCourses.length > 0
      ? Math.round(
          learningCourses.reduce(
            (sum, course) =>
              sum + course.percent,
            0
          ) /
          learningCourses.length
        )
      : 0;


  // ==========================================================
  // CONTINUE LEARNING
  // ==========================================================

  function openCourse(courseId) {

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

      <div className="my-learning-loading">

        <div className="my-learning-spinner"></div>

        <p>
          Loading your learning...
        </p>

      </div>

    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="my-learning-page">


      {/* ====================================================
          HEADER
          ==================================================== */}

      <section className="my-learning-header">

        <div>

          <span className="my-learning-eyebrow">
            YOUR LEARNING
          </span>


          <h1>
            My Learning
          </h1>


          <p>
            Track your courses, progress,
            and continue learning where
            you left off.
          </p>

        </div>


        <Link
          to="/courses"
          className="my-learning-browse-button"
        >
          Explore Courses →
        </Link>

      </section>


      {/* ====================================================
          ERROR
          ==================================================== */}

      {error && (

        <div className="my-learning-error">
          ⚠️ {error}
        </div>

      )}


      {/* ====================================================
          SUMMARY
          ==================================================== */}

      <section className="my-learning-summary">


        <div className="learning-summary-card">

          <span>
            Enrolled Courses
          </span>

          <strong>
            {learningCourses.length}
          </strong>

          <small>
            Courses you're taking
          </small>

        </div>


        <div className="learning-summary-card">

          <span>
            In Progress
          </span>

          <strong>
            {inProgressCourses.length}
          </strong>

          <small>
            Keep going
          </small>

        </div>


        <div className="learning-summary-card">

          <span>
            Completed
          </span>

          <strong>
            {completedCourses.length}
          </strong>

          <small>
            Great work
          </small>

        </div>


        <div className="learning-summary-card">

          <span>
            Overall Progress
          </span>

          <strong>
            {overallProgress}%
          </strong>

          <small>
            Across your courses
          </small>

        </div>


      </section>


      {/* ====================================================
          EMPTY STATE
          ==================================================== */}

      {learningCourses.length === 0 ? (

        <section className="my-learning-empty">

          <div className="empty-icon">
            📚
          </div>


          <h2>
            You haven't enrolled in any courses yet
          </h2>


          <p>
            Explore our available courses
            and start your learning journey.
          </p>


          <Link
            to="/courses"
            className="empty-browse-button"
          >
            Browse Courses →
          </Link>

        </section>

      ) : (

        <>

          {/* ==================================================
              OVERALL PROGRESS
              ================================================== */}

          <section className="overall-progress-card">

            <div className="overall-progress-top">

              <div>

                <span>
                  OVERALL LEARNING PROGRESS
                </span>

                <h2>
                  Keep building your skills 🚀
                </h2>

              </div>


              <strong>
                {overallProgress}%
              </strong>

            </div>


            <div className="overall-progress-track">

              <div
                style={{
                  width:
                    `${overallProgress}%`,
                }}
              />

            </div>


            <p>
              {completedCourses.length} of{" "}
              {learningCourses.length}{" "}
              courses completed.
            </p>

          </section>


          {/* ==================================================
              IN PROGRESS
              ================================================== */}

          {inProgressCourses.length >
            0 && (

            <section className="learning-section">

              <div className="learning-section-heading">

                <div>

                  <span>
                    KEEP GOING
                  </span>

                  <h2>
                    Continue Learning
                  </h2>

                </div>

              </div>


              <div className="learning-course-grid">

                {inProgressCourses.map(
                  (course) => (

                    <CourseCard
                      key={
                        course.courseId
                      }
                      course={course}
                      onOpen={
                        openCourse
                      }
                    />

                  )
                )}

              </div>

            </section>

          )}


          {/* ==================================================
              NOT STARTED
              ================================================== */}

          {notStartedCourses.length >
            0 && (

            <section className="learning-section">

              <div className="learning-section-heading">

                <div>

                  <span>
                    START LEARNING
                  </span>

                  <h2>
                    Ready to Begin
                  </h2>

                </div>

              </div>


              <div className="learning-course-grid">

                {notStartedCourses.map(
                  (course) => (

                    <CourseCard
                      key={
                        course.courseId
                      }
                      course={course}
                      onOpen={
                        openCourse
                      }
                    />

                  )
                )}

              </div>

            </section>

          )}


          {/* ==================================================
              COMPLETED
              ================================================== */}

          {completedCourses.length >
            0 && (

            <section className="learning-section">

              <div className="learning-section-heading">

                <div>

                  <span>
                    ACHIEVEMENTS
                  </span>

                  <h2>
                    Completed Courses 🎉
                  </h2>

                </div>

              </div>


              <div className="learning-course-grid">

                {completedCourses.map(
                  (course) => (

                    <CourseCard
                      key={
                        course.courseId
                      }
                      course={course}
                      onOpen={
                        openCourse
                      }
                    />

                  )
                )}

              </div>

            </section>

          )}

        </>

      )}

    </div>

  );

}


// ============================================================
// COURSE CARD
// ============================================================

function CourseCard({
  course,
  onOpen,
}) {

  const status =
    course.percent >= 100
      ? "Completed"
      : course.percent > 0
        ? "In Progress"
        : "Not Started";


  const buttonText =
    course.percent >= 100
      ? "Review Course →"
      : course.percent > 0
        ? "Continue Learning →"
        : "Start Learning →";


  return (

    <article className="learning-course-card">


      {/* ======================================================
          IMAGE
          ====================================================== */}

      <div className="learning-course-image">

        {course.image ? (

          <img
            src={course.image}
            alt={course.name}
          />

        ) : (

          <div className="learning-image-placeholder">
            📘
          </div>

        )}

      </div>


      {/* ======================================================
          BODY
          ====================================================== */}

      <div className="learning-course-body">


        <div className="learning-course-status-row">

          <span
            className={
              course.percent >= 100
                ? "status-completed"
                : course.percent > 0
                  ? "status-progress"
                  : "status-start"
            }
          >
            {status}
          </span>


          <strong>
            {course.percent}%
          </strong>

        </div>


        <h3>
          {course.name}
        </h3>


        {course.description && (

          <p>
            {course.description}
          </p>

        )}


        {/* ====================================================
            PROGRESS
            ==================================================== */}

        <div className="learning-progress">

          <div className="learning-progress-track">

            <div
              style={{
                width:
                  `${course.percent}%`,
              }}
            />

          </div>

        </div>


        {/* ====================================================
            FOOTER
            ==================================================== */}

        <div className="learning-course-footer">

          <span>
            {course.percent >= 100
              ? "Course completed"
              : `${course.percent}% completed`}
          </span>


          <button
            onClick={() =>
              onOpen(
                course.courseId
              )
            }
          >
            {buttonText}
          </button>

        </div>

      </div>

    </article>

  );

}
