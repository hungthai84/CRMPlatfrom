import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight, 
  Mail, Phone, Smartphone, Clock, Hexagon, LayoutPanelLeft, Search, Filter, Video, X, Mic
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';
import { generateDemoCustomers } from '../lib/generateDemoData';

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
  
  const [isRecording, setIsRecording] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleSaveNote = async (textToSave?: string) => {
    if (!selectedCustomer || !customerId) return;
    setIsSavingNote(true);
    try {
      await updateDoc(doc(db, 'customers', customerId), { 
        noteText: textToSave !== undefined ? textToSave : noteText 
      });
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
      if (!currentTags.includes(newTag.trim())) {
        const updatedTags = [...currentTags, newTag.trim()];
        await updateDoc(doc(db, 'customers', customerId), { tags: updatedTags });
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
    
    // Listen to specific customer document
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const docRef = doc(db, 'customers', customerId);
      let initialLoaded = false;
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
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
      return () => unsubscribe();
    });
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

