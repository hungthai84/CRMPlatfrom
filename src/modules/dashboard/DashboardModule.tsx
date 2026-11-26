import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  Briefcase,
  CheckSquare,
  Download,
  Headphones,
  SlidersHorizontal,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCRM } from '../../contexts/CRMContext';
import { ModuleKey } from '../../types/crm';
import { Button, KpiCard, Select, StatusLabel } from '../../components/ui/Primitives';
import { exportToCsv } from '../../services/firestoreService';

const CHART_COLORS = ['#1951fc', '#22c7e8', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

export const DashboardModule: React.FC<{ onNavigate: (mod: ModuleKey) => void }> = ({ onNavigate }) => {
  const {
    kpis,
    customers,
    leads,
    deals,
    tickets,
    tasks,
    activities,
    formatMoney,
    organization,
  } = useCRM();

  const [period, setPeriod] = useState<'all' | '30d' | '7d'>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [customizing, setCustomizing] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<string[]>(['kpis', 'charts', 'ops']);
  const [hiddenWidgets, setHiddenWidgets] = useState<Record<string, boolean>>({});

  const filteredDeals = useMemo(() => {
    const cutoff = period === '7d' ? Date.now() - 7 * 86_400_000 : period === '30d' ? Date.now() - 30 * 86_400_000 : 0;
    return deals.filter((d) => {
      if (cutoff && d.createdAt < cutoff) return false;
      if (segmentFilter !== 'all') {
        const cust = customers.find((c) => c.id === d.customerId);
        if (cust && cust.segment !== segmentFilter) return false;
      }
      return true;
    });
  }, [deals, customers, period, segmentFilter]);

  const stageChartData = useMemo(() => {
    const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    return stages.map((stage) => {
      const items = filteredDeals.filter((d) => d.stage === stage);
      return {
        stage,
        count: items.length,
        valueMillions: Math.round(items.reduce((s, d) => s + d.value, 0) / 1_000_000),
      };
    });
  }, [filteredDeals]);

  const leadSourceData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      map[l.source] = (map[l.source] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const toggleWidget = (key: string) => {
    setHiddenWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const moveWidgetUp = (idx: number) => {
    if (idx === 0) return;
    setWidgetOrder((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const exportDashboardSnapshot = () => {
    exportToCsv(`onecrm-dashboard-kpi-${new Date().toISOString().slice(0, 10)}.csv`, [
      {
        Organization: organization?.name || 'ONECRM',
        TotalCustomers: kpis.totalCustomers,
        TotalLeads: kpis.totalLeads,
        LeadConversionRatePct: kpis.leadConversionRate,
        OpenDeals: kpis.openDeals,
        PipelineValue: kpis.pipelineValue,
        WonRevenue: kpis.wonRevenue,
        WinRatePct: kpis.winRate,
        OpenTickets: kpis.openTickets,
        SlaCompliancePct: kpis.slaCompliance,
        CsatAvg: kpis.csatAvg,
      },
    ]);
  };

  const urgentTickets = tickets
    .filter((t) => t.status !== 'Resolved' && t.status !== 'Closed')
    .sort((a, b) => a.slaDeadline - b.slaDeadline)
    .slice(0, 5);

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            01. Bảng điều hành Tổng quan (Executive Dashboard)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chỉ số kinh doanh, đường ống bán hàng, hiệu suất SLA & hoạt động hợp nhất theo thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36">
            <Select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} aria-label="Khoảng thời gian">
              <option value="all">Toàn thời gian</option>
              <option value="30d">30 ngày gần nhất</option>
              <option value="7d">7 ngày gần nhất</option>
            </Select>
          </div>
          <div className="w-40">
            <Select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)} aria-label="Phân khúc">
              <option value="all">Tất cả phân khúc</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="SMB">SMB</option>
              <option value="VIP">VIP</option>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCustomizing((v) => !v)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Tùy chỉnh Widget
          </Button>
          <Button variant="outline" size="sm" onClick={exportDashboardSnapshot}>
            <Download className="w-3.5 h-3.5" />
            Xuất KPI CSV
          </Button>
        </div>
      </div>

      {customizing && (
        <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Bố cục & Ẩn/Hiện khối thông tin:
          </span>
          {widgetOrder.map((key, idx) => {
            const labels: Record<string, string> = {
              kpis: 'Thẻ KPI Tổng hợp',
              charts: 'Biểu đồ Pipeline & Nguồn Lead',
              ops: 'Ticket SLA, Công việc & Nhật ký',
            };
            return (
              <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={!hiddenWidgets[key]}
                  onChange={() => toggleWidget(key)}
                />
                <span>{labels[key]}</span>
                {idx > 0 && (
                  <button onClick={() => moveWidgetUp(idx)} className="text-[#1951fc] cursor-pointer" title="Đưa lên trước">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {widgetOrder.map((widgetKey) => {
        if (hiddenWidgets[widgetKey]) return null;

        if (widgetKey === 'kpis') {
          return (
            <div key="kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard
                label="Tổng Khách hàng"
                value={kpis.totalCustomers}
                hint={`${kpis.activeCustomers} đang hoạt động`}
                icon={<Users className="w-4 h-4" />}
                accent="blue"
              />
              <KpiCard
                label="Lead & Tỷ lệ CĐ"
                value={kpis.totalLeads}
                hint={`Chuyển đổi ${kpis.leadConversionRate}%`}
                icon={<UserPlus className="w-4 h-4" />}
                accent="cyan"
              />
              <KpiCard
                label="Doanh thu Đã chốt"
                value={formatMoney(kpis.wonRevenue)}
                hint={`Win Rate ${kpis.winRate}%`}
                icon={<TrendingUp className="w-4 h-4" />}
                accent="green"
              />
              <KpiCard
                label="Giá trị Pipeline"
                value={formatMoney(kpis.pipelineValue)}
                hint={`${kpis.openDeals} cơ hội đang mở`}
                icon={<Briefcase className="w-4 h-4" />}
                accent="purple"
              />
              <KpiCard
                label="Ticket & SLA"
                value={`${kpis.slaCompliance}%`}
                hint={`${kpis.openTickets} mở · ${kpis.overdueTickets} quá hạn`}
                icon={<Headphones className="w-4 h-4" />}
                accent={kpis.overdueTickets > 0 ? 'rose' : 'green'}
              />
              <KpiCard
                label="Công việc Tồn"
                value={kpis.pendingTasks}
                hint={`${kpis.overdueTasks} quá hạn`}
                icon={<CheckSquare className="w-4 h-4" />}
                accent={kpis.overdueTasks > 0 ? 'amber' : 'blue'}
              />
            </div>
          );
        }

        if (widgetKey === 'charts') {
          return (
            <div key="charts" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Đường ống Bán hàng theo Giai đoạn (Triệu VND)
                    </h2>
                    <p className="text-xs text-slate-500">Tổng hợp trực tiếp từ {filteredDeals.length} cơ hội</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onNavigate('sales')}>
                    Mở Sales CRM
                  </Button>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="valueMillions" name="Giá trị (Triệu)" fill="#1951fc" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Nguồn Lead đầu vào</h2>
                    <p className="text-xs text-slate-500">Phân bổ {leads.length} Lead</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onNavigate('leads')}>
                    Chi tiết
                  </Button>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadSourceData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                        {leadSourceData.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key="ops" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* SLA Tickets */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Ticket Cần xử lý SLA
                </h2>
                <button onClick={() => onNavigate('service')} className="text-xs text-[#1951fc] hover:underline cursor-pointer">
                  Tất cả
                </button>
              </div>
              <div className="space-y-2.5">
                {urgentTickets.length === 0 ? (
                  <p className="text-xs text-slate-500">Tất cả Ticket đã được giải quyết.</p>
                ) : (
                  urgentTickets.map((t) => {
                    const overdue = t.slaDeadline < Date.now();
                    return (
                      <div key={t.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {t.code} · {t.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.customerName}</p>
                        </div>
                        <StatusLabel tone={overdue ? 'danger' : 'warning'} text={overdue ? 'Quá SLA' : t.priority} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Công việc & Lịch hẹn</h2>
                <button onClick={() => onNavigate('tasks')} className="text-xs text-[#1951fc] hover:underline cursor-pointer">
                  Mở lịch
                </button>
              </div>
              <div className="space-y-2.5">
                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-slate-500">Không có công việc tồn đọng.</p>
                ) : (
                  upcomingTasks.map((tk) => (
                    <div key={tk.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{tk.title}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {tk.assigneeName} · Hạn {tk.dueDate}
                        </p>
                      </div>
                      <StatusLabel tone={tk.priority === 'urgent' ? 'danger' : 'info'} text={tk.priority} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Hoạt động Hệ thống Gần đây</h2>
              <div className="space-y-2.5">
                {activities.slice(0, 6).map((act) => (
                  <div key={act.id} className="pb-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{act.entityName}</span>
                      <span className="tabular-nums">{new Date(act.timestamp).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{act.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
