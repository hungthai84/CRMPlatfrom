import React from 'react';
import { ShieldCheck, Sparkles, Layers, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Primitives';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle, authError } = useAuth();

  return (
    <div className="min-h-screen ocean-gradient flex items-center justify-center p-4 sm:p-8 text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-white/15 bg-[#0b1730]/85 backdrop-blur-xl shadow-2xl">
        {/* Left Brand Overview */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-[#102a56] to-[#0b1730] border-b lg:border-b-0 lg:border-r border-white/10">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-lg blue-cyan-gradient flex items-center justify-center font-bold text-white text-sm">
                1C
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">ONECRM</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-balance">
              Hệ thống Quản trị Quan hệ Khách hàng Thông minh
            </h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Nền tảng All-in-One CRM hợp nhất 18 phân hệ: Customer 360°, Lead, Sales Pipeline, Omnichannel Inbox, Ticket SLA, Workflow Automation và Gemini AI Copilot.
            </p>
          </div>

          <div className="mt-8 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#22c7e8] shrink-0" />
              <span>Kiến trúc Multi-tenant cô lập dữ liệu theo Tổ chức</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#22c7e8] shrink-0" />
              <span>Phân quyền RBAC 13 vai trò & Firestore Security Rules</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#22c7e8] shrink-0" />
              <span>AI Copilot server-side tuân thủ phạm vi truy cập</span>
            </div>
          </div>
        </div>

        {/* Right Login Action */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white dark:bg-[#0f2142] text-slate-900 dark:text-white">
          <div className="max-w-sm mx-auto w-full">
            <div className="w-10 h-10 rounded-xl bg-[#1951fc]/10 text-[#1951fc] dark:text-[#22c7e8] flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Đăng nhập Hệ thống</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Sử dụng tài khoản Google đã xác thực qua Firebase Authentication để truy cập không gian làm việc doanh nghiệp của bạn.
            </p>

            {authError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {authError}
              </div>
            )}

            <Button onClick={signInWithGoogle} className="w-full mt-6 py-2.5">
              Đăng nhập bằng Google
            </Button>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-6 leading-relaxed">
              Khi đăng nhập lần đầu, hệ thống tự động khởi tạo Không gian Tổ chức riêng biệt cùng bộ dữ liệu mẫu Demo Mode (có thể xóa bất kỳ lúc nào).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
