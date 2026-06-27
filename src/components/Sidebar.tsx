import { useState } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  Users, 
  FileText, 
  Megaphone, 
  Target, 
  Database, 
  Settings, 
  BrainCircuit,
  Magnet,
  MessageSquare,
  BookOpen,
  Award,
  Map,
  CheckSquare,
  SmilePlus,
  BarChart3,
  Workflow,
  Files,
  ShieldCheck,
  Mail,
  Search,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Layers,
  Network,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NavItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';

type NavGroupInfo = {
  id: string;
  name: string;
  icon: string;
  items: NavItem[];
}

const navGroups: NavGroupInfo[] = [
  {
    id: 'overview',
    name: 'Bảng điều khiển',
    icon: 'LayoutDashboard',
    items: [
      { name: 'Bảng điều khiển', icon: 'LayoutDashboard', id: 'dashboard' },
    ]
  },
  {
    id: 'sales',
    name: 'Bán hàng',
    icon: 'Target',
    items: [
      { name: 'Khách tiềm năng', icon: 'Magnet', id: 'leads' },
      { name: 'Quản lý Bán hàng', icon: 'Target', id: 'sales' },
      { name: 'Hành trình trải nghiệm', icon: 'Map', id: 'journey' },
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: 'Megaphone',
    items: [
      { name: 'Tiếp thị tự động', icon: 'Megaphone', id: 'marketing', adminOnly: true },
      { name: 'Khảo sát khách hàng', icon: 'SmilePlus', id: 'surveys' },
      { name: 'Hệ thống Loyalty', icon: 'Award', id: 'loyalty' },
    ]
  },
  {
    id: 'support',
    name: 'Chăm sóc KH',
    icon: 'Users',
    items: [
      { name: 'Khách hàng 360', icon: 'Users', id: 'customers' },
      { name: 'Giao tiếp Đa kênh', icon: 'MessageSquare', id: 'omnichannel' },
      { name: 'Trung tâm hỗ trợ', icon: 'TicketIcon', id: 'tickets' },
    ]
  },
  {
    id: 'operations',
    name: 'Vận hành',
    icon: 'CheckSquare',
    items: [
      { name: 'Lịch hẹn & Công việc', icon: 'Calendar', id: 'tasks' },
      { name: 'Kho tài liệu số', icon: 'Files', id: 'documents' },
      { name: 'Báo cáo doanh thu', icon: 'BarChart3', id: 'reports', adminOnly: true },
    ]
  },
  {
    id: 'system',
    name: 'Hệ thống',
    icon: 'Settings',
    items: [
      { name: 'AI & Quy trình', icon: 'Workflow', id: 'workflows', adminOnly: true },
      { name: 'Kiến trúc Doanh nghiệp', icon: 'Layers', id: 'enterprise-arch' },
      { name: 'Cài đặt hệ thống', icon: 'Settings', id: 'settings' },
    ]
  }
];

const icons: Record<string, any> = {
  LayoutDashboard, Users, Target, TicketIcon, Megaphone, FileText, Building2, Database, Settings, BrainCircuit,
  Magnet, MessageSquare, BookOpen, Award, Map, CheckSquare, SmilePlus, BarChart3, Workflow, Files, ShieldCheck, Mail, Layers,
  Network, Calendar, TrendingUp
};

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (id: string) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
  onSearchClick?: () => void;
}

export function Sidebar({ currentTab, setCurrentTab, isMobileOpen, onClose, onSearchClick }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" 
          onClick={onClose}
        />
      )}

      {/* Optional: invisible backdrop to close active popup */}
      {activeGroup && (
        <div className="fixed inset-0 z-[40]" onClick={() => setActiveGroup(null)} />
      )}

      <div className={cn(
        "relative fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-white text-slate-800 dark:text-slate-200 flex flex-col shrink-0 py-6 lg:py-8 h-full",
        isMobileOpen ? "translate-x-0 bg-white dark:bg-slate-900" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-[80px] px-2" : "w-[260px] px-4"
      )}>
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 z-50 cursor-pointer shadow-md transition-all hover:scale-110"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Logo Header with locked position */}
        <div className={cn("flex items-center mb-8 shrink-0 overflow-hidden", isCollapsed ? "justify-center px-0" : "px-2")}>
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/21LyYB06/Logo-mau-Tim-CV-Nguyen-H-ng-Th-i.png"
              alt="CRM Logo"
              referrerPolicy="no-referrer"
              className={cn("shrink-0 transition-all rounded-lg object-contain", isCollapsed ? "w-8 h-8" : "w-10 h-10")}
            />
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="text-base font-bold text-gray-800 dark:text-white tracking-tight">Power Service</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CRM Platform</span>
              </div>
            )}
          </div>
        </div>

      <div className={cn("mb-6 shrink-0 transition-all", isCollapsed ? "px-1" : "px-2")}>
        <button
          onClick={onSearchClick}
          className={cn(
            "w-full flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-900 transition-all cursor-pointer shadow-sm group",
            isCollapsed ? "justify-center px-0 py-2.5" : "pl-3 pr-2 py-2.5"
          )}
          title={isCollapsed ? "Tìm kiếm" : undefined}
        >
          <Search size={isCollapsed ? 20 : 16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium">Tìm kiếm...</span>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md">⌘ K</span>
            </>
          )}
        </button>
      </div>
      
      {/* Navigation Items */}
      <div className={cn(
        "flex-1 no-scrollbar overflow-y-visible relative z-10", 
        isCollapsed ? "flex flex-col items-center" : ""
      )}>
        <nav className="space-y-1 w-full">
          {navGroups.map((group) => {
            const groupItems = group.items.filter(item => !(item.adminOnly && !isAdmin));
            if (groupItems.length === 0) return null;

            const Icon = icons[group.icon];
            const isGroupActive = groupItems.some(item => item.id === currentTab) || activeGroup === group.id;

            return (
              <div key={group.id} className="relative group/nav">
                <button
                  onClick={() => {
                     setActiveGroup(activeGroup === group.id ? null : group.id);
                  }}
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all relative",
                    isCollapsed ? "justify-center py-3 mb-1" : "px-3 py-2.5",
                    isGroupActive 
                      ? "bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold shadow-sm" 
                      : "text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                  title={isCollapsed ? group.name : undefined}
                >
                  <Icon 
                    size={isCollapsed ? 24 : 20} 
                    strokeWidth={isGroupActive ? 2.5 : 2} 
                    className={cn(
                      "transition-colors shrink-0", 
                      isGroupActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white",
                      !isCollapsed && "mr-3"
                    )} 
                  />
                  {!isCollapsed && (
                    <>
                      <span className="text-[14px] truncate">{group.name}</span>
                      <ChevronRight size={16} className={cn("ml-auto transition-transform", activeGroup === group.id && "rotate-90")} />
                    </>
                  )}
                  {isGroupActive && !isCollapsed && (
                    <div className="absolute left-0 w-1 h-6 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                  )}
                </button>

                {/* Popup menu overlay */}
                {activeGroup === group.id && (
                  <div 
                    className={cn(
                      "absolute z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 min-w-[220px] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200",
                      isCollapsed ? "left-full top-0 ml-2" : "left-0 top-full mt-1 w-full"
                    )}
                  >
                    {groupItems.map(item => {
                      const ItemIcon = icons[item.icon as string];
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentTab(item.id);
                            setActiveGroup(null);
                            if (onClose) onClose();
                          }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left",
                            isActive 
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold" 
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          {ItemIcon && <ItemIcon size={18} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      
      {/* Footer Area with user profile */}
      {user && (
        <div className="pt-4 shrink-0 flex flex-col gap-3 relative">
          
          <div className={cn("rounded-xl mb-1 transition-all w-full leading-5", isCollapsed ? "bg-transparent dark:bg-transparent" : "px-2")}>
            <NotificationCenter isCollapsed={isCollapsed} />
          </div>

          {/* Transparent backdrop to close the dropdown when clicking outside */}
          {showProfileMenu && (
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setShowProfileMenu(false)}
            />
          )}

          {/* User Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className={cn(
              "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-2xl z-50 p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150 text-left absolute",
              isCollapsed ? "left-full bottom-4 ml-3 w-64 origin-bottom-left" : "bottom-16 left-0 right-0 w-full"
            )}>
              <div className="p-2 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">Tài khoản</p>
                <p className="text-sm font-black text-slate-950 dark:text-white truncate mt-0.5 leading-tight">{user.displayName || user.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">{user.email}</p>
              </div>

              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-primary" />}
                <span>Thay đổi giao diện</span>
                <span className="ml-auto text-xs font-bold py-0.5 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {theme === 'dark' ? 'Sáng' : 'Tối'}
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('settings');
                  setShowProfileMenu(false);
                  if (onClose) onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none cursor-pointer"
              >
                <User size={15} className="text-primary" />
                <span>Tùy chỉnh hồ sơ</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('settings');
                  setShowProfileMenu(false);
                  if (onClose) onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none cursor-pointer"
              >
                <Settings size={15} className="text-slate-500" />
                <span>Cài đặt</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800/60 my-1" />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all outline-none cursor-pointer"
              >
                <LogOut size={15} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* Profile Trigger Element */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={cn(
              "w-full flex items-center justify-between rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all overflow-hidden cursor-pointer outline-none select-none text-left relative z-40 group border-2 border-gray-200 dark:border-slate-700 shadow-[0px_100px_80px_rgba(41,72,152,0.05),0px_20px_13px_rgba(41,72,152,0.025)]", 
              isCollapsed ? "justify-center p-0 h-10 border-transparent shadow-none hover:bg-transparent dark:hover:bg-transparent" : "p-2"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} referrerPolicy="no-referrer" alt="User" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9A9A] to-[#0E9CC4] flex items-center justify-center text-white font-black text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#FBBF24] border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
              </div>
              {!isCollapsed && (
                 <div className="flex flex-col truncate">
                   <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.displayName || user.email?.split('@')[0]}</span>
                   <span className="text-[11px] font-medium text-slate-500 truncate">{user.email}</span>
                 </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="text-slate-400 dark:text-slate-500 group-hover:text-black dark:group-hover:text-white transition-all shrink-0 px-2">
                <ChevronUp size={18} />
              </div>
            )}
          </button>
          
        </div>
      )}
    </div>
    </>
  );
}

