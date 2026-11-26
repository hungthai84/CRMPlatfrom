import React, { useState } from 'react';
import { Building2, Users } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { StatusLabel } from '../../components/ui/Primitives';

export const EmployeesModule: React.FC = () => {
  const { employees, departments, teams, formatMoney } = useCRM();
  const [tab, setTab] = useState<'employees' | 'org'>('employees');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">13. Nhân sự, Phòng ban & Nhóm Vận hành</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi trạng thái trực ca, khối lượng xử lý (Workload) và tiến độ doanh số mục tiêu của nhân sự.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setTab('employees')}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer ${
              tab === 'employees' ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Nhân viên ({employees.length})
          </button>
          <button
            onClick={() => setTab('org')}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer ${
              tab === 'org' ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Phòng ban & Nhóm ({departments.length})
          </button>
        </div>
      </div>

      {tab === 'employees' ? (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã & Họ tên</th>
                  <th className="px-4 py-3 font-semibold">Phòng ban / Nhóm</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái Agent</th>
                  <th className="px-4 py-3 font-semibold">Ca trực</th>
                  <th className="px-4 py-3 font-semibold text-right">Workload</th>
                  <th className="px-4 py-3 font-semibold">KPI Doanh số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((e) => {
                  const pct = e.targetRevenue > 0 ? Math.min(100, Math.round((e.achievedRevenue / e.targetRevenue) * 100)) : 0;
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{e.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{e.code} · {e.position}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{e.departmentName}</p>
                        <p className="text-[11px] text-slate-400">{e.teamName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusLabel
                          tone={e.agentStatus === 'online' ? 'success' : e.agentStatus === 'busy' ? 'warning' : 'neutral'}
                          text={e.agentStatus}
                        />
                      </td>
                      <td className="px-4 py-3">{e.shift}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{e.workload} việc</td>
                      <td className="px-4 py-3 min-w-[170px]">
                        <div className="flex justify-between text-[11px] tabular-nums mb-1">
                          <span>{formatMoney(e.achievedRevenue)}</span>
                          <span className="font-semibold">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-[#1951fc]" style={{ width: `${pct}%` }} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Danh sách Phòng ban ({departments.length})</h2>
            {departments.map((d) => (
              <div key={d.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{d.name}</p>
                  <p className="font-mono text-[11px] text-slate-400">{d.code}</p>
                </div>
                <span className="tabular-nums font-medium">{d.memberCount} nhân sự</span>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Nhóm Chuyên trách ({teams.length})</h2>
            {teams.map((tm) => (
              <div key={tm.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">{tm.name}</span>
                <span className="tabular-nums text-slate-500">{tm.memberIds.length} thành viên</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
