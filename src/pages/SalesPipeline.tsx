import { mockOpportunities } from '../data/mockData';
import { Opportunity } from '../types';
import { MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

const stages = ['Tiềm năng', 'Thẩm định', 'Đề xuất', 'Đàm phán', 'Đã chốt (Thắng)'];

export function SalesPipeline() {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  return (
    <div className="max-w-full h-full flex flex-col p-6 md:p-8 overflow-hidden">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quy trình bán hàng</h1>
          <p className="text-slate-600 text-sm mt-1.5 font-semibold">Kéo và thả cơ hội để cập nhật các giai đoạn</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2">
          <Plus size={18} /> Thêm cơ hội mới
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto flex-1 pb-4 snap-x">
        {stages.map(stage => {
          const opsInStage = mockOpportunities.filter(o => o.stage === stage);
          const stageTotal = opsInStage.reduce((sum, o) => sum + o.amount, 0);

          return (
            <div key={stage} className="min-w-[340px] w-[340px] flex flex-col bg-white/30 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)] snap-start shrink-0">
              {/* Kanban Column Header */}
              <div className="p-4 border-b border-white/50 flex justify-between items-center bg-white/40 rounded-t-3xl shrink-0">
                <div className="flex items-center gap-2.5">
                   <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">{stage}</h3>
                   <span className="bg-white/80 text-slate-700 px-2.5 py-0.5 rounded-md text-xs font-bold shadow-sm border border-white">
                     {opsInStage.length}
                   </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 bg-emerald-50/60 px-2 py-1 rounded-md border border-emerald-200/50 backdrop-blur-sm shadow-sm">
                   đ{formatCurrency(stageTotal)}
                </div>
              </div>

              {/* Kanban Cards Container */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {opsInStage.map(op => (
                  <div key={op.id} className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug pr-4">{op.title}</h4>
                      <button className="text-slate-400 hover:text-slate-800 hover:bg-white/50 p-1.5 rounded-lg shrink-0 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 font-semibold mb-4 relative z-10">{op.company}</p>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 relative z-10">
                       <span className="font-extrabold text-slate-900 text-sm">đ{formatCurrency(op.amount)}</span>
                       <div className="flex items-center gap-2.5">
                         <div className="w-16 h-2 bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
                           <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                op.probability >= 80 ? "bg-emerald-500" :
                                op.probability >= 40 ? "bg-blue-500" : "bg-amber-500"
                              )} 
                              style={{ width: `${op.probability}%` }}
                           ></div>
                         </div>
                         <span className="text-xs font-bold text-slate-700 w-8 text-right">{op.probability}%</span>
                       </div>
                    </div>
                  </div>
                ))}
                
                {opsInStage.length === 0 && (
                  <div className="h-28 border-2 border-dashed border-white/60 bg-white/20 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                    <span className="text-sm font-bold text-slate-500">Thả vào đây</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
