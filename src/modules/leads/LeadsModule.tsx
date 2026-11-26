import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Download, Kanban, List, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { Lead, LeadStatus } from '../../types/crm';
import { leadSchema } from '../../schemas/crm';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Select,
  StatusLabel,
  Textarea,
} from '../../components/ui/Primitives';
import { exportToCsv } from '../../services/firestoreService';

const LEAD_STATUSES: LeadStatus[] = ['New', 'Assigned', 'Contacted', 'Qualified', 'Opportunity', 'Converted', 'Lost'];

export const LeadsModule: React.FC<{ onOpenImport: () => void }> = ({ onOpenImport }) => {
  const { can } = useAuth();
  const { leads, formatMoney, createLead, updateLead, deleteLead, convertLead } = useCRM();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const [fName, setFName] = useState('');
  const [fCompany, setFCompany] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fSource, setFSource] = useState<Lead['source']>('Website');
  const [fValue, setFValue] = useState('80000000');
  const [fScore, setFScore] = useState('65');
  const [fNotes, setFNotes] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (q && !`${l.code} ${l.name} ${l.company || ''} ${l.phone} ${l.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  const openCreate = () => {
    setEditingLead(null);
    setFName('');
    setFCompany('');
    setFPhone('');
    setFEmail('');
    setFSource('Website');
    setFValue('80000000');
    setFScore('65');
    setFNotes('');
    setFormOpen(true);
  };

  const openEdit = (l: Lead) => {
    setEditingLead(l);
    setFName(l.name);
    setFCompany(l.company || '');
    setFPhone(l.phone);
    setFEmail(l.email);
    setFSource(l.source);
    setFValue(String(l.estimatedValue));
    setFScore(String(l.score));
    setFNotes(l.notes || '');
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = leadSchema.parse({
        name: fName,
        company: fCompany,
        phone: fPhone,
        email: fEmail,
        source: fSource,
        estimatedValue: Number(fValue) || 0,
        notes: fNotes,
      });
      if (editingLead) {
        await updateLead(editingLead.id, { ...parsed, score: Number(fScore) || editingLead.score });
        addToast('Đã cập nhật Lead', parsed.name, 'success');
      } else {
        await createLead({ ...parsed, score: Number(fScore) || 65 });
        addToast('Đã tạo Lead mới', 'Hệ thống đã tự động phân công nhân viên phụ trách.', 'success');
      }
      setFormOpen(false);
    } catch (err: unknown) {
      addToast('Dữ liệu Lead chưa hợp lệ', err instanceof Error ? err.message : 'Kiểm tra lại thông tin.', 'error');
    }
  };

  const handleConvert = async (lead: Lead) => {
    try {
      const res = await convertLead(lead.id);
      addToast(
        'Chuyển đổi Lead thành công',
        res.reusedExistingCustomer
          ? `Đã liên kết với Khách hàng hiện có (${res.customer.code}) và tạo Cơ hội ${res.deal.code}.`
          : `Đã tạo Khách hàng mới (${res.customer.code}) và Cơ hội ${res.deal.code}.`,
        'success'
      );
    } catch (err: unknown) {
      addToast('Không thể chuyển đổi Lead', err instanceof Error ? err.message : 'Lỗi chuyển đổi.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">03. Quản lý Khách hàng Tiềm năng (Leads)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân công Round-robin, chấm điểm Lead Score, theo dõi aging và chuyển đổi chống trùng lặp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Bảng
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
          {can('leads', 'import') && (
            <Button variant="outline" size="sm" onClick={onOpenImport}>
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </Button>
          )}
          {can('leads', 'export') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv(
                  `onecrm-leads-${new Date().toISOString().slice(0, 10)}.csv`,
                  filtered.map((l) => ({
                    Code: l.code,
                    Name: l.name,
                    Company: l.company,
                    Phone: l.phone,
                    Email: l.email,
                    Source: l.source,
                    Status: l.status,
                    Score: l.score,
                    EstimatedValue: l.estimatedValue,
                  }))
                )
              }
            >
              <Download className="w-3.5 h-3.5" /> Xuất CSV
            </Button>
          )}
          {can('leads', 'create') && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" /> Thêm Lead
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã Lead, tên, công ty, SĐT..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="all">Tất cả nguồn</option>
          {['Website', 'Advertising', 'Social', 'Referral', 'Import', 'Direct'].map((src) => (
            <option key={src} value={src}>{src}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy Lead" description="Hãy thử đổi bộ lọc hoặc thêm Lead mới." />
      ) : viewMode === 'table' ? (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã & Lead</th>
                  <th className="px-4 py-3 font-semibold">Nguồn</th>
                  <th className="px-4 py-3 font-semibold text-right">Điểm</th>
                  <th className="px-4 py-3 font-semibold text-right">Giá trị dự kiến</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Aging</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((l) => {
                  const agingDays = Math.max(0, Math.floor((Date.now() - l.updatedAt) / 86_400_000));
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{l.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {l.code} {l.company ? `· ${l.company}` : ''} · {l.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3">{l.source}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{l.score}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(l.estimatedValue)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          disabled={!can('leads', 'edit')}
                          onChange={(e) => updateLead(l.id, { status: e.target.value as LeadStatus })}
                          className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <StatusLabel tone={agingDays >= 7 ? 'warning' : 'neutral'} text={`${agingDays} ngày`} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {l.status !== 'Converted' && l.status !== 'Lost' && can('leads', 'edit') && (
                            <button
                              onClick={() => handleConvert(l)}
                              className="inline-flex items-center gap-1 text-[#1951fc] dark:text-[#22c7e8] font-medium hover:underline cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Chuyển đổi
                            </button>
                          )}
                          {can('leads', 'edit') && (
                            <button onClick={() => openEdit(l)} className="text-slate-600 dark:text-slate-300 hover:underline cursor-pointer">
                              Sửa
                            </button>
                          )}
                          {can('leads', 'delete') && (
                            <button onClick={() => setDeleteTarget(l)} className="text-rose-600 hover:underline cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3 overflow-x-auto">
          {LEAD_STATUSES.map((st) => {
            const colLeads = filtered.filter((l) => l.status === st);
            return (
              <div key={st} className="glass-card rounded-xl p-3 space-y-2.5 min-w-[200px]">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                  <span>{st}</span>
                  <span className="tabular-nums text-slate-400">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map((l) => (
                    <div key={l.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{l.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{l.company || l.source}</p>
                      <p className="text-[11px] font-semibold text-[#1951fc] tabular-nums">{formatMoney(l.estimatedValue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingLead ? `Sửa ${editingLead.code}` : 'Thêm Lead mới'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Tên người liên hệ" required value={fName} onChange={(e) => setFName(e.target.value)} />
            <Input label="Công ty" value={fCompany} onChange={(e) => setFCompany(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Số điện thoại" required value={fPhone} onChange={(e) => setFPhone(e.target.value)} />
            <Input label="Email" type="email" required value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Nguồn Lead" value={fSource} onChange={(e) => setFSource(e.target.value as Lead['source'])}>
              {['Website', 'Advertising', 'Social', 'Referral', 'Import', 'Direct'].map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </Select>
            <Input label="Giá trị dự kiến (VND)" type="number" value={fValue} onChange={(e) => setFValue(e.target.value)} />
            <Input label="Lead Score (0-100)" type="number" min={0} max={100} value={fScore} onChange={(e) => setFScore(e.target.value)} />
          </div>
          <Textarea label="Ghi chú" rows={2} value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu Lead</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa Lead này?"
        description={`Bạn có chắc muốn xóa vĩnh viễn Lead "${deleteTarget?.name}" (${deleteTarget?.code})?`}
        confirmLabel="Xóa Lead"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteLead(deleteTarget.id);
            addToast('Đã xóa Lead', deleteTarget.code, 'info');
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
