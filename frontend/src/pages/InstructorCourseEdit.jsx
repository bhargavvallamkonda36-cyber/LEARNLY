import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getInstructorCourse,
  updateInstructorCourse,
} from "../services/instructor";
import "../styles/InstructorCourseEdit.css";

export default function InstructorCourseEdit() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Programming",
    difficulty: "beginner",
    price: "0",
    thumbnail_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const course = await getInstructorCourse(courseId);
        if (!mounted) return;
        setForm({
          title: course?.title || "",
          description: course?.description || "",
          category: course?.category || "Programming",
          difficulty: course?.difficulty || "beginner",
          price: String(course?.price ?? 0),
          thumbnail_url: course?.thumbnail_url || "",
        });
      } catch (err) {
        if (mounted) setError(err?.message || "Unable to load course.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (courseId) load();
    return () => { mounted = false; };
  }, [courseId]);

  function change(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Course title is required.");
      return;
    }

    try {
      setSaving(true);
      await updateInstructorCourse(courseId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        difficulty: form.difficulty,
        price: Number(form.price) || 0,
        thumbnail_url: form.thumbnail_url.trim() || null,
      });
      setMessage("Course updated successfully.");
    } catch (err) {
      setError(err?.message || "Unable to update course.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="course-edit-page"><div className="course-edit-card"><h2>Loading course...</h2></div></div>;
  }

  if (error && !form.title) {
    return (
      <div className="course-edit-page">
        <div className="course-edit-card">
          <h2>Unable to load course</h2>
          <p>{error}</p>
          <button className="primary-button" onClick={() => navigate("/instructor/courses")}>Back to Courses</button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-edit-page">
      <div className="course-edit-header">
        <div>
          <span>INSTRUCTOR WORKSPACE</span>
          <h1>Edit Course</h1>
          <p>Update course information, then continue building modules and lectures.</p>
        </div>
        <button className="secondary-button" onClick={() => navigate(`/instructor/courses/${courseId}`)}>← Course Builder</button>
      </div>

      {error && <div className="course-edit-message error">{error}</div>}
      {message && <div className="course-edit-message success">{message}</div>}

      <form className="course-edit-card" onSubmit={submit}>
        <label>Course Title<input name="title" value={form.title} onChange={change} required /></label>
        <label>Description<textarea name="description" rows="5" value={form.description} onChange={change} /></label>
        <div className="course-edit-grid">
          <label>Category<input name="category" value={form.category} onChange={change} /></label>
          <label>Difficulty<select name="difficulty" value={form.difficulty} onChange={change}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label>Price<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} /></label>
          <label>Thumbnail URL<input name="thumbnail_url" value={form.thumbnail_url} onChange={change} placeholder="https://..." /></label>
        </div>
        <div className="course-edit-actions">
          <button type="button" className="secondary-button" onClick={() => navigate(`/instructor/courses/${courseId}`)}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}
