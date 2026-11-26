import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutFirebase, handleFirestoreError, OperationType } from '../lib/firebase';
import { RoleId } from '../types/crm';
import { hasPermission } from '../constants/rbac';
import type { ModuleKey, PermissionAction } from '../types/crm';

interface UserProfileDoc {
  uid: string;
  email: string;
  displayName: string;
  role: RoleId;
  organizationId: string;
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfileDoc | null;
  activeRole: RoleId;
  setActiveRolePreview: (role: RoleId) => void;
  isSuperAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  can: (module: ModuleKey, action: PermissionAction) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [activeRole, setActiveRole] = useState<RoleId>('org_owner');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setAuthError(null);

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      const isBootstrapAdmin = firebaseUser.email?.toLowerCase() === 'hungthai84@gmail.com';
      const defaultOrgId = `org_${firebaseUser.uid.slice(0, 16)}`;

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const existing = snap.data() as UserProfileDoc;
          setProfile(existing);
          setActiveRole(existing.role || (isBootstrapAdmin ? 'super_admin' : 'org_owner'));
        } else {
          const now = Date.now();
          const newProfile: UserProfileDoc = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'user@onecrm.local',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: isBootstrapAdmin ? 'super_admin' : 'org_owner',
            organizationId: defaultOrgId,
            createdAt: now,
            updatedAt: now,
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
          setActiveRole(newProfile.role);
        }
      } catch (err) {
        // Fallback profile in memory while preserving real Firebase auth user
        const fallbackRole: RoleId = isBootstrapAdmin ? 'super_admin' : 'org_owner';
        setProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          role: fallbackRole,
          organizationId: defaultOrgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setActiveRole(fallbackRole);
        try {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        } catch (structuredErr) {
          console.warn('Profile sync warning:', structuredErr);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-blocked')) {
        setAuthError('Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup và thử lại.');
      } else if (msg.includes('cancelled-popup-request') || msg.includes('popup-closed-by-user')) {
        setAuthError('Cửa sổ đăng nhập đã đóng trước khi hoàn tất.');
      } else {
        setAuthError(`Đăng nhập thất bại: ${msg}`);
      }
    }
  };

  const signOut = async () => {
    await logoutFirebase();
    setUser(null);
    setProfile(null);
  };

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'hungthai84@gmail.com' || profile?.role === 'super_admin';

  const setActiveRolePreview = (role: RoleId) => {
    // Only Super Admin or Org Owner may preview different RBAC perspectives in UI
    if (profile?.role === 'super_admin' || profile?.role === 'org_owner' || isSuperAdmin) {
      setActiveRole(role);
    }
  };

  const can = (module: ModuleKey, action: PermissionAction) => hasPermission(activeRole, module, action);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeRole,
        setActiveRolePreview,
        isSuperAdmin,
        loading,
        authError,
        signInWithGoogle,
        signOut,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
