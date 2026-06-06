import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Mail, 
  BarChart3, 
  Target, 
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  BrainCircuit,
  PieChart
} from 'lucide-react';
import { motion } from 'motion/react';
import { Campaign, AIInsight } from '../types';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AddCampaignModal } from '../components/AddCampaignModal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Chiến dịch Hè 2026 - Giảm 20%',
    type: 'Email',
    status: 'Active',
    budget: 50000000,
    spent: 12500000,
    leads: 450,
    conversion: 12.5,
    startDate: '2026-05-01',
    endDate: '2026-06-30',
  },
  {
    id: '2',
    name: 'Quảng bá Sản phẩm X trên Facebook',
    type: 'Social',
    status: 'Paused',
    budget: 20000000,
    spent: 18000000,
    leads: 1200,
    conversion: 3.2,
    startDate: '2026-04-15',
    endDate: '2026-05-15',
  },
  {
    id: '3',
    name: 'Khảo sát Hài lòng Khách hàng Q2',
    type: 'Email',
    status: 'Draft',
    budget: 5000000,
    spent: 0,
    leads: 0,
    conversion: 0,
    startDate: '2026-06-01',
    endDate: '2026-06-15',
  }
];

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: 'i1',
    type: 'churn_risk',
    severity: 'high',
    title: 'Nguy cơ rời bỏ: Công ty TechPro',
    description: 'Hệ thống phát hiện giảm 80% tương tác trong 30 ngày qua.',
    targetId: 'cust_3',
    targetName: 'Công ty TechPro',
    recommendation: 'Gửi email thăm hỏi hoặc gọi điện tư vấn trực tiếp trong 24h tới.',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'i2',
    type: 'upsell_opportunity',
    severity: 'medium',
    title: 'Cơ hội Upsell: Nguyễn Văn A',
    description: 'Khách hàng thường xuyên mua phụ kiện, có thể quan tâm đến gói bảo hành mở rộng.',
    targetId: 'cust_1',
    targetName: 'Nguyễn Văn A',
    recommendation: 'Gợi ý gói "Premium Care" kèm mã giảm giá 10%.',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'i3',
    type: 'sentiment_alert',
    severity: 'low',
    title: 'Phản ứng tích cực: Chuỗi cửa hàng Highland',
    description: 'Sentiment từ ticket hỗ trợ gần đây đạt 95% tích cực.',
    targetId: 'cust_4',
    targetName: 'Highland Coffee',
    recommendation: 'Mời khách hàng tham gia chương trình "Đối tác Chiến lược".',
    createdAt: Date.now() - 14400000,
  }
];

const REVENUE_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

export const MarketingAI = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const campaignsCol = collection(db, 'campaigns');
    const unsubscribe = onSnapshot(campaignsCol, (snapshot) => {
      if (snapshot.empty) {
        // Seed database if empty
        MOCK_CAMPAIGNS.forEach(async (campaign) => {
          try {
            await addDoc(campaignsCol, {
              name: campaign.name,
              type: campaign.type,
              status: campaign.status,
              budget: campaign.budget,
              spent: campaign.spent,
              leads: campaign.leads,
              conversion: campaign.conversion,
              startDate: campaign.startDate,
              endDate: campaign.endDate
            });
          } catch (e) {
            console.error("Failed to seed campaign: ", e);
          }
        });
      } else {
        const campaignList: Campaign[] = [];
        snapshot.forEach((doc) => {
          campaignList.push({
            id: doc.id,
            ...doc.data()
          } as Campaign);
        });
        // Sort campaigns by start date descending
        campaignList.sort((a, b) => b.startDate.localeCompare(a.startDate));
        setCampaigns(campaignList);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error reading campaigns:", error);
      // Fallback to mock campaigns if permissions fail or offline
      setCampaigns(MOCK_CAMPAIGNS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-indigo-600" />
              Tiếp thị & Phân tích AI
            </h1>
            <p className="text-slate-500 text-sm font-medium">Tự động hóa hành trình khách hàng & Dự báo bằng AI</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Chạy Phân tích AI
            </button>
            <button 
              onClick={() => setShowAddCampaignModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all font-sans"
            >
              Tạo Chiến dịch
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="w-full space-y-6">
          
          {/* Top Stats & AI Insight Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Insight Feed */}
            <div className="lg:col-span-2 space-y-6">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    Insight từ AI (Cảnh báo thông minh)
                  </h2>
                  <span className="text-xs font-bold text-slate-400 uppercase">3 Cập nhật mới</span>
                </div>
                <div className="space-y-4">
                  {MOCK_INSIGHTS.map((insight) => (
                    <motion.div 
                      key={insight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all border-l-4 ${
                        insight.severity === 'high' ? 'border-l-rose-500' : 
                        insight.severity === 'medium' ? 'border-l-amber-500' : 'border-l-emerald-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              insight.severity === 'high' ? 'bg-rose-50 text-rose-600' : 
                              insight.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {insight.type.replace('_', ' ')}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">{insight.title}</h3>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-xs font-bold text-indigo-600 mb-1 flex items-center gap-1">
                              <Target className="w-3 h-3" /> Gợi ý hành động:
                            </p>
                            <p className="text-xs text-slate-700 italic">{insight.recommendation}</p>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                          <ArrowUpRight className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Analytics Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Hiệu quả Chuyển đổi
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={REVENUE_DATA}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#4f46e5" fillOpacity={1} fill="url(#colorValue)" />
                        <Tooltip />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Nguồn Leads
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={REVENUE_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Tooltip />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            </div>

            {/* Campaign List Sidebar */}
            <div className="space-y-6">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-blue-500" />
                    Chiến dịch gần đây
                  </h2>
                </div>
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-300 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          campaign.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                          campaign.status === 'Paused' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {campaign.status}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">{campaign.startDate}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{campaign.name}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Leads</p>
                          <p className="text-sm font-extrabold text-slate-900">{campaign.leads}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Conv.</p>
                          <p className="text-sm font-extrabold text-indigo-600">{campaign.conversion}%</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-50">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Ngân sách</p>
                            <p className="text-xs font-bold text-slate-700">{(campaign.spent / 1000000).toFixed(1)}M / {(campaign.budget / 1000000).toFixed(1)}M</p>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500" 
                              style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-3 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white rounded-xl border border-slate-200 border-dashed">
                    Xem tất cả chiến dịch
                  </button>
                </div>
              </section>

              {/* Segmentation Preview */}
              <section className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <PieChart className="w-6 h-6" />
                  <h3 className="font-bold">AI Segmentation</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Khách hàng VIP</span>
                      <span>15%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: '15%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Khách hàng Tiềm năng</span>
                      <span>42%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: '42%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Nguy cơ bỏ (At Risk)</span>
                      <span>8%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400" style={{ width: '8%' }} />
                    </div>
                  </div>
                </div>
                <button className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all border border-white/20">
                  Phân tích RFM chuyên sâu
                </button>
              </section>
            </div>

          </div>
        </div>
      </div>
      <AddCampaignModal 
        isOpen={showAddCampaignModal} 
        onClose={() => setShowAddCampaignModal(false)} 
      />
    </div>
  );
};
