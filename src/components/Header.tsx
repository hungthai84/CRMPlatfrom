import { useState, useEffect } from 'react';
import { Search, Settings, LogOut, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  currentTab: string;
  onMenuClick?: () => void;
}

export function Header({ currentTab, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'CRM Dashboard',
          subtitle: `Welcome back, ${user?.displayName || user?.email?.split('@')[0] || 'Imran'}!`
        };
      case 'customers':
        return {
          title: 'Loyalty Customers',
          subtitle: 'An toàn dữ liệu & Thông tin chi tiết khách hàng thành viên'
        };
      case 'customer360':
        return {
          title: 'Customer 360° Profile',
          subtitle: 'Góc nhìn toàn diện về hoạt động & hành vi khách hàng'
        };
      case 'sales':
        return {
          title: 'Sales Pipeline & Opportunities',
          subtitle: 'Theo dõi tiến trình đàm phán thương vụ triển vọng'
        };
      case 'tickets':
        return {
          title: 'Customer Support Tickets',
          subtitle: 'Phó thác trách nhiệm hỗ trợ kỹ thuật khách hàng'
        };
      case 'marketing':
        return {
          title: 'AI Marketing Automation',
          subtitle: 'Khởi tạo các chiến dịch tự động hiệu suất tối đa'
        };
      case 'docs':
        return {
          title: 'Architecture & Flowcharts',
          subtitle: 'Sơ đồ thiết kế hệ thống và quy trình nghiệp vụ'
        };
      case 'leads':
        return {
          title: 'Quản lý Khách Tiềm năng',
          subtitle: 'Kiểm soát & nuôi dưỡng cơ hội kinh doanh'
        };
      case 'omnichannel':
        return {
          title: 'Giao tiếp Đa kênh',
          subtitle: 'Tương tác tập trung từ Mạng xã hội, Email, Điện thoại'
        };
      case 'knowledge':
        return {
          title: 'Kho tri thức',
          subtitle: 'Tài liệu hướng dẫn, FAQ, Wiki nội bộ'
        };
      case 'loyalty':
        return {
          title: 'Quản lý Khách hàng thân thiết',
          subtitle: 'Điều hành hạng thẻ, tích điểm, và chiến dịch ưu đãi'
        };
      case 'journey':
        return {
          title: 'Hành trình Khách hàng',
          subtitle: 'Bản đồ theo dõi điểm chạm & hiệu suất chuyển đổi'
        };
      case 'tasks':
        return {
          title: 'Quản lý Công việc & Lịch',
          subtitle: 'Giao việc, nhắc nhở & đồng bộ Google Calendar'
        };
      case 'surveys':
        return {
          title: 'Khảo sát & Phản hồi',
          subtitle: 'Ghi nhận NPS, CSAT và phản hồi chất lượng dịch vụ'
        };
      case 'reports':
        return {
          title: 'Báo cáo & Phân tích',
          subtitle: 'Báo cáo chỉ số kinh doanh toàn diện bằng AI'
        };
      case 'workflows':
        return {
          title: 'AI Copilot & Quy trình',
          subtitle: 'Thiết lập tự động hóa, phân luồng Ticket & Nhắc việc'
        };
      case 'documents':
        return {
          title: 'Bảo mật Tài liệu',
          subtitle: 'Lưu trữ Hợp đồng, báo giá, hóa đơn trên đám mây'
        };
      case 'users':
        return {
          title: 'Phân quyền Hệ thống',
          subtitle: 'Quản lý vai trò (CRM Admin, Sales, CS, Marketing)'
        };
      default:
        return {
          title: 'Trung tâm Quản trị CRM',
          subtitle: 'Công cụ điều khiển CRM nâng cao do AI hỗ trợ'
        };
    }
  };

  const meta = getHeaderMeta();

  return (
    <header className="h-20 bg-transparent flex items-center justify-between px-6 sticky top-0 z-20 w-full mb-2">
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-[#e4e7ec] dark:border-slate-800 shadow-sm rounded-full mr-3 shrink-0"
      >
        <Menu size={18} />
      </button>

      {/* Dynamic Title / Subtitle on the left */}
      <div className="flex flex-col flex-1 min-w-0 pr-4">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug truncate">
          {meta.title}
        </h1>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-semibold mt-0.5 truncate">
          {meta.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Search bar */}
        <div className="hidden md:block relative w-[18rem] sm:w-[24rem]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-11 pr-12 py-2.5 border border-[#e4e7ec] dark:border-slate-800 rounded-full leading-5 bg-white dark:bg-slate-900 placeholder-slate-400 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 sm:text-xs transition-all shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-1.5 py-0.5 rounded-md">⌘ K</span>
          </div>
        </div>

        {/* Mobile Search Button */}
         <button className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#4f46e5] bg-white dark:bg-slate-900 border border-[#e4e7ec] dark:border-slate-800 shadow-sm rounded-full transition-all shrink-0">
          <Search size={18} />
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#4f46e5] bg-white dark:bg-slate-900 border border-[#e4e7ec] dark:border-slate-800 shadow-sm rounded-full transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <NotificationCenter />

        <button className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#4f46e5] bg-white dark:bg-slate-900 border border-[#e4e7ec] dark:border-slate-800 shadow-sm rounded-full transition-all">
          <Settings size={18} />
        </button>

        <button onClick={logout} className="w-11 h-11 flex items-center justify-center text-rose-500 hover:text-white hover:bg-rose-500 bg-white dark:bg-slate-900 border border-[#e4e7ec] dark:border-slate-800 shadow-sm rounded-full transition-all" title="Đăng xuất">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
