import { auth } from "./firebase";

/**
 * Retrieves the authorization token for backend API requests.
 * Supports standard Firebase ID Token and a mock token fallback for local CRM profiles.
 */
export async function getAuthToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      return await currentUser.getIdToken();
    } catch (e) {
      console.warn("Failed to get Firebase ID Token", e);
    }
  }

  // Fallback to local mockup/backup accounts
  if (typeof window !== 'undefined') {
    const backupUserStr = localStorage.getItem('backup_auth_user');
    if (backupUserStr) {
      try {
        const backupUser = JSON.parse(backupUserStr);
        if (backupUser && backupUser.uid) {
          const payload = {
            uid: backupUser.uid,
            email: backupUser.email || 'unknown@example.com'
          };
          // Base64 encode details to create standard developer test token
          return 'mock_' + btoa(JSON.stringify(payload));
        }
      } catch (e) {
        console.warn("Generating mock token failed", e);
      }
    }
  }
  return null;
}

/**
 * Helper to fetch JSON from the backend with auto-retries for resiliency
 * during server wake-up/initialization periods.
 */
async function fetchJson(url: string, options: RequestInit, retries = 3, delayMs = 1500): Promise<any> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`Sync failed with status code: ${res.status}`);
      }
      
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html") || contentType.includes("application/xhtml+xml")) {
        throw new Error("Server returned HTML page. The API server may still be initializing.");
      }
      
      return await res.json();
    } catch (err: any) {
      lastError = err;
      console.warn(`[API FETCH TRY ${i + 1}/${retries} FAILED for ${url}]:`, err.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

/**
 * Synchronize the current user profile on login.
 */
export async function syncUserWithDb(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const data = await fetchJson("/api/users/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    return data.success === true;
  } catch (error: any) {
    console.error("Failed to sync user with Cloud SQL:", error.message || error);
    return false;
  }
}

/**
 * Get all session logs from PostgreSQL.
 */
export async function fetchSessionLogsFromDb() {
  try {
    const token = await getAuthToken();
    if (!token) return [];

    const data = await fetchJson("/api/sessions", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error("Failed to fetch session logs from Cloud SQL:", error.message || error);
    return [];
  }
}

/**
 * Sync a single session log (inserts or updates state).
 */
export async function syncSessionWithDb(log: {
  sessionId: string;
  loginTime: number;
  logoutTime: number | null;
  activeTime: number;
  status: string;
}): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const data = await fetchJson("/api/sessions/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(log)
    });

    return data.success === true;
  } catch (error: any) {
    console.error("Failed to sync session with Cloud SQL:", error.message || error);
    return false;
  }
}

/**
 * Clear session logs in Postgres for authenticated user
 */
export async function clearSessionLogsInDb(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const data = await fetchJson("/api/sessions/clear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    return data.success === true;
  } catch (error: any) {
    console.error("Failed to clear session logs in Cloud SQL:", error.message || error);
    return false;
  }
}
