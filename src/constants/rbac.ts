import { ModuleKey, PermissionAction, RoleId } from '../types/crm';

export interface RoleDefinition {
  id: RoleId;
  nameVi: string;
  nameEn: string;
  description: string;
  level: number;
}

export const ROLES: RoleDefinition[] = [
  { id: 'super_admin', nameVi: 'Super Admin', nameEn: 'Super Admin', description: 'Toàn quyền hệ thống đa tổ chức', level: 100 },
  { id: 'org_owner', nameVi: 'Chủ sở hữu tổ chức', nameEn: 'Organization Owner', description: 'Toàn quyền tổ chức, thanh toán & bảo mật', level: 95 },
  { id: 'org_admin', nameVi: 'Quản trị viên tổ chức', nameEn: 'Organization Admin', description: 'Quản trị cấu hình, người dùng & dữ liệu', level: 90 },
  { id: 'crm_manager', nameVi: 'Quản lý CRM', nameEn: 'CRM Manager', description: 'Điều hành toàn bộ vận hành CRM', level: 80 },
  { id: 'sales_manager', nameVi: 'Trưởng phòng Kinh doanh', nameEn: 'Sales Manager', description: 'Quản lý Lead, Pipeline, Báo giá & Hợp đồng', level: 70 },
  { id: 'sales_staff', nameVi: 'Nhân viên Kinh doanh', nameEn: 'Sales Staff', description: 'Xử lý Lead, Cơ hội & Khách hàng phụ trách', level: 50 },
  { id: 'cs_manager', nameVi: 'Trưởng bộ phận CSKH', nameEn: 'Customer Service Manager', description: 'Quản lý Ticket, SLA & Omnichannel', level: 70 },
  { id: 'cs_agent', nameVi: 'Chuyên viên CSKH', nameEn: 'Customer Service Agent', description: 'Tiếp nhận & giải quyết Ticket, Hội thoại', level: 50 },
  { id: 'marketing_manager', nameVi: 'Trưởng phòng Marketing', nameEn: 'Marketing Manager', description: 'Quản lý chiến dịch, phân khúc & Automation', level: 70 },
  { id: 'marketing_staff', nameVi: 'Nhân viên Marketing', nameEn: 'Marketing Staff', description: 'Triển khai chiến dịch & mẫu nội dung', level: 50 },
  { id: 'analyst', nameVi: 'Chuyên viên Phân tích', nameEn: 'Analyst', description: 'Xem & xuất báo cáo BI toàn hệ thống', level: 40 },
  { id: 'read_only', nameVi: 'Người dùng Chỉ xem', nameEn: 'Read-only User', description: 'Chỉ được xem dữ liệu được cấp phép', level: 20 },
  { id: 'customer_portal', nameVi: 'Khách hàng (Portal)', nameEn: 'Customer Portal User', description: 'Chỉ truy cập Cổng tự phục vụ của chính mình', level: 10 },
];

const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'assign',
  'approve',
  'export',
  'import',
  'manage_settings',
];

const ALL_MODULES: ModuleKey[] = [
  'dashboard',
  'customers',
  'leads',
  'sales',
  'tasks',
  'omnichannel',
  'service',
  'marketing',
  'products',
  'workflows',
  'ai',
  'reports',
  'employees',
  'documents',
  'portal',
  'integrations',
  'admin',
  'loyalty',
];

function fullAccess(): Record<ModuleKey, PermissionAction[]> {
  return ALL_MODULES.reduce((acc, mod) => {
    acc[mod] = [...ALL_ACTIONS];
    return acc;
  }, {} as Record<ModuleKey, PermissionAction[]>);
}

export const ROLE_PERMISSIONS: Record<RoleId, Partial<Record<ModuleKey, PermissionAction[]>>> = {
  super_admin: fullAccess(),
  org_owner: fullAccess(),
  org_admin: fullAccess(),
  crm_manager: {
    ...fullAccess(),
    admin: ['view', 'edit'],
    integrations: ['view', 'edit'],
  },
  sales_manager: {
    dashboard: ['view', 'export'],
    customers: ['view', 'create', 'edit', 'assign', 'export', 'import'],
    leads: ['view', 'create', 'edit', 'delete', 'assign', 'export', 'import'],
    sales: ['view', 'create', 'edit', 'delete', 'assign', 'approve', 'export'],
    tasks: ['view', 'create', 'edit', 'delete', 'assign'],
    omnichannel: ['view', 'create', 'edit'],
    products: ['view', 'export'],
    ai: ['view', 'create'],
    reports: ['view', 'export'],
    documents: ['view', 'create'],
    loyalty: ['view'],
  },
  sales_staff: {
    dashboard: ['view'],
    customers: ['view', 'create', 'edit'],
    leads: ['view', 'create', 'edit'],
    sales: ['view', 'create', 'edit'],
    tasks: ['view', 'create', 'edit'],
    omnichannel: ['view', 'create'],
    products: ['view'],
    ai: ['view', 'create'],
    documents: ['view'],
  },
  cs_manager: {
    dashboard: ['view', 'export'],
    customers: ['view', 'edit', 'export'],
    tasks: ['view', 'create', 'edit', 'assign'],
    omnichannel: ['view', 'create', 'edit', 'assign'],
    service: ['view', 'create', 'edit', 'delete', 'assign', 'approve', 'export'],
    workflows: ['view', 'create', 'edit'],
    ai: ['view', 'create'],
    reports: ['view', 'export'],
    documents: ['view', 'create', 'edit', 'approve'],
    loyalty: ['view', 'edit'],
  },
  cs_agent: {
    dashboard: ['view'],
    customers: ['view', 'edit'],
    tasks: ['view', 'create', 'edit'],
    omnichannel: ['view', 'create', 'edit'],
    service: ['view', 'create', 'edit'],
    ai: ['view', 'create'],
    documents: ['view'],
    loyalty: ['view'],
  },
  marketing_manager: {
    dashboard: ['view', 'export'],
    customers: ['view', 'export'],
    leads: ['view', 'create', 'edit', 'import', 'export'],
    marketing: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    workflows: ['view', 'create', 'edit'],
    ai: ['view', 'create'],
    reports: ['view', 'export'],
    documents: ['view', 'create'],
    loyalty: ['view', 'create', 'edit'],
  },
  marketing_staff: {
    dashboard: ['view'],
    customers: ['view'],
    leads: ['view', 'create', 'edit'],
    marketing: ['view', 'create', 'edit'],
    ai: ['view', 'create'],
    documents: ['view'],
  },
  analyst: {
    dashboard: ['view', 'export'],
    customers: ['view', 'export'],
    leads: ['view', 'export'],
    sales: ['view', 'export'],
    service: ['view', 'export'],
    marketing: ['view', 'export'],
    reports: ['view', 'create', 'export'],
    ai: ['view'],
    loyalty: ['view', 'export'],
  },
  read_only: {
    dashboard: ['view'],
    customers: ['view'],
    leads: ['view'],
    sales: ['view'],
    tasks: ['view'],
    service: ['view'],
    marketing: ['view'],
    products: ['view'],
    reports: ['view'],
    documents: ['view'],
  },
  customer_portal: {
    portal: ['view', 'create'],
    documents: ['view'],
  },
};

export function hasPermission(role: RoleId, module: ModuleKey, action: PermissionAction): boolean {
  const perms = ROLE_PERMISSIONS[role]?.[module];
  if (!perms) return false;
  return perms.includes(action);
}
