import React, { useState } from 'react';
import { Database, Download, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { ROLES } from '../../constants/rbac';
import { RoleId } from '../../types/crm';
import { Button, ConfirmDialog, Input, Select, StatusLabel } from '../../components/ui/Primitives';

export const AdminModule: React.FC = () => {
  const { activeRole, setActiveRolePreview, isSuperAdmin, profile, can } = useAuth();
  const {
    organization,
    updateOrganization,
    customers,
    customFields,
    addCustomField,
    slaPolicies,
    updateSlaPolicy,
    auditLogs,
    hasDemoData,
    resetDemoData,
    clearDemoData,
    exportBackupJson,
  } = useCRM();
  const { addToast } = useToast();

  const [tab, setTab] = useState<'org' | 'rbac' | 'fields_sla' | 'pdpl' | 'audit' | 'demo'>('org');

  const [orgName, setOrgName] = useState(organization?.name || 'ONECRM Enterprise Workspace');
  const [orgIndustry, setOrgIndustry] = useState(organization?.industry || '');
  const [orgTaxId, setOrgTaxId] = useState(organization?.taxId || '');
  const [orgCurrency, setOrgCurrency] = useState<'VND' | 'USD'>(organization?.currency || 'VND');

  const [cfModule, setCfModule] = useState<'customer' | 'lead' | 'ticket'>('customer');
  const [cfLabel, setCfLabel] = useState('');
  const [cfKey, setCfKey] = useState('');

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOrganization({
      name: orgName,
      industry: orgIndustry,
      taxId: orgTaxId,
      currency: orgCurrency,
    });
    addToast('Đã cập nhật cấu hình Tổ chức', orgName, 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1951fc]" />
            17. Quản trị Tổ chức, Phân quyền RBAC & Bảo mật
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hồ sơ tổ chức, ma trận 13 vai trò RBAC, chính sách SLA, VN PDPL, nhật ký kiểm toán & chuyển đổi Demo / Thực tế.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={exportBackupJson}>
          <Download className="w-3.5 h-3.5" /> Sao lưu Toàn bộ JSON
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'org', label: 'Hồ sơ Tổ chức' },
          { id: 'rbac', label: 'Phân quyền 13 Vai trò' },
          { id: 'fields_sla', label: 'Trường tùy biến & SLA' },
          { id: 'pdpl', label: 'Tuân thủ VN PDPL' },
          { id: 'audit', label: `Audit Logs (${auditLogs.length})` },
          { id: 'demo', label: 'Dữ liệu Demo & Thực tế' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              tab === t.id ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'org' && (
        <form onSubmit={handleSaveOrg} className="glass-card rounded-xl p-6 max-w-2xl space-y-4">
          <Input label="Tên Tổ chức / Doanh nghiệp" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Ngành nghề" value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} />
            <Input label="Mã số thuế" value={orgTaxId} onChange={(e) => setOrgTaxId(e.target.value)} />
          </div>
          <Select label="Đơn vị tiền tệ hiển thị" value={orgCurrency} onChange={(e) => setOrgCurrency(e.target.value as 'VND' | 'USD')}>
            <option value="VND">VND (₫)</option>
            <option value="USD">USD ($)</option>
          </Select>
          {can('admin', 'manage_settings') && <Button type="submit">Lưu Thông tin Tổ chức</Button>}
        </form>
      )}

      {tab === 'rbac' && (
        <div className="space-y-4">
          {(isSuperAdmin || profile?.role === 'org_owner') && (
            <div className="glass-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Chế độ Xem thử góc nhìn Phân quyền (Role Perspective Switcher)
                </p>
                <p className="text-[11px] text-slate-500">
                  Dành cho Quản trị viên kiểm thử giao diện và quyền hạn của từng trong 13 vai trò RBAC.
                </p>
              </div>
              <div className="w-64">
                <Select value={activeRole} onChange={(e) => setActiveRolePreview(e.target.value as RoleId)}>
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.nameVi} (Level {r.level})</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã vai trò</th>
                  <th className="px-4 py-3 font-semibold">Tên vai trò</th>
                  <th className="px-4 py-3 font-semibold">Mô tả phạm vi quyền</th>
                  <th className="px-4 py-3 font-semibold text-right">Cấp độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ROLES.map((r) => (
                  <tr key={r.id} className={activeRole === r.id ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''}>
                    <td className="px-4 py-3 font-mono">{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.nameVi}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'fields_sla' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Trường dữ liệu Tùy biến (Custom Fields)</h2>
            <div className="space-y-2">
              {customFields.map((cf) => (
                <div key={cf.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs flex justify-between">
                  <span><strong>{cf.label}</strong> ({cf.module})</span>
                  <span className="font-mono text-slate-400">{cf.key} · {cf.fieldType}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Select value={cfModule} onChange={(e) => setCfModule(e.target.value as typeof cfModule)}>
                <option value="customer">Customer</option>
                <option value="lead">Lead</option>
                <option value="ticket">Ticket</option>
              </Select>
              <Input placeholder="Nhãn hiển thị" value={cfLabel} onChange={(e) => setCfLabel(e.target.value)} />
              <Input placeholder="Mã key (vd: tax_code)" value={cfKey} onChange={(e) => setCfKey(e.target.value)} />
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (!cfLabel || !cfKey) return;
                addCustomField({ module: cfModule, label: cfLabel, key: cfKey, fieldType: 'text', required: false });
                setCfLabel('');
                setCfKey('');
                addToast('Đã thêm trường tùy biến', cfLabel, 'success');
              }}
            >
              Thêm Custom Field
            </Button>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Chính sách SLA Hỗ trợ</h2>
            {slaPolicies.map((p) => (
              <div key={p.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                  <p className="text-slate-500">Phản hồi đầu: {p.firstResponseMinutes}p · Leo thang: {p.escalationTarget}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums"
                    value={p.resolutionHours}
                    onChange={(e) => updateSlaPolicy({ ...p, resolutionHours: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <span>giờ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'pdpl' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sổ đăng ký Đồng ý Xử lý Dữ liệu Cá nhân (Nghị định 13/2023/NĐ-CP)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Email MKT</th>
                  <th className="px-4 py-3">SMS/Zalo</th>
                  <th className="px-4 py-3">AI Processing</th>
                  <th className="px-4 py-3">Nguồn đồng ý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.filter((c) => c.status !== 'archived').slice(0, 15).map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5">{c.consent?.marketingEmail ? 'Có' : 'Không'}</td>
                    <td className="px-4 py-2.5">{c.consent?.marketingSmsZalo ? 'Có' : 'Không'}</td>
                    <td className="px-4 py-2.5">{c.consent?.aiProcessing ? 'Có' : 'Không'}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.consent?.consentSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Người thực hiện</th>
                  <th className="px-4 py-3">Hành động</th>
                  <th className="px-4 py-3">Phân hệ</th>
                  <th className="px-4 py-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.slice(0, 40).map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2.5 tabular-nums text-slate-500">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2.5 font-mono">{log.userEmail}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#1951fc]">{log.action}</td>
                    <td className="px-4 py-2.5">{log.module}</td>
                    <td className="px-4 py-2.5">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'demo' && (
        <div className="glass-card rounded-xl p-6 max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#1951fc]" />
              Quản lý Dữ liệu Mẫu (Demo Mode) & Chuyển sang Vận hành Thực tế
            </h2>
            <StatusLabel tone={hasDemoData ? 'warning' : 'success'} text={hasDemoData ? 'Đang bật dữ liệu Demo' : 'Dữ liệu Thực tế sạch'} />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Bộ dữ liệu mẫu gồm 25 Khách hàng, 20 Lead, 12 Deal, 20 Ticket, 15 Sản phẩm, 10 Đơn hàng, 10 Hợp đồng, 10 Chiến dịch, 10 Nhân sự... đều được gắn cờ <code className="font-mono">isDemo: true</code>. Bạn có thể khôi phục bộ mẫu hoặc xóa toàn bộ dữ liệu mẫu để giữ lại duy nhất dữ liệu thật của doanh nghiệp.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="w-3.5 h-3.5" /> Khôi phục / Nạp lại Dữ liệu Demo
            </Button>
            {hasDemoData && (
              <Button variant="danger" onClick={() => setConfirmClear(true)}>
                <Trash2 className="w-3.5 h-3.5" /> Xóa dữ liệu Demo (Chuyển sang Thực tế)
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Khôi phục Dữ liệu Mẫu?"
        description="Hệ thống sẽ làm mới toàn bộ các bản ghi mẫu (isDemo: true) trong Firestore. Dữ liệu thật do bạn tự tạo vẫn được giữ nguyên."
        confirmLabel="Khôi phục Demo"
        variant="primary"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetDemoData();
          setConfirmReset(false);
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Xóa sạch Dữ liệu Mẫu (Chuyển sang Sản xuất)?"
        description="Tất cả các bản ghi gắn nhãn isDemo sẽ bị xóa vĩnh viễn khỏi Cloud Firestore. Dữ liệu thật của bạn sẽ được giữ nguyên."
        confirmLabel="Xóa Dữ liệu Demo"
        onCancel={() => setConfirmClear(false)}
        onConfirm={async () => {
          await clearDemoData();
          setConfirmClear(false);
        }}
      />
    </div>
  );
};
