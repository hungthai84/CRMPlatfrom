import React, { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface AddCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddCampaignModal({ isOpen, onClose, onSuccess }: AddCampaignModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Email', // 'Email' | 'Social' | 'SMS' | 'Call'
    status: 'Draft', // 'Draft' | 'Active' | 'Paused' | 'Completed'
    budget: 10000000,
    spent: 0,
    leads: 0,
    conversion: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['budget', 'spent', 'leads', 'conversion'].includes(name) ? Number(value) : value
    }));
  };

  const generateAICampaignPrompt = () => {
    const campaignNames = [
      'Chiến dịch Email - Re-marketing Khách hàng Cũ Q3',
      'Minigame Facebook - Tăng Tương Tác Thương Hiệu',
      'SMS Khuyến mãi Sinh Nhật - Giảm giá 15%',
      'Chiến dịch Kỷ niệm Thành lập - Tri ân Hội viên Vàng',
      'Quảng cáo Google Search - Tìm Kiếm Khách Hàng Tiềm Năng'
    ];
    const randomIndex = Math.floor(Math.random() * campaignNames.length);
    setFormData(prev => ({
      ...prev,
      name: campaignNames[randomIndex]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      if (!user) throw new Error("Vui lòng đăng nhập để thực hiện tác vụ này.");
      
      // Must exactly have fields accepted by isCampaignValid in firestore.rules
      await addDoc(collection(db, 'campaigns'), {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        budget: formData.budget,
        spent: formData.spent,
        leads: formData.leads,
        conversion: formData.conversion,
        startDate: formData.startDate,
        endDate: formData.endDate,
        ownerId: user.uid
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      // Reset form
      setFormData({
        name: '',
        type: 'Email',
        status: 'Draft',
        budget: 10000000,
        spent: 0,
        leads: 0,
        conversion: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'campaigns');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-white/50 bg-white/40">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tạo chiến dịch mới</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Lên kế hoạch tiếp thị & tự động hóa hành trình khách hàng</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50/80 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <form id="add-campaign-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-slate-700">Tên chiến dịch *</label>
                  <button 
                    type="button" 
                    onClick={generateAICampaignPrompt}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg transition-all border border-indigo-100"
                  >
                    <Sparkles size={12} /> Gợi ý tên bằng AI
                  </button>
                </div>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                  placeholder="vd: Chiến dịch Hè 2026 - Sự kiện Tri ân"
                  maxLength={200}
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Kênh tiếp thị *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                >
                  <option value="Email">Email Marketing</option>
                  <option value="Social">Mạng Xã Hội (Facebook/Zalo)</option>
                  <option value="SMS">SMS Brandname</option>
                  <option value="Call">Telesales / Cuộc gọi</option>
                </select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Trạng thái *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                >
                  <option value="Draft">Bản nháp (Draft)</option>
                  <option value="Active">Đang chạy (Active)</option>
                  <option value="Paused">Tạm ngưng (Paused)</option>
                  <option value="Completed">Hoàn thành (Completed)</option>
                </select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Ngày bắt đầu *</label>
                <input
                  required
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Ngày kết thúc</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Ngân sách (VND)</label>
                <input
                  type="number"
                  min="0"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Đã chi tiêu (VND)</label>
                <input
                  type="number"
                  min="0"
                  name="spent"
                  value={formData.spent}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-white/50 bg-white/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-700 font-bold bg-white/50 hover:bg-white/80 border border-white/60 rounded-xl shadow-sm transition-all"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="add-campaign-form"
            disabled={isSubmitting || !formData.name || !formData.startDate}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-md hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Tạo chiến dịch'}
          </button>
        </div>
      </div>
    </div>
  );
}
