import React, { useState } from 'react';
import { Button, Input, Modal, Select, Textarea } from '../ui/Primitives';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { customerSchema, leadSchema, dealSchema, taskSchema, ticketSchema } from '../../schemas/crm';

type QuickType = 'customer' | 'lead' | 'deal' | 'task' | 'ticket';

export const QuickCreateModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { customers, createCustomer, createLead, createDeal, createTask, createTicket } = useCRM();
  const { addToast } = useToast();

  const [entityType, setEntityType] = useState<QuickType>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('50000000');
  const [customerId, setCustomerId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
  };

  const handleSubmit = async (createAnother: boolean) => {
    setSubmitting(true);
    try {
      if (entityType === 'customer') {
        const parsed = customerSchema.parse({
          type: 'business',
          name,
          phone,
          email,
          group: 'Khách hàng B2B',
          segment: 'Standard',
          notes,
        });
        await createCustomer({
          ...parsed,
          ownerName: 'Chủ sở hữu',
          score: 70,
          lifetimeValue: 0,
          healthScore: 85,
          status: 'active',
          consent: {
            marketingEmail: true,
            marketingSmsZalo: true,
            aiProcessing: true,
            thirdPartySharing: false,
            consentSource: 'Tạo nhanh CRM',
            consentedAt: Date.now(),
            purposeNote: 'Chăm sóc khách hàng & giao dịch',
          },
        });
      } else if (entityType === 'lead') {
        const parsed = leadSchema.parse({
          name,
          phone,
          email,
          source: 'Website',
          estimatedValue: Number(amount) || 0,
          notes,
        });
        await createLead(parsed);
      } else if (entityType === 'deal') {
        const targetCust = customerId || customers[0]?.id || '';
        const parsed = dealSchema.parse({
          title: name,
          customerId: targetCust,
          value: Number(amount) || 0,
          probability: 40,
          expectedCloseDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
          discountPercent: 0,
        });
        await createDeal(parsed);
      } else if (entityType === 'task') {
        const parsed = taskSchema.parse({
          title: name,
          description: notes,
          priority,
          dueDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
          type: 'task',
          linkedType: customerId ? 'customer' : undefined,
          linkedId: customerId || undefined,
        });
        await createTask(parsed);
      } else if (entityType === 'ticket') {
        const targetCust = customerId || customers[0]?.id || '';
        const parsed = ticketSchema.parse({
          title: name,
          description: notes || 'Yêu cầu hỗ trợ tạo nhanh từ thanh công cụ.',
          category: 'inquiry',
          priority,
          customerId: targetCust,
          channel: 'portal',
        });
        await createTicket(parsed);
      }

      addToast('Đã lưu dữ liệu thành công', `Đã tạo bản ghi ${entityType} mới trong Firestore.`, 'success');
      resetForm();
      if (!createAnother) onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Vui lòng kiểm tra thông tin nhập.';
      addToast('Dữ liệu chưa hợp lệ', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Tạo nhanh Bản ghi CRM" subtitle="Đồng bộ tức thì lên Cloud Firestore">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'customer', label: 'Khách hàng' },
            { id: 'lead', label: 'Lead' },
            { id: 'deal', label: 'Cơ hội (Deal)' },
            { id: 'task', label: 'Công việc' },
            { id: 'ticket', label: 'Ticket hỗ trợ' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEntityType(t.id as QuickType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                entityType === t.id
                  ? 'bg-[#1951fc] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Input
          label={entityType === 'customer' || entityType === 'lead' ? 'Họ tên / Tên doanh nghiệp' : 'Tiêu đề'}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên hoặc tiêu đề..."
        />

        {(entityType === 'customer' || entityType === 'lead') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Số điện thoại" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" />
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@congty.vn" />
          </div>
        )}

        {(entityType === 'lead' || entityType === 'deal') && (
          <Input
            label="Giá trị dự kiến (VND)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        )}

        {(entityType === 'deal' || entityType === 'ticket' || entityType === 'task') && (
          <Select label="Liên kết Khách hàng" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">-- Chọn khách hàng --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </Select>
        )}

        {(entityType === 'task' || entityType === 'ticket') && (
          <Select label="Độ ưu tiên" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            <option value="low">Thấp (Low)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="high">Cao (High)</option>
            <option value="urgent">Khẩn cấp (Urgent)</option>
          </Select>
        )}

        <Textarea label="Ghi chú / Mô tả chi tiết" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="secondary" disabled={submitting} onClick={() => handleSubmit(true)}>
            Lưu & Tạo tiếp
          </Button>
          <Button disabled={submitting} onClick={() => handleSubmit(false)}>
            {submitting ? 'Đang lưu...' : 'Lưu bản ghi'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
