import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../lib/auditLogger';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    segment: 'Retail',
    tier: 'Member',
    loyaltyPoints: 0,
    lifetimeValue: 0
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'loyaltyPoints' || name === 'lifetimeValue' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create user matching exact permitted fields in firestore.rules
      await addDoc(collection(db, 'customers'), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        segment: formData.segment,
        tier: formData.tier,
        loyaltyPoints: formData.loyaltyPoints,
        lifetimeValue: formData.lifetimeValue,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await logActivity('TẠO_KHÁCH_HÀNG', 'CRM_CUSTOMERS', `Đã thêm khách hàng mới: ${formData.name} (${formData.email})`);
      
      onClose();
      // Reset form
      setFormData({
        name: '', email: '', phone: '', segment: 'Retail', tier: 'Member', loyaltyPoints: 0, lifetimeValue: 0
      });
    } catch (err: any) {
      console.error("Error adding customer:", err);
      setError(err.message || 'Thêm khách hàng thất bại. Vui lòng thử lại.');
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
      <div className="relative bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-white/50 bg-white/40">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thêm khách hàng mới</h2>
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

          <form id="add-customer-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Họ và tên *</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                  placeholder="John Doe"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                  placeholder="john@example.com"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                  placeholder="+84 901 234 567"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Hạng</label>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                >
                  <option value="Member">Thành viên</option>
                  <option value="Silver">Bạc</option>
                  <option value="Gold">Vàng</option>
                  <option value="Platinum">Bạch kim</option>
                  <option value="Diamond">Kim cương</option>
                </select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Phân khúc</label>
                <input
                  type="text"
                  name="segment"
                  value={formData.segment}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                  placeholder="vd: Khách Vip, Doanh nghiệp"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Điểm thành viên</label>
                <input
                  type="number"
                  min="0"
                  name="loyaltyPoints"
                  value={formData.loyaltyPoints}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Giá trị vòng đời (VND)</label>
                <input
                  type="number"
                  min="0"
                  name="lifetimeValue"
                  value={formData.lifetimeValue}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
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
            form="add-customer-form"
            disabled={isSubmitting || !formData.name || !formData.email}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Lưu khách hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
