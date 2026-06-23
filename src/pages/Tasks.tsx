import { useEffect, useState } from 'react';
import { getAccessToken, db } from '../lib/firebase';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ExternalLink, Trello, Layers, CheckCircle2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  htmlLink: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Completed';
  assignee: { name: string; avatar: string };
  customerId?: string;
  customerName?: string;
}

const DEFAULT_KANBAN_TASKS: KanbanTask[] = [
  {
    id: 'K-101',
    title: 'Review proposal for Vingroup',
    description: 'Prepare detailed contract terms and SLA conditions for enterprise deployment.',
    dueDate: '2026-06-12',
    priority: 'High',
    status: 'To Do',
    assignee: { name: 'Mạnh Hùng', avatar: 'https://ui-avatars.com/api/?name=Manh+Hung&background=random' }
  },
  {
    id: 'K-102',
    title: 'Customer Onboarding Kickoff',
    description: 'Introductory training session for Techcombank customer success teams.',
    dueDate: '2026-06-14',
    priority: 'Medium',
    status: 'In Progress',
    assignee: { name: 'Hồng Thái', avatar: 'https://ui-avatars.com/api/?name=Hong+Thai&background=random' }
  },
  {
    id: 'K-103',
    title: 'Setup Firebase Auth triggers',
    description: 'Configure account creation limits and auditLogger automatic sync scripts.',
    dueDate: '2026-06-09',
    priority: 'High',
    status: 'Completed',
    assignee: { name: 'Trấn Thành', avatar: 'https://ui-avatars.com/api/?name=Tran+Thanh&background=random' }
  },
  {
    id: 'K-104',
    title: 'Finalize quarterly survey results',
    description: 'Generate report of NPS & CSAT trends across all standard marketing pipelines.',
    dueDate: '2026-06-18',
    priority: 'Low',
    status: 'To Do',
    assignee: { name: 'Lê Hồng', avatar: 'https://ui-avatars.com/api/?name=Le+Hong&background=random' }
  }
];

export function Tasks() {
  const { login, user } = useAuth();
  const [activeView, setActiveView] = useState<'kanban' | 'calendar'>('kanban');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  // Customers for optional link task
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [newTaskSelectedCustomerId, setNewTaskSelectedCustomerId] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, 'customers'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setCustomers(list);
      } catch (err) {
        console.error("Error fetching customers for task referencing:", err);
      }
    };
    fetchCustomers();
  }, [user]);

  // Kanban states
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(() => {
    const saved = localStorage.getItem('crm_kanban_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_KANBAN_TASKS;
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-06-15');

  useEffect(() => {
    localStorage.setItem('crm_kanban_tasks', JSON.stringify(kanbanTasks));
  }, [kanbanTasks]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setShowConfig(true);
        setLoading(false);
        return;
      }

      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString() + '&maxResults=20&singleEvents=true&orderBy=startTime',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const data = await res.json();
      
      if (res.status === 401 || (data.error && data.error.code === 401)) {
        localStorage.removeItem('google_access_token');
        sessionStorage.removeItem('google_access_token');
        setShowConfig(true);
        setLoading(false);
        return;
      }
      
      if (data.error) throw new Error(data.error.message || 'Lỗi API Calendar');
      
      setEvents(data.items || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Không thể lấy dữ liệu sự kiện từ Google Calendar.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    setAuthorizing(true);
    try {
      await login(true, true); // Call Google login requesting integration scopes
      setShowConfig(false);
      setTimeout(() => {
        fetchEvents();
      }, 500);
    } catch (e: any) {
      console.error(e);
      alert('Không thể kết nối tài khoản hoặc cấp quyền Google API: ' + (e.message || e));
    } finally {
      setAuthorizing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (eventId: string, summary: string) => {
    const confirmDelete = window.confirm(`Bạn có chắc muốn xóa lịch hẹn "${summary}"?`);
    if (!confirmDelete) return;

    try {
      const token = await getAccessToken();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        alert("Phiên đăng nhập hết hạn. Vui lòng tải lại trang và kết nối lại Google API.");
        localStorage.removeItem('google_access_token');
        sessionStorage.removeItem('google_access_token');
        setShowConfig(true);
        return;
      }
      
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e) {
      alert("Lỗi khi xóa sự kiện.");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: KanbanTask['status']) => {
    const id = e.dataTransfer.getData('text/plain');
    setKanbanTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const handleCreateKanbanTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const selectedCustomer = customers.find(c => c.id === newTaskSelectedCustomerId);

    const newTask: KanbanTask = {
      id: `K-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || 'Chưa có mô tả cụ thể.',
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: 'To Do',
      assignee: {
        name: 'Hùng Thái (Tôi)',
        avatar: 'https://ui-avatars.com/api/?name=Hung+Thai&background=random'
      },
      customerId: newTaskSelectedCustomerId || undefined,
      customerName: selectedCustomer ? selectedCustomer.name : undefined
    };

    setKanbanTasks([newTask, ...kanbanTasks]);
    setIsAddModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority('Medium');
    setNewTaskSelectedCustomerId('');
  };

  const deleteKanbanTask = (id: string) => {
    if (confirm('Bạn muốn xóa thẻ công việc này?')) {
      setKanbanTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  // Custom coloring for Priority Badge
  const getPriorityStyle = (priority: KanbanTask['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="p-4 lg:p-6 h-full bg-slate-50 dark:bg-slate-900/40 flex flex-col font-sans overflow-y-auto no-scrollbar w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">Công việc & Nhiệm vụ</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-bold">
            Kiểm soát dự án CRM bằng bảng Kanban rực rỡ và liên kết Google Calendar tự động.
          </p>
        </div>

        {/* Custom Tab Toggles for Kanban vs Calendar */}
        <div className="flex bg-[#e4e7ec] dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200 dark:border-slate-800/80">
          <button
            onClick={() => setActiveView('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeView === 'kanban'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trello size={14} className="stroke-[2.5]" />
            CRM Kanban Board
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeView === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CalendarIcon size={14} className="stroke-[2.5]" />
            Google Calendar
          </button>
        </div>
      </div>

      {activeView === 'kanban' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Kanban upper tool lane */}
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Layers className="text-[#2F69FF] w-4.5 h-4.5" />
              Bảng kiểm soát Kanban
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} className="stroke-[3]" /> Thêm nhiệm vụ
            </button>
          </div>

          {/* Three-stage Kanban grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 min-h-0 overflow-y-auto no-scrollbar pb-4">
            {/* COLUMN 1: TO DO */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'To Do')}
              className="bg-slate-100/70 dark:bg-slate-900/30 border border-slate-250/30 dark:border-slate-800 rounded-2xl p-4 flex flex-col min-h-[300px] md:h-full overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Cần làm</span>
                </div>
                <span className="text-[10px] font-black bg-slate-250 dark:bg-slate-850 dark:text-slate-400 text-slate-500 px-2.5 py-0.5 rounded-full">
                  {kanbanTasks.filter((t) => t.status === 'To Do').length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 no-scrollbar pr-0.5">
                {kanbanTasks
                  .filter((t) => t.status === 'To Do')
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing relative group/kanban-card"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => deleteKanbanTask(task.id)}
                          className="opacity-0 group-hover/kanban-card:opacity-100 p-1 text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all absolute top-2 right-2"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {task.customerName && (
                        <div className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-violet-650 bg-violet-100/70 border border-violet-200 text-violet-700 dark:bg-violet-955/30 dark:border-violet-900 rounded px-1.5 py-0.5 w-fit">
                          KH: {task.customerName}
                        </div>
                      )}
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug mt-2.5 pr-4">
                        {task.title}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-relaxed mt-1.5 border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                        {task.description}
                      </p>
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> {task.dueDate}
                        </span>
                        <img
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          className="w-5.5 h-5.5 rounded-full border border-white dark:border-slate-900"
                          title={task.assignee.name}
                        />
                      </div>
                    </div>
                  ))}
                {kanbanTasks.filter((t) => t.status === 'To Do').length === 0 && (
                  <div className="py-12 text-center text-[11px] font-bold text-slate-400/80">Kéo thả nhiệm vụ vào đây</div>
                )}
              </div>
            </div>

            {/* COLUMN 2: IN PROGRESS */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'In Progress')}
              className="bg-slate-100/70 dark:bg-slate-900/30 border border-slate-205/50 dark:border-slate-800 rounded-2xl p-4 flex flex-col min-h-[300px] md:h-full overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Đang xử lý</span>
                </div>
                <span className="text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                  {kanbanTasks.filter((t) => t.status === 'In Progress').length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 no-scrollbar pr-0.5">
                {kanbanTasks
                  .filter((t) => t.status === 'In Progress')
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing relative group/kanban-card"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => deleteKanbanTask(task.id)}
                          className="opacity-0 group-hover/kanban-card:opacity-100 p-1 text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all absolute top-2 right-2"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {task.customerName && (
                        <div className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-violet-650 bg-violet-100/70 border border-violet-200 text-violet-700 dark:bg-violet-955/30 dark:border-violet-900 rounded px-1.5 py-0.5 w-fit">
                          KH: {task.customerName}
                        </div>
                      )}
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug mt-2.5 pr-4">
                        {task.title}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-relaxed mt-1.5 border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                        {task.description}
                      </p>
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> {task.dueDate}
                        </span>
                        <img
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          className="w-5.5 h-5.5 rounded-full border border-white dark:border-slate-900"
                          title={task.assignee.name}
                        />
                      </div>
                    </div>
                  ))}
                {kanbanTasks.filter((t) => t.status === 'In Progress').length === 0 && (
                  <div className="py-12 text-center text-[11px] font-bold text-slate-400/80">Kéo thả nhiệm vụ vào đây</div>
                )}
              </div>
            </div>

            {/* COLUMN 3: COMPLETED */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'Completed')}
              className="bg-slate-100/70 dark:bg-slate-900/30 border border-slate-205/50 dark:border-slate-800 rounded-2xl p-4 flex flex-col min-h-[300px] md:h-full overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Đã hoàn thành</span>
                </div>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                  {kanbanTasks.filter((t) => t.status === 'Completed').length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 no-scrollbar pr-0.5">
                {kanbanTasks
                  .filter((t) => t.status === 'Completed')
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing relative group/kanban-card"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => deleteKanbanTask(task.id)}
                          className="opacity-0 group-hover/kanban-card:opacity-100 p-1 text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all absolute top-2 right-2"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {task.customerName && (
                        <div className="mt-2.5 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 w-fit border border-slate-200 dark:border-slate-700">
                          KH: {task.customerName}
                        </div>
                      )}
                      <h4 className="text-xs font-extrabold text-slate-500 line-through dark:text-slate-400 leading-snug mt-2.5 pr-4">
                        {task.title}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 line-through dark:text-slate-500 leading-relaxed mt-1.5 border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                        {task.description}
                      </p>
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-500" /> Hoàn thành
                        </span>
                        <img
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          className="w-5.5 h-5.5 rounded-full border border-white dark:border-slate-900"
                          title={task.assignee.name}
                        />
                      </div>
                    </div>
                  ))}
                {kanbanTasks.filter((t) => t.status === 'Completed').length === 0 && (
                  <div className="py-12 text-center text-[11px] font-bold text-slate-400/80">Kéo thả nhiệm vụ vào đây</div>
                )}
              </div>
            </div>
          </div>

          {/* New Kanban task creator dialog */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                onClick={() => setIsAddModalOpen(false)}
              />

              <div
                className="relative bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scaleUp"
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
                    Tạo công việc mới
                  </h3>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateKanbanTask} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tên công việc *</label>
                    <input
                      required
                      type="text"
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="vd: Gọi điện thoại báo giá..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Mô tả công việc</label>
                    <textarea
                      rows={3}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Mô tả cụ thể các hạng mục công việc cần làm..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Độ ưu tiên</label>
                      <select
                        className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                        value={newTaskPriority}
                        onChange={(e: any) => setNewTaskPriority(e.target.value)}
                      >
                        <option value="Low">Low (Thấp)</option>
                        <option value="Medium">Medium (Trung bình)</option>
                        <option value="High">High (Cao)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Hạn chót</label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Liên kết Khách hàng (Lựa chọn)</label>
                    <select
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                      value={newTaskSelectedCustomerId}
                      onChange={(e) => setNewTaskSelectedCustomerId(e.target.value)}
                    >
                      <option value="">-- Không liên kết --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Huỷ
                    </button>
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim()}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Tạo thẻ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Standard Google Calendar Events View (Original implementation preserved)
        <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm font-medium">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-slate-500">
              <CalendarIcon size={40} className="mb-4 opacity-50" />
              <p className="font-medium text-slate-800 dark:text-slate-200 text-lg">Không có sự kiện sắp tới</p>
              <p className="text-sm mt-1">Lịch trình google của bạn đang trống.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const startDate = event.start.dateTime
                  ? parseISO(event.start.dateTime)
                  : event.start.date
                  ? new Date(event.start.date)
                  : new Date();
                return (
                  <div
                    key={event.id}
                    className="p-5 border border-slate-100 dark:border-slate-800 rounded-[12px] flex justify-between items-center hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50/50 dark:bg-slate-950/20"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-[10px] flex flex-col items-center justify-center border border-slate-200 dark:border-slate-850 shadow-sm shrink-0">
                        <span className="text-[10px] font-bold text-red-500 uppercase">{format(startDate, 'MMM')}</span>
                        <span className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                          {format(startDate, 'dd')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#2F69FF] transition-colors">
                          {event.summary || '(Không có tiêu đề)'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-500">
                          {event.start.dateTime ? (
                            <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-md">
                              <Clock size={12} />
                              {format(parseISO(event.start.dateTime), 'HH:mm')} -{' '}
                              {event.end.dateTime ? format(parseISO(event.end.dateTime), 'HH:mm') : ''}
                            </div>
                          ) : (
                            'Cả ngày'
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-850 rounded-lg"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button
                        onClick={() => handleDelete(event.id, event.summary)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
