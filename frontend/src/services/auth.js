// ============================================================
// LEARNLY - CENTRAL AUTH STORAGE
// ============================================================

export const TOKEN_KEY = "learnly_access_token";
export const USER_KEY = "learnly_user";

const LEGACY_TOKEN_KEYS = [
  "access_token",
  "token",
  "auth_token",
  "accessToken",
  "jwt",
];

const LEGACY_USER_KEYS = [
  "user",
  "current_user",
];

export function getAccessToken() {
  const canonical = localStorage.getItem(TOKEN_KEY);
  if (canonical) return canonical;

  for (const key of LEGACY_TOKEN_KEYS) {
    const token = localStorage.getItem(key);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      return token;
    }
  }

  return "";
}

export function getStoredUser() {
  const keys = [USER_KEY, ...LEGACY_USER_KEYS];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const user = JSON.parse(raw);
      if (user) {
        if (key !== USER_KEY) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        return user;
      }
    } catch {
      // Ignore malformed legacy data.
    }
  }

  return null;
}

export function saveAuth(data) {
  const token = data?.access_token;

  // Remove stale tokens first. This is important because older
  // versions of Learnly used different localStorage keys.
  [TOKEN_KEY, ...LEGACY_TOKEN_KEYS].forEach((key) => {
    localStorage.removeItem(key);
  });

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    // Keep one legacy key temporarily so older pages/components
    // remain compatible while the app is being upgraded.
    localStorage.setItem("access_token", token);
  }

  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
}

export function clearAuth() {
  [TOKEN_KEY, ...LEGACY_TOKEN_KEYS].forEach((key) => {
    localStorage.removeItem(key);
  });

  [USER_KEY, ...LEGACY_USER_KEYS].forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function getRoles(user = getStoredUser()) {
  if (!user) return [];

  if (Array.isArray(user.roles)) {
    return user.roles.map((role) => String(role).toLowerCase());
  }

  if (user.role) {
    return [String(user.role).toLowerCase()];
  }

  return [];
}

export function isInstructor(user = getStoredUser()) {
  const roles = getRoles(user);
  return roles.includes("instructor") || roles.includes("admin");
}

export function isAdmin(user = getStoredUser()) {
  return getRoles(user).includes("admin");
}

export function isStudent(user = getStoredUser()) {
  const roles = getRoles(user);
  return roles.includes("student") || roles.length === 0;
}

export function migrateAuthStorage() {
  getAccessToken();
  getStoredUser();
}
