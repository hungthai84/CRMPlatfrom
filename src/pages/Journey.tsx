import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Compass, 
  Eye, 
  Heart, 
  Smile, 
  Flame, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Plus, 
  Search, 
  Sparkles, 
  Filter, 
  Activity, 
  FileText, 
  Mail, 
  Phone, 
  MessageSquare, 
  Video, 
  AlertTriangle, 
  ChevronRight, 
  PlayCircle,
  TrendingUp,
  Award,
  Zap,
  RefreshCw,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer, Touchpoint } from '../types';
import { generateDemoCustomers } from '../lib/generateDemoData';

const STAGES = [
  { id: 'Awareness', label: 'Nhận thức', desc: 'Tìm hiểu thương hiệu', color: 'bg-sky-500', text: 'text-sky-600', hover: 'hover:bg-sky-50' },
  { id: 'Consideration', label: 'Cân nhắc', desc: 'Đánh giá giải pháp', color: 'bg-indigo-500', text: 'text-indigo-600', hover: 'hover:bg-indigo-50' },
  { id: 'Purchase', label: 'Mua hàng', desc: 'Ký kết & Thanh toán', color: 'bg-emerald-500', text: 'text-emerald-600', hover: 'hover:bg-emerald-50' },
  { id: 'Retention', label: 'Duy trì', desc: 'Chăm sóc & Khắc phục', color: 'bg-amber-500', text: 'text-amber-600', hover: 'hover:bg-amber-50' },
  { id: 'Loyalty', label: 'Thân thiết', desc: 'Đại sứ thương hiệu', color: 'bg-rose-500', text: 'text-rose-600', hover: 'hover:bg-rose-50' }
];

export function Journey() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  
  const [activeViewTab, setActiveViewTab] = useState<'funnel' | 'timeline'>('timeline');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Form states for adding new touchpoint
  const [tpTitle, setTpTitle] = useState('');
  const [tpDesc, setTpDesc] = useState('');
  const [tpChannel, setTpChannel] = useState<'email' | 'phone' | 'meeting' | 'chat' | 'website' | 'system' | 'zalo' | 'ticket'>('chat');
  const [tpSentiment, setTpSentiment] = useState<'Happy' | 'Neutral' | 'Frustrated'>('Happy');
  const [addingTouchpoint, setAddingTouchpoint] = useState(false);

  // Automated Simulation States
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simLog, setSimLog] = useState<string[]>([]);

  // 1. Fetch Customers
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = collection(db, 'customers');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      
      const filtered = data.filter(c => !c.ownerId || c.ownerId === user.uid);
      setCustomers(filtered);
      
      if (filtered.length > 0) {
        // Default to first customer if nothing selected yet or selected id is absent
        if (!selectedCustomerId || !filtered.some(c => c.id === selectedCustomerId)) {
          setSelectedCustomerId(filtered[0].id);
        }
      } else {
        setSelectedCustomer(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Fetch Touchpoints & Update Selected Customer when customer selection changes
  useEffect(() => {
    if (!selectedCustomerId) {
      setTouchpoints([]);
      setSelectedCustomer(null);
      return;
    }

    const currentCust = customers.find(c => c.id === selectedCustomerId);
    if (currentCust) {
      setSelectedCustomer(currentCust);
    }

    // Subscribe to touchpoints
    const tpRef = collection(db, 'customers', selectedCustomerId, 'touchpoints');
    const unsubscribe = onSnapshot(tpRef, (snapshot) => {
      const tps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Touchpoint[];
      // Sort touchpoints chronologically descending
      tps.sort((a, b) => b.timestamp - a.timestamp);
      setTouchpoints(tps);
    }, (err) => {
      console.error(err);
    });

    return () => unsubscribe();
  }, [selectedCustomerId, customers]);

  // Seed trigger
  const triggerSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await generateDemoCustomers(user.uid);
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  // Helper channel translation/icons
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail size={15} className="text-blue-500" />;
      case 'phone': return <Phone size={15} className="text-teal-500" />;
      case 'meeting': return <Video size={15} className="text-purple-500" />;
      case 'chat': return <MessageSquare size={15} className="text-green-500" />;
      case 'website': return <Compass size={15} className="text-sky-500" />;
      case 'system': return <Activity size={15} className="text-indigo-500" />;
      case 'zalo': return <Sparkles size={15} className="text-indigo-400" />;
      case 'ticket': return <AlertTriangle size={15} className="text-red-500" />;
      default: return <FileText size={15} className="text-slate-500" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'email': return 'Email Auto-Marketing';
      case 'phone': return 'Cuộc gọi Tư vấn';
      case 'meeting': return 'Họp trực tiếp (Off/On)';
      case 'chat': return 'Zalo / Chatbox';
      case 'website': return 'Website Portal';
      case 'system': return 'Hệ thống tự động';
      case 'zalo': return 'Zalo Broadcast';
      case 'ticket': return 'Yêu cầu hỗ trợ (Ticket)';
      default: return 'Tương tác khác';
    }
  };

  // Get sentiment face/color
  const getSentimentDetails = (sentiment?: string) => {
    switch (sentiment) {
      case 'Happy': return { label: 'Tích cực', class: 'bg-emerald-50 text-emerald-700 border-emerald-100', emoji: '😊' };
      case 'Neutral': return { label: 'Bình thường', class: 'bg-slate-50 text-slate-700 border-slate-100', emoji: '😐' };
      case 'Frustrated': return { label: 'Bực bội', class: 'bg-rose-50 text-rose-700 border-rose-100', emoji: '😠' };
      default: return { label: 'Mới/Chưa đánh giá', class: 'bg-gray-50 text-gray-500 border-gray-100', emoji: '✨' };
    }
  };

  // Add Touchpoint live
  const handleAddTouchpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !tpTitle.trim()) return;
    setAddingTouchpoint(true);
    try {
      const tpRef = collection(db, 'customers', selectedCustomerId, 'touchpoints');
      await addDoc(tpRef, {
        customerId: selectedCustomerId,
        title: tpTitle,
        description: tpDesc,
        channel: tpChannel,
        sentiment: tpSentiment,
        timestamp: Date.now()
      });
      setTpTitle('');
      setTpDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTouchpoint(false);
    }
  };

  // Advance customer stage
  const handleAdvanceStage = async (stageId: any) => {
    if (!selectedCustomerId) return;
    try {
      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        journeyStage: stageId
      });
    } catch (err) {
      console.error('Error shifting stage:', err);
    }
  };

  // Update customer sentiment
  const handleUpdateSentiment = async (sentimentId: any) => {
    if (!selectedCustomerId) return;
    try {
      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        journeySentiment: sentimentId
      });
    } catch (err) {
      console.error('Error updating sentiment:', err);
    }
  };

  // AUTOMATED DEMO SIMULATION
  // Automatically runs a story mapping customer progress with real-time Firestore sync
  const startSimulation = async () => {
    if (!selectedCustomer) return;
    setIsSimulating(true);
    setSimLog([]);
    setSimStep(1);

    const logMessage = (msg: string) => {
      setSimLog(prev => [...prev, `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}`]);
    };

    try {
      // Step 1: Awareness
      logMessage(`Khởi chạy Giả lập Hành trình Khách hàng cho: ${selectedCustomer.name}`);
      logMessage("Step 1/5: Khách hàng truy cập Landing Page qua quảng cáo.");
      await updateDoc(doc(db, 'customers', selectedCustomer.id), {
        journeyStage: 'Awareness',
        journeySentiment: 'Neutral'
      });
      await addDoc(collection(db, 'customers', selectedCustomer.id, 'touchpoints'), {
        customerId: selectedCustomer.id,
        title: 'Nhấp chiến dịch mùa hè và duyệt Website',
        description: 'Mô phỏng truy cập tìm kiếm giải pháp Cloud CRM, duyệt qua 3 trang tài liệu.',
        channel: 'website',
        sentiment: 'Neutral',
        timestamp: Date.now()
      });
      setSimStep(2);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 2: Consideration
      logMessage("Step 2/5: Đăng ký trải nghiệm & Chuyên viên gọi tư vấn.");
      await updateDoc(doc(db, 'customers', selectedCustomer.id), {
        journeyStage: 'Consideration',
        journeySentiment: 'Happy'
      });
      await addDoc(collection(db, 'customers', selectedCustomer.id, 'touchpoints'), {
        customerId: selectedCustomer.id,
        title: 'Mộc tư vấn qua điện thoại (Giả lập)',
        description: 'Khách hàng chia sẻ nhu cầu, đánh giá giải pháp PowerCRM. Phản ứng rất khả quan.',
        channel: 'phone',
        sentiment: 'Happy',
        timestamp: Date.now()
      });
      setSimStep(3);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Purchase
      logMessage("Step 3/5: Tiến hành đàm phán hợp đồng & ký kết.");
      await updateDoc(doc(db, 'customers', selectedCustomer.id), {
        journeyStage: 'Purchase',
        journeySentiment: 'Happy'
      });
      await addDoc(collection(db, 'customers', selectedCustomer.id, 'touchpoints'), {
        customerId: selectedCustomer.id,
        title: 'Ký hợp đồng dịch vụ SLA thành công (Giả lập)',
        description: 'Chính thức phê duyệt dịch vụ tích hợp AI và bật tính năng voice notes.',
        channel: 'meeting',
        sentiment: 'Happy',
        timestamp: Date.now()
      });
      setSimStep(4);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 4: Retention
      logMessage("Step 4/5: Khách hàng phản hồi về lỗi hỗ trợ đồng bộ.");
      await updateDoc(doc(db, 'customers', selectedCustomer.id), {
        journeyStage: 'Retention',
        journeySentiment: 'Frustrated'
      });
      await addDoc(collection(db, 'customers', selectedCustomer.id, 'touchpoints'), {
        customerId: selectedCustomer.id,
        title: 'Báo lỗi hệ thống đồng bộ tệp PDF (Giả lập)',
        description: 'Tải tài liệu bị chậm trễ trong 5 phút. Khách có phần bực bội nhưng được xử lý tận tâm.',
        channel: 'ticket',
        sentiment: 'Frustrated',
        timestamp: Date.now()
      });
      setSimStep(5);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 5: Loyalty
      logMessage("Step 5/5: Hỗ trợ hoàn tất xuất sắc, Khách nhận điểm thưởng Thân thiết.");
      await updateDoc(doc(db, 'customers', selectedCustomer.id), {
        journeyStage: 'Loyalty',
        journeySentiment: 'Happy'
      });
      await addDoc(collection(db, 'customers', selectedCustomer.id, 'touchpoints'), {
        customerId: selectedCustomer.id,
        title: 'Đạt danh hiệu Thành viên Vàng (Giả lập)',
        description: 'Khách gửi đánh giá 5 sao kèm phản hồi nâng cấp thành công. Tặng 5,000 điểm Loyalty.',
        channel: 'system',
        sentiment: 'Happy',
        timestamp: Date.now()
      });
      logMessage("✓ Hoàn tất giả lập thành công! Hãy xem dòng sự kiện trực tiếp cập nhật bên dưới.");
    } catch (err) {
      console.error(err);
      logMessage("✖ Xảy ra lỗi gián đoạn giả lập.");
    } finally {
      setIsSimulating(false);
      setSimStep(0);
    }
  };

  // Compute aggregate statistics for funnel view
  const getStageCount = (stageId: string) => {
    return customers.filter(c => c.journeyStage === stageId).length;
  };

  const getStagePercent = (stageId: string) => {
    if (customers.length === 0) return 0;
    return Math.round((getStageCount(stageId) / customers.length) * 100);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative p-6 md:p-8 overflow-y-auto no-scrollbar">
      {/* Header section with tab switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Map className="text-[#2F69FF] shrink-0" size={30} />
            Hành Trình Khách Hàng (Customer Journey)
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-semibold">
            Theo dõi, phân tích và tối ưu hóa các điểm chạm tương tác từ khách hàng tiềm năng đến khách hàng thân thiết.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex p-1 bg-slate-250 border border-slate-200 rounded-[10px] self-start md:self-center">
          <button
            onClick={() => setActiveViewTab('timeline')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeViewTab === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đường đi Cá nhân
          </button>
          <button
            onClick={() => setActiveViewTab('funnel')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeViewTab === 'funnel' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Phễu chuyển đổi & Thống kê
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2F69FF] mr-3"></div>
          <span className="text-slate-500 font-semibold text-sm">Đang tải dữ liệu hành trình...</span>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
            <Compass size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Chưa có dữ liệu Khách hàng</h2>
          <p className="text-slate-500 text-center max-w-sm text-sm mb-6 font-medium">
            Hãy kích hoạt "Khởi tạo dữ liệu mẫu CRM" để đồng bộ tự động danh sách khách hàng và lịch sử hành trình điểm chạm.
          </p>
          <button 
            onClick={triggerSeed}
            disabled={seeding}
            className="bg-[#2F69FF] shadow-md shadow-[#2F69FF]/20 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#1a55eb] transition-all flex items-center gap-2 cursor-pointer"
          >
            {seeding ? 'Đang thiết lập dữ liệu...' : 'Khởi tạo dữ liệu mẫu ngay'}
          </button>
        </div>
      ) : activeViewTab === 'timeline' ? (
        // TIMELINE AND INDIVIDUAL VISUALIZATION VIEW
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* CUSTOMER PICKER & CONTROL CENTER */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Compass className="text-blue-500" size={16} /> Chọn Khách hàng 360
              </h2>

              <div className="relative mb-6">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - ({c.tier || 'Member'}) - {c.segment || 'Retail'}
                    </option>
                  ))}
                </select>
                <ChevronRight size={16} className="absolute right-3 top-3.5 text-slate-400 rotate-90 pointer-events-none" />
              </div>

              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-sm shadow-inner shrink-0">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{selectedCustomer.name}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold truncate">{selectedCustomer.email}</p>
                    </div>
                  </div>

                  {/* Customer Sentiment Status Card */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cảm xúc hiện tại</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${getSentimentDetails(selectedCustomer.journeySentiment).class}`}>
                        <span>{getSentimentDetails(selectedCustomer.journeySentiment).emoji}</span>
                        {getSentimentDetails(selectedCustomer.journeySentiment).label}
                      </span>
                    </div>
                    
                    {/* Fast Sentiment Changer */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {(['Happy', 'Neutral', 'Frustrated'] as const).map((sent) => (
                        <button
                          key={sent}
                          onClick={() => handleUpdateSentiment(sent)}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            selectedCustomer.journeySentiment === sent 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs">
                            {sent === 'Happy' ? '😊' : sent === 'Neutral' ? '😐' : '😠'}
                          </span>
                          {sent === 'Happy' ? 'Khỏe/Vui' : sent === 'Neutral' ? 'Thường' : 'Bực bội'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stage Changer Stepper directly clickable */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cập nhật cột mốc hành trình</span>
                    <div className="space-y-1.5">
                      {STAGES.map((stg) => {
                        const isCurrent = selectedCustomer.journeyStage === stg.id;
                        return (
                          <button
                            key={stg.id}
                            onClick={() => handleAdvanceStage(stg.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isCurrent 
                                ? `${stg.color} text-white border-transparent shadow-sm font-bold`
                                : `bg-white border-slate-200 text-slate-600 ${stg.hover}`
                            }`}
                          >
                            <div>
                              <p className={`text-xs font-bold leading-none ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                                {stg.label}
                              </p>
                              <span className={`text-[10px] ${isCurrent ? 'text-white/80' : 'text-slate-400'} font-semibold mt-0.5 block`}>
                                {stg.desc}
                              </span>
                            </div>
                            {isCurrent && <CheckCircle2 size={14} className="text-white fill-none stroke-current" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* AUTOMATED SIMULATOR PANEL */}
            <section className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl border border-indigo-900/40 p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                <Sparkles size={60} className="text-indigo-400" />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <PlayCircle className="text-indigo-400" size={20} />
                  <h3 className="font-extrabold text-sm tracking-tight text-white uppercase">
                    Trình Giả Lập / Bản Demo (Simulator)
                  </h3>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Hãy nhấp bắt đầu để kích hoạt chu kỳ bám đuổi của khách hàng. Trình giả lập sẽ tự tạo và đẩy các cột mốc tương tác thực tế lên Firestore trong thời gian thực.
                </p>

                {isSimulating ? (
                  <div className="bg-black/35 border border-white/5 rounded-xl p-3 min-h-[140px] max-h-[220px] overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-1.5 no-scrollbar">
                    {simLog.map((log, i) => (
                      <div key={i} className="leading-normal pb-1 border-b border-white/5 last:border-0">
                        {log}
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold animate-pulse pt-2 shrink-0 justify-center">
                      <RefreshCw size={12} className="animate-spin" />
                      Trình giả lập đang đồng bộ... (Bước {simStep}/5)
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startSimulation}
                    disabled={!selectedCustomer}
                    className="w-full bg-[#2F69FF] hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap size={14} /> Kích hoạt Giả lập (Bản Demo)
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* DYNAMIC JOURNEY TIMELINE VIEW */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCustomer && (
              <>
                {/* Horizontal progress/milestone indicator */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-6 flex items-center justify-between">
                    <span>Đường tiến trình cột mốc (Pipeline Path)</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md lowercase">
                      nhấp mốc bên trái để đổi trực tiếp
                    </span>
                  </h2>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 hidden md:block z-0" />
                    {STAGES.map((stg, i) => {
                      const isCompleted = STAGES.findIndex(s => s.id === selectedCustomer.journeyStage) >= i;
                      const isCurrent = selectedCustomer.journeyStage === stg.id;
                      return (
                        <div key={stg.id} className="flex md:flex-col items-center gap-3 md:gap-2 relative z-10 flex-1">
                          <button
                            onClick={() => handleAdvanceStage(stg.id)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border cursor-pointer transition-all shrink-0 ${
                              isCurrent 
                                ? `${stg.color} text-white border-transparent ring-4 ring-offset-2 ring-blue-500 scale-110 shadow-md`
                                : isCompleted
                                  ? `${stg.color} text-white border-transparent`
                                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {isCompleted && !isCurrent ? '✓' : i + 1}
                          </button>
                          <div className="md:text-center min-w-0">
                            <span className={`text-[11px] font-extrabold leading-tight block ${isCurrent ? 'text-slate-900 font-black' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                              {stg.label}
                            </span>
                            <p className="text-[9px] text-slate-400 font-semibold truncate max-w-[120px] hidden md:block">
                              {stg.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vertical Interactive timeline */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="text-blue-500" size={16} /> Lịch sử điểm chạm ({touchpoints.length})
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 font-semibold">Tự động đồng bộ các lượt nhấp, email mở, và tư vấn.</p>
                    </div>

                    <p className="text-xs text-slate-400 font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                      ID: {selectedCustomer.phone}
                    </p>
                  </div>

                  {/* Add touchpoint inline form expansion */}
                  <form onSubmit={handleAddTouchpoint} className="bg-slate-50/70 border border-slate-150 rounded-xl p-4 md:p-5 mb-8 space-y-4">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <PlusCircle size={14} className="text-[#2F69FF]" /> Ghi nhận điểm chạm mới thủ công
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                      <div className="md:col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Tiêu đề điểm chạm (ví dụ: Gửi hợp đồng chính thức)..."
                          value={tpTitle}
                          onChange={(e) => setTpTitle(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all text-slate-850"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <select
                          value={tpChannel}
                          onChange={(e: any) => setTpChannel(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-slate-700 cursor-pointer"
                        >
                          <option value="chat">Zalo / Chatbox</option>
                          <option value="phone">Cuộc gọi tư vấn</option>
                          <option value="email">Email Campaign</option>
                          <option value="meeting">Họp trực tiếp</option>
                          <option value="website">Website Portal</option>
                          <option value="ticket">Dịch vụ Ticket</option>
                          <option value="system">Sự kiện Hệ thống</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <select
                          value={tpSentiment}
                          onChange={(e: any) => setTpSentiment(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all text-slate-750 cursor-pointer"
                        >
                          <option value="Happy">😊 Vui vẻ</option>
                          <option value="Neutral">😐 Bình thường</option>
                          <option value="Frustrated">😠 Bực bội</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          disabled={addingTouchpoint}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus size={14} /> Thêm
                        </button>
                      </div>
                    </div>

                    <div>
                      <textarea
                        placeholder="Mô tả tóm tắt nội dung tương tác..."
                        value={tpDesc}
                        onChange={(e) => setTpDesc(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all h-16 resize-none text-slate-800"
                      />
                    </div>
                  </form>

                  {/* Vertical Timeline */}
                  <div className="relative border-l border-slate-150 pl-6 ml-3.5 space-y-8">
                    {touchpoints.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-400 font-bold">Chưa có điểm chạm nào được đồng bộ.</p>
                        <span className="text-[10px] text-slate-400 font-medium">Hãy sử dụng Form trên hoặc Trình giả lập để thêm tương tác.</span>
                      </div>
                    ) : (
                      touchpoints.map((tp) => {
                        const sent = getSentimentDetails(tp.sentiment);
                        return (
                          <div key={tp.id} className="relative group">
                            {/* Dot indicator with channel icon */}
                            <div className="absolute -left-[37px] top-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm z-15 shrink-0 group-hover:scale-110 group-hover:border-blue-500 transition-all">
                              {getChannelIcon(tp.channel)}
                            </div>

                            {/* Message box */}
                            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150 hover:border-slate-200 p-4 rounded-xl transition-all shadow-[0_2px_12px_rgba(0,0,0,0.01)] relative">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-dashed border-slate-200">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-xs text-slate-900">{tp.title}</h4>
                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                                    {getChannelLabel(tp.channel)}
                                  </span>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border self-start sm:self-center ${sent.class}`}>
                                  {sent.emoji} {sent.label}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-2">
                                {tp.description}
                              </p>

                              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                                <Clock size={11} />
                                {new Date(tp.timestamp).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // AGGREGATE COHORT & FUNNEL STATS VIEW WITH COMPACT CHARTS
        <div className="space-y-8 animate-fade-in">
          {/* Top row insights cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STAGES.map((stg, idx) => {
              const count = getStageCount(stg.id);
              const percent = getStagePercent(stg.id);
              return (
                <div key={stg.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cột mốc {idx + 1}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${stg.color}`} />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">{stg.label}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stg.desc}</p>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{count} <span className="text-xs text-slate-400 font-bold">khách</span></span>
                    <span className={`text-xs font-bold ${stg.text}`}>{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Large Funnel conversion block */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <TrendingUp className="text-[#2F69FF]" size={16} /> Bản đồ Phễu tương tác Hệ thống
            </h2>
            <p className="text-xs text-slate-400 mb-8 font-semibold">
              Biểu diễn tỷ lệ hao hụt rò rỉ khách hàng qua các khâu từ ban đầu đến thành viên Đại sứ thương hiệu liên kết.
            </p>

            <div className="space-y-6 max-w-3xl mx-auto">
              {STAGES.map((stg, i) => {
                const count = getStageCount(stg.id);
                const percent = getStagePercent(stg.id);
                // Simulated leakage or conversion rates between steps
                const prevStage = STAGES[i - 1];
                const dropRate = prevStage ? Math.round(100 - (count / (getStageCount(prevStage.id) || 1)) * 100) : 0;
                
                return (
                  <div key={stg.id} className="space-y-2">
                    {/* Dropout indicator ribbon */}
                    {prevStage && (
                      <div className="flex justify-center my-1.5">
                        <div className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                          <span>↓ Hụt</span> {dropRate}% (Tỷ lệ rớt phễu)
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* Name area */}
                      <div className="w-24 sm:w-28 shrink-0 text-right">
                        <span className="text-xs font-bold text-slate-800">{stg.label}</span>
                        <p className="text-[9px] text-slate-400 font-semibold">{count} khách</p>
                      </div>

                      {/* Bar indicator with dynamic width */}
                      <div className="flex-1 bg-slate-100 rounded-xl h-6 overflow-hidden relative border border-slate-150">
                        <div 
                          style={{ width: `${percent || 5}%` }}
                          className={`h-full ${stg.color} rounded-r-lg shadow-sm transition-all duration-1000 flex items-center px-3.5`}
                        >
                          <span className="text-[10px] font-bold text-white tracking-wide">
                            {percent}%
                          </span>
                        </div>
                      </div>

                      {/* Goal indicator */}
                      <div className="w-14 text-slate-500 text-[10px] font-extrabold shrink-0">
                        {count > 0 ? '✓ Hoạt động' : 'Trực quan'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cohort analysis card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" />
                Bộ giải pháp nâng cao tỷ lệ giữ chân (Loyalty Uplift)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Bằng việc tự động hóa gán tag <span className="bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded border border-emerald-100">VIP</span> và <span className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded border border-blue-100">Doanh nghiệp</span> khi khách tiến vào giai đoạn **Duy trì / Thân thiết**, hệ thống đo đạc thành công chỉ số Churn Risk sụt giảm tới <span className="text-emerald-600 font-extrabold">24%</span> vào Q2/2026.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-450">
                <span>Tham chiếu Loyalty:</span>
                <span className="text-blue-600">Trang thành viên Thượng lưu</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[#2F69FF]" />
                Đồng bộ phím tắt & Đánh giá Ghi âm
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Sử dụng Voice Notes (Web Speech API) trực tiếp tại trang Khách hàng 360 để biến đổi phản hồi bàn giao thành tệp phím tắt. Những tệp âm ghi chú này lưu trữ trực tiếp vào điểm chạm tương ứng của lộ trình hỗ trợ.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-450">
                <span>Tham chiếu phím tắt:</span>
                <span className="text-slate-550">Cmd+K (Tìm kiếm)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
