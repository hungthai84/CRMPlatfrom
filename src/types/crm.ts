export type RoleId =
  | 'super_admin'
  | 'org_owner'
  | 'org_admin'
  | 'crm_manager'
  | 'sales_manager'
  | 'sales_staff'
  | 'cs_manager'
  | 'cs_agent'
  | 'marketing_manager'
  | 'marketing_staff'
  | 'analyst'
  | 'read_only'
  | 'customer_portal';

export type ModuleKey =
  | 'dashboard'
  | 'customers'
  | 'leads'
  | 'sales'
  | 'tasks'
  | 'omnichannel'
  | 'service'
  | 'marketing'
  | 'products'
  | 'workflows'
  | 'ai'
  | 'reports'
  | 'employees'
  | 'documents'
  | 'portal'
  | 'integrations'
  | 'admin'
  | 'loyalty';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'assign'
  | 'approve'
  | 'export'
  | 'import'
  | 'manage_settings';

export type LanguageCode = 'vi' | 'en';

export interface BaseRecord {
  id: string;
  organizationId: string;
  ownerId: string;
  assignedTo?: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  status: string;
  source?: string;
  archivedAt?: number | null;
  isDemo?: boolean;
  metadata?: Record<string, unknown>;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  industry: string;
  taxId?: string;
  currency: 'VND' | 'USD';
  timezone: string;
  language: LanguageCode;
  ownerId: string;
  demoModeEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Department {
  id: string;
  organizationId: string;
  ownerId: string;
  name: string;
  code: string;
  managerId?: string;
  memberCount: number;
  isDemo?: boolean;
}

export interface Team {
  id: string;
  organizationId: string;
  ownerId: string;
  departmentId: string;
  name: string;
  leadId?: string;
  memberIds: string[];
  isDemo?: boolean;
}

export interface Employee extends BaseRecord {
  code: string;
  fullName: string;
  email: string;
  phone: string;
  role: RoleId;
  departmentId: string;
  departmentName: string;
  teamId: string;
  teamName: string;
  position: string;
  agentStatus: 'online' | 'busy' | 'away' | 'offline';
  shift: string;
  workload: number;
  kpiScore: number;
  targetRevenue: number;
  achievedRevenue: number;
  status: 'active' | 'inactive';
}

export interface CustomerConsent {
  marketingEmail: boolean;
  marketingSmsZalo: boolean;
  aiProcessing: boolean;
  thirdPartySharing: boolean;
  consentSource: string;
  consentedAt: number;
  purposeNote: string;
}

export interface Customer extends BaseRecord {
  code: string;
  type: 'individual' | 'business';
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId?: string;
  birthOrFoundedDate?: string;
  group: string;
  segment: 'Enterprise' | 'Mid-Market' | 'SMB' | 'VIP' | 'Standard';
  tags: string[];
  ownerName: string;
  score: number;
  lifetimeValue: number;
  healthScore: number;
  status: 'active' | 'inactive' | 'prospect' | 'churned' | 'archived';
  consent: CustomerConsent;
  notes?: string;
}

export type LeadStatus =
  | 'New'
  | 'Assigned'
  | 'Contacted'
  | 'Qualified'
  | 'Opportunity'
  | 'Converted'
  | 'Lost';

export interface Lead extends BaseRecord {
  code: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  source: 'Website' | 'Advertising' | 'Social' | 'Referral' | 'Import' | 'Direct';
  status: LeadStatus;
  score: number;
  estimatedValue: number;
  tags: string[];
  ownerName: string;
  lostReason?: string;
  lastContactedAt?: number;
  convertedCustomerId?: string;
  convertedDealId?: string;
  notes?: string;
}

export type DealStage =
  | 'Discovery'
  | 'Qualification'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  total: number;
}

export interface Deal extends BaseRecord {
  code: string;
  title: string;
  customerId: string;
  customerName: string;
  stage: DealStage;
  value: number;
  probability: number;
  expectedCloseDate: string;
  ownerName: string;
  discountPercent: number;
  approvalStatus: 'none' | 'pending' | 'approved' | 'rejected';
  quoteItems: QuoteItem[];
  lostReason?: string;
  status: 'open' | 'won' | 'lost';
}

export interface TaskItem extends BaseRecord {
  code: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate: string;
  type: 'task' | 'appointment' | 'follow_up' | 'meeting';
  linkedType?: 'customer' | 'lead' | 'deal' | 'ticket';
  linkedId?: string;
  linkedName?: string;
  assigneeName: string;
  subtasks: { id: string; title: string; done: boolean }[];
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export type TicketStatus = 'New' | 'Open' | 'Pending' | 'Resolved' | 'Closed';

export interface TicketComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'agent' | 'customer';
  content: string;
  isInternal: boolean;
  createdAt: number;
}

export interface Ticket extends BaseRecord {
  code: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'complaint' | 'incident' | 'inquiry';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: TicketStatus;
  customerId: string;
  customerName: string;
  assigneeName: string;
  queue: string;
  channel: 'portal' | 'email' | 'zalo' | 'facebook' | 'phone' | 'livechat';
  slaDeadline: number;
  firstResponseAt?: number;
  resolvedAt?: number;
  escalated: boolean;
  rootCause?: string;
  resolution?: string;
  csatScore?: number;
  npsScore?: number;
  comments: TicketComment[];
}

export type ChannelType = 'livechat' | 'zalo' | 'facebook' | 'instagram' | 'email' | 'sms' | 'whatsapp' | 'phone';

export interface ConversationMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  content: string;
  timestamp: number;
  isInternalNote?: boolean;
}

export interface Conversation extends BaseRecord {
  channel: ChannelType;
  customerId?: string;
  customerName: string;
  customerContact: string;
  assigneeName: string;
  status: 'open' | 'pending' | 'resolved';
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  unreadCount: number;
  slaRemainingMinutes: number;
  lastMessage: string;
  lastMessageAt: number;
  messages: ConversationMessage[];
}

export interface Campaign extends BaseRecord {
  code: string;
  name: string;
  channel: 'Email' | 'SMS' | 'Zalo' | 'Social' | 'Multi-channel';
  status: 'Draft' | 'Scheduled' | 'Active' | 'Paused' | 'Completed';
  segment: string;
  budget: number;
  spent: number;
  audienceCount: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
  leadsGenerated: number;
  revenueAttributed: number;
  startDate: string;
  endDate: string;
  utmSource: string;
  requiresConsentVerified: boolean;
}

export interface Product extends BaseRecord {
  sku: string;
  name: string;
  type: 'product' | 'service';
  category: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  status: 'active' | 'inactive';
  description: string;
}

export interface Order extends BaseRecord {
  code: string;
  customerId: string;
  customerName: string;
  dealId?: string;
  items: QuoteItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  status: 'draft' | 'confirmed' | 'processing' | 'delivered' | 'cancelled';
  orderDate: string;
}

export interface Contract extends BaseRecord {
  code: string;
  title: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  value: number;
  startDate: string;
  endDate: string;
  renewalType: 'auto' | 'manual' | 'one_time';
  approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'signed' | 'expired';
  eSignStatus: 'not_configured' | 'pending' | 'signed';
  status: 'active' | 'expiring_soon' | 'expired' | 'terminated';
}

export interface WorkflowNode {
  id: string;
  kind: 'trigger' | 'condition' | 'action' | 'delay';
  label: string;
  config: Record<string, string>;
}

export interface WorkflowRule extends BaseRecord {
  name: string;
  description: string;
  triggerEvent: string;
  enabled: boolean;
  version: number;
  runCount: number;
  lastRunAt?: number;
  status: 'active' | 'paused' | 'draft';
  nodes: WorkflowNode[];
  logs: { id: string; timestamp: number; status: 'success' | 'skipped' | 'error'; summary: string }[];
}

export interface KnowledgeDoc extends BaseRecord {
  code: string;
  title: string;
  folder: string;
  type: 'document' | 'faq' | 'sop' | 'article';
  version: string;
  visibility: 'internal' | 'customer_portal';
  approvalStatus: 'draft' | 'approved';
  content: string;
  views: number;
  status: 'published' | 'draft' | 'archived';
}

export interface LoyaltyRecord extends BaseRecord {
  customerId: string;
  customerName: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  lifetimePoints: number;
  vouchers: { code: string; discountLabel: string; expiresAt: string; used: boolean }[];
  churnRisk: 'low' | 'medium' | 'high';
  referralCount: number;
  status: 'active' | 'suspended';
}

export interface IntegrationConfig {
  id: string;
  name: string;
  category: 'messaging' | 'email' | 'telephony' | 'payment' | 'esign' | 'storage' | 'webhook';
  provider: string;
  status: 'not_connected' | 'configured_pending' | 'connected' | 'error';
  endpointUrl?: string;
  lastCheckedAt?: number;
  lastError?: string;
  docsHint: string;
  requiredEnvVars: string[];
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  ownerId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'lead' | 'customer' | 'deal' | 'ticket' | 'task' | 'sla' | 'workflow' | 'security';
  read: boolean;
  linkModule?: ModuleKey;
  createdAt: number;
}

export interface AuditLogItem {
  id: string;
  organizationId: string;
  ownerId: string;
  userId: string;
  userEmail: string;
  action: string;
  module: string;
  recordId?: string;
  details: string;
  timestamp: number;
}

export interface ActivityItem {
  id: string;
  organizationId: string;
  ownerId: string;
  entityType: 'customer' | 'lead' | 'deal' | 'ticket' | 'task';
  entityId: string;
  entityName: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change' | 'conversion';
  summary: string;
  actorName: string;
  timestamp: number;
  isDemo?: boolean;
}

export interface CustomFieldDef {
  id: string;
  module: 'customer' | 'lead' | 'ticket';
  label: string;
  key: string;
  fieldType: 'text' | 'number' | 'select' | 'date';
  required: boolean;
  options?: string[];
}

export interface SlaPolicy {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  firstResponseMinutes: number;
  resolutionHours: number;
  businessHoursOnly: boolean;
  escalationTarget: string;
}

export interface SavedView {
  id: string;
  name: string;
  module: ModuleKey;
  filters: Record<string, string>;
  createdBy: string;
}
