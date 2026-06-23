import { auth } from "./firebase.ts";

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
 * Synchronize the current user profile on login.
 */
export async function syncUserWithDb(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const res = await fetch("/api/users/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Sync failed with status code: ${res.status}`);
    }

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("Failed to sync user with Cloud SQL:", error);
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

    const res = await fetch("/api/sessions", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed code: ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch session logs from Cloud SQL:", error);
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

    const res = await fetch("/api/sessions/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(log)
    });

    if (!res.ok) {
      throw new Error(`Sync session failed status: ${res.status}`);
    }

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("Failed to sync session with Cloud SQL:", error);
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

    const res = await fetch("/api/sessions/clear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("Failed to clear session logs in Cloud SQL:", error);
    return false;
  }
}
