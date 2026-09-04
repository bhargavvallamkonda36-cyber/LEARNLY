import { useEffect, useState } from "react";

import {
  getCourses,
  getCourseModules,
} from "../services/aiTutor";

import "../styles/AITutor.css";


export default function CourseModuleSelector({
  onContextChange,
}) {

  const [courses, setCourses] =
    useState([]);

  const [modules, setModules] =
    useState([]);


  const [selectedCourseId, setSelectedCourseId] =
    useState("");

  const [selectedModuleId, setSelectedModuleId] =
    useState("");


  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingModules, setLoadingModules] =
    useState(false);


  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD COURSES
  // ==========================================================

  useEffect(() => {

    async function loadCourses() {

      try {

        setLoadingCourses(true);
        setError("");

        const data =
          await getCourses();

        setCourses(data);


        if (data.length > 0) {

          const firstCourse =
            data[0];

          const courseId =
            firstCourse.id ??
            firstCourse.course_id;

          setSelectedCourseId(
            String(courseId)
          );

        }

      } catch (err) {

        console.error(
          "Course loading error:",
          err
        );

        setError(
          err.message ||
          "Unable to load courses."
        );

      } finally {

        setLoadingCourses(false);
      }
    }


    loadCourses();

  }, []);


  // ==========================================================
  // LOAD MODULES
  // ==========================================================

  useEffect(() => {

    if (!selectedCourseId) {
      setModules([]);
      setSelectedModuleId("");
      return;
    }


    async function loadModules() {

      try {

        setLoadingModules(true);
        setError("");

        const data =
          await getCourseModules(
            selectedCourseId
          );

        setModules(data);


        if (data.length > 0) {

          const firstModule =
            data[0];

          const moduleId =
            firstModule.id ??
            firstModule.module_id;

          setSelectedModuleId(
            String(moduleId)
          );

        } else {

          setSelectedModuleId("");
        }

      } catch (err) {

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

        setLoadingModules(false);
      }
    }


    loadModules();

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


    const module =
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
      module?.title ||
      module?.name ||
      module?.module_name ||
      "General";


    onContextChange({
      course: courseName,
      module: moduleName,
      courseId: selectedCourseId,
      moduleId: selectedModuleId,
    });

  }, [
    courses,
    modules,
    selectedCourseId,
    selectedModuleId,
    onContextChange,
  ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="ai-course-selector">

      <div className="selector-field">

        <label>
          📘 Course
        </label>


        <select
          value={selectedCourseId}
          onChange={(event) =>
            setSelectedCourseId(
              event.target.value
            )
          }
          disabled={loadingCourses}
        >

          <option value="">
            {loadingCourses
              ? "Loading courses..."
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
                key={id}
                value={id}
              >
                {name}
              </option>
            );

          })}

        </select>

      </div>


      <div className="selector-field">

        <label>
          📚 Module
        </label>


        <select
          value={selectedModuleId}
          onChange={(event) =>
            setSelectedModuleId(
              event.target.value
            )
          }
          disabled={
            loadingModules ||
            !selectedCourseId
          }
        >

          <option value="">

            {loadingModules
              ? "Loading modules..."
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
                key={id}
                value={id}
              >
                {name}
              </option>
            );

          })}

        </select>

      </div>


      {error && (
        <div className="selector-error">
          ⚠️ {error}
        </div>
      )}

    </div>
  );
}
