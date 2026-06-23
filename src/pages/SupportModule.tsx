import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  MoreVertical, 
  ArrowUpRight,
  ShieldAlert,
  User,
  Tag,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { AddTicketModal } from '../components/AddTicketModal';
import { collection, query, onSnapshot, orderBy, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const styles: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const labels: Record<string, string> = {
    new: 'Mới',
    processing: 'Đang xử lý',
    pending: 'Chờ phản hồi',
    resolved: 'Đã giải quyết',
    closed: 'Đã đóng',
  };

  const badgeStyle = styles[status as string] || 'bg-purple-100 text-purple-700 border-purple-200';
  const badgeLabel = labels[status as string] || status;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
      {badgeLabel}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: TicketPriority }) => {
  const styles = {
    low: 'text-slate-500',
    medium: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-rose-600 font-bold',
  };

  const icons = {
    low: <Clock className="w-3 h-3" />,
    medium: <AlertCircle className="w-3 h-3" />,
    high: <AlertCircle className="w-3 h-3" />,
    urgent: <ShieldAlert className="w-3 h-3" />,
  };

  const labels = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    urgent: 'Khẩn cấp',
  };

  return (
    <span className={`flex items-center gap-1 text-xs ${styles[priority]}`}>
      {icons[priority]}
      {labels[priority]}
    </span>
  );
};

export const SupportTickets = () => {
  const { user, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTickets = async () => {
      try {
        const qTickets = isAdmin 
          ? collection(db, 'tickets')
          : query(collection(db, 'tickets'), where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(qTickets, (snapshot) => {
          let data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Ticket[];
          
          data = data.sort((a, b) => b.createdAt - a.createdAt);
          
          setTickets(data);
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'tickets');
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error("Error fetching tickets", err);
        setLoading(false);
      }
    };

    let unsubscribe: any;
    fetchTickets().then(unsub => unsubscribe = unsub);
    return () => unsubscribe && unsubscribe();
  }, [user, isAdmin]);

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: tickets.length,
    processing: tickets.filter(t => t.status === 'processing').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/40 p-4 lg:p-6 space-y-6 overflow-y-auto no-scrollbar w-full">
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetailModal 
            ticket={selectedTicket} 
            onClose={() => setSelectedTicket(null)} 
          />
        )}
        {showAddModal && (
          <AddTicketModal 
            onClose={() => setShowAddModal(false)}
            onAdd={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
      {/* Header Section */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Ticket hỗ trợ</h1>
            <p className="text-slate-500 text-sm font-medium">Theo dõi và xử lý các yêu cầu từ khách hàng</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo Ticket mới
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Tổng Ticket', value: stats.total.toString(), icon: <MessageSquare className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Đang xử lý', value: stats.processing.toString(), icon: <Clock className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50' },
            { label: 'Khẩn cấp', value: stats.urgent.toString(), icon: <AlertCircle className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-50' },
            { label: 'Đã giải quyết', value: stats.resolved.toString(), icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} p-4 rounded-2xl border border-white/50 shadow-sm flex items-center gap-4`}>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo mã ticket, tiêu đề, khách hàng..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm shadow-sm">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>
      </div>

      {/* Ticket List Section */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin Ticket</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Độ ưu tiên</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người phụ trách</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <motion.tr 
                  key={ticket.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedTicket(ticket)}
                  className="hover:bg-slate-50/50 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {ticket.ticketId}
                        </span>
                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {ticket.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                        <Tag className="w-3 h-3" />
                        <span className="capitalize">{ticket.category}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(ticket.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold">
                        {ticket.customerName.charAt(0)}
                      </div>
                      {ticket.customerName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.agentName ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <User className="w-4 h-4 text-slate-400" />
                        {ticket.agentName}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Chưa phân công</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
