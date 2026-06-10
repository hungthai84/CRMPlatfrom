import { useState } from 'react';
import { File, FileText, Image as ImageIcon, Download, UploadCloud, Folder, Search, MoreHorizontal, FileArchive} from 'lucide-react';
import { showPicker } from '../lib/googlePicker';

export function Documents() {
  const [activeFolder, setActiveFolder] = useState('All');
  const [isPicking, setIsPicking] = useState(false);
  
  const folders = ['All', 'Contracts', 'Invoices', 'Warranty', 'Proposals', 'Google Drive'];
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Hợp đồng TechStart - Q3 2024.pdf', type: 'pdf', size: '2.4 MB', date: 'Oct 24, 2024', folder: 'Contracts', user: 'TechStart Inc' },
    { id: 2, name: 'Báo giá dịch vụ mở rộng - ABC.docx', type: 'doc', size: '845 KB', date: 'Oct 23, 2024', folder: 'Proposals', user: 'ABC Corp' },
    { id: 3, name: 'Hóa đơn dịch vụ tháng 9.pdf', type: 'pdf', size: '1.2 MB', date: 'Oct 15, 2024', folder: 'Invoices', user: 'TechStart Inc' },
    { id: 4, name: 'Giấy chứng nhận bảo hành hệ thống.pdf', type: 'pdf', size: '3.1 MB', date: 'Oct 10, 2024', folder: 'Warranty', user: 'Nova Logistics' },
    { id: 5, name: 'Tài liệu hướng dẫn sử dụng CRM.pdf', type: 'pdf', size: '5.6 MB', date: 'Oct 05, 2024', folder: 'Contracts', user: 'TechStart Inc' },
    { id: 6, name: 'Biên bản thỏa thuận bảo mật (NDA).pdf', type: 'pdf', size: '1.1 MB', date: 'Oct 01, 2024', folder: 'Contracts', user: 'Nova Logistics' },
  ]);

  const handlePickFromDrive = async () => {
    try {
      setIsPicking(true);
      await showPicker((selectedDocs) => {
        const newDocs = selectedDocs.map((doc: any, index: number) => ({
          id: Date.now() + index,
          name: doc.name,
          type: doc.mimeType?.includes('pdf') ? 'pdf' : doc.mimeType?.includes('word') ? 'doc' : doc.mimeType?.includes('image') ? 'img' : 'other',
          size: doc.sizeBytes ? `${(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          folder: 'Google Drive',
          user: 'Google Drive'
        }));
        setDocuments(prev => [...newDocs, ...prev]);
        setActiveFolder('Google Drive');
      });
    } catch (error) {
      console.error('Picker error:', error);
      alert('Không thể mở Google Picker. Vui lòng đảm bảo bạn đã đăng nhập và cho phép quyền truy cập.');
    } finally {
      setIsPicking(false);
    }
  };

  const filteredDocs = activeFolder === 'All' ? documents : documents.filter(d => d.folder === activeFolder);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" />;
      case 'doc': return <File className="text-blue-500" />;
      case 'img': return <ImageIcon className="text-emerald-500" />;
      default: return <FileArchive className="text-slate-500" />;
    }
  };

  return (
    <div className="p-6 md:p-8 h-full bg-slate-50 flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản lý Tài liệu</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-semibold">Tổ chức và lưu trữ hợp đồng, báo giá, hóa đơn cho toàn bộ khách hàng. Được định tuyến và bảo mật an toàn.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePickFromDrive}
            disabled={isPicking}
            className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-[10px] font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Folder size={18} className="text-amber-500" />
            {isPicking ? 'Đang mở...' : 'Chọn từ Drive'}
          </button>
          <button className="bg-[#2F69FF] text-white px-5 py-2.5 rounded-[10px] font-bold text-sm hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2">
            <UploadCloud size={18} />
            Tải lên tài liệu
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border border-slate-200 rounded-[12px] p-5 flex flex-col shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Danh mục</h3>
          <ul className="space-y-1">
            {folders.map(folder => (
              <li key={folder}>
                <button
                  onClick={() => setActiveFolder(folder)}
                  className={`w-full text-left px-4 py-2.5 rounded-[8px] text-sm font-semibold flex items-center gap-3 transition-colors ${
                    activeFolder === folder
                      ? 'bg-blue-50 text-[#2F69FF]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Folder size={16} className={activeFolder === folder ? 'text-[#2F69FF]' : 'text-slate-400'} />
                  {folder}
                  <span className="ml-auto bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-[10px]">
                     {folder === 'All' ? documents.length : documents.filter(d => d.folder === folder).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* File Grid */}
        <div className="flex-1 bg-white border border-slate-200 rounded-[12px] shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gray-50/50">
             <div className="relative w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tài liệu..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="border border-slate-200 rounded-[10px] p-4 hover:shadow-md hover:border-blue-200 transition-all bg-white group cursor-pointer relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform">
                      {getFileIcon(doc.type)}
                    </div>
                    <button className="text-slate-400 hover:text-slate-700">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug" title={doc.name}>
                    {doc.name}
                  </h4>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-col text-[11px] font-semibold text-slate-500">
                      <span>{doc.size}</span>
                      <span className="mt-0.5">{doc.date}</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex flex-col items-center justify-center pt-0.5 border border-slate-200" title={doc.user}>
                       <span className="font-bold text-slate-600 text-[9px]">{doc.user.substring(0, 2).toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-white via-white/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 pointer-events-none">
                     <button className="bg-slate-900 text-white rounded-full p-2.5 pointer-events-auto transform translate-y-2 group-hover:translate-y-0 transition-transform shadow-lg hover:bg-[#2F69FF]">
                        <Download size={16} />
                     </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredDocs.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Folder size={48} className="mb-4 opacity-50 text-slate-300" />
                  <p className="font-semibold text-slate-600">Thư mục trống</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
