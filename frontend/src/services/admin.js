import {
  getAccessToken,
} from "./instructor";

import {
  clearAuth,
} from "./auth";


const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


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
// REQUEST
// ============================================================

async function request(
  endpoint,
  options = {}
) {

  const token =
    getAccessToken();


  const headers = {
    Accept:
      "application/json",
    ...(options.headers || {}),
  };


  if (options.body) {

    headers[
      "Content-Type"
    ] = "application/json";

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

  } catch {

    throw new Error(
      "Cannot connect to Learnly backend."
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
// OVERVIEW
// ============================================================

export async function getAdminOverview() {

  return request(
    "/admin/analytics/overview"
  );

}


// ============================================================
// USERS
// ============================================================

export async function getAdminUsers(
  {
    search = "",
    role = "",
    status = "",
  } = {}
) {

  const params =
    new URLSearchParams();


  if (search.trim()) {

    params.set(
      "search",
      search.trim()
    );

  }


  if (role) {

    params.set(
      "role",
      role
    );

  }


  if (status) {

    params.set(
      "status",
      status
    );

  }


  const query =
    params.toString();


  const data =
    await request(
      `/admin/users${
        query
          ? `?${query}`
          : ""
      }`
    );


  return Array.isArray(data)
    ? data
    : [];

}


// ============================================================
// USER DETAIL
// ============================================================

export async function getAdminUser(
  userId
) {

  if (!userId) {

    throw new Error(
      "User ID is required."
    );

  }


  return request(
    `/admin/users/${userId}`
  );

}


// ============================================================
// ROLE
// ============================================================

export async function updateAdminUserRole(
  userId,
  roleName,
  action
) {

  return request(
    `/admin/users/${userId}/role`,
    {
      method: "PUT",

      body: JSON.stringify({
        role_name:
          roleName,

        action,
      }),
    }
  );

}


// ============================================================
// SUSPEND / ACTIVATE
// ============================================================

export async function updateAdminUserStatus(
  userId,
  isActive
) {

  return request(
    `/admin/users/${userId}/suspend`,
    {
      method: "PUT",

      body: JSON.stringify({
        is_active:
          Boolean(isActive),
      }),
    }
  );

}


// ============================================================
// DELETE USER
// ============================================================

export async function deleteAdminUser(
  userId
) {

  return request(
    `/admin/users/${userId}`,
    {
      method: "DELETE",
    }
  );

}


// ============================================================
// COURSES
// ============================================================

export async function getAdminCourses(
  status = ""
) {

  const query =
    status
      ? `?status=${encodeURIComponent(
          status
        )}`
      : "";


  const data =
    await request(
      `/admin/courses${query}`
    );


  return Array.isArray(data)
    ? data
    : [];

}


// ============================================================
// PENDING COURSES
// ============================================================

export async function getPendingAdminCourses() {

  const data =
    await request(
      "/admin/courses/pending"
    );


  return Array.isArray(data)
    ? data
    : [];

}


// ============================================================
// COURSE DECISION
// ============================================================

export async function decideAdminCourse(
  courseId,
  decision,
  comment = ""
) {

  return request(
    `/admin/courses/${courseId}/decision`,
    {
      method: "POST",

      body: JSON.stringify({
        decision,
        comment,
      }),
    }
  );

}


// ============================================================
// EXPORT
// ============================================================

export {
  API_BASE_URL,
};
