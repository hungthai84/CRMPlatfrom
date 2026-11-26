import React, { useMemo, useState } from 'react';
import {
  Archive,
  Download,
  GitMerge,
  Plus,
  Search,
  Upload,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { Customer } from '../../types/crm';
import { customerSchema } from '../../schemas/crm';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PaginationBar,
  Select,
  StatusLabel,
  Textarea,
} from '../../components/ui/Primitives';
import { exportToCsv } from '../../services/firestoreService';

const PROFILE_TABS = [
  { id: 'overview', label: '1. Tổng quan' },
  { id: 'info', label: '2. Thông tin & Pháp lý' },
  { id: 'interactions', label: '3. Tương tác' },
  { id: 'deals', label: '4. Bán hàng' },
  { id: 'orders', label: '5. Đơn hàng' },
  { id: 'contracts', label: '6. Hợp đồng' },
  { id: 'care', label: '7. Chăm sóc & Loyalty' },
  { id: 'tickets', label: '8. Ticket' },
  { id: 'tasks', label: '9. Công việc' },
  { id: 'docs', label: '10. Tài liệu' },
  { id: 'notes', label: '11. Ghi chú & PDPL' },
  { id: 'history', label: '12. Lịch sử thay đổi' },
] as const;

type ProfileTabId = (typeof PROFILE_TABS)[number]['id'];

export const CustomersModule: React.FC<{ onOpenImport: () => void }> = ({ onOpenImport }) => {
  const { can } = useAuth();
  const {
    customers,
    deals,
    orders,
    contracts,
    tickets,
    tasks,
    conversations,
    documents,
    loyalty,
    activities,
    auditLogs,
    formatMoney,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    mergeCustomers,
  } = useCRM();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'business'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active_all');
  const [sortBy, setSortBy] = useState<'ltv' | 'newest' | 'health'>('newest');
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Customer | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState('');
  const [mergeDupId, setMergeDupId] = useState('');

  // Form states
  const [fType, setFType] = useState<'individual' | 'business'>('business');
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fTaxId, setFTaxId] = useState('');
  const [fSegment, setFSegment] = useState<Customer['segment']>('SMB');
  const [fGroup, setFGroup] = useState('Khách hàng Doanh nghiệp');
  const [fNotes, setFNotes] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) => {
        if (statusFilter === 'active_all' && c.status === 'archived') return false;
        if (statusFilter !== 'active_all' && statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        if (q && !`${c.code} ${c.name} ${c.phone} ${c.email} ${c.taxId || ''}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'ltv') return b.lifetimeValue - a.lifetimeValue;
        if (sortBy === 'health') return b.healthScore - a.healthScore;
        return b.createdAt - a.createdAt;
      });
  }, [customers, search, typeFilter, statusFilter, sortBy]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedId) || null,
    [customers, selectedId]
  );

  // Detect duplicate email or phone pairs
  const duplicatePairs = useMemo(() => {
    const pairs: Array<{ primary: Customer; duplicate: Customer; reason: string }> = [];
    const activeList = customers.filter((c) => c.status !== 'archived');
    for (let i = 0; i < activeList.length; i++) {
      for (let j = i + 1; j < activeList.length; j++) {
        const a = activeList[i];
        const b = activeList[j];
        if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) {
          pairs.push({ primary: a, duplicate: b, reason: `Trùng Email (${a.email})` });
        } else if (a.phone && b.phone && a.phone.replace(/\s+/g, '') === b.phone.replace(/\s+/g, '')) {
          pairs.push({ primary: a, duplicate: b, reason: `Trùng SĐT (${a.phone})` });
        }
      }
    }
    return pairs;
  }, [customers]);

  const openCreate = () => {
    setEditingCustomer(null);
    setFType('business');
    setFName('');
    setFPhone('');
    setFEmail('');
    setFAddress('');
    setFTaxId('');
    setFSegment('SMB');
    setFGroup('Khách hàng Doanh nghiệp');
    setFNotes('');
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFType(c.type);
    setFName(c.name);
    setFPhone(c.phone);
    setFEmail(c.email);
    setFAddress(c.address || '');
    setFTaxId(c.taxId || '');
    setFSegment(c.segment);
    setFGroup(c.group);
    setFNotes(c.notes || '');
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = customerSchema.parse({
        type: fType,
        name: fName,
        phone: fPhone,
        email: fEmail,
        address: fAddress,
        taxId: fTaxId,
        group: fGroup,
        segment: fSegment,
        notes: fNotes,
      });

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, parsed);
        addToast('Đã cập nhật khách hàng', parsed.name, 'success');
      } else {
        await createCustomer({
          ...parsed,
          ownerName: 'Chủ sở hữu',
          score: 75,
          lifetimeValue: 0,
          healthScore: 85,
          status: 'active',
          consent: {
            marketingEmail: true,
            marketingSmsZalo: true,
            aiProcessing: true,
            thirdPartySharing: false,
            consentSource: 'Tạo trực tiếp CRM',
            consentedAt: Date.now(),
            purposeNote: 'Quản trị quan hệ khách hàng & hậu mãi',
          },
        });
        addToast('Đã thêm khách hàng mới', parsed.name, 'success');
      }
      setFormOpen(false);
    } catch (err: unknown) {
      addToast('Lỗi nhập liệu', err instanceof Error ? err.message : 'Vui lòng kiểm tra thông tin.', 'error');
    }
  };

  const handleConsentToggle = async (c: Customer, field: keyof Customer['consent']) => {
    if (!can('customers', 'edit')) return;
    const nextVal = !c.consent[field];
    await updateCustomer(c.id, {
      consent: {
        ...c.consent,
        [field]: nextVal,
        consentedAt: Date.now(),
      },
    });
    addToast('Đã cập nhật quyền PDPL', `${String(field)} = ${nextVal ? 'Cho phép' : 'Từ chối'}`, 'info');
  };

  // --- CUSTOMER 360° DETAIL VIEW ---
  if (selectedCustomer) {
    const custDeals = deals.filter((d) => d.customerId === selectedCustomer.id);
    const custOrders = orders.filter((o) => o.customerId === selectedCustomer.id);
    const custContracts = contracts.filter((ct) => ct.customerId === selectedCustomer.id);
    const custTickets = tickets.filter((t) => t.customerId === selectedCustomer.id);
    const custTasks = tasks.filter((tk) => tk.linkedId === selectedCustomer.id);
    const custConvs = conversations.filter((cv) => cv.customerId === selectedCustomer.id);
    const custLoyalty = loyalty.find((l) => l.customerId === selectedCustomer.id);
    const custActivities = activities.filter((a) => a.entityId === selectedCustomer.id);
    const custAudits = auditLogs.filter((a) => a.recordId === selectedCustomer.id);

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              onClick={() => setSelectedId(null)}
              className="text-xs font-medium text-[#1951fc] dark:text-[#22c7e8] hover:underline mb-1 cursor-pointer"
            >
              ← Quay lại Danh sách Khách hàng
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {selectedCustomer.name}
              <span className="text-xs font-mono text-slate-500">{selectedCustomer.code}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedCustomer.type === 'business' ? 'Khách hàng Doanh nghiệp' : 'Khách hàng Cá nhân'} · {selectedCustomer.segment} · Phụ trách: {selectedCustomer.ownerName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {can('customers', 'edit') && (
              <Button variant="outline" size="sm" onClick={() => openEdit(selectedCustomer)}>
                Chỉnh sửa hồ sơ
              </Button>
            )}
          </div>
        </div>

        {/* 12 Tabs Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 custom-scrollbar">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#1951fc] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-card rounded-xl p-5">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500">Giá trị vòng đời (LTV)</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {formatMoney(selectedCustomer.lifetimeValue)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500">Điểm Sức khỏe (Health Score)</p>
                <p className="text-lg font-bold text-emerald-600 mt-1 tabular-nums">{selectedCustomer.healthScore}/100</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500">Cơ hội & Đơn hàng</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {custDeals.length} Deal · {custOrders.length} Đơn
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500">Ticket & Hợp đồng</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {custTickets.length} Ticket · {custContracts.length} HĐ
                </p>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-xs text-slate-500 block">Email</span>{selectedCustomer.email}</div>
              <div><span className="text-xs text-slate-500 block">Điện thoại</span><span className="font-mono">{selectedCustomer.phone}</span></div>
              <div><span className="text-xs text-slate-500 block">Địa chỉ</span>{selectedCustomer.address || 'Chưa cập nhật'}</div>
              <div><span className="text-xs text-slate-500 block">Mã số thuế</span><span className="font-mono">{selectedCustomer.taxId || 'Không áp dụng'}</span></div>
              <div><span className="text-xs text-slate-500 block">Nhóm khách hàng</span>{selectedCustomer.group}</div>
              <div><span className="text-xs text-slate-500 block">Trạng thái</span>{selectedCustomer.status}</div>
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hội thoại Đa kênh ({custConvs.length}) & Hoạt động ({custActivities.length})
              </p>
              {custConvs.map((cv) => (
                <div key={cv.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs">
                  <span className="font-semibold uppercase text-[#1951fc]">{cv.channel}</span> · {cv.lastMessage}
                </div>
              ))}
              {custActivities.map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs flex justify-between">
                  <span>{a.summary}</span>
                  <span className="text-slate-400 tabular-nums">{new Date(a.timestamp).toLocaleDateString('vi-VN')}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="space-y-2">
              {custDeals.length === 0 ? <p className="text-xs text-slate-500">Chưa có cơ hội bán hàng.</p> : custDeals.map((d) => (
                <div key={d.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between text-xs">
                  <span><strong>{d.code}</strong> · {d.title} ({d.stage})</span>
                  <span className="font-semibold tabular-nums">{formatMoney(d.value)}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-2">
              {custOrders.length === 0 ? <p className="text-xs text-slate-500">Chưa có đơn hàng.</p> : custOrders.map((o) => (
                <div key={o.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between text-xs">
                  <span><strong>{o.code}</strong> · {o.orderDate} ({o.paymentStatus})</span>
                  <span className="font-semibold tabular-nums">{formatMoney(o.totalAmount)}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-2">
              {custContracts.length === 0 ? <p className="text-xs text-slate-500">Chưa có hợp đồng.</p> : custContracts.map((ct) => (
                <div key={ct.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between text-xs">
                  <span><strong>{ct.code}</strong> · {ct.title} (Hết hạn {ct.endDate})</span>
                  <span className="font-semibold tabular-nums">{formatMoney(ct.value)}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'care' && (
            <div className="text-sm space-y-2">
              {custLoyalty ? (
                <>
                  <p>Hạng thành viên: <strong>{custLoyalty.tier}</strong></p>
                  <p>Điểm khả dụng: <strong className="tabular-nums">{custLoyalty.points}</strong> · Tích lũy: {custLoyalty.lifetimePoints}</p>
                  <p>Nguy cơ rời bỏ (Churn Risk): <strong>{custLoyalty.churnRisk}</strong></p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Chưa kích hoạt hồ sơ Loyalty cho khách hàng này.</p>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-2">
              {custTickets.length === 0 ? <p className="text-xs text-slate-500">Không có Ticket hỗ trợ.</p> : custTickets.map((t) => (
                <div key={t.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between text-xs">
                  <span><strong>{t.code}</strong> · {t.title}</span>
                  <span>{t.status} · {t.priority}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-2">
              {custTasks.length === 0 ? <p className="text-xs text-slate-500">Không có công việc liên kết.</p> : custTasks.map((tk) => (
                <div key={tk.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between text-xs">
                  <span><strong>{tk.code}</strong> · {tk.title}</span>
                  <span>Hạn {tk.dueDate} · {tk.status}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-2">
              {documents.filter((d) => d.visibility === 'customer_portal').map((d) => (
                <div key={d.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <strong>{d.code}</strong> · {d.title} ({d.version})
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú nội bộ</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedCustomer.notes || 'Chưa có ghi chú.'}</p>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                  Quản trị Đồng ý Dữ liệu Cá nhân (VN PDPL / Nghị định 13)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(
                    [
                      ['marketingEmail', 'Đồng ý nhận Email Marketing'],
                      ['marketingSmsZalo', 'Đồng ý nhận SMS / Zalo OA'],
                      ['aiProcessing', 'Đồng ý phân tích bằng AI Copilot'],
                      ['thirdPartySharing', 'Chia sẻ bên thứ ba (Đối tác giao nhận)'],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedCustomer.consent?.[field])}
                        onChange={() => handleConsentToggle(selectedCustomer, field)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {custAudits.length === 0 ? <p className="text-xs text-slate-500">Chưa có nhật ký chỉnh sửa riêng.</p> : custAudits.map((au) => (
                <div key={au.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs flex justify-between">
                  <span><strong>{au.action}</strong>: {au.details}</span>
                  <span className="text-slate-400 tabular-nums">{new Date(au.timestamp).toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">02. Quản trị Khách hàng 360°</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hồ sơ B2B/B2C hợp nhất, phát hiện trùng lặp, quản trị đồng ý VN PDPL & 12 góc nhìn lịch sử.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {duplicatePairs.length > 0 && can('customers', 'edit') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMergePrimaryId(duplicatePairs[0].primary.id);
                setMergeDupId(duplicatePairs[0].duplicate.id);
                setMergeOpen(true);
              }}
            >
              <GitMerge className="w-3.5 h-3.5 text-amber-500" />
              Hợp nhất trùng ({duplicatePairs.length})
            </Button>
          )}
          {can('customers', 'import') && (
            <Button variant="outline" size="sm" onClick={onOpenImport}>
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </Button>
          )}
          {can('customers', 'export') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv(
                  `onecrm-customers-${new Date().toISOString().slice(0, 10)}.csv`,
                  filtered.map((c) => ({
                    Code: c.code,
                    Name: c.name,
                    Type: c.type,
                    Phone: c.phone,
                    Email: c.email,
                    Segment: c.segment,
                    LTV: c.lifetimeValue,
                    HealthScore: c.healthScore,
                    Status: c.status,
                  }))
                )
              }
            >
              <Download className="w-3.5 h-3.5" />
              Xuất CSV
            </Button>
          )}
          {can('customers', 'create') && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              Thêm Khách hàng
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm mã, tên, SĐT, email, MST..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}>
          <option value="all">Tất cả loại hình</option>
          <option value="business">Doanh nghiệp (B2B)</option>
          <option value="individual">Cá nhân (B2C)</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="active_all">Đang hoạt động (Ẩn lưu trữ)</option>
          <option value="active">Active</option>
          <option value="prospect">Prospect</option>
          <option value="churned">Churned</option>
          <option value="archived">Đã lưu trữ</option>
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
          <option value="newest">Mới nhất</option>
          <option value="ltv">Giá trị LTV cao nhất</option>
          <option value="health">Health Score cao nhất</option>
        </Select>
      </div>

      {/* Table */}
      {paged.length === 0 ? (
        <EmptyState
          title="Chưa có khách hàng phù hợp"
          description="Thay đổi bộ lọc tìm kiếm hoặc tạo hồ sơ khách hàng mới."
          action={can('customers', 'create') ? <Button onClick={openCreate}>Thêm Khách hàng</Button> : undefined}
        />
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã & Tên Khách hàng</th>
                  <th className="px-4 py-3 font-semibold">Liên hệ</th>
                  <th className="px-4 py-3 font-semibold">Phân khúc</th>
                  <th className="px-4 py-3 font-semibold text-right">LTV</th>
                  <th className="px-4 py-3 font-semibold text-right">Health</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelectedId(c.id); setActiveTab('overview'); }}
                        className="text-left group cursor-pointer"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-[#1951fc]">
                          {c.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">{c.code} · {c.type === 'business' ? 'B2B' : 'B2C'}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-slate-700 dark:text-slate-300">{c.phone}</p>
                      <p className="text-[11px] text-slate-500">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.segment}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatMoney(c.lifetimeValue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.healthScore}/100</td>
                    <td className="px-4 py-3">
                      <StatusLabel
                        tone={c.status === 'active' ? 'success' : c.status === 'churned' ? 'danger' : 'neutral'}
                        text={c.status}
                      />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedId(c.id); setActiveTab('overview'); }}
                          className="text-[#1951fc] dark:text-[#22c7e8] hover:underline cursor-pointer"
                        >
                          360°
                        </button>
                        {can('customers', 'edit') && (
                          <button onClick={() => openEdit(c)} className="text-slate-600 dark:text-slate-300 hover:underline cursor-pointer">
                            Sửa
                          </button>
                        )}
                        {can('customers', 'delete') && c.status !== 'archived' && (
                          <button onClick={() => setArchiveTarget(c)} className="text-rose-600 hover:underline cursor-pointer">
                            <Archive className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-3">
            <PaginationBar page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingCustomer ? `Cập nhật ${editingCustomer.code}` : 'Thêm Khách hàng mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Loại khách hàng" value={fType} onChange={(e) => setFType(e.target.value as typeof fType)}>
              <option value="business">Doanh nghiệp (B2B)</option>
              <option value="individual">Cá nhân (B2C)</option>
            </Select>
            <Select label="Phân khúc" value={fSegment} onChange={(e) => setFSegment(e.target.value as Customer['segment'])}>
              <option value="Enterprise">Enterprise</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="SMB">SMB</option>
              <option value="VIP">VIP</option>
              <option value="Standard">Standard</option>
            </Select>
          </div>
          <Input label="Tên khách hàng / Doanh nghiệp" required value={fName} onChange={(e) => setFName(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Số điện thoại" required value={fPhone} onChange={(e) => setFPhone(e.target.value)} />
            <Input label="Email" type="email" required value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Mã số thuế" value={fTaxId} onChange={(e) => setFTaxId(e.target.value)} />
            <Input label="Nhóm khách hàng" value={fGroup} onChange={(e) => setFGroup(e.target.value)} />
          </div>
          <Input label="Địa chỉ" value={fAddress} onChange={(e) => setFAddress(e.target.value)} />
          <Textarea label="Ghi chú" rows={2} value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu hồ sơ</Button>
          </div>
        </form>
      </Modal>

      {/* Merge Duplicate Modal */}
      <Modal open={mergeOpen} onClose={() => setMergeOpen(false)} title="Hợp nhất Hồ sơ Trùng lặp">
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Hệ thống sẽ cộng dồn LTV, hợp nhất thẻ Tag và tự động chuyển toàn bộ Deal, Ticket sang hồ sơ chính trước khi xóa bản ghi trùng.
          </p>
          <Select label="Hồ sơ chính (Giữ lại)" value={mergePrimaryId} onChange={(e) => setMergePrimaryId(e.target.value)}>
            {customers.filter((c) => c.status !== 'archived').map((c) => (
              <option key={c.id} value={c.id}>{c.code} · {c.name} ({c.email})</option>
            ))}
          </Select>
          <Select label="Hồ sơ trùng lặp (Gộp & Xóa)" value={mergeDupId} onChange={(e) => setMergeDupId(e.target.value)}>
            {customers.filter((c) => c.status !== 'archived' && c.id !== mergePrimaryId).map((c) => (
              <option key={c.id} value={c.id}>{c.code} · {c.name} ({c.email})</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Hủy</Button>
            <Button
              disabled={!mergePrimaryId || !mergeDupId || mergePrimaryId === mergeDupId}
              onClick={async () => {
                await mergeCustomers(mergePrimaryId, mergeDupId);
                addToast('Hợp nhất thành công', 'Đã gộp hồ sơ trùng lặp và liên kết dữ liệu.', 'success');
                setMergeOpen(false);
              }}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Xác nhận Hợp nhất
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirm */}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Lưu trữ hồ sơ khách hàng?"
        description={`Khách hàng "${archiveTarget?.name}" sẽ được chuyển sang trạng thái Đã lưu trữ (Archived) nhưng vẫn giữ lịch sử giao dịch.`}
        confirmLabel="Lưu trữ"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={async () => {
          if (archiveTarget) {
            await archiveCustomer(archiveTarget.id);
            addToast('Đã lưu trữ khách hàng', archiveTarget.name, 'info');
            setArchiveTarget(null);
          }
        }}
      />
    </div>
  );
};
