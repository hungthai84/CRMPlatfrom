import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Headphones, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { Ticket, TicketStatus } from '../../types/crm';
import { ticketSchema } from '../../schemas/crm';
import {
  Button,
  ConfirmDialog,
  Input,
  KpiCard,
  Modal,
  Select,
  StatusLabel,
  Textarea,
} from '../../components/ui/Primitives';

const TICKET_STATUSES: TicketStatus[] = ['New', 'Open', 'Pending', 'Resolved', 'Closed'];

export const ServiceModule: React.FC = () => {
  const { can } = useAuth();
  const { tickets, customers, kpis, createTicket, updateTicket, addTicketComment, deleteTicket } = useCRM();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);

  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCategory, setFCategory] = useState<Ticket['category']>('technical');
  const [fPriority, setFPriority] = useState<Ticket['priority']>('medium');
  const [fCustomerId, setFCustomerId] = useState('');

  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [rootCauseText, setRootCauseText] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (q && !`${t.code} ${t.title} ${t.customerName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const activeTicket = useMemo(
    () => tickets.find((t) => t.id === detailTicketId) || null,
    [tickets, detailTicketId]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const custId = fCustomerId || customers[0]?.id || '';
      const parsed = ticketSchema.parse({
        title: fTitle,
        description: fDesc,
        category: fCategory,
        priority: fPriority,
        customerId: custId,
        channel: 'portal',
      });
      await createTicket(parsed);
      addToast('Đã tạo Ticket hỗ trợ', parsed.title, 'success');
      setCreateOpen(false);
      setFTitle('');
      setFDesc('');
    } catch (err: unknown) {
      addToast('Thông tin Ticket chưa hợp lệ', err instanceof Error ? err.message : 'Vui lòng kiểm tra lại.', 'error');
    }
  };

  const formatSla = (t: Ticket) => {
    if (t.status === 'Resolved' || t.status === 'Closed') return 'Đã đóng SLA';
    const diffMin = Math.round((t.slaDeadline - Date.now()) / 60_000);
    if (diffMin < 0) return `Quá hạn ${Math.abs(Math.round(diffMin / 60))}h`;
    return `Còn ${Math.max(1, Math.round(diffMin / 60))}h`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">07. Dịch vụ Khách hàng, Ticket & SLA</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi đếm ngược SLA, leo thang cấp độ, ghi chú nội bộ, phân tích nguyên nhân gốc (RCA) & CSAT/NPS.
          </p>
        </div>
        {can('service', 'create') && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Tạo Ticket mới
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ticket Đang mở" value={kpis.openTickets} hint={`${kpis.overdueTickets} quá hạn SLA`} icon={<Headphones className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Tuân thủ SLA" value={`${kpis.slaCompliance}%`} hint="Tính theo hạn xử lý" icon={<Clock className="w-4 h-4" />} accent={kpis.slaCompliance >= 85 ? 'green' : 'amber'} />
        <KpiCard label="Điểm CSAT TB" value={`${kpis.csatAvg}/5`} hint={`NPS: ${kpis.npsAvg}`} icon={<CheckCircle2 className="w-4 h-4" />} accent="cyan" />
        <KpiCard label="FCR (Xử lý lần đầu)" value={`${kpis.fcrRate}%`} hint="Giải quyết <= 2 phản hồi" icon={<AlertTriangle className="w-4 h-4" />} accent="purple" />
      </div>

      <div className="glass-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã Ticket, tiêu đề, khách hàng..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">Tất cả mức độ</option>
          <option value="urgent">Khẩn cấp (Urgent)</option>
          <option value="high">Cao (High)</option>
          <option value="medium">Trung bình (Medium)</option>
          <option value="low">Thấp (Low)</option>
        </Select>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Mã & Yêu cầu</th>
                <th className="px-4 py-3 font-semibold">Khách hàng</th>
                <th className="px-4 py-3 font-semibold">Ưu tiên</th>
                <th className="px-4 py-3 font-semibold">SLA</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((t) => {
                const overdue = t.status !== 'Resolved' && t.status !== 'Closed' && t.slaDeadline < Date.now();
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setDetailTicketId(t.id);
                          setRootCauseText(t.rootCause || '');
                          setResolutionText(t.resolution || '');
                        }}
                        className="text-left font-semibold text-slate-900 dark:text-white hover:text-[#1951fc] cursor-pointer"
                      >
                        {t.title}
                      </button>
                      <p className="text-[11px] font-mono text-slate-400">{t.code} · {t.queue}</p>
                    </td>
                    <td className="px-4 py-3">{t.customerName}</td>
                    <td className="px-4 py-3">
                      <StatusLabel tone={t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : 'info'} text={t.priority} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <StatusLabel tone={overdue ? 'danger' : 'success'} text={formatSla(t)} />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.status}
                        disabled={!can('service', 'edit')}
                        onChange={(e) => updateTicket(t.id, { status: e.target.value as TicketStatus })}
                        className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                      >
                        {TICKET_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setDetailTicketId(t.id);
                          setRootCauseText(t.rootCause || '');
                          setResolutionText(t.resolution || '');
                        }}
                        className="text-[#1951fc] hover:underline cursor-pointer"
                      >
                        Xử lý
                      </button>
                      {can('service', 'delete') && (
                        <button onClick={() => setDeleteTarget(t)} className="text-rose-600 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo Ticket Hỗ trợ mới">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Tiêu đề sự cố / yêu cầu" required value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
          <Select label="Khách hàng" value={fCustomerId} onChange={(e) => setFCustomerId(e.target.value)}>
            <option value="">-- Chọn khách hàng --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Phân loại" value={fCategory} onChange={(e) => setFCategory(e.target.value as Ticket['category'])}>
              <option value="technical">Kỹ thuật</option>
              <option value="billing">Thanh toán / Hóa đơn</option>
              <option value="complaint">Khiếu nại</option>
              <option value="incident">Sự cố hệ thống</option>
              <option value="inquiry">Tư vấn thông tin</option>
            </Select>
            <Select label="Mức ưu tiên SLA" value={fPriority} onChange={(e) => setFPriority(e.target.value as Ticket['priority'])}>
              <option value="low">Thấp (48h)</option>
              <option value="medium">Trung bình (24h)</option>
              <option value="high">Cao (8h)</option>
              <option value="urgent">Khẩn cấp (4h)</option>
            </Select>
          </div>
          <Textarea label="Mô tả chi tiết" required rows={3} value={fDesc} onChange={(e) => setFDesc(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="submit">Tạo Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Detail & SLA Resolution Modal */}
      <Modal
        open={Boolean(activeTicket)}
        onClose={() => setDetailTicketId(null)}
        title={`${activeTicket?.code} · ${activeTicket?.title}`}
        subtitle={`Khách hàng: ${activeTicket?.customerName} · ${activeTicket ? formatSla(activeTicket) : ''}`}
        size="lg"
      >
        {activeTicket && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
              {activeTicket.description}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={activeTicket.escalated ? 'danger' : 'outline'}
                onClick={async () => {
                  await updateTicket(activeTicket.id, { escalated: !activeTicket.escalated, priority: 'urgent' });
                  addToast('Đã leo thang Ticket', activeTicket.code, 'warning');
                }}
              >
                {activeTicket.escalated ? 'Đã Leo thang SLA' : 'Leo thang Cấp quản lý'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await updateTicket(activeTicket.id, {
                    rootCause: rootCauseText,
                    resolution: resolutionText,
                    status: 'Resolved',
                  });
                  addToast('Đã cập nhật giải pháp & Resolved', activeTicket.code, 'success');
                }}
              >
                Lưu Giải pháp & Đóng Resolved
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Textarea label="Nguyên nhân gốc (Root Cause)" rows={2} value={rootCauseText} onChange={(e) => setRootCauseText(e.target.value)} />
              <Textarea label="Phương án xử lý (Resolution)" rows={2} value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Trao đổi & Ghi chú nội bộ ({(activeTicket.comments || []).length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {(activeTicket.comments || []).map((c) => (
                  <div key={c.id} className={`p-2.5 rounded-lg text-xs ${c.isInternal ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <p className="font-semibold text-[11px]">{c.authorName} {c.isInternal ? '(Nội bộ)' : ''}</p>
                    <p className="mt-0.5">{c.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-center pt-1">
                <label className="text-xs flex items-center gap-1 shrink-0 cursor-pointer">
                  <input type="checkbox" checked={commentInternal} onChange={(e) => setCommentInternal(e.target.checked)} />
                  Nội bộ
                </label>
                <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Nhập phản hồi..." />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!commentText.trim()) return;
                    await addTicketComment(activeTicket.id, commentText.trim(), commentInternal);
                    setCommentText('');
                  }}
                >
                  Gửi
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa Ticket hỗ trợ?"
        description={`Xác nhận xóa Ticket "${deleteTarget?.code}"?`}
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteTicket(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
