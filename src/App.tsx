/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Customer360 } from './pages/Customer360';
import { Customers } from './pages/Customers';
import { SupportTickets } from './pages/SupportModule';
import { MarketingAI } from './pages/MarketingAI';
import { SalesPipeline } from './pages/SalesPipeline';
import { ArchitectureDocs } from './pages/ArchitectureDocs';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuthScreen } from './pages/Auth';

import { AIChatWidget } from './components/AIChatWidget';
import { QuickNoteWidget } from './components/QuickNoteWidget';

import { Tasks } from './pages/Tasks';
import { AuditLogs } from './pages/Users';

import { Documents } from './pages/Documents';
import { LoyaltyManagement } from './pages/Loyalty';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Journey } from './pages/Journey';
import { Omnichannel } from './pages/Omnichannel';
import { Leads } from './pages/Leads';
import { Surveys } from './pages/Surveys';
import { SettingsPage } from './pages/Settings';
import { GlobalSearchOverlay } from './components/GlobalSearchOverlay';
import { Reports } from './pages/Reports';
import { Workflows } from './pages/Workflows';
import { EmailTemplates } from './pages/EmailTemplates';
import { EnterpriseArchitecture } from './pages/EnterpriseArchitecture';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, loading, logout: authLogout } = useAuth();
  const { addToast } = useToast();

  // Idle session expiration states
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isTestMode, setIsTestMode] = useState(false);

  const IDLE_LIMIT = 120 * 1000; // 2 minutes (120s)
  const currentIdleLimit = isTestMode ? 10 * 1000 : IDLE_LIMIT; // 10s for demo/test mode

  // Log activities or inputs to reset the timer
  useEffect(() => {
    if (!user) return;

    let activityTimeout: NodeJS.Timeout;

    const resetIdleTimer = () => {
      if (isIdleWarningOpen) return;
      clearTimeout(activityTimeout);
      
      activityTimeout = setTimeout(() => {
        setIsIdleWarningOpen(true);
        setCountdown(30);
      }, currentIdleLimit);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Initialize timer
    resetIdleTimer();

    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [user, isIdleWarningOpen, currentIdleLimit]);

  // Countdown timer tick when warn dialog is displayed
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    if (isIdleWarningOpen && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [isIdleWarningOpen, countdown]);

  // Handle session expiration when countdown hits 0
  useEffect(() => {
    if (isIdleWarningOpen && countdown === 0) {
      setIsIdleWarningOpen(false);
      addToast(
        'Phiên làm việc hết hạn',
        'Bạn đã tự động đăng xuất do không hoạt động trong thời gian dài.',
        'warning',
        'system'
      );
      authLogout();
    }
  }, [isIdleWarningOpen, countdown, authLogout, addToast]);

  const handleExtendSession = () => {
    setIsIdleWarningOpen(false);
    addToast(
      'Gia hạn phiên làm việc',
      'Tiến trình làm việc của bạn đã được bảo vệ và gia hạn thành công.',
      'success',
      'system'
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Cmd+N or Ctrl+N for new record (e.g., Quick Add User)
      if ((e.metaKey || e.ctrlKey) && key === 'n') {
        e.preventDefault();
        setCurrentTab('customers');
        // This will navigate to customers where the 'New Customer' button can be focused or a modal could open
      }

      // Switch to Sales Pipeline: Cmd/Ctrl + Shift + S OR Alt + S
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && key === 's') ||
        (e.altKey && key === 's')
      ) {
        e.preventDefault();
        setCurrentTab('sales');
        addToast(
          'Đã chuyển hướng nhanh',
          'Chuyển sang phân hệ Đường ống kinh doanh (Sales Pipeline) qua phím tắt.',
          'info',
          'system'
        );
      }

      // Switch to Support Tickets: Cmd/Ctrl + Shift + T OR Alt + T
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && key === 't') ||
        (e.altKey && key === 't')
      ) {
        e.preventDefault();
        setCurrentTab('tickets');
        addToast(
          'Đã chuyển hướng nhanh',
          'Chuyển sang phân hệ Ticket hỗ trợ (Support Tickets) qua phím tắt.',
          'info',
          'system'
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F69FF]"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers onSelect={(id) => { setSelectedCustomerId(id); setCurrentTab('customer360'); }} />;
      case 'customer360':
        return <Customer360 customerId={selectedCustomerId} onBack={() => { setCurrentTab('customers'); setSelectedCustomerId(null); }} />;
      case 'tickets':
        return <SupportTickets />;
      case 'omnichannel':
        return <Omnichannel />;
      case 'marketing':
        return <MarketingAI />;
      case 'sales':
        return <SalesPipeline />;
      case 'leads':
        return <Leads />;
      case 'surveys':
        return <Surveys />;
      case 'tasks':
        return <Tasks />;
      case 'users':
        return <SettingsPage initialTab="permissions" />;
      case 'documents':
        return <Documents />;
      case 'loyalty':
        return <LoyaltyManagement />;
      case 'journey':
        return <Journey />;
      case 'knowledge':
        return <SettingsPage initialTab="knowledge" />;
      case 'settings':
        return <SettingsPage initialTab="general" />;
      case 'reports':
        return <Reports />;
      case 'workflows':
        return <Workflows />;
      case 'email-templates':
        return <EmailTemplates />;
      case 'enterprise-arch':
        return <EnterpriseArchitecture />;
      case 'docs':
        return <ArchitectureDocs />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-white/40 backdrop-blur-lg border border-white/50 p-10 rounded-[10px] shadow-xl">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Module đang trong quá trình phát triển</h2>
              <p className="text-slate-600 mt-2 font-medium">Tính năng này dự kiến triển khai trong Giai đoạn 2.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#3370FF] overflow-hidden font-sans relative p-[5px]">
      {/* Main Container styled as a modern sleek canvas layout */}
      <div className="relative z-10 flex h-full w-full overflow-hidden bg-[#F4F5F9] dark:bg-slate-950 no-scrollbar rounded-[10px] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          isMobileOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          onSearchClick={() => setIsSearchOpen(true)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-2 sm:p-4 gap-[5px]">
          {/* Mobile Menu Button - shows only on small screens when sidebar is hidden */}
          {!isMobileMenuOpen && (
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-[#e4e7ec] dark:border-slate-800 shadow-sm rounded-full shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          )}
          <main className="flex-1 overflow-hidden flex flex-col pb-1 relative">
            <div className="flex-1 overflow-hidden flex flex-col relative rounded-[10px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-1 h-full w-full overflow-auto no-scrollbar"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <GlobalSearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onNavigate={(tab, customerId) => {
          setCurrentTab(tab);
          if (customerId) setSelectedCustomerId(customerId);
        }}
      />
      <AIChatWidget />
      <QuickNoteWidget />

      {/* Session Expiry Warning Dialog */}
      <AnimatePresence>
        {isIdleWarningOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-md w-full overflow-hidden p-6 relative"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-400">Chế độ Test (10s)</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsTestMode(!isTestMode);
                    setIsIdleWarningOpen(false);
                    addToast('Cấu hình thử nghiệm', `Đã chuyển sang chế độ ${!isTestMode ? 'Thử nghiệm nhanh (10 giây rảnh)' : 'Thường (2 phút rảnh)'}.`, 'info', 'system');
                  }}
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-250 relative ${isTestMode ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-250 ${isTestMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center mt-6">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center mb-4 text-rose-500 dark:text-rose-450 shadow-inner">
                  <ShieldAlert size={32} className="animate-bounce" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                  Cảnh báo bảo mật hệ thống
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-xs mb-6">
                  Khoảng thời gian rảnh rỗi đã đạt hạn mức. Phiên làm việc sẽ đóng tự động để bảo vệ tiến trình và tài khoản.
                </p>

                {/* Circular countdown visualization */}
                <div className="relative flex items-center justify-center mb-6">
                  <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                    {countdown}s
                  </div>
                  <div className="absolute -inset-4 border-2 border-slate-100 dark:border-slate-800 rounded-full" />
                </div>

                {/* Progress bar countdown */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-6">
                  <div 
                    style={{ width: `${(countdown / 30) * 100}%` }} 
                    className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-1000"
                  />
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      authLogout();
                      setIsIdleWarningOpen(false);
                    }}
                    className="flex-1 py-2.5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl font-bold text-xs transition-all text-center border border-slate-200 dark:border-slate-800 outline-none"
                  >
                    Đăng xuất
                  </button>
                  <button
                    type="button"
                    onClick={handleExtendSession}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-blue-500/10 hover:shadow-lg flex items-center justify-center gap-1.5 outline-none"
                  >
                    <Sparkles size={14} /> Gia hạn phiên
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
