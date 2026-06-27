import { useState } from 'react';
import { Award, Star, Settings, Gift, ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export function LoyaltyManagement() {
  const [activeTab, setActiveTab] = useState<'members' | 'rules'>('members');

  const tiers = [
    { name: 'Silver', color: 'bg-slate-200 text-slate-700 w-16', members: 450, points: '0 - 1,000' },
    { name: 'Gold', color: 'bg-amber-100 text-amber-700 w-16', members: 210, points: '1,001 - 5,000' },
    { name: 'Platinum', color: 'bg-rose-100 text-rose-700 w-20', members: 85, points: '5,001 - 10,000' },
    { name: 'Diamond', color: 'bg-blue-100 text-blue-600 w-20', members: 20, points: '10,000+' }
  ];

  const members = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nva@company.com', tier: 'Gold', points: 3450, joined: '15/02/2023' },
    { id: 2, name: 'Trần Thị B', email: 'ttb@domain.com', tier: 'Platinum', points: 7200, joined: '08/11/2022' },
    { id: 3, name: 'Lê Hoàng C', email: 'hc.le@start.io', tier: 'Silver', points: 890, joined: '01/05/2024' },
    { id: 4, name: 'Phạm Quyết D', email: 'd.pham@enterprise.net', tier: 'Diamond', points: 15400, joined: '18/09/2021' },
    { id: 5, name: 'Hoàng Kim E', email: 'kim.e@shop.vn', tier: 'Gold', points: 4100, joined: '22/12/2023' }
  ];

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col items-stretch max-w-7xl mx-auto w-full no-scrollbar overflow-y-auto space-y-6">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản lý Khách hàng thân thiết</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-semibold">Theo dõi thành viên, thiết lập điểm thưởng và quy tắc đổi quà tự động.</p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-[10px] font-bold text-sm hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
          <Gift size={18} />
          Tạo chiến dịch tặng điểm
        </button>
      </div>

      <div className="flex bg-white rounded-[10px] border border-slate-200 p-1 mb-6 shadow-sm shrink-0 w-fit">
        <button
          onClick={() => setActiveTab('members')}
          className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'members' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700")}
        >
          Thành viên & Hạng thẻ
        </button>
        <button
           onClick={() => setActiveTab('rules')}
           className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'rules' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700")}
        >
           Cấu hình & Quy tắc điểm
        </button>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar pb-6 space-y-6">
        {activeTab === 'members' && (
          <>
            {/* Tiers Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {tiers.map((tier) => (
                <div key={tier.name} className="bg-white border border-slate-200 p-5 rounded-[12px] shadow-sm flex flex-col justify-between hover:border-blue-200 transition-colors">
                   <div className="flex items-center justify-between mb-4">
                     <span className={cn("text-xs font-bold px-2.5 py-1 rounded-md text-center", tier.color)}>{tier.name}</span>
                     <Award className="text-slate-300" size={24} />
                   </div>
                   <div>
                     <div className="text-2xl font-black text-slate-900">{tier.members}</div>
                     <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">Thành viên</p>
                   </div>
                </div>
              ))}
            </div>

            {/* Members List */}
            <div className="bg-white border border-slate-200 rounded-[12px] shadow-sm overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="font-bold text-slate-800">Danh sách Hội viên</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                       <th className="p-4 font-bold">Khách hàng</th>
                       <th className="p-4 font-bold">Hạng thẻ</th>
                       <th className="p-4 font-bold">Điểm tích lũy</th>
                       <th className="p-4 font-bold">Ngày tham gia</th>
                       <th className="p-4 font-bold text-right">Thao tác</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-sm">
                      {members.map(member => (
                        <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{member.name}</div>
                            <div className="text-slate-500 text-xs">{member.email}</div>
                          </td>
                          <td className="p-4">
                            <span className={cn("inline-flex items-center justify-center text-xs font-bold px-2.5 py-1 rounded-[6px]", tiers.find(t => t.name === member.tier)?.color)}>
                               {member.tier}
                            </span>
                          </td>
                          <td className="p-4 font-black tracking-tight text-slate-700">{member.points.toLocaleString()}</td>
                          <td className="p-4 text-slate-600 font-medium">{member.joined}</td>
                          <td className="p-4 text-right">
                            <button className="text-blue-600 font-bold hover:underline text-xs flex items-center justify-end gap-1 ml-auto">
                              Chi tiết <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </>
        )}

        {activeTab === 'rules' && (
           <div className="space-y-6">
             <div className="bg-white border border-slate-200 rounded-[12px] shadow-sm p-6 max-w-4xl">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                   <Settings size={20} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">Quy tắc Nhận Điểm (Earning)</h3>
                   <p className="text-slate-500 text-sm font-medium">Cấu hình tỷ lệ quy đổi từ giao dịch sang điểm thưởng.</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <div>
                     <p className="font-bold text-slate-800">Tỷ lệ quy đổi cơ bản</p>
                     <p className="text-xs text-slate-500 font-medium mt-1">100,000 VND = 1 Điểm</p>
                   </div>
                   <button className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">Thay đổi</button>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <div>
                     <p className="font-bold text-slate-800">Thưởng sinh nhật</p>
                     <p className="text-xs text-slate-500 font-medium mt-1">X2 điểm tích lũy trong tháng sinh nhật</p>
                   </div>
                   <div className="w-11 h-6 bg-emerald-500 rounded-full flex items-center p-1 justify-end cursor-pointer">
                     <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <Check size={10} className="text-emerald-500" />
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <div>
                     <p className="font-bold text-slate-800">Thưởng đăng ký mới</p>
                     <p className="text-xs text-slate-500 font-medium mt-1">Tặng ngay 50 điểm khi đăng ký tài khoản Loyalty</p>
                   </div>
                   <div className="w-11 h-6 bg-slate-300 rounded-full flex items-center p-1 cursor-pointer">
                     <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                   </div>
                 </div>
               </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-[12px] shadow-sm p-6 max-w-4xl">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                   <Star size={20} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">Tiêu chí Nâng Hạng thẻ (Tiers)</h3>
                   <p className="text-slate-500 text-sm font-medium">Xác định mốc điểm để khách hàng được thăng hạng.</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {tiers.map((tier) => (
                   <div key={tier.name} className="p-4 border border-slate-200 rounded-[10px] flex justify-between items-center bg-white">
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-md text-center", tier.color)}>{tier.name}</span>
                      <span className="font-black text-slate-700 text-sm">{tier.points} pt</span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
