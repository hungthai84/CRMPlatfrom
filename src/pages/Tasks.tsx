import { useEffect, useState } from 'react';
import { getAccessToken } from '../lib/firebase';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  htmlLink: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export function Tasks() {
  const { login } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

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
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e) {
      alert("Lỗi khi xóa sự kiện.");
    }
  };

  if (showConfig) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="max-w-md text-center">
          <CalendarIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Đồng bộ Google Calendar</h2>
          <p className="text-slate-600 mb-6">Liên kết lịch hẹn của hệ thống CRM tự động đồng bộ vào Google Calendar của bạn bằng cách cấp quyền truy cập lịch.</p>
          <div className="flex flex-col gap-3 justify-center">
            <button 
              onClick={handleAuthorize}
              disabled={authorizing}
              className="px-6 py-3 bg-[#2F69FF] text-white font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
            >
              {authorizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : 'Kết nối Google Calendar'}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Hủy hoặc Tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full bg-slate-50 flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Công việc & Lịch hẹn</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-semibold">Đồng bộ tự động với Google Calendar của bạn.</p>
        </div>
        <a 
          href="https://calendar.google.com" target="_blank" rel="noreferrer"
          className="bg-white border border-slate-200 shadow-sm text-slate-700 px-5 py-2.5 rounded-[10px] font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Thêm sự kiện mới (Google)
        </a>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
            <p className="font-medium text-slate-800 text-lg">Không có sự kiện sắp tới</p>
            <p className="text-sm mt-1">Lịch trình của bạn đang trống.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const startDate = event.start.dateTime ? parseISO(event.start.dateTime) : (event.start.date ? new Date(event.start.date) : new Date());
              return (
                <div key={event.id} className="p-5 border border-slate-100 rounded-[12px] flex justify-between items-center hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50/50">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-white rounded-[10px] flex flex-col items-center justify-center border border-slate-200 shadow-sm shrink-0">
                      <span className="text-[10px] font-bold text-red-500 uppercase">{format(startDate, 'MMM')}</span>
                      <span className="text-lg font-black text-slate-800 leading-tight">{format(startDate, 'dd')}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-[#2F69FF] transition-colors">{event.summary || '(Không có tiêu đề)'}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-500">
                        {event.start.dateTime ? (
                          <div className="flex items-center gap-1 bg-slate-200/50 px-2.5 py-1 rounded-md">
                            <Clock size={12} />
                            {format(parseISO(event.start.dateTime), 'HH:mm')} - {event.end.dateTime ? format(parseISO(event.end.dateTime), 'HH:mm') : ''}
                          </div>
                        ) : 'Cả ngày'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={event.htmlLink} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent rounded-lg">
                      <ExternalLink size={16} />
                    </a>
                    <button onClick={() => handleDelete(event.id, event.summary)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
