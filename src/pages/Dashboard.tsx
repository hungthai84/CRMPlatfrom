import React, { useState, useEffect } from 'react';
import { Area, AreaChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, BarChart } from 'recharts';
import { ArrowUpRight, TrendingUp, Users, DollarSign, Ticket, Plus, ArrowUp, Briefcase, ChevronRight, Edit2, Trash2, Clock, Calendar, CheckSquare, Bell, X, AlertCircle, Settings2, Download, Eye, EyeOff, ArrowDown } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getAccessToken } from '../lib/firebase';
import { logActivity } from '../lib/auditLogger';
import { useAuth } from '../contexts/AuthContext';
import { mockCustomers } from '../data/mockData';
import { generateDemoCustomers } from '../lib/generateDemoData';
import { Sparkles } from 'lucide-react';

// Chart analytics data matching the curves of the screenshot
const analyticsData = [
  { name: 'Jan', value: 300, barValue: 600 },
  { name: 'Feb', value: 500, barValue: 750 },
  { name: 'Mar', value: 580, barValue: 650 },
  { name: 'Apr', value: 750, barValue: 900 },
  { name: 'May', value: 680, barValue: 800 },
  { name: 'Jun', value: 520, barValue: 700 },
  { name: 'July', value: 640, barValue: 850 },
  { name: 'Aug', value: 560, barValue: 720 },
  { name: 'Sep', value: 700, barValue: 840 },
];

const heatmapData = [
  { day: 'Mon', hour: '9AM', count: 120 }, { day: 'Mon', hour: '12PM', count: 180 }, { day: 'Mon', hour: '3PM', count: 250 }, { day: 'Mon', hour: '6PM', count: 90 },
  { day: 'Tue', hour: '9AM', count: 140 }, { day: 'Tue', hour: '12PM', count: 300 }, { day: 'Tue', hour: '3PM', count: 320 }, { day: 'Tue', hour: '6PM', count: 110 },
  { day: 'Wed', hour: '9AM', count: 200 }, { day: 'Wed', hour: '12PM', count: 280 }, { day: 'Wed', hour: '3PM', count: 400 }, { day: 'Wed', hour: '6PM', count: 150 },
  { day: 'Thu', hour: '9AM', count: 180 }, { day: 'Thu', hour: '12PM', count: 250 }, { day: 'Thu', hour: '3PM', count: 380 }, { day: 'Thu', hour: '6PM', count: 120 },
  { day: 'Fri', hour: '9AM', count: 150 }, { day: 'Fri', hour: '12PM', count: 200 }, { day: 'Fri', hour: '3PM', count: 260 }, { day: 'Fri', hour: '6PM', count: 200 },
];

// Leads donut data
const leadData = [
  { name: 'Desktop', value: 1207, color: '#ec4899' }, // Pink
  { name: 'Laptop', value: 1152, color: '#2F69FF' },  // Power Blue
  { name: 'Mobile', value: 1624, color: '#f59e0b' },  // Orange/Gold
];

// Stat card design with interactive mini indicators
interface MiniBarChartProps {
  color: string;
  heights: number[];
  glowIndex?: number;
}

function MiniBarIndicator({ color, heights, glowIndex }: MiniBarChartProps) {
  return (
    <div className="flex gap-[3px] items-end h-8 shrink-0">
      {heights.map((h, i) => (
        <div key={i} className="relative flex items-end">
          <div 
            style={{ height: `${h}%` }} 
            className={`w-[5px] rounded-full ${color}`}
          />
          {glowIndex === i && (
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full border border-white shadow-sm ${color}`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  timeframe: string;
  theme: 'purple' | 'blue' | 'orange';
  icon: any;
  miniHeights: number[];
  glowIndex?: number;
}

function PremiumStatCard({ title, value, change, timeframe, theme, icon: Icon, miniHeights, glowIndex }: StatCardProps) {
  const styles = {
    purple: {
      bg: 'bg-[#eef2ff]',
      text: 'text-[#2F69FF]',
      bar: 'bg-[#2F69FF]',
    },
    blue: {
      bg: 'bg-[#e3f2fd]',
      text: 'text-[#1e88e5]',
      bar: 'bg-[#1e88e5]',
    },
    orange: {
      bg: 'bg-[#fff3e0]',
      text: 'text-[#fb8c00]',
      bar: 'bg-[#fb8c00]',
    }
  };

  const currentStyle = styles[theme];

  return (
    <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between h-44 relative overflow-hidden">
      <div className="flex justify-between items-start">
        {/* Metric icon with rounded pill banner */}
        <div className={`w-11 h-11 flex items-center justify-center rounded-[10px] ${currentStyle.bg} ${currentStyle.text} shadow-sm shrink-0`}>
          <Icon size={20} />
        </div>
        
        {/* Trend pill inside a sleek gray micro-container */}
        <div className={`text-xs font-bold leading-none py-1.5 px-2.5 rounded-full bg-[#f4f6fa] ${currentStyle.text}`}>
          {change}
        </div>
      </div>
      
      <div className="flex justify-between items-end mt-4">
        <div>
          <h3 className="text-[#8c94a5] text-[11px] font-bold tracking-wide uppercase">{title}</h3>
          <p className="text-2xl font-extrabold text-[#0e0e11] tracking-tight mt-1">{value}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{timeframe}</span>
        </div>
        
        {/* Custom Mini Bar Charts matching the mockup visually */}
        <div className="pb-1">
          <MiniBarIndicator color={currentStyle.bar} heights={miniHeights} glowIndex={glowIndex} />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [activeCustomerCount, setActiveCustomerCount] = useState<number>(0);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [pendingTicketCount, setPendingTicketCount] = useState<number>(0);
  const [totalLtv, setTotalLtv] = useState<number>(0);
  const [salesVelocityData, setSalesVelocityData] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  
  // States for the 24-hour upcoming tasks notification system
  const [calendarTasks, setCalendarTasks] = useState<any[]>([]);
  const [dismissedTasks, setDismissedTasks] = useState<string[]>([]);
  const [showTasksNotification, setShowTasksNotification] = useState<boolean>(true);

  // States for dashboard customization setting dialog
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [kpiConfigs, setKpiConfigs] = useState(() => {
    const saved = localStorage.getItem('crm_kpi_configs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      { id: 'active_customers', label: 'Active Customers (Khách hàng hoạt động)', visible: true },
      { id: 'pending_tickets', label: 'Pending Support Tickets (Yêu cầu chưa xử lý)', visible: true },
      { id: 'sales_growth', label: 'Current Month Sales Growth (Tăng trưởng doanh số)', visible: true }
    ];
  });

  const [panelConfigs, setPanelConfigs] = useState(() => {
    const saved = localStorage.getItem('crm_panel_configs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      { id: 'revenue_analytics', label: 'Revenue Analytics (Doanh thu)', visible: true },
      { id: 'sales_velocity', label: 'Sales Velocity (Tỷ lệ chuyển đổi)', visible: true },
      { id: 'deals_statistics', label: 'Deals Statistics (Danh sách giao dịch)', visible: true },
      { id: 'leads_source', label: 'Leads by Source (Nguồn lượng truy cập)', visible: true },
      { id: 'ai_assistant', label: 'AI Assistant (Trợ lý AI)', visible: true },
      { id: 'top_deals', label: 'Top Deals (Giao dịch hot nhất)', visible: true }
    ];
  });

  // States for the 1-hour urgent task alert notification system
  const [taskAlerts, setTaskAlerts] = useState<any[]>([]);
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<string[]>([]);

  const handleToggleKpi = (id: string) => {
    const next = kpiConfigs.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
    setKpiConfigs(next);
    localStorage.setItem('crm_kpi_configs', JSON.stringify(next));
  };

  const handleMoveKpi = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= kpiConfigs.length) return;
    const next = [...kpiConfigs];
    const temp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = temp;
    setKpiConfigs(next);
    localStorage.setItem('crm_kpi_configs', JSON.stringify(next));
  };

  const handleTogglePanel = (id: string) => {
    const next = panelConfigs.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
    setPanelConfigs(next);
    localStorage.setItem('crm_panel_configs', JSON.stringify(next));
  };

  const handleMovePanel = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= panelConfigs.length) return;
    const next = [...panelConfigs];
    const temp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = temp;
    setPanelConfigs(next);
    localStorage.setItem('crm_panel_configs', JSON.stringify(next));
  };

  const handleResetDashboard = () => {
    const defaultKpis = [
      { id: 'active_customers', label: 'Active Customers (Khách hàng hoạt động)', visible: true },
      { id: 'pending_tickets', label: 'Pending Support Tickets (Yêu cầu chưa xử lý)', visible: true },
      { id: 'sales_growth', label: 'Current Month Sales Growth (Tăng trưởng doanh số)', visible: true }
    ];
    const defaultPanels = [
      { id: 'revenue_analytics', label: 'Revenue Analytics (Doanh thu)', visible: true },
      { id: 'sales_velocity', label: 'Sales Velocity (Tỷ lệ chuyển đổi)', visible: true },
      { id: 'deals_statistics', label: 'Deals Statistics (Danh sách giao dịch)', visible: true },
      { id: 'leads_source', label: 'Leads by Source (Nguồn lượng truy cập)', visible: true },
      { id: 'ai_assistant', label: 'AI Assistant (Trợ lý AI)', visible: true },
      { id: 'top_deals', label: 'Top Deals (Giao dịch hot nhất)', visible: true }
    ];
    setKpiConfigs(defaultKpis);
    setPanelConfigs(defaultPanels);
    localStorage.removeItem('crm_kpi_configs');
    localStorage.removeItem('crm_panel_configs');
    logActivity('CÀI_ĐẶT_DASHBOARD', 'DASHBOARD_PREFERENCES', 'Đã khôi phục bố cục mặc định Dashboard');
  };

  const triggerSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await generateDemoCustomers(user.uid);
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi khởi tạo dữ liệu mẫu: " + (err as any).message);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Real-time customers from Firestore
    const qCustomers = isAdmin 
      ? collection(db, 'customers')
      : query(collection(db, 'customers'), where('ownerId', '==', user.uid));
      
    const unsubCustomers = onSnapshot(qCustomers, (snap) => {
      setCustomerCount(snap.size);
      let ltv = 0;
      let active = 0;
      snap.forEach(doc => {
        const d = doc.data();
        ltv += (d.lifetimeValue || 0);
        // Customer is active if status is Hoạt động, Active, or not set
        if (d.status === 'Hoạt động' || d.status === 'Active' || !d.status) {
          active++;
        }
      });
      setTotalLtv(ltv);
      setActiveCustomerCount(active);
    });

    // Real-time tickets from Firestore
    const qTickets = isAdmin 
      ? collection(db, 'tickets')
      : query(collection(db, 'tickets'), where('ownerId', '==', user.uid));
      
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      setTicketCount(snap.size);
      let pending = 0;
      snap.forEach(doc => {
        const d = doc.data();
        if (d.status === 'new' || d.status === 'processing' || d.status === 'pending') {
          pending++;
        }
      });
      setPendingTicketCount(pending);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tickets');
    });

    // Real-time sales velocity from Firestore
    const qVelocity = query(
      collection(db, 'sales_velocity'),
      where('ownerId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );
    
    const unsubVelocity = onSnapshot(qVelocity, (snap) => {
      if (snap.empty) {
        const staticFallback = Array.from({ length: 12 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (11 - i) * 2);
          const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
          const leads = Math.floor(Math.random() * 20) + 30;
          const conv = Math.floor(Math.random() * 10) + 8;
          return {
            date: dateStr,
            leadsCount: leads,
            convertedCount: conv,
            conversionRate: parseFloat(((conv / leads) * 100).toFixed(1))
          };
        });
        setSalesVelocityData(staticFallback);
      } else {
        const data = snap.docs.map(doc => {
          const payload = doc.data();
          let label = payload.date;
          try {
            const parts = payload.date.split('-');
            if (parts.length === 3) {
              label = `${parts[2]}/${parts[1]}`;
            }
          } catch (e) {}
          return {
            id: doc.id,
            ...payload,
            date: label
          };
        });
        setSalesVelocityData(data.slice(-30));
      }
    }, (err) => {
      console.warn("Could not query sales_velocity in real-time, loading static fallback:", err);
      const staticFallback = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (11 - i) * 2);
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
        const leads = Math.floor(Math.random() * 20) + 30;
        const conv = Math.floor(Math.random() * 10) + 8;
        return {
          date: dateStr,
          leadsCount: leads,
          convertedCount: conv,
          conversionRate: parseFloat(((conv / leads) * 100).toFixed(1))
        };
      });
      setSalesVelocityData(staticFallback);
    });

    // Attempt to query Google Calendar upcoming events (next 24 hours)
    const fetchGoogleCalendarUpcoming = async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const nowIso = new Date().toISOString();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowIso = tomorrow.toISOString();
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${nowIso}&timeMax=${tomorrowIso}&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const data = await res.json();
        if (data.items) {
          const googleEvents = data.items.map((item: any) => ({
            id: item.id,
            title: item.summary,
            dueIn: 'Sự kiện Google Calendar',
            time: item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date),
            isGoogle: true,
            link: item.htmlLink
          }));
          setCalendarTasks(googleEvents);
        }
      } catch (err) {
        console.warn("Dashboard was unable to fetch Google Calendar events:", err);
      }
    };
    fetchGoogleCalendarUpcoming();

    return () => {
      unsubCustomers();
      unsubTickets();
      unsubVelocity();
    };
  }, [user, isAdmin]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  // Helper to construct local impending tasks in next 24h
  const getLocalUpcomingTasks = () => {
    const now = new Date();
    const tUrgent1 = new Date(now.getTime() + 35 * 60 * 1000); // 35 minutes
    const t1 = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
    const t2 = new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // 5.5 hours
    const t3 = new Date(now.getTime() + 14 * 60 * 60 * 1000); // 14 hours
    
    return [
      {
        id: "crm-task-urgent-1",
        title: "Nhắc nhở VIP: Xử lý bàn giao tài liệu kỹ thuật & API cho Công ty Nguyễn Lâm",
        dueLabel: "Trong 35 phút nữa",
        time: tUrgent1,
        isGoogle: false,
        priority: "Khẩn cấp"
      },
      {
        id: "crm-task-1",
        title: "Gọi điện tư vấn Vũ Nhật Tú về nâng cấp hệ thống đào tạo CRM",
        dueLabel: "Trong 2 giờ nữa",
        time: t1,
        isGoogle: false,
        priority: "Khẩn cấp"
      },
      {
        id: "crm-task-2",
        title: "Xử lý khẩn cấp Ticket hỗ trợ giải pháp AI cho Công ty Cổ phần Thắng Lợi",
        dueLabel: "Trong 5.5 giờ nữa",
        time: t2,
        isGoogle: false,
        priority: "Khẩn cấp"
      },
      {
        id: "crm-task-3",
        title: "Hoàn tất hợp đồng & báo giá chi tiết Techcom Corp",
        dueLabel: "Trong 14 giờ nữa",
        time: t3,
        isGoogle: false,
        priority: "Trung bình"
      }
    ];
  };

  const getSalesGrowthMetric = () => {
    if (salesVelocityData.length >= 10) {
      const half = Math.floor(salesVelocityData.length / 2);
      const recent = salesVelocityData.slice(-half);
      const past = salesVelocityData.slice(0, half);
      
      const recentRate = recent.reduce((acc, curr) => acc + (curr.conversionRate || 0), 0) / half;
      const pastRate = past.reduce((acc, curr) => acc + (curr.conversionRate || 0), 0) / half;
      
      if (pastRate > 0) {
        const growth = ((recentRate - pastRate) / pastRate) * 100;
        return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
      }
    }
    return "+24.8%";
  };

  // Checker for urgent tasks within 1 hour
  useEffect(() => {
    const checkUrgentTasks = () => {
      const now = new Date();
      const allUpcoming = [...calendarTasks, ...getLocalUpcomingTasks()];
      const urgent = allUpcoming.filter(task => {
        const timeDiff = task.time.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000;
        // In next 1 hour, or in the past 10 minutes (to avoid dropping it immediately)
        const isUrgent = timeDiff > -10 * 60 * 1000 && timeDiff <= oneHour;
        return isUrgent && !notifiedTaskIds.includes(task.id) && !dismissedTasks.includes(task.id);
      });

      if (urgent.length > 0) {
        setTaskAlerts(prev => {
          const existingIds = prev.map(t => t.id);
          const next = [...prev];
          urgent.forEach(u => {
            if (!existingIds.includes(u.id)) {
              next.push(u);
            }
          });
          return next;
        });

        setNotifiedTaskIds(prev => {
          const next = [...prev];
          urgent.forEach(u => {
            if (!next.includes(u.id)) {
              next.push(u.id);
            }
          });
          return next;
        });

        // Trigger native window notification if permission is granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          urgent.forEach(u => {
            try {
              new Notification("CRM Gửi Nhắc Nhở Nhiệm Vụ Gấp", {
                body: `Nhiệm vụ "${u.title}" đến hạn hôm nay!`,
                silent: false
              });
            } catch (e) {
              console.warn("Could not fire system notification:", e);
            }
          });
        }
      }
    };

    // Prompt for notification permission on mount if supported
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    checkUrgentTasks();
    const interval = setInterval(checkUrgentTasks, 15000); // Check status every 15 seconds
    return () => clearInterval(interval);
  }, [calendarTasks, notifiedTaskIds, dismissedTasks]);

  const handleExportDashboardCsv = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    
    // 1. CRM Indicators
    csvContent += "=== CHỈ SỐ CRM HIỆN TẠI ===\n";
    csvContent += "Chỉ số,Giá trị,Mô tả\n";
    csvContent += `Khách hàng hoạt động,${displayActiveCustomers},Sự đồng bộ hệ thống\n`;
    csvContent += `Yêu cầu hỗ trợ chờ giải quyết (Pending Tickets),${displayPendingTickets},Phiếu hỗ trợ đang xử lý\n`;
    csvContent += `Tăng trưởng doanh số tháng hiện tại,${displaySalesGrowth},Tỷ lệ tăng trưởng doanh số thực tế\n\n`;
    
    // 2. Revenue Analytics Section
    csvContent += "=== PHÂN TÍCH DOANH THU (REVENUE ANALYTICS) ===\n";
    csvContent += "Tháng,Thực tế (Actual Value),Mục tiêu (Goal Target)\n";
    analyticsData.forEach(item => {
      csvContent += `${item.name},${item.value},${item.barValue}\n`;
    });
    csvContent += "\n";
    
    // 3. Sales Velocity Section
    csvContent += "=== HIỆU SUẤT CHUYỂN ĐỔI (SALES VELOCITY) ===\n";
    csvContent += "Ngày,Số lượng Leads,Số chuyển đổi,Tỷ lệ chuyển đổi\n";
    salesVelocityData.forEach(item => {
      csvContent += `${item.date || ''},${item.leadsCount || 0},${item.convertedCount || 0},${item.conversionRate || 0}%\n`;
    });
    csvContent += "\n";
    
    // 4. Traffic Channels
    csvContent += "=== NGUỒN KHÁCH HÀNG (LEADS BY SOURCE) ===\n";
    csvContent += "Kênh,Số lượng\n";
    csvContent += "Desktop,1207\n";
    csvContent += "Laptop,1152\n";
    csvContent += "Mobile,1624\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crm_dashboard_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logActivity('XUẤT_BÁO_CÁO', 'DASHBOARD_EXPORTS', 'Đã xuất dữ liệu báo cáo CRM Dashboard sang file CSV');
  };

  // Combine and sort tasks
  const allTasks = [...calendarTasks, ...getLocalUpcomingTasks()].sort((a, b) => a.time.getTime() - b.time.getTime());
  const activeTasks = allTasks.filter(t => !dismissedTasks.includes(t.id));

  const handleCompleteTask = async (taskId: string, taskTitle: string) => {
    setDismissedTasks(prev => [...prev, taskId]);
    try {
      await logActivity('HOÀN_THÀNH_NHIỆM_VỤ', 'CRM_TASKS', `Đã hoàn thành nhiệm vụ sắp tới: "${taskTitle}"`);
    } catch (e) {
      console.warn("Could not log completed task activity:", e);
    }
  };

  // Active Customers count fallback
  const displayActiveCustomers = activeCustomerCount > 0 ? activeCustomerCount.toLocaleString() : "4,015";
  const displayPendingTickets = pendingTicketCount > 0 ? pendingTicketCount.toLocaleString() : "115";
  const displaySalesGrowth = getSalesGrowthMetric();

  return (
    <div className="w-full h-full p-4 lg:p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar relative">
      {/* 1-Hour Urgent Toast Alerts Container - Fixed Floating Overlay */}
      <div className="fixed top-6 right-6 z-[100] space-y-3 w-96 max-w-full pointer-events-none">
        {taskAlerts.map((alert) => (
          <div 
            key={alert.id}
            className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-2xl pointer-events-auto flex gap-3 relative overflow-hidden transition-all hover:scale-[1.02] duration-300"
          >
            {/* Red accent ribbon */}
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-500"></div>
            <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Nhiệm vụ khẩn cấp (Sắp đến hạn)</h5>
                <button 
                  onClick={() => setTaskAlerts(prev => prev.filter(t => t.id !== alert.id))}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs font-bold text-slate-150 leading-snug mt-1">{alert.title}</p>
              <p className="text-[10px] text-slate-400 mt-2 font-semibold">
                Đến hạn lúc {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({alert.dueLabel || 'trong vòng 1 giờ'})
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Customization Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Cấu hình hiển thị CRM Dashboard</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Sắp xếp thứ tự hoặc đóng/mở các báo cáo chỉ số.</p>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[460px] space-y-6 no-scrollbar">
              {/* KPIs custom list */}
              <div>
                <h4 className="text-xs font-black text-[#2F69FF] uppercase tracking-widest mb-3">1. Thẻ chỉ số chính (KPI Cards)</h4>
                <div className="space-y-2">
                  {kpiConfigs.map((cfg, idx) => (
                    <div 
                      key={cfg.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <span className="text-xs font-bold text-slate-800">{cfg.label}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          disabled={idx === 0}
                          onClick={() => handleMoveKpi(idx, 'up')}
                          className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                          title="Di chuyển lên"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button 
                          disabled={idx === kpiConfigs.length - 1}
                          onClick={() => handleMoveKpi(idx, 'down')}
                          className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button 
                          onClick={() => handleToggleKpi(cfg.id)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                            cfg.visible 
                              ? 'bg-blue-50 border-blue-205 text-blue-600 hover:bg-blue-100' 
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                          }`}
                          title={cfg.visible ? 'Ẩn thẻ' : 'Hiển thị thẻ'}
                        >
                          {cfg.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panels / Charts config list */}
              <div>
                <h4 className="text-xs font-black text-[#2F69FF] uppercase tracking-widest mb-3">2. Biểu đồ bảng biểu chính</h4>
                <div className="space-y-2">
                  {panelConfigs.map((cfg, idx) => (
                    <div 
                      key={cfg.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <span className="text-xs font-bold text-slate-800">{cfg.label}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          disabled={idx === 0}
                          onClick={() => handleMovePanel(idx, 'up')}
                          className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                          title="Di chuyển lên"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button 
                          disabled={idx === panelConfigs.length - 1}
                          onClick={() => handleMovePanel(idx, 'down')}
                          className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button 
                          onClick={() => handleTogglePanel(cfg.id)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                            cfg.visible 
                              ? 'bg-blue-50 border-blue-205 text-blue-600 hover:bg-blue-100' 
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                          }`}
                          title={cfg.visible ? 'Ẩn báo cáo' : 'Hiển thị báo cáo'}
                        >
                          {cfg.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-gray-50 flex items-center justify-between">
              <button 
                onClick={handleResetDashboard}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 cursor-pointer"
              >
                Khôi phục mặc định
              </button>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="bg-[#2F69FF] text-white px-5 py-2 rounded-xl text-xs font-extrabold hover:bg-opacity-90 shadow-md shadow-[#2F69FF]/15 transition-all cursor-pointer"
              >
                Xác nhận & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Page Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">CRM Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-semibold">Tự động hóa kết quả doanh thu, liên kết hoạt động và quản lý chất lượng hỗ trợ SLA.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-900 border border-gray-300 bg-white px-4 py-2.5 rounded-xl shadow-xs hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Settings2 size={14} className="text-gray-500 animate-spin [animation-duration:10s]" /> Tùy chỉnh Dashboard
          </button>
          <button 
            onClick={handleExportDashboardCsv}
            className="flex items-center gap-2 text-xs font-bold text-[#2F69FF] bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl shadow-xs hover:bg-blue-100 transition-all cursor-pointer animate-fadeIn"
          >
            <Download size={14} /> Xuất Báo Cáo (CSV)
          </button>
        </div>
      </div>

      {/* Premium Demo Data Seeder Banner */}
      <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-100/80 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/10">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Dữ liệu mẫu & Tính năng thử nghiệm CRM 360
            </h4>
            <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
              Khởi tạo trọn bộ dữ liệu mẫu gồm 8 Khách hàng cao cấp, 3 Yêu cầu hỗ trợ (Tickets liên kết tự động), Chiến dịch và Nhật ký hệ thống. Trải nghiệm trực quan các tính năng mới: Ghi chú bằng Giọng nói (Web Speech API) và phím tắt thông minh (Cmd+K, Cmd+N).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          {seedSuccess ? (
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-center w-full md:w-auto">
              ✓ Khởi tạo thành công!
            </div>
          ) : (
            <button
              onClick={triggerSeedData}
              disabled={seeding}
              className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-blue-500/10 transition-all flex items-center justify-center gap-2 ${
                seeding 
                  ? 'bg-blue-400 text-white cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-md'
              }`}
            >
              {seeding ? 'Đang tạo dữ liệu...' : 'Khởi tạo dữ liệu mẫu'}
            </button>
          )}
        </div>
      </div>

      {/* 24-Hour Upcoming Tasks Notification System */}
      {showTasksNotification && activeTasks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/65 border border-amber-200/80 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden animate-fadeIn">
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-amber-500/10 relative">
                <Bell size={18} className="animate-swing" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-amber-50 animate-bounce">
                  {activeTasks.length}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5 leading-snug">
                  Nhiệm vụ sắp tới (Trong 24 giờ tới)
                </h4>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  Các cuộc hẹn, lịch trình và yêu cầu CRM cần hoàn tất trong hôm nay nhằm đảm bảo chất lượng dịch vụ SLA.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTasksNotification(false)}
              className="p-1 hover:bg-amber-100/80 text-amber-700 rounded-lg transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto no-scrollbar pr-1 mt-1">
            {activeTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-3.5 bg-white/95 rounded-xl border border-amber-100 shadow-xs hover:shadow-sm transitions-all hover:border-amber-200"
              >
                <div className="flex items-center gap-3">
                  {task.isGoogle ? (
                    <Calendar size={16} className="text-[#2F69FF] shrink-0" />
                  ) : (
                    <Clock size={16} className="text-amber-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock size={10} />
                        Hạn chót: {task.dueLabel || 'Sự kiện Google Calendar'}
                      </span>
                      {task.priority && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                          task.priority === 'Khẩn cấp' ? 'bg-red-50 text-red-500 border border-red-100 animate-pulse' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.isGoogle ? (
                    <a 
                      href={task.link}
                      target="_blank" 
                      rel="noreferrer"
                      className="px-3 py-1.5 text-[10px] font-bold text-[#2F69FF] bg-[#2F69FF]/10 rounded-lg hover:bg-[#2F69FF]/15 transition-all text-center flex items-center gap-1"
                    >
                      Xem lịch sự kiện
                    </a>
                  ) : (
                    <button
                      onClick={() => handleCompleteTask(task.id, task.title)}
                      className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 transition-all text-center flex items-center gap-1 cursor-pointer"
                    >
                      <CheckSquare size={12} />
                      Hoàn thành
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic customizable stat card grid based on user preference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiConfigs.map((cfg) => {
          if (!cfg.visible) return null;
          if (cfg.id === 'active_customers') {
            return (
              <PremiumStatCard 
                key="active_customers"
                title="Active Customers" 
                value={displayActiveCustomers} 
                change="+12% 28 days" 
                timeframe={`Đang hoạt động trên tổng số ${customerCount > 0 ? customerCount : "4,562"} TV`} 
                theme="purple" 
                icon={Users}
                miniHeights={[35, 60, 45, 100]}
                glowIndex={3}
              />
            );
          }
          if (cfg.id === 'pending_tickets') {
            return (
              <PremiumStatCard 
                key="pending_tickets"
                title="Pending Support Tickets" 
                value={displayPendingTickets} 
                change="+19% This month" 
                timeframe={`Yêu cầu chưa đóng trên tổng số ${ticketCount > 0 ? ticketCount : "2,543"} phiếu`} 
                theme="orange" 
                icon={Ticket}
                miniHeights={[40, 60, 50, 80]}
              />
            );
          }
          if (cfg.id === 'sales_growth') {
            return (
              <PremiumStatCard 
                key="sales_growth"
                title="Current Month Sales Growth" 
                value={displaySalesGrowth} 
                change="+24.8% This month" 
                timeframe="Tỷ lệ tăng trưởng doanh số thực tế" 
                theme="blue" 
                icon={TrendingUp}
                miniHeights={[30, 45, 95, 55]}
              />
            );
          }
          return null;
        })}
      </div>

      {/* Main split grid: Revenue & Deals vs Leads and AI Assistant (Dynamic sorting applied per column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Spans 2 columns on large screen, handles left-eligible cards in customized order) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {panelConfigs.map((cfg) => {
            if (!cfg.visible) return null;
            
            // 1. Revenue Analytics Card
            if (cfg.id === 'revenue_analytics') {
              return (
                <div key="revenue_analytics" className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">Revenue Analytics</h3>
                      <p className="text-slate-400 text-xs font-semibold">Monthly overview & sales statistics</p>
                    </div>
                    <div>
                      <select className="bg-[#f4f6fa]/70 border border-[#e4e7ec] text-[11px] font-bold text-slate-600 rounded-full py-1.5 px-3.5 focus:outline-none transition-colors hover:bg-[#f0f2f7] cursor-pointer">
                        <option>Month</option>
                        <option>Quarter</option>
                        <option>Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Composed Chart representing beautiful rounded pill bars and line over it */}
                  <div className="h-68 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f7" strokeOpacity={0.8} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#8c94a5', fontSize: 11, fontWeight: 700 }} 
                          dy={8}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#8c94a5', fontSize: 11, fontWeight: 700 }} 
                          dx={-6}
                          domain={[0, 1000]}
                          tickCount={6}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(235, 238, 245, 0.4)', radius: 10 }}
                          contentStyle={{ 
                            borderRadius: '10px', 
                            border: '1px solid #f1f3f7', 
                            background: 'rgba(255,255,255,0.96)', 
                            backdropFilter: 'blur(8px)', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
                            padding: '10px 14px' 
                          }}
                          labelStyle={{ fontWeight: 800, color: '#1e293b', fontSize: '11px' }}
                          itemStyle={{ fontWeight: 700, fontSize: '11px' }}
                        />
                        {/* Subtle lower bars for background feel */}
                        <Bar 
                          dataKey="barValue" 
                          fill="#2F69FF" 
                          fillOpacity={0.15} 
                          radius={[4, 4, 4, 4]} 
                          barSize={20} 
                          name="Goal Target" 
                        />
                        {/* Fluid Line layered directly on top of the bars */}
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#2F69FF" 
                          strokeWidth={2.5} 
                          dot={{ fill: '#2F69FF', stroke: '#ffffff', strokeWidth: 2, r: 6 }} 
                          activeDot={{ r: 8 }}
                          name="Actual Value" 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            // 2. Sales Velocity Card
            if (cfg.id === 'sales_velocity') {
              return (
                <div key="sales_velocity" className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 animate-fadeIn" id="sales-velocity-card">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight flex items-center gap-2">
                        <TrendingUp className="text-[#2F69FF] h-5 w-5" />
                        Sales Velocity
                      </h3>
                      <p className="text-slate-400 text-xs font-semibold">Conversion rate of leads over the last 30 days</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        Avg: {salesVelocityData.length > 0 ? (salesVelocityData.reduce((acc, curr) => acc + (curr.conversionRate || 0), 0) / salesVelocityData.length).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesVelocityData} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                        <defs>
                          <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2F69FF" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#2F69FF" stopOpacity={0.15}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f7" strokeOpacity={0.8} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#8c94a5', fontSize: 10, fontWeight: 700 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#8c94a5', fontSize: 10, fontWeight: 700 }} 
                          dx={-10}
                          domain={[0, 100]}
                          tickFormatter={(tick) => `${tick}%`}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(47, 105, 255, 0.05)', radius: 6 }}
                          contentStyle={{ 
                            borderRadius: '10px', 
                            border: '1px solid #f1f3f7', 
                            background: 'rgba(255,255,255,0.96)', 
                            backdropFilter: 'blur(8px)', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
                            padding: '10px 14px' 
                          }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1 mb-1">{data.date}</p>
                                  <p className="text-[10px] font-bold text-slate-500">Leads: <span className="font-extrabold text-slate-800">{data.leadsCount}</span></p>
                                  <p className="text-[10px] font-bold text-slate-500">Converted: <span className="font-extrabold text-emerald-600">{data.convertedCount}</span></p>
                                  <p className="text-xs font-black text-[#2F69FF] mt-1 pt-1 border-t border-slate-100">Rate: {data.conversionRate}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="conversionRate" 
                          fill="url(#colorConversion)" 
                          radius={[6, 6, 0, 0]} 
                          barSize={16} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            // 3. Deals Statistics Card
            if (cfg.id === 'deals_statistics') {
              return (
                <div key="deals_statistics" className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 animate-fadeIn">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">Deals Statistics</h3>
                      <p className="text-slate-400 text-xs font-semibold">Tracking conversion stages of top prospects</p>
                    </div>
                    <div>
                      <select className="bg-[#f4f6fa]/70 border border-[#e4e7ec] text-[11px] font-bold text-slate-600 rounded-full py-1.5 px-3.5 focus:outline-none transition-colors hover:bg-[#f0f2f7] cursor-pointer">
                        <option>Sort by</option>
                        <option>Category</option>
                        <option>Date</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#f4f6fa] text-[#8c94a5] text-[10px] uppercase font-bold tracking-wider">
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#fcfdfd]">
                        <tr className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            <img 
                              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" 
                              alt="Simon Corel" 
                              className="w-10 h-10 rounded-full object-cover shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-100" 
                            />
                            <div>
                              <p className="font-extrabold text-xs text-slate-800 leading-snug">Simon Corel</p>
                              <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">simoncorel@gmail.com</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-600">Service</td>
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-600">Germany</td>
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-400">Aug 20, 2026</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button className="p-1.5 hover:bg-[#f0f2f5] text-slate-500 hover:text-[#2F69FF] rounded-lg transition-colors">
                                <Edit2 size={13} className="stroke-[2.5]" />
                              </button>
                              <button className="p-1.5 hover:bg-[#ffebee] text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                                <Trash2 size={13} className="stroke-[2.5]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {mockCustomers.map((cust, i) => (
                          <tr key={cust.id + i} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3.5 px-4 flex items-center gap-3">
                              <img 
                                src={cust.avatar || `https://i.pravatar.cc/150?u=${cust.id}`} 
                                alt={cust.name} 
                                className="w-10 h-10 rounded-full object-cover shadow-[0_2px_8px_rgba(0,0,0,0.055)] border border-slate-100" 
                              />
                              <div>
                                <p className="font-extrabold text-xs text-slate-800 leading-snug">{cust.name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">{cust.email}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-slate-600">
                              {cust.tier || 'Member'}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-slate-600">Vietnam</td>
                            <td className="py-3.5 px-4 text-xs font-bold text-slate-400">
                              {new Date(cust.lastInteraction || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button className="p-1.5 hover:bg-[#f0f2f5] text-slate-500 hover:text-[#2F69FF] rounded-lg transition-colors">
                                  <Edit2 size={13} className="stroke-[2.5]" />
                                </button>
                                <button className="p-1.5 hover:bg-[#ffebee] text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                                  <Trash2 size={13} className="stroke-[2.5]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )).slice(0, 2)}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Right Column (Handles right-eligible cards in customized order) */}
        <div className="space-y-6 flex flex-col">
          {panelConfigs.map((cfg) => {
            if (!cfg.visible) return null;

            // 1. Leads by Source Card
            if (cfg.id === 'leads_source') {
              return (
                <div key="leads_source" className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 animate-fadeIn">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">Leads by Source</h3>
                    <button className="text-slate-400 hover:text-slate-600 text-xs font-bold tracking-widest">•••</button>
                  </div>

                  <div className="relative h-44 flex items-center justify-center">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={leadData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {leadData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase leading-none">Total</p>
                      <p className="text-2xl font-black text-slate-800 mt-1 leading-none">4,145</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-2 border-t border-[#f8f9fb]">
                    <div className="border-l-2 border-pink-500 pl-3">
                      <p className="text-[10px] font-bold text-[#8c94a5] leading-none mb-1">Desktop</p>
                      <p className="text-sm font-extrabold text-slate-800 leading-none">1,207</p>
                    </div>
                    <div className="border-l-2 border-[#2F69FF] pl-3">
                      <p className="text-[10px] font-bold text-[#8c94a5] leading-none mb-1">Laptop</p>
                      <p className="text-sm font-extrabold text-slate-800 leading-none">1,152</p>
                    </div>
                    <div className="border-l-2 border-amber-500 pl-3">
                      <p className="text-[10px] font-bold text-[#8c94a5] leading-none mb-1">Mobile</p>
                      <p className="text-sm font-extrabold text-slate-800 leading-none">1,624</p>
                    </div>
                  </div>
                </div>
              );
            }

            // 2. AI Assistant Card
            if (cfg.id === 'ai_assistant') {
              return (
                <div key="ai_assistant" className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col justify-between min-h-[300px] animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">AI Assistant</h3>
                    <button className="text-slate-400 hover:text-slate-600 text-xs font-bold tracking-widest">•••</button>
                  </div>

                  <div className="relative py-8 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#2F69FF] via-[#5b8eff] to-[#1e40af] rounded-full filter blur-[14px] opacity-35 animate-pulse" />
                      <div className="absolute inset-2 border-2 border-dashed border-[#2F69FF]/40 rounded-full animate-spin [animation-duration:15s]" />
                      <div className="w-24 h-24 rounded-[40%] bg-gradient-to-br from-[#2F69FF] via-[#5b8eff] to-[#1e40af] shadow-[0_8px_24px_rgba(47,105,255,0.35)] animate-spin [animation-duration:8s] flex items-center justify-center" />
                      <div className="absolute w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm shadow-inner pointer-events-none" />
                    </div>
                    
                    <p className="text-[15px] font-bold text-[#4a5568] tracking-tight text-center mt-5">
                      What Can I Help With?
                    </p>
                  </div>

                  <div className="mt-2 flex items-center bg-[#ebf0ff]/60 border border-[#d2e0ff] rounded-full px-4 py-2 hover:bg-[#e2eaff]/80 transition-all">
                    <button className="text-[#2F69FF] hover:text-[#1e40af] p-1 bg-white rounded-full h-6 w-6 flex items-center justify-center shadow-sm shrink-0">
                      <Plus size={14} className="stroke-[3]" />
                    </button>
                    <input
                      type="text"
                      placeholder="Ask me anything"
                      className="bg-transparent border-none text-xs text-slate-700 font-bold placeholder-[#9da3bc] focus:outline-none w-full px-3.5"
                    />
                    <button className="bg-[#2F69FF] text-white p-2 rounded-full hover:bg-opacity-90 shadow-sm transition-all flex items-center justify-center shrink-0 w-8 h-8">
                      <ArrowUp size={16} className="stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            }

            // 3. Top Deals Card
            if (cfg.id === 'top_deals') {
              return (
                <div key="top_deals" className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-5 animate-fadeIn">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-[#0e0e11] uppercase tracking-wider">Top Deals</h3>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#2F69FF] font-extrabold text-[10px]">
                          TC
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-800">Techcom Corp Contract</h5>
                          <p className="text-[9px] text-[#2F69FF] font-bold">Proposal Closed</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-800">$18,200</span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
