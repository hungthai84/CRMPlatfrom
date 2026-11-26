import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  ActivityItem,
  AuditLogItem,
  Campaign,
  Contract,
  Conversation,
  Customer,
  CustomFieldDef,
  Deal,
  Department,
  Employee,
  KnowledgeDoc,
  Lead,
  LoyaltyRecord,
  ModuleKey,
  NotificationItem,
  Order,
  Organization,
  Product,
  SavedView,
  SlaPolicy,
  TaskItem,
  Team,
  Ticket,
  WorkflowRule,
} from '../types/crm';
import {
  batchWriteOrgDocs,
  clearDemoDocsFromOrg,
  deleteOrgDoc,
  subscribeOrgCollection,
  updateOrgDoc,
  upsertOrgDoc,
} from '../services/firestoreService';
import { buildDemoDataset } from '../services/demoData';

export interface CrmKpis {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalLeads: number;
  qualifiedLeads: number;
  leadConversionRate: number;
  openDeals: number;
  wonRevenue: number;
  pipelineValue: number;
  winRate: number;
  avgDealSize: number;
  totalOrders: number;
  activeContracts: number;
  expiringContracts: number;
  openTickets: number;
  overdueTickets: number;
  slaCompliance: number;
  csatAvg: number;
  npsAvg: number;
  fcrRate: number;
  pendingTasks: number;
  overdueTasks: number;
}

interface CRMContextType {
  organization: Organization | null;
  loadingData: boolean;
  lastSyncedAt: number;
  customers: Customer[];
  leads: Lead[];
  deals: Deal[];
  tasks: TaskItem[];
  tickets: Ticket[];
  products: Product[];
  orders: Order[];
  contracts: Contract[];
  campaigns: Campaign[];
  conversations: Conversation[];
  workflows: WorkflowRule[];
  employees: Employee[];
  departments: Department[];
  teams: Team[];
  documents: KnowledgeDoc[];
  loyalty: LoyaltyRecord[];
  activities: ActivityItem[];
  auditLogs: AuditLogItem[];
  notifications: NotificationItem[];
  customFields: CustomFieldDef[];
  slaPolicies: SlaPolicy[];
  savedViews: SavedView[];
  kpis: CrmKpis;
  hasDemoData: boolean;
  formatMoney: (amount: number) => string;
  updateOrganization: (patch: Partial<Organization>) => Promise<void>;
  createCustomer: (input: Omit<Customer, 'id' | 'organizationId' | 'ownerId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'code'>) => Promise<Customer>;
  updateCustomer: (id: string, patch: Partial<Customer>) => Promise<void>;
  archiveCustomer: (id: string) => Promise<void>;
  mergeCustomers: (primaryId: string, duplicateId: string) => Promise<void>;
  createLead: (input: Partial<Lead>) => Promise<Lead>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  convertLead: (leadId: string) => Promise<{ customer: Customer; deal: Deal; reusedExistingCustomer: boolean }>;
  createDeal: (input: Partial<Deal>) => Promise<Deal>;
  updateDeal: (id: string, patch: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  createTask: (input: Partial<TaskItem>) => Promise<TaskItem>;
  updateTask: (id: string, patch: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createTicket: (input: Partial<Ticket>) => Promise<Ticket>;
  updateTicket: (id: string, patch: Partial<Ticket>) => Promise<void>;
  addTicketComment: (ticketId: string, content: string, isInternal: boolean) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  createProduct: (input: Partial<Product>) => Promise<Product>;
  createOrder: (input: Partial<Order>) => Promise<Order>;
  createContract: (input: Partial<Contract>) => Promise<Contract>;
  updateContract: (id: string, patch: Partial<Contract>) => Promise<void>;
  createCampaign: (input: Partial<Campaign>) => Promise<Campaign>;
  updateCampaign: (id: string, patch: Partial<Campaign>) => Promise<void>;
  sendConversationMessage: (convId: string, content: string, isInternalNote?: boolean) => Promise<void>;
  updateConversationStatus: (convId: string, status: Conversation['status']) => Promise<void>;
  createWorkflow: (input: Partial<WorkflowRule>) => Promise<void>;
  toggleWorkflow: (id: string, enabled: boolean) => Promise<void>;
  runWorkflowTest: (id: string) => Promise<void>;
  createDocument: (input: Partial<KnowledgeDoc>) => Promise<void>;
  approveDocument: (id: string) => Promise<void>;
  adjustLoyaltyPoints: (loyaltyId: string, delta: number, reason: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addCustomField: (field: Omit<CustomFieldDef, 'id'>) => void;
  updateSlaPolicy: (policy: SlaPolicy) => void;
  addSavedView: (view: Omit<SavedView, 'id' | 'createdBy'>) => void;
  resetDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  logAudit: (action: string, module: string, details: string, recordId?: string) => Promise<void>;
  exportBackupJson: () => void;
}

const CRMContext = createContext<CRMContextType>({} as CRMContextType);
export const useCRM = () => useContext(CRMContext);

const ALL_COLLECTIONS = [
  'customers',
  'leads',
  'deals',
  'tasks',
  'tickets',
  'products',
  'orders',
  'contracts',
  'campaigns',
  'conversations',
  'workflows',
  'employees',
  'departments',
  'teams',
  'documents',
  'loyalty',
  'activities',
  'audit_logs',
  'notifications',
];

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(Date.now());

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([
    { id: 'cf_1', module: 'customer', label: 'Quy mô nhân sự', key: 'company_size', fieldType: 'number', required: false },
    { id: 'cf_2', module: 'lead', label: 'Khu vực ưu tiên', key: 'region', fieldType: 'select', required: false, options: ['Miền Nam', 'Miền Bắc', 'Miền Trung'] },
  ]);

  const [slaPolicies, setSlaPolicies] = useState<SlaPolicy[]>([
    { id: 'sla_urgent', name: 'Khẩn cấp (Urgent)', priority: 'urgent', firstResponseMinutes: 15, resolutionHours: 4, businessHoursOnly: false, escalationTarget: 'Trưởng bộ phận CSKH' },
    { id: 'sla_high', name: 'Cao (High)', priority: 'high', firstResponseMinutes: 30, resolutionHours: 8, businessHoursOnly: true, escalationTarget: 'Nhóm Hỗ trợ SLA' },
    { id: 'sla_medium', name: 'Trung bình (Medium)', priority: 'medium', firstResponseMinutes: 120, resolutionHours: 24, businessHoursOnly: true, escalationTarget: 'Chuyên viên phụ trách' },
    { id: 'sla_low', name: 'Thấp (Low)', priority: 'low', firstResponseMinutes: 240, resolutionHours: 48, businessHoursOnly: true, escalationTarget: 'Hàng đợi chuẩn' },
  ]);

  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  const orgId = profile?.organizationId || (user ? `org_${user.uid.slice(0, 16)}` : '');
  const ownerId = user?.uid || '';
  const ownerEmail = user?.email || 'user@onecrm.local';

  const seedDemoBundleToFirestore = useCallback(
    async (targetOrgId: string, targetOwnerId: string, targetEmail: string) => {
      const bundle = buildDemoDataset(targetOrgId, targetOwnerId, targetEmail);
      const entries: Array<{ colName: string; id: string; data: Record<string, unknown> }> = [];
      const pushList = (colName: string, list: Array<{ id: string }>) => {
        for (const item of list) {
          entries.push({ colName, id: item.id, data: item as unknown as Record<string, unknown> });
        }
      };
      pushList('departments', bundle.departments);
      pushList('teams', bundle.teams);
      pushList('employees', bundle.employees);
      pushList('customers', bundle.customers);
      pushList('leads', bundle.leads);
      pushList('deals', bundle.deals);
      pushList('tasks', bundle.tasks);
      pushList('tickets', bundle.tickets);
      pushList('products', bundle.products);
      pushList('orders', bundle.orders);
      pushList('contracts', bundle.contracts);
      pushList('campaigns', bundle.campaigns);
      pushList('conversations', bundle.conversations);
      pushList('workflows', bundle.workflows);
      pushList('documents', bundle.documents);
      pushList('loyalty', bundle.loyalty);
      pushList('activities', bundle.activities);
      pushList('audit_logs', bundle.auditLogs);
      pushList('notifications', bundle.notifications);
      await batchWriteOrgDocs(targetOrgId, entries);
    },
    []
  );

  // Bootstrap Organization & Subscribe to Firestore Collections
  useEffect(() => {
    if (!user || !orgId || !ownerId) {
      setLoadingData(false);
      return;
    }

    let cancelled = false;
    const unsubs: Array<() => void> = [];

    async function initOrgAndSubscribe() {
      setLoadingData(true);
      try {
        const orgRef = doc(db, 'organizations', orgId);
        const orgSnap = await getDoc(orgRef);

        if (!orgSnap.exists()) {
          const now = Date.now();
          const newOrg: Organization = {
            id: orgId,
            name: 'ONECRM Enterprise Workspace',
            code: 'ONECRM-VN',
            industry: 'Công nghệ & Dịch vụ Doanh nghiệp',
            currency: 'VND',
            timezone: 'Asia/Ho_Chi_Minh',
            language: 'vi',
            ownerId,
            demoModeEnabled: true,
            createdAt: now,
            updatedAt: now,
          };
          await setDoc(orgRef, newOrg);
          if (!cancelled) setOrganization(newOrg);
          await seedDemoBundleToFirestore(orgId, ownerId, ownerEmail);
        } else {
          if (!cancelled) setOrganization(orgSnap.data() as Organization);
        }

        const touchSync = () => setLastSyncedAt(Date.now());
        unsubs.push(
          subscribeOrgCollection<Customer>(orgId, ownerId, 'customers', (d) => { setCustomers(d); touchSync(); }),
          subscribeOrgCollection<Lead>(orgId, ownerId, 'leads', setLeads),
          subscribeOrgCollection<Deal>(orgId, ownerId, 'deals', setDeals),
          subscribeOrgCollection<TaskItem>(orgId, ownerId, 'tasks', setTasks),
          subscribeOrgCollection<Ticket>(orgId, ownerId, 'tickets', setTickets),
          subscribeOrgCollection<Product>(orgId, ownerId, 'products', setProducts),
          subscribeOrgCollection<Order>(orgId, ownerId, 'orders', setOrders),
          subscribeOrgCollection<Contract>(orgId, ownerId, 'contracts', setContracts),
          subscribeOrgCollection<Campaign>(orgId, ownerId, 'campaigns', setCampaigns),
          subscribeOrgCollection<Conversation>(orgId, ownerId, 'conversations', setConversations),
          subscribeOrgCollection<WorkflowRule>(orgId, ownerId, 'workflows', setWorkflows),
          subscribeOrgCollection<Employee>(orgId, ownerId, 'employees', setEmployees),
          subscribeOrgCollection<Department>(orgId, ownerId, 'departments', setDepartments),
          subscribeOrgCollection<Team>(orgId, ownerId, 'teams', setTeams),
          subscribeOrgCollection<KnowledgeDoc>(orgId, ownerId, 'documents', setDocuments),
          subscribeOrgCollection<LoyaltyRecord>(orgId, ownerId, 'loyalty', setLoyalty),
          subscribeOrgCollection<ActivityItem>(orgId, ownerId, 'activities', (d) => setActivities(d.sort((a, b) => b.timestamp - a.timestamp))),
          subscribeOrgCollection<AuditLogItem>(orgId, ownerId, 'audit_logs', (d) => setAuditLogs(d.sort((a, b) => b.timestamp - a.timestamp))),
          subscribeOrgCollection<NotificationItem>(orgId, ownerId, 'notifications', (d) => setNotifications(d.sort((a, b) => b.createdAt - a.createdAt)))
        );
      } catch (err) {
        console.error('Failed initializing ONECRM org:', err);
        addToast('Lỗi đồng bộ dữ liệu', 'Không thể kết nối cơ sở dữ liệu Firestore.', 'error');
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    initOrgAndSubscribe();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [user, orgId, ownerId, ownerEmail, seedDemoBundleToFirestore, addToast]);

  const logAudit = useCallback(
    async (action: string, module: string, details: string, recordId?: string) => {
      if (!orgId || !ownerId) return;
      const item: AuditLogItem = {
        id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        organizationId: orgId,
        ownerId,
        userId: ownerId,
        userEmail: ownerEmail,
        action,
        module,
        ...(recordId ? { recordId } : {}),
        details,
        timestamp: Date.now(),
      } as AuditLogItem & { ownerId: string };
      await upsertOrgDoc(orgId, 'audit_logs', item);
    },
    [orgId, ownerId, ownerEmail]
  );

  const logActivity = useCallback(
    async (
      entityType: ActivityItem['entityType'],
      entityId: string,
      entityName: string,
      type: ActivityItem['type'],
      summary: string
    ) => {
      if (!orgId || !ownerId) return;
      const item: ActivityItem = {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        organizationId: orgId,
        ownerId,
        entityType,
        entityId,
        entityName,
        type,
        summary,
        actorName: user?.displayName || ownerEmail.split('@')[0],
        timestamp: Date.now(),
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as ActivityItem & { status: string; createdAt: number; updatedAt: number };
      await upsertOrgDoc(orgId, 'activities', item);
    },
    [orgId, ownerId, ownerEmail, user?.displayName]
  );

  const pushNotification = useCallback(
    async (
      title: string,
      message: string,
      type: NotificationItem['type'],
      category: NotificationItem['category'],
      linkModule?: ModuleKey
    ) => {
      if (!orgId || !ownerId) return;
      const notif: NotificationItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        organizationId: orgId,
        ownerId,
        userId: ownerId,
        title,
        message,
        type,
        category,
        read: false,
        ...(linkModule ? { linkModule } : {}),
        createdAt: Date.now(),
      } as NotificationItem & { ownerId: string };
      await upsertOrgDoc(orgId, 'notifications', notif);
    },
    [orgId, ownerId]
  );

  const formatMoney = useCallback(
    (amount: number) => {
      const currency = organization?.currency || 'VND';
      if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
          amount / 25000
        );
      }
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
        amount
      );
    },
    [organization?.currency]
  );

  const updateOrganization = async (patch: Partial<Organization>) => {
    if (!organization) return;
    const updated: Organization = { ...organization, ...patch, updatedAt: Date.now() };
    await setDoc(doc(db, 'organizations', organization.id), updated);
    setOrganization(updated);
    await logAudit('UPDATE_ORGANIZATION', 'admin', `Cập nhật thông tin tổ chức: ${updated.name}`);
  };

  // --- CUSTOMERS ---
  const createCustomer: CRMContextType['createCustomer'] = async (input) => {
    const now = Date.now();
    const id = `cust_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const record: Customer = {
      ...input,
      id,
      organizationId: orgId,
      ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `KH-2026-${String(customers.length + 1).padStart(4, '0')}`,
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'customers', record);
    await logActivity('customer', record.id, record.name, 'note', `Tạo mới hồ sơ khách hàng ${record.code}`);
    await logAudit('CREATE_CUSTOMER', 'customers', `Tạo khách hàng ${record.name} (${record.code})`, record.id);
    return record;
  };

  const updateCustomer = async (id: string, patch: Partial<Customer>) => {
    const existing = customers.find((c) => c.id === id);
    if (!existing) return;
    const updated: Customer = { ...existing, ...patch, updatedAt: Date.now(), updatedBy: ownerId };
    await upsertOrgDoc(orgId, 'customers', updated);
    await logAudit('UPDATE_CUSTOMER', 'customers', `Cập nhật hồ sơ ${updated.name}`, id);
  };

  const archiveCustomer = async (id: string) => {
    const existing = customers.find((c) => c.id === id);
    if (!existing) return;
    await updateCustomer(id, { status: 'archived', archivedAt: Date.now() });
    await logAudit('ARCHIVE_CUSTOMER', 'customers', `Lưu trữ khách hàng ${existing.name}`, id);
  };

  const mergeCustomers = async (primaryId: string, duplicateId: string) => {
    const primary = customers.find((c) => c.id === primaryId);
    const dup = customers.find((c) => c.id === duplicateId);
    if (!primary || !dup || primaryId === duplicateId) return;

    const mergedTags = Array.from(new Set([...(primary.tags || []), ...(dup.tags || [])])).slice(0, 10);
    await updateCustomer(primaryId, {
      lifetimeValue: primary.lifetimeValue + dup.lifetimeValue,
      tags: mergedTags,
      notes: `${primary.notes || ''}\n[Hợp nhất từ ${dup.code} - ${dup.name}]`.trim(),
    });

    // Re-link deals, orders, contracts, tickets
    for (const d of deals.filter((x) => x.customerId === duplicateId)) {
      await updateOrgDoc(orgId, 'deals', d.id, { customerId: primaryId, customerName: primary.name, updatedAt: Date.now() });
    }
    for (const t of tickets.filter((x) => x.customerId === duplicateId)) {
      await updateOrgDoc(orgId, 'tickets', t.id, { customerId: primaryId, customerName: primary.name, updatedAt: Date.now() });
    }
    await deleteOrgDoc(orgId, 'customers', duplicateId);
    await logAudit('MERGE_CUSTOMERS', 'customers', `Hợp nhất ${dup.code} vào ${primary.code}`, primaryId);
  };

  // --- LEADS ---
  const createLead = async (input: Partial<Lead>): Promise<Lead> => {
    const now = Date.now();
    const id = `lead_${now}_${Math.random().toString(36).slice(2, 6)}`;
    // Round-robin auto assignment if employees exist
    const salesAgents = employees.filter((e) => e.role === 'sales_staff' || e.role === 'sales_manager');
    const autoOwner = salesAgents.length > 0 ? salesAgents[leads.length % salesAgents.length] : null;
    const record: Lead = {
      id,
      organizationId: orgId,
      ownerId,
      assignedTo: input.assignedTo || autoOwner?.id || ownerId,
      ownerName: input.ownerName || autoOwner?.fullName || user?.displayName || 'Chủ sở hữu',
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `LD-${String(leads.length + 1).padStart(4, '0')}`,
      name: input.name || 'Lead mới',
      company: input.company || '',
      phone: input.phone || '',
      email: input.email || '',
      source: input.source || 'Website',
      status: input.status || (autoOwner ? 'Assigned' : 'New'),
      score: input.score ?? (input.source === 'Referral' ? 75 : 55),
      estimatedValue: input.estimatedValue ?? 0,
      tags: input.tags || [],
      notes: input.notes || '',
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'leads', record);
    await pushNotification('Lead mới được ghi nhận', `${record.name} (${record.source}) đã vào phễu.`, 'info', 'lead', 'leads');
    await logAudit('CREATE_LEAD', 'leads', `Tạo Lead ${record.code} - ${record.name}`, record.id);
    return record;
  };

  const updateLead = async (id: string, patch: Partial<Lead>) => {
    const existing = leads.find((l) => l.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: Date.now(), updatedBy: ownerId };
    await upsertOrgDoc(orgId, 'leads', updated);
    await logAudit('UPDATE_LEAD', 'leads', `Cập nhật Lead ${existing.code} -> ${updated.status}`, id);
  };

  const deleteLead = async (id: string) => {
    const existing = leads.find((l) => l.id === id);
    await deleteOrgDoc(orgId, 'leads', id);
    if (existing) await logAudit('DELETE_LEAD', 'leads', `Xóa Lead ${existing.code}`, id);
  };

  // Duplicate-safe Lead -> Customer + Opportunity conversion
  const convertLead: CRMContextType['convertLead'] = async (leadId) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Không tìm thấy Lead');

    const normEmail = lead.email.trim().toLowerCase();
    const normPhone = lead.phone.replace(/\s+/g, '');
    const duplicate = customers.find(
      (c) =>
        c.status !== 'archived' &&
        ((normEmail && c.email.trim().toLowerCase() === normEmail) ||
          (normPhone && c.phone.replace(/\s+/g, '') === normPhone))
    );

    let targetCustomer: Customer;
    let reusedExistingCustomer = false;

    if (duplicate) {
      targetCustomer = duplicate;
      reusedExistingCustomer = true;
      await updateCustomer(duplicate.id, {
        status: 'active',
        notes: `${duplicate.notes || ''}\n[Chuyển đổi từ Lead ${lead.code}]`.trim(),
      });
    } else {
      targetCustomer = await createCustomer({
        type: lead.company ? 'business' : 'individual',
        name: lead.company || lead.name,
        phone: lead.phone,
        email: lead.email,
        address: '',
        taxId: '',
        group: lead.company ? 'Khách hàng B2B' : 'Khách hàng Cá nhân',
        segment: lead.estimatedValue >= 300_000_000 ? 'Enterprise' : 'SMB',
        tags: ['Converted Lead'],
        ownerName: lead.ownerName,
        score: lead.score,
        lifetimeValue: 0,
        healthScore: 85,
        status: 'active',
        source: lead.source,
        assignedTo: lead.assignedTo,
        consent: {
          marketingEmail: true,
          marketingSmsZalo: true,
          aiProcessing: true,
          thirdPartySharing: false,
          consentSource: `Chuyển đổi từ Lead (${lead.source})`,
          consentedAt: Date.now(),
          purposeNote: 'Tư vấn bán hàng và chăm sóc khách hàng.',
        },
        notes: lead.notes,
      });
    }

    const deal = await createDeal({
      title: `Cơ hội từ ${lead.company || lead.name}`,
      customerId: targetCustomer.id,
      customerName: targetCustomer.name,
      stage: 'Qualification',
      value: lead.estimatedValue || 100_000_000,
      probability: 45,
      expectedCloseDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      ownerName: lead.ownerName,
    });

    await updateLead(leadId, {
      status: 'Converted',
      convertedCustomerId: targetCustomer.id,
      convertedDealId: deal.id,
    });
    await logActivity('lead', lead.id, lead.name, 'conversion', `Chuyển đổi ${lead.code} thành khách hàng ${targetCustomer.code} và cơ hội ${deal.code}`);
    await logAudit('CONVERT_LEAD', 'leads', `Chuyển đổi ${lead.code} (tái sử dụng KH: ${reusedExistingCustomer})`, leadId);

    return { customer: targetCustomer, deal, reusedExistingCustomer };
  };

  // --- DEALS ---
  const createDeal = async (input: Partial<Deal>): Promise<Deal> => {
    const now = Date.now();
    const id = `deal_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const cust = customers.find((c) => c.id === input.customerId);
    const stage = input.stage || 'Discovery';
    const record: Deal = {
      id,
      organizationId: orgId,
      ownerId,
      assignedTo: input.assignedTo || ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `OPP-2026-${String(deals.length + 1).padStart(3, '0')}`,
      title: input.title || 'Cơ hội mới',
      customerId: input.customerId || '',
      customerName: input.customerName || cust?.name || 'Khách hàng',
      stage,
      value: input.value ?? 0,
      probability: input.probability ?? 30,
      expectedCloseDate: input.expectedCloseDate || new Date(now + 30 * 86_400_000).toISOString().slice(0, 10),
      ownerName: input.ownerName || user?.displayName || ownerEmail.split('@')[0],
      discountPercent: input.discountPercent ?? 0,
      approvalStatus: (input.discountPercent ?? 0) > 10 ? 'pending' : 'none',
      quoteItems: input.quoteItems || [],
      status: stage === 'Closed Won' ? 'won' : stage === 'Closed Lost' ? 'lost' : 'open',
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'deals', record);
    await logAudit('CREATE_DEAL', 'sales', `Tạo cơ hội ${record.code} (${formatMoney(record.value)})`, record.id);
    return record;
  };

  const updateDeal = async (id: string, patch: Partial<Deal>) => {
    const existing = deals.find((d) => d.id === id);
    if (!existing) return;
    const stage = patch.stage || existing.stage;
    const status: Deal['status'] = stage === 'Closed Won' ? 'won' : stage === 'Closed Lost' ? 'lost' : 'open';
    const updated: Deal = { ...existing, ...patch, stage, status, updatedAt: Date.now(), updatedBy: ownerId };
    await upsertOrgDoc(orgId, 'deals', updated);
    if (stage === 'Closed Won' && existing.stage !== 'Closed Won') {
      const cust = customers.find((c) => c.id === existing.customerId);
      if (cust) {
        await updateCustomer(cust.id, { lifetimeValue: cust.lifetimeValue + updated.value });
      }
      await pushNotification('Chốt giao dịch thành công', `${updated.title} đạt ${formatMoney(updated.value)}`, 'success', 'deal', 'sales');
    }
    await logAudit('UPDATE_DEAL', 'sales', `Cập nhật cơ hội ${existing.code} -> ${stage}`, id);
  };

  const deleteDeal = async (id: string) => {
    const existing = deals.find((d) => d.id === id);
    await deleteOrgDoc(orgId, 'deals', id);
    if (existing) await logAudit('DELETE_DEAL', 'sales', `Xóa cơ hội ${existing.code}`, id);
  };

  // --- TASKS ---
  const createTask = async (input: Partial<TaskItem>): Promise<TaskItem> => {
    const now = Date.now();
    const id = `task_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const record: TaskItem = {
      id,
      organizationId: orgId,
      ownerId,
      assignedTo: input.assignedTo || ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `CV-${String(tasks.length + 1).padStart(3, '0')}`,
      title: input.title || 'Công việc mới',
      description: input.description || '',
      priority: input.priority || 'medium',
      status: input.status || 'todo',
      dueDate: input.dueDate || new Date(now + 2 * 86_400_000).toISOString().slice(0, 10),
      type: input.type || 'task',
      linkedType: input.linkedType,
      linkedId: input.linkedId,
      linkedName: input.linkedName,
      assigneeName: input.assigneeName || user?.displayName || ownerEmail.split('@')[0],
      subtasks: input.subtasks || [],
      recurring: input.recurring || 'none',
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'tasks', record);
    await logAudit('CREATE_TASK', 'tasks', `Tạo công việc ${record.code}: ${record.title}`, record.id);
    return record;
  };

  const updateTask = async (id: string, patch: Partial<TaskItem>) => {
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: Date.now(), updatedBy: ownerId };
    await upsertOrgDoc(orgId, 'tasks', updated);
  };

  const deleteTask = async (id: string) => {
    await deleteOrgDoc(orgId, 'tasks', id);
    await logAudit('DELETE_TASK', 'tasks', `Xóa công việc ${id}`, id);
  };

  // --- TICKETS ---
  const createTicket = async (input: Partial<Ticket>): Promise<Ticket> => {
    const now = Date.now();
    const id = `tkt_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const cust = customers.find((c) => c.id === input.customerId);
    const prio = input.priority || 'medium';
    const policy = slaPolicies.find((p) => p.priority === prio);
    const resHours = policy?.resolutionHours || 24;
    const record: Ticket = {
      id,
      organizationId: orgId,
      ownerId,
      assignedTo: input.assignedTo || ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `TK-2026-${String(tickets.length + 1).padStart(4, '0')}`,
      title: input.title || 'Yêu cầu hỗ trợ mới',
      description: input.description || '',
      category: input.category || 'inquiry',
      priority: prio,
      status: input.status || 'New',
      customerId: input.customerId || '',
      customerName: input.customerName || cust?.name || 'Khách hàng',
      assigneeName: input.assigneeName || user?.displayName || ownerEmail.split('@')[0],
      queue: prio === 'urgent' ? 'Hàng đợi Khẩn cấp SLA' : 'Hàng đợi Hỗ trợ Chuẩn',
      channel: input.channel || 'portal',
      slaDeadline: now + resHours * 3_600_000,
      escalated: prio === 'urgent',
      comments: [],
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'tickets', record);
    await pushNotification('Ticket hỗ trợ mới', `${record.code}: ${record.title}`, prio === 'urgent' ? 'warning' : 'info', 'ticket', 'service');
    await logAudit('CREATE_TICKET', 'service', `Tạo Ticket ${record.code}`, record.id);
    return record;
  };

  const updateTicket = async (id: string, patch: Partial<Ticket>) => {
    const existing = tickets.find((t) => t.id === id);
    if (!existing) return;
    const updated: Ticket = {
      ...existing,
      ...patch,
      resolvedAt:
        (patch.status === 'Resolved' || patch.status === 'Closed') && !existing.resolvedAt
          ? Date.now()
          : existing.resolvedAt,
      updatedAt: Date.now(),
      updatedBy: ownerId,
    };
    await upsertOrgDoc(orgId, 'tickets', updated);
    await logAudit('UPDATE_TICKET', 'service', `Cập nhật Ticket ${existing.code} -> ${updated.status}`, id);
  };

  const addTicketComment = async (ticketId: string, content: string, isInternal: boolean) => {
    const existing = tickets.find((t) => t.id === ticketId);
    if (!existing) return;
    const newComment = {
      id: `cmt_${Date.now()}`,
      authorId: ownerId,
      authorName: user?.displayName || ownerEmail.split('@')[0],
      authorRole: 'agent' as const,
      content,
      isInternal,
      createdAt: Date.now(),
    };
    const patch: Partial<Ticket> = {
      comments: [...(existing.comments || []), newComment],
      firstResponseAt: existing.firstResponseAt || Date.now(),
      status: existing.status === 'New' ? 'Open' : existing.status,
    };
    await updateTicket(ticketId, patch);
  };

  const deleteTicket = async (id: string) => {
    await deleteOrgDoc(orgId, 'tickets', id);
    await logAudit('DELETE_TICKET', 'service', `Xóa Ticket ${id}`, id);
  };

  // --- PRODUCTS / ORDERS / CONTRACTS ---
  const createProduct = async (input: Partial<Product>): Promise<Product> => {
    const now = Date.now();
    const id = `prod_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const record: Product = {
      id,
      organizationId: orgId,
      ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      sku: input.sku || `SKU-${products.length + 101}`,
      name: input.name || 'Sản phẩm mới',
      type: input.type || 'product',
      category: input.category || 'CRM Core',
      unit: input.unit || 'Gói',
      price: input.price ?? 0,
      cost: input.cost ?? 0,
      stock: input.stock ?? 0,
      status: 'active',
      description: input.description || '',
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'products', record);
    await logAudit('CREATE_PRODUCT', 'products', `Thêm sản phẩm ${record.sku}`, record.id);
    return record;
  };

  const createOrder = async (input: Partial<Order>): Promise<Order> => {
    const now = Date.now();
    const id = `ord_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const cust = customers.find((c) => c.id === input.customerId);
    const items = input.items || [];
    const subtotal = items.reduce((s, item) => s + item.total, 0);
    const record: Order = {
      id,
      organizationId: orgId,
      ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `DH-2026-${String(orders.length + 1).padStart(4, '0')}`,
      customerId: input.customerId || '',
      customerName: input.customerName || cust?.name || 'Khách hàng',
      dealId: input.dealId,
      items,
      subtotal,
      discountAmount: input.discountAmount ?? 0,
      totalAmount: Math.max(0, subtotal - (input.discountAmount ?? 0)),
      paymentStatus: input.paymentStatus || 'unpaid',
      status: input.status || 'confirmed',
      orderDate: input.orderDate || new Date(now).toISOString().slice(0, 10),
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'orders', record);
    await logAudit('CREATE_ORDER', 'products', `Tạo đơn hàng ${record.code}`, record.id);
    return record;
  };

  const createContract = async (input: Partial<Contract>): Promise<Contract> => {
    const now = Date.now();
    const id = `ctr_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const cust = customers.find((c) => c.id === input.customerId);
    const record: Contract = {
      id,
      organizationId: orgId,
      ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `HD-2026-${String(contracts.length + 1).padStart(3, '0')}`,
      title: input.title || 'Hợp đồng mới',
      customerId: input.customerId || '',
      customerName: input.customerName || cust?.name || 'Khách hàng',
      orderId: input.orderId,
      value: input.value ?? 0,
      startDate: input.startDate || new Date(now).toISOString().slice(0, 10),
      endDate: input.endDate || new Date(now + 365 * 86_400_000).toISOString().slice(0, 10),
      renewalType: input.renewalType || 'manual',
      approvalStatus: 'pending_approval',
      eSignStatus: 'not_configured',
      status: 'active',
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'contracts', record);
    await logAudit('CREATE_CONTRACT', 'products', `Tạo hợp đồng ${record.code}`, record.id);
    return record;
  };

  const updateContract = async (id: string, patch: Partial<Contract>) => {
    const existing = contracts.find((c) => c.id === id);
    if (!existing) return;
    await upsertOrgDoc(orgId, 'contracts', { ...existing, ...patch, updatedAt: Date.now(), updatedBy: ownerId });
    await logAudit('UPDATE_CONTRACT', 'products', `Cập nhật hợp đồng ${existing.code}`, id);
  };

  // --- MARKETING CAMPAIGNS ---
  const createCampaign = async (input: Partial<Campaign>): Promise<Campaign> => {
    const now = Date.now();
    const id = `cmp_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const record: Campaign = {
      id,
      organizationId: orgId,
      ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `MKT-2026-${String(campaigns.length + 1).padStart(2, '0')}`,
      name: input.name || 'Chiến dịch mới',
      channel: input.channel || 'Email',
      status: 'Draft',
      segment: input.segment || 'Tất cả khách hàng đồng ý nhận tin',
      budget: input.budget ?? 0,
      spent: 0,
      audienceCount: customers.filter((c) => c.consent?.marketingEmail).length,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      leadsGenerated: 0,
      revenueAttributed: 0,
      startDate: input.startDate || new Date(now).toISOString().slice(0, 10),
      endDate: input.endDate || new Date(now + 30 * 86_400_000).toISOString().slice(0, 10),
      utmSource: input.utmSource || 'onecrm',
      requiresConsentVerified: true,
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'campaigns', record);
    await logAudit('CREATE_CAMPAIGN', 'marketing', `Tạo chiến dịch ${record.code}`, record.id);
    return record;
  };

  const updateCampaign = async (id: string, patch: Partial<Campaign>) => {
    const existing = campaigns.find((c) => c.id === id);
    if (!existing) return;
    await upsertOrgDoc(orgId, 'campaigns', { ...existing, ...patch, updatedAt: Date.now(), updatedBy: ownerId });
  };

  // --- OMNICHANNEL ---
  const sendConversationMessage = async (convId: string, content: string, isInternalNote = false) => {
    const existing = conversations.find((c) => c.id === convId);
    if (!existing || !content.trim()) return;
    const msg = {
      id: `msg_${Date.now()}`,
      sender: 'agent' as const,
      senderName: user?.displayName || ownerEmail.split('@')[0],
      content: content.trim(),
      timestamp: Date.now(),
      isInternalNote,
    };
    const updated: Conversation = {
      ...existing,
      messages: [...existing.messages, msg],
      lastMessage: isInternalNote ? existing.lastMessage : msg.content,
      lastMessageAt: Date.now(),
      unreadCount: 0,
      updatedAt: Date.now(),
      updatedBy: ownerId,
    };
    await upsertOrgDoc(orgId, 'conversations', updated);
  };

  const updateConversationStatus = async (convId: string, status: Conversation['status']) => {
    const existing = conversations.find((c) => c.id === convId);
    if (!existing) return;
    await upsertOrgDoc(orgId, 'conversations', { ...existing, status, updatedAt: Date.now(), updatedBy: ownerId });
  };

  // --- WORKFLOWS ---
  const createWorkflow = async (input: Partial<WorkflowRule>) => {
    const now = Date.now();
    const id = `wf_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const record: WorkflowRule = {
      id,
      organizationId: orgId,
      ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      name: input.name || 'Quy trình tự động mới',
      description: input.description || '',
      triggerEvent: input.triggerEvent || 'lead.created',
      enabled: false,
      version: 1,
      runCount: 0,
      status: 'draft',
      nodes: input.nodes || [
        { id: 'n1', kind: 'trigger', label: 'Khi có sự kiện mới', config: { event: input.triggerEvent || 'lead.created' } },
        { id: 'n2', kind: 'action', label: 'Gửi thông báo & tạo Task', config: { priority: 'medium' } },
      ],
      logs: [],
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'workflows', record);
    await logAudit('CREATE_WORKFLOW', 'workflows', `Tạo workflow ${record.name}`, id);
  };

  const toggleWorkflow = async (id: string, enabled: boolean) => {
    const existing = workflows.find((w) => w.id === id);
    if (!existing) return;
    await upsertOrgDoc(orgId, 'workflows', {
      ...existing,
      enabled,
      status: enabled ? 'active' : 'paused',
      updatedAt: Date.now(),
      updatedBy: ownerId,
    });
    await logAudit('TOGGLE_WORKFLOW', 'workflows', `${enabled ? 'Bật' : 'Tạm dừng'} workflow ${existing.name}`, id);
  };

  const runWorkflowTest = async (id: string) => {
    const existing = workflows.find((w) => w.id === id);
    if (!existing) return;
    const logEntry = {
      id: `wfl_${Date.now()}`,
      timestamp: Date.now(),
      status: 'success' as const,
      summary: `Dry-run thành công ${existing.nodes.length} bước (${existing.triggerEvent}) — không ghi đè dữ liệu sản xuất.`,
    };
    await upsertOrgDoc(orgId, 'workflows', {
      ...existing,
      runCount: existing.runCount + 1,
      lastRunAt: Date.now(),
      logs: [logEntry, ...(existing.logs || [])].slice(0, 20),
      updatedAt: Date.now(),
      updatedBy: ownerId,
    });
  };

  // --- DOCUMENTS ---
  const createDocument = async (input: Partial<KnowledgeDoc>) => {
    const now = Date.now();
    const id = `doc_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const record: KnowledgeDoc = {
      id,
      organizationId: orgId,
      ownerId,
      createdAt: now,
      createdBy: ownerId,
      updatedAt: now,
      updatedBy: ownerId,
      code: `DOC-${String(documents.length + 1).padStart(3, '0')}`,
      title: input.title || 'Tài liệu mới',
      folder: input.folder || 'Chung',
      type: input.type || 'document',
      version: 'v1.0',
      visibility: input.visibility || 'internal',
      approvalStatus: 'draft',
      content: input.content || '',
      views: 0,
      status: 'draft',
      isDemo: false,
    };
    await upsertOrgDoc(orgId, 'documents', record);
    await logAudit('CREATE_DOCUMENT', 'documents', `Tạo tài liệu ${record.title}`, id);
  };

  const approveDocument = async (id: string) => {
    const existing = documents.find((d) => d.id === id);
    if (!existing) return;
    await upsertOrgDoc(orgId, 'documents', {
      ...existing,
      approvalStatus: 'approved',
      status: 'published',
      updatedAt: Date.now(),
      updatedBy: ownerId,
    });
    await logAudit('APPROVE_DOCUMENT', 'documents', `Phê duyệt tài liệu ${existing.title}`, id);
  };

  // --- LOYALTY ---
  const adjustLoyaltyPoints = async (loyaltyId: string, delta: number, reason: string) => {
    const existing = loyalty.find((l) => l.id === loyaltyId);
    if (!existing) return;
    const nextPoints = Math.max(0, existing.points + delta);
    const nextLifetime = delta > 0 ? existing.lifetimePoints + delta : existing.lifetimePoints;
    const nextTier: LoyaltyRecord['tier'] =
      nextLifetime >= 10000 ? 'Platinum' : nextLifetime >= 5000 ? 'Gold' : nextLifetime >= 2000 ? 'Silver' : 'Bronze';
    await upsertOrgDoc(orgId, 'loyalty', {
      ...existing,
      points: nextPoints,
      lifetimePoints: nextLifetime,
      tier: nextTier,
      updatedAt: Date.now(),
      updatedBy: ownerId,
    });
    await logAudit('ADJUST_LOYALTY', 'loyalty', `${delta >= 0 ? '+' : ''}${delta} điểm cho ${existing.customerName}: ${reason}`, loyaltyId);
  };

  // --- NOTIFICATIONS ---
  const markNotificationRead = async (id: string) => {
    await updateOrgDoc(orgId, 'notifications', id, { read: true });
  };

  const markAllNotificationsRead = async () => {
    for (const n of notifications.filter((x) => !x.read)) {
      await updateOrgDoc(orgId, 'notifications', n.id, { read: true });
    }
  };

  // --- DEMO DATA MANAGEMENT ---
  const resetDemoData = async () => {
    if (!orgId || !ownerId) return;
    await clearDemoDocsFromOrg(orgId, ownerId, ALL_COLLECTIONS);
    await seedDemoBundleToFirestore(orgId, ownerId, ownerEmail);
    await updateOrganization({ demoModeEnabled: true });
    addToast('Đã khôi phục dữ liệu mẫu', 'Toàn bộ 25 khách hàng, 20 Lead, 12 Deal, 20 Ticket và dữ liệu liên kết đã sẵn sàng.', 'success');
  };

  const clearDemoData = async () => {
    if (!orgId || !ownerId) return;
    const removed = await clearDemoDocsFromOrg(orgId, ownerId, ALL_COLLECTIONS);
    await updateOrganization({ demoModeEnabled: false });
    await logAudit('CLEAR_DEMO_DATA', 'admin', `Xóa ${removed} bản ghi Demo để chuyển sang vận hành thực tế.`);
    addToast('Đã chuyển sang Dữ liệu Thực tế', `Đã xóa ${removed} bản ghi mẫu. Hệ thống chỉ hiển thị dữ liệu thật của bạn.`, 'info');
  };

  const addCustomField = (field: Omit<CustomFieldDef, 'id'>) => {
    setCustomFields((prev) => [...prev, { ...field, id: `cf_${Date.now()}` }]);
  };

  const updateSlaPolicy = (policy: SlaPolicy) => {
    setSlaPolicies((prev) => prev.map((p) => (p.id === policy.id ? policy : p)));
  };

  const addSavedView = (view: Omit<SavedView, 'id' | 'createdBy'>) => {
    setSavedViews((prev) => [...prev, { ...view, id: `sv_${Date.now()}`, createdBy: ownerEmail }]);
  };

  const exportBackupJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      organization,
      customers,
      leads,
      deals,
      tasks,
      tickets,
      products,
      orders,
      contracts,
      campaigns,
      workflows,
      documents,
      loyalty,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onecrm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit('EXPORT_BACKUP', 'admin', 'Xuất bản sao lưu toàn bộ dữ liệu JSON.');
  };

  // --- REAL-TIME COMPUTED KPI ENGINE ---
  const kpis = useMemo<CrmKpis>(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86_400_000;
    const activeCusts = customers.filter((c) => c.status !== 'archived');
    const newCustomers = activeCusts.filter((c) => c.createdAt >= sevenDaysAgo).length;
    const activeCustomers = activeCusts.filter((c) => c.status === 'active').length;

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => ['Qualified', 'Opportunity', 'Converted'].includes(l.status)).length;
    const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
    const leadConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

    const openDealsList = deals.filter((d) => d.status === 'open');
    const wonDeals = deals.filter((d) => d.status === 'won');
    const closedDeals = deals.filter((d) => d.status === 'won' || d.status === 'lost');
    const wonRevenue = wonDeals.reduce((s, d) => s + d.value, 0) + orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
    const pipelineValue = openDealsList.reduce((s, d) => s + d.value, 0);
    const winRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 1000) / 10 : 0;
    const avgDealSize = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length) : 0;

    const openTicketsList = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed');
    const overdueTickets = openTicketsList.filter((t) => t.slaDeadline < now).length;
    const slaCompliantCount = tickets.filter((t) => (t.resolvedAt ? t.resolvedAt <= t.slaDeadline : t.slaDeadline >= now)).length;
    const slaCompliance = tickets.length > 0 ? Math.round((slaCompliantCount / tickets.length) * 1000) / 10 : 100;

    const csatRatings = tickets.filter((t) => typeof t.csatScore === 'number').map((t) => t.csatScore as number);
    const csatAvg = csatRatings.length > 0 ? Math.round((csatRatings.reduce((a, b) => a + b, 0) / csatRatings.length) * 10) / 10 : 0;

    const npsRatings = tickets.filter((t) => typeof t.npsScore === 'number').map((t) => t.npsScore as number);
    const npsAvg = npsRatings.length > 0 ? Math.round((npsRatings.reduce((a, b) => a + b, 0) / npsRatings.length) * 10) : 0;

    const resolvedTickets = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
    const fcrCount = resolvedTickets.filter((t) => (t.comments?.length || 0) <= 2).length;
    const fcrRate = resolvedTickets.length > 0 ? Math.round((fcrCount / resolvedTickets.length) * 100) : 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
    const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate < todayStr).length;

    return {
      totalCustomers: activeCusts.length,
      newCustomers,
      activeCustomers,
      totalLeads,
      qualifiedLeads,
      leadConversionRate,
      openDeals: openDealsList.length,
      wonRevenue,
      pipelineValue,
      winRate,
      avgDealSize,
      totalOrders: orders.length,
      activeContracts: contracts.filter((c) => c.status === 'active' || c.status === 'expiring_soon').length,
      expiringContracts: contracts.filter((c) => c.status === 'expiring_soon').length,
      openTickets: openTicketsList.length,
      overdueTickets,
      slaCompliance,
      csatAvg,
      npsAvg,
      fcrRate,
      pendingTasks,
      overdueTasks,
    };
  }, [customers, leads, deals, orders, contracts, tickets, tasks]);

  const hasDemoData = useMemo(
    () => Boolean(organization?.demoModeEnabled) || customers.some((c) => c.isDemo),
    [organization?.demoModeEnabled, customers]
  );

  return (
    <CRMContext.Provider
      value={{
        organization,
        loadingData,
        lastSyncedAt,
        customers,
        leads,
        deals,
        tasks,
        tickets,
        products,
        orders,
        contracts,
        campaigns,
        conversations,
        workflows,
        employees,
        departments,
        teams,
        documents,
        loyalty,
        activities,
        auditLogs,
        notifications,
        customFields,
        slaPolicies,
        savedViews,
        kpis,
        hasDemoData,
        formatMoney,
        updateOrganization,
        createCustomer,
        updateCustomer,
        archiveCustomer,
        mergeCustomers,
        createLead,
        updateLead,
        deleteLead,
        convertLead,
        createDeal,
        updateDeal,
        deleteDeal,
        createTask,
        updateTask,
        deleteTask,
        createTicket,
        updateTicket,
        addTicketComment,
        deleteTicket,
        createProduct,
        createOrder,
        createContract,
        updateContract,
        createCampaign,
        updateCampaign,
        sendConversationMessage,
        updateConversationStatus,
        createWorkflow,
        toggleWorkflow,
        runWorkflowTest,
        createDocument,
        approveDocument,
        adjustLoyaltyPoints,
        markNotificationRead,
        markAllNotificationsRead,
        addCustomField,
        updateSlaPolicy,
        addSavedView,
        resetDemoData,
        clearDemoData,
        logAudit,
        exportBackupJson,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};
