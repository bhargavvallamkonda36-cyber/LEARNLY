import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getInstructorCourse,
  getCourseContent,
  createCourseModule,
  createModuleLecture,
} from "../services/instructor";

import "../styles/InstructorCourseBuilder.css";


export default function InstructorCourseBuilder() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [moduleTitle, setModuleTitle] = useState("");

  const [openModules, setOpenModules] = useState({});

  const [lectureForms, setLectureForms] = useState({});


  async function loadBuilder() {
    try {
      setLoading(true);
      setError("");

      const [
        courseData,
        contentData,
      ] = await Promise.all([
        getInstructorCourse(courseId),
        getCourseContent(courseId),
      ]);

      setCourse(courseData || null);
      setModules(
        Array.isArray(contentData)
          ? contentData
          : []
      );

    } catch (err) {
      console.error(
        "Course builder load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load course builder."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (courseId) {
      loadBuilder();
    }
  }, [courseId]);


  const lectureCount = useMemo(
    () =>
      modules.reduce(
        (total, module) =>
          total +
          (Array.isArray(
            module?.lectures
          )
            ? module.lectures.length
            : 0),
        0
      ),
    [modules]
  );


  function toggleModule(moduleId) {
    setOpenModules((previous) => ({
      ...previous,
      [moduleId]:
        !previous[moduleId],
    }));
  }


  async function handleAddModule(event) {
    event.preventDefault();

    const title =
      moduleTitle.trim();

    if (!title) {
      setError(
        "Module title is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const created =
        await createCourseModule(
          courseId,
          {
            title,
            orderIndex:
              modules.length + 1,
          }
        );

      setModuleTitle("");

      const newModule = {
        ...created,
        lectures: [],
      };

      setModules((previous) => [
        ...previous,
        newModule,
      ]);

      if (created?.id) {
        setOpenModules(
          (previous) => ({
            ...previous,
            [created.id]: true,
          })
        );
      }

      setMessage(
        "Module created successfully."
      );

    } catch (err) {
      console.error(
        "Create module error:",
        err
      );

      setError(
        err.message ||
          "Unable to create module."
      );
    } finally {
      setSaving(false);
    }
  }


  function updateLectureForm(
    moduleId,
    field,
    value
  ) {
    setLectureForms(
      (previous) => ({
        ...previous,
        [moduleId]: {
          title:
            previous[moduleId]
              ?.title || "",
          description:
            previous[moduleId]
              ?.description || "",
          videoUrl:
            previous[moduleId]
              ?.videoUrl || "",
          transcript:
            previous[moduleId]
              ?.transcript || "",
          durationSeconds:
            previous[moduleId]
              ?.durationSeconds || "",
          resourceUrls:
            previous[moduleId]
              ?.resourceUrls || "",
          [field]: value,
        },
      })
    );
  }


  function getLectureForm(moduleId) {
    return (
      lectureForms[moduleId] || {
        title: "",
        description: "",
        videoUrl: "",
        transcript: "",
        durationSeconds: "",
        resourceUrls: "",
      }
    );
  }


  async function handleAddLecture(
    event,
    module
  ) {
    event.preventDefault();

    const form =
      getLectureForm(module.id);

    if (!form.title.trim()) {
      setError(
        "Lecture title is required."
      );
      return;
    }

    const resourceUrls =
      form.resourceUrls
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean);

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const currentLectures =
        Array.isArray(
          module.lectures
        )
          ? module.lectures
          : [];

      const created =
        await createModuleLecture(
          module.id,
          {
            title:
              form.title,
            description:
              form.description,
            videoUrl:
              form.videoUrl,
            transcript:
              form.transcript,
            durationSeconds:
              form.durationSeconds,
            orderIndex:
              currentLectures.length +
              1,
            resourceUrls,
          }
        );

      setModules(
        (previous) =>
          previous.map(
            (item) =>
              item.id === module.id
                ? {
                    ...item,
                    lectures: [
                      ...(Array.isArray(
                        item.lectures
                      )
                        ? item.lectures
                        : []),
                      created,
                    ],
                  }
                : item
          )
      );

      setLectureForms(
        (previous) => ({
          ...previous,
          [module.id]: {
            title: "",
            description: "",
            videoUrl: "",
            transcript: "",
            durationSeconds: "",
            resourceUrls: "",
          },
        })
      );

      setMessage(
        "Lecture created successfully."
      );

    } catch (err) {
      console.error(
        "Create lecture error:",
        err
      );

      setError(
        err.message ||
          "Unable to create lecture."
      );
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <div className="builder-page">
        <div className="builder-loading">
          <div className="builder-loading-icon">
            🎓
          </div>

          <h2>
            Loading Course Builder...
          </h2>

          <p>
            Preparing your course content.
          </p>
        </div>
      </div>
    );
  }


  if (error && !course) {
    return (
      <div className="builder-page">
        <div className="builder-error-card">
          <h2>
            Unable to load course
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/instructor/dashboard"
              )
            }
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="builder-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="builder-header">

        <div>

          <button
            type="button"
            className="builder-back"
            onClick={() =>
              navigate(
                "/instructor/dashboard"
              )
            }
          >
            ← Instructor Dashboard
          </button>

          <span className="builder-eyebrow">
            COURSE BUILDER
          </span>

          <h1>
            {course?.title ||
              "Untitled Course"}
          </h1>

          <p>
            Build your course structure
            with modules and lectures.
          </p>

        </div>

        <div className="builder-header-actions">

          <span
            className={`builder-status status-${String(
              course?.status ||
                "pending"
            ).toLowerCase()}`}
          >
            {course?.status ||
              "pending"}
          </span>

          <button
            type="button"
            className="builder-dashboard-button"
            onClick={() =>
              navigate(
                "/instructor/dashboard"
              )
            }
          >
            Done
          </button>

        </div>

      </header>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="builder-summary">

        <div className="builder-summary-card">
          <span>Modules</span>
          <strong>
            {modules.length}
          </strong>
        </div>

        <div className="builder-summary-card">
          <span>Lectures</span>
          <strong>
            {lectureCount}
          </strong>
        </div>

        <div className="builder-summary-card">
          <span>Difficulty</span>
          <strong>
            {String(
              course?.difficulty ||
                "beginner"
            )
              .charAt(0)
              .toUpperCase() +
              String(
                course?.difficulty ||
                  "beginner"
              ).slice(1)}
          </strong>
        </div>

        <div className="builder-summary-card">
          <span>Category</span>
          <strong>
            {course?.category ||
              "General"}
          </strong>
        </div>

      </section>


      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {error && (
        <div className="builder-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="builder-message success">
          {message}
        </div>
      )}


      {/* =====================================================
          ADD MODULE
      ===================================================== */}

      <section className="builder-section">

        <div className="builder-section-heading">

          <div>
            <span>
              CURRICULUM
            </span>

            <h2>
              Course Modules
            </h2>

            <p>
              Organize your course into
              logical learning sections.
            </p>
          </div>

        </div>


        <form
          className="add-module-form"
          onSubmit={handleAddModule}
        >

          <input
            type="text"
            value={moduleTitle}
            onChange={(event) =>
              setModuleTitle(
                event.target.value
              )
            }
            placeholder="Module title — e.g. Introduction to Python"
            disabled={saving}
          />

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "+ Add Module"}
          </button>

        </form>

      </section>


      {/* =====================================================
          MODULES
      ===================================================== */}

      <section className="builder-modules">

        {modules.length === 0 ? (

          <div className="builder-empty">

            <div>
              📚
            </div>

            <h3>
              No modules yet
            </h3>

            <p>
              Add your first module above
              to start building the course.
            </p>

          </div>

        ) : (

          modules.map(
            (module, moduleIndex) => {

              const lectures =
                Array.isArray(
                  module?.lectures
                )
                  ? module.lectures
                  : [];

              const isOpen =
                Boolean(
                  openModules[
                    module.id
                  ]
                );

              const form =
                getLectureForm(
                  module.id
                );

              return (
                <article
                  className="builder-module"
                  key={module.id}
                >

                  {/* MODULE HEADER */}

                  <button
                    type="button"
                    className="builder-module-header"
                    onClick={() =>
                      toggleModule(
                        module.id
                      )
                    }
                  >

                    <div className="builder-module-number">
                      {moduleIndex + 1}
                    </div>

                    <div className="builder-module-title">

                      <span>
                        MODULE{" "}
                        {moduleIndex + 1}
                      </span>

                      <h3>
                        {module.title}
                      </h3>

                      <small>
                        {lectures.length}{" "}
                        lecture
                        {lectures.length === 1
                          ? ""
                          : "s"}
                      </small>

                    </div>

                    <div className="builder-module-chevron">
                      {isOpen
                        ? "⌃"
                        : "⌄"}
                    </div>

                  </button>


                  {isOpen && (
                    <div className="builder-module-content">

                      {/* EXISTING LECTURES */}

                      <div className="builder-lectures">

                        {lectures.length > 0 ? (

                          lectures.map(
                            (
                              lecture,
                              lectureIndex
                            ) => (

                              <div
                                className="builder-lecture"
                                key={
                                  lecture.id
                                }
                              >

                                <div className="builder-lecture-index">
                                  {lectureIndex + 1}
                                </div>

                                <div className="builder-lecture-content">

                                  <h4>
                                    {lecture.title}
                                  </h4>

                                  {lecture.description && (
                                    <p>
                                      {
                                        lecture.description
                                      }
                                    </p>
                                  )}

                                  <div className="builder-lecture-meta">

                                    <span>
                                      ⏱{" "}
                                      {lecture.duration_seconds
                                        ? `${Math.ceil(
                                            Number(
                                              lecture.duration_seconds
                                            ) / 60
                                          )} min`
                                        : "No duration"}
                                    </span>

                                    {lecture.video_url && (
                                      <a
                                        href={
                                          lecture.video_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        ▶ Video ↗
                                      </a>
                                    )}

                                    {Array.isArray(
                                      lecture.resource_urls
                                    ) &&
                                      lecture
                                        .resource_urls
                                        .length > 0 && (
                                        <span>
                                          📎{" "}
                                          {
                                            lecture
                                              .resource_urls
                                              .length
                                          } resources
                                        </span>
                                      )}

                                  </div>

                                </div>

                              </div>

                            )
                          )

                        ) : (

                          <div className="builder-no-lectures">
                            No lectures in this
                            module yet.
                          </div>

                        )}

                      </div>


                      {/* ADD LECTURE */}

                      <form
                        className="add-lecture-form"
                        onSubmit={(event) =>
                          handleAddLecture(
                            event,
                            module
                          )
                        }
                      >

                        <div className="add-lecture-heading">

                          <div>
                            <span>
                              ADD CONTENT
                            </span>

                            <h3>
                              New Lecture
                            </h3>
                          </div>

                        </div>


                        <div className="builder-form-grid">

                          <div className="builder-field full">

                            <label>
                              Lecture Title *
                            </label>

                            <input
                              type="text"
                              value={
                                form.title
                              }
                              onChange={(
                                event
                              ) =>
                                updateLectureForm(
                                  module.id,
                                  "title",
                                  event.target.value
                                )
                              }
                              placeholder="Example: Variables and Data Types"
                              disabled={saving}
                            />

                          </div>


                          <div className="builder-field full">

                            <label>
                              Description
                            </label>

                            <textarea
                              value={
                                form.description
                              }
                              onChange={(
                                event
                              ) =>
                                updateLectureForm(
                                  module.id,
                                  "description",
                                  event.target.value
                                )
                              }
                              placeholder="What will students learn in this lecture?"
                              rows={3}
                              disabled={saving}
                            />

                          </div>


                          <div className="builder-field">

                            <label>
                              Video URL
                            </label>

                            <input
                              type="url"
                              value={
                                form.videoUrl
                              }
                              onChange={(
                                event
                              ) =>
                                updateLectureForm(
                                  module.id,
                                  "videoUrl",
                                  event.target.value
                                )
                              }
                              placeholder="https://youtube.com/..."
                              disabled={saving}
                            />

                          </div>


                          <div className="builder-field">

                            <label>
                              Duration (seconds)
                            </label>

                            <input
                              type="number"
                              min="0"
                              value={
                                form.durationSeconds
                              }
                              onChange={(
                                event
                              ) =>
                                updateLectureForm(
                                  module.id,
                                  "durationSeconds",
                                  event.target.value
                                )
                              }
                              placeholder="600"
                              disabled={saving}
                            />

                          </div>


                          <div className="builder-field full">

                            <label>
                              Resource URLs
                            </label>

                            <textarea
                              value={
                                form.resourceUrls
                              }
                              onChange={(
                                event
                              ) =>
                                updateLectureForm(
                                  module.id,
                                  "resourceUrls",
                                  event.target.value
                                )
                              }
                              placeholder={
                                "One URL per line\nhttps://example.com/notes.pdf"
                              }
                              rows={3}
                              disabled={saving}
                            />

                            <small>
                              Add one resource
                              URL per line.
                            </small>

                          </div>


                          <div className="builder-field full">

                            <label>
                              Transcript
                            </label>

                            <textarea
                              value={
                                form.transcript
                              }
                              onChange={(
                                event
                              ) =>
                                updateLectureForm(
                                  module.id,
                                  "transcript",
                                  event.target.value
                                )
                              }
                              placeholder="Optional lecture transcript..."
                              rows={6}
                              disabled={saving}
                            />

                          </div>

                        </div>


                        <div className="add-lecture-actions">

                          <button
                            type="submit"
                            className="add-lecture-button"
                            disabled={
                              saving
                            }
                          >
                            {saving
                              ? "Saving..."
                              : "+ Add Lecture"}
                          </button>

                        </div>

                      </form>

                    </div>
                  )}

                </article>
              );
            }
          )

        )}

      </section>

    </div>
  );
}
