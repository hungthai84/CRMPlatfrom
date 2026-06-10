import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';
import { Search, Plus, Filter, User, Download } from 'lucide-react';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { generateDemoCustomers } from '../lib/generateDemoData';

interface CustomersProps {
  onSelect: (id: string) => void;
}

export function Customers({ onSelect }: CustomersProps) {
  const { user, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const triggerSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await generateDemoCustomers(user.uid);
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    const q = isAdmin 
      ? collection(db, 'customers') 
      : query(collection(db, 'customers'), where('ownerId', '==', user.uid));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'customers');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, isAdmin]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleExportCsv = () => {
    if (filteredCustomers.length === 0) return;
    
    const headers = ['Tên', 'Email', 'Số điện thoại', 'Loại', 'Trạng thái', 'Giá trị trọn đời (LTV)'];
    
    const rows = filteredCustomers.map(c => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.type || 'Tiềm năng',
      c.status || 'Hoạt động',
      c.lifetimeValue?.toString() || '0'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to highlight query matches in table cells
  const highlightText = (text: string | undefined | null, search: string) => {
    if (!text) return <span className="text-gray-400">—</span>;
    if (!search || !search.trim()) return <span>{text}</span>;
    
    const index = text.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return <span>{text}</span>;
    
    const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 font-extrabold px-1.5 py-0.5 rounded shadow-xs">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative p-6 md:p-8 no-scrollbar">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh sách Khách hàng</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-semibold">Quản lý và theo dõi thông tin khách hàng.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#2F69FF] shadow-md shadow-[#2F69FF]/20 text-white px-5 py-2.5 rounded-[10px] font-bold text-sm hover:bg-[#1a55eb] transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Thêm khách hàng mới
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Tìm kiếm khách hàng theo tên, email, SDT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-[10px] text-sm outline-none focus:border-[#2F69FF] focus:ring-2 focus:ring-blue-100 transition-all font-medium" 
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCsv}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 border border-gray-300 bg-white px-4 py-2 rounded-[10px] shadow-sm hover:bg-gray-50 transition-all"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
          <button className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 border border-gray-300 bg-white px-4 py-2 rounded-[10px] shadow-sm hover:bg-gray-50 transition-all">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-[10px] border border-gray-200 bg-white shadow-sm no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F69FF]"></div>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Liên hệ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map(customer => (
                <tr 
                  key={customer.id} 
                  onClick={() => onSelect(customer.id!)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {customer.avatar ? (
                        <img src={customer.avatar} alt="" className="w-10 h-10 rounded-[10px] border border-gray-200 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-[10px] bg-blue-100 text-[#2F69FF] flex items-center justify-center font-bold">
                          {customer.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-[#2F69FF] transition-colors">
                          {highlightText(customer.name, searchTerm)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 font-medium">
                      {customer.email ? highlightText(customer.email, searchTerm) : <span className="text-gray-400">—</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      {customer.phone ? highlightText(customer.phone, searchTerm) : <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {customer.status || 'Hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">
                      {customer.type || 'Tiềm năng'}
                    </span>
                    {customer.tags && customer.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {customer.tags.map(tag => (
                           <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                             {highlightText(tag, searchTerm)}
                           </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy khách hàng</h3>
            <p className="text-gray-500 mb-4">Chưa có khách hàng nào trong hệ thống hoặc không khớp với tìm kiếm.</p>
            {customers.length === 0 && (
              <button 
                onClick={triggerSeed}
                disabled={seeding}
                className="bg-[#2F69FF] shadow-md shadow-[#2F69FF]/20 hover:bg-[#1a55eb] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {seeding ? 'Đang khởi tạo...' : 'Khởi tạo dữ liệu mẫu CRM'}
              </button>
            )}
          </div>
        )}
      </div>
      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
