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
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NavItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: 'LayoutDashboard', id: 'dashboard' },
  { name: 'Khách hàng 360', icon: 'Users', id: 'customers' },
  { name: 'Khách tiềm năng', icon: 'Magnet', id: 'leads' },
  { name: 'Quản lý Bán hàng', icon: 'Target', id: 'sales' },
  { name: 'Dịch vụ hỗ trợ', icon: 'TicketIcon', id: 'tickets' },
  { name: 'Giao tiếp Đa kênh', icon: 'MessageSquare', id: 'omnichannel' },
  { name: 'Kho tri thức', icon: 'BookOpen', id: 'knowledge' },
  { name: 'KH thân thiết', icon: 'Award', id: 'loyalty' },
  { name: 'Hành trình KH', icon: 'Map', id: 'journey' },
  { name: 'Tiếp thị tự động', icon: 'Megaphone', id: 'marketing', adminOnly: true },
  { name: 'Công việc', icon: 'CheckSquare', id: 'tasks' },
  { name: 'Khảo sát', icon: 'SmilePlus', id: 'surveys' },
  { name: 'Báo cáo & Phân tích', icon: 'BarChart3', id: 'reports', adminOnly: true },
  { name: 'AI & Quy trình', icon: 'Workflow', id: 'workflows', adminOnly: true },
  { name: 'Tài liệu', icon: 'Files', id: 'documents' },
  { name: 'Phân quyền', icon: 'ShieldCheck', id: 'users', adminOnly: true },
  { name: 'Tài liệu kiến trúc', icon: 'FileText', id: 'docs', adminOnly: true },
];

const icons: Record<string, any> = {
  LayoutDashboard, Users, Target, TicketIcon, Megaphone, FileText, Building2, Database, Settings, BrainCircuit,
  Magnet, MessageSquare, BookOpen, Award, Map, CheckSquare, SmilePlus, BarChart3, Workflow, Files, ShieldCheck
};

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (id: string) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentTab, setCurrentTab, isMobileOpen, onClose }: SidebarProps) {
  const { user, isAdmin } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm" 
          onClick={onClose}
        />
      )}

      <div className={cn(
        "fixed md:static left-4 top-4 bottom-4 z-50 w-[84px] hover:w-64 md:hover:w-68 group transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] bg-black text-slate-100 flex flex-col rounded-[36px] shrink-0 shadow-[0_20px_48px_rgba(0,0,0,0.25)] border border-white/10 overflow-hidden py-6 md:translate-x-0",
        isMobileOpen ? "translate-x-0 h-[calc(100%-32px)]" : "-translate-x-[150%] md:h-full"
      )}>
        {/* Brand Logo Header with locked position */}
      <div className="flex items-center px-[18px] mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#2F69FF] rounded-[14px] shadow-sm border border-white/10 shrink-0 flex items-center justify-center w-12 h-12">
            {/* Custom SVG logo representing human profile fused with power button design exactly */}
            <svg viewBox="0 0 100 100" className="w-7 h-7 text-white fill-none stroke-current" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M 38,22 H 28 C 21,22 16,27 16,34 V 66 C 16,73 21,78 28,78 H 72 C 79,78 84,73 84,66 V 55 C 84,55 91,52 91,48 C 91,43 83,43 83,43 C 81,37 77,22 50,22" />
              <path d="M 50,22 V 55" />
              <path d="M 39,44 A 12,12 0 1,0 61,44" />
            </svg>
          </div>
          <span className="text-sm font-extrabold tracking-tight text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Power Service CRM</span>
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-[18px] no-scrollbar">
        <div className="px-3 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Danh mục</p>
        </div>
        <nav className="space-y-3">
          {navItems.filter((i) => !i.adminOnly || isAdmin).map((item) => {
            const Icon = icons[item.icon];
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (onClose) onClose();
                }}
                className={cn(
                  "w-full flex items-center rounded-[10px] text-xs font-bold transition-all duration-300 relative h-12 cursor-pointer select-none outline-none group/btn",
                  isActive 
                    ? "bg-[#2F69FF] text-white shadow-lg shadow-[#2F69FF]/25" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                title={item.name}
              >
                {/* Icon wrapper: fixed width matches logo, keeps horizontal center absolutely static */}
                <div className="w-12 h-12 flex items-center justify-center shrink-0 transition-all duration-300">
                  <div className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-[10px] transition-all duration-300",
                    isActive ? "bg-white/10" : "group-hover/btn:bg-white/10"
                  )}>
                    <Icon size={18} className="shrink-0" />
                  </div>
                </div>
                {/* Text Label on expand */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pl-2 font-semibold">
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Footer Area with user profile */}
      {user && (
        <div className="px-[18px] pt-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 rounded-full hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10 overflow-hidden h-12 w-12 group-hover:w-full">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} referrerPolicy="no-referrer" alt="User" className="w-10 h-10 rounded-full ring-2 ring-white/15 shadow-sm transition-all object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold ring-2 ring-white/15 shadow-sm text-sm transition-all">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-xs font-bold text-white truncate whitespace-nowrap leading-none mb-0.5">{user.displayName || user.email?.split('@')[0] || "Người dùng"}</span>
              <span className="text-[10px] text-slate-500 font-semibold truncate whitespace-nowrap leading-none">{user.email}</span>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
