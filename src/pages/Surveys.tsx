import { useState, useEffect } from 'react';
import { 
  SmilePlus, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Plus, 
  Send, 
  Search, 
  ChevronRight, 
  Award,
  Play,
  Pause,
  Clock,
  Sparkles,
  BarChart,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  ThumbsUp,
  AlertTriangle,
  X,
  Trash2
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

export interface SurveyResponse {
  id: string;
  customerName: string;
  email: string;
  campaignName: string;
  npsScore: number; // 0 - 10
  csatScore: number; // 1 - 5 (Star rating)
  cesScore: number; // 1 - 5 (Effort rating)
  comment: string;
  sentiment: 'Happy' | 'Neutral' | 'Frustrated';
  createdAt: string;
}

export interface SurveyCampaign {
  id: string;
  name: string;
  targetGroup: string;
  status: 'Đang chạy' | 'Đã tạm dừng' | 'Bản nháp';
  responseCount: number;
  sentCount: number;
  createdAt: string;
}

const INITIAL_RESPONSE_FEED: SurveyResponse[] = [
  {
    id: 'SR-201',
    customerName: 'Nguyễn Văn Bình',
    email: 'binh.nv@gmail.com',
    campaignName: 'Khảo sát chất lượng hỗ trợ kỹ thuật',
    npsScore: 10,
    csatScore: 5,
    cesScore: 5,
    comment: 'Tôi gặp lỗi ở việc đăng nhập ban đầu do Firebase configuration nhưng đã được bộ phận chăm sóc liên hệ hướng dẫn cực kỳ nhiệt tình, giải quyết ngay lập tức. Cực kỳ hài lòng.',
    sentiment: 'Happy',
    createdAt: '2026-06-10 13:40'
  },
  {
    id: 'SR-202',
    customerName: 'Trần Thị Lan',
    email: 'lan.tran@hotmaill.com',
    campaignName: 'Khảo sát trải nghiệm sau mua hàng',
    npsScore: 8,
    csatScore: 4,
    cesScore: 4,
    comment: 'Ứng dụng CRM mới chạy rất mượt, giao diện hiện đại và thông minh. Sẽ cực kỳ hoàn hảo nếu có thêm chức năng báo cáo chuyên sâu tùy chỉnh ở gói Tiêu chuẩn.',
    sentiment: 'Happy',
    createdAt: '2026-06-10 11:15'
  },
  {
    id: 'SR-203',
    customerName: 'Phạm Minh Sơn',
    email: 'son.pm@daivietfurniture.vn',
    campaignName: 'Khảo sát chất lượng hỗ trợ kỹ thuật',
    npsScore: 4,
    csatScore: 2,
    cesScore: 2,
    comment: 'Hỏi đáp qua live chat còn hơi lâu vào thời điểm cuối giờ hành chính. Cần cải thiện thời gian phản hồi của agent trực ca tối.',
    sentiment: 'Frustrated',
    createdAt: '2026-06-09 16:30'
  },
  {
    id: 'SR-204',
    customerName: 'Lê Thu Trang',
    email: 'trang.le@techvest.com',
    campaignName: 'Khảo sát trải nghiệm sau mua hàng',
    npsScore: 9,
    csatScore: 5,
    cesScore: 5,
    comment: 'Tuyệt vời! Giải pháp chăm sóc Loyalty và phễu quản lý phàn nàn giúp chúng tôi giảm tỷ lệ rời bỏ của khách tới 20% chỉ sau một quý sử dụng.',
    sentiment: 'Happy',
    createdAt: '2026-06-08 14:05'
  },
  {
    id: 'SR-205',
    customerName: 'Hoàng Quốc Việt',
    email: 'viet.hq@construction.vn',
    campaignName: 'Đánh giá tính năng AI gợi ý',
    npsScore: 7,
    csatScore: 3,
    cesScore: 3,
    comment: 'Phần AI gợi ý câu trả lời vé hỗ trợ rất tiềm năng nhưng thỉnh thoảng câu chữ chưa được chuẩn Việt hóa tự nhiên. Hy vọng cập nhật thêm mô hình của Gemini 3.5 sắp tới.',
    sentiment: 'Neutral',
    createdAt: '2026-06-07 09:25'
  }
];

const INITIAL_CAMPAIGNS: SurveyCampaign[] = [
  {
    id: 'SC-101',
    name: 'Khảo sát chất lượng hỗ trợ kỹ thuật',
    targetGroup: 'Khách hàng vừa đóng support ticket',
    status: 'Đang chạy',
    responseCount: 148,
    sentCount: 210,
    createdAt: '2026-05-15'
  },
  {
    id: 'SC-102',
    name: 'Khảo sát trải nghiệm sau mua hàng',
    targetGroup: 'Khách hàng có giao dịch hoàn tất trong 7 ngày',
    status: 'Đang chạy',
    responseCount: 236,
    sentCount: 420,
    createdAt: '2026-05-20'
  },
  {
    id: 'SC-103',
    name: 'Đánh giá tính năng AI gợi ý',
    targetGroup: 'Nhóm người dùng Beta mở rộng',
    status: 'Đã tạm dừng',
    responseCount: 45,
    sentCount: 80,
    createdAt: '2026-06-01'
  },
  {
    id: 'SC-104',
    name: 'Khảo sát định kỳ ý kiến Khách hàng Quý 2',
    targetGroup: 'Khách hàng hạng Platinum & Diamond',
    status: 'Bản nháp',
    responseCount: 0,
    sentCount: 0,
    createdAt: '2026-06-08'
  }
];

// Names for randomized simulation generator
const RANDOM_NAMES = ['Đỗ Minh Tuấn', 'Bùi Phương Thảo', 'Cao Xuân Trường', 'Dương Thúy Diễm', 'Mai Thanh Hải', 'Hồ Bảo Ngọc'];
const RANDOM_EMAILS = ['tuan.dm@gmail.com', 'thaobp@outlook.com', 'truongcx@daiphat.com', 'diem.duong@freelancer.vn', 'haimt@invest.vn', 'ngoc.hb@saigontech.vn'];
const RANDOM_FEEDBACKS_GOOD = [
  'Hệ thống quản lý khách hàng mượt ngoài kỳ vọng, hỗ trợ ticket siêu nhanh',
  'Tuyệt vời! Chức năng marketing automation nạp phễu tự động giúp tiết kiệm 12 tiếng làm việc mỗi tuần',
  'Tính năng khách hàng 360 độ chi tiết, theo dõi đầy đủ hành trình dễ sử dụng',
  'Cảm ơn đội ngũ lập trình viên đã nhiệt tình xử lý đăng nhập, trải nghiệm của tôi hiện tại 10 điểm!'
];
const RANDOM_FEEDBACKS_NEUTRAL = [
  'Đã cải thiện nhưng đôi khi giao diện load trên điện thoại hơi trễ',
  'Mong có thêm video hướng dẫn chi tiết cách cấu hình phông chữ hoặc email template',
  'Trải nghiệm khá ổn, tuy nhiên vẫn cần thêm các tính năng phân tích biểu đồ tròn chi tiết hơn.'
];
const RANDOM_FEEDBACKS_BAD = [
  'Gặp lỗi kết nối khi đồng bộ danh sách khách hàng từ Google Sheet, phiền tổng đài liên hệ lại',
  'Thời gian load trang thỉnh thoảng bị khựng, mong cập nhật tối ưu hiệu năng',
  'Báo cáo xuất file chưa đa dạng lựa chọn định dạng, cần thêm Excel/CSV thông minh.'
];

export function Surveys() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'feed' | 'campaigns' | 'builder'>('feed');
  const [responses, setResponses] = useState<SurveyResponse[]>(() => {
    const saved = localStorage.getItem('local_crm_survey_responses');
    return saved ? JSON.parse(saved) : INITIAL_RESPONSE_FEED;
  });
  const [campaigns, setCampaigns] = useState<SurveyCampaign[]>(() => {
    const saved = localStorage.getItem('local_crm_survey_campaigns');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  // Builder States
  const [surveyTitle, setSurveyTitle] = useState('Khảo sát khảo sát dịch vụ khách hàng mới');
  const [surveyType, setSurveyType] = useState<'NPS' | 'CSAT' | 'BOTH'>('BOTH');
  const [questions, setQuestions] = useState<string[]>([
    'Bạn đánh giá thế nào về tốc độ phản hồi dịch vụ hỗ trợ?',
    'Khả năng giải quyết vấn đề của đội ngũ hỗ trợ kỹ thuật?',
    'Mức độ thiện cảm và thân thiện của nhân viên direct chat?'
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Search/Filters state
  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('All');

  // New Campaign states
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignTarget, setCampaignTarget] = useState('Tất cả khách hàng mua sắm');

  useEffect(() => {
    localStorage.setItem('local_crm_survey_responses', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem('local_crm_survey_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  // Calculations for scores
  // NPS Score = %Promoters - %Detractors
  // Promoters: NPS score 9 or 10
  // Passives: NPS score 7 or 8
  // Detractors: NPS score 0 to 6
  const totalNpsResponses = responses.filter(r => r.npsScore !== undefined).length;
  const promoters = responses.filter(r => r.npsScore >= 9).length;
  const detractors = responses.filter(r => r.npsScore <= 6).length;
  const promotersPct = totalNpsResponses > 0 ? (promoters / totalNpsResponses) * 100 : 0;
  const detractorsPct = totalNpsResponses > 0 ? (detractors / totalNpsResponses) * 100 : 0;
  const computedNps = Math.round(promotersPct - detractorsPct);

  // CSAT Score = (Count(4-5 stars) / Total CSAT) * 100
  const totalCsatResponses = responses.filter(r => r.csatScore !== undefined).length;
  const satisfiedCsat = responses.filter(r => r.csatScore >= 4).length;
  const computedCsatPct = totalCsatResponses > 0 ? Math.round((satisfiedCsat / totalCsatResponses) * 100) : 0;

  // Average CSAT Star
  const averageCsatStar = totalCsatResponses > 0 
    ? (responses.reduce((sum, r) => sum + r.csatScore, 0) / totalCsatResponses).toFixed(1) 
    : '5.0';

  // CES (Customer Effort Score - 1 to 5, Higher is easier). Avg calculated
  const averageCes = responses.filter(r => r.cesScore !== undefined).length > 0
    ? (responses.reduce((sum, r) => sum + r.cesScore, 0) / responses.length).toFixed(1)
    : '4.5';

  const filteredResponses = responses.filter(res => {
    const matchesSearch = 
      res.customerName.toLowerCase().includes(search.toLowerCase()) ||
      res.comment.toLowerCase().includes(search.toLowerCase()) ||
      res.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesCampaign = campaignFilter === 'All' || res.campaignName === campaignFilter;
    
    return matchesSearch && matchesCampaign;
  });

  // Action: Simulate incoming survey response
  const handleSimulateFeedback = () => {
    // Generate random items
    const scoreType = Math.random(); // 0-0.5 = Good, 0.5-0.8 = Neutral, 0.8-1.0 = Bad
    let npsScore = 10;
    let csatScore = 5;
    let cesScore = 5;
    let comment = '';
    let sentiment: SurveyResponse['sentiment'] = 'Happy';

    if (scoreType <= 0.6) {
      // Good
      npsScore = Math.floor(Math.random() * 2) + 9; // 9, 10
      csatScore = Math.floor(Math.random() * 2) + 4; // 4, 5
      cesScore = Math.floor(Math.random() * 2) + 4; // 4, 5
      comment = RANDOM_FEEDBACKS_GOOD[Math.floor(Math.random() * RANDOM_FEEDBACKS_GOOD.length)];
      sentiment = 'Happy';
    } else if (scoreType <= 0.85) {
      // Neutral
      npsScore = Math.floor(Math.random() * 2) + 7; // 7, 8
      csatScore = 3;
      cesScore = 3;
      comment = RANDOM_FEEDBACKS_NEUTRAL[Math.floor(Math.random() * RANDOM_FEEDBACKS_NEUTRAL.length)];
      sentiment = 'Neutral';
    } else {
      // Bad
      npsScore = Math.floor(Math.random() * 7); // 0-6
      csatScore = Math.floor(Math.random() * 2) + 1; // 1, 2
      cesScore = Math.floor(Math.random() * 2) + 1; // 1, 2
      comment = RANDOM_FEEDBACKS_BAD[Math.floor(Math.random() * RANDOM_FEEDBACKS_BAD.length)];
      sentiment = 'Frustrated';
    }

    const randName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const randEmail = RANDOM_EMAILS[Math.floor(Math.random() * RANDOM_EMAILS.length)];
    const activeCampaigns = campaigns.filter(c => c.status === 'Đang chạy');
    const selectedCampaign = activeCampaigns.length > 0 
      ? activeCampaigns[Math.floor(Math.random() * activeCampaigns.length)].name 
      : 'Khảo sát chất lượng hỗ trợ kỹ thuật';

    const newResponse: SurveyResponse = {
      id: `SR-${200 + responses.length + 1}`,
      customerName: randName,
      email: randEmail,
      campaignName: selectedCampaign,
      npsScore,
      csatScore,
      cesScore,
      comment,
      sentiment,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // Update state
    setResponses([newResponse, ...responses]);

    // Also update campaign response count
    setCampaigns(prev => prev.map(c => {
      if (c.name === selectedCampaign) {
        return { ...c, responseCount: c.responseCount + 1 };
      }
      return c;
    }));

    addToast(
      sentiment === 'Happy' ? 'Khảo sát tích cực 🌸' : sentiment === 'Neutral' ? 'Khảo sát trung lập ☕' : 'Hồi đáp băn khoăn ⚠️',
      `Khách hàng "${randName}" đánh giá NPS: ${npsScore}đ cho dịch vụ!`,
      sentiment === 'Happy' ? 'success' : sentiment === 'Neutral' ? 'info' : 'error',
      'crm'
    );
  };

  // Action: Create survey campaign
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      addToast('Lỗi nhập liệu', 'Vui lòng điền tên chiến dịch khảo sát khảo sát!', 'error', 'crm');
      return;
    }

    const nextId = `SC-${100 + campaigns.length + 1}`;
    const newCampaign: SurveyCampaign = {
      id: nextId,
      name: campaignName.trim(),
      targetGroup: campaignTarget,
      status: 'Bản nháp',
      responseCount: 0,
      sentCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCampaigns([...campaigns, newCampaign]);
    setIsNewCampaignOpen(false);
    setCampaignName('');
    addToast(
      'Khởi tạo thành công',
      `Bản nháp Chiến dịch khảo sát "${newCampaign.name}" đã được dựng thành công!`,
      'success',
      'crm'
    );
  };

  // Action: Toggle campaign status
  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus: SurveyCampaign['status'] = c.status === 'Đang chạy' ? 'Đã tạm dừng' : 'Đang chạy';
        addToast(
          'Đã cập nhật',
          `Chiến dịch "${c.name}" chuyển trạng thái sang [${nextStatus}]`,
          'info',
          'crm'
        );
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  // Action: Add question in builder
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setQuestions([...questions, newQuestionText.trim()]);
    setNewQuestionText('');
    addToast('Đã thêm câu hỏi', 'Bản mẫu câu trả lời đã tích hợp đầu vào mới này.', 'success', 'crm');
  };

  // Action: Delete question from builder
  const handleDeleteQuestion = (idx: number) => {
    const qName = questions[idx];
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    addToast('Đã gỡ bỏ', `Đã xóa câu hỏi: "${qName.substring(0, 30)}..."`, 'warning', 'crm');
  };

  // Action: Delete response log
  const handleDeleteResponse = (id: string) => {
    if (confirm('Xác nhận xóa phiếu phản hồi khảo sát này?')) {
      setResponses(prev => prev.filter(r => r.id !== id));
      addToast('Mục tiêu đã xoá', 'Phiếu phản hồi đã bị dọn sạch khỏi dữ liệu phân tích tập trung.', 'warning', 'crm');
    }
  };

  return (
    <div className="flex flex-col h-full gap-5 font-sans relative p-4 lg:p-6 overflow-y-auto no-scrollbar w-full" id="surveys-module-container">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-pink-50 dark:bg-slate-800 rounded-lg text-pink-600 dark:text-pink-400">
              <SmilePlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Mô-đun Khảo sát & Ý Kiến Khách Hàng
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Chỉ số hài lòng tập trung (CSAT, NPS, CES), đo lường cảm xúc trực quan đa kênh
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={handleSimulateFeedback}
            className="border-dashed border border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-400 dark:border-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Sparkles size={14} className="animate-spin text-blue-600" /> Tạo phản hồi mô phỏng
          </button>
          <button
            onClick={() => setIsNewCampaignOpen(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-pink-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={15} strokeWidth={3} /> Tạo cuộc khảo sát
          </button>
        </div>
      </div>

      {/* 2. Key stats panels (NPS, CSAT, CES, response metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="surveys-stats-row">
        
        {/* NPS Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NET PROMOTER SCORE (NPS)</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black tracking-tight ${
                computedNps > 50 ? 'text-emerald-500' : computedNps > 20 ? 'text-blue-500' : 'text-amber-500'
              }`}>
                {computedNps > 0 ? `+${computedNps}` : computedNps}
              </span>
              <span className="text-[10px] font-bold text-slate-400">hạng sạch</span>
            </div>
          </div>
          {/* Progress visual bar */}
          <div className="mt-3">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-rose-500" style={{ width: `${detractorsPct}%` }} title="Detractors" />
              <div className="h-full bg-amber-400" style={{ width: `${100 - promotersPct - detractorsPct}%` }} title="Passives" />
              <div className="h-full bg-emerald-500" style={{ width: `${promotersPct}%` }} title="Promoters" />
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-1.5">
              <span>Hài lòng: {Math.round(promotersPct)}%</span>
              <span>Chưa hài lòng: {Math.round(detractorsPct)}%</span>
            </div>
          </div>
        </div>

        {/* CSAT Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CUSTOMER SATISFACTION (CSAT)</span>
              <ThumbsUp className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{computedCsatPct}%</span>
              <span className="text-xs font-bold text-slate-500">({averageCsatStar} / 5⭐)</span>
            </div>
          </div>
          {/* Sub text */}
          <div className="text-[10px] text-slate-400 font-bold mt-3">
            Tỷ lệ phản hồi tích cực đạt 4⭐ - 5⭐ trở lên
          </div>
        </div>

        {/* CES Card (Effort) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DỄ TIẾP CẬN DỊCH VỤ (CES)</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-pink-600 dark:text-pink-400 tracking-tight">{averageCes}</span>
              <span className="text-xs font-bold text-slate-500">/ 5đ chỉ số</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold mt-3 flex items-center gap-0.5">
            <TrendingUp size={11} className="inline" /> Khách hàng đánh giá thao tác đơn giản
          </div>
        </div>

        {/* Total Feedback Counter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TỔNG GIAO PHIẾU NGOẠI VI</span>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {responses.length}
              </span>
              <span className="text-slate-400 text-xs font-bold">phiếu điền</span>
            </div>
          </div>
          <div className="text-[10px] text-indigo-500 font-bold mt-3">
            Được cập nhật tự động thời gian thực
          </div>
        </div>
      </div>

      {/* 3. Navigation internally inside the module (Tabs: Feed, Campaigns, Builder) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800" id="surveys-tabs-bar">
        {[
          { id: 'feed', name: 'Trực quan phản hồi (Feed)', count: filteredResponses.length, icon: MessageSquare },
          { id: 'campaigns', name: 'Chiến dịch khảo sát', count: campaigns.length, icon: FileSpreadsheet },
          { id: 'builder', name: 'Thiết kế mẫu câu hỏi', count: null, icon: Settings }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 tracking-tight transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-pink-600 text-pink-600 dark:text-pink-400 bg-pink-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50/50'
            }`}
          >
            <t.icon size={14} className="shrink-0" />
            {t.name}
            {t.count !== null && (
              <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Tab Contents rendering */}
      <div className="flex-1 min-h-[400px]">
        {activeTab === 'feed' && (
          /* TRỰC QUAN PHẢN HỒI (FEED) LIST */
          <div className="space-y-4">
            
            {/* Search filter for responses */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc danh sách theo Tên khách, Email hoặc từ khóa cảm nghĩ..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs pl-9 pr-4 py-2.5 rounded-lg outline-none font-semibold border border-slate-200/40 dark:border-slate-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 self-end w-full md:w-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Lọc theo chiến dịch:</span>
                <select
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-700 rounded-lg text-xs font-bold py-2 px-3 outline-none cursor-pointer w-full md:w-48"
                >
                  <option value="All">Tất cả cuộc khảo sát</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Responses List mapping */}
            <div className="space-y-3.5">
              {filteredResponses.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <SmilePlus size={32} className="mx-auto text-slate-300 animate-bounce mb-3" />
                  <p className="text-xs font-semibold text-slate-400 italic">
                    Không tìm thấy dữ liệu ý kiến khách hàng trùng khớp.
                  </p>
                </div>
              ) : (
                filteredResponses.map((res) => {
                  let sentimentEmoji = '😊';
                  let sentimentColor = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/40';
                  if (res.sentiment === 'Neutral') {
                    sentimentEmoji = '😐';
                    sentimentColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50';
                  } else if (res.sentiment === 'Frustrated') {
                    sentimentEmoji = '😟';
                    sentimentColor = 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900/40';
                  }

                  return (
                    <div 
                      key={res.id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-all hover:border-pink-500/10 flex flex-col md:flex-row gap-5 items-start justify-between relative group"
                    >
                      <div className="flex-1">
                        
                        {/* Title bar of response */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${sentimentColor}`}>
                            <span className="text-sm leading-none">{sentimentEmoji}</span>
                            {res.sentiment === 'Happy' ? 'Hài lòng' : res.sentiment === 'Neutral' ? 'Bình thường' : 'Kém hài lòng'}
                          </span>
                          <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20 px-2 py-1 rounded-full">
                            📌 {res.campaignName}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 ml-auto">
                            <Clock size={11} /> {res.createdAt}
                          </span>
                        </div>

                        {/* Customer feedback text opinion */}
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100/60 dark:border-slate-800 mt-2.5">
                          "{res.comment}"
                        </p>

                        {/* Customer profile detail */}
                        <div className="flex items-center gap-2.5 mt-3.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-extrabold text-slate-600 dark:text-slate-300">
                            {res.customerName.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 dark:text-white block">{res.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{res.email}</span>
                          </div>
                        </div>

                      </div>

                      {/* Display metric stars & scores details of this single response */}
                      <div className="flex flex-row md:flex-col items-center justify-between gap-3 w-full md:w-auto shrink-0 md:bg-slate-50 md:dark:bg-slate-800/40 md:p-4 rounded-xl border border-transparent md:border-slate-100/65 md:dark:border-slate-800/60 self-stretch md:self-auto">
                        
                        {/* NPS Score badge */}
                        <div className="text-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">NPS SCORE</span>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">{res.npsScore}</span>
                            <span className="text-[10px] text-slate-400 font-bold">/10đ</span>
                          </div>
                        </div>

                        {/* CSAT Stars */}
                        <div className="text-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">CSAT RATING</span>
                          <div className="flex items-center gap-0.5 justify-center text-yellow-400 text-xs">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < res.csatScore ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>

                        {/* CES Effort score details */}
                        <div className="text-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">DỄ THAO TÁC</span>
                          <span className="text-xs font-black text-slate-600 dark:text-slate-300 block">{res.cesScore}/5</span>
                        </div>

                        {/* Trash Delete */}
                        <button
                          onClick={() => handleDeleteResponse(res.id)}
                          className="opacity-0 group-hover:opacity-100 absolute top-3.5 right-3.5 p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all"
                          title="Xóa ý kiến này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {activeTab === 'campaigns' && (
          /* ACTIVE CAMPAIGNS TAB VIEW */
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên chiến dịch khảo sát</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhóm gửi thử nghiệm</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian tạo</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Đã gửi / Hồi đáp</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {campaigns.map((cam) => {
                    const responsePct = cam.sentCount > 0 ? Math.round((cam.responseCount / cam.sentCount) * 100) : 0;
                    
                    return (
                      <tr key={cam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 text-xs text-slate-400 font-extrabold">{cam.id}</td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-black text-slate-900 dark:text-white block hover:text-pink-600 cursor-pointer">
                            {cam.name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-bold">{cam.targetGroup}</td>
                        <td className="py-4 px-6 text-xs text-slate-400 font-semibold">{cam.createdAt}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {cam.responseCount} <span className="text-slate-400 text-[10px] font-semibold">/ {cam.sentCount} phiếu</span>
                            </span>
                            <span className="text-[10px] text-pink-600 font-semibold mt-0.5">
                              Tỉ lệ: {responsePct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              cam.status === 'Đang chạy'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : cam.status === 'Đã tạm dừng'
                                ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                            }`}>
                              {cam.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {cam.status !== 'Bản nháp' ? (
                              <button
                                onClick={() => toggleCampaignStatus(cam.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  cam.status === 'Đang chạy' 
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-600' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                                }`}
                                title={cam.status === 'Đang chạy' ? 'Tạm dừng chiến dịch' : 'Bắt đầu gửi lại'}
                              >
                                {cam.status === 'Đang chạy' ? <Pause size={12} /> : <Play size={12} />}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setCampaigns(prev => prev.map(c => c.id === cam.id ? { ...c, status: 'Đang chạy', sentCount: 150 } : c));
                                  addToast('Gửi khảo sát', `Chiến dịch "${cam.name}" đã được đưa vào hệ thống gửi email tự động!`, 'success', 'crm');
                                }}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1 text-[10px] font-black"
                                title="Bắn email chiến dịch"
                              >
                                <Send size={11} /> Bắt đầu chạy
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          /* SURVEY QUESTIONNAIRE BUILDER SYSTEM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
            
            {/* Left Design Pane */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">KHUNG THIẾT KẾ CÂU HỎI</h3>
                <span className="text-[11px] text-pink-600 font-extrabold bg-pink-50 dark:bg-pink-950/20 px-2 py-0.5 rounded-full">Interactive Form Creator</span>
              </div>

              {/* Title Setup */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tên bản mẫu biểu mẫu khảo sát</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-pink-500 font-bold"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                />
              </div>

              {/* Survey score metrics options */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Bao gồm chỉ số toán học mặc định</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'BOTH', title: 'NPS + CSAT 🏆' },
                    { id: 'NPS', title: 'Chỉ số NPS (0-10) 💖' },
                    { id: 'CSAT', title: 'CSAT Đóng Góp (1-5⭐) 🏅' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSurveyType(opt.id as any)}
                      className={`text-[10px] font-extrabold py-3.5 rounded-xl border text-center transition-all ${
                        surveyType === opt.id
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/25 text-pink-600 dark:text-pink-400 shadow-sm'
                          : 'border-slate-100 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-150'
                      }`}
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Question additions */}
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase">CÂU HỎI LỰA CHỌN KHAI THÁC THÊM ({questions.length})</label>
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                      <span className="text-[10px] font-black text-pink-500 dark:text-pink-400 w-5">#{idx + 1}</span>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1">{q}</p>
                      <button
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                        title="Xóa câu hỏi này"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add question form block */}
                <form onSubmit={handleAddQuestion} className="flex gap-2 pt-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Điền câu hỏi mới bổ sung... (Ví dụ: Bạn có gặp lỗi nào trong khi vận hành không?)"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-lg outline-none border border-slate-200/45 dark:border-slate-700"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs px-4 rounded-lg flex items-center justify-center shrink-0"
                  >
                    Bổ sung
                  </button>
                </form>
              </div>

            </div>

            {/* Right Live Preview mock device */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/40 dark:border-slate-900 flex flex-col gap-4">
              <div className="border-b border-slate-200/60 dark:border-slate-900 pb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">XEM TRƯỚC MÀN HÌNH KHÁCH HÀNG</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block mt-0.5">Hiển thị responsive trên thiết bị di động</span>
              </div>

              {/* Mobile template screen design */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-xl p-5 mx-auto max-w-sm w-full flex flex-col gap-4 relative">
                
                {/* Simulated mobile header */}
                <div className="text-center pb-2.5 border-b border-indigo-50/50 mb-1">
                  <span className="text-[15px] block">📢</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight mt-1">
                    {surveyTitle}
                  </h4>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Chúng tôi luôn trân trọng ý kiến đóng góp của bạn</span>
                </div>

                {/* NPS segment if combined */}
                {(surveyType === 'BOTH' || surveyType === 'NPS') && (
                  <div className="space-y-2 text-center pb-3 border-b border-slate-50">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-snug">
                       Bạn có sẵn lòng giới thiệu ứng dụng Power Service CRM của chúng tôi cho đồng nghiệp hoặc đối tác của bạn không?
                    </p>
                    <div className="flex items-center justify-between gap-0.5 pt-1.5">
                      {Array.from({ length: 11 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 text-slate-600 border border-slate-100 hover:border-pink-500 text-[10px] font-black shadow-sm"
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-slate-400 font-black">
                      <span>0 - Hoàn toàn không</span>
                      <span>10 - Rất sẵn lòng</span>
                    </div>
                  </div>
                )}

                {/* CSAT segment if combined */}
                {(surveyType === 'BOTH' || surveyType === 'CSAT') && (
                  <div className="space-y-2 text-center pb-3 border-b border-slate-50">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Đánh giá chung về chất lượng phục vụ của chúng tôi:
                    </p>
                    <div className="flex items-center justify-center gap-1.5 pt-1 text-yellow-400 text-lg">
                      {['★', '★', '★', '★', '☆'].map((char, i) => (
                        <span key={i} className="cursor-pointer">{char}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional custom question fields */}
                <div className="space-y-3 pb-3 border-b border-slate-50">
                  {questions.slice(0, 1).map((q, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-left">{q}</p>
                      <input
                        type="text"
                        disabled
                        placeholder="Câu trả lời của bạn..."
                        className="w-full bg-slate-50 dark:bg-slate-800 text-[10px] p-2 rounded-lg border border-slate-100 text-slate-400"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-left">Ý kiến góp ý khác (nếu có):</p>
                    <textarea
                      rows={2}
                      disabled
                      placeholder="Chúng tôi lắng nghe bạn..."
                      className="w-full bg-slate-50 dark:bg-slate-800 text-[10px] p-2 rounded-lg border border-slate-100 text-slate-400"
                    />
                  </div>
                </div>

                {/* Submit button preview */}
                <button
                  type="button"
                  className="w-full bg-pink-600 text-white font-extrabold text-[10px] py-2 rounded-xl"
                >
                  Xác nhận gửi ý kiến khảo sát
                </button>
              </div>

              {/* Simulated notification footer */}
              <div className="text-center text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
                <HelpCircle size={12} /> Biểu mẫu khảo sát tự động tối ưu hóa cho màn hình di động
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 5. SURVEY CAMPAIGN CREATION DIALOG MODAL */}
      <AnimatePresence>
        {isNewCampaignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewCampaignOpen(false)}
              className="fixed inset-0 bg-slate-900"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-pink-600">
                  <SmilePlus size={20} />
                  <h3 className="font-black text-sm text-slate-950 dark:text-white uppercase tracking-wider">
                    Thiết lập Cuộc Khảo sát Mới
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewCampaignOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tên chiến dịch khảo sát *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-pink-500 font-bold"
                    placeholder="Ví dụ: Khảo sát chất lượng dịch vụ Quý 3"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Đối tượng khách nhận phiếu</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-3 py-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700 outline-none focus:border-pink-500 font-bold cursor-pointer"
                    value={campaignTarget}
                    onChange={(e) => setCampaignTarget(e.target.value)}
                  >
                    <option value="Tất cả khách hàng mua sắm">Tất cả khách hàng phát sinh hóa đơn</option>
                    <option value="Khách hàng Platinum & Diamond">Khách hàng Platinum & Diamond (VIP)</option>
                    <option value="Khách hàng vừa đóng support ticket">Khách hàng vừa có vé hỗ trợ đóng lại</option>
                    <option value="Khách tiềm năng vừa liên hệ">Khách tiềm năng vừa liên hệ</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNewCampaignOpen(false)}
                    className="border border-slate-200 text-slate-700 hover:bg-slate-50 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-pink-500/10 active:scale-95 transition-all"
                  >
                    Tạo bản nháp
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
