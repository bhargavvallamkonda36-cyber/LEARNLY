import {
  useEffect,
  useState,
} from "react";

import {
  getCourses,
  getCourseModules,
} from "../services/aiTutor";

import "../styles/AITutor.css";


export default function CourseModuleSelector({
  onContextChange,
}) {
  const [courses, setCourses] = useState([]);

  const [modules, setModules] = useState([]);

  const [selectedCourseId, setSelectedCourseId] =
    useState("");

  const [selectedModuleId, setSelectedModuleId] =
    useState("");

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingModules, setLoadingModules] =
    useState(false);

  const [error, setError] = useState("");


  // ==========================================================
  // LOAD COURSES
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setLoadingCourses(true);
        setError("");

        const data = await getCourses();

        if (cancelled) {
          return;
        }

        setCourses(data);

        if (data.length > 0) {
          const firstCourse = data[0];

          const courseId =
            firstCourse.id ??
            firstCourse.course_id;

          if (courseId !== undefined && courseId !== null) {
            setSelectedCourseId(
              String(courseId)
            );
          }
        } else {
          setSelectedCourseId("");
          setModules([]);
          setSelectedModuleId("");
        }

      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Course loading error:",
          err
        );

        setCourses([]);
        setModules([]);
        setSelectedCourseId("");
        setSelectedModuleId("");

        setError(
          err.message ||
          "Unable to load courses."
        );

      } finally {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);


  // ==========================================================
  // LOAD MODULES
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    if (!selectedCourseId) {
      setModules([]);
      setSelectedModuleId("");
      setLoadingModules(false);

      return undefined;
    }

    async function loadModules() {
      try {
        setLoadingModules(true);
        setError("");

        const data =
          await getCourseModules(
            selectedCourseId
          );

        if (cancelled) {
          return;
        }

        setModules(data);

        if (data.length > 0) {
          const firstModule = data[0];

          const moduleId =
            firstModule.id ??
            firstModule.module_id;

          if (
            moduleId !== undefined &&
            moduleId !== null
          ) {
            setSelectedModuleId(
              String(moduleId)
            );
          } else {
            setSelectedModuleId("");
          }

        } else {
          setSelectedModuleId("");
        }

      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Module loading error:",
          err
        );

        setModules([]);
        setSelectedModuleId("");

        setError(
          err.message ||
          "Unable to load modules."
        );

      } finally {
        if (!cancelled) {
          setLoadingModules(false);
        }
      }
    }

    loadModules();

    return () => {
      cancelled = true;
    };
  }, [selectedCourseId]);


  // ==========================================================
  // SEND CONTEXT TO AI TUTOR
  // ==========================================================

  useEffect(() => {
    const course =
      courses.find(
        (item) =>
          String(
            item.id ??
            item.course_id
          ) ===
          String(selectedCourseId)
      );

    const selectedModule =
      modules.find(
        (item) =>
          String(
            item.id ??
            item.module_id
          ) ===
          String(selectedModuleId)
      );

    const courseName =
      course?.title ||
      course?.name ||
      course?.course_name ||
      "General";

    const moduleName =
      selectedModule?.title ||
      selectedModule?.name ||
      selectedModule?.module_name ||
      "General";

    if (typeof onContextChange === "function") {
      onContextChange({
        course: courseName,
        module: moduleName,
        courseId: selectedCourseId,
        moduleId: selectedModuleId,
      });
    }
  }, [
    courses,
    modules,
    selectedCourseId,
    selectedModuleId,
    onContextChange,
  ]);


  // ==========================================================
  // COURSE CHANGE
  // ==========================================================

  function handleCourseChange(event) {
    const courseId = event.target.value;

    setSelectedCourseId(courseId);

    // Clear old module immediately.
    setModules([]);
    setSelectedModuleId("");
  }


  // ==========================================================
  // MODULE CHANGE
  // ==========================================================

  function handleModuleChange(event) {
    setSelectedModuleId(
      event.target.value
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="ai-course-selector">

      {/* COURSE */}

      <div className="selector-field">

        <label htmlFor="ai-course-select">
          📘 COURSE
        </label>

        <select
          id="ai-course-select"
          value={selectedCourseId}
          onChange={handleCourseChange}
          disabled={loadingCourses}
        >
          <option value="">
            {loadingCourses
              ? "Loading courses..."
              : courses.length === 0
              ? "No courses available"
              : "Select a course"}
          </option>

          {courses.map((course) => {
            const id =
              course.id ??
              course.course_id;

            const name =
              course.title ||
              course.name ||
              course.course_name ||
              `Course ${id}`;

            return (
              <option
                key={String(id)}
                value={String(id)}
              >
                {name}
              </option>
            );
          })}
        </select>

      </div>


      {/* MODULE */}

      <div className="selector-field">

        <label htmlFor="ai-module-select">
          📚 MODULE
        </label>

        <select
          id="ai-module-select"
          value={selectedModuleId}
          onChange={handleModuleChange}
          disabled={
            loadingModules ||
            !selectedCourseId
          }
        >
          <option value="">
            {loadingModules
              ? "Loading modules..."
              : !selectedCourseId
              ? "Select a course first"
              : modules.length === 0
              ? "No modules available"
              : "Select a module"}
          </option>

          {modules.map((module) => {
            const id =
              module.id ??
              module.module_id;

            const name =
              module.title ||
              module.name ||
              module.module_name ||
              `Module ${id}`;

            return (
              <option
                key={String(id)}
                value={String(id)}
              >
                {name}
              </option>
            );
          })}
        </select>

      </div>


      {/* ERROR */}

      {error && (
        <div className="selector-error">
          ⚠️ {error}
        </div>
      )}

    </div>
  );
}
