import React, { useMemo, useState } from 'react';
import { Calendar, Globe, HelpCircle, Send } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Select, StatusLabel, Textarea } from '../../components/ui/Primitives';

export const PortalModule: React.FC = () => {
  const { customers, orders, contracts, tickets, documents, formatMoney, createTicket, createTask } = useCRM();
  const { addToast } = useToast();

  const activeCustomers = useMemo(() => customers.filter((c) => c.status !== 'archived'), [customers]);
  const [selectedCustId, setSelectedCustId] = useState<string>(activeCustomers[0]?.id || '');

  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState(new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10));

  const currentCust = useMemo(
    () => activeCustomers.find((c) => c.id === selectedCustId) || activeCustomers[0] || null,
    [activeCustomers, selectedCustId]
  );

  const scopedOrders = useMemo(() => orders.filter((o) => o.customerId === currentCust?.id), [orders, currentCust]);
  const scopedContracts = useMemo(() => contracts.filter((c) => c.customerId === currentCust?.id), [contracts, currentCust]);
  const scopedTickets = useMemo(() => tickets.filter((t) => t.customerId === currentCust?.id), [tickets, currentCust]);
  const publicFaqs = useMemo(
    () => documents.filter((d) => d.visibility === 'customer_portal' && d.approvalStatus === 'approved'),
    [documents]
  );

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCust) return;
    const tkt = await createTicket({
      title: reqTitle,
      description: reqDesc,
      customerId: currentCust.id,
      customerName: currentCust.name,
      channel: 'portal',
      priority: 'medium',
    });
    addToast('Đã gửi yêu cầu từ Customer Portal', `Ticket ${tkt.code} đã được tiếp nhận.`, 'success');
    setReqTitle('');
    setReqDesc('');
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCust) return;
    await createTask({
      title: `[Portal Lịch hẹn] ${apptTitle}`,
      description: `Khách hàng ${currentCust.name} đặt lịch hẹn trực tuyến qua Customer Portal.`,
      type: 'appointment',
      dueDate: apptDate,
      priority: 'high',
      linkedType: 'customer',
      linkedId: currentCust.id,
      linkedName: currentCust.name,
    });
    addToast('Đã đặt lịch hẹn thành công', `${currentCust.name} · Ngày ${apptDate}`, 'success');
    setApptTitle('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#1951fc]" />
            15. Cổng Khách hàng Tự phục vụ (Customer Portal)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dữ liệu được cô lập chặt chẽ theo đúng Khách hàng đang chọn: xem đơn hàng, hợp đồng, gửi Ticket & đặt lịch hẹn.
          </p>
        </div>

        <div className="w-72">
          <Select value={currentCust?.id || ''} onChange={(e) => setSelectedCustId(e.target.value)} aria-label="Xem dưới góc nhìn khách hàng">
            {activeCustomers.map((c) => (
              <option key={c.id} value={c.id}>Khách hàng: {c.code} · {c.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {currentCust && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Orders & Contracts */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Đơn hàng ({scopedOrders.length}) & Hợp đồng ({scopedContracts.length}) của {currentCust.name}
              </h2>
              <div className="space-y-2">
                {scopedOrders.map((o) => (
                  <div key={o.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex justify-between text-xs">
                    <span><strong>{o.code}</strong> · {o.orderDate} ({o.status})</span>
                    <span className="font-semibold tabular-nums">{formatMoney(o.totalAmount)}</span>
                  </div>
                ))}
                {scopedContracts.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex justify-between text-xs">
                    <span><strong>{c.code}</strong> · {c.title} (Hết hạn {c.endDate})</span>
                    <StatusLabel tone="info" text={c.status} />
                  </div>
                ))}
                {scopedOrders.length === 0 && scopedContracts.length === 0 && (
                  <p className="text-xs text-slate-500">Khách hàng này chưa có đơn hàng hoặc hợp đồng nào.</p>
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Ticket Hỗ trợ của bạn ({scopedTickets.length})
              </h2>
              <div className="space-y-2">
                {scopedTickets.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between text-xs">
                    <span><strong>{t.code}</strong> · {t.title}</span>
                    <StatusLabel tone={t.status === 'Resolved' || t.status === 'Closed' ? 'success' : 'warning'} text={t.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#1951fc]" /> Trung tâm Trợ giúp Công khai ({publicFaqs.length})
              </h2>
              {publicFaqs.map((faq) => (
                <div key={faq.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">{faq.title}</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{faq.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Self-Service Forms */}
          <div className="space-y-5">
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Gửi Yêu cầu Hỗ trợ</h2>
              <form onSubmit={handleSubmitTicket} className="space-y-3">
                <Input label="Tiêu đề yêu cầu" required value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} />
                <Textarea label="Chi tiết cần hỗ trợ" required rows={3} value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} />
                <Button type="submit" className="w-full">
                  <Send className="w-3.5 h-3.5" /> Gửi Ticket
                </Button>
              </form>
            </div>

            <div className="glass-card rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Đặt Lịch hẹn Tư vấn</h2>
              <form onSubmit={handleBookAppointment} className="space-y-3">
                <Input label="Nội dung cuộc hẹn" required value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} />
                <Input label="Ngày mong muốn" type="date" required value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
                <Button type="submit" variant="secondary" className="w-full">
                  <Calendar className="w-3.5 h-3.5" /> Đặt lịch hẹn
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
