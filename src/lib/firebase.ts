import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Note: Ensure firebase-applet-config.json exists
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig as any);
export const db = initializeFirestore(app, {
  databaseId: (firebaseConfig as any).firestoreDatabaseId || undefined,
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
} as any);
export const auth = getAuth(app);

// In-memory token cache with local/session storage restore for persistent sessions
export let cachedAccessToken: string | null = typeof window !== 'undefined'
  ? (localStorage.getItem('google_access_token') || sessionStorage.getItem('google_access_token'))
  : null;
export let isSigningIn = false;

// Use popup for AI Studio compatibility
export const loginWithGoogle = async (remember = true, withScopes = false) => {
  if (isSigningIn) {
    console.warn('Sign in already in progress.');
    return;
  }
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    if (withScopes) {
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    }
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      console.warn('Failed to get access token from Firebase Auth');
    } else {
      cachedAccessToken = credential.accessToken;
      if (remember) {
        localStorage.setItem('google_access_token', credential.accessToken);
      } else {
        sessionStorage.setItem('google_access_token', credential.accessToken);
      }
    }
    return result;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_access_token');
  }
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
