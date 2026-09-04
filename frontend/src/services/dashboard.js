import { getAccessToken } from "./auth";


// ============================================================
// API BASE URL
// ============================================================

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";


/*
 * Supports BOTH:
 *
 * VITE_API_BASE_URL=http://127.0.0.1:8000
 *
 * and:
 *
 * VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
 *
 * This prevents:
 *
 * /api/v1/api/v1/...
 */

const API_BASE_URL =
  RAW_API_BASE_URL
    .replace(/\/+$/, "")
    .endsWith("/api/v1")
      ? RAW_API_BASE_URL
          .replace(/\/+$/, "")
      : `${RAW_API_BASE_URL.replace(
          /\/+$/,
          ""
        )}/api/v1`;


// ============================================================
// GENERIC REQUEST
// ============================================================

async function request(
  endpoint,
  options = {}
) {

  const token =
    getAccessToken();


  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,

        headers: {

          Accept:
            "application/json",

          ...(options.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),

          ...(options.headers || {}),
        },
      }
    );


  let data = null;


  try {

    data =
      await response.json();

  } catch {

    data = null;

  }


  if (!response.ok) {

    const detail =
      typeof data?.detail ===
      "string"
        ? data.detail
        : Array.isArray(
            data?.detail
          )
        ? data.detail
            .map(
              (item) =>
                item?.msg ||
                String(item)
            )
            .join(", ")
        : data?.message ||
          `Request failed: ${response.status}`;


    const error =
      new Error(detail);


    error.status =
      response.status;


    error.data =
      data;


    throw error;
  }


  return data;
}


// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getDashboardStats() {

  return request(
    "/dashboard/stats"
  );

}


// ============================================================
// DASHBOARD PROGRESS
// ============================================================

export async function getDashboardProgress() {

  return request(
    "/dashboard/progress"
  );

}


// ============================================================
// QUIZ PERFORMANCE
// ============================================================

export async function getQuizPerformance() {

  return request(
    "/dashboard/quiz-performance"
  );

}


// ============================================================
// LEARNING ACTIVITY
// ============================================================

export async function getDashboardActivity(
  days = 14
) {

  const safeDays =
    Math.max(
      1,
      Math.min(
        90,
        Number(days) || 14
      )
    );


  return request(
    `/dashboard/activity?days=${safeDays}`
  );

}


// ============================================================
// COURSES
// ============================================================

export async function getDashboardCourses() {

  const data =
    await request(
      "/courses"
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


  if (
    Array.isArray(
      data?.results
    )
  ) {

    return data.results;

  }


  return [];

}


// ============================================================
// MY ENROLLMENTS
// ============================================================

export async function getMyEnrollments() {

  const data =
    await request(
      "/enrollments/me"
    );


  if (
    Array.isArray(data)
  ) {

    return data;

  }


  if (
    Array.isArray(
      data?.enrollments
    )
  ) {

    return data.enrollments;

  }


  if (
    Array.isArray(
      data?.items
    )
  ) {

    return data.items;

  }


  if (
    Array.isArray(
      data?.results
    )
  ) {

    return data.results;

  }


  return [];

}


// ============================================================
// COURSE PROGRESS
// ============================================================

export async function getDashboardCourseProgress(
  courseId
) {

  if (!courseId) {

    return null;

  }


  return request(
    `/courses/${courseId}/progress`
  );

}


// ============================================================
// LEARNING STREAK
// ============================================================

export async function getLearningStreak() {

  return request(
    "/dashboard/streak"
  );

}


// ============================================================
// RECORD LEARNING ACTIVITY
// ============================================================

export async function recordLearningActivity({

  activityType =
    "course_learning",

  courseId = null,

} = {}) {

  const params =
    new URLSearchParams();


  params.set(
    "activity_type",
    activityType
  );


  if (courseId) {

    params.set(
      "course_id",
      courseId
    );

  }


  return request(
    `/dashboard/activity?${params.toString()}`,
    {
      method: "POST",
    }
  );

}


// ============================================================
// NORMALIZE ID
// ============================================================

export function getId(item) {

  if (!item) {

    return null;

  }


  return (
    item.id ??
    item.course_id ??
    item.courseId ??
    item.uuid ??
    null
  );

}


// ============================================================
// COURSE NAME
// ============================================================

export function getCourseName(
  course
) {

  return (
    course?.title ||
    course?.name ||
    course?.course_name ||
    course?.course_title ||
    "Untitled Course"
  );

}


// ============================================================
// COURSE IMAGE
// ============================================================

export function getCourseImage(
  course
) {

  return (
    course?.image_url ||
    course?.image ||
    course?.thumbnail_url ||
    course?.thumbnail ||
    ""
  );

}


// ============================================================
// PROGRESS NUMBER
// ============================================================

export function getProgressPercent(
  progress
) {

  if (!progress) {

    return 0;

  }


  const value =
    progress.progress_percent ??
    progress.progress_percentage ??
    progress.percentage ??
    progress.progress ??
    0;


  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {

    return 0;

  }


  return Math.min(
    100,
    Math.max(
      0,
      number
    )
  );

}


// ============================================================
// EXPORT API BASE URL
// ============================================================

export {
  API_BASE_URL,
};
