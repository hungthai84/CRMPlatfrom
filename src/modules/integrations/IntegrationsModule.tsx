import React, { useEffect, useState } from 'react';
import { Plug, RefreshCw, ShieldAlert } from 'lucide-react';
import { fetchIntegrationsStatus, testIntegrationConnection } from '../../services/aiClient';
import { useToast } from '../../contexts/ToastContext';
import { IntegrationConfig } from '../../types/crm';
import { Button, StatusLabel } from '../../components/ui/Primitives';

export const IntegrationsModule: React.FC = () => {
  const { addToast } = useToast();
  const [adapters, setAdapters] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await fetchIntegrationsStatus();
      setAdapters(data.adapters || []);
    } catch (err: unknown) {
      addToast('Không tải được trạng thái tích hợp', err instanceof Error ? err.message : 'Lỗi kết nối.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await testIntegrationConnection(id);
      setAdapters((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: res.status, lastCheckedAt: res.checkedAt, lastError: res.connected ? undefined : res.message }
            : a
        )
      );
      addToast(res.connected ? 'Kết nối thành công' : 'Chưa kết nối', res.message, res.connected ? 'success' : 'warning');
    } catch (err: unknown) {
      addToast('Lỗi kiểm tra kết nối', err instanceof Error ? err.message : 'Thất bại.', 'error');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plug className="w-5 h-5 text-[#1951fc]" />
            16. Tích hợp Hệ thống, API & Webhook
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kiểm tra trạng thái thực từ biến môi trường phía máy chủ (Server-side Secrets). Không lưu khóa bí mật trên trình duyệt.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStatus} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới trạng thái
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adapters.map((a) => (
          <div key={a.id} className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{a.name}</h2>
                <p className="text-xs text-slate-500">{a.provider} · {a.category}</p>
              </div>
              <StatusLabel
                tone={a.status === 'connected' ? 'success' : 'warning'}
                text={a.status === 'connected' ? 'Đã kết nối' : 'Chưa kết nối'}
              />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">{a.docsHint}</p>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5">
              Biến môi trường yêu cầu: {a.requiredEnvVars.join(', ')}
            </div>

            {a.lastError && (
              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                {a.lastError}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 tabular-nums">
                {a.lastCheckedAt ? `Kiểm tra lúc ${new Date(a.lastCheckedAt).toLocaleTimeString('vi-VN')}` : 'Chưa kiểm tra thủ công'}
              </span>
              <Button size="sm" variant="outline" disabled={testingId === a.id} onClick={() => handleTest(a.id)}>
                {testingId === a.id ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Webhook Documentation Card */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Webhook Endpoint Tiếp nhận Sự kiện Đa kênh</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Các hệ thống ngoài (Zalo OA, Meta, Website, ERP) có thể gửi sự kiện về endpoint máy chủ có xác thực chữ ký header:
        </p>
        <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
          POST /api/webhooks/incoming/:channel<br />
          Header: x-onecrm-signature: &lt;WEBHOOK_VERIFY_SECRET&gt;
        </div>
      </div>
    </div>
  );
};
