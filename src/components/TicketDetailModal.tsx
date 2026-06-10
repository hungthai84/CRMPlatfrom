import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  Lock, 
  Globe, 
  User, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Loader2,
  MessageSquare,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, TicketComment, TicketStatus, TicketPriority } from '../types';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  iconLink?: string;
  webViewLink?: string;
}

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export const TicketDetailModal = ({ ticket, onClose }: TicketDetailModalProps) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<DriveFile[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newFile: DriveFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          mimeType: file.type,
          webViewLink: base64data
        };
        setAttachedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    if (typeof date === 'number') return new Date(date).toLocaleString('vi-VN');
    if (date && typeof date.toDate === 'function') return date.toDate().toLocaleString('vi-VN');
    return new Date(date).toLocaleString('vi-VN');
  };

  useEffect(() => {
    if (!ticket.id) return;
    const q = query(
      collection(db, `/tickets/${ticket.id}/comments`),
      where('ticketOwnerId', '==', user?.uid || '')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TicketComment);
      data = data.sort((a,b) => a.createdAt - b.createdAt);
      setComments(data);
      setLoadingComments(false);
    });
    return () => unsubscribe();
  }, [ticket.id]);

  const handleSend = async () => {
    if ((!comment.trim() && attachedFiles.length === 0) || !user || !ticket.id) return;
    
    setSubmittingComment(true);
    try {
      const newComment = {
        ticketId: ticket.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        userRole: 'agent',
        ticketOwnerId: ticket.ownerId || user.uid, // Ensuring it matches the parent ticket owner
        content: comment,
        isPrivate: isPrivate,
        attachments: attachedFiles.map(f => ({ url: f.webViewLink || f.iconLink || '', type: f.mimeType, name: f.name })),
        createdAt: serverTimestamp(),
      };

      const commentsRef = collection(db, `/tickets/${ticket.id}/comments`);
      await addDoc(commentsRef, newComment);
      
      // Also update ticket's updatedAt
      await updateDoc(doc(db, 'tickets', ticket.id), {
        updatedAt: serverTimestamp()
      });

      setComment('');
      setAttachedFiles([]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tickets/${ticket.id}/comments`);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket.id) return;
    setUpdatingStatus(true);
    try {
      await updateDoc(doc(db, 'tickets', ticket.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticket.id}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getSLAStatus = () => {
    const deadline = typeof ticket.slaDeadline === 'number' ? ticket.slaDeadline : 0;
    const timeRemaining = deadline - Date.now();
    if (timeRemaining < 0) return { label: 'Đã quá hạn', color: 'text-rose-600', icon: <AlertTriangle className="w-4 h-4" /> };
    if (timeRemaining < 3600000) return { label: 'Gần hết hạn (Dưới 1h)', color: 'text-orange-600', icon: <Clock className="w-4 h-4" /> };
    return { label: 'Đang xử lý (Trong SLA)', color: 'text-emerald-600', icon: <CheckCircle2 className="w-4 h-4" /> };
  };

  const sla = getSLAStatus();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">{ticket.ticketId}</span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Feed */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-100">
            {/* Ticket Info Card */}
            <div className="p-6 bg-blue-50/30 border-b border-blue-100/50">
              <p className="text-slate-700 text-sm leading-relaxed mb-4">
                {ticket.description}
              </p>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className={`flex items-center gap-1.5 ${sla.color}`}>
                  {sla.icon}
                  {sla.label}
                </div>
                <span className="text-slate-400">•</span>
                <div className="text-slate-500">Nguồn: <span className="capitalize">{ticket.source}</span></div>
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {loadingComments ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
                   <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                   <p className="text-xs font-bold text-slate-400">Đang tải cuộc hội thoại...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12 opacity-60">
                   <MessageSquare className="w-10 h-10" />
                   <p className="text-sm font-bold">Chưa có bình luận nào</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className={`flex gap-4 ${c.isPrivate ? 'bg-amber-50/50 -mx-6 px-6 py-4 border-y border-amber-100/50' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${c.userRole === 'agent' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {c.userName?.charAt(0)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{c.userName}</span>
                          {c.isPrivate && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              <Lock className="w-3 h-3" /> Note nội bộ
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm text-slate-700 leading-relaxed ${c.isPrivate ? 'italic' : ''}`}>
                        {c.content}
                      </p>
                      {c.attachments && c.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {c.attachments.map((att, i) => (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors">
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{att.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="mb-2 flex items-center gap-3">
                <button 
                  onClick={() => setIsPrivate(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isPrivate ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <Globe className="w-3.5 h-3.5" /> Trả lời khách hàng
                </button>
                <button 
                  onClick={() => setIsPrivate(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPrivate ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <Lock className="w-3.5 h-3.5" /> Note nội bộ
                </button>
              </div>

              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-lg">
                  {attachedFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700">
                      <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{f.name}</span>
                      <button onClick={() => setAttachedFiles(prev => prev.filter(a => a.id !== f.id))} className="text-slate-400 hover:text-rose-500 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <textarea 
                  disabled={submittingComment}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isPrivate ? "Ghi chú nội bộ (Khách hàng không thấy)..." : "Nhập nội dung phản hồi khách hàng..."}
                  className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none h-24 disabled:opacity-50"
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    multiple 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                    title="Đính kèm tập tin"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={(!comment.trim() && attachedFiles.length === 0) || submittingComment}
                    className="p-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="w-72 bg-slate-50/50 p-6 space-y-8 overflow-y-auto border-l border-slate-100">
            {/* Status Section */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Thông tin chung
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Trạng thái</label>
                  <div className="space-y-2">
                    <select 
                      disabled={updatingStatus}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      value={['new', 'processing', 'pending', 'resolved', 'closed'].includes(ticket.status) ? ticket.status : 'other'}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value !== 'other') {
                          handleStatusChange(value as TicketStatus);
                        }
                      }}
                    >
                      <option value="new">Mới</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="pending">Chờ phản hồi</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="closed">Đóng</option>
                      <option value="other">Tùy chỉnh...</option>
                    </select>
                    {!['new', 'processing', 'pending', 'resolved', 'closed'].includes(ticket.status) && (
                      <div className="flex gap-2 relative group">
                        <input
                          type="text"
                          disabled={updatingStatus}
                          placeholder="Trạng thái tùy chỉnh..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                          value={ticket.status}
                          readOnly
                        />
                      </div>
                    )}
                    {['new', 'processing', 'pending', 'resolved', 'closed'].includes(ticket.status) && (
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => {
                            const customStatus = window.prompt("Nhập trạng thái tùy chỉnh:");
                            if (customStatus && customStatus.trim() !== "") {
                               handleStatusChange(customStatus.trim() as TicketStatus);
                            }
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 transition-colors font-bold"
                        >
                          + Thêm trạng thái tùy chỉnh
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nhân viên phụ trách</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-bold">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 uppercase">
                      {ticket.agentName?.charAt(0) || 'U'}
                    </div>
                    {ticket.agentName || 'Chưa gán'}
                  </div>
                </div>
              </div>
            </section>

            {/* Customer Section */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Khách hàng</h3>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {ticket.customerName?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{ticket.customerName}</h4>
                    <p className="text-[10px] font-medium text-slate-500">Khách hàng CRM</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between gap-2">
                  <button className="flex-1 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    Chi tiết
                  </button>
                  <button className="flex-1 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    Lịch sử
                  </button>
                </div>
              </div>
            </section>

            {/* Timestamps */}
            <section className="space-y-2.5 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Ngày tạo</span>
                <span className="text-slate-900">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Cập nhật cuối</span>
                <span className="text-slate-900">
                  {formatDate(ticket.updatedAt)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-bold py-1 px-2 bg-slate-100 rounded-md mt-2">
                <span className="text-slate-500">Hạn SLA</span>
                <span className={sla.color}>{new Date(ticket.slaDeadline).toLocaleTimeString('vi-VN')}</span>
              </div>
            </section>
          </div>
        </div>
      </motion.div>

    </div>
  );
};
