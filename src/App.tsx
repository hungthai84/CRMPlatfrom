/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Customer360 } from './pages/Customer360';
import { Customers } from './pages/Customers';
import { SupportTickets } from './pages/SupportModule';
import { MarketingAI } from './pages/MarketingAI';
import { SalesPipeline } from './pages/SalesPipeline';
import { ArchitectureDocs } from './pages/ArchitectureDocs';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthScreen } from './pages/Auth';

import { AIChatWidget } from './components/AIChatWidget';

import { Tasks } from './pages/Tasks';
import { AuditLogs } from './pages/Users';

import { Documents } from './pages/Documents';
import { LoyaltyManagement } from './pages/Loyalty';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Journey } from './pages/Journey';
import { Omnichannel } from './pages/Omnichannel';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // A simple quick way to focus the main search input
        const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Cmd+N or Ctrl+N for new record (e.g., Quick Add User)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setCurrentTab('customers');
        // This will navigate to customers where the 'New Customer' button can be focused or a modal could open
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      case 'tasks':
        return <Tasks />;
      case 'users':
        return <AuditLogs />;
      case 'documents':
        return <Documents />;
      case 'loyalty':
        return <LoyaltyManagement />;
      case 'journey':
        return <Journey />;
      case 'knowledge':
        return <KnowledgeBase />;
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
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans relative p-[5px]">
      {/* Main Container framed with 10px rounded corners and 5px outer website padding */}
      <div className="relative z-10 flex h-full w-full rounded-[10px] overflow-hidden shadow-[0_24px_70px_rgba(8,15,30,0.08)] border border-white dark:border-slate-800 bg-[#F4F5F9] dark:bg-slate-950 p-4 gap-6 no-scrollbar">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} isMobileOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header currentTab={currentTab} onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          <main className="flex-1 overflow-hidden flex flex-col pt-2 pb-1 relative">
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
      <AIChatWidget />
    </div>
  );
}
