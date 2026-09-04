import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/InstructorCourseCreate.css";
import { getAccessToken } from "../services/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

export default function InstructorCourseCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Programming",
    difficulty: "beginner",
    price: "0",
    thumbnail_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Course title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Course description is required.");
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setError(
        "You are not logged in. Please login as an instructor."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/courses`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            difficulty: form.difficulty,
            price: Number(form.price) || 0,
            thumbnail_url:
              form.thumbnail_url.trim() || null,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Failed to create course (${response.status})`
        );
      }

      setSuccess("Course created successfully!");

      const courseId =
        data?.id ||
        data?.course_id ||
        data?.course?.id;

      setTimeout(() => {
        if (courseId) {
          navigate(
            `/instructor/courses/${courseId}/builder`
          );
        } else {
          navigate("/instructor/dashboard");
        }
      }, 700);

    } catch (err) {
      console.error(
        "Course creation error:",
        err
      );

      setError(
        err.message ||
          "Unable to create course."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    navigate("/instructor/dashboard");
  }

  return (
    <div className="instructor-course-create">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="course-create-header">

        <div>
          <div className="course-create-eyebrow">
            INSTRUCTOR WORKSPACE
          </div>

          <h1>
            Create New Course
          </h1>

          <p>
            Build a new learning experience for
            your students.
          </p>
        </div>

        <button
          type="button"
          className="back-dashboard-button"
          onClick={handleCancel}
        >
          ← Dashboard
        </button>

      </div>


      {/* =====================================================
          FORM CARD
      ===================================================== */}

      <div className="course-create-card">

        <div className="course-create-card-header">
          <div>
            <h2>
              Course Information
            </h2>

            <p>
              Enter the basic information about
              your course.
            </p>
          </div>

          <div className="course-create-icon">
            🎓
          </div>
        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="course-create-message error">
            {error}
          </div>
        )}


        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="course-create-message success">
            {success}
          </div>
        )}


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="course-create-form"
        >

          {/* TITLE */}

          <div className="form-group full-width">

            <label htmlFor="title">
              Course Title
              <span>*</span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="Example: Java Fundamentals"
              value={form.title}
              onChange={handleChange}
              maxLength={200}
              disabled={loading}
            />

            <small>
              Give your course a clear and
              descriptive title.
            </small>

          </div>


          {/* DESCRIPTION */}

          <div className="form-group full-width">

            <label htmlFor="description">
              Description
              <span>*</span>
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Describe what students will learn in this course..."
              value={form.description}
              onChange={handleChange}
              rows={6}
              disabled={loading}
            />

            <small>
              Explain the course content,
              learning goals and outcomes.
            </small>

          </div>


          {/* CATEGORY */}

          <div className="form-group">

            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="Programming">
                Programming
              </option>

              <option value="Artificial Intelligence">
                Artificial Intelligence
              </option>

              <option value="Machine Learning">
                Machine Learning
              </option>

              <option value="Data Science">
                Data Science
              </option>

              <option value="Web Development">
                Web Development
              </option>

              <option value="Database">
                Database
              </option>

              <option value="Cloud">
                Cloud
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>


          {/* DIFFICULTY */}

          <div className="form-group">

            <label htmlFor="difficulty">
              Difficulty
            </label>

            <select
              id="difficulty"
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="beginner">
                Beginner
              </option>

              <option value="intermediate">
                Intermediate
              </option>

              <option value="advanced">
                Advanced
              </option>

            </select>

          </div>


          {/* PRICE */}

          <div className="form-group">

            <label htmlFor="price">
              Price
            </label>

            <div className="price-input-wrapper">

              <span>
                ₹
              </span>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.price}
                onChange={handleChange}
                disabled={loading}
              />

            </div>

            <small>
              Enter 0 for a free course.
            </small>

          </div>


          {/* THUMBNAIL */}

          <div className="form-group">

            <label htmlFor="thumbnail_url">
              Thumbnail URL
            </label>

            <input
              id="thumbnail_url"
              name="thumbnail_url"
              type="url"
              placeholder="https://example.com/course.jpg"
              value={form.thumbnail_url}
              onChange={handleChange}
              disabled={loading}
            />

            <small>
              Optional course thumbnail image.
            </small>

          </div>


          {/* THUMBNAIL PREVIEW */}

          {form.thumbnail_url && (
            <div className="thumbnail-preview">

              <div className="thumbnail-preview-label">
                Thumbnail Preview
              </div>

              <img
                src={form.thumbnail_url}
                alt="Course thumbnail preview"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />

            </div>
          )}


          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="course-create-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-course-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  + Create Course
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
