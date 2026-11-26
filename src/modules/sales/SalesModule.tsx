import React, { useMemo, useState } from 'react';
import { Briefcase, FileSpreadsheet, Kanban, List, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { Deal, DealStage, QuoteItem } from '../../types/crm';
import { dealSchema } from '../../schemas/crm';
import {
  Button,
  ConfirmDialog,
  Input,
  KpiCard,
  Modal,
  Select,
  StatusLabel,
} from '../../components/ui/Primitives';

const DEAL_STAGES: DealStage[] = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export const SalesModule: React.FC = () => {
  const { can } = useAuth();
  const { deals, customers, products, kpis, formatMoney, createDeal, updateDeal, deleteDeal } = useCRM();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'forecast'>('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const [quoteDeal, setQuoteDeal] = useState<Deal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);

  // Deal form
  const [fTitle, setFTitle] = useState('');
  const [fCustomerId, setFCustomerId] = useState('');
  const [fStage, setFStage] = useState<DealStage>('Discovery');
  const [fValue, setFValue] = useState('120000000');
  const [fProb, setFProb] = useState('40');
  const [fCloseDate, setFCloseDate] = useState(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10));
  const [fDiscount, setFDiscount] = useState('0');

  // Quote builder
  const [selectedProdId, setSelectedProdId] = useState('');
  const [quoteQty, setQuoteQty] = useState('1');
  const [quoteDiscount, setQuoteDiscount] = useState('0');

  const weightedForecast = useMemo(
    () => deals.filter((d) => d.status === 'open').reduce((s, d) => s + (d.value * d.probability) / 100, 0),
    [deals]
  );

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const custId = fCustomerId || customers[0]?.id || '';
      const parsed = dealSchema.parse({
        title: fTitle,
        customerId: custId,
        value: Number(fValue) || 0,
        probability: Number(fProb) || 30,
        expectedCloseDate: fCloseDate,
        discountPercent: Number(fDiscount) || 0,
      });
      await createDeal({ ...parsed, stage: fStage });
      addToast('Đã tạo cơ hội mới', parsed.title, 'success');
      setFormOpen(false);
      setFTitle('');
    } catch (err: unknown) {
      addToast('Lỗi thông tin cơ hội', err instanceof Error ? err.message : 'Vui lòng kiểm tra lại.', 'error');
    }
  };

  const handleAddQuoteItem = async () => {
    if (!quoteDeal) return;
    const prod = products.find((p) => p.id === (selectedProdId || products[0]?.id));
    if (!prod) return;
    const qty = Math.max(1, Number(quoteQty) || 1);
    const disc = Math.min(50, Math.max(0, Number(quoteDiscount) || 0));
    const total = Math.round(prod.price * qty * (1 - disc / 100));
    const item: QuoteItem = {
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice: prod.price,
      discountPercent: disc,
      total,
    };
    const nextItems = [...(quoteDeal.quoteItems || []), item];
    const nextValue = nextItems.reduce((s, i) => s + i.total, 0);
    await updateDeal(quoteDeal.id, {
      quoteItems: nextItems,
      value: nextValue,
      discountPercent: disc,
      approvalStatus: disc > 10 ? 'pending' : quoteDeal.approvalStatus,
    });
    setQuoteDeal({ ...quoteDeal, quoteItems: nextItems, value: nextValue });
    addToast('Đã thêm hạng mục báo giá', `${prod.name} x${qty}`, 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">04. Quản trị Bán hàng & Pipeline</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi cơ hội theo giai đoạn, tạo báo giá trực tiếp từ Danh mục Sản phẩm và dự báo doanh thu theo trọng số.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Pipeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Bảng
            </button>
            <button
              onClick={() => setViewMode('forecast')}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer ${
                viewMode === 'forecast' ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Dự báo
            </button>
          </div>
          {can('sales', 'create') && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Thêm Cơ hội
            </Button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Pipeline Đang mở" value={formatMoney(kpis.pipelineValue)} hint={`${kpis.openDeals} cơ hội`} icon={<Briefcase className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Dự báo Có trọng số" value={formatMoney(weightedForecast)} hint="Theo xác suất chốt" icon={<TrendingUp className="w-4 h-4" />} accent="cyan" />
        <KpiCard label="Doanh thu Thắng" value={formatMoney(kpis.wonRevenue)} hint={`Win Rate ${kpis.winRate}%`} icon={<TrendingUp className="w-4 h-4" />} accent="green" />
        <KpiCard label="Giá trị TB / Deal" value={formatMoney(kpis.avgDealSize)} hint="Trung bình toàn phễu" icon={<FileSpreadsheet className="w-4 h-4" />} accent="purple" />
      </div>

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const stageSum = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <div key={stage} className="glass-card rounded-xl p-3 space-y-2.5 min-w-[210px]">
                <div className="border-b border-slate-200/70 dark:border-slate-800 pb-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                    <span>{stage}</span>
                    <span className="tabular-nums text-slate-400">{stageDeals.length}</span>
                  </div>
                  <p className="text-[11px] text-[#1951fc] dark:text-[#22c7e8] font-semibold tabular-nums mt-0.5">
                    {formatMoney(stageSum)}
                  </p>
                </div>
                <div className="space-y-2">
                  {stageDeals.map((d) => (
                    <div key={d.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">{d.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{d.customerName}</p>
                      <div className="flex items-center justify-between text-[11px] tabular-nums">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatMoney(d.value)}</span>
                        <span className="text-slate-400">{d.probability}%</span>
                      </div>
                      {can('sales', 'edit') && (
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <select
                            value={d.stage}
                            onChange={(e) => updateDeal(d.id, { stage: e.target.value as DealStage })}
                            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-1 text-[11px]"
                          >
                            {DEAL_STAGES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setQuoteDeal(d)}
                            className="px-2 py-1 rounded bg-[#1951fc]/10 text-[#1951fc] dark:text-[#22c7e8] text-[11px] font-medium shrink-0 cursor-pointer"
                          >
                            Báo giá
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã & Cơ hội</th>
                  <th className="px-4 py-3 font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 font-semibold">Giai đoạn</th>
                  <th className="px-4 py-3 font-semibold text-right">Giá trị</th>
                  <th className="px-4 py-3 font-semibold text-right">Xác suất</th>
                  <th className="px-4 py-3 font-semibold">Duyệt giảm giá</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deals.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{d.title}</p>
                      <p className="text-[11px] font-mono text-slate-400">{d.code}</p>
                    </td>
                    <td className="px-4 py-3">{d.customerName}</td>
                    <td className="px-4 py-3">{d.stage}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(d.value)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.probability}%</td>
                    <td className="px-4 py-3">
                      <StatusLabel
                        tone={d.approvalStatus === 'pending' ? 'warning' : d.approvalStatus === 'approved' ? 'success' : 'neutral'}
                        text={d.approvalStatus}
                      />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <button onClick={() => setQuoteDeal(d)} className="text-[#1951fc] hover:underline cursor-pointer">
                        Báo giá
                      </button>
                      {can('sales', 'approve') && d.approvalStatus === 'pending' && (
                        <button
                          onClick={() => updateDeal(d.id, { approvalStatus: 'approved' })}
                          className="text-emerald-600 hover:underline cursor-pointer"
                        >
                          Duyệt
                        </button>
                      )}
                      {can('sales', 'delete') && (
                        <button onClick={() => setDeleteTarget(d)} className="text-rose-600 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5 inline" />
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

      {viewMode === 'forecast' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Dự báo Doanh thu theo Giai đoạn</h2>
          <div className="space-y-3">
            {DEAL_STAGES.filter((s) => s !== 'Closed Lost').map((stage) => {
              const items = deals.filter((d) => d.stage === stage);
              const total = items.reduce((s, d) => s + d.value, 0);
              const weighted = items.reduce((s, d) => s + (d.value * d.probability) / 100, 0);
              return (
                <div key={stage} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{stage} ({items.length} deal)</span>
                  <div className="flex items-center gap-6 tabular-nums">
                    <span>Tổng: <strong>{formatMoney(total)}</strong></span>
                    <span className="text-[#1951fc] dark:text-[#22c7e8]">Trọng số: <strong>{formatMoney(weighted)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Tạo Cơ hội Bán hàng mới">
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <Input label="Tên cơ hội" required value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
          <Select label="Khách hàng" value={fCustomerId} onChange={(e) => setFCustomerId(e.target.value)}>
            <option value="">-- Chọn khách hàng --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Giai đoạn" value={fStage} onChange={(e) => setFStage(e.target.value as DealStage)}>
              {DEAL_STAGES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </Select>
            <Input label="Ngày dự kiến chốt" type="date" value={fCloseDate} onChange={(e) => setFCloseDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Giá trị (VND)" type="number" value={fValue} onChange={(e) => setFValue(e.target.value)} />
            <Input label="Xác suất (%)" type="number" min={0} max={100} value={fProb} onChange={(e) => setFProb(e.target.value)} />
            <Input label="Chiết khấu (%)" type="number" min={0} max={50} value={fDiscount} onChange={(e) => setFDiscount(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu Cơ hội</Button>
          </div>
        </form>
      </Modal>

      {/* Quote Builder Modal */}
      <Modal
        open={Boolean(quoteDeal)}
        onClose={() => setQuoteDeal(null)}
        title={`Báo giá · ${quoteDeal?.code}`}
        subtitle={`${quoteDeal?.title} · Khách hàng: ${quoteDeal?.customerName}`}
        size="lg"
      >
        {quoteDeal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <div className="sm:col-span-2">
                <Select label="Sản phẩm / Dịch vụ" value={selectedProdId} onChange={(e) => setSelectedProdId(e.target.value)}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} · {p.name} ({formatMoney(p.price)})</option>
                  ))}
                </Select>
              </div>
              <Input label="Số lượng" type="number" min={1} value={quoteQty} onChange={(e) => setQuoteQty(e.target.value)} />
              <Input label="CK (%)" type="number" min={0} max={50} value={quoteDiscount} onChange={(e) => setQuoteDiscount(e.target.value)} />
            </div>
            <Button size="sm" onClick={handleAddQuoteItem}>Thêm vào Báo giá</Button>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2">Sản phẩm</th>
                    <th className="px-3 py-2 text-right">SL</th>
                    <th className="px-3 py-2 text-right">Đơn giá</th>
                    <th className="px-3 py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(quoteDeal.quoteItems || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{it.productName}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(it.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span>Tổng giá trị Báo giá:</span>
              <span className="tabular-nums text-[#1951fc] dark:text-[#22c7e8]">{formatMoney(quoteDeal.value)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa cơ hội bán hàng?"
        description={`Xác nhận xóa cơ hội "${deleteTarget?.title}" (${deleteTarget?.code})?`}
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteDeal(deleteTarget.id);
            addToast('Đã xóa cơ hội', deleteTarget.code, 'info');
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
