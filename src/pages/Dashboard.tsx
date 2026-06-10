import React, { useState, useEffect } from 'react';
import { Area, AreaChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { ArrowUpRight, TrendingUp, Users, DollarSign, Ticket, Plus, ArrowUp, Briefcase, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { mockCustomers } from '../data/mockData';
import { generateDemoCustomers } from '../lib/generateDemoData';
import { Sparkles } from 'lucide-react';

// Chart analytics data matching the curves of the screenshot
const analyticsData = [
  { name: 'Jan', value: 300, barValue: 600 },
  { name: 'Feb', value: 500, barValue: 750 },
  { name: 'Mar', value: 580, barValue: 650 },
  { name: 'Apr', value: 750, barValue: 900 },
  { name: 'May', value: 680, barValue: 800 },
  { name: 'Jun', value: 520, barValue: 700 },
  { name: 'July', value: 640, barValue: 850 },
  { name: 'Aug', value: 560, barValue: 720 },
  { name: 'Sep', value: 700, barValue: 840 },
];

const heatmapData = [
  { day: 'Mon', hour: '9AM', count: 120 }, { day: 'Mon', hour: '12PM', count: 180 }, { day: 'Mon', hour: '3PM', count: 250 }, { day: 'Mon', hour: '6PM', count: 90 },
  { day: 'Tue', hour: '9AM', count: 140 }, { day: 'Tue', hour: '12PM', count: 300 }, { day: 'Tue', hour: '3PM', count: 320 }, { day: 'Tue', hour: '6PM', count: 110 },
  { day: 'Wed', hour: '9AM', count: 200 }, { day: 'Wed', hour: '12PM', count: 280 }, { day: 'Wed', hour: '3PM', count: 400 }, { day: 'Wed', hour: '6PM', count: 150 },
  { day: 'Thu', hour: '9AM', count: 180 }, { day: 'Thu', hour: '12PM', count: 250 }, { day: 'Thu', hour: '3PM', count: 380 }, { day: 'Thu', hour: '6PM', count: 120 },
  { day: 'Fri', hour: '9AM', count: 150 }, { day: 'Fri', hour: '12PM', count: 200 }, { day: 'Fri', hour: '3PM', count: 260 }, { day: 'Fri', hour: '6PM', count: 200 },
];

// Leads donut data
const leadData = [
  { name: 'Desktop', value: 1207, color: '#ec4899' }, // Pink
  { name: 'Laptop', value: 1152, color: '#2F69FF' },  // Power Blue
  { name: 'Mobile', value: 1624, color: '#f59e0b' },  // Orange/Gold
];

// Stat card design with interactive mini indicators
interface MiniBarChartProps {
  color: string;
  heights: number[];
  glowIndex?: number;
}

function MiniBarIndicator({ color, heights, glowIndex }: MiniBarChartProps) {
  return (
    <div className="flex gap-[3px] items-end h-8 shrink-0">
      {heights.map((h, i) => (
        <div key={i} className="relative flex items-end">
          <div 
            style={{ height: `${h}%` }} 
            className={`w-[5px] rounded-full ${color}`}
          />
          {glowIndex === i && (
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full border border-white shadow-sm ${color}`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  timeframe: string;
  theme: 'purple' | 'blue' | 'orange';
  icon: any;
  miniHeights: number[];
  glowIndex?: number;
}

function PremiumStatCard({ title, value, change, timeframe, theme, icon: Icon, miniHeights, glowIndex }: StatCardProps) {
  const styles = {
    purple: {
      bg: 'bg-[#eef2ff]',
      text: 'text-[#2F69FF]',
      bar: 'bg-[#2F69FF]',
    },
    blue: {
      bg: 'bg-[#e3f2fd]',
      text: 'text-[#1e88e5]',
      bar: 'bg-[#1e88e5]',
    },
    orange: {
      bg: 'bg-[#fff3e0]',
      text: 'text-[#fb8c00]',
      bar: 'bg-[#fb8c00]',
    }
  };

  const currentStyle = styles[theme];

  return (
    <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between h-44 relative overflow-hidden">
      <div className="flex justify-between items-start">
        {/* Metric icon with rounded pill banner */}
        <div className={`w-11 h-11 flex items-center justify-center rounded-[10px] ${currentStyle.bg} ${currentStyle.text} shadow-sm shrink-0`}>
          <Icon size={20} />
        </div>
        
        {/* Trend pill inside a sleek gray micro-container */}
        <div className={`text-xs font-bold leading-none py-1.5 px-2.5 rounded-full bg-[#f4f6fa] ${currentStyle.text}`}>
          {change}
        </div>
      </div>
      
      <div className="flex justify-between items-end mt-4">
        <div>
          <h3 className="text-[#8c94a5] text-[11px] font-bold tracking-wide uppercase">{title}</h3>
          <p className="text-2xl font-extrabold text-[#0e0e11] tracking-tight mt-1">{value}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{timeframe}</span>
        </div>
        
        {/* Custom Mini Bar Charts matching the mockup visually */}
        <div className="pb-1">
          <MiniBarIndicator color={currentStyle.bar} heights={miniHeights} glowIndex={glowIndex} />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [totalLtv, setTotalLtv] = useState<number>(0);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const triggerSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await generateDemoCustomers(user.uid);
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi khởi tạo dữ liệu mẫu: " + (err as any).message);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Real-time customers from Firestore
    const qCustomers = isAdmin 
      ? collection(db, 'customers')
      : query(collection(db, 'customers'), where('ownerId', '==', user.uid));
      
    const unsubCustomers = onSnapshot(qCustomers, (snap) => {
      setCustomerCount(snap.size);
      let ltv = 0;
      snap.forEach(doc => {
        ltv += (doc.data().lifetimeValue || 0);
      });
      setTotalLtv(ltv);
    });

    // Real-time tickets from Firestore
    const qTickets = isAdmin 
      ? collection(db, 'tickets')
      : query(collection(db, 'tickets'), where('ownerId', '==', user.uid));
      
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      setTicketCount(snap.size);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tickets');
    });

    return () => {
      unsubCustomers();
      unsubTickets();
    };
  }, [user, isAdmin]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  // Safe Fallback counts to ensure visual fidelity matches screenshot even with fresh schema
  const displayCustomersCount = customerCount > 0 ? customerCount.toLocaleString() : "4,562";
  const displayRevenue = totalLtv > 0 ? formatCurrency(totalLtv) : "$56,140";
  const displayDeals = ticketCount > 0 ? ticketCount.toLocaleString() : "2,543";

  return (
    <div className="w-full h-full p-4 lg:p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
      {/* Premium Demo Data Seeder Banner */}
      <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-100/80 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/10">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Dữ liệu mẫu & Tính năng thử nghiệm CRM 360
            </h4>
            <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
              Khởi tạo trọn bộ dữ liệu mẫu gồm 8 Khách hàng cao cấp, 3 Yêu cầu hỗ trợ (Tickets liên kết tự động), Chiến dịch và Nhật ký hệ thống. Trải nghiệm trực quan các tính năng mới: Ghi chú bằng Giọng nói (Web Speech API) và phím tắt thông minh (Cmd+K, Cmd+N).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          {seedSuccess ? (
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-center w-full md:w-auto">
              ✓ Khởi tạo thành công!
            </div>
          ) : (
            <button
              onClick={triggerSeedData}
              disabled={seeding}
              className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-blue-500/10 transition-all flex items-center justify-center gap-2 ${
                seeding 
                  ? 'bg-blue-400 text-white cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-md'
              }`}
            >
              {seeding ? 'Đang tạo dữ liệu...' : 'Khởi tạo dữ liệu mẫu'}
            </button>
          )}
        </div>
      </div>

      {/* Three row stat card grid exactly like mockup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumStatCard 
          title="Total Customers" 
          value={displayCustomersCount} 
          change="+12% 28 days" 
          timeframe="Loyalty & high value members" 
          theme="purple" 
          icon={Users}
          miniHeights={[35, 60, 45, 100]}
          glowIndex={3}
        />
        <PremiumStatCard 
          title="Revenue Pipeline" 
          value={displayRevenue} 
          change="+25% This month" 
          timeframe="Total lifetime customer value" 
          theme="blue" 
          icon={DollarSign}
          miniHeights={[30, 45, 95, 55]}
        />
        <PremiumStatCard 
          title="Active Tickets" 
          value={displayDeals} 
          change="+19% This month" 
          timeframe="Open ticket & sales conversions" 
          theme="orange" 
          icon={Briefcase}
          miniHeights={[40, 60, 50, 80]}
        />
      </div>

      {/* Main split grid: Revenue & Deals vs Leads and AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Spans 2 columns on large screen) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          
          {/* Revenue Analytics Card */}
          <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">Revenue Analytics</h3>
                <p className="text-slate-400 text-xs font-semibold">Monthly overview & sales statistics</p>
              </div>
              <div>
                <select className="bg-[#f4f6fa]/70 border border-[#e4e7ec] text-[11px] font-bold text-slate-600 rounded-full py-1.5 px-3.5 focus:outline-none transition-colors hover:bg-[#f0f2f7] cursor-pointer">
                  <option>Month</option>
                  <option>Quarter</option>
                  <option>Year</option>
                </select>
              </div>
            </div>

            {/* Custom Composed Chart representing beautiful rounded pill bars and line over it */}
            <div className="h-68 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f7" strokeOpacity={0.8} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8c94a5', fontSize: 11, fontWeight: 700 }} 
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8c94a5', fontSize: 11, fontWeight: 700 }} 
                    dx={-6}
                    domain={[0, 1000]}
                    tickCount={6}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(235, 238, 245, 0.4)', radius: 10 }}
                    contentStyle={{ 
                      borderRadius: '10px', 
                      border: '1px solid #f1f3f7', 
                      background: 'rgba(255,255,255,0.96)', 
                      backdropFilter: 'blur(8px)', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
                      padding: '10px 14px' 
                    }}
                    labelStyle={{ fontWeight: 800, color: '#1e293b', fontSize: '11px' }}
                    itemStyle={{ fontWeight: 700, fontSize: '11px' }}
                  />
                  {/* Subtle lower bars for background feel */}
                  <Bar 
                    dataKey="barValue" 
                    fill="#2F69FF" 
                    fillOpacity={0.15} 
                    radius={[4, 4, 4, 4]} 
                    barSize={20} 
                    name="Goal Target" 
                  />
                  {/* Fluid Line layered directly on top of the bars */}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2F69FF" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#2F69FF', stroke: '#ffffff', strokeWidth: 2, r: 6 }} 
                    activeDot={{ r: 8 }}
                    name="Actual Value" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Heatmap Card */}
          <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">Agent Activity Heatmap</h3>
                <p className="text-slate-400 text-xs font-semibold">Peak performance hours & task completion</p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: -10, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f7" strokeOpacity={0.8} />
                  <XAxis type="category" dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8c94a5', fontSize: 11, fontWeight: 700 }} dy={10} />
                  <YAxis type="category" dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#8c94a5', fontSize: 11, fontWeight: 700 }} dx={-10} />
                  <ZAxis type="number" dataKey="count" range={[50, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} 
                  />
                  <Scatter 
                    data={heatmapData} 
                    fill="#2F69FF" 
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (typeof cx !== 'number' || typeof cy !== 'number' || Number.isNaN(cx) || Number.isNaN(cy)) return null;
                      const opacity = Math.max(0.15, payload.count / 400); // Max intensity mapped to opacity
                      return (
                        <rect 
                          x={cx - 15} y={cy - 12} width={30} height={24} 
                          fill="#2F69FF" fillOpacity={opacity} rx={4} 
                        />
                      );
                    }} 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deals Statistics Card */}
          <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">Deals Statistics</h3>
                <p className="text-slate-400 text-xs font-semibold font-medium">Tracking conversion stages of top prospects</p>
              </div>
              <div>
                <select className="bg-[#f4f6fa]/70 border border-[#e4e7ec] text-[11px] font-bold text-slate-600 rounded-full py-1.5 px-3.5 focus:outline-none transition-colors hover:bg-[#f0f2f7] cursor-pointer">
                  <option>Sort by</option>
                  <option>Category</option>
                  <option>Date</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f4f6fa] text-[#8c94a5] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fcfdfd]">
                  {/* Simon Corel row representing screenshot exactly */}
                  <tr className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img 
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" 
                        alt="Simon Corel" 
                        className="w-10 h-10 rounded-full object-cover shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-100" 
                      />
                      <div>
                        <p className="font-extrabold text-xs text-slate-800 leading-snug">Simon Corel</p>
                        <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">simoncorel@gmail.com</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-600">Service</td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-600">Germany</td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-400">Aug 20, 2026</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button className="p-1.5 hover:bg-[#f0f2f5] text-slate-500 hover:text-[#2F69FF] rounded-lg transition-colors">
                          <Edit2 size={13} className="stroke-[2.5]" />
                        </button>
                        <button className="p-1.5 hover:bg-[#ffebee] text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 size={13} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Dynamic Database fallbacks showing real-world clients */}
                  {mockCustomers.map((cust, i) => (
                    <tr key={cust.id + i} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <img 
                          src={cust.avatar || `https://i.pravatar.cc/150?u=${cust.id}`} 
                          alt={cust.name} 
                          className="w-10 h-10 rounded-full object-cover shadow-[0_2px_8px_rgba(0,0,0,0.055)] border border-slate-100" 
                        />
                        <div>
                          <p className="font-extrabold text-xs text-slate-800 leading-snug">{cust.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">{cust.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-600">
                        {cust.tier || 'Member'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-600">Vietnam</td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-400">
                        {new Date(cust.lastInteraction || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button className="p-1.5 hover:bg-[#f0f2f5] text-slate-500 hover:text-[#2F69FF] rounded-lg transition-colors">
                            <Edit2 size={13} className="stroke-[2.5]" />
                          </button>
                          <button className="p-1.5 hover:bg-[#ffebee] text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 size={13} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )).slice(0, 2)}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6 flex flex-col">

          {/* Leads by Source Card with Doughnut Chart */}
          <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">Leads by Source</h3>
              <button className="text-slate-400 hover:text-slate-600 text-xs font-bold tracking-widest">•••</button>
            </div>

            {/* Recharts Doughnut with absolute text alignment in center */}
            <div className="relative h-44 flex items-center justify-center">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={leadData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {leadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase leading-none">Total</p>
                <p className="text-2xl font-black text-slate-800 mt-1 leading-none">4,145</p>
              </div>
            </div>

            {/* Custom line status legends underneath exactly layout-similar to mockup */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-2 border-t border-[#f8f9fb]">
              <div className="border-l-2 border-pink-500 pl-3">
                <p className="text-[10px] font-bold text-[#8c94a5] leading-none mb-1">Desktop</p>
                <p className="text-sm font-extrabold text-slate-800 leading-none">1,207</p>
              </div>
              <div className="border-l-2 border-[#2F69FF] pl-3">
                <p className="text-[10px] font-bold text-[#8c94a5] leading-none mb-1">Laptop</p>
                <p className="text-sm font-extrabold text-slate-800 leading-none">1,152</p>
              </div>
              <div className="border-l-2 border-amber-500 pl-3">
                <p className="text-[10px] font-bold text-[#8c94a5] leading-none mb-1">Mobile</p>
                <p className="text-sm font-extrabold text-slate-800 leading-none">1,624</p>
              </div>
            </div>
          </div>

          {/* AI Assistant Card with moving 3D sphere gradient core */}
          <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col justify-between flex-1 min-h-[300px]">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">AI Assistant</h3>
              <button className="text-slate-400 hover:text-slate-600 text-xs font-bold tracking-widest">•••</button>
            </div>

            {/* Stunning Swirling Gradient AI Core representing the spheres in the image */}
            <div className="relative py-8 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Layer 1: Ambient base pulsing circle */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#2F69FF] via-[#5b8eff] to-[#1e40af] rounded-full filter blur-[14px] opacity-35 animate-pulse" />
                
                {/* Layer 2: Swirling orbit border */}
                <div className="absolute inset-2 border-2 border-dashed border-[#2F69FF]/40 rounded-full animate-spin [animation-duration:15s]" />
                
                {/* Layer 3: Main high fidelity gradient wavy shape */}
                <div className="w-24 h-24 rounded-[40%] bg-gradient-to-br from-[#2F69FF] via-[#5b8eff] to-[#1e40af] shadow-[0_8px_24px_rgba(47,105,255,0.35)] animate-spin [animation-duration:8s] flex items-center justify-center" />
                
                {/* Layer 4: Nested gloss overlay */}
                <div className="absolute w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm shadow-inner pointer-events-none" />
              </div>
              
              <p className="text-[15px] font-bold text-[#4a5568] tracking-tight text-center mt-5">
                What Can I Help With?
              </p>
            </div>

            {/* Custom rounded pill lavender text input bar */}
            <div className="mt-2 flex items-center bg-[#ebf0ff]/60 border border-[#d2e0ff] rounded-full px-4 py-2 hover:bg-[#e2eaff]/80 transition-all">
              <button className="text-[#2F69FF] hover:text-[#1e40af] p-1 bg-white rounded-full h-6 w-6 flex items-center justify-center shadow-sm shrink-0">
                <Plus size={14} className="stroke-[3]" />
              </button>
              <input
                type="text"
                placeholder="Ask me anything"
                className="bg-transparent border-none text-xs text-slate-700 font-bold placeholder-[#9da3bc] focus:outline-none w-full px-3.5"
              />
              <button className="bg-[#2F69FF] text-white p-2 rounded-full hover:bg-opacity-90 shadow-sm transition-all flex items-center justify-center shrink-0 w-8 h-8">
                <ArrowUp size={16} className="stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Top Deals Card partially visible representation in mockup */}
          <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-[#0e0e11] uppercase tracking-wider">Top Deals</h3>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#2F69FF] font-extrabold text-[10px]">
                    TC
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">Techcom Corp Contract</h5>
                    <p className="text-[9px] text-[#2F69FF] font-bold">Proposal Closed</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-800">$18,200</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
