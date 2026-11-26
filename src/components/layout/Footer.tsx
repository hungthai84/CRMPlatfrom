import React from 'react';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';

export const Footer: React.FC<{ onOpenHelp: () => void }> = ({ onOpenHelp }) => {
  const { lastSyncedAt, hasDemoData } = useCRM();
  const { isOffline } = useToast();

  return (
    <footer className="h-9 px-4 border-t border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0b1730]/90 flex items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
      <div className="flex items-center gap-2 truncate">
        <span className="font-semibold text-slate-700 dark:text-slate-300">ONECRM Enterprise</span>
        <span aria-hidden="true">·</span>
        <span>{isOffline ? 'Ngoại tuyến (Local Cache)' : 'Đã kết nối Cloud Firestore'}</span>
        {hasDemoData && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Chế độ Dữ liệu Mẫu (Demo)</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 tabular-nums">
        <span className="hidden sm:inline">
          Đồng bộ lúc {new Date(lastSyncedAt).toLocaleTimeString('vi-VN')}
        </span>
        <button onClick={onOpenHelp} className="hover:text-[#1951fc] dark:hover:text-[#22c7e8] cursor-pointer">
          Hướng dẫn sử dụng
        </button>
      </div>
    </footer>
  );
};
