import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { Button, KpiCard, Select } from '../../components/ui/Primitives';
import { exportToCsv } from '../../services/firestoreService';

export const ReportsModule: React.FC = () => {
  const { can } = useAuth();
  const { kpis, customers, leads, deals, tickets, employees, formatMoney } = useCRM();

  const [reportType, setReportType] = useState<'executive' | 'sales' | 'service' | 'agents'>('executive');

  const segmentBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number; ltvMillions: number }> = {};
    customers
      .filter((c) => c.status !== 'archived')
      .forEach((c) => {
        if (!map[c.segment]) map[c.segment] = { name: c.segment, count: 0, ltvMillions: 0 };
        map[c.segment].count += 1;
        map[c.segment].ltvMillions += Math.round(c.lifetimeValue / 1_000_000);
      });
    return Object.values(map);
  }, [customers]);

  const leadFunnel = useMemo(() => {
    const stages = ['New', 'Assigned', 'Contacted', 'Qualified', 'Opportunity', 'Converted'];
    return stages.map((st) => ({
      stage: st,
      count: leads.filter((l) => l.status === st).length,
    }));
  }, [leads]);

  const agentPerf = useMemo(
    () =>
      employees.map((e) => ({
        name: e.fullName,
        role: e.position,
        kpiScore: e.kpiScore,
        achievedMillions: Math.round(e.achievedRevenue / 1_000_000),
        targetMillions: Math.round(e.targetRevenue / 1_000_000),
        attainment: e.targetRevenue > 0 ? Math.round((e.achievedRevenue / e.targetRevenue) * 100) : 0,
      })),
    [employees]
  );

  const exportReport = () => {
    exportToCsv(`onecrm-report-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`, [
      {
        ReportType: reportType,
        TotalCustomers: kpis.totalCustomers,
        TotalLeads: kpis.totalLeads,
        LeadConversionRatePct: kpis.leadConversionRate,
        WonRevenue: kpis.wonRevenue,
        PipelineValue: kpis.pipelineValue,
        WinRatePct: kpis.winRate,
        SlaCompliancePct: kpis.slaCompliance,
        CsatAvg: kpis.csatAvg,
        NpsAvg: kpis.npsAvg,
      },
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">12. Báo cáo Phân tích & Business Intelligence</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Số liệu tính toán trực tiếp từ tập dữ liệu CRM hiện hành, minh bạch công thức và hỗ trợ xuất CSV / In PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <Select value={reportType} onChange={(e) => setReportType(e.target.value as typeof reportType)}>
              <option value="executive">Báo cáo Tổng hợp Lãnh đạo</option>
              <option value="sales">Phân tích Bán hàng & Phễu</option>
              <option value="service">Hiệu suất CSKH & SLA</option>
              <option value="agents">Hiệu suất Nhân sự</option>
            </Select>
          </div>
          {can('reports', 'export') && (
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="w-3.5 h-3.5" /> Xuất CSV
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" /> In / Lưu PDF
          </Button>
        </div>
      </div>

      {/* Formula Transparency Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Doanh thu Thắng" value={formatMoney(kpis.wonRevenue)} hint="Deal Won + Order đã thanh toán" icon={<BarChart3 className="w-4 h-4" />} accent="green" />
        <KpiCard label="Tỷ lệ Chuyển đổi Lead" value={`${kpis.leadConversionRate}%`} hint="Converted / Tổng Lead" icon={<BarChart3 className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Win Rate Cơ hội" value={`${kpis.winRate}%`} hint="Closed Won / Tổng đã đóng" icon={<BarChart3 className="w-4 h-4" />} accent="cyan" />
        <KpiCard label="SLA & CSAT" value={`${kpis.slaCompliance}% · ${kpis.csatAvg}/5`} hint={`NPS ${kpis.npsAvg} · FCR ${kpis.fcrRate}%`} icon={<BarChart3 className="w-4 h-4" />} accent="purple" />
      </div>

      {(reportType === 'executive' || reportType === 'sales') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">LTV Khách hàng theo Phân khúc (Triệu VND)</h2>
            <p className="text-xs text-slate-500 mb-4">Tổng hợp từ {customers.length} hồ sơ khách hàng</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="ltvMillions" name="LTV (Triệu VND)" fill="#1951fc" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Phễu Chuyển đổi Lead</h2>
            <p className="text-xs text-slate-500 mb-4">Số lượng Lead theo từng trạng thái xử lý</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadFunnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số Lead" fill="#22c7e8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {reportType === 'service' && (
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Phân bổ Ticket theo Mức độ & Danh mục</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {(['urgent', 'high', 'medium', 'low'] as const).map((prio) => {
              const count = tickets.filter((t) => t.priority === prio).length;
              return (
                <div key={prio} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <p className="uppercase font-mono text-slate-500">{prio}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reportType === 'agents' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nhân sự</th>
                  <th className="px-4 py-3 font-semibold">Chức danh</th>
                  <th className="px-4 py-3 font-semibold text-right">Điểm KPI</th>
                  <th className="px-4 py-3 font-semibold text-right">Đạt / Chỉ tiêu (Triệu)</th>
                  <th className="px-4 py-3 font-semibold text-right">Tỷ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agentPerf.map((a) => (
                  <tr key={a.name}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{a.name}</td>
                    <td className="px-4 py-3">{a.role}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.kpiScore}/100</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.achievedMillions} / {a.targetMillions}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#1951fc] dark:text-[#22c7e8]">
                      {a.attainment}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400">
        <strong>Minh bạch công thức:</strong> Mọi chỉ số trên trang này được tính trực tiếp từ {customers.length} khách hàng, {leads.length} lead, {deals.length} cơ hội và {tickets.length} ticket đang lưu trữ trên Cloud Firestore.
      </div>
    </div>
  );
};
