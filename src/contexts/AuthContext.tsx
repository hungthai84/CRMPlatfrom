import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logout, cachedAccessToken, isSigningIn } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error?: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        if (!cachedAccessToken && !isSigningIn) {
          // Force re-login if we have a user but no access token
          logout().then(() => {
            setUser(null);
            setLoading(false);
          });
          return;
        }
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.code === 'auth/cancelled-popup-request') {
        setError("Popup đăng nhập đã bị đóng trước khi hoàn tất. Vui lòng thử lại.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Trình duyệt đã chặn popup. Vui lòng cho phép popup để hiển thị.");
      } else {
        setError(err.message || "Đăng nhập thất bại.");
      }
    }
  };

  const logoutAction = async () => {
    try {
      await logout();
    } catch (err: any) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout: logoutAction, error } as any}>
      {children}
    </AuthContext.Provider>
  );
};
