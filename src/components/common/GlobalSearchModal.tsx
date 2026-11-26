import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { ModuleKey } from '../../types/crm';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (module: ModuleKey, recordId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onClose, onNavigate }) => {
  const { customers, leads, deals, tickets, orders, contracts, employees, conversations } = useCRM();
  const [queryText, setQueryText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const results = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return [];

    const items: Array<{ id: string; type: string; module: ModuleKey; title: string; sub: string }> = [];

    if (categoryFilter === 'all' || categoryFilter === 'customers') {
      customers.forEach((c) => {
        if (`${c.code} ${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q)) {
          items.push({ id: c.id, type: 'Khách hàng', module: 'customers', title: `${c.code} · ${c.name}`, sub: `${c.phone} · ${c.email}` });
        }
      });
    }
    if (categoryFilter === 'all' || categoryFilter === 'leads') {
      leads.forEach((l) => {
        if (`${l.code} ${l.name} ${l.phone} ${l.email}`.toLowerCase().includes(q)) {
          items.push({ id: l.id, type: 'Lead', module: 'leads', title: `${l.code} · ${l.name}`, sub: `${l.status} · ${l.source}` });
        }
      });
    }
    if (categoryFilter === 'all' || categoryFilter === 'deals') {
      deals.forEach((d) => {
        if (`${d.code} ${d.title} ${d.customerName}`.toLowerCase().includes(q)) {
          items.push({ id: d.id, type: 'Cơ hội', module: 'sales', title: `${d.code} · ${d.title}`, sub: `${d.stage} · ${d.customerName}` });
        }
      });
    }
    if (categoryFilter === 'all' || categoryFilter === 'tickets') {
      tickets.forEach((t) => {
        if (`${t.code} ${t.title} ${t.customerName}`.toLowerCase().includes(q)) {
          items.push({ id: t.id, type: 'Ticket', module: 'service', title: `${t.code} · ${t.title}`, sub: `${t.status} · ${t.priority}` });
        }
      });
    }
    if (categoryFilter === 'all' || categoryFilter === 'orders') {
      orders.forEach((o) => {
        if (`${o.code} ${o.customerName}`.toLowerCase().includes(q)) {
          items.push({ id: o.id, type: 'Đơn hàng', module: 'products', title: `${o.code} · ${o.customerName}`, sub: o.orderDate });
        }
      });
      contracts.forEach((c) => {
        if (`${c.code} ${c.title} ${c.customerName}`.toLowerCase().includes(q)) {
          items.push({ id: c.id, type: 'Hợp đồng', module: 'products', title: `${c.code} · ${c.title}`, sub: c.customerName });
        }
      });
    }
    if (categoryFilter === 'all' || categoryFilter === 'employees') {
      employees.forEach((e) => {
        if (`${e.code} ${e.fullName} ${e.email}`.toLowerCase().includes(q)) {
          items.push({ id: e.id, type: 'Nhân viên', module: 'employees', title: `${e.code} · ${e.fullName}`, sub: e.position });
        }
      });
    }
    if (categoryFilter === 'all' || categoryFilter === 'conversations') {
      conversations.forEach((cv) => {
        if (`${cv.customerName} ${cv.lastMessage}`.toLowerCase().includes(q)) {
          items.push({ id: cv.id, type: 'Hội thoại', module: 'omnichannel', title: `${cv.customerName} (${cv.channel})`, sub: cv.lastMessage });
        }
      });
    }

    return items.slice(0, 25);
  }, [queryText, categoryFilter, customers, leads, deals, tickets, orders, contracts, employees, conversations]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-16 px-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0f2142] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Nhập mã, tên khách hàng, SĐT, email, mã Lead, Deal, Ticket, Hợp đồng..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 bg-slate-50/70 dark:bg-slate-900/40">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'customers', label: 'Khách hàng' },
            { id: 'leads', label: 'Lead' },
            { id: 'deals', label: 'Cơ hội' },
            { id: 'tickets', label: 'Ticket' },
            { id: 'orders', label: 'Đơn & HĐ' },
            { id: 'employees', label: 'Nhân viên' },
            { id: 'conversations', label: 'Hội thoại' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-[#1951fc] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {!queryText.trim() ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Nhập từ khóa để tìm kiếm xuyên suốt toàn bộ 18 phân hệ ONECRM.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Không tìm thấy kết quả phù hợp cho "{queryText}".
            </div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}_${r.id}`}
                onClick={() => {
                  onNavigate(r.module, r.id);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{r.sub}</p>
                </div>
                <span className="text-[11px] font-mono text-[#1951fc] dark:text-[#22c7e8] shrink-0">
                  {r.type}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
