import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuthScreen() {
  const { login: loginWithGoogle, loginWithEmail, registerWithEmail, error: authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await loginWithEmail(email, password, rememberMe);
    } else {
      await registerWithEmail(email, password);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#3370FF] p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[10%] w-[40rem] h-[40rem] bg-indigo-300/60 rounded-full mix-blend-multiply blur-[128px] opacity-70 animate-blob pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[10%] w-[40rem] h-[40rem] bg-rose-300/50 rounded-full mix-blend-multiply blur-[128px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: [0, -10, 0],
          scale: 1 
        }}
        transition={{
          opacity: { duration: 0.8, ease: "easeOut" },
          scale: { duration: 0.8, ease: "easeOut" },
          y: {
            repeat: Infinity,
            repeatType: "reverse",
            duration: 6,
            ease: "easeInOut"
          }
        }}
        whileHover={{ 
          scale: 1.025,
          boxShadow: "0 50px 130px rgba(0,0,0,0.12)",
          borderColor: "rgba(99, 102, 241, 0.45)"
        }}
        className="relative z-10 p-10 bg-white/70 backdrop-blur-3xl rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-slate-200/50 max-w-md w-full transition-shadow duration-300 pointer-events-auto cursor-default"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            CRM System
          </h1>
          <p className="text-slate-600 font-medium">
            {isLogin ? 'Đăng nhập vào bảng điều khiển' : 'Tạo tài khoản mới'}
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-4 bg-rose-50/80 border border-rose-200 text-rose-700 rounded-2xl text-sm font-semibold flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{authError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all font-medium text-slate-800"
              placeholder="nhap@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Mật khẩu</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all font-medium text-slate-800"
              placeholder="••••••••"
            />
          </div>

          {isLogin && (
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm font-semibold text-slate-600">
                Lưu trạng thái đăng nhập (30 ngày)
              </label>
            </div>
          )}

          <button 
            type="submit"
            className="w-full px-6 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
          >
            {isLogin ? (
              <><LogIn size={18} /> Đăng nhập</>
            ) : (
              <><UserPlus size={18} /> Đăng ký tài khoản</>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hoặc</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        <button 
          onClick={() => loginWithGoogle(rememberMe)}
          type="button"
          className="w-full mt-6 px-6 py-3.5 bg-white text-slate-700 font-bold rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-sm flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google Logo" />
          Tiếp tục với Google
        </button>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
