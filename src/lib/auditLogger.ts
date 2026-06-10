import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export const logActivity = async (action: string, resource: string, details: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("Skipping audit log: No user authenticated.");
    return;
  }

  const logPayload = {
    userId: currentUser.uid,
    email: currentUser.email || 'unknown@example.com',
    action,
    resource,
    details,
    timestamp: Date.now()
  };

  try {
    await addDoc(collection(db, 'audit_logs'), logPayload);
    console.log("Audit log saved:", logPayload);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
