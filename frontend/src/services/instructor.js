import {
  getAccessToken as getStoredAccessToken,
  clearAuth,
} from "./auth";


// ============================================================
// API BASE URL
// ============================================================

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const API_BASE_URL =
  RAW_API_BASE_URL.replace(/\/+$/, "").endsWith(
    "/api/v1"
  )
    ? RAW_API_BASE_URL.replace(/\/+$/, "")
    : `${RAW_API_BASE_URL.replace(/\/+$/, "")}/api/v1`;


// ============================================================
// GET TOKEN
// ============================================================

export function getAccessToken() {
  return getStoredAccessToken();
}


// ============================================================
// GENERIC REQUEST
// ============================================================

async function request(
  endpoint,
  options = {}
) {

  const token =
    getAccessToken();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };


  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] =
      "application/json";
  }


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  let response;


  try {

    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

  } catch (error) {

    throw new Error(
      `Cannot connect to Learnly backend at ${API_BASE_URL}. Make sure FastAPI is running.`
    );

  }


  let data = null;


  try {

    data =
      await response.json();

  } catch {

    data = null;

  }


  if (!response.ok) {

    if (
      response.status === 401
    ) {

      clearAuth();

      throw new Error(
        "Your session has expired. Please login again."
      );

    }


    if (
      response.status === 403
    ) {

      throw new Error(
        "You do not have permission to access this instructor area."
      );

    }


    throw new Error(
      data?.detail ||
      data?.message ||
      `Request failed: ${response.status}`
    );

  }


  return data;
}


// ============================================================
// AUTH - CURRENT USER
// ============================================================

export async function getCurrentUser() {

  return request(
    "/auth/me"
  );

}


// ============================================================
// INSTRUCTOR DASHBOARD
// ============================================================

export async function getInstructorDashboard() {

  return request(
    "/instructor/dashboard"
  );

}


// ============================================================
// INSTRUCTOR COURSES
// ============================================================

export async function getInstructorCourses() {

  const data =
    await request(
      "/instructor/courses"
    );


  if (
    Array.isArray(data)
  ) {
    return data;
  }


  if (
    Array.isArray(
      data?.courses
    )
  ) {
    return data.courses;
  }


  if (
    Array.isArray(
      data?.items
    )
  ) {
    return data.items;
  }


  return [];

}


// ============================================================
// INSTRUCTOR ANALYTICS
// ============================================================

export async function getInstructorAnalyticsOverview() {

  return request(
    "/instructor/analytics/overview"
  );

}


export async function getInstructorAnalyticsCourses() {

  const data =
    await request(
      "/instructor/analytics/courses"
    );


  return Array.isArray(data)
    ? data
    : [];

}


export async function getInstructorAnalyticsStudents() {

  const data =
    await request(
      "/instructor/analytics/students"
    );


  return Array.isArray(data)
    ? data
    : [];

}


export async function getInstructorAnalyticsQuizzes() {

  const data =
    await request(
      "/instructor/analytics/quizzes"
    );


  return Array.isArray(data)
    ? data
    : [];

}


export async function getInstructorRecentAttempts() {

  const data =
    await request(
      "/instructor/analytics/recent-attempts"
    );


  return Array.isArray(data)
    ? data
    : [];

}


// ============================================================
// SINGLE COURSE
// ============================================================

export async function getInstructorCourse(
  courseId
) {

  if (!courseId) {

    throw new Error(
      "Course ID is required."
    );

  }


  return request(
    `/courses/${courseId}`
  );

}


// ============================================================
// COURSE CONTENT
// ============================================================

export async function getCourseContent(
  courseId
) {

  if (!courseId) {

    throw new Error(
      "Course ID is required."
    );

  }


  const data =
    await request(
      `/courses/${courseId}/content`
    );


  if (
    Array.isArray(data)
  ) {
    return data;
  }


  if (
    Array.isArray(
      data?.modules
    )
  ) {
    return data.modules;
  }


  if (
    Array.isArray(
      data?.items
    )
  ) {
    return data.items;
  }


  return [];

}


// ============================================================
// COURSE MODULES
// ============================================================

export async function getCourseModules(
  courseId
) {

  if (!courseId) {

    throw new Error(
      "Course ID is required."
    );

  }


  const data =
    await request(
      `/courses/${courseId}/modules`
    );


  if (
    Array.isArray(data)
  ) {
    return data;
  }


  if (
    Array.isArray(
      data?.modules
    )
  ) {
    return data.modules;
  }


  if (
    Array.isArray(
      data?.items
    )
  ) {
    return data.items;
  }


  return [];

}


// ============================================================
// CREATE MODULE
// ============================================================

export async function createCourseModule(
  courseId,
  {
    title,
    orderIndex = 1,
  }
) {

  if (!courseId) {

    throw new Error(
      "Course ID is required."
    );

  }


  if (!title?.trim()) {

    throw new Error(
      "Module title is required."
    );

  }


  return request(
    `/courses/${courseId}/modules`,
    {
      method: "POST",

      body: JSON.stringify({

        title:
          title.trim(),

        order_index:
          Number(
            orderIndex
          ) || 1,

      }),
    }
  );

}


// ============================================================
// CREATE LECTURE
// ============================================================

export async function createModuleLecture(
  moduleId,
  {
    title,
    description = "",
    videoUrl = "",
    transcript = "",
    durationSeconds = 0,
    orderIndex = 1,
    resourceUrls = [],
  }
) {

  if (!moduleId) {

    throw new Error(
      "Module ID is required."
    );

  }


  if (!title?.trim()) {

    throw new Error(
      "Lecture title is required."
    );

  }


  return request(
    `/modules/${moduleId}/lectures`,
    {
      method: "POST",

      body: JSON.stringify({

        title:
          title.trim(),

        description:
          description?.trim() ||
          null,

        video_url:
          videoUrl?.trim() ||
          null,

        transcript:
          transcript?.trim() ||
          null,

        duration_seconds:
          Number(
            durationSeconds
          ) || 0,

        order_index:
          Number(
            orderIndex
          ) || 1,

        resource_urls:
          Array.isArray(
            resourceUrls
          )
            ? resourceUrls
            : [],

      }),
    }
  );

}


// ============================================================
// UPDATE COURSE
// ============================================================

export async function updateInstructorCourse(
  courseId,
  payload
) {

  if (!courseId) {

    throw new Error(
      "Course ID is required."
    );

  }


  return request(
    `/courses/${courseId}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          payload
        ),
    }
  );

}


// ============================================================
// DELETE COURSE
// ============================================================

export async function deleteInstructorCourse(
  courseId
) {

  if (!courseId) {

    throw new Error(
      "Course ID is required."
    );

  }


  return request(
    `/courses/${courseId}`,
    {
      method: "DELETE",
    }
  );

}


// ============================================================
// EXPORT
// ============================================================

export {
  API_BASE_URL,
};
