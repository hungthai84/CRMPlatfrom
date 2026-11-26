import React, { useMemo, useState } from 'react';
import { Globe, Mail, Megaphone, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { Campaign } from '../../types/crm';
import { Button, Input, KpiCard, Modal, Select, StatusLabel } from '../../components/ui/Primitives';

export const MarketingModule: React.FC = () => {
  const { can } = useAuth();
  const { campaigns, customers, formatMoney, createCampaign, updateCampaign, createLead } = useCRM();
  const { addToast } = useToast();

  const [tab, setTab] = useState<'campaigns' | 'journey' | 'webform'>('campaigns');
  const [formOpen, setFormOpen] = useState(false);

  const [fName, setFName] = useState('');
  const [fChannel, setFChannel] = useState<Campaign['channel']>('Email');
  const [fBudget, setFBudget] = useState('35000000');
  const [fSegment, setFSegment] = useState('Khách hàng đồng ý nhận Email (VN PDPL)');
  const [fUtm, setFUtm] = useState('onecrm_q2');

  // Web Form Lead Capture test form
  const [wfName, setWfName] = useState('');
  const [wfPhone, setWfPhone] = useState('');
  const [wfEmail, setWfEmail] = useState('');
  const [wfCompany, setWfCompany] = useState('');

  const consentedEmailCount = useMemo(
    () => customers.filter((c) => c.status !== 'archived' && c.consent?.marketingEmail).length,
    [customers]
  );
  const consentedZaloCount = useMemo(
    () => customers.filter((c) => c.status !== 'archived' && c.consent?.marketingSmsZalo).length,
    [customers]
  );

  const totalRevenue = campaigns.reduce((s, c) => s + c.revenueAttributed, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const roi = totalSpent > 0 ? Math.round(((totalRevenue - totalSpent) / totalSpent) * 100) : 0;

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCampaign({
      name: fName,
      channel: fChannel,
      budget: Number(fBudget) || 0,
      segment: fSegment,
      utmSource: fUtm,
    });
    addToast('Đã tạo chiến dịch Marketing', fName, 'success');
    setFormOpen(false);
    setFName('');
  };

  const handleWebFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createLead({
      name: wfName,
      company: wfCompany,
      phone: wfPhone,
      email: wfEmail,
      source: 'Website',
      estimatedValue: 75_000_000,
      notes: 'Thu thập trực tiếp từ Web Form Landing Page ONECRM.',
    });
    addToast('Đã thu nhận Lead từ Web Form', `Mã ${created.code} đã vào phễu phân công tự động.`, 'success');
    setWfName('');
    setWfPhone('');
    setWfEmail('');
    setWfCompany('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">08. Marketing CRM, Phân khúc & Hành trình</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý chiến dịch, kiểm tra đồng ý VN PDPL trước khi gửi, ROI UTM & Web Form thu thập Lead trực tiếp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
            {[
              { id: 'campaigns', label: 'Chiến dịch & ROI' },
              { id: 'journey', label: 'Hành trình Khách hàng' },
              { id: 'webform', label: 'Web Form Lead' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`px-3 py-1.5 text-xs cursor-pointer ${
                  tab === t.id ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {can('marketing', 'create') && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Tạo Chiến dịch
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Chiến dịch Hoạt động" value={campaigns.filter((c) => c.status === 'Active').length} hint={`Tổng ${campaigns.length} chiến dịch`} icon={<Megaphone className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Đồng ý Email (PDPL)" value={consentedEmailCount} hint={`${consentedZaloCount} đồng ý SMS/Zalo`} icon={<ShieldCheck className="w-4 h-4" />} accent="green" />
        <KpiCard label="Doanh thu Quy bổ" value={formatMoney(totalRevenue)} hint={`Chi phí ${formatMoney(totalSpent)}`} icon={<Mail className="w-4 h-4" />} accent="cyan" />
        <KpiCard label="ROI Marketing" value={`${roi}%`} hint="Tính từ chiến dịch thực" icon={<Globe className="w-4 h-4" />} accent="purple" />
      </div>

      {tab === 'campaigns' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Chiến dịch</th>
                  <th className="px-4 py-3 font-semibold">Kênh & UTM</th>
                  <th className="px-4 py-3 font-semibold text-right">Ngân sách</th>
                  <th className="px-4 py-3 font-semibold text-right">Open / Click</th>
                  <th className="px-4 py-3 font-semibold text-right">Leads</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{c.code} · {c.segment}</p>
                    </td>
                    <td className="px-4 py-3">{c.channel} · utm={c.utmSource}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(c.budget)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.openRate}% / {c.clickRate}%</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{c.leadsGenerated}</td>
                    <td className="px-4 py-3">
                      <StatusLabel tone={c.status === 'Active' ? 'success' : c.status === 'Draft' ? 'neutral' : 'info'} text={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'Draft' && can('marketing', 'approve') && (
                        <button
                          onClick={async () => {
                            if (consentedEmailCount === 0) {
                              addToast('Chặn phát hành', 'Không có khách hàng nào có đồng ý Email hợp lệ.', 'error');
                              return;
                            }
                            await updateCampaign(c.id, { status: 'Active', audienceCount: consentedEmailCount });
                            addToast('Đã kích hoạt chiến dịch', `Đối tượng hợp lệ PDPL: ${consentedEmailCount} khách hàng.`, 'success');
                          }}
                          className="text-[#1951fc] hover:underline cursor-pointer"
                        >
                          Kích hoạt (Kiểm tra PDPL)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'journey' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '1. Nhận biết', desc: 'Thu thập Lead từ Web Form, Quảng cáo & Mạng xã hội', count: consentedEmailCount },
            { step: '2. Nuôi dưỡng', desc: 'Chuỗi Email chào mừng & Tài liệu chuyên sâu theo phân khúc', count: campaigns.length },
            { step: '3. Chuyển đổi', desc: 'Lead Qualified chuyển thành Cơ hội Bán hàng', count: customers.length },
            { step: '4. Onboarding', desc: 'Kích hoạt Hợp đồng, bàn giao Tài khoản & Cổng Portal', count: customers.filter((c) => c.status === 'active').length },
            { step: '5. Giữ chân', desc: 'Khảo sát CSAT/NPS, Nhắc gia hạn & Tích điểm Loyalty', count: consentedZaloCount },
          ].map((j) => (
            <div key={j.step} className="glass-card rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-[#1951fc] dark:text-[#22c7e8]">{j.step}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{j.desc}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{j.count}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'webform' && (
        <div className="glass-card rounded-xl p-6 max-w-xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Biểu mẫu Thu thập Lead Trực tiếp (Web Form Embed)</h2>
          <p className="text-xs text-slate-500 mb-4">
            Dữ liệu gửi từ biểu mẫu này được ghi trực tiếp vào phân hệ 03 (Lead Management) và kích hoạt phân công tự động.
          </p>
          <form onSubmit={handleWebFormSubmit} className="space-y-3">
            <Input label="Họ và tên" required value={wfName} onChange={(e) => setWfName(e.target.value)} />
            <Input label="Tên doanh nghiệp" value={wfCompany} onChange={(e) => setWfCompany(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Số điện thoại" required value={wfPhone} onChange={(e) => setWfPhone(e.target.value)} />
              <Input label="Email" type="email" required value={wfEmail} onChange={(e) => setWfEmail(e.target.value)} />
            </div>
            <Button type="submit">Gửi thông tin & Tạo Lead thật</Button>
          </form>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Tạo Chiến dịch Marketing mới">
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <Input label="Tên chiến dịch" required value={fName} onChange={(e) => setFName(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Kênh triển khai" value={fChannel} onChange={(e) => setFChannel(e.target.value as Campaign['channel'])}>
              <option value="Email">Email</option>
              <option value="Zalo">Zalo OA</option>
              <option value="SMS">SMS</option>
              <option value="Social">Social</option>
              <option value="Multi-channel">Đa kênh</option>
            </Select>
            <Input label="Ngân sách (VND)" type="number" value={fBudget} onChange={(e) => setFBudget(e.target.value)} />
          </div>
          <Input label="Phân khúc đối tượng" value={fSegment} onChange={(e) => setFSegment(e.target.value)} />
          <Input label="UTM Source" value={fUtm} onChange={(e) => setFUtm(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu Chiến dịch</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
