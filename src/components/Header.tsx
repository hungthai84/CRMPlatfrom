import { Bell, Search, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  
  return (
    <header className="h-16 bg-transparent flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 flex justify-start">
        <div className="relative w-[28rem]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm toàn cầu (Hỗ trợ AI)..."
            className="block w-full pl-10 pr-3 py-2 border border-white/50 rounded-xl leading-5 bg-white/40 backdrop-blur-md placeholder-slate-500 text-slate-900 font-medium focus:outline-none focus:bg-white/70 focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all shadow-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 mr-3 px-3 py-1.5 bg-white/40 border border-white/50 rounded-xl backdrop-blur-md">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-bold text-slate-700">{user.displayName || user.email?.split('@')[0]}</span>
          </div>
        )}
        <button className="p-2.5 text-slate-600 hover:text-blue-600 bg-white/40 hover:bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white/80"></span>
        </button>
        <button className="p-2.5 text-slate-600 hover:text-blue-600 bg-white/40 hover:bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-xl transition-all">
          <Settings size={20} />
        </button>
        <button onClick={logout} className="p-2.5 text-rose-500 hover:text-rose-600 hover:bg-white/90 bg-white/60 backdrop-blur-md border border-white/60 shadow-sm rounded-xl transition-all ml-2" title="Log out">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
