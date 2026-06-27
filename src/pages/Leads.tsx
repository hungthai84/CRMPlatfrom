import { useState, useEffect, useRef } from 'react';
import { 
  Magnet, 
  Search, 
  Plus, 
  Filter, 
  ArrowRight, 
  Check, 
  Phone, 
  Mail, 
  MessageSquare, 
  Trash2, 
  LayoutGrid, 
  List, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  UserPlus, 
  CheckCircle2, 
  X,
  Share2,
  MoreVertical,
  ChevronRight,
  AlertCircle,
  Mic,
  Volume2,
  Activity
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: 'Facebook Ads' | 'Google Search' | 'Website Form' | 'Zalo Campaign' | 'Referral';
  status: 'Mới nhận' | 'Đang liên hệ' | 'Hẹn gặp' | 'Thẩm định' | 'Không đạt';
  value: number;
  notes: string;
  ownerName: string;
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low';
}

const INITIAL_LEADS: Lead[] = [
  {
    id: 'L-1001',
    name: 'Nguyễn Anh Tuấn',
    company: 'Tuấn Phát Corp',
    email: 'tuananhatuan@gmail.com',
    phone: '0912345678',
    source: 'Facebook Ads',
    status: 'Mới nhận',
    value: 45000000,
    notes: 'Quan tâm đến gói Giải pháp Chuyển đổi số CRM Toàn diện. Muốn tư vấn chi lý thuyết và demo thực tế.',
    ownerName: 'Mạnh Hùng',
    createdAt: '2026-06-09 14:30',
    priority: 'High'
  },
  {
    id: 'L-1002',
    name: 'Phạm Thị Mai',
    company: 'Mai Linh Logistics',
    email: 'mai.pham@mailinh.vn',
    phone: '0987654321',
    source: 'Website Form',
    status: 'Đang liên hệ',
    value: 120000000,
    notes: 'Liên hệ qua form báo giá website. Cần đề xuất giải pháp đồng bộ định vị xe tải vận chuyển & tích điểm thành viên.',
    ownerName: 'Lê Hồng',
    createdAt: '2026-06-08 10:15',
    priority: 'High'
  },
  {
    id: 'L-1003',
    name: 'Trần Quốc Huy',
    company: 'Huy Hoàng Tech',
    email: 'huy.tran@huyhoang.com.vn',
    phone: '0905112233',
    source: 'Google Search',
    status: 'Hẹn gặp',
    value: 75000000,
    notes: 'Đã hẹn gặp tại văn phòng đại diện Landmark 81 lúc 14h00 chiều thứ Sáu tới để trình bày chi tiết hợp đồng.',
    ownerName: 'Trần Hoàng',
    createdAt: '2026-06-07 09:00',
    priority: 'Medium'
  },
  {
    id: 'L-1004',
    name: 'Lê Thủy Tiên',
    company: 'Cá nhân (Học viện Tiên Tiên)',
    email: 'thuytien.academy@gmail.com',
    phone: '0944556677',
    source: 'Zalo Campaign',
    status: 'Thẩm định',
    value: 30000000,
    notes: 'Tìm kiếm gói quản lý học viên cơ bản. Đang cân nhắc ngân sách do kinh phí tự túc tuyển sinh.',
    ownerName: 'Lê Hồng',
    createdAt: '2026-06-05 16:45',
    priority: 'Low'
  },
  {
    id: 'L-1005',
    name: 'Hoàng Minh Đức',
    company: 'Đại Việt Furniture',
    email: 'duc.hm@daiviet.vn',
    phone: '0933221100',
    source: 'Referral',
    status: 'Không đạt',
    value: 15000000,
    notes: 'Do cơ sở hạ tầng mạng của họ chưa đáp ứng điều kiện lưu trữ cloud công cộng nên từ chối tạm thời.',
    ownerName: 'Mạnh Hùng',
    createdAt: '2026-06-04 11:20',
    priority: 'Low'
  },
  {
    id: 'L-1006',
    name: 'Vũ Minh Khang',
    company: 'Khang Gia Building',
    email: 'khang.vu@khanggia.com',
    phone: '0922889988',
    source: 'Facebook Ads',
    status: 'Mới nhận',
    value: 95000000,
    notes: 'Click nhận ưu đãi tặng gói AI automation trên phễu Ads facebook, đang chờ Sales gọi điện kiểm chứng.',
    ownerName: 'Trần Hoàng',
    createdAt: '2026-06-10 08:15',
    priority: 'Medium'
  }
];

const LEAD_STATUS_STAGES_LIST: Lead['status'][] = [
  'Mới nhận',
  'Đang liên hệ',
  'Hẹn gặp',
  'Thẩm định',
  'Không đạt'
];

export function Leads() {
  const { addToast } = useToast();
  const { user } = useAuth();

  const addNotificationToDb = async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title,
        message,
        type,
        category: 'crm',
        read: false,
        createdAt: Date.now()
      });
    } catch (e) {
      console.warn("Failed to write Lead state notification to Firebase:", e);
    }
  };

  // Drag and drop mechanics for Leads
  const handleDragStartLead = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverColumn = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropLeadOnColumn = (e: React.DragEvent, targetStage: Lead['status']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      updateLeadStatus(leadId, targetStage);
    }
  };
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('local_crm_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [viewType, setViewType] = useState<'kanban' | 'table'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // Custom lead activities timeline state stored in localStorage for persistence
  const [leadActivities, setLeadActivities] = useState<Record<string, Array<{ id: string, content: string, createdAt: string, isVoice?: boolean }>>>(() => {
    const saved = localStorage.getItem('local_lead_activity_timeline');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      'lead-1': [
        { id: 'act-1-1', content: 'Hệ thống tự động nạp lead từ Website Landing Page', createdAt: '13:20 - 10/06' },
        { id: 'act-1-2', content: 'Đã phân bổ cho Sales phụ trách chăm sóc khách', createdAt: '14:00 - 10/06' }
      ],
      'lead-2': [
        { id: 'act-2-1', content: 'Khách hàng đăng ký form tư vấn qua Facebook Leads Ad', createdAt: '09:12 - 11/06' }
      ]
    };
  });

  const [isRecordingMemo, setIsRecordingMemo] = useState(false);
  const [activeMemoInput, setActiveMemoInput] = useState('');
  const recognitionRefList = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem('local_lead_activity_timeline', JSON.stringify(leadActivities));
    } catch (e) {}
  }, [leadActivities]);

  // Setup speech recognition for Lead Timeline
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'vi-VN';

      rec.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        if (transcript) {
          setActiveMemoInput(prev => prev + (prev ? ' ' : '') + transcript);
        }
      };

      rec.onend = () => {
        setIsRecordingMemo(false);
      };

      rec.onerror = (err: any) => {
        console.error('Lead Timeline Speech Error:', err);
        setIsRecordingMemo(false);
      };

      recognitionRefList.current = rec;
    }
  }, []);

  const handleToggleVoiceMemo = () => {
    if (!recognitionRefList.current) {
      addToast(
        'Không hỗ trợ',
        'Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói.',
        'error',
        'crm'
      );
      return;
    }

    if (isRecordingMemo) {
      recognitionRefList.current.stop();
      setIsRecordingMemo(false);
    } else {
      try {
        setIsRecordingMemo(true);
        recognitionRefList.current.start();
      } catch (err) {
        console.error('Failed to start lead speech:', err);
        setIsRecordingMemo(false);
      }
    }
  };

  const handleAddActivity = (leadId: string) => {
    if (!activeMemoInput.trim()) return;
    const now = new Date();
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

    setLeadActivities(prev => {
      const currentList = prev[leadId] || [];
      const updatedList = [
        {
          id: `memo-${Date.now()}`,
          content: activeMemoInput.trim(),
          createdAt: formattedTime,
          isVoice: true
        },
        ...currentList
      ];
      return {
        ...prev,
        [leadId]: updatedList
      };
    });
    setActiveMemoInput('');
    setIsRecordingMemo(false);
    if (recognitionRefList.current) {
      try {
        recognitionRefList.current.stop();
      } catch(e) {}
    }
    
    addToast(
      'Ghi Timeline thành công',
      'Lời thoại/ghi chú của bạn đã được ghi nhận vào Timeline khách tiềm năng.',
      'success',
      'crm'
    );
  };
  
  // Quick Add State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadValue, setNewLeadValue] = useState('0');
  const [newLeadSource, setNewLeadSource] = useState<Lead['source']>('Website Form');
  const [newLeadPriority, setNewLeadPriority] = useState<Lead['priority']>('Medium');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  // Save Leads to LocalStorage
  useEffect(() => {
    localStorage.setItem('local_crm_leads', JSON.stringify(leads));
  }, [leads]);

  // Statistics calculation
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter(l => l.status === 'Mới nhận').length;
  const highPriorityCount = leads.filter(l => l.priority === 'High' && l.status !== 'Không đạt').length;
  const qualifiedLeads = leads.filter(l => ['Hẹn gặp', 'Thẩm định'].includes(l.status)).length;
  const totalLeadsValue = leads.reduce((sum, l) => l.status !== 'Không đạt' ? sum + l.value : sum, 0);

  // Filter Logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.id.toLowerCase().includes(search.toLowerCase());

    const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
    const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter;

    return matchesSearch && matchesSource && matchesPriority;
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      addToast('Lỗi nhập dữ liệu', 'Tên khách hàng và Số điện thoại là trường bắt buộc!', 'error', 'crm');
      return;
    }

    const nextId = `L-${1000 + leads.length + 1}`;
    const newLeadItem: Lead = {
      id: nextId,
      name: newLeadName.trim(),
      company: newLeadCompany.trim() || 'Cá nhân / Tự do',
      email: newLeadEmail.trim() || 'chua_co_email@domain.com',
      phone: newLeadPhone.trim(),
      source: newLeadSource,
      status: 'Mới nhận',
      value: parseFloat(newLeadValue) || 0,
      notes: newLeadNotes.trim() || 'Chưa ghi chú cụ thể.',
      ownerName: 'Hùng Thái (Quản trị)',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      priority: newLeadPriority
    };

    setLeads([newLeadItem, ...leads]);
    setIsAddModalOpen(false);
    
    // Reset Form Fields
    setNewLeadName('');
    setNewLeadCompany('');
    setNewLeadPhone('');
    setNewLeadEmail('');
    setNewLeadValue('0');
    setNewLeadSource('Website Form');
    setNewLeadPriority('Medium');
    setNewLeadNotes('');

    addToast(
      'Khách tiềm năng mới',
      `Khách hàng "Khách hàng ${newLeadItem.name}" đã được nạp thành công từ phễu ${newLeadItem.source}!`,
      'success',
      'crm'
    );
  };

  const updateLeadStatus = (leadId: string, newStatus: Lead['status']) => {
    let triggeredToast = false;
    let criticalNotification: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' } | null = null;
    let leadName = '';

    setLeads(prev => {
      const leadItem = prev.find(l => l.id === leadId);
      if (leadItem && leadItem.status !== newStatus) {
        leadName = leadItem.name;
        const isCritical = ['Hẹn gặp', 'Thẩm định', 'Không đạt'].includes(newStatus);
        if (isCritical) {
          const notifType = newStatus === 'Không đạt' ? 'warning' : 'success';
          criticalNotification = {
            title: `🎯 Cột mốc Lead quan trọng: ${newStatus}`,
            message: `Khách hàng "${leadItem.name}" (${leadItem.company}) vừa được chuyển trạng thái sang "${newStatus}".`,
            type: notifType
          };
        }
        if (newStatus === 'Hẹn gặp') {
          triggeredToast = true;
        }
      }
      return prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    });

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }

    if (criticalNotification) {
      addNotificationToDb(criticalNotification.title, criticalNotification.message, criticalNotification.type);
    }
    if (triggeredToast) {
      addToast('Cột mốc Đạt hẹn gặp', `Đã lên lịch đón tiếp Khách tiềm năng "${leadName}"`, 'success', 'crm');
    }
  };

  const handleDeleteLead = (leadId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng tiềm năng này khỏi hệ thống?')) {
      const deleted = leads.find(l => l.id === leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLead(null);
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
      addToast(
        'Thành công',
        `Đã gỡ bỏ dữ liệu khách tiềm năng "${deleted?.name}" khỏi CRM.`,
        'warning',
        'crm'
      );
    }
  };

  const handleBulkDeleteLeads = () => {
    if (selectedLeadIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedLeadIds.length} khách tiềm năng đã chọn khỏi hệ thống?`)) {
      setLeads(prev => prev.filter(l => !selectedLeadIds.includes(l.id)));
      setSelectedLeadIds([]);
      setSelectedLead(null);
      addToast(
        'Xóa thành công',
        `Đã gỡ bỏ ${selectedLeadIds.length} khách tiềm năng ra khỏi CRM thành công.`,
        'warning',
        'crm'
      );
    }
  };

  const handleBulkUpdateLeadsStatus = (newStatus: Lead['status']) => {
    if (selectedLeadIds.length === 0) return;
    
    const notificationsToTrigger: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[] = [];

    setLeads(prev => {
      prev.forEach(l => {
        if (selectedLeadIds.includes(l.id) && l.status !== newStatus) {
          const isCritical = ['Hẹn gặp', 'Thẩm định', 'Không đạt'].includes(newStatus);
          if (isCritical) {
            const notifType = newStatus === 'Không đạt' ? 'warning' : 'success';
            notificationsToTrigger.push({
              title: `🎯 Cột mốc Lead quan trọng: ${newStatus}`,
              message: `Khách hàng "${l.name}" (${l.company}) vừa được chuyển trạng thái sang "${newStatus}" (Hàng loạt).`,
              type: notifType
            });
          }
        }
      });
      return prev.map(l => selectedLeadIds.includes(l.id) ? { ...l, status: newStatus } : l);
    });

    setSelectedLeadIds([]);
    addToast(
      'Cập nhật thành công',
      `Đã chuyển trạng thái của ${selectedLeadIds.length} khách tiềm năng đã chọn sang "${newStatus}".`,
      'success',
      'crm'
    );

    notificationsToTrigger.forEach(notif => {
      addNotificationToDb(notif.title, notif.message, notif.type);
    });
  };

  const convertLeadToDeal = (lead: Lead) => {
    addToast(
      'Chuyển đổi thành công!',
      `Đã chuyển Khách tiềm năng "${lead.name}" sang Cơ hội/Hợp đồng (Deal) và tự động tạo Hồ Sơ Khách Hàng 360 độ!`,
      'success',
      'crm'
    );
    
    // Add to Customers or Opportunity if linked
    // We update local status to a qualification and push to success
    updateLeadStatus(lead.id, 'Thẩm định');
    setSelectedLead(null);
  };

  const simulateAction = (type: 'call' | 'sms' | 'email', name: string) => {
    const textDict = {
      call: `Hệ thống CRM mô phỏng Cuộc gọi SIP Trực tuyến đến số điện thoại của ${name}... Trực tổng đài đang truyền kết nối thành công.`,
      sms: `Tin nhắn chăm sóc Khách hàng (Zalo ZNS / SMS Brandname) đã được bắn đến điện thoại ${name}.`,
      email: `Hệ thống đã gửi thư mời đàm phán CRM tự động đến địa chỉ hộp thư điện tử của ${name}.`
    };
    
    addToast(
      'Hành động mô phỏng',
      textDict[type],
      'info',
      'system'
    );
  };

  return (
    <div className="flex flex-col h-full gap-5 font-sans relative p-4 lg:p-6 overflow-y-auto no-scrollbar w-full" id="leads-module-container">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-slate-800 rounded-lg text-blue-600 dark:text-blue-400">
              <Magnet className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Khách hàng tiềm năng (Leads)
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Thu thập, phân loại phễu và khai thác thông tin từ đa nguồn (Facebook Ads, Webform, Google, Zalo)
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center border border-slate-200/50 dark:border-slate-700">
            <button
              onClick={() => setViewType('kanban')}
              className={`p-2 rounded-lg transition-all ${
                viewType === 'kanban' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Xem dạng thẻ Kanban"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewType('table')}
              className={`p-2 rounded-lg transition-all ${
                viewType === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Xem dạng Bảng dữ liệu"
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={15} strokeWidth={3} /> Thêm lead tay
          </button>
        </div>
      </div>

      {/* 2. Key stats panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="leads-stats-row">
        {[
          { 
            title: 'TỔNG SỐ LEAD', 
            val: totalLeads, 
            subtitle: 'mọi thời gian', 
            icon: Magnet, 
            color: 'from-blue-500 to-indigo-500', 
            bg: 'bg-blue-500/10' 
          },
          { 
            title: 'LEAD MỚI NHẬN', 
            val: newLeadsCount, 
            subtitle: `${newLeadsCount} cần phân công/phản hồi`, 
            icon: Clock, 
            color: 'from-amber-500 to-orange-500', 
            bg: 'bg-amber-500/10' 
          },
          { 
            title: 'QUALIFIED LEADS', 
            val: qualifiedLeads, 
            subtitle: `Tỷ lệ ~${Math.round((qualifiedLeads / totalLeads) * 100) || 0}% đạt thẩm định`, 
            icon: CheckCircle2, 
            color: 'from-emerald-500 to-teal-500', 
            bg: 'bg-emerald-500/10' 
          },
          { 
            title: 'TỔNG GIÁ TRỊ PHỄU (VND)', 
            val: totalLeadsValue.toLocaleString('vi-VN'), 
            subtitle: 'Tổng quan ngân sách lead sạch', 
            icon: TrendingUp, 
            color: 'from-fuchsia-500 to-pink-500', 
            bg: 'bg-fuchsia-500/10' 
          }
        ].map((x, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="flex flex-col min-w-0 z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{x.title}</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight truncate">{x.val}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold block">{x.subtitle}</span>
            </div>
            <div className={`p-3 rounded-xl ${x.bg} shrink-0`}>
              <x.icon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </div>
            {/* Ambient pattern */}
            <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tr ${x.color} opacity-0 hover:opacity-[0.03] group-hover:scale-125 transition-all rounded-full translate-x-6 translate-y-6`} />
          </div>
        ))}
      </div>

      {/* 3. Filtering Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row flex-wrap md:items-center justify-between gap-3" id="leads-filter-toolbar">
        <div className="flex-1 min-w-[280px] relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs pl-10 pr-4 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-semibold"
            placeholder="Tìm kiếm theo Tên, Số điện thoại, Email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Channel source filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700 rounded-lg px-2 py-1">
            <Filter size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Nguồn:</span>
            <select
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none border-none py-0.5 cursor-pointer"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="All">Tất cả nguồn</option>
              <option value="Facebook Ads">Facebook Ads</option>
              <option value="Google Search">Google Search</option>
              <option value="Website Form">Website Form</option>
              <option value="Zalo Campaign">Zalo Campaign</option>
              <option value="Referral">Hội thảo / Tự do</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700 rounded-lg px-2 py-1">
            <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Độ ưu tiên:</span>
            <select
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none border-none py-0.5 cursor-pointer"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">Tất cả</option>
              <option value="High">Cao</option>
              <option value="Medium">Trung bình</option>
              <option value="Low">Thấp</option>
            </select>
          </div>

          {(search || sourceFilter !== 'All' || priorityFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setSourceFilter('All');
                setPriorityFilter('All');
              }}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 rounded-lg transition-all"
            >
              Reset bộ lọc
            </button>
          )}
        </div>
      </div>

      {selectedLeadIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
              Đã chọn <strong className="text-sm font-black text-blue-800 dark:text-blue-300">{selectedLeadIds.length}</strong> khách tiềm năng
            </span>
            <button 
              onClick={() => setSelectedLeadIds([])}
              className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:hover:text-white underline uppercase ml-2 tracking-wider"
            >
              Huỷ chọn
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Đổi trạng thái:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdateLeadsStatus(e.target.value as Lead['status']);
                    e.target.value = '';
                  }
                }}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-semibold px-2.5 py-1.5 cursor-pointer text-slate-700 dark:text-slate-300 shadow-xs outline-none"
                defaultValue=""
              >
                <option value="" disabled>-- Chọn trạng thái --</option>
                {LEAD_STATUS_STAGES_LIST.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleBulkDeleteLeads}
              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/10 transition-all outline-none"
            >
              <Trash2 size={13} /> Xóa đã chọn
            </button>
          </div>
        </div>
      )}

      {/* 4. Core Render Switch */}
      <div className="flex-1 min-h-[450px]">
        {viewType === 'kanban' ? (
          /* KANBAN BOARD SYSTEM */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 h-full items-start" id="leads-kanban-board">
            {LEAD_STATUS_STAGES_LIST.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.status === stage);
              const stageSum = stageLeads.reduce((sum, current) => sum + current.value, 0);

              let headerBg = 'bg-blue-500';
              let headerText = 'text-blue-500 bg-blue-50 dark:bg-blue-950/20';
              if (stage === 'Đang liên hệ') {
                headerBg = 'bg-amber-500';
                headerText = 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
              } else if (stage === 'Hẹn gặp') {
                headerBg = 'bg-purple-500';
                headerText = 'text-purple-500 bg-purple-50 dark:bg-purple-950/20';
              } else if (stage === 'Thẩm định') {
                headerBg = 'bg-emerald-500';
                headerText = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
              } else if (stage === 'Không đạt') {
                headerBg = 'bg-slate-400';
                headerText = 'text-slate-500 bg-slate-100 dark:bg-slate-900/60';
              }

              return (
                <div 
                  key={stage} 
                  onDragOver={handleDragOverColumn}
                  onDrop={(e) => handleDropLeadOnColumn(e, stage)}
                  className="flex flex-col bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 min-h-[480px] hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-all duration-300 pointer-events-auto"
                >
                  {/* Stage top header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${headerBg}`} />
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                        {stage}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${headerText}`}>
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Stage sub text: Total stage worth */}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-4">
                    Giá trị: {stageSum.toLocaleString('vi-VN')} VND
                  </div>

                  {/* Drag drop slot / Leads List container */}
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] no-scrollbar flex-1 pb-10">
                    {stageLeads.length === 0 ? (
                      <div className="border border-dashed border-slate-200/60 dark:border-slate-800 text-center py-8 rounded-xl text-[10px] font-semibold text-slate-400 italic">
                        Kéo thả hoặc trống
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          draggable
                          onDragStart={(e) => handleDragStartLead(e, lead.id)}
                          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all relative group"
                        >
                          {/* Priority Badge */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={selectedLeadIds.includes(lead.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLeadIds(prev => [...prev, lead.id]);
                                  } else {
                                    setSelectedLeadIds(prev => prev.filter(id => id !== lead.id));
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                              />
                              <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
                                {lead.id}
                              </span>
                            </div>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                lead.priority === 'High' 
                                  ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' 
                                  : lead.priority === 'Medium' 
                                  ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/20' 
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}>
                              {lead.priority === 'High' ? 'Cao' : lead.priority === 'Medium' ? 'Vừa' : 'Thấp'}
                            </span>
                          </div>

                          <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors">
                            {lead.name}
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                            {lead.company}
                          </p>

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100/60 dark:border-slate-800/80 pt-2.5">
                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              {lead.source}
                            </div>
                            <div className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                              {lead.value.toLocaleString('vi-VN')} đ
                            </div>
                          </div>

                          {/* Quick workflow bar */}
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateLeadStatus(
                                  lead.id, 
                                  stage === 'Mới nhận' ? 'Đang liên hệ' : stage === 'Đang liên hệ' ? 'Hẹn gặp' : stage === 'Hẹn gặp' ? 'Thẩm định' : 'Thẩm định'
                                );
                              }}
                              className="p-1 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer"
                              title="Chuyển giai đoạn tiếp"
                              disabled={stage === 'Không đạt' || stage === 'Thẩm định'}
                            >
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* DATA TABLE VIEW SYSTEM */
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm" id="leads-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-4 px-4 w-12 text-center text-[10px] font-black text-slate-400 uppercase">
                      <input 
                        type="checkbox" 
                        checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadIds(filteredLeads.map(l => l.id));
                          } else {
                            setSelectedLeadIds([]);
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã Lead</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ tên & Đơn vị</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên hệ</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kênh nạp</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá trị</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ ưu tiên</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-20 text-xs font-semibold text-slate-400 italic">
                        Không tìm thấy khách hàng tiềm năng thích hợp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr 
                        key={lead.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="py-4 px-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeadIds(prev => [...prev, lead.id]);
                              } else {
                                setSelectedLeadIds(prev => prev.filter(id => id !== lead.id));
                              }
                            }}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-6 text-xs font-extrabold text-slate-400">{lead.id}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {lead.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                              {lead.company}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>
                            <span className="flex items-center gap-1 mt-0.5"><Mail size={10} /> {lead.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-bold">{lead.source}</td>
                        <td className="py-4 px-6 text-xs font-black text-slate-900 dark:text-white">
                          {lead.value.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            lead.priority === 'High' 
                              ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' 
                              : lead.priority === 'Medium' 
                              ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/20' 
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}>
                            {lead.priority === 'High' ? 'Cao' : lead.priority === 'Medium' ? 'Vừa' : 'Thấp'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="relative">
                            <select
                              value={lead.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                              className="bg-slate-100 dark:bg-slate-800 border-none outline-none text-[10px] font-black px-2 py-1 rounded cursor-pointer text-slate-700 dark:text-slate-200"
                            >
                              {LEAD_STATUS_STAGES_LIST.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <ChevronRight size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 rounded-lg transition-colors"
                              title="Xóa Lead"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. SIDE DETAIL DRAWER FOR ACTIVE LEAD */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 max-w-md w-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 z-50 p-6 shadow-2xl flex flex-col h-full font-sans overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Magnet className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">HỒ SƠ KHÁCH TIỀM NĂNG</span>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lead details header */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-500/20">
                    {selectedLead.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {selectedLead.name}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 block">
                      {selectedLead.company}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-5">
                  <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">Nguồn thông tin</span>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-1 block">{selectedLead.source}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">Ước lượng Ngân sách</span>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 mt-1 block">
                      {selectedLead.value.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic operations and tools */}
              <div className="mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">TƯƠNG TÁC CHĂM SÓC KHÁCH</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => simulateAction('call', selectedLead.name)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/10 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all font-bold text-[10px] gap-1.5"
                  >
                    <Phone size={16} className="text-blue-500" />
                    Bắt đầu Cuộc gọi
                  </button>
                  <button
                    onClick={() => simulateAction('sms', selectedLead.name)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all font-bold text-[10px] gap-1.5"
                  >
                    <MessageSquare size={16} className="text-emerald-500" />
                    SMS / Zalo ZNS
                  </button>
                  <button
                    onClick={() => simulateAction('email', selectedLead.name)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-50/10 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all font-bold text-[10px] gap-1.5"
                  >
                    <Mail size={16} className="text-amber-500" />
                    Gửi thư ngỏ email
                  </button>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-150 dark:border-slate-800 rounded-xl mb-6 flex flex-col gap-3">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">GIAI ĐOẠN PHỄU SALES</span>
                  <div className="flex flex-wrap gap-1">
                    {LEAD_STATUS_STAGES_LIST.map((stage) => {
                      const isActive = selectedLead.status === stage;
                      return (
                        <button
                          key={stage}
                          onClick={() => updateLeadStatus(selectedLead.id, stage)}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/80 hover:bg-slate-150'
                          }`}
                        >
                          {stage}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700">
                  <button
                    onClick={() => convertLeadToDeal(selectedLead)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} /> Chuyển thành Deal/Khách hàng 360
                  </button>
                </div>
              </div>

              {/* Core Details Metadata Fields */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100/60 dark:border-slate-800 pb-1.5">THÔNG TIN CHI TIẾT</span>
                
                {[
                  { label: 'Số điện thoại', value: selectedLead.phone, icon: Phone },
                  { label: 'Địa chỉ Email', value: selectedLead.email, icon: Mail },
                  { label: 'Sales phụ trách', value: selectedLead.ownerName, icon: UserPlus },
                  { label: 'Thời gian nạp', value: selectedLead.createdAt, icon: Calendar }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs font-semibold">
                    <item.icon size={14} className="text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <span className="text-slate-400 block text-[9px] font-black uppercase">{item.label}</span>
                      <span className="text-slate-700 dark:text-slate-200 mt-0.5 block">{item.value}</span>
                    </div>
                  </div>
                ))}

                <div className="pt-2.5">
                  <span className="text-[9px] font-black text-slate-400 block uppercase mb-1">Ghi chú & yêu cầu khai thác</span>
                  <p className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                    {selectedLead.notes}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                    <Activity size={12} className="text-blue-500" /> TIMELINE HOẠT ĐỘNG (LỜI THOẠI)
                  </span>

                  {/* Mic Recorder voice memo input field */}
                  <div className="bg-slate-50 dark:bg-slate-850/60 p-3 rounded-xl border border-slate-150 dark:border-slate-800 mb-4">
                    <div className="relative">
                      <textarea
                        value={activeMemoInput}
                        onChange={(e) => setActiveMemoInput(e.target.value)}
                        placeholder={isRecordingMemo ? "Đang lắng nghe... Hãy nói qua mic của bạn." : "Nhập nội dung tương tác hoặc click Mic để đọc ghi chú thoại..."}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none min-h-[60px] pr-10 resize-none font-medium leading-relaxed shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleToggleVoiceMemo}
                        className={`absolute right-2.5 bottom-3 p-1.5 rounded-full transition-all cursor-pointer ${
                          isRecordingMemo
                            ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/10'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                        title={isRecordingMemo ? 'Dừng ghi âm lời thoại' : 'Bấm để ghi âm bằng lời thoại'}
                      >
                        <Mic size={14} className={isRecordingMemo ? 'scale-110' : ''} />
                      </button>
                    </div>

                    {isRecordingMemo && (
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-rose-500 animate-pulse">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        Đang thu âm giọng nói trực tiếp...
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-2">
                      {activeMemoInput && (
                        <button
                          type="button"
                          onClick={() => setActiveMemoInput('')}
                          className="px-2.5 py-1 text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase"
                        >
                          Xoá nháp
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddActivity(selectedLead.id)}
                        disabled={!activeMemoInput.trim()}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm ${
                          activeMemoInput.trim()
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                        }`}
                      >
                        Ghi Lịch Sử
                      </button>
                    </div>
                  </div>

                  {/* List of chronological activities */}
                  <div className="space-y-4 max-h-[220px] overflow-y-auto no-scrollbar pl-1 pr-1">
                    {!leadActivities[selectedLead.id] || (leadActivities[selectedLead.id] as any[]).length === 0 ? (
                      <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                        Chưa có lịch sử cuộc gọi hay tương tác của lead này
                      </div>
                    ) : (
                      <div className="border-l border-slate-200 dark:border-slate-800 pl-3.5 space-y-4 relative">
                        {(leadActivities[selectedLead.id] as any[]).map((activity: any) => (
                          <div key={activity.id} className="relative text-xs group">
                            {/* Dot */}
                            <span className="absolute -left-[19.5px] top-1.5 w-2 h-2 rounded-full border border-white bg-blue-500 shadow-sm" />
                            <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-400 mb-0.5">
                              <span>{activity.createdAt}</span>
                              {activity.isVoice && (
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 px-1.5 py-0.5 rounded flex items-center gap-1 text-[8px] font-black uppercase">
                                  <Volume2 size={8} /> Thu âm thoại
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-xl py-2 shadow-xs">
                              {activity.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Delete */}
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  className="w-full border border-rose-200/50 hover:bg-rose-50 text-rose-500 hover:text-rose-600 font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Xóa Dữ Liệu Khách Tiềm Năng
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 6. MODAL TO ADD NEW LEAD (Tay) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Magnet className="text-blue-600 animate-spin" size={20} />
                  <h3 className="font-black text-sm text-slate-950 dark:text-white uppercase tracking-wider">
                    Thêm Khách hàng Tiềm năng mới (Lead)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="p-6 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                
                {/* Full name input */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Họ và Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-bold"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                  />
                </div>

                {/* Grid for Company and Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tên cơ quan / Đơn vị</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-bold"
                      placeholder="Công ty TNHH Hoàng Gia..."
                      value={newLeadCompany}
                      onChange={(e) => setNewLeadCompany(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Ngân sách dự chi (VND)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-bold"
                      placeholder="0"
                      value={newLeadValue}
                      onChange={(e) => setNewLeadValue(e.target.value)}
                    />
                  </div>
                </div>

                {/* Grid for Phone and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-bold"
                      placeholder="09xxxxxxxx"
                      value={newLeadPhone}
                      onChange={(e) => setNewLeadPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Hòm thư Email</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-bold"
                      placeholder="name@domain.com"
                      value={newLeadEmail}
                      onChange={(e) => setNewLeadEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Grid for Source and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Kênh tiếp cận (Nguồn)</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-bold cursor-pointer"
                      value={newLeadSource}
                      onChange={(e) => setNewLeadSource(e.target.value as Lead['source'])}
                    >
                      <option value="Website Form">Website Form (Biểu mẫu Web)</option>
                      <option value="Facebook Ads">Facebook Ads (Quảng cáo Ads)</option>
                      <option value="Google Search">Google Search (Tự nhiên)</option>
                      <option value="Zalo Campaign">Zalo Campaign (Tin nhắn ZNS)</option>
                      <option value="Referral">Hội thảo / Tự do giới thiệu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Độ ưu tiên</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-bold cursor-pointer"
                      value={newLeadPriority}
                      onChange={(e) => setNewLeadPriority(e.target.value as Lead['priority'])}
                    >
                      <option value="High">Cao (High)</option>
                      <option value="Medium">Trung bình (Medium)</option>
                      <option value="Low">Thấp (Low)</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Ý kiến khách hàng & Ghi chú tư vấn</label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-blue-500 font-semibold"
                    placeholder="Yêu cầu cụ thể, tính chất dự án..."
                    value={newLeadNotes}
                    onChange={(e) => setNewLeadNotes(e.target.value)}
                  />
                </div>

                {/* Actions bottom */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="border border-slate-200 text-slate-700 hover:bg-slate-50 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/10 active:scale-95 transition-all"
                  >
                    Khởi tạo khách tiềm năng
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
