import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  getLecture,
  completeLecture,
} from "../services/learning";

import {
  recordLearningActivity,
} from "../services/dashboard";

import "../styles/LecturePlayer.css";


// ============================================================
// YOUTUBE URL HELPER
// ============================================================

function getYouTubeVideoId(url) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    // youtube.com/watch?v=VIDEO_ID
    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.searchParams.get("v")
    ) {
      return parsedUrl.searchParams.get("v");
    }

    // youtube.com/embed/VIDEO_ID
    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.pathname.startsWith("/embed/")
    ) {
      return parsedUrl.pathname
        .replace("/embed/", "")
        .split("/")[0];
    }

    // youtube.com/shorts/VIDEO_ID
    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.pathname.startsWith("/shorts/")
    ) {
      return parsedUrl.pathname
        .replace("/shorts/", "")
        .split("/")[0];
    }

    // youtu.be/VIDEO_ID
    if (
      parsedUrl.hostname === "youtu.be"
    ) {
      return parsedUrl.pathname
        .replace("/", "")
        .split("/")[0];
    }

    return null;
  } catch {
    return null;
  }
}


// ============================================================
// LECTURE PLAYER
// ============================================================

export default function LecturePlayer() {

  const {
    courseId,
    lectureId,
  } = useParams();


  const navigate = useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    data,
    setData,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    completing,
    setCompleting,
  ] = useState(false);


  const [
    completed,
    setCompleted,
  ] = useState(false);


  // ==========================================================
  // LOAD LECTURE
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadLecture() {

      try {

        setLoading(true);
        setError("");


        const result =
          await getLecture(
            lectureId
          );


        if (cancelled) {
          return;
        }


        setData(result);


        setCompleted(
          Boolean(
            result?.completed
          )
        );

      } catch (err) {

        if (!cancelled) {

          console.error(
            "Lecture loading error:",
            err
          );


          setError(
            err?.message ||
            "Unable to load lecture."
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    if (lectureId) {

      loadLecture();

    } else {

      setLoading(false);

      setError(
        "Lecture ID is missing."
      );

    }


    return () => {

      cancelled = true;

    };

  }, [lectureId]);


  // ==========================================================
  // MARK LECTURE COMPLETE
  // ==========================================================

  async function handleComplete() {

    if (
      completing ||
      completed ||
      !lectureId
    ) {
      return;
    }


    try {

      setCompleting(true);


      // ------------------------------------------------------
      // 1. MARK LECTURE AS COMPLETED
      // ------------------------------------------------------

      await completeLecture(
        lectureId
      );


      // ------------------------------------------------------
      // 2. RECORD LEARNING ACTIVITY
      // ------------------------------------------------------
      // This is what powers the Learning Streak.
      //
      // Example:
      // Student completes a lecture today
      //        ↓
      // LearningActivity is saved
      //        ↓
      // /dashboard/streak calculates the streak
      // ------------------------------------------------------

      try {

        await recordLearningActivity({
          activityType:
            "lecture_learning",

          courseId:
            courseId || null,
        });

      } catch (activityError) {

        // Do not undo lecture completion
        // if activity tracking fails.

        console.error(
          "Learning activity recording error:",
          activityError
        );

      }


      // ------------------------------------------------------
      // 3. UPDATE UI
      // ------------------------------------------------------

      setCompleted(true);


    } catch (err) {

      console.error(
        "Complete lecture error:",
        err
      );


      alert(
        err?.message ||
        "Unable to mark lecture as complete."
      );


    } finally {

      setCompleting(false);

    }

  }


  // ==========================================================
  // NEXT LECTURE
  // ==========================================================

  function goNext() {

    const next =
      data?.navigation?.next;


    if (!next) {
      return;
    }


    const nextLectureId =
      next.lecture_id ||
      next.id;


    if (!nextLectureId) {
      return;
    }


    navigate(
      `/courses/${courseId}/lectures/${nextLectureId}`
    );

  }


  // ==========================================================
  // PREVIOUS LECTURE
  // ==========================================================

  function goPrevious() {

    const previous =
      data?.navigation?.previous;


    if (!previous) {
      return;
    }


    const previousLectureId =
      previous.lecture_id ||
      previous.id;


    if (!previousLectureId) {
      return;
    }


    navigate(
      `/courses/${courseId}/lectures/${previousLectureId}`
    );

  }


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {

    return (

      <div className="lecture-loading">

        <div className="lecture-spinner"></div>

        <p>
          Loading lecture...
        </p>

      </div>

    );

  }


  // ==========================================================
  // ERROR SCREEN
  // ==========================================================

  if (error) {

    return (

      <div className="lecture-error">

        <h2>
          Unable to load lecture
        </h2>


        <p>
          {error}
        </p>


        <Link to="/courses">
          ← Back to Courses
        </Link>

      </div>

    );

  }


  if (!data) {

    return (

      <div className="lecture-error">

        <h2>
          Lecture not found
        </h2>


        <Link to="/courses">
          ← Back to Courses
        </Link>

      </div>

    );

  }


  // ==========================================================
  // DATA
  // ==========================================================

  const lecture =
    data.lecture || {};


  const course =
    data.course || {};


  const module =
    data.module || {};


  const navigation =
    data.navigation || {};


  const resources =
    lecture.mit_resources ||
    lecture.resources ||
    [];


  // ==========================================================
  // VIDEO URL
  // ==========================================================

  const videoUrl =
    lecture.youtube_url ||
    lecture.video_url ||
    lecture.videoUrl ||
    "";


  const youtubeVideoId =
    getYouTubeVideoId(
      videoUrl
    );


  // ==========================================================
  // YOUTUBE EMBED URL
  // ==========================================================

  const youtubeEmbedUrl =
    youtubeVideoId
      ? `https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`
      : null;


  // ==========================================================
  // COURSE ID FALLBACK
  // ==========================================================

  const currentCourseId =
    course.id ||
    course.course_id ||
    courseId;


  // ==========================================================
  // COURSE PROGRESS
  // ==========================================================

  const courseProgress =
    Number(
      data.course_progress ??
      data.progress ??
      course.progress ??
      0
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="lecture-player-page">


      {/* ======================================================
          TOP BAR
          ====================================================== */}

      <header className="lecture-topbar">

        <Link
          to={`/courses/${currentCourseId}/learn`}
          className="lecture-back"
        >
          ← Back to Course
        </Link>


        <div className="lecture-course-name">

          {course.title ||
            course.name ||
            "Course"}

        </div>

      </header>


      {/* ======================================================
          MAIN LAYOUT
          ====================================================== */}

      <div className="lecture-layout">


        {/* ====================================================
            SIDEBAR
            ==================================================== */}

        <aside className="lecture-sidebar">

          <div className="sidebar-label">
            CURRENT MODULE
          </div>


          <h2>

            {module.title ||
              module.name ||
              "Module"}

          </h2>


          <div className="lecture-position">

            Lecture{" "}

            {navigation.current ??
              navigation.current_lecture ??
              1}

            {" / "}

            {navigation.total ??
              navigation.total_lectures ??
              1}

          </div>


          <div
            className={
              completed
                ? "sidebar-status completed"
                : "sidebar-status"
            }
          >

            {completed
              ? "✓ Completed"
              : "○ In Progress"}

          </div>

        </aside>


        {/* ====================================================
            MAIN CONTENT
            ==================================================== */}

        <main className="lecture-main">


          {/* ==================================================
              VIDEO PLAYER
              ================================================== */}

          <section
            className="video-section"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "24px 0 32px",
            }}
          >


            {youtubeEmbedUrl ? (

              <div
                className="youtube-video-wrapper"
                style={{
                  width: "100%",
                  maxWidth: "1100px",
                  margin: "0 auto",
                  aspectRatio: "16 / 9",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "16px",
                }}
              >

                <iframe
                  className="lecture-youtube-video"
                  src={youtubeEmbedUrl}
                  title={
                    lecture.title ||
                    "Learnly Lecture"
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    minHeight: "520px",
                    border: "0",
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />

              </div>

            ) : videoUrl ? (

              <video
                className="lecture-video"
                controls
                preload="metadata"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "1100px",
                  height: "auto",
                  minHeight: "520px",
                  margin: "0 auto",
                  borderRadius: "16px",
                  objectFit: "contain",
                }}
              >

                <source
                  src={videoUrl}
                />

                Your browser does not
                support video playback.

              </video>

            ) : (

              <div
                className="video-placeholder"
                style={{
                  width: "100%",
                  maxWidth: "1100px",
                  minHeight: "520px",
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >

                <div className="video-placeholder-icon">
                  ▶
                </div>


                <h2>
                  Lecture video coming soon
                </h2>


                <p>
                  This lecture currently
                  does not have a video.
                </p>

              </div>

            )}

          </section>


          {/* ==================================================
              LECTURE TITLE
              ================================================== */}

          <section className="lecture-title-section">

            <div>

              <span className="lecture-module-label">

                {module.title ||
                  module.name ||
                  "Module"}

              </span>


              <h1>

                {lecture.title ||
                  "Lecture"}

              </h1>


              {lecture.description && (

                <p>
                  {lecture.description}
                </p>

              )}

            </div>


            {/* COMPLETE BUTTON */}

            <div className="lecture-complete-box">

              {completed ? (

                <div className="completed-label">

                  ✓ Completed

                </div>

              ) : (

                <button
                  className="complete-button"
                  onClick={
                    handleComplete
                  }
                  disabled={
                    completing
                  }
                >

                  {completing
                    ? "Saving..."
                    : "✓ Mark as Complete"}

                </button>

              )}

            </div>

          </section>


          {/* ==================================================
              COURSE PROGRESS
              ================================================== */}

          <section className="lecture-progress-card">

            <div className="lecture-progress-header">

              <span>
                Course progress
              </span>


              <strong>
                {Math.min(
                  100,
                  Math.max(
                    0,
                    courseProgress
                  )
                )}
                %
              </strong>

            </div>


            <div className="lecture-progress-track">

              <div
                className="lecture-progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      courseProgress
                    )
                  )}%`,
                }}
              />

            </div>

          </section>


          {/* ==================================================
              TRANSCRIPT / NOTES
              ================================================== */}

          {lecture.transcript && (

            <section className="lecture-content-card">

              <div className="content-card-header">

                <span>
                  📄
                </span>


                <h2>
                  Lecture Transcript
                </h2>

              </div>


              <div className="transcript-content">

                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm,
                  ]}
                >

                  {lecture.transcript}

                </ReactMarkdown>

              </div>

            </section>

          )}


          {/* ==================================================
              RESOURCES
              ================================================== */}

          {resources.length > 0 && (

            <section className="lecture-content-card">

              <div className="content-card-header">

                <span>
                  📚
                </span>


                <h2>
                  Notes & Resources
                </h2>

              </div>


              <div className="resource-list">

                {resources.map(
                  (
                    resource,
                    index
                  ) => {

                    const resourceUrl =
                      resource.url ||
                      resource.link ||
                      resource.resource_url;


                    if (!resourceUrl) {
                      return null;
                    }


                    return (

                      <a
                        key={
                          resource.id ||
                          index
                        }
                        href={
                          resourceUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="resource-item"
                      >

                        <div className="resource-icon">
                          📄
                        </div>


                        <div>

                          <strong>

                            {resource.title ||
                              resource.name ||
                              `Resource ${index + 1}`}

                          </strong>


                          {resource.description && (

                            <span>

                              {
                                resource.description
                              }

                            </span>

                          )}


                          {resource.source && (

                            <small>

                              {
                                resource.source
                              }

                            </small>

                          )}

                        </div>


                        <span>
                          ↗
                        </span>

                      </a>

                    );

                  }
                )}

              </div>

            </section>

          )}


          {/* ==================================================
              YOUTUBE LEARNING NOTE
              ================================================== */}

          {youtubeVideoId && (

            <section className="lecture-video-info">

              <span>
                ▶
              </span>


              <div>

                <strong>
                  Video lesson
                </strong>


                <p>
                  Watch the complete lecture
                  and mark it as completed
                  when you finish.
                </p>

              </div>

            </section>

          )}


          {/* ==================================================
              PREVIOUS / NEXT NAVIGATION
              ================================================== */}

          <section className="lecture-navigation">


            {/* PREVIOUS */}

            {navigation.previous ? (

              <button
                type="button"
                className="navigation-button previous"
                onClick={
                  goPrevious
                }
              >

                <span>
                  ← Previous
                </span>


                <strong>

                  {navigation
                    .previous
                    .title ||
                    "Previous Lecture"}

                </strong>

              </button>

            ) : (

              <div />

            )}


            {/* NEXT */}

            {navigation.next ? (

              <button
                type="button"
                className="navigation-button next"
                onClick={
                  goNext
                }
              >

                <span>
                  Next →
                </span>


                <strong>

                  {navigation
                    .next
                    .title ||
                    "Next Lecture"}

                </strong>

              </button>

            ) : (

              <button
                type="button"
                className="finish-course-button"
                onClick={() =>
                  navigate(
                    `/courses/${currentCourseId}/learn`
                  )
                }
              >

                🎉 Finish Course

              </button>

            )}

          </section>


        </main>

      </div>

    </div>

  );

}