import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Customer } from '../types';
import { 
  Search, 
  Plus, 
  Filter, 
  User, 
  Download, 
  SlidersHorizontal, 
  Eye, 
  EyeOff, 
  ArrowUpDown, 
  ChevronDown, 
  X,
  TrendingUp,
  Award,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { generateDemoCustomers } from '../lib/generateDemoData';

interface CustomersProps {
  onSelect: (id: string) => void;
}

export function Customers({ onSelect }: CustomersProps) {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Filter criteria states
  const [filterTier, setFilterTier] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterMinLtv, setFilterMinLtv] = useState<number>(0);

  // Saved filters state
  interface SavedFilter {
    id: string;
    name: string;
    tier: string;
    type: string;
    status: string;
    minLtv: number;
  }

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const saved = localStorage.getItem('crm_saved_customer_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'sf-1', name: '👑 Khách VIP Diamond', tier: 'Diamond', type: 'All', status: 'Hoạt động', minLtv: 100000000 },
      { id: 'sf-2', name: '📈 Hạng Gold Tiềm năng', tier: 'Gold', type: 'Tiềm năng', status: 'All', minLtv: 0 },
      { id: 'sf-3', name: '⚠️ Tạm ngưng hoạt động', tier: 'All', type: 'All', status: 'Tạm ngưng', minLtv: 0 }
    ];
  });

  const [newSavedFilterName, setNewSavedFilterName] = useState('');
  const [showSaveAsPresetInput, setShowSaveAsPresetInput] = useState(false);

  // Sync saved filters to LocalStorage
  useEffect(() => {
    localStorage.setItem('crm_saved_customer_filters', JSON.stringify(savedFilters));
  }, [savedFilters]);

  // Handle saving current filters as a custom preset
  const handleSaveCurrentFilters = () => {
    if (!newSavedFilterName.trim()) {
      addToast('Lỗi', 'Vui lòng nhập tên cho bộ lọc cần lưu.', 'error', 'crm');
      return;
    }

    const newPreset: SavedFilter = {
      id: `sf-${Date.now()}`,
      name: newSavedFilterName.trim(),
      tier: filterTier,
      type: filterType,
      status: filterStatus,
      minLtv: filterMinLtv
    };

    setSavedFilters(prev => [...prev, newPreset]);
    setNewSavedFilterName('');
    setShowSaveAsPresetInput(false);
    
    addToast(
      'Đã lưu bộ lọc',
      `Đã lưu bộ lọc "${newPreset.name}" thành công vào danh sách truy xuất nhanh.`,
      'success',
      'crm'
    );
  };

  const handleDeleteSavedFilter = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedFilters(prev => prev.filter(f => f.id !== id));
    addToast(
      'Đã xoá bộ lọc',
      `Đã xoá bộ lọc "${name}" khỏi danh mục lưu trữ.`,
      'warning',
      'crm'
    );
  };

  const handleApplySavedFilter = (preset: SavedFilter) => {
    setFilterTier(preset.tier);
    setFilterType(preset.type);
    setFilterStatus(preset.status);
    setFilterMinLtv(preset.minLtv);
    addToast(
      'Đã áp dụng bộ lọc',
      `Bộ lọc "${preset.name}" được áp dụng thành công.`,
      'info',
      'crm'
    );
  };

  const handleClearFilters = () => {
    setFilterTier('All');
    setFilterType('All');
    setFilterStatus('All');
    setFilterMinLtv(0);
    setSearchTerm('');
    addToast(
      'Đặt lại bộ lọc',
      'Đã chuyển tất cả tiêu chí lọc về trạng thái mặc định.',
      'info',
      'crm'
    );
  };

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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<string>('name_asc');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({
    customer: true,
    contact: true,
    tier: true,
    ltv: true,
    status: true,
    type: true,
  });

  const getTierStyle = (tier: string | undefined) => {
    const t = tier || 'Member';
    switch (t) {
      case 'Diamond':
        return 'bg-purple-50 text-purple-700 border border-purple-250 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
      case 'Platinum':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-250 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900';
      case 'Gold':
        return 'bg-amber-50 text-amber-700 border border-amber-250 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900';
      case 'Silver':
        return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-450 dark:border-gray-700';
    }
  };

  const formatLTV = (ltv: number | undefined) => {
    if (ltv === undefined || ltv === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ltv);
  };

  const handleBulkDeleteCustomers = async () => {
    if (selectedCustomerIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedCustomerIds.length} khách hàng đã chọn? Hành động này sẽ xoá vĩnh viễn dữ liệu khỏi hệ thống.`)) {
      try {
        const batch = writeBatch(db);
        selectedCustomerIds.forEach(id => {
          batch.delete(doc(db, 'customers', id));
        });
        await batch.commit();
        setSelectedCustomerIds([]);
        addToast(
          'Xóa thành công',
          `Đã xóa thành công ${selectedCustomerIds.length} hồ sơ khách hàng.`,
          'warning',
          'crm'
        );
      } catch (err) {
        console.error('Lỗi xóa khách hàng hàng loạt:', err);
        handleFirestoreError(err, OperationType.DELETE, 'customers');
      }
    }
  };

  const handleBulkUpdateCustomersStatus = async (status: string) => {
    if (selectedCustomerIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedCustomerIds.forEach(id => {
        batch.update(doc(db, 'customers', id), { status });
      });
      await batch.commit();
      setSelectedCustomerIds([]);
      addToast(
        'Cập nhật thành công',
        `Đã chuyển trạng thái của ${selectedCustomerIds.length} khách hàng đã chọn sang "${status}".`,
        'success',
        'crm'
      );
    } catch (err) {
      console.error('Lỗi cập nhật khách hàng hàng loạt:', err);
      handleFirestoreError(err, OperationType.UPDATE, 'customers');
    }
  };

  const handleBulkUpdateCustomersTier = async (tier: string) => {
    if (selectedCustomerIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedCustomerIds.forEach(id => {
        batch.update(doc(db, 'customers', id), { tier });
      });
      await batch.commit();
      setSelectedCustomerIds([]);
      addToast(
        'Cập nhật hạng thẻ thành công',
        `Đã chuyển hạng loyalty của ${selectedCustomerIds.length} khách hàng đã chọn sang "${tier}".`,
        'success',
        'crm'
      );
    } catch (err) {
      console.error('Lỗi cập nhật hạng thẻ hàng loạt:', err);
      handleFirestoreError(err, OperationType.UPDATE, 'customers');
    }
  };

  const handleBulkUpdateCustomersType = async (type: string) => {
    if (selectedCustomerIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedCustomerIds.forEach(id => {
        batch.update(doc(db, 'customers', id), { type });
      });
      await batch.commit();
      setSelectedCustomerIds([]);
      addToast(
        'Cập nhật phân loại thành công',
        `Đã chuyển nhóm phân loại của ${selectedCustomerIds.length} khách hàng đã chọn sang "${type}".`,
        'success',
        'crm'
      );
    } catch (err) {
      console.error('Lỗi cập nhật loại khách hàng hàng loạt:', err);
      handleFirestoreError(err, OperationType.UPDATE, 'customers');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = !searchTerm || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesTier = filterTier === 'All' || (c.tier || 'Member') === filterTier;
    const matchesType = filterType === 'All' || (c.type || 'Tiềm năng') === filterType;
    const matchesStatus = filterStatus === 'All' || (c.status || 'Hoạt động') === filterStatus;
    const matchesLtv = (c.lifetimeValue || 0) >= filterMinLtv;

    return matchesSearch && matchesTier && matchesType && matchesStatus && matchesLtv;
  });

  const sortedAndFilteredCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortCriteria) {
      case 'name_asc':
        return a.name.localeCompare(b.name, 'vi');
      case 'name_desc':
        return b.name.localeCompare(a.name, 'vi');
      case 'ltv_desc':
        return (b.lifetimeValue || 0) - (a.lifetimeValue || 0);
      case 'ltv_asc':
        return (a.lifetimeValue || 0) - (b.lifetimeValue || 0);
      case 'points_desc':
        return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
      case 'status_asc':
        return (a.status || '').localeCompare(b.status || '', 'vi');
      default:
        return 0;
    }
  });

  const handleExportCsv = () => {
    if (sortedAndFilteredCustomers.length === 0) return;
    
    const headers = ['Tên', 'Email', 'Số điện thoại', 'Hạng', 'Giá trị trọn đời (LTV)', 'Trạng thái', 'Loại'];
    
    const rows = sortedAndFilteredCustomers.map(c => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.tier || 'Member',
      c.lifetimeValue?.toString() || '0',
      c.status || 'Hoạt động',
      c.type || 'Tiềm năng'
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 relative p-4 lg:p-6 overflow-y-auto w-full no-scrollbar space-y-6">
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

      <div className="flex gap-4 mb-3">
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
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center gap-2 text-sm font-bold border rounded-[10px] shadow-sm px-4 py-2 transition-all ${
              isSettingsOpen 
                ? 'bg-blue-50 border-[#2F69FF] text-[#2F69FF] dark:bg-indigo-950/20 dark:border-indigo-800/80 dark:text-indigo-400' 
                : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-300 dark:hover:bg-slate-800/70'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-[#2F69FF] dark:text-indigo-400" /> Cài đặt hiển thị
          </button>
          <button 
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 border border-gray-300 bg-white px-4 py-2 rounded-[10px] shadow-sm hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-300 dark:hover:bg-slate-800/70 transition-all"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Persistent Filter Bar & Saved Presets */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-4">
        {/* Row 1: Saved Quick Retrieval Presets */}
        <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-slate-200 dark:border-slate-850 pb-3">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mr-2 shrink-0">
            <Filter size={12} className="text-blue-500" /> Bộ lọc nhanh đã lưu:
          </span>
          {savedFilters.map((preset) => {
            const isActive = filterTier === preset.tier && filterType === preset.type && filterStatus === preset.status && filterMinLtv === preset.minLtv;
            return (
              <div
                key={preset.id}
                onClick={() => handleApplySavedFilter(preset)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-350 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>{preset.name}</span>
                {/* Allow deleting custom non-default presets */}
                {!['sf-1', 'sf-2', 'sf-3'].includes(preset.id) && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSavedFilter(preset.id, preset.name, e)}
                    className={`p-0.5 rounded-md hover:bg-rose-500 hover:text-white transition-colors ${
                      isActive ? 'text-blue-200 hover:text-white' : 'text-slate-400'
                    }`}
                    title="Xoá bộ lọc này"
                  >
                    <X size={10} className="stroke-[3]" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Clear option if modified */}
          {(filterTier !== 'All' || filterType !== 'All' || filterStatus !== 'All' || filterMinLtv !== 0) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-wide border border-rose-200 dark:border-rose-900/60 rounded-xl bg-rose-50/50 dark:bg-transparent ml-auto"
            >
              ✕ Đặt lại tất cả lọc
            </button>
          )}
        </div>

        {/* Row 2: Selectable Multi-criteria Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Tier Selection */}
          <div>
            <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 block mb-1 font-bold">Hạng thẻ</span>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#2F69FF] transition-all cursor-pointer shadow-xs"
            >
              <option value="All">Tất cả hạng thẻ</option>
              <option value="Diamond">Diamond</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Member">Member</option>
            </select>
          </div>

          {/* Type Selection */}
          <div>
            <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 block mb-1 font-bold">Loại khách hàng</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#2F69FF] transition-all cursor-pointer shadow-xs"
            >
              <option value="All">Tất cả phân loại</option>
              <option value="Tiềm năng">Tiềm năng</option>
              <option value="Doanh nghiệp">Doanh nghiệp</option>
              <option value="VIP">VIP</option>
              <option value="Khách lẻ">Khách lẻ</option>
            </select>
          </div>

          {/* Status Selection */}
          <div>
            <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 block mb-1 font-bold">Trạng thái</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#2F69FF] transition-all cursor-pointer shadow-xs"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm ngưng">Tạm ngưng</option>
            </select>
          </div>

          {/* Minimum LTV input */}
          <div>
            <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 block mb-1 font-bold">LTV tối thiểu</span>
            <div className="relative">
              <input
                type="number"
                value={filterMinLtv === 0 ? '' : filterMinLtv}
                placeholder="Ví dụ: 50.000.000 đ"
                onChange={(e) => setFilterMinLtv(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-755 dark:text-slate-300 outline-none focus:border-[#2F69FF] transition-all shadow-xs"
              />
              {filterMinLtv > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMinLtv(0)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Save custom selection option */}
        <div className="flex items-center justify-between gap-4 mt-1 border-t border-slate-150 dark:border-slate-850 pt-3">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-450 font-semibold">
              Khai thác tìm thấy: <strong className="font-extrabold text-[#2F69FF]">{filteredCustomers.length}</strong> khách hàng trong cấu hình hiện tại.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!showSaveAsPresetInput ? (
              <button
                type="button"
                onClick={() => setShowSaveAsPresetInput(true)}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2F69FF] text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                💾 Lưu bộ lọc này làm mẫu tiện ích
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fadeIn bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-1 shadow-sm">
                <input
                  type="text"
                  placeholder="Ví dụ: Khách lớn Hà Nội..."
                  value={newSavedFilterName}
                  onChange={(e) => setNewSavedFilterName(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold focus:outline-none bg-transparent max-w-[200px]"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentFilters}
                  className="px-3 py-1.5 bg-blue-600 text-white font-extrabold text-[10px] uppercase rounded-lg shadow-sm hover:bg-blue-700 transition"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSaveAsPresetInput(false); setNewSavedFilterName(''); }}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase"
                >
                  Huỷ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-900/65 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-md animate-fadeIn text-slate-850 dark:text-slate-200 transition-all">
          <div className="flex justify-between items-center mb-4 border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#2F69FF]" />
              <span className="text-sm font-extrabold uppercase tracking-widest text-[#2F69FF]">Cấu hình danh sách khách hàng</span>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sorting Subsection */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                <ArrowUpDown size={12} className="text-slate-400" /> Sắp xếp dữ liệu theo tiêu chí
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'name_asc', label: 'Tên: A → Z' },
                  { value: 'name_desc', label: 'Tên: Z → A' },
                  { value: 'ltv_desc', label: 'LTV: Cao → Thấp' },
                  { value: 'ltv_asc', label: 'LTV: Thấp → Cao' },
                  { value: 'points_desc', label: 'Điểm: Cao → Thấp' },
                  { value: 'status_asc', label: 'Theo Trạng thái' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortCriteria(option.value)}
                    className={`text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      sortCriteria === option.value
                        ? 'bg-blue-50 border-[#2F69FF] text-[#2F69FF] dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Visibility Subsection */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                <Eye size={12} className="text-slate-400" /> Ẩn / Hiện các cột thông tin
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'customer', label: 'Khách hàng', disabled: true },
                  { key: 'contact', label: 'Liên hệ SĐT/Email' },
                  { key: 'tier', label: 'Hạng thẻ' },
                  { key: 'ltv', label: 'Giá trị LTV' },
                  { key: 'status', label: 'Trạng thái' },
                  { key: 'type', label: 'Loại & Nhãn' },
                ].map((col) => {
                  const isVisible = visibleColumns[col.key as keyof typeof visibleColumns];
                  return (
                    <button
                      key={col.key}
                      disabled={col.disabled}
                      onClick={() => setVisibleColumns(prev => ({
                        ...prev,
                        [col.key]: !isVisible
                      }))}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        col.disabled 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-950 dark:border-slate-900 dark:text-slate-600'
                          : isVisible
                            ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {col.disabled ? (
                        <Eye className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                      ) : isVisible ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-450 dark:text-slate-500 shrink-0" />
                      )}
                      <span>{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setSortCriteria('name_asc');
                setVisibleColumns({
                  customer: true,
                  contact: true,
                  tier: true,
                  ltv: true,
                  status: true,
                  type: true,
                });
              }}
              className="px-3.5 py-2 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-905 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={11} className="shrink-0" /> Thiết lập mặc định
            </button>
          </div>
        </div>
      )}

      {selectedCustomerIds.length > 0 && (
        <div className="mb-4 bg-blue-50/80 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
              Đã chọn <strong className="text-sm font-black text-blue-800 dark:text-blue-300">{selectedCustomerIds.length}</strong> khách hàng
            </span>
            <button 
              onClick={() => setSelectedCustomerIds([])}
              className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:hover:text-white underline uppercase ml-2 tracking-wider"
            >
              Huỷ chọn
            </button>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Đặt trạng thái:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdateCustomersStatus(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-semibold px-2 py-1 cursor-pointer text-slate-700 dark:text-slate-350 shadow-xs outline-none"
                defaultValue=""
              >
                <option value="" disabled>-- Chọn trạng thái --</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Tạm ngưng">Tạm ngưng</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Đặt hạng thẻ:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdateCustomersTier(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-semibold px-2 py-1 cursor-pointer text-slate-700 dark:text-slate-350 shadow-xs outline-none"
                defaultValue=""
              >
                <option value="" disabled>-- Chọn hạng loyalty --</option>
                <option value="Member">Member</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
                <option value="Diamond">Diamond</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Đặt phân loại:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdateCustomersType(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-semibold px-2 py-1 cursor-pointer text-slate-700 dark:text-slate-350 shadow-xs outline-none"
                defaultValue=""
              >
                <option value="" disabled>-- Chọn phân loại --</option>
                <option value="Tiềm năng">Tiềm năng</option>
                <option value="Doanh nghiệp">Doanh nghiệp</option>
                <option value="VIP">VIP</option>
                <option value="Khách lẻ">Khách lẻ</option>
              </select>
            </div>

            <button
              onClick={handleBulkDeleteCustomers}
              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/10 transition-all outline-none"
            >
              <Trash2 size={13} /> Xóa đã chọn
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-[10px] border border-gray-200 bg-white shadow-sm no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F69FF]"></div>
          </div>
        ) : sortedAndFilteredCustomers.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-4 w-12 text-center border-b border-gray-200">
                  <input 
                    type="checkbox" 
                    checked={sortedAndFilteredCustomers.length > 0 && selectedCustomerIds.length === sortedAndFilteredCustomers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomerIds(sortedAndFilteredCustomers.map(c => c.id!));
                      } else {
                        setSelectedCustomerIds([]);
                      }
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#2F69FF] focus:ring-0 cursor-pointer"
                  />
                </th>
                {visibleColumns.customer && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Khách hàng</th>
                )}
                {visibleColumns.contact && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Liên hệ</th>
                )}
                {visibleColumns.tier && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Hạng thẻ</th>
                )}
                {visibleColumns.ltv && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Giá trị LTV</th>
                )}
                {visibleColumns.status && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Trạng thái</th>
                )}
                {visibleColumns.type && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Loại</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedAndFilteredCustomers.map(customer => (
                <tr 
                  key={customer.id} 
                  onClick={() => onSelect(customer.id!)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedCustomerIds.includes(customer.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCustomerIds(prev => [...prev, customer.id!]);
                        } else {
                          setSelectedCustomerIds(prev => prev.filter(id => id !== customer.id!));
                        }
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#2F69FF] focus:ring-0 cursor-pointer"
                    />
                  </td>
                  {visibleColumns.customer && (
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
                  )}
                  {visibleColumns.contact && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 font-medium">
                        {customer.email ? highlightText(customer.email, searchTerm) : <span className="text-gray-400">—</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.phone ? highlightText(customer.phone, searchTerm) : <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                  )}
                  {visibleColumns.tier && (
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold ${getTierStyle(customer.tier)}`}>
                        {customer.tier || 'Member'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.ltv && (
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formatLTV(customer.lifetimeValue)}
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {customer.status || 'Hoạt động'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.type && (
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
                  )}
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
