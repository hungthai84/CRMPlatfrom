/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Customer360 } from './pages/Customer360';
import { Customers } from './pages/Customers';
import { SalesPipeline } from './pages/SalesPipeline';
import { Leads } from './pages/Leads';
import { Appointments } from './pages/Appointments';
import { Orders } from './pages/Orders';
import { Companies } from './pages/Companies';
import { Deals } from './pages/Deals';
import { Activities } from './pages/Activities';
import { Tasks } from './pages/Tasks';
import { SettingsPage } from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuthScreen } from './pages/Auth';
import { AIChatWidget } from './components/AIChatWidget';
import { QuickNoteWidget } from './components/QuickNoteWidget';
import { Reports } from './pages/Reports';
import { syncSessionWithDb } from './lib/api';

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
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme, background, opacity } = useTheme();

  const [borderColor, setBorderColor] = useState('#9155fd');
  useEffect(() => {
    const colors = ['#9155fd', '#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'];
    const interval = setInterval(() => {
      setBorderColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Session tracking logic...
  useEffect(() => {
    if (!user) {
      const savedSessId = localStorage.getItem('crm_current_session_id');
      if (savedSessId) {
        const savedSessLogsStr = localStorage.getItem('crm_session_logs');
        if (savedSessLogsStr) {
          try {
            const logs = JSON.parse(savedSessLogsStr);
            const isTimeout = localStorage.getItem('crm_is_timeout_logout') === 'true';
            const finalStatus = isTimeout ? 'timeout' : 'completed';
            localStorage.removeItem('crm_is_timeout_logout');

            const updated = logs.map((log: any) => {
              if (log.id === savedSessId && log.status === 'active') {
                const finalLog = {
                  ...log,
                  status: finalStatus,
                  logoutTime: Date.now()
                };
                syncSessionWithDb({
                  sessionId: finalLog.id,
                  loginTime: finalLog.loginTime,
                  logoutTime: finalLog.logoutTime,
                  activeTime: finalLog.activeTime,
                  status: finalLog.status
                }).catch(err => console.error("Session sync failed:", err));
                return finalLog;
              }
              return log;
            });
            localStorage.setItem('crm_session_logs', JSON.stringify(updated));
          } catch (e) {}
        }
        localStorage.removeItem('crm_current_session_id');
      }
      return;
    }

    const email = user.email || 'unknown@example.com';
    let savedSessId = localStorage.getItem('crm_current_session_id');
    const savedSessLogsStr = localStorage.getItem('crm_session_logs') || '[]';
    let logs = [];
    try {
      logs = JSON.parse(savedSessLogsStr);
      if (!Array.isArray(logs)) logs = [];
    } catch (e) {}

    let currentSess = logs.find((l: any) => l.id === savedSessId && l.status === 'active');
    
    if (!currentSess) {
      logs = logs.map((l: any) => {
        if (l.status === 'active') {
          const finishedLog = { ...l, status: 'completed', logoutTime: l.logoutTime || Date.now() };
          syncSessionWithDb({
            sessionId: finishedLog.id,
            loginTime: finishedLog.loginTime,
            logoutTime: finishedLog.logoutTime,
            activeTime: finishedLog.activeTime,
            status: finishedLog.status
          }).catch(err => console.error("Session sync failed:", err));
          return finishedLog;
        }
        return l;
      });
      
      savedSessId = `sess_${Date.now()}`;
      currentSess = {
        id: savedSessId,
        email,
        loginTime: Date.now(),
        activeTime: 0,
        status: 'active'
      };
      logs.unshift(currentSess);
      localStorage.setItem('crm_session_logs', JSON.stringify(logs));
      localStorage.setItem('crm_current_session_id', savedSessId);

      syncSessionWithDb({
        sessionId: currentSess.id,
        loginTime: currentSess.loginTime,
        logoutTime: null,
        activeTime: currentSess.activeTime,
        status: currentSess.status
      }).catch(err => console.error("Session sync failed:", err));
    }

      const interval = setInterval(() => {
        const logsStr = localStorage.getItem('crm_session_logs') || '[]';
        try {
          let currentLogs = JSON.parse(logsStr);
          if (Array.isArray(currentLogs)) {
            let updated = false;
            let activeLogToSync: any = null;
            currentLogs = currentLogs.map((log: any) => {
              if (log.id === savedSessId && log.status === 'active') {
                updated = true;
                const nextLog = {
                  ...log,
                  activeTime: (log.activeTime || 0) + 1
                };
                activeLogToSync = nextLog;
                return nextLog;
              }
              return log;
            });
            if (updated) {
              localStorage.setItem('crm_session_logs', JSON.stringify(currentLogs));
              if (activeLogToSync && activeLogToSync.activeTime % 15 === 0) {
                syncSessionWithDb({
                  sessionId: activeLogToSync.id,
                  loginTime: activeLogToSync.loginTime,
                  logoutTime: null,
                  activeTime: activeLogToSync.activeTime,
                  status: activeLogToSync.status
                }).catch(err => console.error("Session tick sync failed:", err));
              }
            }
          }
        } catch (e) {}
      }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === 'n') {
        e.preventDefault();
        setCurrentTab('customers');
      }

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <Tasks />;
      case 'customers': return <Customers onSelect={(id) => { setSelectedCustomerId(id); setCurrentTab('customer360'); }} />;
      case 'customer360': return <Customer360 customerId={selectedCustomerId} onBack={() => { setCurrentTab('customers'); setSelectedCustomerId(null); }} />;
      case 'leads': return <Leads />;
      case 'appointments': return <Appointments />;
      case 'sales': return <SalesPipeline />;
      case 'orders': return <Orders />;
      case 'companies': return <Companies />;
      case 'deals': return <Deals />;
      case 'activities': return <Activities />;
      case 'reports': return <Reports />;
      case 'settings': return <SettingsPage initialTab="general" />;
      default: return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-white/40 backdrop-blur-lg border border-white/50 p-10 rounded-[10px] shadow-xl">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Module không tồn tại</h2>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className="h-screen w-screen p-[15px] overflow-hidden font-sans"
      style={{ backgroundImage: background, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}
    >
      <div 
        className="relative z-10 flex h-full w-full overflow-hidden bg-white dark:bg-slate-900 rounded-[10px] shadow-2xl border-3d"
        style={{ borderColor, opacity: opacity / 100 }}
      >
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          isMobileOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <main className="flex-1 overflow-hidden flex flex-col relative no-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 h-full w-full overflow-auto no-scrollbar"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <AIChatWidget />
      <QuickNoteWidget />
    </div>
  );
}
