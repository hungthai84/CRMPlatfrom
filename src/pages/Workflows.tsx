import { useState, useEffect } from 'react';
import { 
  Workflow, Play, Sparkles, CheckCircle2, ChevronRight, Zap, 
  Plus, Settings2, ShieldCheck, Mail, Send, AlertTriangle, Lightbulb, Trash2
} from 'lucide-react';
import { 
  getAutomationRules, 
  saveAutomationRules, 
  getTemplates, 
  getAutomationLogs, 
  EmailAutomationRule, 
  STAGES_TRANSLATION 
} from '../lib/emailAutomation';

interface Rule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  isActive: boolean;
  aiPowered: boolean;
  description: string;
}

const DEFAULT_RULES: Rule[] = [
  {
    id: 'R-1',
    name: 'Tự động soạn thảo thư trả lời khi tiếp nhận Ticket',
    trigger: 'Có Ticket hỗ trợ mới',
    condition: 'Mức độ ưu tiên: Khẩn cấp / Cao',
    action: 'Dịch thuật & Soạn mẫu email phản hồi tự động',
    isActive: true,
    aiPowered: true,
    description: 'Sử dụng Gemini phân tích tiêu đề khiếu nại, tự soạn thảo email phản hồi trấn an cá nhân hoá chỉ sau 5 giây.'
  },
  {
    id: 'R-2',
    name: 'Chuyển cấp báo động rủi ro rời đi của KH vip',
    trigger: 'Mức độ Churn Risk đổi sang High',
    condition: 'Hạng thẻ: Platinum hoặc Diamond',
    action: 'Cảnh báo Đa kênh & Ghi chú nhắc lịch khẩn',
    isActive: true,
    aiPowered: false,
    description: 'Khi phát hiện VIP suy giảm tương tác, tự động phân phối nhiệm vụ chăm sóc đặc biệt cho Trưởng phòng CSKH.'
  },
  {
    id: 'R-3',
    name: 'Tự động gửi Thư tri ân Tri Thức mới',
    trigger: 'Hoàn thành khảo sát thực tế',
    condition: 'Điểm hài lòng (NPS) >= 9/10',
    action: 'Tặng điểm Zalo Loyalty & Email khuyến nghị',
    isActive: false,
    aiPowered: true,
    description: 'Thưởng 200 điểm Loyalty tự động và dùng AI sinh gợi ý sản phẩm bán thêm (upsell) gửi qua Zalo OA.'
  },
];

export function Workflows() {
  const [activeTab, setActiveTab] = useState<'ai' | 'email'>('ai');
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'text' | 'simulate'>('text');

  // Trigger-based email automation states
  const [emailRules, setEmailRules] = useState<EmailAutomationRule[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);

  // New email rule form states
  const [newEmailRuleName, setNewEmailRuleName] = useState('');
  const [triggerStage, setTriggerStage] = useState<'Awareness' | 'Consideration' | 'Purchase' | 'Retention' | 'Loyalty'>('Awareness');
  const [targetTemplateId, setTargetTemplateId] = useState('');

  // Loaded once on mount
  useEffect(() => {
    setEmailRules(getAutomationRules());
    const temps = getTemplates();
    setAvailableTemplates(temps);
    if (temps.length > 0) {
      setTargetTemplateId(temps[0].id);
    }
    setAutomationLogs(getAutomationLogs());
  }, []);

  // Update logs when triggered
  const refreshAutomationLogs = () => {
    setAutomationLogs(getAutomationLogs());
  };

  const handleToggleEmailRule = (id: string) => {
    const updated = emailRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setEmailRules(updated);
    saveAutomationRules(updated);
    addLog(`Đã thay đổi trạng thái quy tắc gửi thư tự động: "${updated.find(r => r.id === id)?.name}"`);
  };

  const handleDeleteEmailRule = (id: string) => {
    const removing = emailRules.find(r => r.id === id);
    const updated = emailRules.filter(r => r.id !== id);
    setEmailRules(updated);
    saveAutomationRules(updated);
    if (removing) {
      addLog(`Đã xóa quy tắc gửi email tự động: "${removing.name}"`);
    }
  };

  const handleCreateEmailRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailRuleName.trim() || !targetTemplateId) return;

    const newRule: EmailAutomationRule = {
      id: `ar-${Date.now()}`,
      name: newEmailRuleName.trim(),
      triggerStage,
      templateId: targetTemplateId,
      isActive: true,
      createdAt: Date.now()
    };

    const updated = [newRule, ...emailRules];
    setEmailRules(updated);
    saveAutomationRules(updated);
    setNewEmailRuleName('');
    addLog(`Đã tạo quy tắc gửi email tự động mới: "${newRule.name}"`);
  };
  
  // Custom Flow Composer States
  const [flowName, setFlowName] = useState('');
  const [flowTrigger, setFlowTrigger] = useState('New Lead Registered');
  const [flowCondition, setFlowCondition] = useState('Lead score > 70');
  const [flowAction, setFlowAction] = useState('Generate AI Outreach draft');
  const [isAiPowered, setIsAiPowered] = useState(true);
  const [flowDesc, setFlowDesc] = useState('');

  // Playground States
  const [rawText, setRawText] = useState(
    "Chào công ty, gói dịch vụ eLearning bên mình cho 15 nhân sự sắp hết hạn vào tuần tới. Chúng tôi muốn xem xét báo giá gia hạn kèm theo ưu đãi nâng cấp lên tính năng họp trực tuyến HD trực tiếp."
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    sentiment: 'Happy' | 'Neutral' | 'Frustrated';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    draftResponse: string;
    nextBestAction: string;
  } | null>(null);

  // Workflow System Log States
  const [logs, setLogs] = useState<string[]>([
    "[14:30] Khởi tạo Engine Quy trình AI Power-CRM thành công.",
    "[14:31] Quy trình [R-1] đã tự động phản hồi 1 ticket của Phan Thanh Thảo.",
    "[15:02] Trình lắng nghe (Webhook) nhận diện sự kiện đồng bộ từ Zalo ZNS."
  ]);

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    addLog(`Quy trình [${id}] đã được ${rules.find(r => r.id === id)?.isActive ? 'tạm dừng' : 'kích hoạt lại'}.`);
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim()) return;

    const newRule: Rule = {
      id: `R-${Date.now().toString().slice(-4)}`,
      name: flowName.trim(),
      trigger: flowTrigger,
      condition: flowCondition,
      action: flowAction,
      isActive: true,
      aiPowered: isAiPowered,
      description: flowDesc || 'Quy trình tự động hóa được thiết lập riêng nhằm thúc đẩy năng suất dịch vụ.'
    };

    setRules([newRule, ...rules]);
    addLog(`Đã biên dịch thành công Quy trình nghiệp vụ mới: "${flowName}"`);
    
    // Reset form
    setFlowName('');
    setFlowDesc('');
    setIsAiPowered(true);
  };

  const handleTriggerSimulation = async () => {
    if (!rawText.trim()) return;
    setIsSimulating(true);
    addLog("Đang kích hoạt quy trình mô phỏng thông minh...");

    try {
      // We will make a call to our existing server backend chat-proxy
      // We shape the prompt to return custom CRM analysis step as requested by AI & Process Module
      const promptText = `
      You are analyzing an inbound customer message inside an enterprise CRM workflow.
      Raw message text: "${rawText}"
      
      Respond with a JSON block containing these exact keys:
      - sentiment: strictly one of "Happy", "Neutral", "Frustrated"
      - priority: strictly one of "Low", "Medium", "High", "Urgent"
      - draftResponse: a formal, beautifully written reply email in Vietnamese, greeting them, thanking them, mentioning their concern, and reassuring that their account manager will call them shortly. Keep it within 3-4 neat sentences.
      - nextBestAction: a strategic next-step recommendation for the CS team.

      Provide ONLY valid JSON data output without any markdown wrapping (no \`\`\`json block).
      `;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          context: 'CRM Workflow Engine'
        })
      });

      const resData = await response.json();
      
      if (resData.error) {
        throw new Error(resData.error);
      }

      // Parse JSON from text carefully
      let textOutput = resData.text || '';
      // Strip markdown code block wrappers if model ignores advice
      textOutput = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(textOutput);
      setSimulationResult({
        sentiment: parsed.sentiment || 'Neutral',
        priority: parsed.priority || 'Medium',
        draftResponse: parsed.draftResponse || 'Xin lỗi chúng tôi chưa thể soạn thảo lúc này. Bộ phận hỗ trợ đã được thông báo.',
        nextBestAction: parsed.nextBestAction || 'Liên hệ trực tiếp qua số hotline bàn giao hợp đồng.'
      });

      addLog("Khớp thành công Quy trình [R-1]: Đã sinh mẫu thư phản hồi và phân tích độ khẩn.");
    } catch (err) {
      console.error("Simulation failed, falling back to local simulation:", err);
      // Fallback
      setSimulationResult({
        sentiment: 'Neutral',
        priority: 'High',
        draftResponse: `Kính gửi Quý khách hàng,\n\nChúng tôi đã nhận được thông tin phản hồi của quý khách về nhu cầu gia hạn và nâng cấp dịch vụ. Chuyên viên chăm sóc khách hàng VIP sẽ gửi báo giá chi tiết và kết nối hỗ trợ trong vòng 15 phút tới.\n\nTrân trọng,\nĐội ngũ CSKH Power Service CRM.`,
        nextBestAction: 'Trích xuất báo giá gói VIP eLearning và gọi trực tiếp tư vấn trong buổi sáng.'
      });
      addLog("Kích hoạt Quy trình [R-1] (Chế độ Phục hồi Ngoại tuyến): Khớp thành công.");
    } finally {
      setIsSimulating(false);
    }
  };

  const getSentimentBadge = (sent: string) => {
    switch (sent) {
      case 'Happy': return 'bg-emerald-100 text-emerald-700 border-emerald-250';
      case 'Frustrated': return 'bg-rose-100 text-rose-700 border-rose-250 animate-pulse';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (pri: string) => {
    switch (pri) {
      case 'Urgent': return 'bg-rose-600 text-white font-black';
      case 'High': return 'bg-orange-500 text-white font-extrabold';
      case 'Medium': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div id="ai-workflows-automation-module" className="p-1 space-y-6">
      {/* Module Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Workflow className="text-violet-600 w-6 h-6 animate-spin-slow" />
            AI & Thiết kế Quy trình tự động hoá
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Ứng dụng sức mạnh của Gemini để tự động hóa xử lý yêu cầu, đo lường tâm trạng và tăng tốc thời gian phản hồi khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini-3.5-Flash Active</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'border-violet-600 text-violet-750 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Zap size={14} />
          Quy trình AI tự động
        </button>
        <button
          onClick={() => {
            setActiveTab('email');
            refreshAutomationLogs();
          }}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'email'
              ? 'border-violet-600 text-violet-750 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Mail size={14} />
          Tự động gửi Thư (Lifecycle Stages)
        </button>
      </div>

      {activeTab === 'ai' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Workflow configurations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Rules List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Kịch bản kích hoạt tự động (Triggers & Actions)</h3>
                <p className="text-[11px] text-slate-500 font-medium">Bật/tắt các tác vụ tự động hóa CRM</p>
              </div>
            </div>

            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className={`p-4 border rounded-xl transition-all ${rule.isActive ? 'bg-white border-slate-200' : 'bg-slate-50/50 border-slate-100/80 opacity-60'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{rule.id}</span>
                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{rule.name}</h4>
                        {rule.aiPowered && (
                          <span className="flex items-center gap-0.5 text-[8px] font-extrabold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full border border-violet-200 uppercase">
                            <Sparkles className="w-2 h-2" />
                            Artificial Intelligence
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-normal mt-1">{rule.description}</p>
                    </div>

                    {/* Simple toggle switch */}
                    <button 
                      onClick={() => handleToggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${rule.isActive ? 'bg-violet-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rule.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center md:items-baseline gap-1.5 flex-wrap text-[10px] text-slate-500 font-semibold md:gap-4">
                    <span className="flex items-center gap-1">
                      <strong className="text-slate-800 font-extrabold">Khi gặp:</strong> {rule.trigger}
                    </span>
                    <ChevronRight size={10} className="text-slate-300 pointer-events-none" />
                    <span className="flex items-center gap-1">
                      <strong className="text-slate-800 font-extrabold">Thỏa mãn:</strong> {rule.condition}
                    </span>
                    <ChevronRight size={10} className="text-slate-300 pointer-events-none" />
                    <span className="flex items-center gap-1 text-violet-650 bg-violet-50 px-2 py-0.5 rounded-full font-bold">
                      <strong className="text-violet-700 font-black">Chạy:</strong> {rule.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Rule Composer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase mb-4 flex items-center gap-1">
              <Plus className="w-4 h-4 text-violet-600" />
              Thiết kế Kịch bản mới (Workflow Composer)
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tên quy định nghiệp vụ</label>
                  <input 
                    type="text"
                    required
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="VD: Auto-escalate VIP tickets quá 2 giờ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Cấp độ thông minh</label>
                  <div className="flex items-center gap-4 h-10">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isAiPowered}
                        onChange={(e) => setIsAiPowered(e.target.checked)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4 h-4"
                      />
                      Ủy thác AI phân tích (Gemini)
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Điều kiện kích hoạt (Trigger)</label>
                  <select 
                    value={flowTrigger}
                    onChange={(e) => setFlowTrigger(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50/50 focus:outline-none"
                  >
                    <option value="Có Ticket hỗ trợ mới">Có Ticket hỗ trợ mới</option>
                    <option value="Mức độ Churn Risk đổi">Mức độ Churn Risk thay đổi</option>
                    <option value="Lead đăng ký mới">Khách hàng mới Lưu danh</option>
                    <option value="Lịch hẹn Follow-up sắp đến">Đến hạn Lịch hẹn chăm sóc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nguyên lý thoả mãn (Condition)</label>
                  <select 
                    value={flowCondition}
                    onChange={(e) => setFlowCondition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50/50 focus:outline-none"
                  >
                    <option value="Hạng thẻ: Platinum hoặc Diamond">Hạng: Platinum & Diamond</option>
                    <option value="Bất kỳ phân hạng nào">Mọi thứ (Áp dụng chung)</option>
                    <option value="Đánh giá NPS thấp hơn 5/10">NPS &lt; 5 (Khách hàng giận dữ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Hành động tự động (Action)</label>
                  <select 
                    value={flowAction}
                    onChange={(e) => setFlowAction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50/50 focus:outline-none"
                  >
                    <option value="Soạn thư tri ân / xin lỗi tự động qua AI">Nhờ AI soạn thảo email ứng biến</option>
                    <option value="Cảnh báo đa kênh CSKH khẩn cấp">Báo động kênh Slack/Omnichannel</option>
                    <option value="Tự động gia hạn thẻ ưu đãi">Trích xuất điểm tri ân & gia hạn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Mô tả ngắn gọn về quy trình</label>
                <textarea 
                  value={flowDesc}
                  onChange={(e) => setFlowDesc(e.target.value)}
                  placeholder="Giúp quản trị viên nắm rõ vì sao thiết kế quy trình tự động này..."
                  className="w-full min-h-[50px] p-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none bg-slate-50/50 resize-y"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-md shadow-violet-600/15 flex items-center gap-1.5 transition-all"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  Triển khai Kịch bản
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Columns - Playground and Execution Logs */}
        <div className="space-y-6">
          {/* Playground Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-white">
              <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 leading-none">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Mô phỏng Xử lý Thư của AI
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Gửi nội dung bất kỳ và quan sát Gemini tự khớp quy định</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Văn bản mô phỏng nhận vào (Ví dụ: Email Khiếu nại, Chat)</label>
                <textarea 
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full min-h-[96px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y text-slate-800"
                />
              </div>

              <button 
                onClick={handleTriggerSimulation}
                disabled={isSimulating || !rawText.trim()}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isSimulating 
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-600/10'
                }`}
              >
                {isSimulating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
                    <span>AI đang phân tách lớp nghĩa...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Chạy thử nghiệm với Gemini</span>
                  </>
                )}
              </button>

              {/* Simulation Result Displays */}
              {simulationResult && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3.5 animate-fadeIn">
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Tâm trạng (AI Sentiment)</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border inline-block ${getSentimentBadge(simulationResult.sentiment)}`}>
                        {simulationResult.sentiment === 'Happy' ? '😊 Vui vẻ / Hài lòng' : simulationResult.sentiment === 'Frustrated' ? '😡 Giận dữ / Buồn bực' : '😐 Bình thường'}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-right">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Độ khẩn SLA khuyến cáo</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block uppercase tracking-wider ${getPriorityBadge(simulationResult.priority)}`}>
                        {simulationResult.priority}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phản hồi tự soạn (AI Gmail Draft)</span>
                    <div className="text-[11px] font-semibold text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap">
                      {simulationResult.draftResponse}
                    </div>
                  </div>

                  <div className="p-2.5 bg-violet-50 rounded-lg border border-violet-100 flex gap-2 items-start">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-black text-violet-700 uppercase tracking-widest">AI Next Best Action</span>
                      <p className="text-[10px] text-violet-955 font-bold leading-normal">{simulationResult.nextBestAction}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Realtime Execution logs */}
          <div className="bg-slate-900 rounded-2xl p-5 shadow-sm text-slate-300 font-mono text-[10px] flex flex-col h-64 border border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3 shrink-0">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                Workflow Logs (Báo động sống)
              </span>
              <button 
                onClick={() => setLogs([])}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="flex-1 overflow-auto space-y-1.5 pr-1 no-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600">
                  Chưa ghi nhận hoạt động kích hoạt nào
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed font-semibold">
                    <span className="text-blue-600">&gt;</span> {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Rules List & Composer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Email Rules List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Kịch bản Kích hoạt Email tự động (Auto-Email Triggers)</h3>
                <p className="text-[11px] text-slate-500 font-medium">Tự động gửi email đã soạn sẵn cho khách hàng dựa trên chuyển đổi giai đoạn hành trình.</p>
              </div>

              <div className="space-y-4 mt-6">
                {emailRules.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl">
                    Chưa có quy tắc gửi thư tự động nào được thiết lập. Hãy thêm mới bên dưới!
                  </div>
                ) : (
                  emailRules.map((rule) => {
                    const linkedTemplate = availableTemplates.find(t => t.id === rule.templateId);
                    return (
                      <div key={rule.id} className={`p-4 border rounded-xl transition-all ${rule.isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-65'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded border border-violet-100">{rule.id}</span>
                              <h4 className="text-xs font-bold text-slate-900 leading-tight">{rule.name}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-normal mt-1.5">
                              Kích hoạt khi chuyển sang giai đoạn: <strong className="text-slate-800 font-bold">{STAGES_TRANSLATION[rule.triggerStage] || rule.triggerStage}</strong>
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium leading-normal">
                              Mẫu email gửi đi: <strong className="text-violet-750 font-bold">{linkedTemplate ? linkedTemplate.name : 'Chưa định nghĩa'}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Toggle checkbox */}
                            <button 
                              onClick={() => handleToggleEmailRule(rule.id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${rule.isActive ? 'bg-violet-600' : 'bg-slate-200'}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rule.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteEmailRule(rule.id)}
                              className="p-1.5 text-xs text-red-600 hover:text-red-750 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors"
                              title="Xoá luật này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Email Rule Composer */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Plus className="w-4 h-4 text-violet-600" />
                Thiết kế luật gửi Email mới (Email Automation Composer)
              </h3>

              <form onSubmit={handleCreateEmailRule} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tên Quy tắc / Mô tả luật</label>
                  <input 
                    type="text"
                    required
                    value={newEmailRuleName}
                    onChange={(e) => setNewEmailRuleName(e.target.value)}
                    placeholder="VD: Gửi Thư chào mừng Onboarding khi KH bước vào giai đoạn Nhận thức"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Giai đoạn hành trình kích hoạt (Trigger stage transition)</label>
                    <select 
                      value={triggerStage}
                      onChange={(e) => setTriggerStage(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white border border-slate-200 focus:outline-none"
                    >
                      <option value="Awareness">Nhận thức (Awareness)</option>
                      <option value="Consideration">Cân nhắc (Consideration)</option>
                      <option value="Purchase">Mua hàng (Purchase)</option>
                      <option value="Retention">Duy trì (Retention)</option>
                      <option value="Loyalty">Khách hàng thân thiết (Loyalty)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Mẫu Email gửi tự động (Linked Email Template)</label>
                    <select 
                      value={targetTemplateId}
                      onChange={(e) => setTargetTemplateId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white border border-slate-200 focus:outline-none"
                    >
                      {availableTemplates.length === 0 ? (
                        <option value="">(Chưa cấu hình mẫu thư)</option>
                      ) : (
                        availableTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))
                      )}
                    </select>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">Các tag động như {'{customer_name}'} sẽ tự động phân giải khi gửi.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-md shadow-violet-600/15 flex items-center gap-1.5 transition-all"
                  >
                    <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                    Kích hoạt Quy tắc này
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Automated History Audit Log */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-5 shadow-sm text-slate-300 font-mono text-[10px] flex flex-col h-[520px] border border-slate-800">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4 shrink-0">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  Nhật ký Gửi thư Tự động
                </span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('crm_automation_logs');
                    setAutomationLogs([]);
                  }}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear Logs
                </button>
              </div>
              
              <div className="flex-1 overflow-auto space-y-3.5 pr-1 no-scrollbar text-xs font-sans">
                {automationLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic text-center p-6 text-[11px] leading-normal">
                    Chưa có email tự động nào được kích hoạt gửi đi. Hãy thử thay đổi giai đoạn hành trình của khách hàng ở trang 'Hành trình' để kích hoạt luật tự động!
                  </div>
                ) : (
                  automationLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-900 pb-1.5 flex-wrap gap-1">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="text-[9px] text-emerald-450 font-black tracking-wide uppercase px-1.5 bg-emerald-950/40 border border-emerald-900/60">{log.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-200 font-bold mt-1">Luật: {log.ruleName}</p>
                      <p className="text-[10.5px] text-slate-400">KH: <strong className="text-slate-300">{log.customerName}</strong> ({log.customerEmail})</p>
                      <p className="text-[10px] text-emerald-400 font-bold leading-normal">Gửi mẫu: {log.templateName}</p>
                      <p className="text-[10px] text-sky-400 truncate mt-0.5 font-semibold">Sub: {log.subject}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
