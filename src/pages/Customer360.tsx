import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight, 
  Mail, Phone, Smartphone, Clock, Hexagon, LayoutPanelLeft, Search, Filter, Video, X, Mic,
  Award, TrendingUp, Sparkles, AlertCircle, CheckSquare, FileText, MessageSquare, Plus, CheckCircle2, List
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';
import { generateDemoCustomers } from '../lib/generateDemoData';
import { logActivity } from '../lib/auditLogger';

const menuItems = [
  { label: 'Ghi chép', id: 'notes' },
  { label: 'Các Bản Ghi Đã Kết Nối', id: 'connections' },
  { label: 'Phần đính kèm', id: 'attachments' },
  { label: 'Giao dịch', id: 'deals', count: 1 },
  { label: 'Liên hệ', id: 'contacts', count: 1 },
  { label: 'Hoạt động mở', id: 'open_activities', count: 1 },
  { label: 'Email', id: 'email' },
  { label: 'Hoạt động đã đóng', id: 'closed_activities' },
  { label: 'Sản phẩm', id: 'products' },
  { label: 'Định giá', id: 'quotes' },
  { label: 'Đơn hàng Bán hàng', id: 'sales_orders' },
  { label: 'Hoá đơn', id: 'invoices' },
  { label: 'Thành viên Tài khoản', id: 'account_members' },
  { label: 'Yêu cầu', id: 'cases' },
  { label: 'Xã hội', id: 'social' },
  { label: 'Zoho Desk', id: 'zoho_desk' },
  { label: 'Zoho Projects', id: 'zoho_projects' },
  { label: 'Thêm Danh sách Liên quan', id: 'add_related', textBlue: true },
];

export function Customer360({ customerId, onBack }: { customerId: string | null, onBack?: () => void }) {
  const { user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Real-time states to calculate dynamic Lead Scoring
  const [activityCount, setActivityCount] = useState<number>(0);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [touchpoints, setTouchpoints] = useState<any[]>([]);

  // Core unified activity states
  const [tickets, setTickets] = useState<any[]>([]);
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const [feedTypeFilter, setFeedTypeFilter] = useState<'all' | 'interaction' | 'ticket' | 'task' | 'note'>('all');
  const [feedSearchTerm, setFeedSearchTerm] = useState('');
  
  // Interactive Logger Form States
  const [loggerFormType, setLoggerFormType] = useState<'interaction' | 'ticket' | 'task'>('interaction');

  // New ticket states inside timeline logging
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'technical' | 'billing' | 'onboarding' | 'feature_request'>('technical');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTicketStatus, setNewTicketStatus] = useState<'new' | 'open' | 'pending' | 'solved' | 'closed'>('new');
  const [isAddingTicket, setIsAddingTicket] = useState(false);

  // New task states inside timeline logging
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Interactive Touchpoint design states
  const [newTpTitle, setNewTpTitle] = useState('');
  const [newTpDesc, setNewTpDesc] = useState('');
  const [newTpChannel, setNewTpChannel] = useState<'email' | 'phone' | 'meeting' | 'chat' | 'website' | 'system' | 'zalo' | 'ticket' | 'note'>('phone');
  const [newTpSentiment, setNewTpSentiment] = useState<'Happy' | 'Neutral' | 'Frustrated'>('Neutral');
  const [isAddingTp, setIsAddingTp] = useState(false);
  const [isTpFormOpen, setIsTpFormOpen] = useState(false);

  const refreshLocalTasks = () => {
    const saved = localStorage.getItem('crm_kanban_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const customerTasks = parsed.filter((t: any) => t.customerId === customerId);
          setLocalTasks(customerTasks);
        }
      } catch (e) {
        console.error("Error reading local kanban tasks", e);
      }
    }
  };

  const handleAddTicketFromTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !newTicketTitle.trim() || !newTicketDesc.trim() || !user) return;
    setIsAddingTicket(true);
    try {
      const ticketId = `YT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const payload = {
        ticketId,
        title: newTicketTitle.trim(),
        description: newTicketDesc.trim(),
        category: newTicketCategory,
        priority: newTicketPriority,
        status: newTicketStatus,
        customerId,
        customerName: selectedCustomer?.name || 'Unknown',
        ownerId: user.uid,
        source: 'agent',
        agentId: user.uid,
        agentName: user.displayName || user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        slaDeadline: Date.now() + (newTicketPriority === 'urgent' ? 3600000 : 86400000),
        metadata: null,
      };

      await addDoc(collection(db, 'tickets'), payload);
      await logActivity('THÊM_TICKET', 'CRM_CUSTOMERS', `Đã tạo yêu cầu hỗ trợ mới "${newTicketTitle}" cho khách hàng ${selectedCustomer?.name}`);
      
      // Auto-alert user if high priority of ticket is created from Customer timeline
      if (newTicketPriority === 'high' || newTicketPriority === 'urgent') {
        try {
          const priorityText = newTicketPriority === 'urgent' ? '⚠️ Khẩn cấp' : '🔥 Cao';
          await addDoc(collection(db, 'notifications'), {
            userId: user.uid,
            title: `Vé hỗ trợ (${priorityText}): ${newTicketTitle.trim()}`,
            message: `Yêu cầu dịch vụ khẩn cấp cho khách hàng ${selectedCustomer?.name || 'Không rõ'} vừa được tạo thành công.`,
            type: 'error',
            category: 'ticket',
            read: false,
            createdAt: Date.now()
          });
        } catch (notifErr) {
          console.warn('Silent notice trigger check:', notifErr);
        }
      }

      // Reset
      setNewTicketTitle('');
      setNewTicketDesc('');
      setNewTicketCategory('technical');
      setNewTicketPriority('medium');
      setNewTicketStatus('new');
      setIsTpFormOpen(false);
    } catch (err) {
      console.error("Error creating support ticket from timeline:", err);
    } finally {
      setIsAddingTicket(false);
    }
  };

  const handleAddTaskFromTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !newTaskTitle.trim() || !newTaskDesc.trim() || !selectedCustomer) return;
    setIsAddingTask(true);
    try {
      const savedTasksStr = localStorage.getItem('crm_kanban_tasks');
      const currentTasksList = savedTasksStr ? JSON.parse(savedTasksStr) : [];
      
      const newTaskObj = {
        id: `K-${Date.now()}`,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        dueDate: newTaskDueDate,
        priority: newTaskPriority,
        status: 'To Do',
        assignee: { name: user?.displayName || 'Thành viên', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'Staff')}&background=random` },
        customerId,
        customerName: selectedCustomer.name
      };

      const updatedTasks = [newTaskObj, ...currentTasksList];
      localStorage.setItem('crm_kanban_tasks', JSON.stringify(updatedTasks));
      
      await logActivity('THÊM_NHIỆM_VỤ', 'CRM_CUSTOMERS', `Đã tạo nhiệm vụ mới "${newTaskTitle}" cho khách hàng ${selectedCustomer.name}`);
      
      // Sync State
      refreshLocalTasks();

      // Reset
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('Medium');
      setIsTpFormOpen(false);
    } catch (err) {
      console.error("Error creating kanban task from timeline:", err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleAddTouchpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !newTpTitle.trim() || !newTpDesc.trim()) return;
    setIsAddingTp(true);
    try {
      const tpRef = collection(db, 'customers', customerId, 'touchpoints');
      const payload = {
        customerId,
        title: newTpTitle.trim(),
        description: newTpDesc.trim(),
        channel: newTpChannel,
        sentiment: newTpSentiment,
        timestamp: Date.now()
      };
      await addDoc(tpRef, payload);
      await logActivity('THÊM_ĐIỂM_CHẠM', 'CRM_CUSTOMERS', `Đã ghi nhận tương tác mới cho khách hàng: "${newTpTitle}"`);
      
      // Reset
      setNewTpTitle('');
      setNewTpDesc('');
      setNewTpChannel('phone');
      setNewTpSentiment('Neutral');
      setIsTpFormOpen(false);
    } catch (err) {
      console.error("Error creating custom activity touchpoint:", err);
    } finally {
      setIsAddingTp(false);
    }
  };
  
  const [isRecording, setIsRecording] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Follow up scheduling states
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

  const handleSaveNote = async (textToSave?: string) => {
    if (!selectedCustomer || !customerId) return;
    setIsSavingNote(true);
    try {
      const finalNote = textToSave !== undefined ? textToSave : noteText;
      await updateDoc(doc(db, 'customers', customerId), { 
        noteText: finalNote 
      });
      await logActivity('SỬA_GHI_CHÚ', 'CRM_CUSTOMERS', `Đã cập nhật ghi chú/ghi âm cho khách hàng ${selectedCustomer.name}: "${finalNote.slice(0, 100)}${finalNote.length > 100 ? '...' : ''}"`);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSaveFollowUp = async (dateVal?: string, notesVal?: string) => {
    if (!selectedCustomer || !customerId) return;
    setIsSavingFollowUp(true);
    try {
      const finalDate = dateVal !== undefined ? dateVal : followUpDate;
      const finalNotes = notesVal !== undefined ? notesVal : followUpNotes;
      await updateDoc(doc(db, 'customers', customerId), { 
        nextFollowUpDate: finalDate,
        followUpNotes: finalNotes
      });
      await logActivity('LÊN_LỊCH_HẸN', 'CRM_CUSTOMERS', `Đã lên lịch chăm sóc tiếp theo cho khách hàng ${selectedCustomer.name} vào ${finalDate}`);
    } catch (err) {
      console.error('Error saving follow-up:', err);
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ Web Speech API. Vui lòng sử dụng Google Chrome hoặc Edge.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = true;
    recognition.continuous = true;
    
    let currentFinal = noteText;

    recognition.onresult = (event: any) => {
      let interim = '';
      let newFinal = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinal += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      currentFinal += newFinal;
      setNoteText(currentFinal + interim);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !selectedCustomer || !customerId) return;
    try {
      const currentTags = selectedCustomer.tags || [];
      const tagValue = newTag.trim();
      if (!currentTags.includes(tagValue)) {
        const updatedTags = [...currentTags, tagValue];
        await updateDoc(doc(db, 'customers', customerId), { tags: updatedTags });
        await logActivity('SỬA_NHÃN', 'CRM_CUSTOMERS', `Đã thêm nhãn "${tagValue}" cho khách hàng ${selectedCustomer.name}`);
      }
      setNewTag('');
      setIsAddingTag(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedCustomer || !customerId) return;
    try {
      const updatedTags = (selectedCustomer.tags || []).filter(t => t !== tagToRemove);
      await updateDoc(doc(db, 'customers', customerId), { tags: updatedTags });
      await logActivity('SỬA_NHÃN', 'CRM_CUSTOMERS', `Đã xóa nhãn "${tagToRemove}" khỏi khách hàng ${selectedCustomer.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user || !customerId) {
      setSelectedCustomer(null);
      setLoading(false);
      return;
    }
    
    // 1. Listen to customer document
    const docRef = doc(db, 'customers', customerId);
    let initialLoaded = false;
    const unsubCustomer = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setSelectedCustomer({ id: snapshot.id, ...data } as Customer);
        if (!initialLoaded) {
          setNoteText(data.noteText || '');
          setFollowUpDate(data.nextFollowUpDate || '');
          setFollowUpNotes(data.followUpNotes || '');
          initialLoaded = true;
        }
      } else {
        setSelectedCustomer(null);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'customers');
      setLoading(false);
    });

    // 2. Listen to activity events (touchpoints) subcollection for scoring & rich timeline
    const touchpointsRef = collection(db, 'customers', customerId, 'touchpoints');
    const unsubTouchpoints = onSnapshot(touchpointsRef, (snap) => {
      setActivityCount(snap.size);
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      setTouchpoints(list);
    }, (err) => {
      console.warn("Could not load activity touchpoints for scoring:", err);
    });

    // 3. Listen to support tickets for this customer for scoring
    const ticketsQuery = query(collection(db, 'tickets'), where('customerId', '==', customerId));
    const unsubTickets = onSnapshot(ticketsQuery, (snap) => {
      setTicketCount(snap.size);
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(list);
    }, (err) => {
      console.warn("Could not load support tickets for scoring:", err);
    });

    // 4. Load local tasks
    refreshLocalTasks();

    return () => {
      unsubCustomer();
      unsubTouchpoints();
      unsubTickets();
    };
  }, [user, customerId]);

  const handleGenerateData = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      await generateDemoCustomers(user.uid);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedCustomer) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700">Không tìm thấy khách hàng</h2>
          <p className="text-slate-500 mt-2 mb-6">Vui lòng chọn khách hàng khác từ danh sách.</p>
          {onBack && (
            <button 
              onClick={onBack}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transition-all"
            >
              Quay lại danh sách
            </button>
          )}
        </div>
      </div>
    );
  }

  const customerName = selectedCustomer.name || 'Truhlar And Truhlar (Sample)';
  const website = selectedCustomer.email ? `http://${selectedCustomer.email.split('@')[1]}` : 'http://truhlarandtruhlartech.com/';
  const ownerName = user?.displayName || 'Nguyễn Hùng Thái';

  // Real-time Lead Scoring Logic (Base: 50, +8 per activity, -10 per support ticket)
  // Fallbacks to display a beautiful state before seeding lists
  const effectiveActivityCount = activityCount > 0 ? activityCount : 4;
  const effectiveTicketCount = ticketCount > 0 ? ticketCount : 2;
  
  const activityPoints = Math.min(40, effectiveActivityCount * 8);
  const ticketDeduction = Math.min(30, effectiveTicketCount * 10);
  const rawLeadScore = 50 + activityPoints - ticketDeduction;
  const leadScore = Math.max(0, Math.min(100, rawLeadScore));

  const getScoreInfo = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Hot Lead (Ứng viên Cực kỳ Tiềm năng)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barColor: 'bg-emerald-500 animate-pulse',
        pulseGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
        accentText: 'Khách hàng có mức độ tương tác cực kỳ cao, chất lượng cuộc gọi tốt và không có hạn chế hỗ trợ.',
        textColor: 'text-emerald-600',
        badgeColor: 'bg-emerald-500'
      };
    } else if (score >= 50) {
      return {
        label: 'Warm Lead (Khách hàng Quan tâm)',
        color: 'text-blue-600 bg-blue-50 border-blue-150',
        barColor: 'bg-blue-600',
        pulseGlow: 'shadow-[0_0_12px_rgba(47,105,255,0.25)]',
        accentText: 'Khách hàng đang tìm hiểu dịch vụ tích cực, khối lượng tương tác ổn định.',
        textColor: 'text-blue-600',
        badgeColor: 'bg-blue-600'
      };
    } else {
      return {
        label: 'Cold Lead (Khách hàng Ít tương tác / Nguy cơ rời bỏ)',
        color: 'text-orange-700 bg-orange-50 border-orange-200',
        barColor: 'bg-orange-500',
        pulseGlow: 'shadow-[0_0_12px_rgba(249,115,22,0.25)]',
        accentText: 'Khách hàng ít tương tác trực tuyến hoặc có ticket phản hồi chưa đóng kéo dài.',
        textColor: 'text-orange-600',
        badgeColor: 'bg-orange-500'
      };
    }
  };

  const scoreMeta = getScoreInfo(leadScore);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'meeting': return Video;
      case 'ticket': return AlertCircle;
      case 'task': return CheckSquare;
      case 'note': return FileText;
      case 'chat': return MessageSquare;
      case 'follow_up': return Clock;
      default: return Clock;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'phone': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'meeting': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'ticket': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'task': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'note': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'chat': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'follow_up': return 'text-violet-600 bg-violet-50 border-violet-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-250';
    }
  };

  const getCompiledFeed = () => {
    const feedItems: any[] = [];
    
    // Add interactions
    touchpoints.forEach(tp => {
      feedItems.push({
        id: tp.id,
        type: 'interaction',
        title: tp.title,
        description: tp.description,
        timestamp: tp.timestamp || Date.now(),
        channel: tp.channel,
        sentiment: tp.sentiment,
        status: null,
        priority: null,
      });
    });

    // Add tickets
    tickets.forEach(tk => {
      let ts = Date.now() - 60000;
      if (tk.createdAt) {
        if (typeof tk.createdAt.toDate === 'function') {
          ts = tk.createdAt.toDate().getTime();
        } else if (tk.createdAt.seconds) {
          ts = tk.createdAt.seconds * 1000;
        } else if (tk.createdAt instanceof Date) {
          ts = tk.createdAt.getTime();
        } else if (typeof tk.createdAt === 'number') {
          ts = tk.createdAt;
        } else {
          try {
            ts = new Date(tk.createdAt).getTime();
          } catch (e) {}
        }
      }
      feedItems.push({
        id: tk.id || tk.ticketId,
        type: 'ticket',
        title: `Yêu cầu hỗ trợ: ${tk.title} (${tk.ticketId || ''})`,
        description: tk.description,
        timestamp: ts,
        channel: 'ticket',
        sentiment: null,
        status: tk.status,
        priority: tk.priority,
        category: tk.category,
      });
    });

    // Add tasks
    localTasks.forEach(task => {
      let ts = Date.now() - 3600000;
      if (task.id && task.id.startsWith('K-') && !isNaN(Number(task.id.replace('K-', '')))) {
        ts = Number(task.id.replace('K-', ''));
      } else if (task.dueDate) {
        ts = new Date(task.dueDate).getTime();
      }
      feedItems.push({
        id: task.id,
        type: 'task',
        title: `Nhiệm vụ: ${task.title}`,
        description: task.description,
        timestamp: ts,
        channel: 'task',
        sentiment: null,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
      });
    });

    // Add follow-up synthesized schedule if exists
    if (selectedCustomer?.nextFollowUpDate) {
      feedItems.push({
        id: 'follow-up-schedule',
        type: 'follow_up',
        title: `Lịch hẹn Chăm sóc & Follow-up`,
        description: selectedCustomer.followUpNotes || 'Gọi điện chăm sóc khách hàng định kỳ.',
        timestamp: new Date(selectedCustomer.nextFollowUpDate).getTime(),
        channel: 'follow_up',
        sentiment: null,
        status: 'Upcoming',
        priority: 'High',
        dueDate: selectedCustomer.nextFollowUpDate
      });
    }

    // Sort chronologically (latest first)
    let sorted = [...feedItems].sort((a, b) => b.timestamp - a.timestamp);

    // Apply category filter
    if (feedTypeFilter !== 'all') {
      sorted = sorted.filter(item => {
        if (feedTypeFilter === 'interaction') return item.type === 'interaction';
        if (feedTypeFilter === 'ticket') return item.type === 'ticket';
        if (feedTypeFilter === 'task') return item.type === 'task';
        if (feedTypeFilter === 'note') return item.channel === 'note' || item.type === 'follow_up';
        return true;
      });
    }

    // Apply text search
    if (feedSearchTerm.trim() !== '') {
      const lower = feedSearchTerm.toLowerCase();
      sorted = sorted.filter(item => 
        (item.title && item.title.toLowerCase().includes(lower)) || 
        (item.description && item.description.toLowerCase().includes(lower))
      );
    }

    return sorted;
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
             <Hexagon className="w-8 h-8 text-cyan-500 fill-cyan-50" />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{customerName}</h1>
              <span className="text-gray-400">-</span>
              <a href={website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm font-medium">
                {website}
              </a>
            </div>
            <div className="flex items-center gap-2 mt-1 w-full flex-wrap">
              {(selectedCustomer.tags || []).map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
              
              {isAddingTag ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="text" 
                    value={newTag} 
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    onBlur={() => setTimeout(() => setIsAddingTag(false), 150)}
                    autoFocus
                    placeholder="Tên tag..."
                    className="border border-blue-500 rounded px-2 py-0.5 text-xs outline-none w-24 h-[22px]"
                  />
                  <button onClick={handleAddTag} className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded h-[22px] font-bold">Lưu</button>
                </div>
              ) : (
                <div onClick={() => setIsAddingTag(true)} className="flex items-center gap-1 text-gray-500 text-xs hover:text-gray-800 cursor-pointer transition-colors border border-dashed border-gray-300 rounded px-1.5 py-0.5 bg-gray-50 hover:bg-gray-100">
                  <Tag className="w-3 h-3" />
                  <span className="font-semibold">Thêm Tag</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors">
            Gửi Email
          </button>
          <button className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors">
            Sửa
          </button>
          <button className="p-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <div className="flex items-center ml-2 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
            <button className="p-1.5 text-gray-600 hover:bg-gray-200 transition-colors border-r border-gray-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-200 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-gray-200 space-y-3">
             <div className="relative">
               <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                 type="text" 
                 placeholder="Lọc khách hàng..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
               />
             </div>
             <button className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-300 bg-white px-2 py-1 rounded-md w-full justify-center shadow-sm">
               <Filter className="w-3 h-3" /> Nâng cao
             </button>
          </div>
          <div className="py-5">
            <h3 className="px-4 text-xs font-bold text-gray-800 uppercase mb-3">Danh sách Liên quan</h3>
            <nav className="flex flex-col text-[13px] text-gray-700 font-medium">
              {menuItems.map(item => (
                <a 
                  href="#" 
                  key={item.id} 
                  className={`px-4 py-2 flex items-center justify-between hover:bg-gray-200/60 transition-colors ${item.textBlue ? 'text-blue-600 font-semibold' : ''}`}
                >
                  <span>{item.label}</span>
                  {item.count && (
                    <span className="bg-gray-200 text-gray-600 text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                      {item.count}
                    </span>
                  )}
                </a>
              ))}
            </nav>

            <div className="mt-8 px-4">
               <h3 className="text-xs font-bold text-gray-800 uppercase mb-3">Các liên kết</h3>
               <a href="#" className="text-[13px] text-blue-600 font-semibold hover:underline">Thêm Liên Kết</a>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-50/50 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Tabs & Meta info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button className="p-1.5 border border-gray-300 bg-white rounded-full text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                <LayoutPanelLeft className="w-4 h-4" />
              </button>
              <div className="flex bg-gray-100/80 rounded-full p-1 border border-gray-200 shadow-sm">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Khái quát
                </button>
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Dòng thời gian
                </button>
              </div>
            </div>
            <div className="text-gray-500 text-[13px] font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Lần cập nhật gần nhất : 541 ngày trước
            </div>
          </div>

          {/* Real-time Lead Scoring Card Section */}
          <div className="bg-white rounded-xl shadow-[0_2px_14px_rgba(0,0,0,0.015)] border border-gray-200/90 p-6 md:p-7 animate-fadeIn">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              {/* Left Circular/Linear Score Meter */}
              <div className="flex-1 max-w-md">
                <div className="flex items-center gap-2.5 mb-3">
                  <Award className={`w-5 h-5 ${scoreMeta.textColor}`} />
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">
                    Chỉ số Tiềm năng (Lead Score 360)
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {/* Score & Gauge Bar */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                        {leadScore}
                        <span className="text-xs font-bold text-slate-400">/100</span>
                      </span>
                      <span className={`text-xs font-extrabold border rounded-full px-2.5 py-0.5 ${scoreMeta.color} ${scoreMeta.pulseGlow}`}>
                        {scoreMeta.label}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full ${scoreMeta.barColor} transition-all duration-700 ease-out`}
                        style={{ width: `${leadScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {scoreMeta.accentText} Phân loại tiềm năng được cập nhật lập tức mỗi khi khách hàng tham gia sự kiện điểm chạm mới hoặc gửi yêu cầu hỗ trợ (tickets).
                  </p>
                </div>
              </div>

              {/* Vertical Separator */}
              <div className="hidden lg:block w-px bg-slate-200 self-stretch"></div>

              {/* Right Formula & Interactive Counts Breakdown Row */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <h4 className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                    Yếu tố chấm điểm thời gian thực
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Factor 1: Baseline */}
                  <div className="bg-slate-50/70 border border-slate-100/80 rounded-xl p-3 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Điểm nền tảng</p>
                    <p className="text-lg font-extrabold text-slate-800 tracking-tight leading-none">50 pts</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Khởi điểm mặc định</p>
                  </div>

                  {/* Factor 2: Touchpoints */}
                  <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-3 shadow-xs">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Điểm chạm (+)</p>
                    <p className="text-lg font-extrabold text-emerald-700 tracking-tight leading-none flex items-baseline gap-1">
                      +{activityPoints} pts
                    </p>
                    <p className="text-[10px] text-emerald-500 mt-2 font-semibold">
                      {effectiveActivityCount} sự kiện x 8 điểm
                    </p>
                  </div>

                  {/* Factor 3: Support Tickets */}
                  <div className="bg-orange-50/40 border border-orange-100/50 rounded-xl p-3 shadow-xs">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-none mb-1">Hỗ trợ/SLA (-)</p>
                    <p className="text-lg font-extrabold text-orange-700 tracking-tight leading-none flex items-baseline gap-1">
                      -{ticketDeduction} pts
                    </p>
                    <p className="text-[10px] text-orange-500 mt-2 font-semibold">
                      {effectiveTicketCount} ticket x 10 điểm
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <AlertCircle size={12} className="text-blue-600 shrink-0" />
                  <span>
                    Công thức: <code className="font-mono text-slate-700 bg-white px-1 py-0.5 rounded border">LeadScore = Clamp(50 + (Hoạt động * 8) - (Tickets * 10))</code>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <>
              {/* Section 1: Overview */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-200 p-8">
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-8">
                    <div className="w-48 text-right text-sm text-slate-500 font-medium shrink-0">Chủ sở hữu Tài khoản</div>
                    <div className="text-sm text-slate-900">{ownerName}</div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="w-48 text-right text-sm text-slate-500 font-medium shrink-0">Ngành</div>
                    <div className="text-sm text-slate-900">Technology</div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="w-48 text-right text-sm text-slate-500 font-medium shrink-0">Người Làm việc</div>
                    <div className="text-sm text-slate-900">23</div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="w-48 text-right text-sm text-slate-500 font-medium shrink-0">Doanh thu Hàng năm</div>
                    <div className="text-sm text-slate-900">đ 200.000</div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="w-48 text-right text-sm text-slate-500 font-medium shrink-0">Điện thoại</div>
                    <div className="text-sm text-slate-900 flex items-center gap-2 w-full">
                      {selectedCustomer.phone || '555-555-5555'}
                      <span className="p-1 px-1.5 bg-green-100/80 border border-green-200 text-green-700 rounded transition-colors cursor-pointer hover:bg-green-200">
                        <Phone className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-200 p-8">
                <h2 className="text-sm font-bold text-gray-900 mb-6">Liên hệ</h2>
                <div className="flex gap-4 items-start">
                  <img 
                    src={selectedCustomer.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full border border-gray-200 shadow-sm object-cover" 
                  />
                  <div className="space-y-2 mt-0.5">
                    <h3 className="text-[15px] font-semibold text-gray-900">{selectedCustomer.name} (Sample)</h3>
                    <div className="flex items-center gap-2.5 text-[13px] font-medium text-gray-700">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      {selectedCustomer.email || 'sage-wieser@noemail.invalid'}
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] font-medium text-gray-700">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      555-555-5555
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] font-medium text-gray-700">
                      <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                      555-555-5555
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Details Marking */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-200 overflow-hidden">
                <div className="px-8 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-sm font-bold text-gray-900">Dấu chi tiết</h2>
                </div>
                <div className="p-8">
                  <h3 className="text-sm font-bold text-gray-900 mb-8">Thông tin Tài khoản</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                     
                     {/* Column 1 */}
                     <div className="space-y-6">
                       <div className="flex items-center gap-8">
                          <div className="w-40 text-right text-sm text-slate-500 font-medium shrink-0">Chủ sở hữu Tài khoản</div>
                          <div className="text-sm text-slate-900 flex-1">{ownerName}</div>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="w-40 text-right text-sm text-slate-500 font-medium shrink-0">Tài khoản Tên</div>
                          <div className="text-sm text-slate-900 flex-1">{customerName}</div>
                       </div>
                     </div>

                     {/* Column 2 */}
                     <div className="space-y-6">
                       <div className="flex items-center gap-8">
                          <div className="w-40 text-right text-sm text-slate-500 font-medium shrink-0">Thứ hạng</div>
                          <div className="text-sm text-slate-900 flex-1">—</div>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="w-40 text-right text-sm text-slate-500 font-medium shrink-0">Điện thoại</div>
                          <div className="text-sm text-slate-900 flex-1 flex items-center gap-2">
                             {selectedCustomer.phone || '555-555-5555'}
                             <span className="p-1 px-1.5 bg-green-100/80 border border-green-200 text-green-700 rounded transition-colors cursor-pointer hover:bg-green-200">
                               <Phone className="w-3 h-3" />
                             </span>
                          </div>
                       </div>
                     </div>

                  </div>
                </div>
              </div>

              {/* Section 4: Notes & Voice Dictation */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-200 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sm font-bold text-gray-900">Ghi chú (Hỗ trợ Giọng nói)</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleSaveNote()}
                      disabled={isSavingNote || selectedCustomer?.noteText === noteText}
                      className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                        selectedCustomer?.noteText === noteText 
                          ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {isSavingNote ? 'Đang lưu...' : selectedCustomer?.noteText === noteText ? 'Đã lưu' : 'Lưu ghi chú'}
                    </button>
                    <button 
                      onClick={toggleVoiceRecording}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${isRecording ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'}`}
                    >
                      <Mic size={14} className={isRecording ? 'animate-bounce' : ''} />
                      {isRecording ? 'Đang ghi âm...' : 'Ghi âm ngay'}
                    </button>
                  </div>
                </div>
                <textarea 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onBlur={() => handleSaveNote()}
                  placeholder="Nhập ghi chú hoặc nhấn nút ghi âm để tự động chuyển lời nói thành văn bản..."
                  className="w-full min-h-[150px] p-4 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y"
                />
              </div>

              {/* Section 5: Lên lịch Chăm sóc Khách hàng (Follow-up Scheduling) */}
              <div id="customer-followup-scheduler" className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-200 p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse"></span>
                      Lên lịch Chăm sóc & Follow-up
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Cài đặt ngày hẹn chăm sóc để nhận cảnh báo thông báo tự động khi sắp đến hạn.</p>
                  </div>
                  <button 
                    onClick={() => handleSaveFollowUp()}
                    disabled={isSavingFollowUp || (selectedCustomer?.nextFollowUpDate === followUpDate && selectedCustomer?.followUpNotes === followUpNotes)}
                    className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                      selectedCustomer?.nextFollowUpDate === followUpDate && selectedCustomer?.followUpNotes === followUpNotes
                        ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' 
                        : 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100'
                    }`}
                  >
                    {isSavingFollowUp ? 'Đang lưu...' : (selectedCustomer?.nextFollowUpDate === followUpDate && selectedCustomer?.followUpNotes === followUpNotes) ? 'Đã lưu lịch' : 'Cập nhật lịch hẹn'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Ngày giờ hẹn tiếp theo</label>
                    <input 
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      onBlur={(e) => handleSaveFollowUp(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-semibold"
                    />
                    {followUpDate && (
                      <p className="text-[11px] text-violet-600 font-bold mt-2">
                        Hệ thống sẽ tự động nhắc nhở bạn vào ngày này!
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Nghiệp vụ / Nội dung cần chăm sóc</label>
                    <textarea 
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      onBlur={(e) => handleSaveFollowUp(undefined, e.target.value)}
                      placeholder="VD: Gọi điện kiểm tra hành trình sử dụng, tư vấn nâng cấp lên gói Diamond, hoặc bàn giao hợp đồng..."
                      className="w-full min-h-[82px] p-3 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Interaction logger form */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-200 p-6 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      Ghi nhận Hoạt động mới nhanh
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsTpFormOpen(!isTpFormOpen)}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {isTpFormOpen ? '✖ Thu gọn form' : '➕ Tạo Mới'}
                  </button>
                </div>

                {isTpFormOpen && (
                  <div className="space-y-4 pt-1 animate-fadeIn">
                    {/* Tab Navigation for Form Type */}
                    <div className="flex border-b border-slate-100 mb-2">
                      <button
                        type="button"
                        onClick={() => setLoggerFormType('interaction')}
                        className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                          loggerFormType === 'interaction'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        📞 Điểm chạm / Cuộc gọi & Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoggerFormType('ticket')}
                        className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                          loggerFormType === 'ticket'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        ⚠️ Yêu cầu Hỗ trợ (Tickets)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoggerFormType('task')}
                        className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                          loggerFormType === 'task'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        📋 Nhiệm vụ Kanban (Tasks)
                      </button>
                    </div>

                    {/* Subform 1: Interaction */}
                    {loggerFormType === 'interaction' && (
                      <form onSubmit={handleAddTouchpoint} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tiêu đề tương tác</label>
                            <input 
                              type="text"
                              required
                              value={newTpTitle}
                              onChange={(e) => setNewTpTitle(e.target.value)}
                              placeholder="VD: Gọi điện bàn giao báo giá gia hạn"
                              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Kênh điểm chạm</label>
                              <select 
                                value={newTpChannel}
                                onChange={(e) => setNewTpChannel(e.target.value as any)}
                                className="w-full text-xs font-bold px-2 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                              >
                                <option value="phone">📞 Điện thoại (Phone)</option>
                                <option value="email">📧 Thư điện tử (Email)</option>
                                <option value="meeting">🤝 Gặp trực tiếp (Meeting)</option>
                                <option value="chat">💬 Zalo Chat (Chat)</option>
                                <option value="note">📝 Ghi chú lưu kho (Note)</option>
                                <option value="ticket">⚠️ Khiếu nại (Ticket)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Cảm xúc KH</label>
                              <select 
                                value={newTpSentiment}
                                onChange={(e) => setNewTpSentiment(e.target.value as any)}
                                className="w-full text-xs font-bold px-2 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                              >
                                <option value="Neutral">😐 Bình thường</option>
                                <option value="Happy">😊 Hài lòng / Vui vẻ</option>
                                <option value="Frustrated">😡 Thất vọng / Căng thẳng</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tóm tắt nội dung cuộc trao đổi</label>
                          <textarea 
                            required
                            value={newTpDesc}
                            onChange={(e) => setNewTpDesc(e.target.value)}
                            placeholder="VD: Gặp gỡ thảo luận về gia hạn hợp đồng. Khách cam kết sẽ thanh toán trước ngày 15/06..."
                            className="w-full min-h-[60px] p-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none resize-y focus:border-indigo-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button 
                            type="submit"
                            disabled={isAddingTp}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            {isAddingTp ? 'Đang ghi nhận...' : 'Ghi nhận Điểm chạm'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Subform 2: Ticket */}
                    {loggerFormType === 'ticket' && (
                      <form onSubmit={handleAddTicketFromTimeline} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tiêu đề Sự vụ / Yêu cầu</label>
                            <input 
                              type="text"
                              required
                              value={newTicketTitle}
                              onChange={(e) => setNewTicketTitle(e.target.value)}
                              placeholder="VD: Lỗi cấu hình tên miền hệ thống"
                              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Phân loại</label>
                              <select 
                                value={newTicketCategory}
                                onChange={(e) => setNewTicketCategory(e.target.value as any)}
                                className="w-full text-xs font-bold px-2 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                              >
                                <option value="technical">🛠️ Kỹ thuật</option>
                                <option value="billing">💳 Hoá đơn</option>
                                <option value="onboarding">🚀 Đào tạo</option>
                                <option value="feature_request">💡 Tính năng</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Độ ưu tiên</label>
                              <select 
                                value={newTicketPriority}
                                onChange={(e) => setNewTicketPriority(e.target.value as any)}
                                className="w-full text-xs font-bold px-2 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                              >
                                <option value="low">Thấp (Low)</option>
                                <option value="medium">Trung bình</option>
                                <option value="high">Cao (High)</option>
                                <option value="urgent">Gấp (Urgent)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Trạng thái</label>
                              <select 
                                value={newTicketStatus}
                                onChange={(e) => setNewTicketStatus(e.target.value as any)}
                                className="w-full text-xs font-bold px-2 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                              >
                                <option value="new">Mới (New)</option>
                                <option value="open">Đang xử lý</option>
                                <option value="pending">Chờ phản hồi</option>
                                <option value="solved">Đã xử lý</option>
                                <option value="closed">Đóng lại</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Mô tả chi tiết sự vụ</label>
                          <textarea 
                            required
                            value={newTicketDesc}
                            onChange={(e) => setNewTicketDesc(e.target.value)}
                            placeholder="Mô tả sự cố hoặc yêu cầu từ phía khách hàng để chuyển kỹ thuật..."
                            className="w-full min-h-[60px] p-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none resize-y focus:border-indigo-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button 
                            type="submit"
                            disabled={isAddingTicket}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            {isAddingTicket ? 'Đang tạo...' : 'Tạo Ticket hỗ trợ'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Subform 3: Task */}
                    {loggerFormType === 'task' && (
                      <form onSubmit={handleAddTaskFromTimeline} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tên công việc (Task)</label>
                            <input 
                              type="text"
                              required
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              placeholder="VD: Thiết kế sơ đồ giải pháp triển khai"
                              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Hạn định (Due Date)</label>
                              <input 
                                type="date"
                                required
                                value={newTaskDueDate}
                                onChange={(e) => setNewTaskDueDate(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Độ ưu tiên</label>
                              <select 
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                                className="w-full text-xs font-bold px-2 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                              >
                                <option value="Low">Thấp (Low)</option>
                                <option value="Medium">Trung bình</option>
                                <option value="High">Cao (High)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Chi tiết công việc cần làm</label>
                          <textarea 
                            required
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            placeholder="Mô tả các hành động bắt buộc để hoàn thành nhiệm vụ này..."
                            className="w-full min-h-[60px] p-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none resize-y focus:border-indigo-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button 
                            type="submit"
                            disabled={isAddingTask}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            {isAddingTask ? 'Đang tạo...' : 'Tạo Nhiệm vụ'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Chronological Activity Timeline Container */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-200 p-6 md:p-8 text-left">
                {/* Header with Search & Selector Filters */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <List size={16} className="text-indigo-600" />
                      Lịch sử Hành trình & Hoạt động Khách hàng (Chronological Feed)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Dòng thời gian tổng hợp toàn bộ tương tác thực tế, sự vụ kỹ thuật, nhiệm vụ triển khai, và ghi chú từ trước đến nay.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search Field */}
                    <div className="relative w-full sm:w-auto sm:min-w-[210px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm hành trình..."
                        value={feedSearchTerm}
                        onChange={(e) => setFeedSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-700"
                      />
                      {feedSearchTerm && (
                        <button 
                          onClick={() => setFeedSearchTerm('')} 
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter categories tabs selector */}
                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200/60 overflow-x-auto text-[11px] font-bold">
                      <button 
                        type="button"
                        onClick={() => setFeedTypeFilter('all')}
                        className={`px-3 py-1 rounded-md transition-all ${feedTypeFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Tất cả
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFeedTypeFilter('interaction')}
                        className={`px-3 py-1 rounded-md transition-all ${feedTypeFilter === 'interaction' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        📞 Tương tác
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFeedTypeFilter('ticket')}
                        className={`px-3 py-1 rounded-md transition-all ${feedTypeFilter === 'ticket' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        ⚠️ Sự vụ
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFeedTypeFilter('task')}
                        className={`px-3 py-1 rounded-md transition-all ${feedTypeFilter === 'task' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        📋 Nhiệm vụ
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFeedTypeFilter('note')}
                        className={`px-3 py-1 rounded-md transition-all ${feedTypeFilter === 'note' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        📝 Ghi chú/Hẹn
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main chronological sorting computation element */}
                {(() => {
                  const compiledFeed = getCompiledFeed();
                  if (compiledFeed.length === 0) {
                    return (
                      <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="max-w-xs mx-auto">
                          <LayoutPanelLeft size={32} className="text-slate-300 mx-auto mb-3" />
                          <p className="text-xs text-slate-500 font-extrabold mb-1">Không tìm thấy bản ghi hoạt động nào.</p>
                          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                            {feedSearchTerm 
                              ? 'Không tìm thấy kết quả phù hợp với từ khoá tìm kiếm của bạn. Hãy thử thay đổi dung lượng tìm kiếm.' 
                              : `Hệ thống chưa ghi nhận tương tác, yêu cầu hỗ trợ (tickets) hay công việc liên quan nào cho loại danh mục đã chọn.`}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="relative pl-7 border-l border-slate-100 space-y-9">
                      {compiledFeed.map((tp) => {
                        const IconComp = getChannelIcon(tp.channel || tp.type);
                        const styleClass = getChannelColor(tp.channel || tp.type);
                        
                        return (
                          <div key={tp.id} className="relative transition-all hover:translate-x-1 duration-200 group">
                            {/* Dot Badge Circle on axis */}
                            <div className={`absolute -left-[41px] top-0 p-1.5 rounded-full bg-white border shadow-xs transition-transform group-hover:scale-105 duration-200 ${styleClass}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>

                            <div className="space-y-1.5 pl-2">
                              {/* Headline header row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-dashed border-slate-100 pb-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Badge indicator for category type */}
                                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    tp.type === 'ticket' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                    tp.type === 'task' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    tp.type === 'follow_up' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                                    tp.channel === 'note' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                    'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  }`}>
                                    {tp.type === 'ticket' ? '⚠️ SỰ VỤ' :
                                     tp.type === 'task' ? '📋 NHIỆM VỤ' :
                                     tp.type === 'follow_up' ? '⏰ LỊCH HẸN' :
                                     tp.channel === 'note' ? '📝 GHI CHÚ' :
                                     '📞 ĐIỂM CHẠM'}
                                  </span>

                                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-[13px] tracking-tight">{tp.title}</h4>
                                  
                                  {/* Sentiment for Touchpoints */}
                                  {tp.type === 'interaction' && tp.sentiment && (
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                      tp.sentiment === 'Happy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      tp.sentiment === 'Frustrated' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                      'bg-slate-50 text-slate-600 border border-slate-200'
                                    }`}>
                                      {tp.sentiment === 'Happy' ? '😊 Khách vui' : tp.sentiment === 'Frustrated' ? '😡 Khách khẩn' : '😐 Thường'}
                                    </span>
                                  )}

                                  {/* Status for Tickets and Tasks */}
                                  {tp.status && (
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                      tp.status === 'solved' || tp.status === 'closed' || tp.status === 'Completed'
                                        ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                                        : tp.status === 'new' || tp.status === 'To Do'
                                        ? 'bg-blue-100/80 text-blue-800 border border-blue-200'
                                        : 'bg-amber-100/80 text-amber-800 border border-amber-200'
                                    }`}>
                                      {tp.status === 'new' ? 'Mới' :
                                       tp.status === 'open' ? 'Đang xử lý' :
                                       tp.status === 'pending' ? 'Đang chờ' :
                                       tp.status === 'solved' ? 'Đã giải quyết' :
                                       tp.status === 'closed' ? 'Đã đóng' : tp.status}
                                    </span>
                                  )}

                                  {/* Priority tag for tasks / tickets */}
                                  {tp.priority && (
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                      tp.priority === 'High' || tp.priority === 'high' || tp.priority === 'urgent'
                                        ? 'bg-red-50 text-red-700 border border-red-100'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                                    }`}>
                                      {tp.priority === 'urgent' ? 'KHẨN CẤP' :
                                       tp.priority === 'high' || tp.priority === 'High' ? 'CAO' :
                                       tp.priority === 'medium' || tp.priority === 'Medium' ? 'TRUNG BÌNH' : 'THẤP'}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                  <Clock size={11} className="text-slate-400 shrink-0" />
                                  <span>
                                    {new Date(tp.timestamp).toLocaleString('vi-VN', {
                                      hour: '2-digit', minute: '2-digit',
                                      day: '2-digit', month: '2-digit', year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Body Description */}
                              <p className="text-xs font-semibold text-slate-600 max-w-4xl leading-relaxed whitespace-pre-wrap pl-1">
                                {tp.description}
                              </p>
                              
                              {/* Extra information like due date or ticket category */}
                              {(tp.dueDate || tp.category) && (
                                <div className="flex items-center gap-4 mt-2 text-[10px] font-extrabold text-slate-400 pl-1">
                                  {tp.dueDate && (
                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-500">
                                      📅 Hạn hoàn thành: <span className="text-slate-700 font-extrabold">{tp.dueDate}</span>
                                    </span>
                                  )}
                                  {tp.category && (
                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-500">
                                      💡 Phân loại hỗ trợ: <span className="text-slate-700 font-extrabold">
                                        {tp.category === 'technical' ? 'Kỹ thuật' :
                                         tp.category === 'billing' ? 'Thanh toán' :
                                         tp.category === 'onboarding' ? 'Hướng dẫn' : 'Tính năng'}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

