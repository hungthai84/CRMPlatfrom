import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Key, Layers, Server, Shield, Network, Settings, Download, Plus } from 'lucide-react';

export function EnterpriseArchitecture() {
  const [activeTab, setActiveTab] = useState('overview');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="flex-1 overflow-auto bg-background p-2 md:p-4 rounded-2xl no-scrollbar flex flex-col gap-4 relative">
      
      {/* 1. Banner Header */}
      <motion.div 
        id="dashboard-upper-portal"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-xs backdrop-blur-md w-full flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 shrink-0"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading font-black text-2xl md:text-3xl tracking-tight text-foreground flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Layers className="w-5 h-5" />
            </span>
            Quản lý Kiến trúc Doanh nghiệp
          </h1>
          <p className="text-sm text-muted-foreground">Hệ thống quản trị cấu trúc, sơ đồ kỹ thuật và quy chuẩn không gian mạng</p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <motion.button 
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="bg-background border border-border text-foreground hover:bg-muted text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center shadow-sm"
          >
            <BookOpen className="w-4 h-4 mr-2 text-primary" />
            Tài liệu
          </motion.button>
          
          <motion.button 
            whileHover={{ y: -2, scale: 1.05, transition: { duration: 0.2 } }}
            className="bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo Model
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Menu Tabs */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex shrink-0 px-1 overflow-x-auto no-scrollbar"
      >
        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl w-fit">
          {[
            { id: 'overview', name: 'Tổng quan' },
            { id: 'infrastructure', name: 'Hạ tầng Mạng' },
            { id: 'security', name: 'Bảo mật & IAM' },
            { id: 'integrations', name: 'Tích hợp API' }
          ].map(tab => (
            <motion.button
              whileHover={activeTab !== tab.id ? { scale: 1.01 } : {}}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm scale-[1.02] font-black' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.name}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* 3. Content Area */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={activeTab} // triggers re-animation on tab change
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-10"
      >
        {activeTab === 'overview' && (
          <>
            {/* Main Content Area */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
              <div className="bg-card/45 border border-border/60 rounded-3xl p-5 shadow-xs backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h2 className="font-heading font-black text-lg text-foreground tracking-tight flex items-center gap-2">
                    <Network className="w-5 h-5 text-primary" /> Mô hình Dịch vụ Hệ thống
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">LIVE STATE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 relative z-10">
                  {[
                    { label: 'Gateway Nodes', value: '14 Active', sub: 'APAC Region', icon: Server },
                    { label: 'IAM Roles', value: '256 Policies', sub: 'Strict Mode', icon: Shield },
                    { label: 'API Microservices', value: '89 ENDPONTS', sub: 'v2.0.4', icon: Network },
                    { label: 'OAuth Clients', value: '12 Brands', sub: 'Internal/External', icon: Key }
                  ].map((stat, i) => (
                      <motion.div whileHover={{ y: -2 }} key={i} className="bg-muted/40 p-3 rounded-2xl border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 bg-background rounded-xl shadow-sm text-foreground shrink-0 border border-border/20">
                          <stat.icon className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-heading font-black text-sm text-foreground tracking-tight truncate">{stat.value}</span>
                            <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-primary mt-0.5 truncate">{stat.sub}</span>
                        </div>
                      </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Timeline / Recent Updates */}
              <div className="bg-card/45 border border-border/60 rounded-3xl p-5 shadow-xs backdrop-blur-md">
                <h3 className="font-heading font-black text-base text-foreground tracking-tight mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Cập nhật Hệ thống (Logs)
                </h3>
                <div className="space-y-3">
                  {[
                    { title: 'Migrated Gateway Load Balancer', time: '14 mins ago', id: 'REQ-889', author: 'DevOps Team' },
                    { title: 'Patched OAuth Security Rules', time: '2 hours ago', id: 'SEC-901', author: 'Security Team'},
                    { title: 'Updated API Sub-graphs', time: 'Yesterday', id: 'API-112', author: 'Backend Architecture'}
                  ].map((log, i) => (
                     <motion.div whileHover={{ x: 2 }} key={i} className="flex gap-4 items-start relative pb-3">
                      {i !== 2 && <div className="absolute top-6 left-[11px] w-0.5 h-[calc(100%-20px)] bg-border rounded-full" />}
                      <div className="w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center shrink-0 z-10 shadow-sm">
                         <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      </div>
                      <div className="flex-1 bg-muted/20 p-3 rounded-2xl border border-border/40 flex justify-between items-center gap-2">
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{log.title}</span>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-xs text-muted-foreground">{log.author}</span>
                               <span className="w-1 h-1 rounded-full bg-border" />
                               <span className="text-xs text-muted-foreground">{log.time}</span>
                            </div>
                         </div>
                         <div className="font-mono text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md hidden xs:block border border-primary/20">{log.id}</div>
                      </div>
                     </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Sidebar Stats Area */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="bg-primary/95 border border-primary/80 rounded-3xl p-6 shadow-md relative overflow-hidden text-primary-foreground flex flex-col justify-between min-h-[160px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8" />
                <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-black/10 rounded-full mix-blend-overlay blur-xl" />
                <div className="relative z-10">
                   <h3 className="font-heading font-black tracking-tight text-xl mb-1">Architecture V3.0</h3>
                   <p className="text-primary-foreground/80 text-xs font-semibold">Bản thiết kế cốt lõi hiện hành</p>
                </div>
                <div className="relative z-10 flex justify-between items-end mt-4">
                   <div className="flex flex-col">
                     <span className="font-mono text-[10px] uppercase tracking-widest text-primary-foreground/70 font-bold mb-0.5">Trạng thái</span>
                     <span className="text-sm font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Đã duyệt (Approved)</span>
                   </div>
                   <motion.button 
                      whileHover={{ scale: 1.1 }}
                      className="p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 transition-colors rounded-xl backdrop-blur-sm cursor-pointer shadow-sm shadow-black/5" 
                      title="Tải xuống tài liệu PDF"
                   >
                      <Download className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
                   </motion.button>
                </div>
              </div>

              <div className="bg-card/45 border border-border/60 rounded-3xl p-5 shadow-xs backdrop-blur-md">
                 <h3 className="font-heading font-black text-sm tracking-tight text-foreground mb-3">Tài nguyên Lưu trữ (Storage)</h3>
                 <div className="flex flex-col gap-3">
                   {['Cloud SQL', 'Firestore NoSQL', 'S3 Object Storage'].map((storage, idx) => (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-foreground">{storage}</span>
                           <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{Math.floor(Math.random() * 40) + 10}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.floor(Math.random() * 40) + 10}%` }} />
                        </div>
                      </div>
                   ))}
                 </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Dummy content for other tabs */}
        {activeTab !== 'overview' && (
          <motion.div variants={itemVariants} className="col-span-full">
            <div className="bg-card/45 border border-border/60 rounded-3xl py-16 flex flex-col items-center justify-center text-center shadow-xs backdrop-blur-md gap-3">
               <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center text-muted-foreground mb-2 border border-border/30">
                  <Server className="w-8 h-8" />
               </div>
               <h3 className="font-heading font-black tracking-tight text-lg text-foreground">Không có dữ liệu</h3>
               <p className="text-sm text-muted-foreground max-w-sm">Phân hệ {activeTab} hiện chưa có bảng thiết kế không gian mạng chi tiết nào được khởi tạo trong môi trường này.</p>
               <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="mt-2 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md"
               >
                 Bắt đầu Khởi tạo
               </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
