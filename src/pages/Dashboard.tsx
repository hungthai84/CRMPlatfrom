import React, { useState, useEffect } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, TrendingUp, Users, DollarSign, Ticket } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const revenueData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 550 },
  { name: 'Apr', value: 450 },
  { name: 'May', value: 700 },
  { name: 'Jun', value: 650 },
];

const conversionData = [
  { name: 'Week 1', leads: 120, conversion: 45 },
  { name: 'Week 2', leads: 150, conversion: 60 },
  { name: 'Week 3', leads: 180, conversion: 85 },
  { name: 'Week 4', leads: 220, conversion: 110 },
];

function StatCard({ title, value, change, icon: Icon, trend }: any) {
  return (
    <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-sm border border-white/20">
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-100/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-emerald-200/50">
          <TrendingUp size={14} />
          {change}
        </div>
      </div>
      <div>
        <h3 className="text-slate-600 text-sm font-bold">{title}</h3>
        <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [totalLtv, setTotalLtv] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Real-time customers
    const qCustomers = query(collection(db, 'customers'), where('ownerId', '==', user.uid));
    const unsubCustomers = onSnapshot(qCustomers, (snap) => {
      setCustomerCount(snap.size);
      let ltv = 0;
      snap.forEach(doc => {
        ltv += (doc.data().lifetimeValue || 0);
      });
      setTotalLtv(ltv);
    });

    // Real-time tickets
    const qTickets = query(collection(db, 'tickets'), where('ownerId', '==', user.uid));
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      setTicketCount(snap.size);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tickets');
    });

    return () => {
      unsubCustomers();
      unsubTickets();
    };
  }, [user]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  return (
    <div className="w-full h-full p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bảng điều khiển quản lý</h1>
          <p className="text-slate-600 text-sm mt-1.5 font-semibold">Chỉ số hiệu suất theo thời gian thực</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white/50 backdrop-blur-md border border-white/60 text-sm font-bold text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm cursor-pointer transition-colors hover:bg-white/70">
            <option>30 Ngày Của</option>
            <option>Quý Này</option>
            <option>Năm Nay</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng LTV" value={formatCurrency(totalLtv)} change="+12.5%" icon={DollarSign} trend="up" />
        <StatCard title="Khách hàng" value={customerCount.toLocaleString()} change="+4.2%" icon={Users} trend="up" />
        <StatCard title="Ticket Hỗ Trợ" value={ticketCount.toLocaleString()} change="+18.1%" icon={Ticket} trend="up" />
        <StatCard title="SLA Đạt" value="98.2%" change="+1.1%" icon={ArrowUpRight} trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="mb-6">
             <h3 className="text-lg font-bold text-slate-900 tracking-tight">Dự báo doanh thu (H1 2026)</h3>
             <p className="text-sm text-slate-600 font-semibold">Đã đóng và Dự phóng hiện tại</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 600}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="mb-6">
             <h3 className="text-lg font-bold text-slate-900 tracking-tight">Chuyển đổi tiềm năng</h3>
             <p className="text-sm text-slate-600 font-semibold">Khách hàng Marketing và Đạt chuẩn bán hàng</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 600}} dx={-10} />
                <Tooltip 
                  cursor={{fill: 'rgba(248, 250, 252, 0.5)'}}
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Bar dataKey="leads" fill="#94a3b8" fillOpacity={0.7} radius={[6, 6, 0, 0]} barSize={28} name="Mới" />
                <Bar dataKey="conversion" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={28} name="Đã chuyển đổi" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
