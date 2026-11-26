import React, { useState } from 'react';
import { Award, PlusCircle, Ticket as VoucherIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { LoyaltyRecord } from '../../types/crm';
import { Button, Input, KpiCard, Modal, StatusLabel } from '../../components/ui/Primitives';

export const LoyaltyModule: React.FC = () => {
  const { can } = useAuth();
  const { loyalty, adjustLoyaltyPoints, createTask } = useCRM();
  const { addToast } = useToast();

  const [adjustTarget, setAdjustTarget] = useState<LoyaltyRecord | null>(null);
  const [deltaPoints, setDeltaPoints] = useState('500');
  const [adjustReason, setAdjustReason] = useState('Thưởng gia hạn hợp đồng đúng hạn');

  const platinumGoldCount = loyalty.filter((l) => l.tier === 'Platinum' || l.tier === 'Gold').length;
  const highChurnCount = loyalty.filter((l) => l.churnRisk === 'high').length;
  const totalPoints = loyalty.reduce((s, l) => s + l.points, 0);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const delta = Number(deltaPoints) || 0;
    await adjustLoyaltyPoints(adjustTarget.id, delta, adjustReason);
    addToast('Đã điều chỉnh điểm thành viên', `${adjustTarget.customerName}: ${delta >= 0 ? '+' : ''}${delta} điểm`, 'success');
    setAdjustTarget(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-[#1951fc]" />
          18. Chương trình Khách hàng Thân thiết & Giữ chân (Loyalty)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Quản lý hạng thành viên (Bronze/Silver/Gold/Platinum), tích/đổi điểm có Audit Log, Voucher & cảnh báo Churn Risk.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Thành viên Loyalty" value={loyalty.length} hint={`${platinumGoldCount} hạng Gold / Platinum`} icon={<Award className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Tổng điểm Khả dụng" value={totalPoints.toLocaleString('vi-VN')} hint="Trên toàn bộ hội viên" icon={<VoucherIcon className="w-4 h-4" />} accent="green" />
        <KpiCard label="Rủi ro Rời bỏ Cao" value={highChurnCount} hint="Cần kích hoạt Win-back" icon={<PlusCircle className="w-4 h-4" />} accent={highChurnCount > 0 ? 'rose' : 'green'} />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Khách hàng</th>
                <th className="px-4 py-3 font-semibold">Hạng</th>
                <th className="px-4 py-3 font-semibold text-right">Điểm khả dụng</th>
                <th className="px-4 py-3 font-semibold text-right">Tích lũy</th>
                <th className="px-4 py-3 font-semibold">Voucher</th>
                <th className="px-4 py-3 font-semibold">Churn Risk</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loyalty.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{l.customerName}</td>
                  <td className="px-4 py-3 font-medium text-[#1951fc] dark:text-[#22c7e8]">{l.tier}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{l.points.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{l.lifetimePoints.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    {l.vouchers[0] ? `${l.vouchers[0].code} (${l.vouchers[0].discountLabel})` : 'Không có'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusLabel
                      tone={l.churnRisk === 'high' ? 'danger' : l.churnRisk === 'medium' ? 'warning' : 'success'}
                      text={l.churnRisk}
                    />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                    {can('loyalty', 'edit') && (
                      <button onClick={() => setAdjustTarget(l)} className="text-[#1951fc] hover:underline cursor-pointer">
                        Cộng/Trừ điểm
                      </button>
                    )}
                    {l.churnRisk !== 'low' && (
                      <button
                        onClick={async () => {
                          await createTask({
                            title: `Win-back chăm sóc ${l.customerName}`,
                            description: `Khách hàng có mức rủi ro rời bỏ ${l.churnRisk}. Tặng ưu đãi giữ chân.`,
                            priority: 'high',
                            linkedType: 'customer',
                            linkedId: l.customerId,
                            linkedName: l.customerName,
                          });
                          addToast('Đã tạo chiến dịch Win-back cá nhân', l.customerName, 'success');
                        }}
                        className="text-amber-600 hover:underline cursor-pointer"
                      >
                        Win-back
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={Boolean(adjustTarget)} onClose={() => setAdjustTarget(null)} title={`Điều chỉnh điểm · ${adjustTarget?.customerName}`}>
        <form onSubmit={handleAdjust} className="space-y-4">
          <Input label="Số điểm thay đổi (âm để trừ điểm)" type="number" required value={deltaPoints} onChange={(e) => setDeltaPoints(e.target.value)} />
          <Input label="Lý do điều chỉnh (Lưu Audit Log)" required value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAdjustTarget(null)}>Hủy</Button>
            <Button type="submit">Xác nhận Điều chỉnh</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
