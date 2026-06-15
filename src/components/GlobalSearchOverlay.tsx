import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Magnet, Calendar, X, CornerDownLeft, Loader2, ArrowRight } from 'lucide-react';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'customers' | 'leads' | 'tasks';
  badge?: string;
  badgeColor?: string;
}

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, customerId?: string) => void;
}

// Fallback search databases for leads & calendar tasks
const STATIC_LEADS = [
  { id: 'L-1001', name: 'Nguyễn Anh Tuấn', company: 'Tuấn Phát Corp', phone: '0912345678', source: 'Facebook Ads' },
  { id: 'L-1002', name: 'Phạm Thị Mai', company: 'Mai Linh Logistics', phone: '0987654321', source: 'Website Form' },
  { id: 'L-1003', name: 'Trần Quốc Huy', company: 'Huy Hoàng Tech', phone: '0905112233', source: 'Google Search' },
  { id: 'L-1004', name: 'Lê Thủy Tiên', company: 'Cá nhân', phone: '0944556677', source: 'Zalo Campaign' },
];

const STATIC_TASKS = [
  { id: 'T-201', summary: 'Ký kết hợp đồng Techcom Corp', desc: 'Thảo luận với bộ phận pháp chế', date: '10/06/2026' },
  { id: 'T-202', summary: 'Gọi lại tư vấn bảo hiểm AAA', desc: 'Khách yêu cầu báo giá thêm ưu đãi', date: '11/06/2026' },
  { id: 'T-203', summary: 'Demo module Loyalty cho khách', desc: 'Đồng bộ hạng thẻ và ví điểm Zalo', date: '12/06/2026' },
];

export function GlobalSearchOverlay({ isOpen, onClose, onNavigate }: GlobalSearchOverlayProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Esc key closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Auto focus input
      setTimeout(() => inputRef.current?.focus(), 80);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle keyboard navigation for results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleItemClick(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Keep selected item visible scrolling
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Fetch / Filter search results
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const loadFilteredResults = async () => {
      setLoading(true);
      const output: SearchResultItem[] = [];
      const termLower = searchTerm.toLowerCase();

      // 1. Search Customers from Firebase Firestore
      try {
        if (user) {
          const custRef = collection(db, 'customers');
          const qSnap = await getDocs(query(custRef, limit(30)));
          qSnap.forEach((doc) => {
            const data = doc.data();
            const name = data.name || '';
            const email = data.email || '';
            const phone = data.phone || '';
            
            if (
              name.toLowerCase().includes(termLower) ||
              email.toLowerCase().includes(termLower) ||
              phone.toLowerCase().includes(termLower)
            ) {
              output.push({
                id: doc.id,
                title: name,
                subtitle: `${email} • ${phone || 'N/A'}`,
                category: 'customers',
                badge: data.tier || 'Thành viên',
                badgeColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
              });
            }
          });
        }
      } catch (err) {
        console.warn('Firestore fallback: standard search only', err);
      }

      // 2. Search Static Leads
      STATIC_LEADS.forEach((lead) => {
        if (
          lead.name.toLowerCase().includes(termLower) ||
          lead.company.toLowerCase().includes(termLower) ||
          lead.phone.toLowerCase().includes(termLower)
        ) {
          output.push({
            id: lead.id,
            title: lead.name,
            subtitle: `${lead.company} • Nguồn: ${lead.source}`,
            category: 'leads',
            badge: 'Lead',
            badgeColor: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',
          });
        }
      });

      // 3. Search Static Tasks
      STATIC_TASKS.forEach((task) => {
        if (
          task.summary.toLowerCase().includes(termLower) ||
          (task.desc && task.desc.toLowerCase().includes(termLower))
        ) {
          output.push({
            id: task.id,
            title: task.summary,
            subtitle: `${task.desc} • Liên kết ngày ${task.date}`,
            category: 'tasks',
            badge: 'Task',
            badgeColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
          });
        }
      });

      setResults(output);
      setSelectedIndex(0);
      setLoading(false);
    };

    const delayDebounceFn = setTimeout(() => {
      loadFilteredResults();
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user]);

  const handleItemClick = (item: SearchResultItem) => {
    onClose();
    if (item.category === 'customers') {
      onNavigate('customer360', item.id);
    } else if (item.category === 'leads') {
      onNavigate('leads');
    } else if (item.category === 'tasks') {
      onNavigate('tasks');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 pb-4">
      {/* Glassmorphic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Floating Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden flex flex-col font-sans"
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-slice outline-none focus:ring-0 placeholder-slate-400 font-semibold"
            placeholder="Tìm kiếm khách hàng, leads, công việc... (gõ để bắt đầu)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {loading ? (
            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin shrink-0" />
          ) : searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X size={14} />
            </button>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 shrink-0 select-none">
              ESC
            </span>
          )}
        </div>

        {/* Results Stream */}
        <div className="max-h-96 overflow-y-auto p-2 min-h-[140px] flex flex-col scrollbar-thin">
          {!searchTerm.trim() ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
              <Search className="h-8 w-8 opacity-40 mb-2.5 text-slate-400" />
              <p className="text-xs font-bold">Tìm kiếm nhanh toàn hệ thống</p>
              <p className="text-[11px] font-semibold opacity-80 mt-1 max-w-[280px]">
                Gõ từ khóa để đồng thời lục soát hồ sơ khách hàng, danh sách tiềm năng và lịch trình công việc.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <X className="h-8 w-8 opacity-40 mb-2.5 text-rose-400" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Không tìm thấy kết quả</p>
              <p className="text-[11px] font-semibold opacity-85 mt-1">
                Thử gõ một từ khóa khác, hoặc kiểm tra lại chính tả.
              </p>
            </div>
          ) : (
            <div ref={resultsContainerRef} className="space-y-0.5 pr-1">
              {results.map((item, index) => {
                const isSelected = selectedIndex === index;
                const IconComponent =
                  item.category === 'customers'
                    ? User
                    : item.category === 'leads'
                    ? Magnet
                    : Calendar;

                return (
                  <button
                    key={item.category + item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all outline-none border border-transparent ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ${
                          isSelected
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-extrabold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.title}
                          </p>
                          {item.badge && (
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-semibold mt-0.5 truncate ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Quick navigation indicator */}
                    <div className="flex items-center shrink-0 pl-2">
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 bg-indigo-100/60 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-1 rounded-md">
                          <span>Chọn</span>
                          <CornerDownLeft size={10} className="stroke-[3]" />
                        </div>
                      ) : (
                        <ArrowRight size={14} className="text-slate-300 hover:text-slate-500 transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search footer guidance */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 select-none">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="bg-white dark:bg-slate-800 shadow-xs border border-slate-250/20 px-1 rounded-md select-none">↑↓</span>
              Di chuyển
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-white dark:bg-slate-800 shadow-xs border border-slate-250/20 px-1 rounded-md select-none">Enter</span>
              Truy cập
            </span>
          </div>
          <div>
            <span>Nhấn Esc để đóng</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
