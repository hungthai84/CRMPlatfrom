import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileText, FolderOpen, Plus, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { KnowledgeDoc } from '../../types/crm';
import { Button, Input, Modal, Select, StatusLabel, Textarea } from '../../components/ui/Primitives';

export const DocumentsModule: React.FC = () => {
  const { can } = useAuth();
  const { documents, createDocument, approveDocument } = useCRM();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [fTitle, setFTitle] = useState('');
  const [fFolder, setFFolder] = useState('SOP Vận hành');
  const [fType, setFType] = useState<KnowledgeDoc['type']>('sop');
  const [fVisibility, setFVisibility] = useState<KnowledgeDoc['visibility']>('internal');
  const [fContent, setFContent] = useState('');

  const folders = useMemo(
    () => Array.from(new Set(documents.map((d) => d.folder))),
    [documents]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (folderFilter !== 'all' && d.folder !== folderFilter) return false;
      if (q && !`${d.code} ${d.title} ${d.content}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documents, search, folderFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDocument({
      title: fTitle,
      folder: fFolder,
      type: fType,
      visibility: fVisibility,
      content: fContent,
    });
    addToast('Đã tạo tài liệu mới', fTitle, 'success');
    setCreateOpen(false);
    setFTitle('');
    setFContent('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">14. Tài liệu & Cơ sở Tri thức (Knowledge Base)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kho SOP nội bộ, tài liệu bán hàng, FAQ cổng khách hàng & quy trình phê duyệt phát hành.
          </p>
        </div>
        {can('documents', 'create') && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Thêm Tài liệu / FAQ
          </Button>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tiêu đề, mã tài liệu, nội dung..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
        <Select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}>
          <option value="all">Tất cả thư mục</option>
          {folders.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div key={doc.id} className="glass-card rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="inline-flex items-center gap-1"><FolderOpen className="w-3 h-3" /> {doc.folder}</span>
                <span className="font-mono">{doc.code} · {doc.version}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{doc.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{doc.content}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <StatusLabel
                tone={doc.approvalStatus === 'approved' ? 'success' : 'warning'}
                text={doc.approvalStatus === 'approved' ? 'Đã phát hành' : 'Bản nháp'}
              />
              <div className="flex items-center gap-2 text-xs">
                <button onClick={() => setSelectedDoc(doc)} className="text-[#1951fc] hover:underline cursor-pointer">
                  Đọc
                </button>
                {doc.approvalStatus !== 'approved' && can('documents', 'approve') && (
                  <button
                    onClick={async () => {
                      await approveDocument(doc.id);
                      addToast('Đã phê duyệt phát hành', doc.title, 'success');
                    }}
                    className="text-emerald-600 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Duyệt
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={Boolean(selectedDoc)} onClose={() => setSelectedDoc(null)} title={selectedDoc?.title || ''} subtitle={`${selectedDoc?.code} · ${selectedDoc?.folder} · ${selectedDoc?.visibility}`}>
        {selectedDoc && (
          <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
            {selectedDoc.content}
          </div>
        )}
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm Tài liệu / Bài viết Tri thức">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Tiêu đề tài liệu" required value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Thư mục" value={fFolder} onChange={(e) => setFFolder(e.target.value)} />
            <Select label="Loại" value={fType} onChange={(e) => setFType(e.target.value as KnowledgeDoc['type'])}>
              <option value="sop">SOP Quy trình</option>
              <option value="faq">FAQ Khách hàng</option>
              <option value="document">Tài liệu nội bộ</option>
              <option value="article">Hướng dẫn</option>
            </Select>
            <Select label="Phạm vi hiển thị" value={fVisibility} onChange={(e) => setFVisibility(e.target.value as KnowledgeDoc['visibility'])}>
              <option value="internal">Nội bộ công ty</option>
              <option value="customer_portal">Công khai trên Portal</option>
            </Select>
          </div>
          <Textarea label="Nội dung" required rows={5} value={fContent} onChange={(e) => setFContent(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="submit">
              <FileText className="w-3.5 h-3.5" /> Lưu bản nháp
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
