import React, { useMemo, useState } from 'react';
import { MessageSquare, PhoneCall, Send, StickyNote } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { ChannelType, Conversation } from '../../types/crm';
import { Button, Input, Modal, Select, StatusLabel, Textarea } from '../../components/ui/Primitives';

const QUICK_REPLIES = [
  'Dạ ONECRM đã tiếp nhận thông tin của anh/chị và đang kiểm tra ngay ạ.',
  'Em xin gửi bảng báo giá và tài liệu hướng dẫn triển khai chi tiết qua email ạ.',
  'Anh/chị vui lòng cung cấp mã đơn hàng hoặc mã Ticket để bộ phận kỹ thuật xử lý nhanh nhất.',
];

export const OmnichannelModule: React.FC = () => {
  const { can } = useAuth();
  const {
    conversations,
    customers,
    tickets,
    deals,
    formatMoney,
    sendConversationMessage,
    updateConversationStatus,
    createTicket,
  } = useCRM();
  const { addToast } = useToast();

  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [selectedId, setSelectedId] = useState<string>(conversations[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callSummary, setCallSummary] = useState('');

  const filtered = useMemo(
    () => conversations.filter((c) => channelFilter === 'all' || c.channel === channelFilter),
    [conversations, channelFilter]
  );

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === selectedId) || filtered[0] || null,
    [conversations, filtered, selectedId]
  );

  const linkedCustomer = useMemo(
    () => customers.find((c) => c.id === activeConv?.customerId) || null,
    [customers, activeConv]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !replyText.trim()) return;
    await sendConversationMessage(activeConv.id, replyText, isInternalNote);
    setReplyText('');
    addToast(
      isInternalNote ? 'Đã lưu ghi chú nội bộ' : 'Đã lưu phản hồi vào luồng hội thoại',
      activeConv.channel === 'livechat'
        ? 'Đã cập nhật trực tiếp trên Livechat.'
        : `Kênh ${activeConv.channel.toUpperCase()} chưa cấu hình Webhook ngoài — tin nhắn đã lưu lịch sử nội bộ.`,
      'info'
    );
  };

  const handleLogCall = async () => {
    if (!activeConv || !callSummary.trim()) return;
    await sendConversationMessage(activeConv.id, `[NHẬT KÝ CUỘC GỌI] ${callSummary}`, true);
    setCallSummary('');
    setCallModalOpen(false);
    addToast('Đã ghi nhận nhật ký cuộc gọi', activeConv.customerName, 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">06. Hộp thư Đa kênh Hợp nhất (Omnichannel Inbox)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Livechat, Zalo OA, Facebook, WhatsApp, Email, SMS & Call Log trong một giao diện 3 cột.
          </p>
        </div>
        <StatusLabel tone="warning" text="Webhook Zalo/FB/WhatsApp/VoIP: Chưa kết nối" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[580px]">
        {/* Column 1: Thread List */}
        <div className="lg:col-span-3 glass-card rounded-xl p-3 flex flex-col gap-3">
          <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}>
            <option value="all">Tất cả kênh ({conversations.length})</option>
            {['livechat', 'zalo', 'facebook', 'instagram', 'email', 'sms', 'whatsapp', 'phone'].map((ch) => (
              <option key={ch} value={ch}>{ch.toUpperCase()}</option>
            ))}
          </Select>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
            {filtered.map((cv) => (
              <button
                key={cv.id}
                onClick={() => setSelectedId(cv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
                  activeConv?.id === cv.id
                    ? 'bg-[#1951fc] text-white'
                    : 'bg-slate-50/80 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold truncate">{cv.customerName}</span>
                  <span className="text-[10px] font-mono uppercase opacity-80">{cv.channel}</span>
                </div>
                <p className={`text-[11px] truncate mt-1 ${activeConv?.id === cv.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  {cv.lastMessage}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Chat Stream & Composer */}
        <div className="lg:col-span-6 glass-card rounded-xl flex flex-col overflow-hidden">
          {activeConv ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {activeConv.customerName} <span className="text-xs font-mono text-slate-400">({activeConv.channel.toUpperCase()})</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Liên hệ: {activeConv.customerContact} · SLA còn {activeConv.slaRemainingMinutes} phút
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCallModalOpen(true)}>
                    <PhoneCall className="w-3.5 h-3.5" /> Ghi cuộc gọi
                  </Button>
                  <select
                    value={activeConv.status}
                    onChange={(e) => updateConversationStatus(activeConv.id, e.target.value as Conversation['status'])}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                  >
                    <option value="open">Đang mở</option>
                    <option value="pending">Chờ phản hồi</option>
                    <option value="resolved">Đã giải quyết</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
                {activeConv.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[82%] p-3 rounded-xl text-xs ${
                      m.isInternalNote
                        ? 'mx-auto bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200'
                        : m.sender === 'agent'
                        ? 'ml-auto bg-[#1951fc] text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="text-[10px] opacity-75 mb-1">
                      {m.isInternalNote ? 'Ghi chú nội bộ · ' : ''}
                      {m.senderName} · {new Date(m.timestamp).toLocaleTimeString('vi-VN')}
                    </p>
                    <p className="leading-relaxed">{m.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((qr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReplyText(qr)}
                      className="text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer truncate max-w-[240px]"
                    >
                      Mẫu {i + 1}: {qr}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote((v) => !v)}
                    className={`px-2.5 py-2 rounded-lg text-xs flex items-center gap-1 cursor-pointer border ${
                      isInternalNote
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    {isInternalNote ? 'Ghi chú nội bộ' : 'Trả lời khách'}
                  </button>
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isInternalNote ? 'Nhập ghi chú nội bộ...' : 'Nhập nội dung phản hồi...'}
                  />
                  <Button type="submit" disabled={!can('omnichannel', 'create') || !replyText.trim()}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500 my-auto">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              Chọn một hội thoại để bắt đầu.
            </div>
          )}
        </div>

        {/* Column 3: Customer Context */}
        <div className="lg:col-span-3 glass-card rounded-xl p-4 space-y-4">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-white">Thông tin Khách hàng 360°</h2>
          {linkedCustomer ? (
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{linkedCustomer.name}</p>
                <p className="font-mono text-slate-400">{linkedCustomer.code} · {linkedCustomer.segment}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 space-y-1">
                <p>LTV: <strong className="tabular-nums">{formatMoney(linkedCustomer.lifetimeValue)}</strong></p>
                <p>Health Score: <strong className="tabular-nums">{linkedCustomer.healthScore}/100</strong></p>
                <p>Cơ hội mở: <strong>{deals.filter((d) => d.customerId === linkedCustomer.id && d.status === 'open').length}</strong></p>
                <p>Ticket: <strong>{tickets.filter((t) => t.customerId === linkedCustomer.id).length}</strong></p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  if (!activeConv) return;
                  await createTicket({
                    title: `Hỗ trợ từ hội thoại ${activeConv.channel.toUpperCase()}`,
                    description: activeConv.lastMessage,
                    customerId: linkedCustomer.id,
                    customerName: linkedCustomer.name,
                    priority: activeConv.sentiment === 'negative' ? 'high' : 'medium',
                    channel: activeConv.channel === 'zalo' || activeConv.channel === 'facebook' ? activeConv.channel : 'livechat',
                  });
                  addToast('Đã chuyển thành Ticket SLA', linkedCustomer.name, 'success');
                }}
              >
                Tạo Ticket từ Hội thoại
              </Button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Hội thoại khách vãng lai chưa gắn hồ sơ Khách hàng.</p>
          )}
        </div>
      </div>

      <Modal open={callModalOpen} onClose={() => setCallModalOpen(false)} title="Ghi nhận Nhật ký Cuộc gọi (VoIP)">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Adapter tổng đài IP/SIP chưa cấu hình secret; ghi nhận nhật ký thủ công để lưu vào lịch sử khách hàng.
          </p>
          <Textarea label="Tóm tắt nội dung cuộc gọi" rows={3} value={callSummary} onChange={(e) => setCallSummary(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCallModalOpen(false)}>Hủy</Button>
            <Button onClick={handleLogCall}>Lưu Nhật ký</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
