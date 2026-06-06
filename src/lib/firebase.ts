import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Note: Ensure firebase-applet-config.json exists
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig as any);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// In-memory token cache
export let cachedAccessToken: string | null = null;
export let isSigningIn = false;

// Use popup for AI Studio compatibility
export const loginWithGoogle = async () => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      console.warn('Failed to get access token from Firebase Auth');
    } else {
      cachedAccessToken = credential.accessToken;
    }
    return result;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  cachedAccessToken = null;
  return signOut(auth);
};

export const getAccessToken = () => {
  return cachedAccessToken;
};

// Validate Connection
async function testConnection() {
  try {
    // Try to get a non-existent doc to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase connection test failed: mechanical offline state detected or client is offline.", error);
      console.warn("Please check your Firebase configuration. The client appears to be offline.");
    } else {
      console.warn("Firebase connection test completed with expected permission error:", error);
    }
  }
}
testConnection();

// Error handler utility
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
