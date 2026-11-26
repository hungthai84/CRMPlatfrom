import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length
  ? getApp()
  : initializeApp({ projectId: firebaseConfig.projectId });

export const adminAuth = getAuth(app);
export default app;
