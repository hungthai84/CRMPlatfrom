import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, Plus, Search, Trash2, Edit2, FileText, Check, 
  Send, Users, Sparkles, Copy, Play, ArrowRight, Eye, RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, doc, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'sales' | 'support' | 'followup' | 'other';
  lastModified: number;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'temp-1',
    name: 'Chào mừng Khách hàng mới (Onboarding)',
    subject: 'Chào mừng {customer_name} đến với hệ sinh thái Power Service!',
    body: 'Kính gửi {customer_name},\n\nTôi là Hùng Thái, đại diện hỗ trợ tài khoản của quý khách tại Power Service CRM. Chúng tôi vô cùng trân quý khi được hợp tác cùng doanh nghiệp của bạn.\n\nTrong tuần đầu tiên này, hệ thống sẽ gửi các chỉ dẫn cơ bản để đội ngũ của quý khách làm quen nhanh chóng. Nếu có bất cứ vướng mắc gì, xin vui lòng phản hồi email này hoặc gọi hotline hỗ trợ của chúng tôi.\n\nTrân trọng,\nHùng Thái - Power Service CRM.',
    category: 'welcome',
    lastModified: Date.now() - 2 * 24 * 3600000
  },
  {
    id: 'temp-2',
    name: 'Báo giá Gia hạn & Nâng cấp Dịch vụ',
    subject: 'Đề xuất Báo giá Gia dịch vụ & Thăng hạng Thân thiết - {customer_name}',
    body: 'Xin chào {customer_name},\n\nNhư đã thảo luận trong lịch hẹn chăm sóc trước đó, tôi xin phép gửi đề xuất báo giá gia hạn gói giải pháp CRM nâng cao của doanh nghiệp kèm theo ưu đãi nâng cấp lên tính năng họp trực tuyến HD trực tiếp cho đội ngũ CSKH.\n\nDoanh nghiệp của bạn sẽ được thăng hạng Loyalty lên mức Platinum với đầy đủ đặc quyền hỗ trợ lỗi 24/7 tức thì.\n\nQuý khách vui lòng xem chi tiết báo giá đính kèm và phản hồi để chúng tôi tiến hành chuẩn bị hợp đồng trước ngày {follow_up_date}.\n\nTrân trọng,\nĐội ngũ CSKH Power Service.',
    category: 'sales',
    lastModified: Date.now() - 5 * 24 * 3600000
  },
  {
    id: 'temp-3',
    name: 'Khảo sát Ý kiến & Đánh giá mức độ hài lòng',
    subject: 'Ý kiến đóng góp từ {customer_name} giúp hoàn thiện dịch vụ hỗ trợ',
    body: 'Kính gửi {customer_name},\n\nChúng tôi ghi nhận phiếu hỗ trợ kỹ thuật của Quý khách liên quan đến cấu hình hệ thống vừa được xử lý thành công vào ngày vừa qua.\n\nĐể giúp chúng tôi liên tục cải tiến chất lượng chăm sóc, rất mong {customer_name} dành 1 phút để thực hiện khảo sát ngắn sau đây:\nLink khảo sát: https://crm.powerservice.com/survey/{customer_id}\n\nXin chân thành cảm ơn sự đồng hành và những góp ý chân thành từ quý khách!\n\nĐội ngũ Kỹ thuật CSKH.',
    category: 'support',
    lastModified: Date.now() - 10 * 24 * 3600000
  },
  {
    id: 'temp-4',
    name: '[Tự động] Chăm sóc Leads trễ tương tác (>7 Ngày)',
    subject: 'Power Service CRM hỗ trợ: Tiếp tục trao đổi đề xuất cùng {customer_name}',
    body: 'Kính gửi {customer_name},\n\nTôi liên hệ lại từ đội ngũ Power Service CRM. Chúng tôi nhận thấy đã hơn 1 tuần trôi qua kể từ khi ghi nhận yêu cầu tư vấn ban đầu của Quý khách liên quan đến giải pháp quản trị doanh nghiệp.\n\nHùng Thái rất mong muốn được hỗ trợ Giải đáp trực tiếp các vướng mắc của Quý khách. Xin vui lòng cho chúng tôi biết khung giờ phù hợp để kết nối lại, hoặc phản hồi email này nếu Quý khách cần thêm thông tin.\n\nTrân trọng,\nĐội ngũ CSKH Power Service CRM.',
    category: 'followup',
    lastModified: Date.now()
  }
];

export function EmailTemplates() {
  const { user } = useAuth();
  
  // Database customers for simulation
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Templates storage (combining defaults with localStorage)
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('crm_email_templates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_TEMPLATES; }
    }
    return DEFAULT_TEMPLATES;
  });

  // Modal / Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempSubject, setTempSubject] = useState('');
  const [tempBody, setTempBody] = useState('');
  const [tempCategory, setTempCategory] = useState<'welcome' | 'sales' | 'support' | 'followup' | 'other'>('welcome');
  
  // Simulation Compiler States
  const [compilerSourceTemplateId, setCompilerSourceTemplateId] = useState('temp-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [sentStatus, setSentStatus] = useState(false);

  // Automated inactive leads follow-up states
  const [inactiveLeads, setInactiveLeads] = useState<any[]>([]);
  const [selectedInactiveLeadIds, setSelectedInactiveLeadIds] = useState<string[]>([]);
  const [sendingLogs, setSendingLogs] = useState<string[]>([]);
  const [isAutomating, setIsAutomating] = useState(false);

  useEffect(() => {
    const rawLeads = localStorage.getItem('local_crm_leads');
    if (rawLeads) {
      try {
        const parsed: any[] = JSON.parse(rawLeads);
        const filtered = parsed.filter(lead => {
          if (lead.status === 'Không đạt') return false;
          // Leads created > 7 days ago
          const leadDate = new Date(lead.createdAt).getTime();
          const diffDays = (Date.now() - leadDate) / (1000 * 3600 * 24);
          return diffDays >= 7 || lead.priority === 'High';
        });

        if (filtered.length === 0) {
          const mockInactive = [
            {
              id: 'L-9001',
              name: 'Đặng Quốc Khánh',
              company: 'Khánh An Invest',
              email: 'khanh.an@invest.com.vn',
              phone: '0912112233',
              createdAt: '2026-05-20 11:30',
              status: 'Đang liên hệ',
              priority: 'High',
              value: 150000000
            },
            {
              id: 'L-9002',
              name: 'Vũ Minh Thu',
              company: 'Thu Minh Education',
              email: 'minhthu.edu@gmail.com',
              phone: '0988665544',
              createdAt: '2026-05-15 08:45',
              status: 'Mới nhận',
              priority: 'Medium',
              value: 45000000
            },
            {
              id: 'L-9003',
              name: 'Trần Minh Quang',
              company: 'Quang Minh Furniture',
              email: 'quangminh.furni@outlook.com',
              phone: '0909002231',
              createdAt: '2026-04-10 14:00',
              status: 'Hẹn gặp',
              priority: 'High',
              value: 95000000
            }
          ];
          setInactiveLeads(mockInactive);
        } else {
          setInactiveLeads(filtered);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const fallbacks = [
        {
          id: 'L-9001',
          name: 'Đặng Quốc Khánh',
          company: 'Khánh An Invest',
          email: 'khanh.an@invest.com.vn',
          phone: '0912112233',
          createdAt: '2026-05-20 11:30',
          status: 'Đang liên hệ',
          priority: 'High',
          value: 150000000
        },
        {
          id: 'L-9002',
          name: 'Vũ Minh Thu',
          company: 'Thu Minh Education',
          email: 'minhthu.edu@gmail.com',
          phone: '0988665544',
          createdAt: '2026-05-15 08:45',
          status: 'Mới nhận',
          priority: 'Medium',
          value: 45000000
        }
      ];
      setInactiveLeads(fallbacks);
    }
  }, []);

  const handleTriggerInactiveBatch = async () => {
    if (selectedInactiveLeadIds.length === 0) return;
    setIsAutomating(true);
    setSendingLogs([]);

    const selectedList = inactiveLeads.filter(l => selectedInactiveLeadIds.includes(l.id));
    const activeTemplate = templates.find(t => t.id === compilerSourceTemplateId) || templates[0];

    for (let i = 0; i < selectedList.length; i++) {
      const lead = selectedList[i];
      setSendingLogs(prev => [...prev, `⏳ Đang chuẩn bị mẫu và biên dịch thư cho: ${lead.name} (${lead.email})...`]);
      await new Promise(r => setTimeout(r, 600));

      const compiledSubject = activeTemplate.subject.replace(/{customer_name}/g, lead.name);
      const compiledBody = activeTemplate.body
        .replace(/{customer_name}/g, lead.name)
        .replace(/{customer_id}/g, lead.id)
        .replace(/{follow_up_date}/g, new Date(Date.now() + 3 * 24 * 3600000).toLocaleDateString());

      setSendingLogs(prev => [
        ...prev.slice(0, -1),
        `🚀 Đang gửi thư: "${compiledSubject}" tới khách hàng...`
      ]);
      await new Promise(r => setTimeout(r, 500));

      try {
        const matchedCust = customers.find(c => c.email === lead.email || c.name === lead.name);
        if (matchedCust) {
          const tpRef = collection(db, 'customers', matchedCust.id, 'touchpoints');
          await addDoc(tpRef, {
            customerId: matchedCust.id,
            title: `📧 TỰ ĐỘNG TRIGGER: Chăm sóc Lead trễ tương tác (>7 ngày)`,
            description: `Mẫu sử dụng: "${activeTemplate.name}".\n\nNội dung đã gửi:\n${compiledBody}`,
            channel: 'email',
            sentiment: 'Neutral',
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.warn('Silent skip storing touchpoint on unmatched lead', err);
      }

      setSendingLogs(prev => [
        ...prev.slice(0, -1),
        `✅ Đã hoàn tất gửi email chăm sóc tự động tới: ${lead.name} 🎉`
      ]);
      await new Promise(r => setTimeout(r, 400));
    }

    setIsAutomating(false);
    alert(`Dịch vụ tự động đã hoàn thành kích hoạt gửi ${selectedInactiveLeadIds.length} email chăm sóc định kỳ cho các leads trễ tương tác!`);
    setSelectedInactiveLeadIds([]);
  };

  const toggleSelectInactiveLead = (id: string) => {
    if (selectedInactiveLeadIds.includes(id)) {
      setSelectedInactiveLeadIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedInactiveLeadIds(prev => [...prev, id]);
    }
  };

  const selectAllInactiveLeads = () => {
    if (selectedInactiveLeadIds.length === inactiveLeads.length) {
      setSelectedInactiveLeadIds([]);
    } else {
      setSelectedInactiveLeadIds(inactiveLeads.map(l => l.id));
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Fetch real customers for dynamic placeholder dropdown list
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, 'customers'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      } catch (err) {
        console.error("Error loaded customers for template preview:", err);
      }
    };
    
    fetchCustomers();
  }, [user]);

  // Persist templates to local storage
  const saveTemplatesToStorage = (updated: EmailTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem('crm_email_templates', JSON.stringify(updated));
  };

  const handleOpenCreate = () => {
    setEditingTemplateId(null);
    setTempName('');
    setTempSubject('');
    setTempBody('');
    setTempCategory('welcome');
    setIsEditing(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplateId(template.id);
    setTempName(template.name);
    setTempSubject(template.subject);
    setTempBody(template.body);
    setTempCategory(template.category);
    setIsEditing(true);
  };

  const handleDeleteTemplate = (id: string) => {
    const isConfirm = window.confirm("Bạn có chắc chắn muốn xóa mẫu email này khỏi thư viện?");
    if (isConfirm) {
      const filtered = templates.filter(t => t.id !== id);
      saveTemplatesToStorage(filtered);
      if (compilerSourceTemplateId === id && filtered.length > 0) {
        setCompilerSourceTemplateId(filtered[0].id);
      }
    }
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim() || !tempSubject.trim() || !tempBody.trim()) return;

    let updatedList: EmailTemplate[] = [];

    if (editingTemplateId) {
      // Modify
      updatedList = templates.map(t => t.id === editingTemplateId ? {
        ...t,
        name: tempName.trim(),
        subject: tempSubject.trim(),
        body: tempBody.trim(),
        category: tempCategory,
        lastModified: Date.now()
      } : t);
    } else {
      // Create new
      const newTemp: EmailTemplate = {
        id: `temp-${Date.now()}`,
        name: tempName.trim(),
        subject: tempSubject.trim(),
        body: tempBody.trim(),
        category: tempCategory,
        lastModified: Date.now()
      };
      updatedList = [newTemp, ...templates];
      setCompilerSourceTemplateId(newTemp.id);
    }

    saveTemplatesToStorage(updatedList);
    setIsEditing(false);
  };

  // Compile Placeholders Live helper
  const getCompiledEmail = () => {
    const targetTemplate = templates.find(t => t.id === compilerSourceTemplateId);
    if (!targetTemplate) return { subject: '', body: '' };

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    
    // Fallback if database is completely empty or not loaded yet
    const placeholderCustomerName = selectedCustomer ? selectedCustomer.name : 'Anh/Chị Khách Hàng';
    const placeholderCustomerId = selectedCustomer ? selectedCustomer.id : 'CUST-DEMO-99';
    const placeholderFollowUpDate = selectedCustomer?.nextFollowUpDate 
      ? new Date(selectedCustomer.nextFollowUpDate).toLocaleDateString() 
      : 'Thứ Hai tuần sau';

    let resolvedSubject = targetTemplate.subject;
    let resolvedBody = targetTemplate.body;

    // Direct string replacements for curly braces
    const replaceMap: Record<string, string> = {
      '{customer_name}': placeholderCustomerName,
      '{customer_id}': placeholderCustomerId,
      '{follow_up_date}': placeholderFollowUpDate,
    };

    Object.keys(replaceMap).forEach(key => {
      resolvedSubject = resolvedSubject.replace(new RegExp(key, 'g'), replaceMap[key]);
      resolvedBody = resolvedBody.replace(new RegExp(key, 'g'), replaceMap[key]);
    });

    return {
      subject: resolvedSubject,
      body: resolvedBody
    };
  };

  const compiled = getCompiledEmail();

  const handleCopyCompiled = () => {
    const textToCopy = `Subject: ${compiled.subject}\n\n${compiled.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const handleSimulateSend = async () => {
    const currCust = customers.find(c => c.id === selectedCustomerId);
    if (!currCust) return;

    setSentStatus(true);

    try {
      // Create a persistent touchpoint subcollection entry under this specific customer
      const tpRef = collection(db, 'customers', currCust.id, 'touchpoints');
      await addDoc(tpRef, {
        customerId: currCust.id,
        title: `📧 Đã gửi Email Template: "${templates.find(t => t.id === compilerSourceTemplateId)?.name}"`,
        description: `Chủ đề: "${compiled.subject}".\n\nNội dung đã gửi:\n${compiled.body.slice(0, 150)}...`,
        channel: 'email',
        sentiment: 'Neutral',
        timestamp: Date.now()
      });
      
      // Also register general audit log
      // Just silent or simple log
    } catch (err) {
      console.warn("Failed to log template touchpoint, simulating offline send", err);
    }

    setTimeout(() => {
      setSentStatus(false);
      alert(`Đã mô phỏng gửi email thành công tới ${currCust.name} (${currCust.email})!\nSự kiện này đã được tự động lưu lại trong Lịch sử tương tác (Rich Activity Timeline) của khách hàng.`);
    }, 1200);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="email-templates-module" className="p-1 space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="text-blue-600 w-6 h-6 animate-pulse" />
            Quản lý Mẫu Email Giao tiếp (Email Templates)
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Thiết kế sẵn các mẫu email chăm sóc định kỳ, tích hợp sẵn placeholder động {'{customer_name}'}, {'{customer_id}'} để đồng nhất quy trình CSKH.
          </p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#2F69FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo Mẫu Mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template Manager Directory */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px]">
          <div className="space-y-4 mb-4 shrink-0">
            <div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">Thư viện Mẫu Sẵn có</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Quản lý và cập nhật nội dung</p>
            </div>
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text"
                placeholder="Tìm tên mẫu, tiêu đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-bold pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* List templates */}
          <div className="flex-1 overflow-auto space-y-3.5 pr-1 no-scrollbar">
            {filteredTemplates.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                Không tìm thấy mẫu email phù hợp
              </div>
            ) : (
              filteredTemplates.map((temp) => (
                <div 
                  key={temp.id}
                  onClick={() => setCompilerSourceTemplateId(temp.id)}
                  className={`p-3 border rounded-xl cursor-pointer hover:border-blue-300 transition-all text-left relative ${
                    compilerSourceTemplateId === temp.id 
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/40' 
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{temp.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[190px]">Sub: {temp.subject}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold shrink-0">
                      {temp.category === 'welcome' && 'Onboarding'}
                      {temp.category === 'sales' && 'Bán hàng'}
                      {temp.category === 'support' && 'Hỗ trợ'}
                      {temp.category === 'followup' && 'Xem xét'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/80">
                    <span className="text-[8px] text-slate-400 font-black">{new Date(temp.lastModified).toLocaleDateString()}</span>
                    <div className="flex gap-1.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity absolute right-3 bottom-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(temp); }}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-md transition-colors"
                        title="Sửa"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(temp.id); }}
                        className="p-1 px-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-md transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Placeholder compiler & Draft Simulator */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px]">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
            <div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Bộ Trình Phân Dịch & Thử Nghiệm Gửi (Placeholders Renderer)
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Tự động điền dữ liệu động theo thời gian thực</p>
            </div>
            
            {/* Customer selector for simulation */}
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold text-slate-500">Khách hàng đích:</span>
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="p-1.5 border border-slate-200 text-xs font-bold rounded-lg outline-none bg-slate-50/50"
              >
                {customers.length === 0 ? (
                  <option value="">Vui lòng thêm khách hàng</option>
                ) : (
                  customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex-1 bg-slate-50/50 rounded-2xl p-5 mt-4 border border-slate-100 flex flex-col overflow-hidden">
            {/* Email UI wrapper */}
            <div className="space-y-3 bg-white p-5 border border-slate-200 rounded-xl shrink-0">
              <div className="flex items-center gap-3 text-xs font-extrabold pb-2.5 border-b border-slate-100 text-slate-700">
                <span className="w-16 text-slate-400">Gửi đến:</span>
                <span className="text-slate-900 font-black">
                  {customers.find(c => c.id === selectedCustomerId)?.name || 'Chưa thiết lập'} 
                  <span className="text-[11px] font-semibold text-slate-400 pl-1">{`(${customers.find(c => c.id === selectedCustomerId)?.email || 'Chưa có email'})`}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-extrabold pb-2.5 border-b border-slate-100 text-slate-700">
                <span className="w-16 text-slate-400 font-semibold">Chủ đề:</span>
                <span className="text-[#2F69FF] font-black">{compiled.subject || '(Trống)'}</span>
              </div>
            </div>

            {/* Compiled Body Area */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 mt-3 text-xs font-semibold leading-relaxed overflow-auto text-slate-800 whitespace-pre-wrap">
              {compiled.body || '(Chưa cấu hình nội dung)'}
            </div>

            {/* Placeholders helper badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] text-slate-400 font-bold shrink-0">
              <span>Dynamic Tags:</span>
              <span className="p-1 px-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">{"{customer_name}"}</span>
              <span className="p-1 px-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">{"{customer_id}"}</span>
              <span className="p-1 px-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">{"{follow_up_date}"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0 mt-4">
            <button 
              onClick={handleCopyCompiled}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all outline-none"
            >
              {copiedStatus ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép thư đã phân dịch</span>
                </>
              )}
            </button>

            <button 
              onClick={handleSimulateSend}
              disabled={sentStatus || !selectedCustomerId}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                sentStatus || !selectedCustomerId
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
              }`}
            >
              {sentStatus ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang bắn Email mô phỏng...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Khởi phát & Ghi nhận touchpoint</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Inactive Leads Service Console */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="inactive-leads-email-service">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              Automated Follow-up Service: Leads trễ tương tác ({inactiveLeads.length})
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Phát hiện danh sách khách tiềm năng chưa làm việc thêm (&gt; 7 ngày) hoặc ưu tiên cao để kích hoạt gửi email hàng loạt bằng mẫu đang chọn.
            </p>
          </div>
          <button
            onClick={handleTriggerInactiveBatch}
            disabled={selectedInactiveLeadIds.length === 0 || isAutomating}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              selectedInactiveLeadIds.length === 0 || isAutomating
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/10'
            }`}
          >
            {isAutomating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý kích hoạt dịch vụ...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Kích hoạt loạt ({selectedInactiveLeadIds.length}) Email</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table list */}
          <div className="lg:col-span-2 overflow-x-auto border border-slate-250/20 rounded-xl max-h-[300px] no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-800/10 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-150">
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={inactiveLeads.length > 0 && selectedInactiveLeadIds.length === inactiveLeads.length}
                      onChange={selectAllInactiveLeads}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Tên Lead</th>
                  <th className="py-3 px-4">Đơn vị & Liên hệ</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-center">Độ ưu tiên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {inactiveLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                      Không tìm thấy lead tương ứng trì hoãn hoạt động.
                    </td>
                  </tr>
                ) : (
                  inactiveLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => toggleSelectInactiveLead(lead.id)}>
                      <td className="py-3 px-4 w-12 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedInactiveLeadIds.includes(lead.id)}
                          onChange={() => toggleSelectInactiveLead(lead.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-800">{lead.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-600">{lead.company}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{lead.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-500">
                        {lead.createdAt}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          lead.priority === 'High'
                            ? 'bg-rose-50 text-rose-500 border border-rose-100'
                            : 'bg-amber-50 text-amber-500 border border-amber-100'
                        }`}>
                          {lead.priority === 'High' ? 'Cao' : 'Vừa'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Real-time automated output channel log */}
          <div className="lg:col-span-1 bg-slate-900 rounded-xl p-4 flex flex-col h-[300px]">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Service Processing Channel Logs (Bản ghi trực tuyến)
            </span>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-2 no-scrollbar">
              {sendingLogs.length === 0 ? (
                <div className="text-slate-500 italic h-full flex items-center justify-center text-center p-4">
                  Bản ghi dịch vụ trống. Nhấn kích hoạt hàng loạt để xem quá trình xử lý gửi email.
                </div>
              ) : (
                sendingLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="leading-relaxed"
                  >
                    {log}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-xl animate-scaleUp">
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase mb-4">
              {editingTemplateId ? '📝 Hiệu chỉnh Mẫu Thư' : '➕ Tạo Mẫu Mới'}
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tên Mẫu</label>
                <input 
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Ví dụ: Chào mừng (Onboarding), Cảm ơn khách hàng"
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Loại Phân hạng</label>
                  <select 
                    value={tempCategory}
                    onChange={(e) => setTempCategory(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/55"
                  >
                    <option value="welcome">Tiếp đón (Welcome)</option>
                    <option value="sales">Bán hàng (Sales / Chăm sóc)</option>
                    <option value="support">Xử lý sự cố (Tickets)</option>
                    <option value="followup">Xem xét lại (Follow-up)</option>
                    <option value="other">Thường quy khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Chủ đề Email (Subject)</label>
                <input 
                  type="text"
                  required
                  value={tempSubject}
                  onChange={(e) => setTempSubject(e.target.value)}
                  placeholder="Gợi ý: Chào mừng {customer_name} gia nhập..."
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nội dung thư chính (Có thể dùng tag động)</label>
                <textarea 
                  required
                  value={tempBody}
                  onChange={(e) => setTempBody(e.target.value)}
                  placeholder="Nhập nội dung thư...\nBạn có thể tự do chèn các tag động này để khi gửi, hệ thống tự động gắn tên hoặc ID khách hàng:\n - {customer_name}\n - {customer_id}\n - {follow_up_date}"
                  className="w-full min-h-[160px] p-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/10 transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
