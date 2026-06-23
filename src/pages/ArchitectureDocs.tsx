import Markdown from 'react-markdown';
import { RAW_DOCUMENTATION } from '../data/documentation';

export function ArchitectureDocs() {
  return (
    <div className="w-full h-full p-4 lg:p-6 space-y-6 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/40">
      <div className="border-b border-white/60 pb-8 relative">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Kiến trúc Hệ thống</h1>
        <p className="text-slate-600 font-semibold mt-3 text-lg">Thông số kỹ thuật toàn diện cho RevaDetail CRM.</p>
        <div className="flex gap-3 mt-6">
          <span className="bg-white/60 backdrop-blur-sm text-blue-800 px-3.5 py-1.5 rounded-lg text-xs font-extrabold border border-white/80 shadow-sm tracking-widest uppercase">Tuyệt mật</span>
          <span className="bg-white/60 backdrop-blur-sm text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-extrabold border border-white/80 shadow-sm tracking-widest uppercase">Phiên bản 1.0</span>
        </div>
      </div>

      <div className="markdown-body prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-code:text-indigo-700 prose-code:bg-white/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:border-white/60 prose-code:rounded-lg prose-pre:bg-white/60 prose-pre:border prose-pre:border-white/80 prose-pre:backdrop-blur-md prose-pre:shadow-[0_4px_20px_rgba(0,0,0,0.03)] prose-p:font-medium prose-li:font-medium">
         <Markdown>{RAW_DOCUMENTATION}</Markdown>
      </div>
    </div>
  );
}
