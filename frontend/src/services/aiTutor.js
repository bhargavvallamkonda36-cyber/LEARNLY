import { getAccessToken as getStoredAccessToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";


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
      data.detail ||
      data.message ||
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
  const response = await fetch(
    `${API_BASE_URL}/ai-tutor/chat`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
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
// GET COURSES
// ============================================================

export async function getCourses() {
  const response = await fetch(
    `${API_BASE_URL}/courses`
  );

  const data = await parseResponse(
    response,
    "Unable to load courses."
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.courses)) {
    return data.courses;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}


// ============================================================
// GET SINGLE COURSE
// ============================================================

export async function getCourse(courseId) {
  if (!courseId) {
    throw new Error("Course ID is required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}`
  );

  return await parseResponse(
    response,
    "Unable to load course."
  );
}


// ============================================================
// GET COURSE MODULES
// ============================================================

export async function getCourseModules(courseId) {
  if (!courseId) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/modules`
  );

  const data = await parseResponse(
    response,
    "Unable to load modules."
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.modules)) {
    return data.modules;
  }

  if (Array.isArray(data.items)) {
    return data.items;
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
