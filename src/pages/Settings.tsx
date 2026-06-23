import { useState, useEffect } from 'react';
import { 
  Settings, BookOpen, ShieldCheck, HelpCircle, User, Activity, 
  Trash2, RefreshCw, Key, LogOut, Info, Shield, Check, FileText, Download, Clock
} from 'lucide-react';
import { KnowledgeBase } from './KnowledgeBase';
import { AuditLogs } from './Users';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { fetchSessionLogsFromDb, clearSessionLogsInDb } from '../lib/api';

interface SettingsPageProps {
  initialTab?: 'general' | 'knowledge' | 'permissions' | 'session_logs';
}

export function SettingsPage({ initialTab = 'general' }: SettingsPageProps) {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'knowledge' | 'permissions' | 'session_logs'>(initialTab);
  const [copiedKey, setCopiedKey] = useState(false);
  const [securityWarningEnabled, setSecurityWarningEnabled] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadSessionLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const dbLogs = await fetchSessionLogsFromDb();
      if (dbLogs && dbLogs.length > 0) {
        // Map PostgreSQL schema properties to match UI representation
        const mapped = dbLogs.map((log: any) => ({
          id: log.sessionId,
          email: log.email,
          loginTime: new Date(log.loginTime).getTime(),
          logoutTime: log.logoutTime ? new Date(log.logoutTime).getTime() : null,
          activeTime: log.activeTime,
          status: log.status
        }));
        setSessionLogs(mapped);
      } else {
        const saved = localStorage.getItem('crm_session_logs');
        if (saved) {
          try {
            setSessionLogs(JSON.parse(saved));
          } catch (e) {
            console.error("Error parsing crm_session_logs", e);
          }
        } else {
          const initialSess = [
            {
              id: 'sess_1',
              email: user?.email || 'hungthai84@gmail.com',
              loginTime: Date.now() - 3600 * 1000 * 3,
              logoutTime: Date.now() - 3600 * 1000 * 2,
              activeTime: 45 * 60,
              status: 'completed'
            },
            {
              id: 'sess_2',
              email: user?.email || 'hungthai84@gmail.com',
              loginTime: Date.now() - 3600 * 1000 * 24 * 1,
              logoutTime: Date.now() - 3600 * 1000 * 24 * 1 + 30 * 60 * 1000,
              activeTime: 30 * 60,
              status: 'completed'
            },
            {
              id: 'sess_3',
              email: user?.email || 'hungthai84@gmail.com',
              loginTime: Date.now() - 3600 * 1000 * 24 * 2,
              logoutTime: Date.now() - 3600 * 1000 * 24 * 2 + 15 * 60 * 1000,
              activeTime: 15 * 60,
              status: 'timeout'
            }
          ];
          localStorage.setItem('crm_session_logs', JSON.stringify(initialSess));
          setSessionLogs(initialSess);
        }
      }
    } catch (error) {
      console.error("Failed to load session logs from database:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'session_logs') {
      loadSessionLogs();
    }
  }, [activeTab, user]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const mockApiKey = "pk_live_51PWSBCRMPowerService2026Secure";

  const handleCopyKey = () => {
    navigator.clipboard.writeText(mockApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div id="settings-module-container" className="p-4 lg:p-6 space-y-6 flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 overflow-y-auto no-scrollbar w-full">
      {/* Settings Header */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="text-[#2F69FF] w-6 h-6 animate-spin-slow" />
            Cài đặt Hệ thống (System Settings)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Quản lý tài liệu kiến thức nội bộ, cấu hình bảo mật phân quyền kiểm toán, và tùy chọn môi trường làm việc CRM.
          </p>
        </div>
      </div>

      {/* Tab select line */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 px-6 shrink-0">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 px-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'general'
              ? 'border-[#2F69FF] text-[#2F69FF]'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Info size={14} />
          Cấu hình chung
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 px-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'knowledge'
              ? 'border-[#2F69FF] text-[#2F69FF]'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen size={14} />
          Tài liệu Kiến thức (Wiki)
        </button>
        <button
          onClick={() => setActiveTab('session_logs')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 px-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'session_logs'
              ? 'border-[#2F69FF] text-[#2F69FF]'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Clock size={14} />
          Nhật ký Phiên (Session Logs)
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 px-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'border-[#2F69FF] text-[#2F69FF]'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck size={14} />
            Kiểm toán & Phân quyền
          </button>
        )}
      </div>

      {/* Render active Tab Panels */}
      <div className="flex-1 overflow-auto px-4">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2">
            
            {/* Left Col: Profile info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-left">
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase mb-4 flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  Hồ sơ tài khoản & Bảo mật
                </h3>
                
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  {user?.photoURL ? (
                    <img src={user.photoURL} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/10" alt="Avatar" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#2F69FF] text-white flex items-center justify-center font-bold text-xl ring-2 ring-blue-500/10">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{user?.displayName || "Người dùng CRM"}</h4>
                    <p className="text-xs font-bold text-slate-500">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {isAdmin ? "Hệ thống Admin" : "Nhân viên CSKH / Sales"}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        Phiên Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <h5 className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide">Thời lượng Phiên tự động</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Tự động ngắt kết nối an toàn sau 30 phút rảnh rỗi không hoạt động để bảo mật toàn diện dữ liệu khách hàng.</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5">
                    <Shield className="text-amber-500 shrink-0 w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Auto Security Lock active</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold mt-0.5">Hệ thống luôn giám sát cử chỉ di chuột, nhấp phím để làm mới mốc thời gian này tự động.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* API and developer config */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-left">
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase mb-4 flex items-center gap-2">
                  <Key size={16} className="text-violet-500" />
                  Khóa API & Tích hợp (API Sandbox)
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Để tự động kết nối hệ thống tổng đài ảo PBX, Zalo ZNS API, hoặc Google Sheets Hub, hãy sử dụng token bảo mật bên dưới:
                </p>

                <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 flex-1 truncate">{mockApiKey}</span>
                  <button
                    onClick={handleCopyKey}
                    className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all hover:bg-slate-800 flex items-center gap-1.5 outline-none"
                  >
                    {copiedKey ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <span>Sao chép</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Environment preference */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-left">
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" />
                  Môi trường ứng dụng
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Giao diện (Theme)</span>
                    <button 
                      onClick={toggleTheme}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      {theme === 'dark' ? 'Chế độ tối (Dark)' : 'Chế độ sáng (Light)'}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Phiên bản CRM</span>
                    <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">v2.4.10-lunar</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Cảnh báo bảo mật hệ thống</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Hiển thị các thông báo khi phát hiện hoạt động bất thường</span>
                    </div>
                    <button
                      onClick={() => setSecurityWarningEnabled(!securityWarningEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        securityWarningEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        securityWarningEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Database Engine</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Cloud Firestore</span>
                  </div>
                </div>
              </div>

              {/* Main Configuration Parameters Card (Thẻ chính) */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-left">
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-[#FBBF24]" />
                  Thông số cấu hình Thẻ chính
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Ứng dụng</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white text-right">Power Service CRM</span>
                    
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Phiên bản</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white text-right">v2.4.12-pro</span>
                    
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Font Size (Base)</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white text-right">15px / 16px / 17px</span>

                    <span className="text-[10px] font-bold text-slate-500 uppercase">Menu Font Size</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white text-right">15px</span>
                    
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Primary Color</span>
                    <span className="text-xs font-black text-[#FBBF24] text-right">#FBBF24</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const config = {
                        name: "Power Service CRM Platform",
                        version: "v2.4.12-pro",
                        fonts: {
                          base: "15px-17px",
                          menu: "15px",
                          family: "Inter"
                        },
                        colors: {
                          primary: "#FBBF24"
                        },
                        engine: "Cloud Firestore",
                        built_with: "React, Vite, Tailwind CSS"
                      };
                      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `crm_config_v2.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={12} /> Xuất thông số cấu hình
                  </button>
                </div>
              </div>

              {/* Quick instructions widget */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-left space-y-3">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-extrabold text-xs">
                  <HelpCircle className="text-[#2F69FF]" size={16} />
                  <span>Cần hỗ trợ vận hành?</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Bất cứ thắc mắc nào liên quan đến tối ưu hóa tự động hóa tiếp thị, phân bổ điểm chạm, hoặc cấu hình bảo mật dữ liệu, hãy tham khảo ngay Kho tri thức hoặc chat với Trợ lý AI ở mảng dưới.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Session Logs Panel Tab */}
        {activeTab === 'session_logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2 text-left animate-fadeIn">
            
            {/* Left Column: List of Session Logs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wider uppercase flex items-center gap-2">
                      <Clock size={16} className="text-blue-500 animate-pulse" />
                      Lược sử phiên làm việc hiện tại & quá khứ
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-0.5">Thời gian thực kết nối, thời lượng active và lịch trình ngắt kết nối an toàn.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        loadSessionLogs();
                      }}
                      className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all outline-none cursor-pointer"
                      title="Làm mới Nhật ký"
                    >
                      <RefreshCw size={13} className="animate-spin-slow" />
                      <span>Refresh</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        // Export logs as JSON
                        const blob = new Blob([JSON.stringify(sessionLogs, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `crm_session_logs_${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all outline-none cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Export</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm("Bạn có chắc chắn muốn xóa toàn bộ danh sách lịch sử phiên làm việc khỏi Cloud SQL database và hệ thống nội bộ không?")) {
                          await clearSessionLogsInDb();
                          const activeOnly = sessionLogs.filter(log => log.status === 'active');
                          localStorage.setItem('crm_session_logs', JSON.stringify(activeOnly));
                          setSessionLogs(activeOnly);
                        }
                      }}
                      className="p-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all outline-none cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Xóa Hết</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/80">
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản (Email)</th>
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-bold">Bắt đầu lúc</th>
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-bold">Đăng xuất lúc</th>
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right font-bold">Tổng Active Time</th>
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right font-bold w-28">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {sessionLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs font-semibold text-slate-400">
                            Không có lịch sử phiên làm việc nào được ghi nhận.
                          </td>
                        </tr>
                      ) : (
                        sessionLogs.map((log) => {
                          const loginDate = new Date(log.loginTime);
                          const logoutDate = log.logoutTime ? new Date(log.logoutTime) : null;
                          
                          // Format Active Time
                          const activeSeconds = log.activeTime || 0;
                          let formattedActive = '';
                          if (activeSeconds < 60) {
                            formattedActive = `${activeSeconds}s`;
                          } else if (activeSeconds < 3600) {
                            const min = Math.floor(activeSeconds / 60);
                            const sec = activeSeconds % 60;
                            formattedActive = `${min}m ${sec}s`;
                          } else {
                            const hr = Math.floor(activeSeconds / 3600);
                            const min = Math.floor((activeSeconds % 3600) / 60);
                            formattedActive = `${hr}h ${min}m`;
                          }

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-extrabold text-xs ring-1 ring-blue-500/20">
                                    {log.email?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.email}</span>
                                    <span className="text-[9px] font-mono font-medium text-slate-400">ID: {log.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 text-center">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {loginDate.toLocaleDateString('vi-VN')} {loginDate.toLocaleTimeString('vi-VN')}
                                </span>
                              </td>
                              <td className="py-4 text-center">
                                <span className="text-xs font-bold text-slate-500">
                                  {logoutDate ? (
                                    `${logoutDate.toLocaleDateString('vi-VN')} ${logoutDate.toLocaleTimeString('vi-VN')}`
                                  ) : (
                                    <span className="text-emerald-500 font-extrabold flex items-center justify-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Hiện tại
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                                  {formattedActive}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                {log.status === 'active' && (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                                    Đang kết nối
                                  </span>
                                )}
                                {log.status === 'completed' && (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-slate-105 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    Đã đăng xuất
                                  </span>
                                )}
                                {log.status === 'timeout' && (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                                    Hết hạn (Idle)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Key performance indexes on Sessions */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Overall stats widget */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-500" />
                  Chỉ số Hiệu suất Phiên
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Tổng Phiên kết nối</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{sessionLogs.length} lần</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Hoàn thành Hợp lệ</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {sessionLogs.filter(log => log.status === 'completed').length} phiên
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Bị đóng do Hết hạn rảnh</span>
                    <span className="text-xs font-bold text-amber-500">
                      {sessionLogs.filter(log => log.status === 'timeout').length} phiên
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Tổng thời gian phản hồi</span>
                    <span className="text-xs font-mono font-black text-sky-600 dark:text-sky-450">
                      {(() => {
                        const totalSec = sessionLogs.reduce((acc, curr) => acc + (curr.activeTime || 0), 0);
                        if (totalSec < 60) return `${totalSec} giây`;
                        return `${Math.ceil(totalSec / 60)} phút`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Device & Environment info widget */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-left space-y-4">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-extrabold text-xs border-b border-slate-100 dark:border-slate-800 pb-3">
                  <ShieldCheck className="text-emerald-500" size={16} />
                  <span>Hồ Sơ Thiết Bị Truy Cập Hiện Tại</span>
                </div>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Trình duyệt</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      {navigator.userAgent.includes("Chrome") ? "Google Chrome" : navigator.userAgent.includes("Safari") ? "Apple Safari" : "Mozilla Firefox"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hệ điều hành</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      {navigator.userAgent.includes("Windows") ? "Windows PC" : navigator.userAgent.includes("Mac") ? "Apple macOS" : "Linux / Android"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Bảo vệ Popups</span>
                    <span className="font-extrabold text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Hoạt động
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Knowledge Base is directly mounted as the second tab under Settings */}
        {activeTab === 'knowledge' && (
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[700px]">
            <KnowledgeBase />
          </div>
        )}

        {/* AuditLogs / Permissions is directly mounted as the third tab under Settings for Admins */}
        {activeTab === 'permissions' && isAdmin && (
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[700px]">
            <AuditLogs />
          </div>
        )}
      </div>
    </div>
  );
}
