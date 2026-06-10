import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, loginWithGoogle, logout, cachedAccessToken, isSigningIn } from '../lib/firebase';
import { logActivity } from '../lib/auditLogger';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error?: string | null;
  login: (remember?: boolean, withScopes?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loginWithEmail: (email: string, pass: string, remember?: boolean) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      if (u) {
        const expiration = localStorage.getItem('auth_expiration');
        if (expiration && new Date().getTime() > parseInt(expiration, 10)) {
          console.warn("Session expired after 30 days");
          logout().then(() => {
            localStorage.removeItem('auth_expiration');
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
          });
          return;
        }

        setUser(u);
        
        // Admin check
        const superAdminEmail = 'hungthai84@gmail.com';
        if (u.email === superAdminEmail) {
          setIsAdmin(true);
        } else {
          // Option to check a collection in Firestore if needed
          // But according to user request, we focus on his email
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const setPersist = async (remember: boolean) => {
    if (remember) {
      const expirationDate = new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 30 days
      localStorage.setItem('auth_expiration', expirationDate.toString());
    } else {
      localStorage.removeItem('auth_expiration');
    }
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  };

  const login = async (remember = true, withScopes = false) => {
    setError(null);
    try {
      await setPersist(remember);
      const res = await loginWithGoogle(remember, withScopes);
      if (res?.user) {
        await logActivity('ĐĂNG_NHẬP', 'AUTHENTICATION', 'Đăng nhập thành công qua Google Auth');
      }
    } catch (err: any) {
      console.error("Login failed", err);
      const errorMessage = err.message || "";
      if (err.code === 'auth/cancelled-popup-request') {
        setError("Popup đăng nhập đã bị đóng trước khi hoàn tất. Vui lòng thử lại.");
      } else if (err.code === 'auth/popup-blocked' || errorMessage.includes('Pending promise was never set')) {
        setError("Trình duyệt đã chặn popup hoặc có lỗi môi trường. Vui lòng chạy ứng dụng ở tab mới (Open App / Mở trong thẻ mới) hoặc cho phép popup.");
      } else {
        setError("Đăng nhập thất bại: " + errorMessage);
      }
    }
  };

  const loginWithEmail = async (email: string, pass: string, remember = true) => {
    setError(null);
    try {
      await setPersist(remember);
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await logActivity('ĐĂNG_NHẬP', 'AUTHENTICATION', `Đăng nhập thành công bằng email: ${email}`);
      }
    } catch (err: any) {
       console.error("Login with email failed", err);
       if (err.code === 'auth/operation-not-allowed') {
         setError("Dịch vụ Đăng nhập bằng Email chưa được bật trong Firebase Console. Vui lòng sử dụng Đăng nhập bằng Google hoặc liên hệ quản trị viên.");
       } else {
         setError("Đăng nhập thất bại. Kiểm tra email/mật khẩu hoặc sử dụng Đăng nhập bằng Google.");
       }
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await logActivity('ĐĂNG_KÝ', 'AUTHENTICATION', `Đăng ký và khởi tạo tài khoản thành công cho: ${email}`);
      }
    } catch (err: any) {
       console.error("Register with email failed", err);
       if (err.code === 'auth/operation-not-allowed') {
         setError("Dịch vụ Đăng ký bằng Email chưa được bật trong Firebase Console. Vui lòng sử dụng Đăng nhập bằng Google.");
       } else {
         setError("Đăng ký thất bại. Vui lòng sử dụng Đăng nhập bằng Google.");
       }
    }
  };

  const logoutAction = async () => {
    try {
      const email = auth.currentUser?.email || 'N/A';
      await logActivity('ĐĂNG_XUẤT', 'AUTHENTICATION', `Người dùng đăng xuất hệ thống (${email})`);
      await logout();
    } catch (err: any) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout: logoutAction, loginWithEmail, registerWithEmail, error } as any}>
      {children}
    </AuthContext.Provider>
  );
};
