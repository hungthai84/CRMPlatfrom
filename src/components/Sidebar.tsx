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
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NavItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';

type NavGroupInfo = {
  name: string;
  id: string;
  icon: string;
  items: NavItem[];
}

const navGroups: NavGroupInfo[] = [
  {
    name: 'Trang chủ',
    id: 'group_overview',
    icon: 'LayoutDashboard',
    items: [
      { name: 'Dashboard', icon: 'LayoutDashboard', id: 'dashboard' },
    ]
  },
  {
    name: 'Quản lý Khách hàng',
    id: 'group_crm',
    icon: 'Users',
    items: [
      { name: 'Khách hàng 360', icon: 'Users', id: 'customers' },
      { name: 'Khách tiềm năng', icon: 'Magnet', id: 'leads' },
      { name: 'Hành trình KH', icon: 'Map', id: 'journey' },
      { name: 'Khách thân thiết', icon: 'Award', id: 'loyalty' },
      { name: 'Khảo sát', icon: 'SmilePlus', id: 'surveys' },
    ]
  },
  {
    name: 'Kinh doanh & Dịch vụ',
    id: 'group_sales',
    icon: 'Target',
    items: [
      { name: 'Quản lý Bán hàng', icon: 'Target', id: 'sales' },
      { name: 'Dịch vụ hỗ trợ', icon: 'TicketIcon', id: 'tickets' },
      { name: 'Giao tiếp Đa kênh', icon: 'MessageSquare', id: 'omnichannel' },
      { name: 'Công việc', icon: 'CheckSquare', id: 'tasks' },
    ]
  },
  {
    name: 'Tiếp thị & Tự động',
    id: 'group_marketing',
    icon: 'Megaphone',
    items: [
      { name: 'Mẫu Email', icon: 'Mail', id: 'email-templates' },
      { name: 'Tiếp thị tự động', icon: 'Megaphone', id: 'marketing', adminOnly: true },
      { name: 'AI & Quy trình', icon: 'Workflow', id: 'workflows', adminOnly: true },
    ]
  },
  {
    name: 'Quản trị & Hệ thống',
    id: 'group_system',
    icon: 'Settings',
    items: [
      { name: 'Báo cáo & Phân tích', icon: 'BarChart3', id: 'reports', adminOnly: true },
      { name: 'Kiến trúc Doanh nghiệp', icon: 'Layers', id: 'enterprise-arch' },
      { name: 'Tài liệu kiến trúc', icon: 'FileText', id: 'docs', adminOnly: true },
      { name: 'Tài liệu', icon: 'Files', id: 'documents' },
      { name: 'Cài đặt hệ thống', icon: 'Settings', id: 'settings' },
    ]
  }
];

const icons: Record<string, any> = {
  LayoutDashboard, Users, Target, TicketIcon, Megaphone, FileText, Building2, Database, Settings, BrainCircuit,
  Magnet, MessageSquare, BookOpen, Award, Map, CheckSquare, SmilePlus, BarChart3, Workflow, Files, ShieldCheck, Mail, Layers
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    navGroups.filter(g => g.items.some(i => i.id === currentTab)).map(g => g.id)
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => prev.includes(id) ? [] : [id]);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" 
          onClick={onClose}
        />
      )}

      <div className={cn(
        "relative fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-transparent text-slate-800 dark:text-slate-200 flex flex-col shrink-0 border-r border-slate-200/60 dark:border-slate-800/80 py-6 lg:translate-x-0 h-full",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}>
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-[#3370FF] z-50 cursor-pointer shadow-md transition-all hover:scale-110"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Logo Header with locked position */}
      <div className={cn("flex items-center mb-5 shrink-0 overflow-hidden", isCollapsed ? "justify-center px-0" : "px-4")}>
        <div className="flex items-center gap-3">
          <img 
            src="https://i.ibb.co/VcwGhfRp/Logo-mau-xanh-Lark-CV-Nguyen-H-ng-Th-i.png" 
            alt="Power Service Logo" 
            className={cn("object-contain shrink-0 transition-all", isCollapsed ? "w-12 h-12" : "w-10 h-10")}
            referrerPolicy="no-referrer"
          />
          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden">
              <span className="text-[17px] font-black text-[#3370FF] uppercase tracking-tight">Power Service</span>
              <span className="text-[12px] font-bold text-black tracking-wider mt-0.5 animate-pulse-once">CRM Platfrom</span>
            </div>
          )}
        </div>
      </div>

      <div className={cn("mb-5 shrink-0 transition-all", isCollapsed ? "px-5" : "px-4")}>
        <button
          onClick={onSearchClick}
          className={cn(
            "w-full flex items-center gap-2 border border-slate-200/60 dark:border-slate-800 rounded-xl leading-5 bg-white dark:bg-slate-900/50 text-slate-500 hover:text-[#3370FF] hover:border-[#3370FF]/30 transition-all cursor-pointer shadow-sm group",
            isCollapsed ? "justify-center px-0 py-2" : "pl-3 pr-2 py-2.5"
          )}
          title={isCollapsed ? "Tìm kiếm" : undefined}
        >
          <Search size={isCollapsed ? 18 : 16} className="text-slate-400 group-hover:text-[#3370FF] transition-colors" />
          {!isCollapsed && (
            <>
              <span className="text-sm font-semibold">Tìm kiếm...</span>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md">⌘ K</span>
            </>
          )}
        </button>
      </div>
      
      {/* Navigation Items */}
      <div className={cn(
        "flex-1 px-3 no-scrollbar flex flex-col", 
        isCollapsed ? "justify-center" : "",
        (isCollapsed || expandedGroups.length > 0) ? "overflow-visible" : "overflow-y-auto"
      )}>
        <div className="space-y-6 my-auto">

        <div className="space-y-4">
          {navGroups.map((group) => {
            const hasVisibleItems = group.items.some(i => !i.adminOnly || isAdmin);
            if (!hasVisibleItems) return null;

            const isOverview = group.id === 'group_overview';
            const isExpanded = !isOverview && expandedGroups.includes(group.id);
            const GroupIcon = icons[group.icon];
            const isActiveOverview = isOverview && currentTab === 'dashboard';

            return (
              <div key={group.id} className="flex flex-col relative group/group-item">
                <button
                  onClick={() => {
                    if (isOverview) {
                      setCurrentTab('dashboard');
                      setExpandedGroups([]);
                      if (onClose) onClose();
                    } else {
                      toggleGroup(group.id);
                    }
                  }}
                  className={cn(
                    "flex items-center w-full mb-1.5 focus:outline-none select-none group relative rounded-xl transition-colors", 
                    isCollapsed 
                      ? "justify-center px-0 h-10 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50" 
                      : cn("justify-between px-2 cursor-pointer py-1", isActiveOverview ? "bg-[#3370FF]/10 border border-[#3370FF]/20" : "")
                  )}
                  title={group.name}
                >
                  {isActiveOverview && !isCollapsed && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#3370FF] rounded-r-full" />
                  )}
                  <div className="flex items-center gap-2">
                    {GroupIcon && <GroupIcon size={isCollapsed ? 20 : 16} className={cn("text-slate-400 transition-colors", isCollapsed ? "group-hover:text-[#3370FF]" : "group-hover:text-slate-600 dark:group-hover:text-slate-300", isExpanded && isCollapsed && "text-[#3370FF]", isActiveOverview && "text-[#3370FF]")} />}
                    {!isCollapsed && <p className={cn("text-xs font-black tracking-wider whitespace-nowrap transition-colors", isActiveOverview ? "text-[#3370FF]" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300")}>{group.name}</p>}
                  </div>
                {!isCollapsed && !isOverview && (
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
                </button>
                
                {isExpanded && (
                  <>
                    <div 
                      className="fixed inset-0 z-[90] bg-transparent" 
                      onClick={(e) => { e.stopPropagation(); setExpandedGroups([]); }}
                    />
                    <nav className={cn(
                      "pointer-events-auto absolute bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-2 rounded-2xl shadow-xl w-56 z-[100] animate-in fade-in zoom-in-95 duration-200 space-y-1", 
                      "left-full top-0 ml-3"
                    )}>
                      <div className="px-3 py-2 mb-1 border-b border-slate-100 dark:border-slate-800/60">
                         <p className="text-[10px] font-black text-slate-400 tracking-widest">{group.name}</p>
                      </div>
                      {group.items.filter((i) => !i.adminOnly || isAdmin).map((item) => {
                        const Icon = icons[item.icon];
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentTab(item.id);
                              setExpandedGroups([]);
                              if (onClose) onClose();
                            }}
                            className={cn(
                              "w-full flex items-center rounded-xl text-sm font-bold transition-all duration-200 relative h-10 cursor-pointer select-none outline-none group/btn mb-1",
                              isActive 
                                ? "bg-[#3370FF]/10 text-[#3370FF] border border-[#3370FF]/20" 
                                : "text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
                            )}
                            title={item.name}
                          >
                            {/* Active Indicator Bar */}
                            {isActive && (
                              <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#3370FF] rounded-r-full" />
                            )}
  
                            {/* Icon wrapper */}
                            <div className="flex items-center justify-center shrink-0 w-10 h-10">
                              <Icon size={18} className={cn("transition-transform duration-200", isActive ? "scale-110" : "group-hover/btn:scale-110")} />
                            </div>
                            {/* Text Label on expand */}
                            <span className="whitespace-nowrap ml-1 font-bold tracking-tight">
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                  </>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>
      
      {/* Footer Area with user profile */}
      {user && (
        <div className="px-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 shrink-0 flex flex-col gap-3 relative">
          
          <div className={cn("border border-slate-200/60 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 mb-1 transition-all w-full leading-5", isCollapsed ? "border-transparent bg-transparent dark:bg-transparent" : "")}>
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
            <div className="absolute bottom-16 left-3 right-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-2xl z-50 p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150 text-left">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Tài khoản</p>
                <p className="text-sm font-black text-slate-950 dark:text-white truncate mt-0.5 leading-tight">{user.displayName || user.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">{user.email}</p>
              </div>

              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-indigo-500" />}
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
                <User size={15} className="text-blue-500" />
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
            className={cn("w-full flex items-center rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-all p-2 overflow-hidden cursor-pointer outline-none select-none text-left relative z-40 group", isCollapsed ? "justify-center gap-0" : "gap-3")}
          >
            <div className="shrink-0">
              <div className="relative">
                {user.photoURL ? (
                  <img src={user.photoURL} referrerPolicy="no-referrer" alt="User" className="w-10 h-10 rounded-full ring-1 ring-white/10 shadow-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3370FF] to-blue-700 flex items-center justify-center text-white font-black ring-1 ring-white/10 shadow-lg text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0C0E12] rounded-full shadow-sm" />
              </div>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col min-w-0 flex-1 pl-1">
                  <span className="text-sm font-black text-slate-900 dark:text-white truncate whitespace-nowrap leading-tight">{user.displayName || user.email?.split('@')[0]}</span>
                  <span className="text-xs text-slate-500 font-bold truncate whitespace-nowrap leading-tight">{user.email}</span>
                </div>
                <div className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all shrink-0 pr-1">
                  {showProfileMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </>
            )}
          </button>
          

        </div>
      )}
    </div>
    </>
  );
}

