import { getAccessToken as getStoredAccessToken } from "./auth";

// ============================================================
// API CONFIGURATION
// ============================================================

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const CLEAN_API_BASE =
  RAW_API_BASE.replace(/\/+$/, "");

const API_BASE_URL =
  CLEAN_API_BASE.endsWith("/api/v1")
    ? CLEAN_API_BASE
    : `${CLEAN_API_BASE}/api/v1`;


// ============================================================
// ACCESS TOKEN
// ============================================================

export function getAccessToken() {
  return getStoredAccessToken();
}


// ============================================================
// COMMON RESPONSE HANDLER
// ============================================================

async function parseResponse(response, defaultMessage) {
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      defaultMessage
    );
  }

  return data;
}


// ============================================================
// AI TUTOR CHAT
// ============================================================

export async function askAITutor({
  message,
  course = "General",
  module = null,
  history = [],
}) {
  const token = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/ai-tutor/chat`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      },

      body: JSON.stringify({
        message,
        course,
        module,
        history,
      }),
    }
  );

  return await parseResponse(
    response,
    "Unable to connect to Learnly AI Tutor."
  );
}


// ============================================================
// GET ALL COURSES
// ============================================================

export async function getCourses() {
  const response = await fetch(
    `${API_BASE_URL}/courses`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },
    }
  );

  const data = await parseResponse(
    response,
    "Unable to load courses."
  );

  // Backend currently returns a list directly.
  if (Array.isArray(data)) {
    return data;
  }

  // Compatibility with wrapped responses.
  if (Array.isArray(data?.courses)) {
    return data.courses;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}


// ============================================================
// GET SINGLE COURSE
// ============================================================

export async function getCourse(courseId) {
  if (!courseId) {
    throw new Error(
      "Course ID is required."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },
    }
  );

  return await parseResponse(
    response,
    "Unable to load course."
  );
}


// ============================================================
// GET COURSE MODULES / CONTENT
// ============================================================

export async function getCourseModules(courseId) {
  if (!courseId) {
    return [];
  }

  // IMPORTANT:
  // Backend endpoint is /content,
  // NOT /modules.
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/content`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },
    }
  );

  const data = await parseResponse(
    response,
    "Unable to load course modules."
  );

  // Direct array response.
  if (Array.isArray(data)) {
    return data;
  }

  // Wrapped response.
  if (Array.isArray(data?.modules)) {
    return data.modules;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}


// ============================================================
// GET QUIZ HISTORY
// ============================================================

export async function getQuizHistory() {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "Please log in before viewing quiz history."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/ai-tutor/quiz/history`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",

        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return await parseResponse(
    response,
    "Unable to load quiz history."
  );
}


// ============================================================
// GET SINGLE QUIZ ATTEMPT
// ============================================================

export async function getQuizAttempt(attemptId) {
  if (!attemptId) {
    throw new Error(
      "Attempt ID is required."
    );
  }

  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "Please log in before viewing the quiz attempt."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/ai-tutor/quiz/history/${attemptId}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",

        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return await parseResponse(
    response,
    "Unable to load quiz attempt."
  );
}


// ============================================================
// EXPORT API BASE URL
// ============================================================

export {
  API_BASE_URL,
};
