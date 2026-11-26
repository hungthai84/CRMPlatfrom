import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'info' | 'success' | 'warning' | 'error';
}

interface ToastContextType {
  addToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  isOffline: boolean;
}

const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
  isOffline: false,
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (title: string, description?: string, variant: ToastMessage['variant'] = 'info') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { id, title, description, variant }]);
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false);
      addToast('Đã khôi phục kết nối', 'Dữ liệu đang đồng bộ trở lại với Cloud Firestore.', 'success');
    };
    const onOffline = () => {
      setIsOffline(true);
      addToast('Mất kết nối mạng', 'Ứng dụng đang chạy ở chế độ bộ nhớ đệm cục bộ.', 'warning');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [addToast]);

  const iconFor = (variant: ToastMessage['variant']) => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-[#1951fc] dark:text-[#22c7e8] shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, isOffline }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto glass-card rounded-xl p-3.5 flex items-start gap-3 shadow-lg border border-slate-200/80 dark:border-slate-700/80"
          >
            {iconFor(t.variant)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
