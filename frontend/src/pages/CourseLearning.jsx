import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getCourseContent,
  getCourseProgress,
} from "../services/learning";

import "../styles/CourseLearning.css";


export default function CourseLearning() {

  const {
    courseId,
  } = useParams();


  const navigate =
    useNavigate();


  const [
    modules,
    setModules,
  ] = useState([]);


  const [
    progress,
    setProgress,
  ] = useState({
    completed_lectures: 0,
    total_lectures: 0,
    progress_percent: 0,
    completed_lecture_ids: [],
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    expandedModules,
    setExpandedModules,
  ] = useState({});


  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function load() {

      try {

        setLoading(true);
        setError("");


        const [
          content,
          courseProgress,
        ] = await Promise.all([
          getCourseContent(
            courseId
          ),

          getCourseProgress(
            courseId
          ),
        ]);


        if (cancelled) {
          return;
        }


        setModules(
          Array.isArray(content)
            ? content
            : []
        );


        setProgress(
          courseProgress || {
            completed_lectures: 0,
            total_lectures: 0,
            progress_percent: 0,
            completed_lecture_ids: [],
          }
        );


        // Expand first module
        if (
          Array.isArray(content) &&
          content.length > 0
        ) {

          setExpandedModules({
            [content[0].id]: true,
          });

        }

      } catch (err) {

        if (!cancelled) {

          console.error(
            err
          );

          setError(
            err.message ||
            "Unable to load course."
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    }


    if (courseId) {
      load();
    }


    return () => {
      cancelled = true;
    };

  }, [courseId]);


  // ==========================================================
  // HELPERS
  // ==========================================================

  function toggleModule(
    moduleId
  ) {

    setExpandedModules(
      (current) => ({
        ...current,

        [moduleId]:
          !current[moduleId],
      })
    );

  }


  function openLecture(
    lectureId
  ) {

    navigate(
      `/lecture/${lectureId}`
    );

  }


  // ==========================================================
  // TOTAL LECTURES
  // ==========================================================

  const totalLectures =
    modules.reduce(
      (
        total,
        module
      ) =>
        total +
        (
          module.lectures?.length ||
          0
        ),
      0
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="learning-loading">

        <div className="learning-spinner"></div>

        <p>
          Loading your course...
        </p>

      </div>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (

      <div className="learning-error">

        <h2>
          Unable to load course
        </h2>

        <p>
          {error}
        </p>

        <button
          onClick={() =>
            window.location.reload()
          }
        >
          Try Again
        </button>

      </div>

    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="course-learning-page">

      {/* ====================================================
          TOP BAR
          ==================================================== */}

      <header className="learning-topbar">

        <Link
          to="/courses"
          className="back-course-link"
        >
          ← Back to Courses
        </Link>


        <div className="learning-progress-mini">

          <span>
            {progress.completed_lectures}
            {" / "}
            {progress.total_lectures ||
              totalLectures}
            {" "}completed
          </span>


          <div className="mini-progress">

            <div
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    progress.progress_percent ||
                    0
                  )
                )}%`,
              }}
            />

          </div>

        </div>

      </header>


      {/* ====================================================
          MAIN
          ==================================================== */}

      <main className="course-learning-content">

        <div className="learning-heading">

          <div>

            <span className="learning-label">
              YOUR COURSE
            </span>

            <h1>
              Continue Learning
            </h1>

            <p>
              Select a lecture to
              continue your learning.
            </p>

          </div>


          <div className="overall-progress">

            <div className="progress-circle">

              {Math.round(
                progress.progress_percent ||
                0
              )}
              %

            </div>


            <div>

              <strong>
                Course Progress
              </strong>

              <span>
                {progress.completed_lectures}
                {" of "}
                {progress.total_lectures ||
                  totalLectures}
                {" lectures"}
              </span>

            </div>

          </div>

        </div>


        {/* ==================================================
            COMPLETED
            ================================================== */}

        {(
          progress.progress_percent >= 100
        ) && (

          <div className="course-complete-banner">

            <div className="complete-icon">
              🎉
            </div>

            <div>

              <h2>
                Course Completed!
              </h2>

              <p>
                Congratulations! You have
                completed all lectures.
              </p>

            </div>

          </div>

        )}


        {/* ==================================================
            MODULES
            ================================================== */}

        <section className="learning-modules">

          {modules.length === 0 ? (

            <div className="empty-learning">

              <div>
                📚
              </div>

              <h2>
                No lectures available
              </h2>

              <p>
                This course does not have
                any lectures yet.
              </p>

            </div>

          ) : (

            modules.map(
              (
                module,
                moduleIndex
              ) => {

                const lectures =
                  module.lectures ||
                  [];


                const completedInModule =
                  lectures.filter(
                    (lecture) =>
                      progress
                        .completed_lecture_ids
                        ?.includes(
                          String(
                            lecture.id
                          )
                        )
                  ).length;


                const isExpanded =
                  expandedModules[
                    module.id
                  ];


                return (

                  <div
                    className="learning-module"
                    key={module.id}
                  >

                    {/* MODULE HEADER */}

                    <button
                      className="module-header"
                      onClick={() =>
                        toggleModule(
                          module.id
                        )
                      }
                    >

                      <div className="module-number">

                        {moduleIndex + 1}

                      </div>


                      <div className="module-info">

                        <span>
                          MODULE{" "}
                          {moduleIndex + 1}
                        </span>

                        <h2>
                          {module.title}
                        </h2>

                        <p>

                          {completedInModule}
                          {" / "}
                          {lectures.length}
                          {" lectures completed"}

                        </p>

                      </div>


                      <div className="module-arrow">

                        {isExpanded
                          ? "⌃"
                          : "⌄"}

                      </div>

                    </button>


                    {/* LECTURES */}

                    {isExpanded && (

                      <div className="module-lectures">

                        {lectures.map(
                          (
                            lecture,
                            lectureIndex
                          ) => {

                            const completed =
                              progress
                                .completed_lecture_ids
                                ?.includes(
                                  String(
                                    lecture.id
                                  )
                                );


                            return (

                              <button
                                key={
                                  lecture.id
                                }
                                className={
                                  completed
                                    ? "lecture-row completed"
                                    : "lecture-row"
                                }
                                onClick={() =>
                                  openLecture(
                                    lecture.id
                                  )
                                }
                              >

                                <div className="lecture-status">

                                  {completed
                                    ? "✓"
                                    : lectureIndex +
                                      1}

                                </div>


                                <div className="lecture-info">

                                  <strong>
                                    {
                                      lecture.title
                                    }
                                  </strong>


                                  {lecture.description && (

                                    <span>
                                      {
                                        lecture.description
                                      }
                                    </span>

                                  )}

                                </div>


                                <div className="lecture-duration">

                                  {lecture.duration_seconds
                                    ? `${Math.ceil(
                                        lecture.duration_seconds /
                                          60
                                      )} min`
                                    : ""}

                                </div>


                                <div className="lecture-open">

                                  →

                                </div>

                              </button>

                            );

                          }
                        )}

                      </div>

                    )}

                  </div>

                );

              }
            )

          )}

        </section>

      </main>

    </div>

  );

}
