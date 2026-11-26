import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CRMProvider, useCRM } from './contexts/CRMContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSkeleton, PermissionDeniedState } from './components/ui/Primitives';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { RightInsightPanel } from './components/layout/RightInsightPanel';
import { Footer } from './components/layout/Footer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickCreateModal } from './components/common/QuickCreateModal';
import { CsvImportModal } from './components/common/CsvImportModal';
import { HelpModal } from './components/common/HelpModal';
import { AuthPage } from './pages/AuthPage';
import { ModuleKey } from './types/crm';

import { DashboardModule } from './modules/dashboard/DashboardModule';
import { CustomersModule } from './modules/customers/CustomersModule';
import { LeadsModule } from './modules/leads/LeadsModule';
import { SalesModule } from './modules/sales/SalesModule';
import { TasksModule } from './modules/tasks/TasksModule';
import { OmnichannelModule } from './modules/omnichannel/OmnichannelModule';
import { ServiceModule } from './modules/service/ServiceModule';
import { MarketingModule } from './modules/marketing/MarketingModule';
import { ProductsModule } from './modules/products/ProductsModule';
import { WorkflowsModule } from './modules/workflows/WorkflowsModule';
import { AICopilotModule, FloatingAiDrawer } from './modules/ai/AICopilotModule';
import { ReportsModule } from './modules/reports/ReportsModule';
import { EmployeesModule } from './modules/employees/EmployeesModule';
import { DocumentsModule } from './modules/documents/DocumentsModule';
import { PortalModule } from './modules/portal/PortalModule';
import { IntegrationsModule } from './modules/integrations/IntegrationsModule';
import { AdminModule } from './modules/admin/AdminModule';
import { LoyaltyModule } from './modules/loyalty/LoyaltyModule';

const MODULE_TITLES: Record<ModuleKey, string> = {
  dashboard: 'Bảng điều hành Tổng quan',
  customers: 'Khách hàng 360°',
  leads: 'Khách hàng Tiềm năng',
  sales: 'Quản trị Bán hàng',
  tasks: 'Công việc & Lịch hẹn',
  omnichannel: 'Hộp thư Đa kênh',
  service: 'Ticket & SLA',
  marketing: 'Marketing CRM',
  products: 'Sản phẩm & Hợp đồng',
  workflows: 'Tự động hóa Workflow',
  ai: 'Trung tâm AI Copilot',
  reports: 'Báo cáo & BI',
  employees: 'Nhân sự & Nhóm',
  documents: 'Tài liệu & Tri thức',
  portal: 'Cổng Khách hàng',
  integrations: 'Tích hợp & Webhook',
  admin: 'Quản trị & Bảo mật',
  loyalty: 'Khách hàng Thân thiết',
};

const CRMWorkspace: React.FC = () => {
  const { user, loading: authLoading, can } = useAuth();
  const { loadingData } = useCRM();

  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [csvImportTarget, setCsvImportTarget] = useState<'customers' | 'leads' | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fc] dark:bg-[#0b1730] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <LoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderActiveModule = () => {
    if (!can(activeModule, 'view')) {
      return <PermissionDeniedState moduleName={MODULE_TITLES[activeModule]} />;
    }
    if (loadingData) {
      return <LoadingSkeleton rows={6} />;
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule onNavigate={setActiveModule} />;
      case 'customers':
        return <CustomersModule onOpenImport={() => setCsvImportTarget('customers')} />;
      case 'leads':
        return <LeadsModule onOpenImport={() => setCsvImportTarget('leads')} />;
      case 'sales':
        return <SalesModule />;
      case 'tasks':
        return <TasksModule />;
      case 'omnichannel':
        return <OmnichannelModule />;
      case 'service':
        return <ServiceModule />;
      case 'marketing':
        return <MarketingModule />;
      case 'products':
        return <ProductsModule />;
      case 'workflows':
        return <WorkflowsModule />;
      case 'ai':
        return <AICopilotModule />;
      case 'reports':
        return <ReportsModule />;
      case 'employees':
        return <EmployeesModule />;
      case 'documents':
        return <DocumentsModule />;
      case 'portal':
        return <PortalModule />;
      case 'integrations':
        return <IntegrationsModule />;
      case 'admin':
        return <AdminModule />;
      case 'loyalty':
        return <LoyaltyModule />;
      default:
        return <DashboardModule onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#f4f7fc] dark:bg-[#0b1730] text-[#172b4d] dark:text-slate-100">
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickCreate={() => setQuickCreateOpen(true)}
          onToggleAiDrawer={() => setAiDrawerOpen((v) => !v)}
          onToggleInsightPanel={() => setInsightOpen((v) => !v)}
          onNavigateModule={setActiveModule}
          onOpenHelp={() => setHelpOpen(true)}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
            <div className="max-w-[1600px] mx-auto">{renderActiveModule()}</div>
          </main>

          <RightInsightPanel
            open={insightOpen}
            onClose={() => setInsightOpen(false)}
            onNavigate={setActiveModule}
          />
        </div>

        <Footer onOpenHelp={() => setHelpOpen(true)} />
      </div>

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(mod) => setActiveModule(mod)}
      />
      <QuickCreateModal open={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} />
      <CsvImportModal
        open={Boolean(csvImportTarget)}
        onClose={() => setCsvImportTarget(null)}
        target={csvImportTarget || 'customers'}
      />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <FloatingAiDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CRMProvider>
              <CRMWorkspace />
            </CRMProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
