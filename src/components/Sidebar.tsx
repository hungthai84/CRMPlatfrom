import { Building2, LayoutDashboard, Ticket as TicketIcon, Users, FileText, Megaphone, Target, Database, Settings, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';
import { NavItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

const navItems: NavItem[] = [
  { name: 'Bảng điều khiển', icon: 'LayoutDashboard', id: 'dashboard' },
  { name: 'Thông tin khách hàng 360', icon: 'Users', id: 'customer360' },
  { name: 'Quy trình bán hàng', icon: 'Target', id: 'sales' },
  { name: 'Yêu cầu hỗ trợ', icon: 'TicketIcon', id: 'tickets' },
  { name: 'Tiếp thị & AI', icon: 'BrainCircuit', id: 'marketing' },
  { name: 'Tài liệu kiến trúc', icon: 'FileText', id: 'docs' },
];

const icons: Record<string, any> = {
  LayoutDashboard, Users, Target, TicketIcon, Megaphone, FileText, Building2, Database, Settings, BrainCircuit
};

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (id: string) => void;
}

export function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const { user } = useAuth();

  return (
    <div className="w-68 bg-white/30 backdrop-blur-2xl text-slate-800 flex flex-col h-full border-r border-white/50 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-16 flex items-center px-6 border-b border-white/50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-sm border border-white/20">
            <Building2 size={20} className="text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-700">RevaDetail CRM</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <div className="px-5 mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Các tính năng</p>
        </div>
        <nav className="space-y-1.5 px-4">
          {navItems.map((item) => {
            const Icon = icons[item.icon];
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                  isActive 
                    ? "bg-white/70 text-blue-700 shadow-sm border border-white/80 scale-[1.02]" 
                    : "text-slate-600 hover:bg-white/50 hover:text-slate-900 border border-transparent"
                )}
              >
                <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-500"} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>
      
      {user && (
        <div className="p-4 border-t border-white/50">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-all cursor-pointer border border-transparent hover:border-white/60">
            {user.photoURL ? (
              <img src={user.photoURL} referrerPolicy="no-referrer" alt="User User" className="w-10 h-10 rounded-full ring-2 ring-white/80 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold ring-2 ring-white/80 shadow-sm text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">{user.displayName || user.email?.split('@')[0] || "Người dùng"}</span>
              <span className="text-xs text-slate-500 font-semibold truncate">{user.email}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
