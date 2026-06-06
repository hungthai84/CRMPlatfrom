/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Customer360 } from './pages/Customer360';
import { SupportTickets } from './pages/SupportModule';
import { MarketingAI } from './pages/MarketingAI';
import { SalesPipeline } from './pages/SalesPipeline';
import { ArchitectureDocs } from './pages/ArchitectureDocs';
import { AuthProvider, useAuth } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { user, loading, login, error: authError } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[10%] w-[40rem] h-[40rem] bg-indigo-300/60 rounded-full mix-blend-multiply blur-[128px] opacity-70 animate-blob pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[10%] w-[40rem] h-[40rem] bg-rose-300/50 rounded-full mix-blend-multiply blur-[128px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>
        <div className="relative z-10 p-12 bg-white/40 backdrop-blur-xl rounded-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 text-center space-y-6 max-w-md w-full">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chào mừng đến với CRM</h1>
          <p className="text-slate-600 font-medium">Vui lòng đăng nhập để truy cập bảng điều khiển của bạn.</p>
          
          {authError && (
            <div className="p-3 bg-rose-50/80 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
              {authError}
            </div>
          )}

          <button 
            onClick={login}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity"
          >
            Đăng nhập bằng Google
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'customer360':
        return <Customer360 />;
      case 'tickets':
        return <SupportTickets />;
      case 'marketing':
        return <MarketingAI />;
      case 'sales':
        return <SalesPipeline />;
      case 'docs':
        return <ArchitectureDocs />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-white/40 backdrop-blur-lg border border-white/50 p-10 rounded-3xl shadow-xl">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Module đang trong quá trình phát triển</h2>
              <p className="text-slate-600 mt-2 font-medium">Tính năng này dự kiến triển khai trong Giai đoạn 2.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans relative p-4 lg:p-6">
      {/* Dynamic ambient background blobs for Glassmorphism effect */}
      <div className="absolute top-[-10%] left-[10%] w-[40rem] h-[40rem] bg-indigo-300/60 rounded-full mix-blend-multiply blur-[128px] opacity-70 animate-blob pointer-events-none"></div>
      <div className="absolute top-[10%] right-[10%] w-[40rem] h-[40rem] bg-teal-300/50 rounded-full mix-blend-multiply blur-[128px] opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[30%] w-[40rem] h-[40rem] bg-rose-300/50 rounded-full mix-blend-multiply blur-[128px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Main Container framed and rounded 10px */}
      <div className="relative z-10 flex h-full w-full rounded-[10px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 bg-white/20 backdrop-blur-3xl">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden flex flex-col p-4 pr-6 pb-6 pt-2">
            <div className="flex-1 overflow-hidden flex flex-col bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] relative">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
