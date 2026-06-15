import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, getDocs, writeBatch, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Notification as CRMNotification } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

export function NotificationCenter({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { user } = useAuth();
  const { simulateCRMEvent } = useToast();
  const [notifications, setNotifications] = useState<CRMNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CRMNotification[];
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Automatic Upcoming Reminders Scanner (Tasks & Customer Follow-ups)
  useEffect(() => {
    if (!user) return;

    const performUpcomingScan = async () => {
      try {
        const storedNotified = localStorage.getItem('crm_notified_deadlines');
        const notifiedSet = new Set<string>(storedNotified ? JSON.parse(storedNotified) : []);
        const newlyNotified: string[] = [];

        // 1. Scan Customer Follow-ups from Firestore
        const custQuery = query(collection(db, 'customers'), where('ownerId', '==', user.uid));
        const custSnap = await getDocs(custQuery);
        const oneDayMs = 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Use standard and secure Firestore writes
        const notificationsRef = collection(db, 'notifications');

        for (const customerDoc of custSnap.docs) {
          const cust = customerDoc.data();
          if (cust.nextFollowUpDate) {
            const followTime = new Date(cust.nextFollowUpDate).getTime();
            const diff = followTime - now;
            // Notify if follow-up is within 24 hours
            if (diff > 0 && diff <= oneDayMs) {
              const notifyKey = `followup-${customerDoc.id}-${cust.nextFollowUpDate}`;
              if (!notifiedSet.has(notifyKey)) {
                // Add real persistent notification to database
                await addDoc(notificationsRef, {
                  userId: user.uid,
                  title: '📅 Lịch hẹn Chăm sóc Sắp đến hạn',
                  message: `Hẹn gặp/chăm sóc khách hàng ${cust.name} sắp diễn ra vào ngày ${cust.nextFollowUpDate.replace('T', ' ')}. ${cust.followUpNotes ? `Chi tiết: ${cust.followUpNotes}` : ''}`,
                  type: 'warning',
                  category: 'crm',
                  read: false,
                  createdAt: Date.now()
                });
                notifiedSet.add(notifyKey);
                newlyNotified.push(notifyKey);
              }
            }
          }
        }

        // 2. Scan Kanban Tasks from LocalStorage
        const savedTasks = localStorage.getItem('crm_kanban_tasks');
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          for (const task of tasks) {
            if (task.status !== 'Completed' && task.dueDate) {
              const taskTime = new Date(task.dueDate).getTime();
              const diff = taskTime - now;
              // Notify if task is within 24 hours
              if (diff > -oneDayMs && diff <= oneDayMs) {
                const notifyKey = `task-${task.id}-${task.dueDate}`;
                if (!notifiedSet.has(notifyKey)) {
                  // Add real persistent notification to database
                  await addDoc(notificationsRef, {
                    userId: user.uid,
                    title: '⏳ Nhiệm vụ Sắp đến hạn chót',
                    message: `Thẻ công việc "${task.title}"${task.customerName ? ` liên kết với KH ${task.customerName}` : ''} có hạn chót ngày ${task.dueDate}.`,
                    type: 'warning',
                    category: 'task',
                    read: false,
                    createdAt: Date.now()
                  });
                  notifiedSet.add(notifyKey);
                  newlyNotified.push(notifyKey);
                }
              }
            }
          }
        }

        // Persist notified identifiers
        if (newlyNotified.length > 0) {
          localStorage.setItem('crm_notified_deadlines', JSON.stringify(Array.from(notifiedSet)));
        }
      } catch (err) {
        console.warn('Upcoming reminder scanner failed:', err);
      }
    };

    // Run scanner immediately on load, and then every 45 seconds
    performUpcomingScan();
    const interval = setInterval(performUpcomingScan, 45000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const batch = writeBatch(db);
      unreadNotifications.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
      case 'error': return <AlertCircle className="text-rose-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center py-2 rounded-xl hover:bg-slate-200/50 transition-colors dark:hover:bg-slate-800/50 group",
          isCollapsed ? "justify-center relative" : "justify-between px-3"
        )}
      >
        <div className="flex items-center gap-2">
          <Bell size={isCollapsed ? 18 : 16} className="text-slate-400 group-hover:text-[#3370FF] transition-colors" />
          {!isCollapsed && <span className="text-xs font-semibold text-slate-500 group-hover:text-[#3370FF]">Thông báo</span>}
        </div>
        {!isCollapsed && unreadCount > 0 && (
          <span className="w-5 h-5 bg-[#FF4560] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shrink-0">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {isCollapsed && unreadCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-[#FF4560] rounded-full border-2 border-white dark:border-slate-900"></span>
        )}
      </button>

      {/* Backdrop for explicit click-outside fallback if needed when collapsed */}
      {isCollapsed && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default" 
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isCollapsed ? { opacity: 0, scale: 0.95 } : { opacity: 0, height: 0 }}
            animate={isCollapsed ? { opacity: 1, scale: 1 } : { opacity: 1, height: 'auto' }}
            exit={isCollapsed ? { opacity: 0, scale: 0.95 } : { opacity: 0, height: 0 }}
            className={cn(
              "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden",
              isCollapsed ? "absolute left-full bottom-0 ml-3 shadow-xl w-80 z-50 origin-bottom-left" : "mt-2 w-full z-50"
            )}
          >
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 tracking-wider dark:text-slate-400">Thông báo</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    Đã xem hết
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="text-slate-300" size={24} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">Của bạn hiện không có thông báo nào.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors relative group ${notification.read ? 'bg-transparent' : 'bg-indigo-50/30 dark:bg-indigo-900/10 border-l-2 border-indigo-600'}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold text-slate-900 dark:text-white mb-0.5 ${notification.read ? '' : 'font-extrabold'}`}>
                            {notification.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock size={10} className="text-slate-400" />
                            <span className="text-[10px] text-slate-400 font-semibold tracking-tight">
                              {new Date(notification.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-emerald-600 shadow-sm transition-all"
                            title="Đánh dấu đã xem"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-rose-600 shadow-sm transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
                <button className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all tracking-widest">
                  Xem toàn bộ lịch sử
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
