import { db } from "./index.ts";
import { users, sessionLogs } from "./schema.ts";
import { eq, desc } from "drizzle-orm";

/**
 * Registers or updates a user in the Cloud SQL database.
 * Preserves the original ID and email.
 */
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed in getOrCreateUser:", error);
    throw new Error("Failed to sync user database profile.", { cause: error });
  }
}

/**
 * Retrieves all session logs for a specific email or user.
 */
export async function getSessionLogsByEmail(email: string) {
  try {
    return await db.select()
      .from(sessionLogs)
      .where(eq(sessionLogs.email, email))
      .orderBy(desc(sessionLogs.loginTime));
  } catch (error) {
    console.error("Database query failed in getSessionLogsByEmail:", error);
    throw new Error("Failed to retrieve session logs from database.", { cause: error });
  }
}

/**
 * Saves or updates a session log in the Cloud SQL database.
 */
export async function syncSessionLog(log: {
  sessionId: string;
  email: string;
  loginTime: number;
  logoutTime: number | null;
  activeTime: number;
  status: string;
}) {
  try {
    if (!log.sessionId) {
      throw new Error("Session ID is required for sync.");
    }

    // Ensure we handle numeric strings if they come from the API
    const loginTs = typeof log.loginTime === 'string' ? parseInt(log.loginTime, 10) : log.loginTime;
    const logoutTs = typeof log.logoutTime === 'string' ? parseInt(log.logoutTime, 10) : log.logoutTime;

    const loginDate = new Date(loginTs);
    const logoutDate = logoutTs ? new Date(logoutTs) : null;

    if (isNaN(loginDate.getTime())) {
      throw new Error(`Invalid login time provided: ${log.loginTime}`);
    }

    const result = await db.insert(sessionLogs)
      .values({
        sessionId: log.sessionId,
        email: log.email,
        loginTime: loginDate,
        logoutTime: logoutDate,
        activeTime: Math.floor(log.activeTime || 0),
        status: log.status,
      })
      .onConflictDoUpdate({
        target: sessionLogs.sessionId,
        set: {
          logoutTime: logoutDate,
          activeTime: Math.floor(log.activeTime || 0),
          status: log.status,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed in syncSessionLog:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to synchronize session log: ${error.message}`, { cause: error });
    }
    throw new Error("Failed to synchronize session logs on cloud server.", { cause: error });
  }
}

/**
 * Clear all session logs for an email
 */
export async function clearSessionLogsByEmail(email: string) {
  try {
    // Keep active session log if needed, or clear all completed/timeout ones
    await db.delete(sessionLogs)
      .where(eq(sessionLogs.email, email));
  } catch (error) {
    console.error("Database query failed in clearSessionLogsByEmail:", error);
    throw new Error("Failed to clear session logs.", { cause: error });
  }
}
