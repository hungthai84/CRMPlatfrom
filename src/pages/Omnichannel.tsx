import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Phone, Mail, Globe, Facebook, Users, Ticket as TicketIcon,
  Send, CheckCheck, Settings, Plus, Search, Bot, Paperclip, 
  Volume2, Play, Users2, ShieldCheck, AlertCircle, Sparkles, RefreshCw,
  PhoneCall, PhoneIncoming, PhoneOff, Check, X, FileText, ChevronRight, HelpCircle, ArrowUpRight
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer, Ticket } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Types for Omnichannel messages and channels
interface ChannelMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
}

interface Thread {
  id: string;
  channel: 'hotline' | 'livechat' | 'facebook' | 'tiktok' | 'email' | 'zalo' | 'website';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAvatar?: string;
  lastMessage: string;
  timestamp: number;
  unread: boolean;
  status: 'active' | 'pending' | 'resolved';
  messages: ChannelMessage[];
  sentiment?: 'Happy' | 'Neutral' | 'Frustrated';
  metadata?: Record<string, any>;
}

interface ChannelConnection {
  id: string;
  type: 'hotline' | 'livechat' | 'facebook' | 'tiktok' | 'email' | 'zalo' | 'website';
  name: string;
  status: 'connected' | 'disconnected';
  config: Record<string, string>;
}

export function Omnichannel() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'inbox' | 'setup'>('inbox');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [crmCustomers, setCrmCustomers] = useState<Customer[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Channels Config local states
  const [channels, setChannels] = useState<ChannelConnection[]>([
    { id: '1', type: 'hotline', name: 'Tổng đài Hotline SIP', status: 'connected', config: { hotline: '1900 6789', gateway: 'sip.powerservice.vn' } },
    { id: '2', type: 'livechat', name: 'Live Chat Website', status: 'connected', config: { widgetId: 'pub_livechat_8412', themeColor: '#2F69FF' } },
    { id: '3', type: 'facebook', name: 'Facebook Fanpage', status: 'disconnected', config: { pageId: '', pageToken: '' } },
    { id: '4', type: 'tiktok', name: 'TikTok Shop Inbox', status: 'disconnected', config: { sellerId: '', shopKey: '' } },
    { id: '5', type: 'zalo', name: 'Zalo OA (Official Account)', status: 'connected', config: { oaId: '228312004245', token: 'zalo_oa_live_token_sec' } },
    { id: '6', type: 'email', name: 'Email CRM Inbox', status: 'connected', config: { smtpHost: 'smtp.gmail.com', address: 'support@powerservice.vn' } },
    { id: '7', type: 'website', name: 'Website Forms API', status: 'connected', config: { endpointUrl: 'https://powerservice.vn/api/tickets' } }
  ]);

  // Call simulator local state
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [activeCallContact, setActiveCallContact] = useState({ name: 'Chị Đinh Thị Thúy', phone: '0912 345 678', company: 'Techcombank HN' });
  const [callNotes, setCallNotes] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const callIntervalRef = useRef<any>(null);

  // Webform simulator local states
  const [webFormName, setWebFormName] = useState('');
  const [webFormEmail, setWebFormEmail] = useState('');
  const [webFormPhone, setWebFormPhone] = useState('');
  const [webFormContent, setWebFormContent] = useState('');
  const [webFormSuccess, setWebFormSuccess] = useState(false);

  // Zalo OA Campaign states
  const [zaloBroadcastText, setZaloBroadcastText] = useState('Chương trình tri ân vàng: Tặng ngay 200 điểm Loyalty điểm thưởng tích luỹ khi mua sắm tại Zalo Official Account tuần này!');
  const [zaloBroadcastTarget, setZaloBroadcastTarget] = useState('Gold');
  const [zaloToast, setZaloToast] = useState('');

  // AI Assistant Copilot helper
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Custom canned replies options
  const cannedReplies = [
    { title: 'Chào mừng', text: 'Xin chào anh/chị, em là tư vấn viên CRM Power Service. Em có thể hỗ trợ gì cho anh/chị hôm nay ạ?' },
    { title: 'Báo lỗi hệ thống', text: 'Chào anh/chị, em xin ghi nhận lỗi phát sinh. Đội ngũ kỹ thuật đang tiếp nhận khắc phục, hệ thống sẽ online trở lại sau 15 phút. Thành thật xin lỗi anh/chị.' },
    { title: 'Báo giá Zalo OA', text: 'Dạ, bảng giá dịch vụ Zalo Official Account tích hợp CRM của bên em bao gồm: Gói Cơ Bản (299k/tháng), Gói Pro (699k/tháng), Gói Enterprise. Em gửi file báo giá qua Email nha.' },
    { title: 'Gửi link thanh toán', text: 'Dạ, anh/chị có thể thanh toán trực tuyến qua tài khoản doanh nghiệp của bên em tại: MB Bank - Số TK: 202688888 - Chủ TK: Power Service CRM. Sau khi chuyển khoản anh/chị chụp ảnh giao dịch gửi em ạ.' }
  ];

  // Load existing customers for context
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCrmCustomers(data);
    }, (err) => {
      console.error("Failed to load customer list for omnichannel context", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Seed default chat logs & channel threads inside UI state on component mount
  useEffect(() => {
    const mockThreads: Thread[] = [
      {
        id: 'thread_zalo_1',
        channel: 'zalo',
        customerName: 'Nguyễn Minh Tuấn',
        customerEmail: 'minhtuan@gmail.com',
        customerPhone: '0901 234 567',
        customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        lastMessage: 'Gói chăm sóc Diamond CRM dùng thử như thế nào em?',
        timestamp: Date.now() - 5 * 60000,
        unread: true,
        status: 'active',
        sentiment: 'Happy',
        messages: [
          { id: '1', sender: 'customer', senderName: 'Nguyễn Minh Tuấn', text: 'Chào shop, mình quan tâm đến gói CRM dịch vụ đa kênh', timestamp: Date.now() - 30 * 60000 },
          { id: '2', sender: 'agent', senderName: 'Hệ thống AI', text: 'Dạ xin chào anh Tuấn đầu tuần đầy năng lượng! Em hỗ trợ anh về dịch vụ phần mềm ạ.', timestamp: Date.now() - 25 * 60000 },
          { id: '3', sender: 'customer', senderName: 'Nguyễn Minh Tuấn', text: 'Gói chăm sóc Diamond CRM dùng thử như thế nào em?', timestamp: Date.now() - 5 * 60000 }
        ]
      },
      {
        id: 'thread_fb_1',
        channel: 'facebook',
        customerName: 'Phan Thanh Thảo',
        customerEmail: 'thao.thanh@gmail.com',
        customerPhone: '0988 555 111',
        customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        lastMessage: 'Gửi cho mình hoá đơn VAT của đơn hàng CRM_0897',
        timestamp: Date.now() - 2 * 3600000,
        unread: false,
        status: 'pending',
        sentiment: 'Neutral',
        messages: [
          { id: '1', sender: 'customer', senderName: 'Phan Thanh Thảo', text: 'Xin chào, tuần trước mình có gia hạn thêm 10 user cho phòng ban CSKH.', timestamp: Date.now() - 2.5 * 3600000 },
          { id: '2', sender: 'agent', senderName: 'Tư vấn viên', text: 'Dạ, bên em đã kích hoạt thành công 10 tài khoản ạ. Chị kiểm tra xem các bạn đăng nhập được chưa nhé!', timestamp: Date.now() - 2.2 * 3600000 },
          { id: '3', sender: 'customer', senderName: 'Phan Thanh Thảo', text: 'Ok đăng nhập được rồi bạn. Gửi cho mình hoá đơn VAT của đơn hàng CRM_0897.', timestamp: Date.now() - 2 * 3600000 }
        ]
      },
      {
        id: 'thread_hotline_1',
        channel: 'hotline',
        customerName: 'Hoàng Anh Quân',
        customerEmail: 'aquan.hoang@gmail.com',
        customerPhone: '0944 888 999',
        customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        lastMessage: 'Cuộc gọi nhỡ - Nháy máy do bận họp',
        timestamp: Date.now() - 4 * 3600000,
        unread: false,
        status: 'resolved',
        sentiment: 'Neutral',
        messages: [
          { id: '1', sender: 'system', senderName: 'Hệ thống điện thoại', text: 'Cuộc gọi đến từ 0944 888 999 thời lượng 2 phút 15 giây. Kết quả: Kết nối thành công', timestamp: Date.now() - 4.2 * 3600000 },
          { id: '2', sender: 'system', senderName: 'Hệ thống điện thoại', text: 'File ghi âm cuộc gọi: record_sip_0944888_2026.mp3', timestamp: Date.now() - 4.15 * 3600000 },
          { id: '3', sender: 'customer', senderName: 'Hoàng Anh Quân', text: 'Cuộc gọi nhỡ - Nháy máy do bận họp', timestamp: Date.now() - 4 * 3600000 }
        ]
      },
      {
        id: 'thread_livechat_1',
        channel: 'livechat',
        customerName: 'Khách vãng lai #124',
        customerEmail: 'visitor124@powerservice.vn',
        customerPhone: '0917 111 222',
        customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        lastMessage: 'Tư vấn giúp mình gói thiết lập web webhook tự động',
        timestamp: Date.now() - 15 * 60000,
        unread: true,
        status: 'active',
        sentiment: 'Frustrated',
        messages: [
          { id: '1', sender: 'customer', senderName: 'Khách vãng lai #124', text: 'Mình tạo webhook mà không nghe thấy thông báo, hệ thống có bị nghẽn API không?', timestamp: Date.now() - 20 * 60000 },
          { id: '2', sender: 'agent', senderName: 'Kỹ thuật viên', text: 'Dạ không ạ, chị kiểm tra xem đã bật trạng thái "Kích hoạt" trên webhook ở trang quản lý chưa? Và url nhận tin đã hỗ trợ POST chưa chị?', timestamp: Date.now() - 18 * 60000 },
          { id: '3', sender: 'customer', senderName: 'Khách vãng lai #124', text: 'Tư vấn giúp mình gói thiết lập web webhook tự động', timestamp: Date.now() - 15 * 60000 }
        ]
      },
      {
        id: 'thread_webform_1',
        channel: 'website',
        customerName: 'Trần Thị Ngọc',
        customerEmail: 'ngoc_tran99@yahoo.com',
        customerPhone: '0977 123 456',
        lastMessage: 'Yêu cầu liên hệ lại báo giá nâng cấp CRM và hạ tầng tổng đài IP',
        timestamp: Date.now() - 1 * 3600000,
        unread: false,
        status: 'pending',
        sentiment: 'Happy',
        messages: [
          { id: '1', sender: 'customer', senderName: 'Trần Thị Ngọc', text: 'Gửi từ biểu mẫu Liên hệ tại Website: Khách hàng cần hỗ trợ thiết lập hệ thống Tổng đài VoIP tích hợp CRM của Viettel/FPT cho quy mô 30 telesale. Email: ngoc_tran99@yahoo.com, SĐT: 0977 123 456. Yêu cầu liên hệ lại báo giá nâng cấp CRM và hạ tầng tổng đài IP', timestamp: Date.now() - 1 * 3600000 }
        ]
      }
    ];
    setThreads(mockThreads);
    setSelectedThreadId(mockThreads[0].id);
  }, []);

  // Update Call Duration Timer
  useEffect(() => {
    if (isCallActive) {
      callIntervalRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(callIntervalRef.current);
      setCallTimer(0);
    }
    return () => clearInterval(callIntervalRef.current);
  }, [isCallActive]);

  // Find Customer profile matching active thread contact info
  const getSelectedThreadCustomerInfo = () => {
    const thread = threads.find(t => t.id === selectedThreadId);
    if (!thread) return null;
    
    // Attempt lookup in current real CRM Customers
    return crmCustomers.find(c => 
      (c.phone && c.phone.replace(/\s+/g, '') === thread.customerPhone.replace(/\s+/g, '')) || 
      (c.email && c.email.toLowerCase() === thread.customerEmail.toLowerCase())
    );
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedThreadId) return;

    setThreads(prevThreads => prevThreads.map(thread => {
      if (thread.id === selectedThreadId) {
        const newMessage: ChannelMessage = {
          id: `msg_send_${Date.now()}`,
          sender: 'agent',
          senderName: user?.displayName || 'Tư vấn viên',
          text: inputText.trim(),
          timestamp: Date.now()
        };
        return {
          ...thread,
          lastMessage: inputText.trim(),
          timestamp: Date.now(),
          unread: false,
          messages: [...thread.messages, newMessage]
        };
      }
      return thread;
    }));

    setInputText('');
    setAiSuggestion('');

    // Auto simulated customer reply after 1.5 seconds to feel live and interactive!
    const currentThread = threads.find(t => t.id === selectedThreadId);
    if (currentThread && currentThread.channel === 'livechat') {
      setTimeout(() => {
        setThreads(prevThreads => prevThreads.map(t => {
          if (t.id === selectedThreadId) {
            const replyMessage: ChannelMessage = {
              id: `msg_reply_sim_${Date.now()}`,
              sender: 'customer',
              senderName: t.customerName,
              text: "Dạ tuyệt vời! Em đã nhận được thông tin phản hồi từ anh/chị. Cảm ơn hệ thống CRM đã hỗ trợ nhanh chóng ạ!",
              timestamp: Date.now()
            };
            return {
              ...t,
              lastMessage: replyMessage.text,
              timestamp: Date.now(),
              unread: true,
              messages: [...t.messages, replyMessage]
            };
          }
          return t;
        }));
      }, 1500);
    }
  };

  // Convert current multi-channel message feed to a standard CRM Ticket
  const handleConvertToTicket = async () => {
    const activeThread = threads.find(t => t.id === selectedThreadId);
    if (!activeThread) return;

    try {
      // Find or generate a mock customer id
      const matchedCustomer = getSelectedThreadCustomerInfo();
      let customerId = matchedCustomer ? matchedCustomer.id : `guest_${Date.now()}`;
      
      const newTicketPayload = {
        ticketId: `YT-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        title: `[Giao tiếp Đa kênh] Hỗ trợ ${activeThread.customerName}`,
        description: activeThread.lastMessage,
        category: activeThread.channel === 'hotline' ? 'technical' : 'consultancy',
        priority: 'medium',
        status: 'new',
        customerId: customerId,
        customerName: activeThread.customerName,
        ownerId: user?.uid || 'system_gen',
        source: activeThread.channel === 'zalo' ? 'zalo' : activeThread.channel === 'facebook' ? 'fanpage' : activeThread.channel === 'email' ? 'email' : 'chat',
        slaDeadline: Date.now() + 24 * 3600 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await addDoc(collection(db, 'tickets'), newTicketPayload);
      alert(`Đã tự động chuyển đổi cuộc hội thoại thành CRM Ticket thành công! Mã ticket: ${newTicketPayload.ticketId}`);
    } catch (e: any) {
      console.error("Failed to generate custom support ticket", e);
      alert(`Đã xảy ra lỗi khi tạo Ticket: ${e.message}`);
    }
  };

  // Connect or disconnect channels
  const toggleChannelStatus = (id: string) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === id) {
        const nextStatus = ch.status === 'connected' ? 'disconnected' : 'connected';
        return { ...ch, status: nextStatus };
      }
      return ch;
    }));
  };

  // Simulate incoming VoIP call
  const triggerSimulatedCall = () => {
    const randomCallers = [
      { name: 'Anh Trịnh Bá Quốc', phone: '0979 231 445', company: 'Đồng Nai Polytech' },
      { name: 'Chị Mai Mỹ Tâm', phone: '0912 999 888', company: 'TP Bank Chi Nhánh Q1' },
      { name: 'Anh Nguyễn Thế Long', phone: '0866 505 522', company: 'FPT Software' }
    ];
    const chosen = randomCallers[Math.floor(Math.random() * randomCallers.length)];
    setActiveCallContact(chosen);
    setIsIncomingCall(true);
  };

  const acceptCall = () => {
    setIsIncomingCall(false);
    setIsCallActive(true);
    setIsTranscribing(true);
    setTranscriptions(['[Customer]: Xin chào, mình gọi từ công ty thành viên. Cho hỏi tổng đài đã liên kết CRM chưa?']);
    
    // Simulate real-time continuous Speech To Text transcription
    setTimeout(() => {
      setTranscriptions(prev => [...prev, '[Customer]: Mình muốn đăng ký mua nâng cấp thêm 50 user Diamond và tích hợp Zalo OA của công ty luôn.']);
    }, 4000);
    setTimeout(() => {
      setTranscriptions(prev => [...prev, '[Agent(AI Assist)]: Dạ cám ơn anh, em đã ghi nhận yêu cầu. Hệ thống đang tạo Yêu cầu hỗ trợ tự động trên màn hình CRM của anh ạ.']);
    }, 8000);
  };

  const endCall = async () => {
    setIsCallActive(false);
    setIsTranscribing(false);
    
    // Save call data to thread logs
    const callThread: Thread = {
      id: `thread_hotline_${Date.now()}`,
      channel: 'hotline',
      customerName: activeCallContact.name,
      customerEmail: `${activeCallContact.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      customerPhone: activeCallContact.phone,
      lastMessage: 'Đàm thoại Hotline hoàn tất: ' + (callNotes || 'Đăng ký nâng cấp 50 user CRM Diamond'),
      timestamp: Date.now(),
      unread: true,
      status: 'resolved',
      sentiment: 'Happy',
      messages: [
        { id: '1', sender: 'system', senderName: 'Tổng đài SIP', text: `Cuộc gọi kết nối tại ${new Date().toLocaleTimeString()} - Thời lượng 28 giây.`, timestamp: Date.now() - 30000 },
        { id: '2', sender: 'customer', senderName: activeCallContact.name, text: transcriptions.join('\n'), timestamp: Date.now() - 10000 },
        { id: '3', sender: 'agent', senderName: user?.displayName || 'Tư vấn viên', text: `Ý kiến phản hồi lưu lại: ${callNotes || 'Đăng ký nâng cấp 50 user CRM Diamond'}`, timestamp: Date.now() }
      ]
    };
    
    setThreads(prev => [callThread, ...prev]);
    setSelectedThreadId(callThread.id);
    setCallNotes('');
    setTranscriptions([]);
  };

  // Simulate Live Chat submission from Client
  const triggerLiveChatSimulationSubmit = () => {
    const newLiveThread: Thread = {
      id: `thread_sim_live_${Date.now()}`,
      channel: 'livechat',
      customerName: 'Hoàng Minh Ngọc (Live Sandbox)',
      customerEmail: 'minhngoc98@outlook.com',
      customerPhone: '0933 777 966',
      customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      lastMessage: 'Khách hàng bắt đầu phiên Live Chat từ trang biểu giá CRM Website',
      timestamp: Date.now(),
      unread: true,
      status: 'active',
      sentiment: 'Neutral',
      messages: [
        { id: '1', sender: 'customer', senderName: 'Hoàng Minh Ngọc', text: 'Hello, mình cần nhân viên hỗ trợ trực tuyến xem giúp mình cấu hình phễu bán hàng Marketing Automation với!', timestamp: Date.now() }
      ]
    };

    setThreads(prev => [newLiveThread, ...prev]);
    setSelectedThreadId(newLiveThread.id);
  };

  // Simulate Submit Website Contact form
  const handleSimulatedWebForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webFormName || !webFormPhone) return;

    const webThread: Thread = {
      id: `thread_web_sim_${Date.now()}`,
      channel: 'website',
      customerName: webFormName,
      customerEmail: webFormEmail || 'anonymous@website.vn',
      customerPhone: webFormPhone,
      lastMessage: `[Form Web] ${webFormContent}`,
      timestamp: Date.now(),
      unread: true,
      status: 'active',
      sentiment: 'Happy',
      messages: [
        { 
          id: '1', 
          sender: 'customer', 
          senderName: webFormName, 
          text: `Nội dung phản hồi website gửi về: Name: ${webFormName} | Email: ${webFormEmail} | SĐT: ${webFormPhone}. Lời nhắn: ${webFormContent || 'Yêu cầu tư vấn dịch vụ'}`, 
          timestamp: Date.now() 
        }
      ]
    };

    setThreads(prev => [webThread, ...prev]);
    setSelectedThreadId(webThread.id);
    setWebFormSuccess(true);
    setTimeout(() => {
      setWebFormSuccess(false);
      setWebFormName('');
      setWebFormEmail('');
      setWebFormPhone('');
      setWebFormContent('');
    }, 3000);
  };

  const handleZaloBroadcast = () => {
    setZaloToast(`Tin nhắn hàng loạt (Broadcast) đã được phân phát thành công tới nhóm cấp bậc ${zaloBroadcastTarget} trên Zalo OA!`);
    setTimeout(() => setZaloToast(''), 4000);
  };

  // Generate Smart Draft Reply with AI
  const handleSmartAiDraft = () => {
    setIsGeneratingAi(true);
    // Find active thread messages
    const thread = threads.find(t => t.id === selectedThreadId);
    const lastMsgText = thread ? thread.lastMessage : 'Dạ em cần tư vấn ạ';

    setTimeout(() => {
      let resultText = `Dạ, xin chào anh/chị ${thread?.customerName || 'khách hàng'}. Em thấy mình đang hỏi về "${lastMsgText}". Công ty bên em hỗ trợ tư vấn hoàn toàn miễn phí, có chính sách bảo hành 12 tháng. Em xin phép kết nối cuộc gọi giải đáp chi tiết luôn nhé ạ!`;
      setAiSuggestion(resultText);
      setIsGeneratingAi(false);
    }, 850);
  };

  // Filter threads based on search term and selected category channel
  const filteredThreads = threads.filter(t => {
    const matchesSearch = t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.customerPhone.includes(searchTerm);
    if (selectedChannelFilter === 'all') return matchesSearch;
    return matchesSearch && t.channel === selectedChannelFilter;
  });

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'hotline':
        return <Phone size={15} className="text-emerald-500" />;
      case 'livechat':
        return <Globe size={15} className="text-blue-500" />;
      case 'facebook':
        return <Facebook size={15} className="text-[#1877F2]" />;
      case 'tiktok':
        return <span className="bg-black text-white text-[9px] px-1 font-extrabold rounded select-none">TikTok</span>;
      case 'email':
        return <Mail size={15} className="text-rose-500" />;
      case 'zalo':
        return <span className="bg-blue-600 text-white text-[9px] px-1.5 font-black rounded select-none">Zalo</span>;
      case 'website':
        return <Globe size={15} className="text-purple-500" />;
      default:
        return <MessageSquare size={15} className="text-slate-500" />;
    }
  };

  return (
    <div id="omnichannel-container" className="flex flex-col lg:flex-row h-full w-full gap-5 p-4 lg:p-6 bg-slate-50 dark:bg-slate-900/40">
      
      {/* LEFT SIDEBAR CONTROLS: Inbox & Settings Tabs */}
      <div id="omnichannel-tabs" className="w-full lg:w-72 bg-white rounded-2xl border border-slate-100 flex flex-col p-5 shrink-0 shadow-sm">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-md">Giao tiếp Đa kênh</h2>
            <p className="text-[11px] text-slate-500 font-medium">Bảo mật & Đồng bộ thời gian thực</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-50 p-1 rounded-xl mb-6">
          <button 
            id="tab-inbox"
            onClick={() => setActiveView('inbox')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeView === 'inbox' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Hộp thư đến
          </button>
          <button 
            id="tab-setup"
            onClick={() => setActiveView('setup')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeView === 'setup' ? 'bg-white text-indigo-100 bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Cấu hình kênh
          </button>
        </div>

        {activeView === 'inbox' ? (
          <div className="flex-1 flex flex-col gap-1.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-1">Lọc nguồn kênh</p>
            {[
              { id: 'all', label: 'Tất cả nguồn', count: threads.length },
              { id: 'zalo', label: 'Zalo OA', icon: 'Zalo' },
              { id: 'livechat', label: 'Live Chat Web', icon: 'LiveChat' },
              { id: 'hotline', label: 'Tổng đài Hotline', icon: 'Hotline' },
              { id: 'facebook', label: 'Facebook Page', icon: 'FB' },
              { id: 'tiktok', label: 'TikTok Shop Box', icon: 'TikTok' },
              { id: 'email', label: 'Gmail / Email', icon: 'Mail' },
              { id: 'website', label: 'Website Tickets', icon: 'Web' }
            ].map((filt) => {
              const isActive = selectedChannelFilter === filt.id;
              return (
                <button
                  key={filt.id}
                  id={`filter-${filt.id}`}
                  onClick={() => setSelectedChannelFilter(filt.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center font-bold text-[9px]">
                      {filt.id === 'all' ? '●' : getChannelIcon(filt.id)}
                    </span>
                    <span>{filt.label}</span>
                  </div>
                  {filt.count !== undefined && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {filt.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Actions Panel */}
            <div className="mt-auto border-t border-slate-100 pt-4 space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 mb-2">Giả lập nhanh (TDD)</p>
              
              <button 
                id="btn-trigger-call"
                onClick={triggerSimulatedCall}
                className="w-full bg-emerald-550 border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PhoneCall size={14} className="animate-bounce" />
                Mô phỏng Hotline
              </button>

              <button 
                id="btn-trigger-chat"
                onClick={triggerLiveChatSimulationSubmit}
                className="w-full bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare size={14} />
                Mô phỏng Chat Khách
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">Kết nối thiết bị đầu cuối thông qua giao thức Webhook / REST Web API bảo mật.</p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 mb-2">
                <Sparkles size={13} className="text-indigo-600" />
                Webhook Listener URL
              </h3>
              <code className="text-[10px] block font-mono bg-white p-2 rounded-lg text-indigo-700 break-all select-all font-semibold">
                https://api.powerservice.vn/v1/webhook
              </code>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Cấu hình webhook này trên trang developer của Facebook / TikTok / Zalo OA.</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái tích hợp</p>
              {channels.map((chan) => (
                <div key={chan.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-100/70">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(chan.type)}
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-28">{chan.name}</span>
                  </div>
                  <button 
                    onClick={() => toggleChannelStatus(chan.id)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${chan.status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {chan.status === 'connected' ? 'Bật' : 'Tắt'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE & RIGHT AREA: Dynamic View based on view selection */}
      <div id="omnichannel-workspace" className="flex-1 flex flex-col md:flex-row gap-5 h-[calc(100vh-200px)] lg:h-[calc(100vh-165px)] overflow-hidden">
        
        {activeView === 'inbox' ? (
          <>
            {/* THREADS LIST - INBOX FEEDS */}
            <div id="threads-list-panel" className="w-full md:w-80 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm h-full shrink-0">
              <div className="p-4 border-b border-slate-50 shrink-0">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    id="thread-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm tin nhắn, khách hàng..."
                    className="w-full bg-slate-50 pl-10 pr-4 py-2 text-xs rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Thread list scroll area */}
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-50">
                {filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <HelpCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Chưa có kênh giao tiếp nào.</p>
                  </div>
                ) : (
                  filteredThreads.map((thr) => {
                    const isSelected = selectedThreadId === thr.id;
                    const matchedCustomer = crmCustomers.find(c => 
                      c.phone === thr.customerPhone || c.email === thr.customerEmail
                    );
                    return (
                      <div
                        key={thr.id}
                        id={`thread-item-${thr.id}`}
                        onClick={() => setSelectedThreadId(thr.id)}
                        className={`p-4 flex gap-3 cursor-pointer transition-all hover:bg-slate-50/75 relative ${isSelected ? 'bg-indigo-50/50 border-r-4 border-indigo-600' : ''}`}
                      >
                        {thr.customerAvatar ? (
                          <img src={thr.customerAvatar} alt={thr.customerName} className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-150" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                            {thr.customerName.charAt(0)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-extrabold text-slate-900 truncate">
                              {thr.customerName}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                              {new Date(thr.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate font-semibold">
                            {thr.lastMessage}
                          </p>

                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="flex items-center gap-1">
                              {getChannelIcon(thr.channel)}
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{thr.channel}</span>
                            </span>
                            {thr.sentiment === 'Happy' && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">😊 Vui vẻ</span>}
                            {thr.sentiment === 'Frustrated' && <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">😟 Khó chịu</span>}
                            {matchedCustomer && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">CRM ID</span>
                            )}
                          </div>
                        </div>

                        {thr.unread && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600"></span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CHAT SESSION LOGS & WORKSPACE */}
            <div id="chat-workspace-panel" className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm h-full">
              {selectedThreadId ? (
                (() => {
                  const activeThread = threads.find(t => t.id === selectedThreadId);
                  if (!activeThread) return null;
                  const matchedCustomer = getSelectedThreadCustomerInfo();

                  return (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/20">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            {getChannelIcon(activeThread.channel)}
                          </span>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                              {activeThread.customerName}
                              {matchedCustomer?.tier && (
                                <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.2 rounded font-bold uppercase">
                                  {matchedCustomer.tier}
                                </span>
                              )}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-semibold">{activeThread.customerPhone} • {activeThread.customerEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            id="btn-crm-ticket"
                            onClick={handleConvertToTicket}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <TicketIcon size={13} />
                            Tạo Ticket CRM
                          </button>
                        </div>
                      </div>

                      {/* Messages Feed Container */}
                      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 bg-slate-50/30">
                        {activeThread.messages.map((msg) => {
                          const isAgent = msg.sender === 'agent';
                          const isSystem = msg.sender === 'system';

                          if (isSystem) {
                            return (
                              <div key={msg.id} className="flex justify-center my-2">
                                <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-1.5 max-w-lg text-center">
                                  <p className="text-[10px] text-slate-500 font-mono font-medium leading-relaxed">
                                    ⚙️ {msg.text}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-3 max-w-xl ${isAgent ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                            >
                              {!isAgent && activeThread.customerAvatar && (
                                <img src={activeThread.customerAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-100" />
                              )}
                              <div>
                                <div className={`p-4.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${isAgent ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                                  {msg.text}
                                </div>
                                <p className={`text-[9px] text-slate-400 font-semibold mt-1 ${isAgent ? 'text-right' : 'text-left'}`}>
                                  {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* AI Suggestion box */}
                      {aiSuggestion && (
                        <div className="mx-4 my-2 p-3.5 bg-indigo-50/80 border border-indigo-100/50 rounded-xl flex flex-col gap-2">
                          <p className="text-[10px] text-indigo-700 font-bold flex items-center gap-1">
                            <Sparkles size={11} className="text-indigo-600 animate-pulse" />
                            AI Trợ lý Gợi ý Draft:
                          </p>
                          <p className="text-xs text-slate-700 italic font-medium">"{aiSuggestion}"</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setInputText(aiSuggestion); setAiSuggestion(''); }}
                              className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-1 rounded cursor-pointer"
                            >
                              Áp dụng
                            </button>
                            <button
                              onClick={() => setAiSuggestion('')}
                              className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-1 rounded cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Chat Input controls */}
                      <div className="p-4 border-t border-slate-50 shrink-0 bg-white">
                        
                        {/* Custom Canned replies helper */}
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-1">
                          <button
                            id="btn-ai-copilot"
                            onClick={handleSmartAiDraft}
                            disabled={isGeneratingAi}
                            className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 flex items-center gap-1 hover:bg-indigo-100 transition-all cursor-pointer"
                          >
                            <Bot size={11} className={isGeneratingAi ? "animate-spin" : ""} />
                            {isGeneratingAi ? "AI phân tích..." : "AI Gợi ý trả lời"}
                          </button>

                          {cannedReplies.map((canned, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInputText(canned.text)}
                              className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition-all cursor-pointer"
                            >
                              💬 {canned.title}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            id="chat-reply-input"
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Nhập nội dung phản hồi khách hàng (Ctrl + Enter)..."
                            className="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                          <button
                            id="btn-reply-send"
                            onClick={handleSendMessage}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2.5 shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <Send size={15} />
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MessageSquare size={48} className="stroke-1 mb-3 opacity-30" />
                  <p className="text-xs font-bold text-slate-600">Chọn cuộc hội thoại đa kênh trên menu để kết nối.</p>
                </div>
              )}
            </div>

            {/* CUSTOMER 360 WORKSPACE SIDEBAR PANEL */}
            <div id="customer-context-panel" className="w-full md:w-64 bg-white rounded-2xl border border-slate-100 flex flex-col p-5 overflow-y-auto no-scrollbar shadow-sm shrink-0">
              {(() => {
                const customer = getSelectedThreadCustomerInfo();
                if (!customer) {
                  return (
                    <div className="text-center py-6 text-slate-400">
                      <Users2 size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase">Khách Vãng Lai</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">Khách hàng chưa liên kết dữ liệu CRM.</p>
                      
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Đăng ký khách mới</p>
                        <button 
                          onClick={async () => {
                            const thread = threads.find(t => t.id === selectedThreadId);
                            if (!thread || !user) return;
                            try {
                              const newDoc = {
                                name: thread.customerName,
                                email: thread.customerEmail,
                                phone: thread.customerPhone,
                                tier: 'Member',
                                loyaltyPoints: 100,
                                segment: 'Khách hàng Đa kênh',
                                ownerId: user.uid,
                                createdAt: Date.now(),
                                updatedAt: Date.now()
                              };
                              await addDoc(collection(db, 'customers'), newDoc);
                              alert('Đã đồng bộ thông tin khách hàng đa kênh và tạo hồ sơ CRM 360 mới thành công!');
                            } catch (e: any) {
                              console.error(e);
                            }
                          }}
                          className="w-full bg-indigo-50 text-indigo-700 text-xs font-bold py-2 rounded-xl text-center hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          + Đồng bộ hồ sơ CRM
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-5">
                    <div className="text-center pb-4 border-b border-slate-100">
                      {customer.avatar ? (
                        <img src={customer.avatar} alt={customer.name} className="w-16 h-16 rounded-full mx-auto object-cover ring-2 ring-indigo-50 mb-3" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl mx-auto mb-3 uppercase">
                          {customer.name.charAt(0)}
                        </div>
                      )}
                      <h4 className="font-extrabold text-slate-900 text-xs">{customer.name}</h4>
                      <p className="text-[11px] text-indigo-600 font-extrabold uppercase tracking-wide mt-1">{customer.segment || 'Vãng lai'}</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hồ sơ 360</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Tích luỹ Loyalty:</span>
                        <span className="font-extrabold text-amber-600">{customer.loyaltyPoints || 0} Điểm</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">LTV Doanh thu:</span>
                        <span className="font-extrabold text-slate-800">
                          {customer.lifetimeValue ? customer.lifetimeValue.toLocaleString('vi-VN') : '0'} VND
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Cấp bậc:</span>
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">{customer.tier || 'Member'}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Chăm sóc bởi:</span>
                        <span className="font-bold text-slate-700">Telesale CRM</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Trực quan hóa hành trình</p>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-800 font-bold">{customer.journeyStage || 'Consideration'}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">Cập nhật qua cuộc đối thoại trực tuyến tự động.</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          /* INTEGRATIONS SETUP WORKSPACE */
          <div id="setup-integrations-panel" className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col shadow-sm h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 shrink-0 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Quản lý tích hợp trung tâm</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Cung cấp cấu hình phần mềm kết nối SIP callbox, các API mạng xã hội và email khách hàng.</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Facebook Integration Form */}
                <div className="bg-slate-50/50 border border-slate-150/70 p-5 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Facebook size={18} className="text-[#1877F2]" />
                    <h4 className="font-extrabold text-xs text-slate-900">Facebook Page Messenger</h4>
                  </div>
                  <label className="text-[11px] text-slate-500 font-extrabold uppercase mt-2">App ID cài đặt</label>
                  <input type="text" placeholder="e.g. 524100249581924" className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none" />
                  <label className="text-[11px] text-slate-500 font-extrabold uppercase">Access Token Trang</label>
                  <input type="password" value="EAAWpZBsNzMpsBANgO9..." disabled className="bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none" />
                  <p className="text-[10px] text-slate-400 font-semibold">OAuth popup auto redirect callback uri handles correctly.</p>
                </div>

                {/* TikTok Shop form */}
                <div className="bg-slate-50/50 border border-slate-150/70 p-5 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px] font-black">TikTok</span>
                    <h4 className="font-extrabold text-xs text-slate-900">TikTok Shop Customer Chat</h4>
                  </div>
                  <label className="text-[11px] text-slate-500 font-extrabold uppercase mt-2">Merchant Client ID</label>
                  <input type="text" placeholder="e.g. tt_merchant_id_powerservice" className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none" />
                  <label className="text-[11px] text-slate-500 font-extrabold uppercase">App Secret Key</label>
                  <input type="password" value="secret_tiktok_3914a..." disabled className="bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none" />
                </div>

                {/* Zalo OA Marketing automation broadcast helper */}
                <div className="bg-slate-50/50 border border-slate-150/70 p-5 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-black">Zalo</span>
                    <h4 className="font-extrabold text-xs text-slate-900">Zalo OA Broadcast Center</h4>
                  </div>
                  <label className="text-[11px] text-slate-500 font-extrabold uppercase">Chiến dịch gửi hàng loạt</label>
                  <textarea
                    rows={2}
                    value={zaloBroadcastText}
                    onChange={(e) => setZaloBroadcastText(e.target.value)}
                    className="bg-white border border-slate-200 p-3 rounded-xl text-xs focus:outline-none font-medium text-slate-700"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <select
                      value={zaloBroadcastTarget}
                      onChange={(e) => setZaloBroadcastTarget(e.target.value)}
                      className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="All">Tất cả thành viên</option>
                      <option value="Gold">Hạng Vàng (Gold)</option>
                      <option value="Platinum">Hạng Bạch Kim (Platinum)</option>
                    </select>
                    <button
                      onClick={handleZaloBroadcast}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Gửi Quảng Bá OA
                    </button>
                  </div>
                  {zaloToast && (
                    <p className="text-[11px] text-indigo-750 bg-indigo-50 px-3 py-2 rounded-lg font-bold leading-relaxed">{zaloToast}</p>
                  )}
                </div>

                {/* Website HTML Form Sandbox */}
                <div id="website-form-sandbox" className="bg-slate-50/50 border border-slate-150/70 p-5 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={18} className="text-purple-600" />
                    <h4 className="font-extrabold text-xs text-slate-900">Sandbox: Gửi Ticket từ Website</h4>
                  </div>
                  <form onSubmit={handleSimulatedWebForm} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        required 
                        placeholder="Họ Tên" 
                        value={webFormName} 
                        onChange={(e) => setWebFormName(e.target.value)} 
                        className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none" 
                      />
                      <input 
                        type="text" 
                        required 
                        placeholder="Số điện thoại" 
                        value={webFormPhone} 
                        onChange={(e) => setWebFormPhone(e.target.value)} 
                        className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none" 
                      />
                    </div>
                    <input 
                      type="email" 
                      placeholder="Email liên hệ (Tùy chọn)" 
                      value={webFormEmail} 
                      onChange={(e) => setWebFormEmail(e.target.value)} 
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none" 
                    />
                    <textarea 
                      placeholder="Nội dung yêu cầu" 
                      rows={2} 
                      value={webFormContent} 
                      onChange={(e) => setWebFormContent(e.target.value)} 
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none" 
                    />
                    <button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
                    >
                      Bấm Gửi Phản Hồi Website Sandbox
                    </button>
                    {webFormSuccess && (
                      <p className="text-[10px] text-emerald-600 font-extrabold text-center">✓ Đã chuyển thông tin phản hổi Web về trung tâm Hộp thư đến CRM!</p>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VoIP SOFTPHONE CALL DIALER POPUP MODAL */}
      <AnimatePresence>
        {(isIncomingCall || isCallActive) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white p-5 rounded-[24px] shadow-2xl border border-slate-800 w-80 shadow-indigo-500/10 shrink-0"
          >
            {isIncomingCall ? (
              <div id="softphone-incoming-call" className="text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <PhoneIncoming size={32} className="text-indigo-400 rotate-12" />
                </div>
                <h4 className="text-sm font-extrabold">{activeCallContact.name}</h4>
                <p className="text-xs text-slate-400 mt-1 font-semibold">{activeCallContact.phone}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mt-2">{activeCallContact.company}</p>

                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={acceptCall}
                    className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-500/25"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => setIsIncomingCall(false)}
                    className="w-12 h-12 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-rose-500/25"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div id="softphone-active-call" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">Trực Tiếp (SIP VoIP)</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">
                    {Math.floor(callTimer / 60).toString().padStart(2, '0')}:{(callTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="text-center py-2">
                  <h4 className="text-sm font-extrabold">{activeCallContact.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeCallContact.phone}</p>
                </div>

                {/* Simulated Waveform sound animation visualizer */}
                <div className="flex justify-center gap-1 shrink-0 h-6 items-center">
                  {[2, 4, 6, 8, 4, 2, 7, 3, 5, 8, 4, 2, 6, 9, 3, 5, 2].map((val, idx) => (
                    <span 
                      key={idx} 
                      className="bg-indigo-500 rounded w-1 h-full transition-all duration-300 animate-pulse" 
                      style={{ 
                        height: `${val * 10}%`,
                        animationDelay: `${idx * 0.1}s`
                      }}
                    ></span>
                  ))}
                </div>

                {isTranscribing && (
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl max-h-24 overflow-y-auto no-scrollbar space-y-1.5">
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">AI Speech To Text Transcription:</p>
                    {transcriptions.map((t, idx) => (
                      <p key={idx} className="text-[10px] text-slate-300 italic font-medium leading-relaxed">{t}</p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ghi chú cuộc gọi</label>
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Ghi nhận phản hồi nhanh..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={endCall}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/25"
                >
                  <PhoneOff size={14} />
                  Gác Máy & Lưu Hồ Sơ
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
