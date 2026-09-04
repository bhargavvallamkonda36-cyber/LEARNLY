import { getAccessToken, clearAuth } from "./auth";

// ============================================================
// LEARNLY LMS - LEARNING SERVICE
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";


// ============================================================
// GET AUTH TOKEN
// ============================================================

function getToken() {
  return getAccessToken();
}


// ============================================================
// GENERIC REQUEST
// ============================================================

async function request(
  endpoint,
  options = {},
  defaultMessage = "Request failed."
) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",

        // IMPORTANT:
        // Send JWT token with every authenticated request.
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );


  // ==========================================================
  // READ RESPONSE
  // ==========================================================

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }


  // ==========================================================
  // HANDLE 401 / 403
  // ==========================================================

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        data.detail ||
          "You do not have permission to access this resource."
      );
    }

    throw new Error(
      data.detail ||
        data.message ||
        defaultMessage
    );
  }


  return data;
}


// ============================================================
// COURSE CONTENT
// ============================================================

export async function getCourseContent(courseId) {
  return request(
    `/courses/${courseId}/content`,
    {},
    "Unable to load course content."
  );
}


// ============================================================
// LECTURE
// ============================================================

export async function getLecture(lectureId) {
  return request(
    `/lectures/${lectureId}`,
    {},
    "Unable to load lecture."
  );
}


// ============================================================
// COMPLETE LECTURE
// ============================================================

export async function completeLecture(lectureId) {
  return request(
    `/lectures/${lectureId}/complete`,
    {
      method: "POST",
    },
    "Unable to complete lecture."
  );
}


// ============================================================
// COURSE PROGRESS
// ============================================================

export async function getCourseProgress(courseId) {
  return request(
    `/courses/${courseId}/progress`,
    {},
    "Unable to load course progress."
  );
}


// ============================================================
// ENROLL COURSE
// ============================================================

export async function enrollCourse(courseId) {
  return request(
    `/courses/${courseId}/enroll`,
    {
      method: "POST",
    },
    "Unable to enroll in course."
  );
}


// ============================================================
// MY ENROLLMENTS
// ============================================================

export async function getMyEnrollments() {
  return request(
    `/enrollments/me`,
    {},
    "Unable to load your enrollments."
  );
}


// ============================================================
// EXPORT API URL
// ============================================================

export { API_BASE_URL };
