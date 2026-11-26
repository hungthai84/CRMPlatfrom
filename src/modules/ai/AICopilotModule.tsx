import React, { useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  FileText,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { callCrmCopilot, CopilotRequest, CopilotResponse } from '../../services/aiClient';
import { Button, Select, StatusLabel, Textarea } from '../../components/ui/Primitives';

interface AiLogEntry {
  id: string;
  taskType: CopilotRequest['taskType'];
  prompt: string;
  response: CopilotResponse;
  executedAt: number;
  confirmedAction?: boolean;
}

const SCOPE_OPTIONS = [
  { id: 'customers', label: 'Khách hàng 360°' },
  { id: 'leads', label: 'Khách tiềm năng (Leads)' },
  { id: 'sales', label: 'Cơ hội & Pipeline' },
  { id: 'service', label: 'Ticket & SLA' },
  { id: 'omnichannel', label: 'Hộp thư Đa kênh' },
  { id: 'products', label: 'Đơn hàng & Hợp đồng' },
];

export const AICopilotModule: React.FC = () => {
  const { activeRole, can } = useAuth();
  const {
    customers,
    leads,
    deals,
    tickets,
    orders,
    contracts,
    conversations,
    kpis,
    formatMoney,
    createTask,
    logAudit,
  } = useCRM();
  const { language } = useTheme();
  const { addToast } = useToast();

  const [taskType, setTaskType] = useState<CopilotRequest['taskType']>('chat');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [allowedModules, setAllowedModules] = useState<string[]>([
    'customers',
    'leads',
    'sales',
    'service',
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AiLogEntry[]>([]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const buildContextSummary = () => {
    const parts: string[] = [];
    parts.push(
      `Tổng quan KPI hiện tại: ${kpis.totalCustomers} khách hàng (${kpis.activeCustomers} hoạt động), ${kpis.totalLeads} Lead (tỷ lệ chuyển đổi ${kpis.leadConversionRate}%), ${kpis.openDeals} cơ hội mở tổng ${formatMoney(kpis.pipelineValue)}, doanh thu thắng ${formatMoney(kpis.wonRevenue)}, ${kpis.openTickets} Ticket mở (${kpis.overdueTickets} quá hạn SLA), SLA đạt ${kpis.slaCompliance}%.`
    );

    if (selectedCustomer) {
      const custDeals = deals.filter((d) => d.customerId === selectedCustomer.id);
      const custTickets = tickets.filter((t) => t.customerId === selectedCustomer.id);
      const custOrders = orders.filter((o) => o.customerId === selectedCustomer.id);
      const custContracts = contracts.filter((c) => c.customerId === selectedCustomer.id);
      parts.push(
        `Khách hàng đang chọn: ${selectedCustomer.code} - ${selectedCustomer.name} (${selectedCustomer.segment}, LTV: ${formatMoney(selectedCustomer.lifetimeValue)}, HealthScore: ${selectedCustomer.healthScore}/100, AI Consent: ${selectedCustomer.consent?.aiProcessing ? 'Đã đồng ý' : 'Chưa đồng ý'}).`
      );
      parts.push(
        `Liên kết KH: ${custDeals.length} cơ hội, ${custOrders.length} đơn hàng, ${custContracts.length} hợp đồng, ${custTickets.length} ticket.`
      );
    }

    if (allowedModules.includes('leads')) {
      const topLeads = leads.slice(0, 5).map((l) => `${l.code} ${l.name} (${l.status}, điểm ${l.score})`).join('; ');
      parts.push(`Top Lead: ${topLeads}`);
    }
    if (allowedModules.includes('service')) {
      const urgent = tickets
        .filter((t) => t.status !== 'Resolved' && t.status !== 'Closed')
        .slice(0, 5)
        .map((t) => `${t.code} "${t.title}" [${t.priority}]`)
        .join('; ');
      parts.push(`Ticket đang xử lý: ${urgent || 'Không có'}`);
    }
    if (allowedModules.includes('omnichannel')) {
      const openConv = conversations
        .slice(0, 3)
        .map((c) => `${c.customerName} (${c.channel}): ${c.lastMessage}`)
        .join(' | ');
      parts.push(`Hội thoại gần đây: ${openConv || 'Trống'}`);
    }
    return parts.join('\n');
  };

  const handleRunCopilot = async (customPrompt?: string) => {
    const finalPrompt = (customPrompt ?? prompt).trim();
    if (!finalPrompt) return;

    if (selectedCustomer && !selectedCustomer.consent?.aiProcessing) {
      addToast(
        'Hạn chế xử lý AI (VN PDPL)',
        `Khách hàng ${selectedCustomer.name} chưa cấp quyền AI Processing. Hãy bật đồng ý trong Hồ sơ 360° hoặc chọn phạm vi tổng hợp.`,
        'warning'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await callCrmCopilot({
        prompt: finalPrompt,
        taskType,
        contextSummary: buildContextSummary(),
        allowedModules,
        language,
        userRole: activeRole,
      });

      const entry: AiLogEntry = {
        id: `ai_${Date.now()}`,
        taskType,
        prompt: finalPrompt,
        response: res,
        executedAt: Date.now(),
      };
      setLogs((prev) => [entry, ...prev]);
      if (!customPrompt) setPrompt('');
      await logAudit('RUN_AI_COPILOT', 'ai', `Thực thi AI Copilot (${taskType}): ${finalPrompt.slice(0, 80)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi gọi Gemini AI Copilot.';
      addToast('Không thể thực thi AI Copilot', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWriteAction = async (entryId: string) => {
    const entry = logs.find((l) => l.id === entryId);
    const action = entry?.response.proposedWriteAction;
    if (!entry || !action || action.actionType === 'none') return;

    if (!can('tasks', 'create')) {
      addToast('Không đủ quyền', 'Vai trò hiện tại không có quyền tạo công việc.', 'error');
      return;
    }

    await createTask({
      title: action.title || 'Công việc từ AI Copilot',
      description: action.description || entry.response.answer.slice(0, 300),
      priority: 'high',
      type: 'follow_up',
      linkedType: selectedCustomer ? 'customer' : undefined,
      linkedId: selectedCustomer?.id,
      linkedName: selectedCustomer?.name,
    });
    setLogs((prev) => prev.map((l) => (l.id === entryId ? { ...l, confirmedAction: true } : l)));
    addToast('Đã ghi nhận hành động vào CRM', `Đã tạo công việc "${action.title}" trên Cloud Firestore.`, 'success');
  };

  const toggleScope = (mod: string) => {
    setAllowedModules((prev) => (prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#1951fc] dark:text-[#22c7e8]" />
            11. Trung tâm AI Copilot (Server-side Gemini)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân tích ngữ cảnh khách hàng, tóm tắt hội thoại, soạn thảo email, đề xuất hành động có xác nhận trước khi ghi.
          </p>
        </div>
        <StatusLabel tone="info" text="Gemini Server Proxy · RBAC Scoped" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Context & Scope Governance */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Cấu hình Ngữ cảnh & Phạm vi</h2>

          <Select
            label="Chế độ tác vụ AI"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as CopilotRequest['taskType'])}
          >
            <option value="chat">Hỏi đáp Nghiệp vụ CRM</option>
            <option value="customer_summary">Tóm tắt Hồ sơ Khách hàng 360°</option>
            <option value="conversation_summary">Tóm tắt Hội thoại & Cảm xúc</option>
            <option value="email_draft">Soạn thảo Email / Phản hồi CSKH</option>
            <option value="lead_scoring">Đánh giá & Chấm điểm Lead</option>
            <option value="report_insight">Phân tích Chỉ số & Dự báo BI</option>
            <option value="workflow_suggestion">Gợi ý Tự động hóa Workflow</option>
          </Select>

          <Select
            label="Ngữ cảnh Khách hàng cụ thể (Tùy chọn)"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">-- Toàn bộ không gian làm việc --</option>
            {customers
              .filter((c) => c.status !== 'archived')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name} ({c.consent?.aiProcessing ? 'Cho phép AI' : 'Chặn AI'})
                </option>
              ))}
          </Select>

          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phạm vi phân hệ AI được đọc
            </p>
            <div className="space-y-1.5">
              {SCOPE_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedModules.includes(opt.id)}
                    onChange={() => toggleScope(opt.id)}
                    className="rounded border-slate-300 text-[#1951fc]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-medium text-slate-500">Gợi ý lệnh nhanh</p>
            <div className="flex flex-col gap-1.5">
              {[
                'Phân tích các cơ hội bán hàng có nguy cơ chậm chốt và đề xuất hành động.',
                'Tóm tắt tình hình SLA các Ticket khẩn cấp hiện tại và cách phân bổ.',
                'Soạn email chăm sóc nhắc gia hạn hợp đồng chuyên nghiệp bằng tiếng Việt.',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleRunCopilot(q)}
                  disabled={loading}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-slate-100/80 dark:bg-slate-800/70 hover:bg-[#1951fc]/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Prompt Composer & Structured Output Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-3">
            <Textarea
              label="Yêu cầu cho AI Copilot"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Đánh giá rủi ro rời bỏ của khách hàng này và đề xuất công việc chăm sóc..."
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Mọi thao tác ghi dữ liệu CRM do AI đề xuất đều yêu cầu xác nhận thủ công.
              </span>
              <Button disabled={loading || !prompt.trim()} onClick={() => handleRunCopilot()}>
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Đang phân tích...' : 'Gửi yêu cầu AI'}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="glass-card rounded-xl p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#1951fc] dark:text-[#22c7e8]" />
                Chọn ngữ cảnh bên trái và nhập câu hỏi để AI Copilot phân tích dữ liệu CRM thực của bạn.
              </div>
            ) : (
              logs.map((entry) => (
                <div key={entry.id} className="glass-card rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-mono">{entry.taskType}</span>
                    <span className="tabular-nums">{new Date(entry.executedAt).toLocaleTimeString('vi-VN')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.prompt}</p>
                  <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-slate-50/80 dark:bg-slate-900/50 rounded-lg p-3.5">
                    {entry.response.answer}
                  </div>

                  {entry.response.sourcesUsed?.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#1951fc]" />
                      <span>Nguồn trích dẫn: {entry.response.sourcesUsed.join(' · ')}</span>
                    </div>
                  )}

                  {entry.response.suggestedActions?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bước tiếp theo đề xuất:</p>
                      <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        {entry.response.suggestedActions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.response.proposedWriteAction && entry.response.proposedWriteAction.actionType !== 'none' && (
                    <div className="p-3.5 rounded-xl border border-[#1951fc]/30 bg-[#1951fc]/5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[#1951fc] dark:text-[#22c7e8]">
                          Đề xuất ghi dữ liệu CRM: {entry.response.proposedWriteAction.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {entry.response.proposedWriteAction.description}
                        </p>
                      </div>
                      {entry.confirmedAction ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" /> Đã thực thi
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => handleConfirmWriteAction(entry.id)}>
                          Xác nhận tạo Công việc
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FloatingAiDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { activeRole } = useAuth();
  const { kpis, formatMoney, createTask } = useCRM();
  const { language } = useTheme();
  const { addToast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<CopilotResponse | null>(null);

  if (!open) return null;

  const askQuick = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await callCrmCopilot({
        prompt,
        taskType: 'chat',
        contextSummary: `Pipeline: ${formatMoney(kpis.pipelineValue)} (${kpis.openDeals} deals). Won: ${formatMoney(kpis.wonRevenue)}. Open Tickets: ${kpis.openTickets}, Overdue SLA: ${kpis.overdueTickets}. Pending Tasks: ${kpis.pendingTasks}.`,
        allowedModules: ['dashboard', 'sales', 'service', 'tasks'],
        language,
        userRole: activeRole,
      });
      setReply(res);
    } catch (err: unknown) {
      addToast('Lỗi AI Copilot', err instanceof Error ? err.message : 'Không kết nối được Gemini.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 z-[75] w-full max-w-md bg-white dark:bg-[#0f2142] border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col">
      <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#1951fc] dark:text-[#22c7e8]" />
          Trợ lý AI Copilot Nhanh
        </span>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
        <Textarea
          label="Câu hỏi nhanh"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Hỏi về KPI, chiến lược chốt đơn hoặc tạo task nhắc việc..."
        />
        <Button className="w-full" disabled={loading || !prompt.trim()} onClick={askQuick}>
          <Sparkles className="w-3.5 h-3.5" />
          {loading ? 'Đang xử lý...' : 'Phân tích ngay'}
        </Button>

        {reply && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50/70 dark:bg-slate-900/40">
            <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line">{reply.answer}</p>
            {reply.proposedWriteAction && reply.proposedWriteAction.actionType !== 'none' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await createTask({
                    title: reply.proposedWriteAction!.title,
                    description: reply.proposedWriteAction!.description,
                    priority: 'medium',
                  });
                  addToast('Đã tạo công việc', reply.proposedWriteAction!.title, 'success');
                }}
              >
                Xác nhận: {reply.proposedWriteAction.title}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
