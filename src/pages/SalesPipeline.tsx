import { useState, useEffect } from 'react';
import { mockOpportunities } from '../data/mockData';
import { Opportunity } from '../types';
import { MoreHorizontal, Plus, X, Clock, Mail, Phone, Calendar, ArrowRight, AlertCircle, Building2, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const stages = ['Tiềm năng', 'Thẩm định', 'Đề xuất', 'Đàm phán', 'Đã chốt (Thắng)'];

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toString();
};

function DroppableColumn({ stage, children, total, count }: { stage: string, children: React.ReactNode, total: number, count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-w-[340px] w-[340px] flex flex-col bg-white/30 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)] snap-start shrink-0 transition-colors",
        isOver && "bg-white/60 border-blue-300 shadow-lg"
      )}
    >
      <div className="p-4 border-b border-white/50 flex justify-between items-center bg-white/40 rounded-t-3xl shrink-0">
        <div className="flex items-center gap-2.5">
           <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">{stage}</h3>
           <span className="bg-white/80 text-slate-700 px-2.5 py-0.5 rounded-md text-xs font-bold shadow-sm border border-white">
             {count}
           </span>
        </div>
        <div className="text-sm font-extrabold text-slate-900 bg-emerald-50/60 px-2 py-1 rounded-md border border-emerald-200/50 backdrop-blur-sm shadow-sm">
           đ{formatCurrency(total)}
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {children}
        {count === 0 && (
          <div className="h-28 border-2 border-dashed border-white/60 bg-white/20 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
            <span className="text-sm font-bold text-slate-500">Thả thẻ vào đây</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ op, onClick }: { op: Opportunity, onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: op.id,
    data: op,
  });
  
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  } : undefined;

  // Mock checking for overdue interactions
  const isOverdue = op.probability < 50;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Prevent drag click interference if possible, but keeping it simple
        onClick();
      }}
      className={cn(
        "bg-white/80 backdrop-blur-md p-5 rounded-2xl border shadow-sm transition-all cursor-grab active:cursor-grabbing relative overflow-hidden group",
        isDragging ? "shadow-xl border-blue-400" : "border-white hover:shadow-md hover:-translate-y-0.5",
        isOverdue && !isDragging && "border-rose-200 bg-rose-50/30"
      )}
    >
      <div className="flex justify-between items-start mb-3 relative z-10">
        <h4 className="font-bold text-slate-900 text-sm leading-snug pr-4">{op.title}</h4>
        {isOverdue && (
          <div title="Quá hạn tương tác" className="bg-rose-100 p-1.5 rounded-full text-rose-600 shrink-0">
             <AlertCircle size={14} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-semibold mb-4 relative z-10">
        <Building2 size={14} className="text-slate-400" /> {op.company}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200/50 relative z-10 flex flex-col gap-3">
         <div className="flex justify-between items-center">
           <span className="font-extrabold text-slate-900 text-sm">đ{formatCurrency(op.amount)}</span>
           <span className="text-xs font-bold text-slate-700">{op.probability}% Xác suất</span>
         </div>
         
         {/* visual progress indicator for deal stages */}
         <div className="flex gap-1 w-full">
           {stages.map((stageName, idx) => {
             const stageIndex = stages.indexOf(op.stage);
             const isCompleted = idx < stageIndex;
             const isCurrent = idx === stageIndex;
             const isSuccessStage = idx === stages.length - 1;
             
             return (
               <div 
                 key={idx}
                 className={cn(
                   "h-1.5 flex-1 rounded-full transition-colors",
                   isCompleted || isCurrent ? (isSuccessStage && isCurrent ? "bg-emerald-500" : "bg-blue-600") : "bg-slate-200",
                   isCurrent && !isSuccessStage ? "opacity-100" : (isCompleted ? "opacity-45" : "opacity-100")
                 )}
                 title={stageName}
               />
             );
           })}
         </div>
      </div>
    </div>
  )
}

export function SalesPipeline() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    const saved = localStorage.getItem('crm_opportunities');
    return saved ? JSON.parse(saved) : mockOpportunities;
  });

  useEffect(() => {
    localStorage.setItem('crm_opportunities', JSON.stringify(opportunities));
  }, [opportunities]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Opportunity | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState<Partial<Opportunity>>({
    title: '',
    company: '',
    amount: 0,
    probability: 50,
    stage: 'Tiềm năng' as any
  });

  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealForm.title || !newDealForm.company) return;
    
    const newOp: Opportunity = {
      id: Math.random().toString(36).substring(7),
      title: newDealForm.title!,
      company: newDealForm.company!,
      amount: Number(newDealForm.amount) || 0,
      probability: Number(newDealForm.probability) || 0,
      stage: newDealForm.stage as any,
      expectedClose: new Date().toISOString()
    };
    
    setOpportunities([newOp, ...opportunities]);
    setIsAddModalOpen(false);
    setNewDealForm({
      title: '',
      company: '',
      amount: 0,
      probability: 50,
      stage: 'Tiềm năng' as any
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Start dragging after 5px movement (easier clicking)
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && over.id) {
      const stage = over.id as string;
      setOpportunities(prev => prev.map(op => 
        op.id === active.id ? { ...op, stage: stage as any } : op
      ));
    }
  };

  const activeOp = opportunities.find(op => op.id === activeId);

  const handleExportCsv = () => {
    if (opportunities.length === 0) return;
    
    const headers = ['Mã Deal', 'Tên cơ hội / Deal', 'Công ty / Khách hàng', 'Giai đoạn', 'Giá trị (VND)', 'Xác suất (%)', 'Ngày dự kiến đóng'];
    
    const rows = opportunities.map(op => [
      op.id || '',
      op.title || '',
      op.company || '',
      op.stage || '',
      op.amount?.toString() || '0',
      op.probability?.toString() || '0',
      op.expectedClose || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_pipeline_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock timeline events for the drawer
  const timelineEvents = [
    { id: 1, type: 'status', title: 'Deal chuyển sang Đàm phán', date: 'Vừa xong', user: 'Hùng Thái' },
    { id: 2, type: 'email', title: 'Email: Gửi báo giá v2.pdf', date: '2 ngày trước', user: 'Hùng Thái' },
    { id: 3, type: 'call', title: 'Cuộc gọi: Phản hồi về giá', date: '4 ngày trước', user: 'Hùng Thái' },
    { id: 4, type: 'meeting', title: 'Họp trực tuyến DEMO', date: '1 tuần trước', user: 'Khách hàng' },
  ];

  return (
    <div className="max-w-full h-full flex p-4 lg:p-6 overflow-hidden relative w-full gap-5 bg-slate-50 dark:bg-slate-900/40">
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300" style={{ paddingRight: selectedDeal ? '400px' : '0' }}>
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quy trình bán hàng</h1>
            <p className="text-slate-600 text-sm mt-1.5 font-semibold">Kéo và thả thẻ Deal để thay đổi giai đoạn</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCsv}
              className="bg-white border border-slate-200 text-slate-700 shadow-sm px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
              title="Xuất báo cáo bán hàng dưới dạng CSV"
            >
              <Download size={18} className="text-slate-500" /> Xuất báo cáo CSV
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Thêm Deal mới
            </button>
          </div>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto flex-1 pb-4 snap-x">
            {stages.map(stage => {
              const opsInStage = opportunities.filter(o => o.stage === stage);
              const stageTotal = opsInStage.reduce((sum, o) => sum + o.amount, 0);

              return (
                <DroppableColumn 
                  key={stage} 
                  stage={stage} 
                  total={stageTotal} 
                  count={opsInStage.length}
                >
                  {opsInStage.map(op => (
                    <DraggableCard 
                      key={op.id} 
                      op={op} 
                      onClick={() => setSelectedDeal(op)} 
                    />
                  ))}
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeOp ? (
              <div className="opacity-90 scale-105 shadow-2xl">
                 <DraggableCard op={activeOp} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Drawer / Right Panel */}
      <div className={cn(
        "absolute top-0 right-0 h-full w-[400px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.05)] border-l border-slate-200 z-20 flex flex-col transition-transform duration-300 ease-in-out",
        selectedDeal ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedDeal && (
          <>
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
               <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedDeal.title}</h2>
                  <p className="text-sm font-semibold text-slate-600">{selectedDeal.company}</p>
               </div>
               <button 
                 onClick={() => setSelectedDeal(null)}
                 className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {/* Deal Info */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-xs text-slate-500 font-bold uppercase mb-1">Giá trị</p>
                     <p className="text-lg text-emerald-700 font-extrabold flex items-center gap-1">
                        đ{formatCurrency(selectedDeal.amount)}
                     </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-xs text-slate-500 font-bold uppercase mb-1">Xác suất</p>
                     <p className="text-lg text-blue-700 font-extrabold flex items-center gap-1">
                        {selectedDeal.probability}%
                     </p>
                  </div>
               </div>

               {/* Timeline 360 */}
               <div>
                 <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                   <Clock size={16} className="text-blue-500" />
                   Timeline Tương tác (360°)
                 </h3>
                 <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                   {timelineEvents.map((event) => (
                     <div key={event.id} className="relative">
                       <div className="absolute -left-[35px] top-0.5 p-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500">
                         {event.type === 'email' ? <Mail size={14} className="text-blue-500" /> :
                          event.type === 'call' ? <Phone size={14} className="text-emerald-500" /> :
                          event.type === 'meeting' ? <Calendar size={14} className="text-purple-500" /> :
                          <ArrowRight size={14} className="text-amber-500" />}
                       </div>
                       <div>
                         <div className="flex justify-between items-start mb-1">
                           <h4 className="font-bold text-slate-800 text-sm leading-snug">{event.title}</h4>
                           <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap ml-2">{event.date}</span>
                         </div>
                         <p className="text-xs text-slate-500 font-semibold mt-0.5">Thực hiện bởi: {event.user}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <button className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-bold shadow-md hover:bg-slate-800 transition-colors">
                Thêm hoạt động mới
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Deal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Thêm Deal mới</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddDeal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên cơ hội / Deal</label>
                <input 
                  type="text" 
                  value={newDealForm.title}
                  onChange={(e) => setNewDealForm({...newDealForm, title: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ví dụ: Thiết kế Website Doanh nghiệp"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Công ty / Khách hàng</label>
                <input 
                  type="text" 
                  value={newDealForm.company}
                  onChange={(e) => setNewDealForm({...newDealForm, company: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Tên công ty"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Giá trị (VNĐ)</label>
                  <input 
                    type="number" 
                    value={newDealForm.amount}
                    onChange={(e) => setNewDealForm({...newDealForm, amount: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Xác suất (%)</label>
                  <input 
                    type="number" 
                    min="0" max="100"
                    value={newDealForm.probability}
                    onChange={(e) => setNewDealForm({...newDealForm, probability: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Giai đoạn</label>
                <select 
                  value={newDealForm.stage}
                  onChange={(e) => setNewDealForm({...newDealForm, stage: e.target.value as any})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  {stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/30 hover:bg-blue-700 transition-all"
                >
                  Lưu Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

