import React, { useState } from 'react';
import { ArrowRight, Play, Plus, Power, Workflow } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Modal, Select, StatusLabel, Textarea } from '../../components/ui/Primitives';

export const WorkflowsModule: React.FC = () => {
  const { can } = useAuth();
  const { workflows, createWorkflow, toggleWorkflow, runWorkflowTest } = useCRM();
  const { addToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fTrigger, setFTrigger] = useState('lead.created');
  const [fCondition, setFCondition] = useState('estimatedValue >= 100000000');
  const [fAction, setFAction] = useState('Gửi cảnh báo & Tạo công việc chăm sóc VIP');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWorkflow({
      name: fName,
      description: fDesc,
      triggerEvent: fTrigger,
      nodes: [
        { id: 'n1', kind: 'trigger', label: `Sự kiện: ${fTrigger}`, config: { event: fTrigger } },
        { id: 'n2', kind: 'condition', label: `Điều kiện: ${fCondition}`, config: { expr: fCondition } },
        { id: 'n3', kind: 'action', label: fAction, config: { channel: 'internal' } },
      ],
    });
    addToast('Đã tạo quy trình Workflow', fName, 'success');
    setFormOpen(false);
    setFName('');
    setFDesc('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">10. Tự động hóa Quy trình (Workflow Builder)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Thiết lập Trigger → Condition → Action, bật/tắt phiên bản và chạy kiểm thử Dry-Run lưu nhật ký thực thi.
          </p>
        </div>
        {can('workflows', 'create') && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Tạo Quy trình mới
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <div key={wf.id} className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-[#1951fc]" />
                  {wf.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{wf.description || `Trigger: ${wf.triggerEvent}`}</p>
              </div>
              <StatusLabel tone={wf.enabled ? 'success' : 'neutral'} text={wf.enabled ? 'Đang chạy' : 'Tạm dừng'} />
            </div>

            {/* Visual Pipeline Nodes */}
            <div className="flex flex-wrap items-center gap-2">
              {wf.nodes.map((node, i) => (
                <React.Fragment key={node.id}>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] font-mono uppercase text-[#1951fc] dark:text-[#22c7e8] block">{node.kind}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{node.label}</span>
                  </div>
                  {i < wf.nodes.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />}
                </React.Fragment>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <span className="text-xs text-slate-500 tabular-nums">
                v{wf.version} · Đã chạy {wf.runCount} lần
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await runWorkflowTest(wf.id);
                    addToast('Chạy thử Dry-Run thành công', wf.name, 'success');
                  }}
                >
                  <Play className="w-3.5 h-3.5" /> Chạy thử (Dry-run)
                </Button>
                {can('workflows', 'edit') && (
                  <Button
                    size="sm"
                    variant={wf.enabled ? 'secondary' : 'primary'}
                    onClick={() => toggleWorkflow(wf.id, !wf.enabled)}
                  >
                    <Power className="w-3.5 h-3.5" /> {wf.enabled ? 'Tạm dừng' : 'Kích hoạt'}
                  </Button>
                )}
              </div>
            </div>

            {(wf.logs || []).length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500">Nhật ký gần nhất:</p>
                {wf.logs.slice(0, 2).map((log) => (
                  <p key={log.id} className="text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                    [{new Date(log.timestamp).toLocaleTimeString('vi-VN')}] {log.summary}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Tạo Workflow Tự động hóa">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Tên quy trình" required value={fName} onChange={(e) => setFName(e.target.value)} />
          <Select label="Sự kiện kích hoạt (Trigger)" value={fTrigger} onChange={(e) => setFTrigger(e.target.value)}>
            <option value="lead.created">Khi có Lead mới (lead.created)</option>
            <option value="deal.stage_changed">Khi Deal đổi giai đoạn (deal.stage_changed)</option>
            <option value="ticket.sla_warning">Khi Ticket sắp quá hạn SLA (ticket.sla_warning)</option>
            <option value="contract.expiring">Khi Hợp đồng sắp hết hạn (contract.expiring)</option>
          </Select>
          <Input label="Điều kiện lọc (Condition)" value={fCondition} onChange={(e) => setFCondition(e.target.value)} />
          <Input label="Hành động tự động (Action)" value={fAction} onChange={(e) => setFAction(e.target.value)} />
          <Textarea label="Mô tả" rows={2} value={fDesc} onChange={(e) => setFDesc(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu Workflow</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
