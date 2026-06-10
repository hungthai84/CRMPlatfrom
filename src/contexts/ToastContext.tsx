import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: 'crm' | 'ticket' | 'task' | 'system';
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (title: string, message: string, type?: ToastItem['type'], category?: ToastItem['category']) => void;
  removeToast: (id: string) => void;
  simulateCRMEvent: (eventType?: 'lead' | 'deadline' | 'ticket' | 'deal') => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    title: string,
    message: string,
    type: ToastItem['type'] = 'info',
    category?: ToastItem['category']
  ) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastItem = { id, title, message, type, category };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to trigger realistic simulated CRM events for live demos
  const simulateCRMEvent = (eventType?: 'lead' | 'deadline' | 'ticket' | 'deal') => {
    const types: ('lead' | 'deadline' | 'ticket' | 'deal')[] = ['lead', 'deadline', 'ticket', 'deal'];
    const chosenType = eventType || types[Math.floor(Math.random() * types.length)];

    switch (chosenType) {
      case 'lead':
         addToast(
           'Lead mới được giao',
           'Lead "Nguyễn Minh Khôi" vừa được bàn giao từ Phễu Facebook Ads sang cho bạn.',
           'success',
           'crm'
         );
         break;
      case 'deadline':
         addToast(
           'Hạn chót công việc sắp tới',
           'Hợp đồng với "Techcom Corp" sẽ hết hạn ký kết trong vòng 2 giờ tới!',
           'warning',
           'task'
         );
         break;
      case 'ticket':
         addToast(
           'Yêu cầu hỗ trợ khẩn cấp',
           'Khách hàng báo cáo lỗi nghiêm trọng về đồng bộ hóa cổng thanh toán (Hóa đơn #1209).',
           'error',
           'ticket'
         );
         break;
      case 'deal':
         addToast(
           'Tiến trình cơ hội (Deal)',
           'Cơ hội "Nâng cấp Server ABC" đã đàm phán thành công và chuyển sang trạng thái Thắng!',
           'info',
           'crm'
         );
         break;
    }
  };

  // Listen to incoming notifications in Firestore to display them as real-time toast popups
  useEffect(() => {
    if (!user) return;

    // We only want to trigger toast popups for notifications created AFTER the app initialized
    const subscriptionStartTime = Date.now();

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Check doc Changes to watch for newly added notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const createdAt = data.createdAt || 0;
          
          // Only show popup alert if it is brand new (created after subscription started)
          if (createdAt >= subscriptionStartTime - 2000) {
            addToast(
              data.title || 'Thông báo CRM',
              data.message || '',
              data.type || 'info',
              data.category || 'system'
            );
          }
        }
      });
    }, (err) => {
      console.warn('Silent fallback: Toast Listener bypass due to permissions or index build.', err);
    });

    return () => unsubscribe();
  }, [user]);

  // Periodic simulated CRM alerts (every 60 seconds) to demonstrate the active system
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      // 15% chance to push a random CRM toast notification on background ticks
      if (Math.random() < 0.25) {
        simulateCRMEvent();
      }
    }, 45000);

    return () => clearInterval(timer);
  }, [user]);

  // Assist rendering icons corresponding to toast types
  const getIcon = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-emerald-500 w-5 h-5 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />;
      case 'error':
        return <AlertCircle className="text-rose-500 w-5 h-5 shrink-0" />;
      default:
        return <Info className="text-blue-500 w-5 h-5 shrink-0" />;
    }
  };

  // Determine border and background styles based on toast types
  const getStyles = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return 'bg-white dark:bg-slate-900 border-l-4 border-emerald-500 hover:border-emerald-600 shadow-md';
      case 'warning':
        return 'bg-white dark:bg-slate-900 border-l-4 border-amber-500 hover:border-amber-600 shadow-md';
      case 'error':
        return 'bg-white dark:bg-slate-900 border-l-4 border-rose-500 hover:border-rose-600 shadow-md';
      default:
        return 'bg-white dark:bg-slate-900 border-l-4 border-blue-500 hover:border-blue-600 shadow-md';
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, simulateCRMEvent }}>
      {children}

      {/* Global Toast Container Portal */}
      <div 
        id="toast-notifications-portal" 
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className={`pointer-events-auto p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 backdrop-blur-md relative overflow-hidden group/toast font-sans ${getStyles(
                toast.type
              )}`}
            >
              {getIcon(toast.type)}
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {toast.title}
                </h4>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {toast.message}
                </p>
                {toast.category && (
                  <span className="inline-block mt-1.5 text-[8px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-1 py-0.5 tracking-wider">
                    {toast.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover/toast:opacity-100"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
