import React from 'react';
import { AlertTriangle, Clock, Sparkles, TrendingUp, X } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { ModuleKey } from '../../types/crm';

export const RightInsightPanel: React.FC<{
  open: boolean;
  onClose: () => void;
  onNavigate: (mod: ModuleKey) => void;
}> = ({ open, onClose, onNavigate }) => {
  const { kpis, tickets, tasks, contracts, activities, formatMoney } = useCRM();

  if (!open) return null;

  const urgentTickets = tickets
    .filter((t) => t.status !== 'Resolved' && t.status !== 'Closed' && (t.priority === 'urgent' || t.slaDeadline < Date.now()))
    .slice(0, 3);

  const expiringContracts = contracts.filter((c) => c.status === 'expiring_soon').slice(0, 3);

  return (
    <aside className="hidden xl:flex w-80 flex-col border-l border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0f2142]/80 shrink-0 overflow-y-auto custom-scrollbar">
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10">
        <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#1951fc] dark:text-[#22c7e8]" />
          Insight & Cảnh báo Thời gian thực
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          aria-label="Đóng bảng insight"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Pipeline Snapshot */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#1951fc]" />
            Đường ống Doanh thu
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {formatMoney(kpis.pipelineValue)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {kpis.openDeals} cơ hội đang mở · Win Rate {kpis.winRate}%
          </p>
        </div>

        {/* SLA Warnings */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Cảnh báo SLA ({urgentTickets.length})
            </span>
            <button
              onClick={() => onNavigate('service')}
              className="text-[11px] text-[#1951fc] dark:text-[#22c7e8] hover:underline cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
          {urgentTickets.length === 0 ? (
            <p className="text-xs text-slate-500">Không có Ticket quá hạn SLA.</p>
          ) : (
            <div className="space-y-2">
              {urgentTickets.map((t) => (
                <div key={t.id} className="p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/20">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{t.code} · {t.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{t.customerName}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Contracts */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#1951fc]" />
              Hợp đồng sắp gia hạn ({expiringContracts.length})
            </span>
            <button
              onClick={() => onNavigate('products')}
              className="text-[11px] text-[#1951fc] dark:text-[#22c7e8] hover:underline cursor-pointer"
            >
              Chi tiết
            </button>
          </div>
          {expiringContracts.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có hợp đồng sắp hết hạn.</p>
          ) : (
            <div className="space-y-2">
              {expiringContracts.map((c) => (
                <div key={c.id} className="p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{c.code}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {c.customerName} · Hạn {c.endDate}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Cross-Module Activity */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-white/10 space-y-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
            Hoạt động gần đây ({tasks.filter((t) => t.status !== 'done').length} task mở)
          </span>
          <div className="space-y-2">
            {activities.slice(0, 4).map((a) => (
              <div key={a.id} className="text-xs">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{a.entityName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{a.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
