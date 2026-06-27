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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, loading, logout: authLogout } = useAuth();
  const { addToast } = useToast();

  // Session tracking logic to log logins, logouts, timeouts, and calculate total active seconds
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
                // Sync session completion to Cloud SQL
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
          // Sync completion to Cloud SQL
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

      // Sync initialization to Cloud SQL
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
              // Sync intermediate updates to Cloud SQL every 15 seconds
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="flex h-screen w-screen bg-primary p-[5px] overflow-hidden font-sans relative">
      {/* Main Container styled as a modern sleek canvas layout with rounded corners */}
      <div className="relative z-10 flex h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-[10px] shadow-2xl">
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          isMobileOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          onSearchClick={() => setIsSearchOpen(true)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Mobile Menu Button - shows only on small screens when sidebar is hidden */}
          {!isMobileMenuOpen && (
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-[#e4e7ec] dark:border-slate-800 shadow-sm rounded-full shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          )}
          <main className="flex-1 overflow-hidden flex flex-col relative">
            <div className="flex-1 overflow-hidden flex flex-col relative">
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


    </div>
  );
}
