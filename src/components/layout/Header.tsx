import React, { useState } from 'react';
import {
  Bell,
  Bot,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  PanelRight,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ROLES } from '../../constants/rbac';
import { ModuleKey } from '../../types/crm';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenQuickCreate: () => void;
  onToggleAiDrawer: () => void;
  onToggleInsightPanel: () => void;
  onNavigateModule: (mod: ModuleKey) => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenQuickCreate,
  onToggleAiDrawer,
  onToggleInsightPanel,
  onNavigateModule,
  onOpenHelp,
}) => {
  const { user, activeRole, signOut } = useAuth();
  const { organization, notifications, hasDemoData, markNotificationRead, markAllNotificationsRead } = useCRM();
  const { theme, toggleTheme, language, setLanguage } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const roleLabel = ROLES.find((r) => r.id === activeRole)?.nameVi || activeRole;

  return (
    <header className="h-14 glass-header border-b border-slate-200/80 dark:border-white/10 px-4 flex items-center justify-between gap-4 shrink-0 relative z-30">
      {/* Zone 1: Brand & Organization Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-heading font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[260px]">
          {organization?.name || 'ONECRM Workspace'}
        </span>
        {hasDemoData && (
          <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 whitespace-nowrap shrink-0">
            · DEMO
          </span>
        )}
      </div>

      {/* Zone 2: Global Search Trigger */}
      <div className="hidden md:flex flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400 hover:border-[#1951fc]/50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {language === 'vi'
                ? 'Tìm khách hàng, Lead, Deal, Ticket, Hợp đồng...'
                : 'Search customers, leads, deals, tickets...'}
            </span>
          </span>
          <kbd className="font-mono text-[10px] text-slate-400 shrink-0">Ctrl K</kbd>
        </button>
      </div>

      {/* Zone 3: Actions & Profile */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Tìm kiếm"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenQuickCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1951fc] text-white text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{language === 'vi' ? 'Tạo nhanh' : 'Quick Create'}</span>
        </button>

        <button
          onClick={onToggleAiDrawer}
          className="p-2 rounded-lg text-[#1951fc] dark:text-[#22c7e8] hover:bg-[#1951fc]/10 transition-colors cursor-pointer"
          title="AI Copilot"
          aria-label="AI Copilot"
        >
          <Bot className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleInsightPanel}
          className="hidden xl:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Bảng Insight"
          aria-label="Bảng Insight"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0f2142] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Thông báo ({unreadCount} chưa đọc)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-xs text-[#1951fc] dark:text-[#22c7e8] hover:underline cursor-pointer"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">Chưa có thông báo nào.</p>
                ) : (
                  notifications.slice(0, 12).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.linkModule) onNavigateModule(n.linkModule);
                        setNotifOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="px-2 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Chuyển ngôn ngữ"
        >
          {language.toUpperCase()}
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title={theme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
          aria-label="Đổi giao diện Sáng/Tối"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenHelp}
          className="hidden sm:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Trung tâm Hướng dẫn"
          aria-label="Trợ giúp"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1951fc] text-white text-xs font-bold flex items-center justify-center">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden lg:inline text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[110px] truncate">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0f2142] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.displayName || 'Người dùng ONECRM'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <p className="text-[11px] text-[#1951fc] dark:text-[#22c7e8] font-medium mt-1">{roleLabel}</p>
              </div>
              <button
                onClick={() => {
                  onNavigateModule('admin');
                  setProfileOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mt-1 cursor-pointer"
              >
                Cấu hình Tổ chức & RBAC
              </button>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
