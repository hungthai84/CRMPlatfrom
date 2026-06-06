import React, { useState, useEffect } from 'react';
import { X, Search, File, Folder, HardDrive, AlertCircle } from 'lucide-react';
import { getAccessToken } from '../lib/firebase';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  iconLink?: string;
  webViewLink?: string;
}

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (files: DriveFile[]) => void;
  multiple?: boolean;
}

export function DrivePickerModal({ isOpen, onClose, onSelectFiles, multiple = false }: DrivePickerModalProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const fetchFiles = async (searchQuery: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Bạn cần đăng nhập lại với quyền truy cập Google Drive.');
      }

      let url = 'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,thumbnailLink,iconLink,webViewLink)&pageSize=50';
      
      let q = "trashed = false";
      if (searchQuery) {
        q += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      }
      url += `&q=${encodeURIComponent(q)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || 'Không thể tải danh sách tệp.');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(query);
  };

  const toggleSelect = (fileId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      if (!multiple) {
        newSelected.clear();
      }
      newSelected.add(fileId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    onSelectFiles(selectedFiles);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col h-[80vh] min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <HardDrive className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Chọn tệp từ Google Drive</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors hidden sm:block">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-50">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tệp..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-start space-x-3 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <HardDrive className="h-12 w-12 text-slate-300 mb-3" />
              <p>Không tìm thấy tệp nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map(file => {
                const isSelected = selectedIds.has(file.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`group relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-transparent bg-white hover:border-blue-200 hover:shadow-md'
                    }`}
                  >
                    <div className="w-16 h-16 mb-3 flex items-center justify-center">
                      {file.thumbnailLink ? (
                        <img src={file.thumbnailLink} alt="" className="max-w-full max-h-full object-contain rounded" />
                      ) : file.mimeType === 'application/vnd.google-apps.folder' ? (
                        <Folder className="w-12 h-12 text-slate-400" />
                      ) : (
                        <File className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                    <p className="text-xs text-center font-medium text-slate-700 line-clamp-2 break-all px-1">
                      {file.name}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-2xl">
          <p className="text-sm font-medium text-slate-500">
            Đã chọn {selectedIds.size} tệp
          </p>
          <div className="flex space-x-3">
             <button
              onClick={onClose}
              className="px-5 py-2 text-slate-700 hover:bg-slate-100 font-medium rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              disabled={selectedIds.size === 0}
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Chọn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
