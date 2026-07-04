import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Area, AreaChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, BarChart } from 'recharts';
import { ArrowUpRight, TrendingUp, Users, DollarSign, Ticket, Plus, ArrowUp, Briefcase, ChevronRight, Edit2, Trash2, Clock, Calendar, CheckSquare, Bell, X, AlertCircle, Settings2, Download, Eye, EyeOff, ArrowDown, Phone, Activity } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { D3AnalyticsChart } from '../components/D3AnalyticsChart';
import { db, handleFirestoreError, OperationType, getAccessToken } from '../lib/firebase';
import { logActivity } from '../lib/auditLogger';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockCustomers, mockLeadsData } from '../data/mockData';
import { generateDemoCustomers } from '../lib/generateDemoData';
import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

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
  { name: 'Laptop', value: 1152, color: '#2563eb' },  // Power Blue
  { name: 'Mobile', value: 1624, color: '#f59e0b' },  // Orange/Gold
];

const realLeadSources = [
  { name: 'Facebook Ads', value: 1420, color: '#1877F2', rate: '34%' },
  { name: 'Google Search', value: 1150, color: '#34A853', rate: '28%' },
  { name: 'Website Form', value: 780, color: '#F59E0B', rate: '19%' },
  { name: 'Zalo Campaign', value: 510, color: '#0068FF', rate: '12%' },
  { name: 'Referral', value: 285, color: '#8E44AD', rate: '7%' },
];

const pipelineValueData = [
  { month: 'Jan', value: 240, label: '240 Tr' },
  { month: 'Feb', value: 380, label: '380 Tr' },
  { month: 'Mar', value: 310, label: '310 Tr' },
  { month: 'Apr', value: 520, label: '520 Tr' },
  { month: 'May', value: 680, label: '680 Tr' },
  { month: 'Jun', value: 890, label: '890 Tr' },
];

const leadStatusData = [
  { name: 'Mới', value: 450, color: '#3b82f6' },
  { name: 'Đang gọi', value: 380, color: '#10b981' },
  { name: 'Thẩm định', value: 290, color: '#f59e0b' },
  { name: 'Đề xuất', value: 180, color: '#8b5cf6' },
  { name: 'Thương thảo', value: 120, color: '#ec4899' },
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
  theme: 'purple' | 'blue' | 'orange' | 'green';
  icon: any;
  miniHeights: number[];
  glowIndex?: number;
  delay?: number;
}

function PremiumStatCard({ title, value, change, timeframe, theme, icon: Icon, miniHeights, glowIndex, delay = 0 }: StatCardProps) {
  const styles = {
    purple: {
      bg: 'bg-[#4F46BA]',
      text: 'text-white',
      bar: 'bg-white',
      label: 'text-white opacity-50',
      changeBg: 'bg-white/10 border-white/20',
      value: 'text-white'
    },
    blue: {
      bg: 'bg-[#4F46BA]',
      text: 'text-white',
      bar: 'bg-white',
      label: 'text-white opacity-50',
      changeBg: 'bg-white/10 border-white/20',
      value: 'text-white'
    },
    orange: {
      bg: 'bg-[#4F46BA]',
      text: 'text-white',
      bar: 'bg-white',
      label: 'text-white opacity-50',
      changeBg: 'bg-white/10 border-white/20',
      value: 'text-white'
    },
    green: {
      bg: 'bg-[#4F46BA]',
      text: 'text-white',
      bar: 'bg-white',
      label: 'text-white opacity-50',
      changeBg: 'bg-white/10 border-white/20',
      value: 'text-white'
    }
  };

  const currentStyle = styles[theme];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-[24px] card-shadow p-8 transition-all hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between h-48 relative overflow-hidden group border border-slate-100 dark:border-slate-800", currentStyle.bg)}
    >
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 flex items-center justify-center rounded-[18px] bg-white/10 ${currentStyle.text} shadow-sm shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20`}>
          <Icon size={24} />
        </div>
        
        <div className={`text-[11px] font-extrabold leading-none py-2 px-3.5 rounded-full ${currentStyle.changeBg} ${currentStyle.text} border border-white/20 shadow-sm backdrop-blur-sm`}>
          {change}
        </div>
      </div>
      
      <div className="flex justify-between items-end mt-4">
        <div>
          <h3 className={cn("text-[11px] font-black tracking-[0.2em] uppercase opacity-70", currentStyle.label)}>{title}</h3>
          <p className={cn("text-4xl font-black tracking-tight mt-1.5", currentStyle.value)}>{value}</p>
          <span className={cn("text-[11px] font-semibold mt-1.5 block opacity-60", currentStyle.label)}>{timeframe}</span>
        </div>
        
        <div className="pb-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <MiniBarIndicator color={currentStyle.bar} heights={miniHeights} glowIndex={glowIndex} />
        </div>
      </div>
    </motion.div>
  );
}

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [activeCustomerCount, setActiveCustomerCount] = useState<number>(0);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [pendingTicketCount, setPendingTicketCount] = useState<number>(0);
  const [totalLtv, setTotalLtv] = useState<number>(0);
  const [salesVelocityData, setSalesVelocityData] = useState<any[]>([]);
  const [dashboardCustomers, setDashboardCustomers] = useState<any[]>([]);
  const [rawTickets, setRawTickets] = useState<any[]>([]);
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const [dashboardLeads, setDashboardLeads] = useState<any[]>([]);

  const systemActivityData = React.useMemo(() => {
    const result = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      
      // format to compare formats like YYYY-MM-DD
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      
      // Count tickets created on this day
      let countTickets = 0;
      rawTickets.forEach(ticket => {
        if (ticket.createdAt) {
          try {
            const ticketDate = new Date(ticket.createdAt);
            if (ticketDate.toDateString() === d.toDateString()) {
              countTickets++;
            }
          } catch (e) {}
        }
      });
      
      // Count completed tasks on this day (match dueDate or baseline)
      let countCompletedTasks = 0;
      localTasks.forEach(task => {
        if (task.status === 'Completed' || task.status === 'Hoàn thành') {
          if (task.dueDate === dateKey) {
            countCompletedTasks++;
          }
        }
      });

      // Baselines to make the chart look professional, adding real-time user stats on top
      const baseTickets = [8, 14, 11, 19, 13, 17, 10][6 - i];
      const baseTasks = [5, 11, 8, 15, 10, 19, 12][6 - i];
      
      result.push({
        date: dateLabel,
        fullDateLabel: d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' }),
        tickets: baseTickets + countTickets,
        tasks: baseTasks + countCompletedTasks,
      });
    }
    return result;
  }, [rawTickets, localTasks]);
  const [activeSourceTab, setActiveSourceTab] = useState<'source' | 'pipeline' | 'status'>('source');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Quick Actions floating menu states
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'call' | 'task' | 'opportunity' | null>(null);

  // Quick Action form states
  const [callForm, setCallForm] = useState({
    contactPerson: '',
    phone: '',
    duration: '5 phút',
    notes: '',
    outcome: 'Hoàn thành'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const [oppForm, setOppForm] = useState({
    title: '',
    company: '',
    amount: '',
    stage: 'Tiềm năng' as 'Tiềm năng' | 'Thẩm định' | 'Đề xuất' | 'Đàm phán' | 'Đã chốt (Thắng)',
    probability: '50'
  });

  const handleLogCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callForm.contactPerson || !callForm.phone) {
      addToast('Lỗi', 'Vui lòng điền thông tin người liên hệ và số điện thoại.', 'error', 'crm');
      return;
    }

    const newCall = {
      id: `call-${Date.now()}`,
      ...callForm,
      timestamp: new Date().toISOString()
    };

    const savedCalls = localStorage.getItem('crm_logged_calls');
    const existingCalls = savedCalls ? JSON.parse(savedCalls) : [];
    localStorage.setItem('crm_logged_calls', JSON.stringify([newCall, ...existingCalls]));

    logActivity('LOG_GỌI_ĐIỆN', 'CALL_LOGGER', `Đã ghi nhận cuộc gọi với ${callForm.contactPerson} (${callForm.duration}) - Kết quả: ${callForm.outcome}`);
    addToast('Ghi nhận cuộc gọi', `Đã lập nhật ký cuộc gọi đến ${callForm.contactPerson} thành công.`, 'success', 'crm');

    // Reset Form
    setCallForm({
      contactPerson: '',
      phone: '',
      duration: '5 phút',
      notes: '',
      outcome: 'Hoàn thành'
    });
    setActiveModal(null);
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) {
      addToast('Lỗi', 'Vui lòng điền tiêu đề nhiệm vụ.', 'error', 'crm');
      return;
    }

    const newTask = {
      id: `K-${Math.floor(Math.random() * 900) + 100}`,
      title: taskForm.title,
      description: taskForm.description,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      status: 'To Do' as 'To Do' | 'In Progress' | 'Completed',
      assignee: {
        name: user?.displayName || 'Thái Hùng',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'Thai Hung')}&background=random`
      }
    };

    const savedTasks = localStorage.getItem('crm_kanban_tasks');
    const existingTasks = savedTasks ? JSON.parse(savedTasks) : [];
    const updated = [newTask, ...existingTasks];
    localStorage.setItem('crm_kanban_tasks', JSON.stringify(updated));
    setLocalTasks(updated);

    logActivity('THÊM_NHIỆM_VỤ', 'TASKS', `Đã tạo nhiệm vụ mới nhanh từ Dashboard: ${taskForm.title}`);
    addToast('Tạo nhiệm vụ', `Nhiệm vụ "${taskForm.title}" đã được đưa vào bảng Kanban.`, 'success', 'crm');

    // Reset Form
    setTaskForm({
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0]
    });
    setActiveModal(null);
  };

  const handleCreateOpportunitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oppForm.title || !oppForm.company) {
      addToast('Lỗi', 'Vui lòng điền tên cơ hội và tên công ty.', 'error', 'crm');
      return;
    }

    const newOpp = {
      id: Math.random().toString(36).substring(7),
      title: oppForm.title,
      company: oppForm.company,
      amount: Number(oppForm.amount) || 0,
      probability: Number(oppForm.probability) || 50,
      stage: oppForm.stage,
      expectedClose: new Date().toISOString()
    };

    const savedOpps = localStorage.getItem('crm_opportunities');
    const existingOpps = savedOpps ? JSON.parse(savedOpps) : [];
    localStorage.setItem('crm_opportunities', JSON.stringify([newOpp, ...existingOpps]));

    logActivity('TẠO_CƠ_HỘI', 'SALES_PIPELINE', `Đã tạo cơ hội kinh doanh mới nhanh từ Dashboard: ${oppForm.title}`);
    addToast('Tạo cơ hội', `Đã tạo cơ hội kinh doanh cho "${oppForm.company}" thành công.`, 'success', 'crm');

    // Reset Form
    setOppForm({
      title: '',
      company: '',
      amount: '',
      stage: 'Tiềm năng',
      probability: '50'
    });
    setActiveModal(null);
  };
  
  // States for the 24-hour upcoming tasks notification system
  const [calendarTasks, setCalendarTasks] = useState<any[]>([]);
  const [dismissedTasks, setDismissedTasks] = useState<string[]>([]);
  const [showTasksNotification, setShowTasksNotification] = useState<boolean>(true);

  // States for dashboard customization setting dialog
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [kpiConfigs, setKpiConfigs] = useState(() => {
    const saved = localStorage.getItem('crm_kpi_configs');
    const defaultKpis = [
      { id: 'revenue', label: 'Doanh thu (Revenue)', visible: true },
      { id: 'new_orders', label: 'Đơn hàng mới (New Orders)', visible: true },
      { id: 'new_contacts', label: 'Liên hệ mới (New Contacts)', visible: true },
      { id: 'conversion_rate', label: 'Tỉ lệ chuyển đổi (Conversion Rate)', visible: true },
      { id: 'active_customers', label: 'Active Customers (Khách hàng hoạt động)', visible: false },
      { id: 'pending_tickets', label: 'Pending Support Tickets (Yêu cầu chưa xử lý)', visible: false }
    ];

    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingIds = parsed.map((item: any) => item.id);
          const missing = defaultKpis.filter(item => !existingIds.includes(item.id));
          if (missing.length > 0) {
            return [...parsed, ...missing];
          }
          return parsed;
        }
      } catch (e) { }
    }
    return defaultKpis;
  });

  const [panelConfigs, setPanelConfigs] = useState(() => {
    const saved = localStorage.getItem('crm_panel_configs');
    const defaultPanels = [
      { id: 'revenue_analytics', label: 'Báo cáo doanh thu (Revenue Analytics)', visible: true },
      { id: 'sales_velocity', label: 'Sales Velocity (Tỷ lệ chuyển đổi)', visible: true },
      { id: 'deals_statistics', label: 'Deals Statistics (Danh sách giao dịch)', visible: true },
      { id: 'leads_source', label: 'Cơ cấu doanh thu theo nguồn (Revenue by Source)', visible: true },
      { id: 'ai_assistant', label: 'AI Assistant (Trợ lý AI)', visible: true },
      { id: 'top_deals', label: 'Top Deals (Giao dịch hot nhất)', visible: true }
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingIds = parsed.map((item: any) => item.id);
          const missing = defaultPanels.filter(item => !existingIds.includes(item.id));
          if (missing.length > 0) {
            return [...parsed, ...missing];
          }
          return parsed;
        }
      } catch (e) { }
    }
    return defaultPanels;
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
      { id: 'revenue', label: 'Doanh thu (Revenue)', visible: true },
      { id: 'new_orders', label: 'Đơn hàng mới (New Orders)', visible: true },
      { id: 'new_contacts', label: 'Liên hệ mới (New Contacts)', visible: true },
      { id: 'conversion_rate', label: 'Tỉ lệ chuyển đổi (Conversion Rate)', visible: true },
      { id: 'active_customers', label: 'Active Customers (Khách hàng hoạt động)', visible: false },
      { id: 'pending_tickets', label: 'Pending Support Tickets (Yêu cầu chưa xử lý)', visible: false }
    ];
    const defaultPanels = [
      { id: 'revenue_analytics', label: 'Báo cáo doanh thu (Revenue Analytics)', visible: true },
      { id: 'sales_velocity', label: 'Sales Velocity (Tỷ lệ chuyển đổi)', visible: true },
      { id: 'deals_statistics', label: 'Deals Statistics (Danh sách giao dịch)', visible: true },
      { id: 'leads_source', label: 'Cơ cấu doanh thu theo nguồn (Revenue by Source)', visible: true },
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
      const cList: any[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        cList.push({ id: doc.id, ...d });
        ltv += (d.lifetimeValue || 0);
        // Customer is active if status is Hoạt động, Active, or not set
        if (d.status === 'Hoạt động' || d.status === 'Active' || !d.status) {
          active++;
        }
      });
      setTotalLtv(ltv);
      setActiveCustomerCount(active);
      // sort by creation or just take top 10
      setDashboardCustomers(cList);
    });

    // Real-time tickets from Firestore
    const qTickets = isAdmin 
      ? collection(db, 'tickets')
      : query(collection(db, 'tickets'), where('ownerId', '==', user.uid));
      
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      setTicketCount(snap.size);
      let pending = 0;
      const list: any[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d.status === 'new' || d.status === 'processing' || d.status === 'pending') {
          pending++;
        }
        list.push({ id: doc.id, ...d });
      });
      setPendingTicketCount(pending);
      setRawTickets(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tickets');
    });

    // Load local tasks for System Activity tracking
    const loadTasks = () => {
      const savedTasks = localStorage.getItem('crm_kanban_tasks');
      if (savedTasks) {
        try {
          setLocalTasks(JSON.parse(savedTasks));
        } catch (e) {
          console.error("Error reading crm_kanban_tasks", e);
        }
      }
    };
    loadTasks();
    window.addEventListener('storage', loadTasks);

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
      window.removeEventListener('storage', loadTasks);
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
    <div className="w-full h-full p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar relative bg-transparent">
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
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">1. Thẻ chỉ số chính (KPI Cards)</h4>
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
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">2. Biểu đồ bảng biểu chính</h4>
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
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/15 transition-all cursor-pointer"
            >
              Xác nhận & Đóng
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Elegant Page Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200/60 dark:border-slate-800 pb-10 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Hệ thống Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px] mt-2 font-medium max-w-2xl leading-relaxed">
            Giám sát thời gian thực các chỉ số kinh doanh, quản lý khách hàng tiềm năng và tối ưu hóa hiệu suất đội ngũ Sale & CSKH.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 self-stretch md:self-auto justify-end">
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer outline-none"
          >
            <Settings2 size={16} className="text-slate-400" /> Tùy chỉnh báo cáo
          </button>
          <button 
            onClick={handleExportDashboardCsv}
            className="flex items-center gap-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-blue-600 px-5 py-3 rounded-2xl shadow-lg shadow-slate-900/10 dark:shadow-blue-500/10 hover:opacity-90 transition-all cursor-pointer outline-none"
          >
            <Download size={16} /> Xuất dữ liệu
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
                    <Calendar size={16} className="text-blue-600 shrink-0" />
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
                      className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-600/10 rounded-lg hover:bg-blue-600/15 transition-all text-center flex items-center gap-1"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {(() => {
          let visibleCount = 0;
          return kpiConfigs.map((cfg) => {
            if (!cfg.visible) return null;
            const currentDelay = visibleCount * 0.12;
            visibleCount++;

            if (cfg.id === 'revenue') {
              return (
                <PremiumStatCard 
                  key="revenue"
                  title="Doanh thu" 
                  value="196.120.000 đ" 
                  change="↑ 63%" 
                  timeframe="So với tháng trước" 
                  theme="blue" 
                  icon={DollarSign}
                  miniHeights={[35, 60, 45, 100]}
                  glowIndex={3}
                  delay={currentDelay}
                />
              );
            }
            if (cfg.id === 'new_orders') {
              return (
                <PremiumStatCard 
                  key="new_orders"
                  title="Đơn hàng mới" 
                  value="19" 
                  change="↑ 58%" 
                  timeframe="So với tuần trước" 
                  theme="green" 
                  icon={Briefcase}
                  miniHeights={[40, 60, 50, 80]}
                  delay={currentDelay}
                />
              );
            }
            if (cfg.id === 'new_contacts') {
              return (
                <PremiumStatCard 
                  key="new_contacts"
                  title="Liên hệ mới" 
                  value="15" 
                  change="↑ 25%" 
                  timeframe="Hôm nay" 
                  theme="orange" 
                  icon={Users}
                  miniHeights={[30, 45, 95, 55]}
                  delay={currentDelay}
                />
              );
            }
            if (cfg.id === 'conversion_rate') {
              return (
                <PremiumStatCard 
                  key="conversion_rate"
                  title="Tỉ lệ chuyển đổi" 
                  value="18,67%" 
                  change="↑ 8%" 
                  timeframe="Trung bình hệ thống" 
                  theme="purple" 
                  icon={TrendingUp}
                  miniHeights={[20, 45, 60, 90]}
                  delay={currentDelay}
                />
              );
            }
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
                  delay={currentDelay}
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
                  delay={currentDelay}
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
                  delay={currentDelay}
                />
              );
            }
            if (cfg.id === 'total_customers') {
              return (
                <PremiumStatCard 
                  key="total_customers"
                  title="Total CRM Customers" 
                  value={customerCount > 0 ? customerCount.toLocaleString() : "4,562"} 
                  change="+8.3% This month" 
                  timeframe="Tổng lượng khách hàng toàn thời gian" 
                  theme="blue" 
                  icon={Briefcase}
                  miniHeights={[20, 45, 60, 90]}
                  delay={currentDelay}
                />
              );
            }
            if (cfg.id === 'total_ltv') {
              return (
                <PremiumStatCard 
                  key="total_ltv"
                  title="Total Lifetime Value" 
                  value={totalLtv > 0 ? `$${totalLtv.toLocaleString('en-US', {maximumFractionDigits:0})}` : "$842,500"} 
                  change="+15.4% YoY" 
                  timeframe="Tổng doanh số vòng đời được kích hoạt" 
                  theme="green" 
                  icon={DollarSign}
                  miniHeights={[45, 80, 50, 95]}
                  delay={currentDelay}
                />
              );
            }
            if (cfg.id === 'average_sla') {
              return (
                <PremiumStatCard 
                  key="average_sla"
                  title="Average Resolution SLA" 
                  value="1.8 Hours" 
                  change="-12% Chờ" 
                  timeframe="Thời gian phản hồi SLA trung bình" 
                  theme="orange" 
                  icon={Clock}
                  miniHeights={[70, 45, 30, 20]}
                  delay={currentDelay}
                />
              );
            }
            return null;
          });
        })()}
      </div>

      {/* Main split grid: Revenue & Deals vs Leads and AI Assistant (Dynamic sorting applied per column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column (Spans 2 columns on large screen, handles left-eligible cards in customized order) */}
        <div className="lg:col-span-2 space-y-8 flex flex-col">
          {panelConfigs.map((cfg) => {
            if (!cfg.visible) return null;
            
            // 1. Revenue Analytics Card
            if (cfg.id === 'revenue_analytics') {
              return (
                <div key="revenue_analytics" className="bg-white dark:bg-slate-900 rounded-2xl card-shadow p-6 flex flex-col animate-fadeIn group">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Revenue Analytics</h3>
                      <p className="text-slate-500 text-xs font-medium mt-1">Monthly overview & sales statistics</p>
                    </div>
                    <div>
                      <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 rounded-lg py-1.5 px-3 focus:outline-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                          dy={8}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                          dx={-6}
                          domain={[0, 1000]}
                          tickCount={6}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(235, 238, 245, 0.4)', radius: 10 }}
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            background: 'rgba(255,255,255,0.9)', 
                            backdropFilter: 'blur(8px)', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                            padding: '10px 14px' 
                          }}
                          labelStyle={{ fontWeight: 700, color: '#0f172a', fontSize: '12px' }}
                          itemStyle={{ fontWeight: 600, fontSize: '11px' }}
                        />
                        {/* Subtle lower bars for background feel */}
                        <Bar 
                          dataKey="barValue" 
                          fill="#3b82f6" 
                          fillOpacity={0.1} 
                          radius={[4, 4, 4, 4]} 
                          barSize={20} 
                          name="Goal Target" 
                        />
                        {/* Fluid Line layered directly on top of the bars */}
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={{ fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2, r: 4 }} 
                          activeDot={{ r: 6 }}
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
                <div key="sales_velocity" className="bg-white dark:bg-slate-900 rounded-2xl card-shadow p-6 animate-fadeIn group" id="sales-velocity-card">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <TrendingUp className="text-blue-500 h-5 w-5" />
                        Sales Velocity
                      </h3>
                      <p className="text-slate-500 text-xs font-medium mt-1">Conversion rate of leads over the last 30 days</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                        Avg: {salesVelocityData.length > 0 ? (salesVelocityData.reduce((acc, curr) => acc + (curr.conversionRate || 0), 0) / salesVelocityData.length).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesVelocityData} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                        <defs>
                          <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                          dx={-10}
                          domain={[0, 100]}
                          tickFormatter={(tick) => `${tick}%`}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 6 }}
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            background: 'rgba(255,255,255,0.9)', 
                            backdropFilter: 'blur(8px)', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                            padding: '10px 14px' 
                          }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">{data.date}</p>
                                  <p className="text-[10px] font-medium text-slate-500">Leads: <span className="font-bold text-slate-800">{data.leadsCount}</span></p>
                                  <p className="text-[10px] font-medium text-slate-500">Converted: <span className="font-bold text-emerald-600">{data.convertedCount}</span></p>
                                  <p className="text-xs font-bold text-blue-600 mt-1 pt-1 border-t border-slate-100">Rate: {data.conversionRate}%</p>
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

            // System Activity Card
            if (cfg.id === 'system_activity') {
              const totalWeekTickets = systemActivityData.reduce((acc, curr) => acc + curr.tickets, 0);
              const totalWeekTasks = systemActivityData.reduce((acc, curr) => acc + curr.tasks, 0);
              const averageCompletionRate = totalWeekTickets > 0 ? ((totalWeekTasks / (totalWeekTickets + totalWeekTasks)) * 100).toFixed(1) : '0';

              return (
                <div key="system_activity" className="bg-white dark:bg-slate-900 rounded-2xl card-shadow p-6 animate-fadeIn group" id="system-activity-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Activity className="text-amber-500 h-5 w-5" />
                        System Activity
                      </h3>
                      <p className="text-slate-500 text-xs font-medium mt-1">Support tickets & completed tasks over the last 7 days</p>
                    </div>

                    <div className="flex items-center gap-6 text-[11px] font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <div className="flex flex-col">
                          <span className="text-slate-500 leading-none">TỔNG YÊU CẦU</span>
                          <span className="text-slate-900 dark:text-slate-300 font-bold mt-0.5">{totalWeekTickets} tickets</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="flex flex-col">
                          <span className="text-slate-500 leading-none">ĐÃ HOÀN THÀNH</span>
                          <span className="text-slate-900 dark:text-slate-300 font-bold mt-0.5">{totalWeekTasks} tasks</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <div className="flex flex-col">
                          <span className="text-slate-500 leading-none">TỶ LỆ GIẢI QUYẾT</span>
                          <span className="text-emerald-600 font-bold mt-0.5">{averageCompletionRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={systemActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTicketsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorTasksGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                          dx={-10}
                        />
                        <Tooltip 
                          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            background: 'rgba(255,255,255,0.9)', 
                            backdropFilter: 'blur(8px)', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                            padding: '12px 16px' 
                          }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="space-y-1.5 text-xs text-slate-800">
                                  <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">{data.fullDateLabel}</p>
                                  <div className="flex items-center gap-2 text-[11px] font-medium">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-slate-500">Yêu cầu nhận được:</span>
                                    <span className="font-bold ml-auto text-slate-900">{data.tickets}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] font-medium">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-slate-500">Nhiệm vụ hoàn thành:</span>
                                    <span className="font-bold ml-auto text-slate-900">{data.tasks}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tickets" 
                          stroke="#3B82F6" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorTicketsGrad)" 
                          name="Tickets Volume"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tasks" 
                          stroke="#FBBF24" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorTasksGrad)" 
                          name="Task Completion"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            // 3. Deals Statistics Card
            if (cfg.id === 'deals_statistics') {
              return (
                <div key="deals_statistics" className="bg-white dark:bg-slate-900 rounded-2xl card-shadow p-6 animate-fadeIn group">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Deals Statistics</h3>
                      <p className="text-slate-500 text-xs font-medium mt-1">Tracking conversion stages of top prospects</p>
                    </div>
                    <div>
                      <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 rounded-lg py-1.5 px-3 focus:outline-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                        <option>Sort by</option>
                        <option>Category</option>
                        <option>Date</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            <img 
                              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" 
                              alt="Simon Corel" 
                              className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700" 
                            />
                            <div>
                              <p className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-snug">Simon Corel</p>
                              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">simoncorel@gmail.com</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300">Service</td>
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300">Germany</td>
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-400">Aug 20, 2026</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-lg transition-colors">
                                <Edit2 size={13} strokeWidth={2.5} />
                              </button>
                              <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                <Trash2 size={13} strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {dashboardCustomers.slice(0, 5).map((cust, i) => (
                          <tr key={cust.id + i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4 flex items-center gap-3">
                              <img 
                                src={cust.avatar || `https://i.pravatar.cc/150?u=${cust.id}`} 
                                alt={cust.name} 
                                className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700" 
                              />
                              <div>
                                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-snug">{cust.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{cust.email}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                              {cust.tier || 'Member'}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300">Vietnam</td>
                            <td className="py-3.5 px-4 text-xs font-bold text-slate-400">
                              {new Date(cust.lastInteraction || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-lg transition-colors">
                                  <Edit2 size={13} strokeWidth={2.5} />
                                </button>
                                <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                  <Trash2 size={13} strokeWidth={2.5} />
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
                <div key="leads_source" className="bg-white dark:bg-slate-900 rounded-2xl card-shadow p-6 animate-fadeIn group">
                  <div className="flex flex-col gap-3 mb-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Leads & Pipeline Analytics</h3>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold tracking-widest">•••</button>
                    </div>

                    {/* Styled Pill Selector for Tabs */}
                    <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl w-full border border-slate-200/50 dark:border-slate-700">
                      <button
                        onClick={() => setActiveSourceTab('source')}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSourceTab === 'source'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        Leads by Source
                      </button>
                      <button
                        onClick={() => setActiveSourceTab('pipeline')}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSourceTab === 'pipeline'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        Pipeline Value
                      </button>
                      <button
                        onClick={() => setActiveSourceTab('status')}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSourceTab === 'status'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        Lead Status
                      </button>
                    </div>
                  </div>

                  {activeSourceTab === 'source' ? (
                    <div className="animate-fadeIn">
                      <div className="relative h-44 flex items-center justify-center">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie
                              data={realLeadSources}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                            >
                              {realLeadSources.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                background: 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(8px)',
                                fontSize: '11px',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute text-center pointer-events-none">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase leading-none">Total</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 leading-none">4,145</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        {realLeadSources.map((src) => (
                          <div key={src.name} className="flex items-center justify-between pl-3 border-l-2 text-[10px] font-bold" style={{ borderColor: src.color }}>
                            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[85px]">{src.name}</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{src.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : activeSourceTab === 'pipeline' ? (
                    <div className="animate-fadeIn">
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={pipelineValueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="pipelineColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                              tickFormatter={(val) => `${val}M`}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                background: 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(8px)',
                                fontSize: '11px',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#4F46E5"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#pipelineColor)"
                              name="Pipeline Value (VND)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#f8f9fb] flex justify-between items-center text-xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Pipeline (Jun)</p>
                          <p className="text-xs font-black text-[#4F46E5] mt-0.5">890M VND</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Growth</p>
                          <p className="text-xs font-black text-emerald-600 mt-0.5">+30.8%</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fadeIn">
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={leadStatusData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f3f7" strokeOpacity={0.8} />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#8c94a5', fontSize: 9, fontWeight: 700 }} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} width={80} />
                            <Tooltip
                              contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #f1f3f7',
                                background: 'rgba(255,255,255,0.96)',
                                backdropFilter: 'blur(8px)',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                              {leadStatusData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color} 
                                  onClick={() => {
                                    setSelectedStatusFilter(prev => prev === entry.name ? null : entry.name);
                                  }}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Cách lọc</p>
                          <p className="text-xs font-semibold text-slate-500">Ấn cột biểu đồ để xem chi tiết</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Tổng số Lead</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">1,420</p>
                        </div>
                      </div>

                      {/* Interactive Drill-down List View */}
                      {selectedStatusFilter && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl animate-fadeIn text-left">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700 mb-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                              Leads: <strong className="text-blue-600 dark:text-blue-400">{selectedStatusFilter}</strong> ({mockLeadsData.filter(l => l.status === selectedStatusFilter).length})
                            </span>
                            <button
                              onClick={() => setSelectedStatusFilter(null)}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase"
                            >
                              ✕ Bỏ lọc
                            </button>
                          </div>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                            {mockLeadsData.filter(l => l.status === selectedStatusFilter).length === 0 ? (
                              <p className="text-[10px] font-bold text-slate-400 text-center py-2">Không tìm thấy leads nào</p>
                            ) : (
                              mockLeadsData.filter(l => l.status === selectedStatusFilter).map(lead => (
                                <div key={lead.id} className="flex justify-between items-center text-xs p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 shadow-sm">
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{lead.name}</p>
                                    <p className="text-[9px] font-medium text-slate-400 uppercase">{lead.company} • SĐT: {lead.phone}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-blue-600 dark:text-blue-400">{lead.value.toLocaleString('vi-VN')} đ</p>
                                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                      lead.priority === 'High' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}>{lead.priority}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // 2. AI Assistant Card
            if (cfg.id === 'ai_assistant') {
              return (
                <div key="ai_assistant" className="bg-white dark:bg-slate-900 rounded-2xl card-shadow p-6 flex flex-col justify-between min-h-[300px] animate-fadeIn group">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">AI Assistant</h3>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold tracking-widest">•••</button>
                  </div>

                  <div className="relative py-8 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 rounded-full filter blur-[14px] opacity-30 animate-pulse" />
                      <div className="absolute inset-2 border-2 border-dashed border-blue-500/30 rounded-full animate-spin [animation-duration:15s]" />
                      <div className="w-24 h-24 rounded-[40%] bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-[0_8px_24px_rgba(59,130,246,0.3)] animate-spin [animation-duration:8s] flex items-center justify-center" />
                      <div className="absolute w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm shadow-inner pointer-events-none" />
                    </div>
                    
                    <p className="text-[15px] font-bold text-slate-700 dark:text-slate-300 tracking-tight text-center mt-5">
                      What Can I Help With?
                    </p>
                  </div>

                  <div className="mt-2 flex items-center bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-full px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 bg-white dark:bg-slate-800 rounded-full h-6 w-6 flex items-center justify-center shadow-sm shrink-0">
                      <Plus size={14} strokeWidth={3} />
                    </button>
                    <input
                      type="text"
                      placeholder="Ask me anything"
                      className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 focus:outline-none w-full px-3.5"
                    />
                    <button className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center shrink-0 w-8 h-8">
                      <ArrowUp size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            }

            // 3. Top Deals Card
            if (cfg.id === 'top_deals') {
              return (
                <div key="top_deals" className="bg-white dark:bg-slate-900 rounded-2xl card-shadow p-6 animate-fadeIn group">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Top Deals</h3>
                    <ChevronRight size={16} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group-hover:border-slate-200 dark:group-hover:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                          TC
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">Techcom Corp Contract</h5>
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Proposal Closed</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">$18,200</span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* D3.js Full Width Analytics Section */}
      <D3AnalyticsChart />

      {/* Quick Actions Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-[50] flex flex-col items-end gap-3.5">
        {/* Floating Expandable Action Items */}
        {isFabOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-1.5 animate-fadeIn">
            {/* Log Call Bubble */}
            <div className="flex items-center gap-2.5">
              <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md pointer-events-none">
                Ghi cuộc gọi (Log Call)
              </span>
              <button
                type="button"
                onClick={() => { setActiveModal('call'); setIsFabOpen(false); }}
                className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              >
                <Phone size={18} />
              </button>
            </div>

            {/* Add Task Bubble */}
            <div className="flex items-center gap-2.5">
              <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md pointer-events-none">
                Thêm nhiệm vụ (Add Task)
              </span>
              <button
                type="button"
                onClick={() => { setActiveModal('task'); setIsFabOpen(false); }}
                className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              >
                <CheckSquare size={18} />
              </button>
            </div>

            {/* New Opportunity Bubble */}
            <div className="flex items-center gap-2.5">
              <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md pointer-events-none">
                Cơ hội mới (New Opportunity)
              </span>
              <button
                type="button"
                onClick={() => { setActiveModal('opportunity'); setIsFabOpen(false); }}
                className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              >
                <DollarSign size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Primary FAB Button */}
        <button
          type="button"
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${
            isFabOpen 
              ? 'bg-rose-500 hover:bg-rose-600 rotate-45 animate-pulse' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20 shadow-md'
          }`}
          title="Thực hiện nhanh"
        >
          <Plus size={28} className="transition-transform duration-250 stroke-[3]" />
        </button>
      </div>

      {/* Quick Action Modal Overlays */}
      {activeModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-850 shadow-2xl max-w-lg w-full overflow-hidden p-6 relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 dark:hover:text-white transition-colors"
            >
              <X size={20} className="stroke-[3]" />
            </button>

            {/* 1. Log Call Form */}
            {activeModal === 'call' && (
              <form onSubmit={handleLogCallSubmit} className="space-y-4 text-left">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-500 dark:text-emerald-450">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Ghi nhận cuộc gọi mới nhanh</h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500">Lưu thông tin trao đổi ngay sau cuộc điện thoại với khách hàng.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Người liên hệ</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Anh Nguyễn Văn An..."
                      value={callForm.contactPerson}
                      onChange={(e) => setCallForm({ ...callForm, contactPerson: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 09012345xx"
                      value={callForm.phone}
                      onChange={(e) => setCallForm({ ...callForm, phone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Thời lượng cuộc gọi</label>
                    <select
                      value={callForm.duration}
                      onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer font-semibold"
                    >
                      <option value="1 phút">1 phút</option>
                      <option value="3 phút">3 phút</option>
                      <option value="5 phút">5 phút (Mặc định)</option>
                      <option value="10 phút">10 phút</option>
                      <option value=">20 phút">&gt;20 phút</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Kết quả cuộc gọi</label>
                    <select
                      value={callForm.outcome}
                      onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer font-semibold"
                    >
                      <option value="Hoàn thành">Hoàn thành cuộc gọi</option>
                      <option value="Hẹn gọi lại">Hẹn phản hồi cuộc sau</option>
                      <option value="Không liên lạc được">Thuê bao bận / Không nghe máy</option>
                      <option value="Sai số điện thoại">Không đúng người / Số sai</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Chi tiết nội dung trao đổi</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập ghi chú quan trọng thảo luận được với khách hàng..."
                    value={callForm.notes}
                    onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 transition-all text-xs font-bold"
                  >
                    Huỷ bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/10"
                  >
                    Ghi kết quả cuộc gọi
                  </button>
                </div>
              </form>
            )}

            {/* 2. Add Task Form */}
            {activeModal === 'task' && (
              <form onSubmit={handleAddTaskSubmit} className="space-y-4 text-left">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-500 dark:text-blue-450">
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Thêm nhiệm vụ Kanban mới nhanh</h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500">Đặt lịch biểu và theo dõi tiến độ công việc một cách trực quan.</p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nhiệm vụ cần thực hiện</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thiết lập SLA mẫu cho hợp đồng..."
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Chi tiết mô tả nhiệm vụ</label>
                  <textarea
                    rows={2}
                    placeholder="Nhập nội dung yêu cầu cụ thể cần giải quyết..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Mức độ ưu tiên</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-semibold"
                    >
                      <option value="High">🔴 Ưu tiên Cao (High)</option>
                      <option value="Medium">🟡 Ưu tiên Trung bình (Medium)</option>
                      <option value="Low">🟢 Ưu tiên Thấp (Low)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Hạn hoàn thành (Deadline)</label>
                    <input
                      type="date"
                      required
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 transition-all text-xs font-bold"
                  >
                    Huỷ bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-500/10"
                  >
                    Đăng ký nhiệm vụ mới
                  </button>
                </div>
              </form>
            )}

            {/* 3. New Opportunity Form */}
            {activeModal === 'opportunity' && (
              <form onSubmit={handleCreateOpportunitySubmit} className="space-y-4 text-left">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-500 dark:text-amber-450">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Thêm cơ hội kinh doanh mới</h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500">Đưa dự án hoặc giao dịch mới vào phễu lọc bán hàng (Sales Pipeline).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tên Cơ hội / Hợp đồng</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Cung cấp máy chiếu Q4..."
                      value={oppForm.title}
                      onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Công ty / Doanh nghiệp</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Vingroup Corp..."
                      value={oppForm.company}
                      onChange={(e) => setOppForm({ ...oppForm, company: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Giá trị cơ hội (đ)</label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 250000000"
                      value={oppForm.amount}
                      onChange={(e) => setOppForm({ ...oppForm, amount: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Xác suất thành công (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={oppForm.probability}
                      onChange={(e) => setOppForm({ ...oppForm, probability: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Giai đoạn bán hàng</label>
                  <select
                    value={oppForm.stage}
                    onChange={(e) => setOppForm({ ...oppForm, stage: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-semibold"
                  >
                    <option value="Tiềm năng">1. Tiềm năng (Lead / Qualification)</option>
                    <option value="Thẩm định">2. Thẩm định nhu cầu (Discovery)</option>
                    <option value="Đề xuất">3. Đề xuất giải pháp (Proposal)</option>
                    <option value="Đàm phán">4. Đàm phán thương thảo (Negotiation)</option>
                    <option value="Đã chốt (Thắng)">5. Đã chốt thành công 🎉 (Closed Won)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 transition-all text-xs font-bold"
                  >
                    Huỷ bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/10"
                  >
                    Đăng ký cơ hội giao dịch
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
