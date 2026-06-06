import React, { useState, useEffect } from 'react';
import { X, Send, User, Tag, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { TicketCategory, TicketPriority, Customer } from '../types';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface AddTicketModalProps {
  onClose: () => void;
  onAdd: () => void;
}

export const AddTicketModal = ({ onClose, onAdd }: AddTicketModalProps) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as TicketCategory,
    priority: 'medium' as TicketPriority,
    customerId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchCustomers = async () => {
      const q = query(collection(db, 'customers'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer));
    };
    fetchCustomers();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.customerId) return;
    
    setSubmitting(true);
    try {
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      const ticketId = `YT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      
      const newTicket = {
        ticketId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'new',
        customerId: formData.customerId,
        customerName: selectedCustomer?.name || 'Unknown',
        ownerId: user.uid,
        source: 'agent',
        agentId: user.uid,
        agentName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        slaDeadline: Date.now() + (formData.priority === 'urgent' ? 3600000 : 86400000),
      };

      const docRef = doc(collection(db, 'tickets'));
      await setDoc(docRef, newTicket);
      
      onAdd();
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tickets');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Tạo Ticket Hỗ Trợ Mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <FileText className="w-3 h-3" /> Tiêu đề yêu cầu
            </label>
            <input 
              required
              type="text"
              placeholder="VD: Lỗi trang thanh toán..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Tag className="w-3 h-3" /> Phân loại
              </label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as TicketCategory})}
              >
                <option value="technical">Kỹ thuật</option>
                <option value="billing">Thanh toán</option>
                <option value="product">Sản phẩm</option>
                <option value="complaint">Khiếu nại</option>
                <option value="consultancy">Tư vấn</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Độ ưu tiên
              </label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as TicketPriority})}
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <User className="w-3 h-3" /> Chọn khách hàng
            </label>
            <select 
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.customerId}
              onChange={(e) => setFormData({...formData, customerId: e.target.value})}
            >
              <option value="">Chọn khách hàng...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Nội dung chi tiết</label>
            <textarea 
              required
              placeholder="Mô tả chi tiết vấn đề khách hàng gặp phải..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium h-24 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Đang tạo...' : 'Tạo Ticket'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
