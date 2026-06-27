import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, X, Plus, Trash2, Copy, Check, Clock, Edit2, Mic, MicOff } from 'lucide-react';

interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
  completed?: boolean;
}

export function QuickNoteWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      if (transcript.trim()) {
        setInputValue(prev => {
          const trimmedPrev = prev.trim();
          return trimmedPrev ? `${trimmedPrev} ${transcript}` : transcript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load notes and draft from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_quick_notes');
      if (saved) {
        setNotes(JSON.parse(saved));
      }
      const savedDraft = localStorage.getItem('crm_quick_note_draft');
      if (savedDraft) {
        setInputValue(savedDraft);
      }
    } catch (e) {
      console.warn('LocalStorage load notes/draft failed:', e);
    }
  }, []);

  // Save notes to LocalStorage when changed
  const saveNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    try {
      localStorage.setItem('crm_quick_notes', JSON.stringify(updated));
    } catch (e) {
      console.error('LocalStorage save notes failed:', e);
    }
  };

  // Auto-save input draft to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('crm_quick_note_draft', inputValue);
    } catch (e) {
      console.error('LocalStorage save draft failed:', e);
    }
  }, [inputValue]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const now = new Date();
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      content: inputValue.trim(),
      createdAt: formattedTime,
      completed: false,
    };

    saveNotes([newNote, ...notes]);
    setInputValue('');
    try {
      localStorage.removeItem('crm_quick_note_draft');
    } catch (e) {}
  };

  const handleToggleComplete = (id: string) => {
    const updated = notes.map(note => 
      note.id === id ? { ...note, completed: !note.completed } : note
    );
    saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(note => note.id !== id);
    saveNotes(updated);
  };

  const handleCopyText = (note: NoteItem) => {
    navigator.clipboard.writeText(note.content);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const startEditing = (note: NoteItem) => {
    setEditingId(note.id);
    setEditValue(note.content);
  };

  const handleSaveEdit = (id: string) => {
    if (!editValue.trim()) return;
    const updated = notes.map(note =>
      note.id === id ? { ...note, content: editValue.trim() } : note
    );
    saveNotes(updated);
    setEditingId(null);
  };

  // Number of active, uncompleted notes
  const activeNotesCount = notes.filter(n => !n.completed).length;

  return (
    <>
      {/* Floating Action Button (FAB) stacked cleanly above the AI Chat Widget */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 outline-none z-50 ${
          isOpen
            ? 'bg-rose-500 hover:bg-rose-600 text-white'
            : 'bg-indigo-650 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500'
        }`}
        title="Ghi chú nhanh"
      >
        {isOpen ? (
          <X size={22} className="stroke-[2.5]" />
        ) : (
          <div className="relative">
            <StickyNote size={22} className="stroke-[2.5]" />
            {activeNotesCount > 0 && (
              <span className="absolute -top-3.5 -right-3.5 bg-red-550 border-2 border-white dark:border-slate-950 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">
                {activeNotesCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Floating Notes Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9, y: 100, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100, x: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="fixed bottom-[164px] right-6 w-80 sm:w-96 max-h-[460px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_25px_60px_rgba(10,20,50,0.15)] rounded-2xl overflow-hidden flex flex-col z-[49] font-sans"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 dark:from-slate-900 dark:to-slate-950 text-white px-4 py-3.5 flex justify-between items-center shrink-0 border-b border-indigo-950/20 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <StickyNote size={18} className="text-yellow-400 stroke-[2.5]" />
                <span className="text-xs font-black uppercase tracking-wider">Sổ tay nháp CRM</span>
              </div>
              <span className="text-[10px] font-bold bg-white/10 dark:bg-white/5 py-0.5 px-2 rounded-full border border-white/5 text-indigo-200">
                {notes.length} ghi chú
              </span>
            </div>

            {/* Note Creator Form */}
            <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 bg-indigo-50/10 dark:bg-slate-950/25 shrink-0">
              <form
                onSubmit={handleAddNote}
                className="p-3 flex gap-2"
              >
                <div className="flex-1 relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={isListening ? "Đang nghe giọng nói của bạn..." : "Nhập ghi chú hoặc nhắc nhở..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-3 pr-9 py-2 rounded-xl text-xs font-semibold text-slate-850 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                  />
                  {micSupported && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`absolute right-1.5 p-1 rounded-lg transition-all cursor-pointer ${
                        isListening 
                          ? 'text-rose-500 bg-rose-550/10 dark:bg-rose-950/30 animate-pulse' 
                          : 'text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-850'
                      }`}
                      title={isListening ? "Dừng ghi âm" : "Ghi âm dịch giọng nói"}
                    >
                      {isListening ? <MicOff size={15} className="stroke-[2.5]" /> : <Mic size={15} className="stroke-[2.5]" />}
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md transition-all outline-none cursor-pointer"
                >
                  <Plus size={16} className="stroke-[3]" />
                </button>
              </form>
              
              {isListening && (
                <div className="px-3 pb-2.5 flex items-center gap-1.5 text-[9px] font-black text-rose-500 tracking-wide uppercase select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0 animate-ping" />
                  <span>Đang ghi âm chân thực... Hãy nói to, rõ ràng</span>
                </div>
              )}
            </div>

            {/* Scrollable List Stream */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[300px] min-h-[160px] no-scrollbar">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
                  <StickyNote className="w-8 h-8 opacity-30 mb-2.5 text-indigo-400" />
                  <p className="text-xs font-bold leading-normal">Chưa có ghi chú nào</p>
                  <p className="text-[10px] font-semibold opacity-85 mt-0.5 max-w-[200px]">
                    Lưu tạm thời ý tưởng, số điện thoại hoặc công việc cần kiểm soát ngay lập tức.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -15 }}
                      transition={{ duration: 0.15 }}
                      className={`group/notebox p-3 rounded-xl border flex flex-col justify-between gap-1.5 transition-all text-left ${
                        note.completed
                          ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-60'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={!!note.completed}
                          onChange={() => handleToggleComplete(note.id)}
                          className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                        />

                        <div className="flex-1 min-w-0">
                          {editingId === note.id ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(note.id);
                                  else if (e.key === 'Escape') setEditingId(null);
                                }}
                                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-white outline-none"
                              />
                              <button
                                onClick={() => handleSaveEdit(note.id)}
                                className="px-2 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-bold"
                              >
                                Lưu
                              </button>
                            </div>
                          ) : (
                            <p
                              className={`text-xs font-bold leading-normal break-all font-sans whitespace-pre-wrap ${
                                note.completed
                                  ? 'text-slate-400 dark:text-slate-500 line-through'
                                  : 'text-slate-850 dark:text-slate-200'
                              }`}
                            >
                              {note.content}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-1 border-t border-slate-100/60 dark:border-slate-850/60 pt-2 shrink-0">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> {note.createdAt}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover/notebox:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startEditing(note)}
                            className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded"
                            title="Sửa"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(note)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded relative"
                            title="Copy"
                          >
                            {copiedId === note.id ? (
                              <Check size={11} className="text-emerald-500" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                            title="Xoá"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Quick Actions Footer Bar */}
            {notes.length > 0 && (
              <div className="bg-slate-50/70 dark:bg-slate-850/50 px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[9px] font-black tracking-normal text-slate-400 uppercase select-none shrink-0">
                <span>Dữ liệu lưu an toàn trên trình duyệt</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Dọn sạch hệ thống ghi chú hiện hành?')) {
                      saveNotes([]);
                    }
                  }}
                  className="text-red-500 hover:text-red-600 transition-colors font-black"
                >
                  Xoá tất cả
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
