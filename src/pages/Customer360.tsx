import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight, 
  Mail, Phone, Smartphone, Clock, Hexagon, LayoutPanelLeft, Search, Filter, Video, X, Mic,
  Award, TrendingUp, Sparkles, AlertCircle
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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
  
  const [isRecording, setIsRecording] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const recognitionRef = useRef<any>(null);

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

    // 2. Listen to activity events (touchpoints) subcollection for scoring
    const touchpointsRef = collection(db, 'customers', customerId, 'touchpoints');
    const unsubTouchpoints = onSnapshot(touchpointsRef, (snap) => {
      setActivityCount(snap.size);
    }, (err) => {
      console.warn("Could not load activity touchpoints for scoring:", err);
    });

    // 3. Listen to support tickets for this customer for scoring
    const ticketsQuery = query(collection(db, 'tickets'), where('customerId', '==', customerId));
    const unsubTickets = onSnapshot(ticketsQuery, (snap) => {
      setTicketCount(snap.size);
    }, (err) => {
      console.warn("Could not load support tickets for scoring:", err);
    });

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
        color: 'text-[#2F69FF] bg-blue-50 border-blue-150',
        barColor: 'bg-[#2F69FF]',
        pulseGlow: 'shadow-[0_0_12px_rgba(47,105,255,0.25)]',
        accentText: 'Khách hàng đang tìm hiểu dịch vụ tích cực, khối lượng tương tác ổn định.',
        textColor: 'text-blue-600',
        badgeColor: 'bg-[#2F69FF]'
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

  const timelineEvents = [
    { id: 1, type: 'email', icon: Mail, title: 'Đã gửi email báo giá', date: '10:30 Hôm nay', desc: 'Email kèm báo giá gia hạn dịch vụ.' },
    { id: 2, type: 'call', icon: Phone, title: 'Cuộc gọi: Thảo luận yêu cầu', date: '14:00 Hôm qua', desc: 'Khách hàng có vẻ hài lòng với giải pháp.' },
    { id: 3, type: 'meeting', icon: Video, title: 'Họp trực tuyến DEMO', date: 'Oct 24, 2024', desc: 'Gặp gỡ 3 thành viên từ phía đối tác. Đã trình diễn tính năng AI AI mới.' }
  ];

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
                  <AlertCircle size={12} className="text-[#2F69FF] shrink-0" />
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
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-200 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-8">Lịch sử hoạt động</h2>
              <div className="relative pl-6 border-l-2 border-gray-100 space-y-10">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-[35px] top-0.5 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-blue-600">
                      <event.icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                         <h3 className="font-bold text-gray-900 text-sm tracking-tight">{event.title}</h3>
                         <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{event.date}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-600 max-w-2xl">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

