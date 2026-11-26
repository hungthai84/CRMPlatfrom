import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, CheckSquare, Kanban, List, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { TaskItem } from '../../types/crm';
import { taskSchema } from '../../schemas/crm';
import {
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Select,
  StatusLabel,
  Textarea,
} from '../../components/ui/Primitives';

const TASK_STATUSES: Array<{ id: TaskItem['status']; label: string }> = [
  { id: 'todo', label: 'Cần làm' },
  { id: 'in_progress', label: 'Đang thực hiện' },
  { id: 'review', label: 'Chờ duyệt' },
  { id: 'done', label: 'Hoàn thành' },
];

export const TasksModule: React.FC = () => {
  const { can } = useAuth();
  const { tasks, customers, employees, createTask, updateTask, deleteTask } = useCRM();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);

  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fPriority, setFPriority] = useState<TaskItem['priority']>('medium');
  const [fDueDate, setFDueDate] = useState(new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10));
  const [fType, setFType] = useState<TaskItem['type']>('task');
  const [fCustomerId, setFCustomerId] = useState('');
  const [fAssignee, setFAssignee] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const workloadByEmployee = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.filter((t) => t.status !== 'done').forEach((t) => {
      map[t.assigneeName] = (map[t.assigneeName] || 0) + 1;
    });
    return Object.entries(map).slice(0, 6);
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const m = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${m}-${day}`;
      return {
        day: i + 1,
        dateStr,
        items: tasks.filter((t) => t.dueDate === dateStr),
      };
    });
  }, [tasks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cust = customers.find((c) => c.id === fCustomerId);
      const parsed = taskSchema.parse({
        title: fTitle,
        description: fDesc,
        priority: fPriority,
        dueDate: fDueDate,
        type: fType,
        linkedType: cust ? 'customer' : undefined,
        linkedId: cust?.id,
      });
      await createTask({
        ...parsed,
        linkedName: cust?.name,
        assigneeName: fAssignee || undefined,
      });
      addToast('Đã tạo công việc mới', parsed.title, 'success');
      setFormOpen(false);
      setFTitle('');
      setFDesc('');
    } catch (err: unknown) {
      addToast('Dữ liệu công việc chưa hợp lệ', err instanceof Error ? err.message : 'Kiểm tra lại thông tin.', 'error');
    }
  };

  const toggleSubtask = async (task: TaskItem, subId: string) => {
    const nextSubs = (task.subtasks || []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    await updateTask(task.id, { subtasks: nextSubs });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">05. Công việc, Lịch hẹn & Phân bổ Tải</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi công việc liên kết Khách hàng/Deal/Ticket, lịch hẹn theo tháng và khối lượng công việc nhân viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
            {[
              { id: 'list', label: 'Danh sách', icon: <List className="w-3.5 h-3.5" /> },
              { id: 'kanban', label: 'Kanban', icon: <Kanban className="w-3.5 h-3.5" /> },
              { id: 'calendar', label: 'Lịch tháng', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as typeof viewMode)}
                className={`px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer ${
                  viewMode === v.id ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          {can('tasks', 'create') && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Tạo Công việc / Lịch hẹn
            </Button>
          )}
        </div>
      </div>

      {/* Workload Strip */}
      {workloadByEmployee.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Khối lượng công việc đang mở theo Nhân sự</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {workloadByEmployee.map(([name, count]) => (
              <div key={name} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-xs">
                <p className="font-medium text-slate-900 dark:text-white truncate">{name}</p>
                <p className="text-[11px] text-[#1951fc] dark:text-[#22c7e8] tabular-nums mt-0.5">{count} công việc mở</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Công việc</th>
                  <th className="px-4 py-3 font-semibold">Liên kết</th>
                  <th className="px-4 py-3 font-semibold">Phụ trách</th>
                  <th className="px-4 py-3 font-semibold">Hạn xử lý</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((t) => {
                  const overdue = t.status !== 'done' && t.dueDate < todayStr;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{t.code} · {t.type}</p>
                        {(t.subtasks || []).length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {t.subtasks.map((s) => (
                              <label key={s.id} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(t, s.id)} />
                                <span className={s.done ? 'line-through text-slate-400' : ''}>{s.title}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.linkedName || 'Nội bộ'}</td>
                      <td className="px-4 py-3">{t.assigneeName}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <StatusLabel tone={overdue ? 'danger' : 'neutral'} text={`${t.dueDate}${overdue ? ' (Quá hạn)' : ''}`} />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={t.status}
                          disabled={!can('tasks', 'edit')}
                          onChange={(e) => updateTask(t.id, { status: e.target.value as TaskItem['status'] })}
                          className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                        >
                          {TASK_STATUSES.map((st) => (
                            <option key={st.id} value={st.id}>{st.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {can('tasks', 'delete') && (
                          <button onClick={() => setDeleteTarget(t)} className="text-rose-600 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {TASK_STATUSES.map((st) => {
            const list = tasks.filter((t) => t.status === st.id);
            return (
              <div key={st.id} className="glass-card rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                  <span>{st.label}</span>
                  <span className="tabular-nums text-slate-400">{list.length}</span>
                </div>
                {list.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    <p className="text-[11px] text-slate-500">{t.assigneeName} · {t.dueDate}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Lịch công việc tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {calendarDays.map((d) => (
              <div key={d.day} className="min-h-[84px] p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
                <p className="text-[11px] font-mono font-semibold text-slate-500">{d.day}</p>
                <div className="mt-1 space-y-1">
                  {d.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="px-1.5 py-0.5 rounded bg-[#1951fc]/10 text-[#1951fc] dark:text-[#22c7e8] text-[10px] truncate">
                      {item.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Tạo Công việc / Lịch hẹn mới">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Tiêu đề" required value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Loại" value={fType} onChange={(e) => setFType(e.target.value as TaskItem['type'])}>
              <option value="task">Công việc</option>
              <option value="appointment">Lịch hẹn</option>
              <option value="follow_up">Theo dõi lại</option>
              <option value="meeting">Cuộc họp</option>
            </Select>
            <Select label="Độ ưu tiên" value={fPriority} onChange={(e) => setFPriority(e.target.value as TaskItem['priority'])}>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </Select>
            <Input label="Hạn hoàn thành" type="date" value={fDueDate} onChange={(e) => setFDueDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Liên kết Khách hàng" value={fCustomerId} onChange={(e) => setFCustomerId(e.target.value)}>
              <option value="">-- Không liên kết --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
              ))}
            </Select>
            <Select label="Người phụ trách" value={fAssignee} onChange={(e) => setFAssignee(e.target.value)}>
              <option value="">-- Mặc định tài khoản hiện tại --</option>
              {employees.map((em) => (
                <option key={em.id} value={em.fullName}>{em.fullName} ({em.position})</option>
              ))}
            </Select>
          </div>
          <Textarea label="Mô tả chi tiết" rows={3} value={fDesc} onChange={(e) => setFDesc(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit">
              <CheckSquare className="w-3.5 h-3.5" /> Lưu Công việc
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa công việc?"
        description={`Bạn chắc chắn muốn xóa công việc "${deleteTarget?.title}"?`}
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteTask(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
