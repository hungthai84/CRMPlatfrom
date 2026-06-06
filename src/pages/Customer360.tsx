import { Search, Filter, Phone, Mail, MapPin, Star, MoreVertical, CreditCard, Clock, Activity, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';
import { AddCustomerModal } from '../components/AddCustomerModal';

export function Customer360() {
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'customers'), where('ownerId', '==', user.uid));
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
  }, [user]);

  const selectedCustomer = customers.length > 0 ? customers[0] : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Góc nhìn khách hàng 360</h1>
          <p className="text-slate-600 text-sm mt-1.5 font-semibold">Hồ sơ thống nhất & Phân khúc</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          Thêm khách hàng
        </button>
      </div>

      <div className="flex gap-4 mb-6 pt-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email, sđt..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-colors placeholder:font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 border border-white/60 bg-white/50 backdrop-blur-md rounded-xl text-sm font-bold text-slate-700 hover:bg-white/70 shadow-sm transition-colors">
          <Filter size={16} /> Lọc
        </button>
      </div>

      {!selectedCustomer ? (
        <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-12 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-700">Không tìm thấy khách hàng</h2>
          <p className="text-slate-500 mt-2">Thêm khách hàng đầu tiên để xem góc nhìn 360.</p>
        </div>
      ) : (
        <>
          <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
            <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-r from-blue-600/80 via-indigo-600/80 to-purple-600/80 backdrop-blur-md"></div>
            <div className="px-8 pb-8 relative pt-36">
              <div className="flex justify-between items-end -mt-16 mb-8">
                <div className="flex items-end gap-6">
                  <img src={selectedCustomer.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'} alt="Avatar" className="w-32 h-32 rounded-2xl ring-4 ring-white/80 shadow-lg bg-white object-cover" />
                  <div className="mb-2">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white/60 border border-white/80 text-slate-800 shadow-sm backdrop-blur-sm">
                        ID: {selectedCustomer.id}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100/60 border border-blue-200/50 text-blue-800 shadow-sm backdrop-blur-sm">
                        {selectedCustomer.segment || 'Không xác định'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mb-2">
                   <button className="p-3 border border-white/60 bg-white/50 backdrop-blur-sm rounded-xl text-slate-700 hover:bg-white/80 hover:text-blue-600 shadow-sm transition-all focus:outline-none">
                     <Mail size={18} />
                   </button>
                   <button className="p-3 border border-white/60 bg-white/50 backdrop-blur-sm rounded-xl text-slate-700 hover:bg-white/80 hover:text-blue-600 shadow-sm transition-all focus:outline-none">
                     <Phone size={18} />
                   </button>
                   <button className="px-5 py-3 bg-blue-50/80 border border-blue-200/50 backdrop-blur-sm text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-100/80 shadow-sm transition-all focus:outline-none">
                     Tạo đơn hàng
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 {/* Kol 1: Contact Info */}
                 <div className="space-y-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Chi tiết liên hệ</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm">
                          <Mail size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{selectedCustomer.email}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">Email chính</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm">
                          <Phone size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{selectedCustomer.phone || 'N/A'}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">Số di động</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm">
                          <MapPin size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">District 1, HCM City</p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">Địa chỉ giao hàng</p>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Kol 2: Loyalty & Metric */}
                 <div className="space-y-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Giá trị & Sự trung thành</h3>
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm space-y-5">
                      <div className="flex justify-between items-center pb-4 border-b border-white/40">
                        <span className="text-sm font-bold text-slate-700">Hạng thành viên</span>
                        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-200/50 shadow-sm">
                          <Star size={16} className="text-amber-500 fill-amber-500" />
                          {selectedCustomer.tier || 'Thành viên'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/40">
                        <span className="text-sm font-bold text-slate-700">Điểm thành viên</span>
                        <span className="text-lg font-extrabold text-blue-700">{(selectedCustomer.loyaltyPoints || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">Giá trị vòng đời</span>
                        <span className="text-lg font-extrabold text-emerald-700">{formatCurrency(selectedCustomer.lifetimeValue || 0)}</span>
                      </div>
                    </div>
                 </div>

                 {/* Kol 3: AI Insights */}
                 <div className="space-y-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                      <Activity size={16} className="text-purple-500" /> Phân tích của AI
                    </h3>
                    <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 backdrop-blur-md rounded-2xl p-6 space-y-5 border border-purple-100/60 shadow-sm">
                       <div className="flex gap-4">
                         <div className="mt-0.5 bg-white/80 p-2 rounded-xl border border-purple-100 shadow-sm shrink-0">
                           <Target size={18} className="text-purple-600" />
                         </div>
                         <p className="text-sm text-purple-900 font-bold leading-relaxed">Khả năng cao mua Gói dịch vụ cao cấp. Đề xuất gửi email khuyến mãi.</p>
                       </div>
                       <div className="flex gap-4">
                         <div className="mt-0.5 bg-white/80 p-2 rounded-xl border border-slate-100 shadow-sm shrink-0">
                           <Clock size={18} className="text-slate-600" />
                         </div>
                         <p className="text-sm text-slate-800 font-semibold mt-1">Thời gian liên lạc tốt nhất: sáng Thứ Ba.</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Other components simulation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
             <div className="bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900 mb-8 tracking-tight">Tương tác gần đây</h3>
                <div className="space-y-7 pl-2">
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex gap-5 relative">
                      <div className="w-10 h-10 rounded-xl bg-white/80 border border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                        {i === 1 ? <Mail size={18} className="text-blue-500"/> : <Phone size={18} className="text-emerald-500"/>}
                      </div>
                      {i !== 3 && <div className="absolute top-10 left-[19px] bottom-[-28px] w-0.5 bg-white/60 shadow-sm"></div>}
                      <div className="pb-4 pt-0.5">
                        <p className="text-sm font-bold text-slate-900">{i === 1 ? 'Đã gửi email chiến dịch chào mừng' : 'Cuộc gọi ra - Thẩm định'}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1.5">Ngày {30 - i} tháng 5, 2026 tự động bởi hệ thống</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-sm flex flex-col">
                <h3 className="text-lg font-extrabold text-slate-900 mb-6 tracking-tight">Cơ sở dữ liệu khách hàng khác</h3>
                <div className="border border-white/60 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm flex-1">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/50 border-b border-white/60 text-slate-700">
                      <tr>
                        <th className="px-5 py-4 font-bold">Tên</th>
                        <th className="px-5 py-4 font-bold">Hạng</th>
                        <th className="px-5 py-4 font-bold">Phân khúc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                      {customers.map(c => (
                        <tr key={c.id} className="hover:bg-white/60 cursor-pointer transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-3">
                             <img src={c.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'} alt="" className="w-8 h-8 rounded-lg shadow-sm border border-white/50"/>
                             {c.name}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50/60 border border-amber-200/50 text-amber-800 shadow-sm">
                              {c.tier || 'Thành viên'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-bold">{c.segment || 'Không xác định'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        </>
      )}

      <AddCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
