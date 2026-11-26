import React, { useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Bot,
  Briefcase,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Headphones,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  Plug,
  ShieldCheck,
  UserPlus,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { ModuleKey } from '../../types/crm';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../ui/Primitives';

interface NavItem {
  id: ModuleKey;
  labelVi: string;
  labelEn: string;
  icon: React.ReactNode;
}

interface NavGroup {
  id: string;
  titleVi: string;
  titleEn: string;
  items: NavItem[];
}

export const SIDEBAR_GROUPS: NavGroup[] = [
  {
    id: 'core',
    titleVi: 'Tổng quan',
    titleEn: 'Overview',
    items: [
      { id: 'dashboard', labelVi: '01. Bảng điều hành', labelEn: '01. Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    id: 'growth',
    titleVi: 'Khách hàng & Bán hàng',
    titleEn: 'Customers & Sales',
    items: [
      { id: 'customers', labelVi: '02. Khách hàng 360°', labelEn: '02. Customer 360°', icon: <Users className="w-4 h-4" /> },
      { id: 'leads', labelVi: '03. Khách tiềm năng', labelEn: '03. Lead Management', icon: <UserPlus className="w-4 h-4" /> },
      { id: 'sales', labelVi: '04. Quản trị Bán hàng', labelEn: '04. Sales CRM', icon: <Briefcase className="w-4 h-4" /> },
      { id: 'tasks', labelVi: '05. Công việc & Lịch', labelEn: '05. Tasks & Calendar', icon: <CheckSquare className="w-4 h-4" /> },
    ],
  },
  {
    id: 'service',
    titleVi: 'Giao tiếp & Dịch vụ',
    titleEn: 'Service & Inbox',
    items: [
      { id: 'omnichannel', labelVi: '06. Hộp thư Đa kênh', labelEn: '06. Omnichannel Inbox', icon: <MessageSquare className="w-4 h-4" /> },
      { id: 'service', labelVi: '07. Ticket & SLA', labelEn: '07. Service & Tickets', icon: <Headphones className="w-4 h-4" /> },
    ],
  },
  {
    id: 'operations',
    titleVi: 'Marketing & Vận hành',
    titleEn: 'Marketing & Ops',
    items: [
      { id: 'marketing', labelVi: '08. Marketing CRM', labelEn: '08. Marketing CRM', icon: <Megaphone className="w-4 h-4" /> },
      { id: 'products', labelVi: '09. Sản phẩm & Hợp đồng', labelEn: '09. Products & Contracts', icon: <Package className="w-4 h-4" /> },
      { id: 'workflows', labelVi: '10. Tự động hóa Workflow', labelEn: '10. Workflow Builder', icon: <Workflow className="w-4 h-4" /> },
    ],
  },
  {
    id: 'intelligence',
    titleVi: 'AI & Phân tích BI',
    titleEn: 'AI & Analytics',
    items: [
      { id: 'ai', labelVi: '11. Trung tâm AI Copilot', labelEn: '11. AI CRM Copilot', icon: <Bot className="w-4 h-4" /> },
      { id: 'reports', labelVi: '12. Báo cáo & BI', labelEn: '12. Reports & BI', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    id: 'enterprise',
    titleVi: 'Tổ chức & Khách hàng',
    titleEn: 'Organization & Portal',
    items: [
      { id: 'employees', labelVi: '13. Nhân sự & Nhóm', labelEn: '13. Employees & Teams', icon: <Activity className="w-4 h-4" /> },
      { id: 'documents', labelVi: '14. Tài liệu & Tri thức', labelEn: '14. Docs & Knowledge', icon: <FileText className="w-4 h-4" /> },
      { id: 'portal', labelVi: '15. Cổng Khách hàng', labelEn: '15. Customer Portal', icon: <Globe className="w-4 h-4" /> },
      { id: 'loyalty', labelVi: '18. Khách hàng Thân thiết', labelEn: '18. Loyalty & Retention', icon: <Award className="w-4 h-4" /> },
    ],
  },
  {
    id: 'platform',
    titleVi: 'Tích hợp & Bảo mật',
    titleEn: 'System & Security',
    items: [
      { id: 'integrations', labelVi: '16. Tích hợp & Webhook', labelEn: '16. Integrations & API', icon: <Plug className="w-4 h-4" /> },
      { id: 'admin', labelVi: '17. Quản trị & Bảo mật', labelEn: '17. Admin & Security', icon: <ShieldCheck className="w-4 h-4" /> },
    ],
  },
];

interface SidebarProps {
  activeModule: ModuleKey;
  onSelectModule: (mod: ModuleKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { can } = useAuth();
  const { language } = useTheme();
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setClosedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="absolute inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'absolute lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0b1730] text-slate-200 border-r border-white/10 transition-all duration-200 shrink-0',
          collapsed ? 'w-[72px]' : 'w-[264px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg blue-cyan-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                1C
              </div>
              <span className="font-heading font-bold text-base tracking-tight text-white truncate">
                ONECRM
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg blue-cyan-gradient flex items-center justify-center text-white font-bold text-sm mx-auto">
              1C
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2.5 space-y-4">
          {SIDEBAR_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => can(item.id, 'view'));
            if (visibleItems.length === 0) return null;
            const isClosed = closedGroups[group.id];

            return (
              <div key={group.id}>
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <span className="truncate">{language === 'vi' ? group.titleVi : group.titleEn}</span>
                    <ChevronDown
                      className={cn('w-3.5 h-3.5 transition-transform', isClosed && '-rotate-90')}
                    />
                  </button>
                )}

                {(!isClosed || collapsed) && (
                  <div className="mt-1 space-y-0.5">
                    {visibleItems.map((item) => {
                      const active = activeModule === item.id;
                      const label = language === 'vi' ? item.labelVi : item.labelEn;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectModule(item.id);
                            onCloseMobile();
                          }}
                          title={collapsed ? label : undefined}
                          className={cn(
                            'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors cursor-pointer text-left',
                            collapsed && 'justify-center px-0',
                            active
                              ? 'bg-[#1951fc] text-white font-semibold shadow-sm'
                              : 'text-slate-300 hover:bg-white/8 hover:text-white'
                          )}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          {!collapsed && <span className="truncate">{label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
