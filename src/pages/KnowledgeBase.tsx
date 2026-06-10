import { useState } from 'react';
import { BookOpen, Search, Plus, Save, Edit3, X, Folder } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
}

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Quy trình xử lý sự cố cho VIP',
    category: 'SOP',
    content: '# Quy trình xử lý SLA cho VIP\n\n1. **Tiếp nhận**: Chuyển ngay ticket VIP sang `Tier 2`.\n2. **Phản hồi**: Đảm bảo SLA thời gian phản hồi dưới 15 phút.\n3. **Cập nhật**: Báo cáo tình hình qua Email hoặc Zalo mỗi 2 giờ.',
    updatedAt: '24/10/2024'
  },
  {
    id: '2',
    title: 'Chính sách hoàn tiền 2024',
    category: 'Policies',
    content: '# Chính sách Hoàn tiền (Refund Policy)\nKhách hàng được hoàn 100% chi phí nếu hệ thống gặp lỗi gián đoạn quá 24h. Cần có sự phê duyệt từ CRM Admin.',
    updatedAt: '12/09/2024'
  },
  {
    id: '3',
    title: 'Tích hợp Google Workspace CRM',
    category: 'Guide',
    content: 'Để tích hợp, làm theo các bước:\n- Vào menu **Settings** > **Integrations**.\n- Chọn Google Calendar.\n- Đăng nhập bằng tài khoản quản trị viện.',
    updatedAt: '05/10/2024'
  }
];

export function KnowledgeBase() {
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(mockArticles[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', 'SOP', 'Policies', 'Guide', 'FAQ'];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredArticles = articles.filter(a => 
    (activeCategory === 'All' || a.category === activeCategory) &&
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = () => {
    if (selectedArticle) {
      setEditForm(selectedArticle);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editForm.id) {
      setArticles(articles.map(a => a.id === editForm.id ? { ...a, ...editForm, updatedAt: new Date().toLocaleDateString('en-GB') } as Article : a));
    } else {
      const newArticle = { ...editForm, id: Date.now().toString(), updatedAt: new Date().toLocaleDateString('en-GB') } as Article;
      setArticles([...articles, newArticle]);
      setSelectedArticle(newArticle);
    }
    setIsEditing(false);
  };

  const handleNew = () => {
    setSelectedArticle(null);
    setEditForm({ title: '', category: 'FAQ', content: '# Nội dung mới\n\nBắt đầu nhập nội dung...' });
    setIsEditing(true);
  };

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden p-6 md:p-8">
      {/* Left Sidebar - Article List */}
      <div className="w-80 bg-white border border-slate-200 rounded-[12px] shadow-sm flex flex-col mr-6 shrink-0 h-full overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
           <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
             <BookOpen size={20} className="text-[#2F69FF]" /> Kho Tri Thức
           </h2>
           <p className="text-xs font-semibold text-slate-500 mt-1">Wiki nội bộ & Tài liệu</p>
           
           <div className="mt-4 relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Tìm kiếm bài viết..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#2F69FF] font-medium"
             />
           </div>
           
           <div className="mt-4 flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn("px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition-all", activeCategory === cat ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredArticles.map(article => (
            <button
              key={article.id}
              onClick={() => { setSelectedArticle(article); setIsEditing(false); }}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all",
                (!isEditing && selectedArticle?.id === article.id) ? "bg-[#2F69FF] text-white shadow-md shadow-blue-500/20" : "bg-transparent text-slate-700 hover:bg-slate-50"
              )}
            >
              <div className="flex justify-between items-start mb-1 text-xs">
                <span className={cn("font-bold px-2 py-0.5 rounded-[4px]", (!isEditing && selectedArticle?.id === article.id) ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                  {article.category}
                </span>
                <span className={cn("opacity-70 font-medium", (!isEditing && selectedArticle?.id === article.id) ? "text-blue-100" : "text-slate-400")}>{article.updatedAt}</span>
              </div>
              <h4 className="font-bold text-sm line-clamp-2 leading-snug">{article.title}</h4>
            </button>
          ))}
          {filteredArticles.length === 0 && (
             <div className="text-center py-10 text-slate-400 text-sm font-medium">Không tìm thấy tài liệu phù hợp.</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0">
          <button onClick={handleNew} className="w-full flex items-center justify-center gap-2 bg-[#2F69FF] text-white py-2.5 rounded-[8px] font-bold hover:bg-blue-600 shadow-sm transition-all text-sm">
            <Plus size={16} /> Tạo tài liệu mới
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-[12px] shadow-sm flex flex-col h-full overflow-hidden">
        {isEditing ? (
          <div className="flex flex-col h-full overflow-hidden bg-slate-50/30">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-900">{editForm.id ? "Chỉnh sửa tài liệu" : "Tạo mới tài liệu"}</h3>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-[8px] transition-colors"><X className="inline-block mr-1" size={16} /> Hủy</button>
                <button onClick={handleSave} className="px-5 py-2 bg-[#2F69FF] hover:bg-blue-600 text-white font-bold text-sm rounded-[8px] flex items-center gap-2 shadow-sm transition-colors"><Save size={16} /> Lưu</button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tiêu đề</label>
                  <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full border border-slate-300 rounded-[8px] px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2F69FF] shadow-sm" />
                </div>
                <div className="w-64">
                   <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Danh mục</label>
                   <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full border border-slate-300 rounded-[8px] px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2F69FF] shadow-sm bg-white cursor-pointer">
                     {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
              </div>

              <div className="flex-1 flex flex-col relative mt-2 border border-slate-300 rounded-[8px] overflow-hidden shadow-sm bg-white">
                <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex items-center text-xs font-bold text-slate-600 shrink-0">
                  MARKDOWN EDITOR
                </div>
                <textarea 
                  value={editForm.content} 
                  onChange={e => setEditForm({...editForm, content: e.target.value})}
                  className="flex-1 w-full p-6 text-sm font-mono leading-relaxed bg-white text-slate-800 resize-none outline-none"
                  placeholder="Hỗ trợ cú pháp Markdown (# Tiêu đề, **In đậm**, *In nghiêng*, 1. Danh sách...)"
                />
              </div>
            </div>
          </div>
        ) : selectedArticle ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white sticky top-0 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                     <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-[6px] text-xs font-bold">{selectedArticle.category}</span>
                     <span className="text-xs font-semibold text-slate-400">Cập nhật lúc: {selectedArticle.updatedAt}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedArticle.title}</h1>
                </div>
                <button onClick={handleEdit} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-[8px] text-sm font-bold transition-all shadow-sm">
                  <Edit3 size={16} /> Sửa tài liệu
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
               <div className="prose prose-slate prose-headings:font-extrabold prose-headings:tracking-tight max-w-4xl prose-a:text-[#2F69FF]">
                 <div className="markdown-body">
                   <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
             <Folder size={64} className="opacity-30 mb-4 text-slate-300" />
             <p className="text-lg font-bold text-slate-600">Chọn một tài liệu để xem nội dung</p>
             <p className="text-sm font-medium mt-1">Hoặc tạo tài liệu mới từ thanh menu bên trái.</p>
          </div>
        )}
      </div>
    </div>
  );
}
