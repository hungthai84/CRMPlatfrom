import {
  ActivityItem,
  AuditLogItem,
  Campaign,
  Contract,
  Conversation,
  Customer,
  Deal,
  DealStage,
  Department,
  Employee,
  KnowledgeDoc,
  Lead,
  LeadStatus,
  LoyaltyRecord,
  NotificationItem,
  Order,
  Product,
  TaskItem,
  Team,
  Ticket,
  TicketStatus,
  WorkflowRule,
} from '../types/crm';

export interface DemoDatasetBundle {
  departments: (Department & { status: string; createdAt: number; updatedAt: number })[];
  teams: (Team & { status: string; createdAt: number; updatedAt: number })[];
  employees: Employee[];
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
  documents: KnowledgeDoc[];
  loyalty: LoyaltyRecord[];
  activities: ActivityItem[];
  auditLogs: AuditLogItem[];
  notifications: NotificationItem[];
}

export function buildDemoDataset(
  orgId: string,
  ownerId: string,
  ownerEmail: string
): DemoDatasetBundle {
  const now = Date.now();
  const day = 86_400_000;
  const hour = 3_600_000;

  const deptNames = [
    { id: 'dept_sales', name: 'Phòng Kinh doanh Doanh nghiệp', code: 'SALES' },
    { id: 'dept_cs', name: 'Phòng Dịch vụ Khách hàng', code: 'CSKH' },
    { id: 'dept_mkt', name: 'Phòng Tiếp thị & Tăng trưởng', code: 'MKT' },
    { id: 'dept_ops', name: 'Phòng Vận hành & Hợp đồng', code: 'OPS' },
    { id: 'dept_tech', name: 'Phòng Triển khai Kỹ thuật', code: 'TECH' },
  ];

  const departments = deptNames.map((d, idx) => ({
    id: d.id,
    organizationId: orgId,
    ownerId,
    name: d.name,
    code: d.code,
    managerId: `emp_${idx + 1}`,
    memberCount: 2,
    status: 'active',
    createdAt: now - 30 * day,
    updatedAt: now - 2 * day,
    isDemo: true,
  }));

  const teamNames = [
    { id: 'team_1', deptId: 'dept_sales', name: 'Nhóm Tư vấn Enterprise' },
    { id: 'team_2', deptId: 'dept_sales', name: 'Nhóm Bán hàng SME' },
    { id: 'team_3', deptId: 'dept_cs', name: 'Nhóm Hỗ trợ Kỹ thuật & SLA' },
    { id: 'team_4', deptId: 'dept_mkt', name: 'Nhóm Digital & Automation' },
    { id: 'team_5', deptId: 'dept_ops', name: 'Nhóm Quản lý Hợp đồng' },
  ];

  const teams = teamNames.map((t, idx) => ({
    id: t.id,
    organizationId: orgId,
    ownerId,
    departmentId: t.deptId,
    name: t.name,
    leadId: `emp_${idx + 1}`,
    memberIds: [`emp_${idx * 2 + 1}`, `emp_${idx * 2 + 2}`],
    status: 'active',
    createdAt: now - 30 * day,
    updatedAt: now - 2 * day,
    isDemo: true,
  }));

  const employeeSpecs = [
    { name: 'Trần Quốc Bảo', role: 'sales_manager' as const, dept: 0, team: 0, pos: 'Trưởng phòng Kinh doanh' },
    { name: 'Lê Minh Anh', role: 'sales_staff' as const, dept: 0, team: 0, pos: 'Chuyên viên Kinh doanh Cấp cao' },
    { name: 'Phạm Hoàng Nam', role: 'sales_staff' as const, dept: 0, team: 1, pos: 'Chuyên viên Tư vấn SME' },
    { name: 'Nguyễn Thu Thảo', role: 'cs_manager' as const, dept: 1, team: 2, pos: 'Trưởng nhóm Chăm sóc KH' },
    { name: 'Võ Hải Đăng', role: 'cs_agent' as const, dept: 1, team: 2, pos: 'Chuyên viên Hỗ trợ SLA' },
    { name: 'Đặng Bảo Ngọc', role: 'cs_agent' as const, dept: 1, team: 2, pos: 'Chuyên viên Tổng đài Đa kênh' },
    { name: 'Huỳnh Tấn Phát', role: 'marketing_manager' as const, dept: 2, team: 3, pos: 'Trưởng phòng Growth Marketing' },
    { name: 'Bùi Khánh Linh', role: 'marketing_staff' as const, dept: 2, team: 3, pos: 'Chuyên viên Automation' },
    { name: 'Đỗ Gia Huy', role: 'crm_manager' as const, dept: 3, team: 4, pos: 'Quản lý Vận hành CRM' },
    { name: 'Phan Thanh Tú', role: 'analyst' as const, dept: 4, team: 4, pos: 'Chuyên viên Phân tích BI' },
  ];

  const employees: Employee[] = employeeSpecs.map((e, i) => ({
    id: `emp_${i + 1}`,
    organizationId: orgId,
    ownerId,
    createdAt: now - 45 * day,
    createdBy: ownerId,
    updatedAt: now - day,
    updatedBy: ownerId,
    code: `NV-${String(i + 1).padStart(3, '0')}`,
    fullName: e.name,
    email: `demo.staff${i + 1}@onecrm-sample.local`,
    phone: `0901000${String(101 + i)}`,
    role: e.role,
    departmentId: departments[e.dept].id,
    departmentName: departments[e.dept].name,
    teamId: teams[e.team].id,
    teamName: teams[e.team].name,
    position: e.pos,
    agentStatus: i % 3 === 0 ? 'online' : i % 3 === 1 ? 'busy' : 'away',
    shift: i % 2 === 0 ? 'Ca Sáng (08:00 - 17:30)' : 'Ca Chiều (09:30 - 18:30)',
    workload: 45 + (i * 5) % 45,
    kpiScore: 82 + (i * 3) % 17,
    targetRevenue: 450_000_000 + i * 50_000_000,
    achievedRevenue: 340_000_000 + i * 42_000_000,
    status: 'active',
    isDemo: true,
  }));

  const customerNames = [
    { name: 'Công ty CP Giải pháp Số Phương Nam', type: 'business' as const, seg: 'Enterprise' as const, ltv: 850_000_000 },
    { name: 'Tập đoàn Logistics Đông Dương', type: 'business' as const, seg: 'Enterprise' as const, ltv: 1_250_000_000 },
    { name: 'Công ty TNHH Thương mại An Khang', type: 'business' as const, seg: 'Mid-Market' as const, ltv: 320_000_000 },
    { name: 'Phòng khám Đa khoa Quốc tế Việt Mỹ', type: 'business' as const, seg: 'VIP' as const, ltv: 540_000_000 },
    { name: 'Nguyễn Văn Hoàng (Demo)', type: 'individual' as const, seg: 'VIP' as const, ltv: 115_000_000 },
    { name: 'Công ty CP Bán lẻ Tân Tiến', type: 'business' as const, seg: 'Enterprise' as const, ltv: 720_000_000 },
    { name: 'Công ty TNHH Sản xuất Minh Long', type: 'business' as const, seg: 'Mid-Market' as const, ltv: 290_000_000 },
    { name: 'Trần Thị Mỹ Duyên (Demo)', type: 'individual' as const, seg: 'Standard' as const, ltv: 48_000_000 },
    { name: 'Hệ thống Giáo dục Sao Mai', type: 'business' as const, seg: 'Enterprise' as const, ltv: 640_000_000 },
    { name: 'Công ty CP Bất động sản Hưng Thịnh Phát', type: 'business' as const, seg: 'VIP' as const, ltv: 980_000_000 },
    { name: 'Lê Hữu Phước (Demo)', type: 'individual' as const, seg: 'SMB' as const, ltv: 62_000_000 },
    { name: 'Công ty TNHH Thực phẩm Xanh', type: 'business' as const, seg: 'SMB' as const, ltv: 145_000_000 },
    { name: 'Công ty CP Kiến trúc Á Châu', type: 'business' as const, seg: 'Mid-Market' as const, ltv: 275_000_000 },
    { name: 'Phạm Ngọc Lan (Demo)', type: 'individual' as const, seg: 'Standard' as const, ltv: 35_000_000 },
    { name: 'Công ty TNHH Dược phẩm Bảo An', type: 'business' as const, seg: 'Enterprise' as const, ltv: 590_000_000 },
    { name: 'Công ty CP Năng lượng Mặt Trời Việt', type: 'business' as const, seg: 'Enterprise' as const, ltv: 810_000_000 },
    { name: 'Chuỗi Nhà hàng Hương Biển', type: 'business' as const, seg: 'Mid-Market' as const, ltv: 240_000_000 },
    { name: 'Đào Quang Vinh (Demo)', type: 'individual' as const, seg: 'VIP' as const, ltv: 130_000_000 },
    { name: 'Công ty TNHH Cơ khí Thành Công', type: 'business' as const, seg: 'SMB' as const, ltv: 175_000_000 },
    { name: 'Công ty CP Công nghệ Tài chính K-Pay', type: 'business' as const, seg: 'Enterprise' as const, ltv: 1_120_000_000 },
    { name: 'Vũ Thị Thanh Hà (Demo)', type: 'individual' as const, seg: 'Standard' as const, ltv: 41_000_000 },
    { name: 'Công ty TNHH Nội thất Bắc Âu', type: 'business' as const, seg: 'SMB' as const, ltv: 165_000_000 },
    { name: 'Công ty CP Vận tải Biển Thái Bình', type: 'business' as const, seg: 'Mid-Market' as const, ltv: 410_000_000 },
    { name: 'Ngô Minh Triết (Demo)', type: 'individual' as const, seg: 'Standard' as const, ltv: 29_000_000 },
    { name: 'Công ty TNHH Thiết bị Y tế An Tâm', type: 'business' as const, seg: 'VIP' as const, ltv: 515_000_000 },
  ];

  const customers: Customer[] = customerNames.map((c, i) => {
    const emp = employees[i % 4];
    return {
      id: `cust_${i + 1}`,
      organizationId: orgId,
      ownerId,
      assignedTo: emp.id,
      createdAt: now - (30 - (i % 25)) * day,
      createdBy: ownerId,
      updatedAt: now - (i % 7) * day,
      updatedBy: ownerId,
      code: `KH-2026-${String(i + 1).padStart(4, '0')}`,
      type: c.type,
      name: c.name,
      phone: `0982${String(100000 + i * 137)}`,
      email: `demo.customer${i + 1}@sample-crm.local`,
      address: `${120 + i * 5} Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh`,
      taxId: c.type === 'business' ? `031${String(1000000 + i * 97)}` : '',
      group: c.type === 'business' ? 'Khách hàng B2B' : 'Khách hàng Cá nhân',
      segment: c.seg,
      tags: c.seg === 'Enterprise' ? ['Chiến lược', 'Hợp đồng năm'] : c.seg === 'VIP' ? ['Ưu tiên SLA'] : ['Tiêu chuẩn'],
      ownerName: emp.fullName,
      score: 68 + (i * 7) % 30,
      lifetimeValue: c.ltv,
      healthScore: i % 8 === 0 ? 52 : 76 + (i * 4) % 23,
      status: i === 23 ? 'churned' : i % 9 === 0 ? 'prospect' : 'active',
      source: i % 3 === 0 ? 'Website' : i % 3 === 1 ? 'Referral' : 'Direct',
      consent: {
        marketingEmail: i % 4 !== 0,
        marketingSmsZalo: i % 5 !== 0,
        aiProcessing: true,
        thirdPartySharing: false,
        consentSource: 'Biểu mẫu đăng ký dịch vụ',
        consentedAt: now - (25 - (i % 20)) * day,
        purposeNote: 'Chăm sóc khách hàng, thực hiện hợp đồng và phân tích nâng cao chất lượng dịch vụ.',
      },
      notes: 'Hồ sơ mẫu dùng cho kiểm thử quy trình Customer 360°.',
      isDemo: true,
    };
  });

  const leadStatuses: LeadStatus[] = ['New', 'Assigned', 'Contacted', 'Qualified', 'Opportunity', 'Converted', 'Lost'];
  const leadSources: Lead['source'][] = ['Website', 'Advertising', 'Social', 'Referral', 'Import', 'Direct'];

  const leads: Lead[] = Array.from({ length: 20 }, (_, i) => {
    const status = leadStatuses[i % leadStatuses.length];
    const emp = employees[i % 3];
    return {
      id: `lead_${i + 1}`,
      organizationId: orgId,
      ownerId,
      assignedTo: emp.id,
      createdAt: now - (18 - (i % 15)) * day,
      createdBy: ownerId,
      updatedAt: now - (i % 5) * day,
      updatedBy: ownerId,
      code: `LD-${String(i + 1).padStart(4, '0')}`,
      name: `Khách hàng tiềm năng Demo #${i + 1}`,
      company: i % 2 === 0 ? `Doanh nghiệp Mẫu ${i + 1} JSC` : '',
      phone: `0913${String(200000 + i * 199)}`,
      email: `demo.lead${i + 1}@sample-lead.local`,
      source: leadSources[i % leadSources.length],
      status,
      score: 45 + (i * 11) % 52,
      estimatedValue: 80_000_000 + (i % 6) * 65_000_000,
      tags: i % 3 === 0 ? ['Nóng', 'Demo Q4'] : ['Cần tư vấn'],
      ownerName: emp.fullName,
      lostReason: status === 'Lost' ? 'Ngân sách chưa phù hợp quý này' : undefined,
      lastContactedAt: status === 'New' ? undefined : now - (i % 4) * day,
      convertedCustomerId: status === 'Converted' ? customers[i % customers.length].id : undefined,
      notes: 'Lead mẫu liên kết với quy trình chuyển đổi không trùng lặp.',
      isDemo: true,
    };
  });

  const dealStages: DealStage[] = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const deals: Deal[] = Array.from({ length: 12 }, (_, i) => {
    const cust = customers[i];
    const stage = dealStages[i % dealStages.length];
    const emp = employees[i % 3];
    const val = 120_000_000 + i * 55_000_000;
    return {
      id: `deal_${i + 1}`,
      organizationId: orgId,
      ownerId,
      assignedTo: emp.id,
      createdAt: now - (20 - i) * day,
      createdBy: ownerId,
      updatedAt: now - (i % 4) * day,
      updatedBy: ownerId,
      code: `OPP-2026-${String(i + 1).padStart(3, '0')}`,
      title: `Triển khai Gói Enterprise CRM – ${cust.name.slice(0, 28)}`,
      customerId: cust.id,
      customerName: cust.name,
      stage,
      value: val,
      probability: stage === 'Closed Won' ? 100 : stage === 'Closed Lost' ? 0 : 25 + (i % 4) * 20,
      expectedCloseDate: new Date(now + (10 + i * 3) * day).toISOString().slice(0, 10),
      ownerName: emp.fullName,
      discountPercent: i % 3 === 0 ? 5 : 0,
      approvalStatus: i % 3 === 0 ? 'approved' : 'none',
      quoteItems: [
        {
          productId: `prod_${(i % 5) + 1}`,
          productName: `Gói bản quyền ONECRM Enterprise (${i + 10} users)`,
          quantity: 1,
          unitPrice: val,
          discountPercent: 0,
          total: val,
        },
      ],
      status: stage === 'Closed Won' ? 'won' : stage === 'Closed Lost' ? 'lost' : 'open',
      isDemo: true,
    };
  });

  const products: Product[] = Array.from({ length: 15 }, (_, i) => ({
    id: `prod_${i + 1}`,
    organizationId: orgId,
    ownerId,
    createdAt: now - 40 * day,
    createdBy: ownerId,
    updatedAt: now - 5 * day,
    updatedBy: ownerId,
    sku: `SKU-${String(i + 101)}`,
    name:
      i < 8
        ? `Gói phần mềm ONECRM Tier ${i + 1}`
        : `Dịch vụ Triển khai & Đào tạo Chuyên sâu #${i - 7}`,
    type: i < 8 ? 'product' : 'service',
    category: i < 5 ? 'CRM Core' : i < 10 ? 'AI & Automation' : 'Professional Services',
    unit: i < 8 ? 'Gói/Năm' : 'Dự án',
    price: 25_000_000 + i * 12_000_000,
    cost: 10_000_000 + i * 4_500_000,
    stock: i < 8 ? 999 : 50,
    status: 'active',
    description: 'Sản phẩm/dịch vụ chuẩn trong danh mục bảng giá doanh nghiệp.',
    isDemo: true,
  }));

  const orders: Order[] = Array.from({ length: 10 }, (_, i) => {
    const cust = customers[i];
    const prod = products[i];
    const total = prod.price * ((i % 2) + 1);
    return {
      id: `ord_${i + 1}`,
      organizationId: orgId,
      ownerId,
      createdAt: now - (15 - i) * day,
      createdBy: ownerId,
      updatedAt: now - day,
      updatedBy: ownerId,
      code: `DH-2026-${String(i + 1).padStart(4, '0')}`,
      customerId: cust.id,
      customerName: cust.name,
      dealId: deals[i]?.id,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity: (i % 2) + 1,
          unitPrice: prod.price,
          discountPercent: 0,
          total,
        },
      ],
      subtotal: total,
      discountAmount: 0,
      totalAmount: total,
      paymentStatus: i < 7 ? 'paid' : i === 7 ? 'partial' : 'unpaid',
      status: i < 6 ? 'delivered' : i < 8 ? 'processing' : 'confirmed',
      orderDate: new Date(now - (15 - i) * day).toISOString().slice(0, 10),
      isDemo: true,
    };
  });

  const contracts: Contract[] = Array.from({ length: 10 }, (_, i) => {
    const cust = customers[i];
    const ord = orders[i];
    const expiringSoon = i === 2 || i === 5;
    return {
      id: `ctr_${i + 1}`,
      organizationId: orgId,
      ownerId,
      createdAt: now - (25 - i) * day,
      createdBy: ownerId,
      updatedAt: now - 2 * day,
      updatedBy: ownerId,
      code: `HD-2026-${String(i + 1).padStart(3, '0')}`,
      title: `Hợp đồng Cung cấp Nền tảng CRM – ${cust.name.slice(0, 26)}`,
      customerId: cust.id,
      customerName: cust.name,
      orderId: ord.id,
      value: ord.totalAmount,
      startDate: new Date(now - 180 * day).toISOString().slice(0, 10),
      endDate: new Date(now + (expiringSoon ? 12 : 180 + i * 10) * day).toISOString().slice(0, 10),
      renewalType: i % 2 === 0 ? 'auto' : 'manual',
      approvalStatus: i < 8 ? 'signed' : 'pending_approval',
      eSignStatus: 'not_configured',
      status: expiringSoon ? 'expiring_soon' : 'active',
      isDemo: true,
    };
  });

  const tasks: TaskItem[] = Array.from({ length: 20 }, (_, i) => {
    const cust = customers[i % customers.length];
    const emp = employees[i % employees.length];
    const statuses: TaskItem['status'][] = ['todo', 'in_progress', 'review', 'done'];
    const priorities: TaskItem['priority'][] = ['low', 'medium', 'high', 'urgent'];
    const types: TaskItem['type'][] = ['task', 'follow_up', 'appointment', 'meeting'];
    return {
      id: `task_${i + 1}`,
      organizationId: orgId,
      ownerId,
      assignedTo: emp.id,
      createdAt: now - (10 - (i % 9)) * day,
      createdBy: ownerId,
      updatedAt: now - day,
      updatedBy: ownerId,
      code: `CV-${String(i + 1).padStart(3, '0')}`,
      title:
        i % 2 === 0
          ? `Gọi tư vấn & gửi báo giá cho ${cust.name.slice(0, 24)}`
          : `Họp rà soát tiến độ triển khai – ${cust.name.slice(0, 22)}`,
      description: 'Công việc được liên kết trực tiếp với hồ sơ Customer 360°.',
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      dueDate: new Date(now + (i % 5 === 0 ? -2 : i % 10) * day).toISOString().slice(0, 10),
      type: types[i % types.length],
      linkedType: 'customer',
      linkedId: cust.id,
      linkedName: cust.name,
      assigneeName: emp.fullName,
      subtasks: [
        { id: 'st_1', title: 'Kiểm tra lịch sử tương tác', done: i % 2 === 0 },
        { id: 'st_2', title: 'Cập nhật biên bản làm việc', done: false },
      ],
      recurring: 'none',
      isDemo: true,
    };
  });

  const ticketStatuses: TicketStatus[] = ['New', 'Open', 'Pending', 'Resolved', 'Closed'];
  const ticketCats: Ticket['category'][] = ['technical', 'billing', 'complaint', 'incident', 'inquiry'];
  const ticketPrios: Ticket['priority'][] = ['low', 'medium', 'high', 'urgent'];

  const tickets: Ticket[] = Array.from({ length: 20 }, (_, i) => {
    const cust = customers[i % customers.length];
    const emp = employees[3 + (i % 3)];
    const status = ticketStatuses[i % ticketStatuses.length];
    const prio = ticketPrios[i % ticketPrios.length];
    return {
      id: `tkt_${i + 1}`,
      organizationId: orgId,
      ownerId,
      assignedTo: emp.id,
      createdAt: now - (12 - (i % 10)) * day,
      createdBy: ownerId,
      updatedAt: now - (i % 3) * hour,
      updatedBy: ownerId,
      code: `TK-2026-${String(i + 1).padStart(4, '0')}`,
      title:
        i % 3 === 0
          ? `Yêu cầu cấu hình phân quyền dữ liệu – ${cust.name.slice(0, 20)}`
          : i % 3 === 1
          ? `Hỗ trợ đối soát hóa đơn & gia hạn – ${cust.name.slice(0, 20)}`
          : `Kiểm tra đồng bộ API Webhook – ${cust.name.slice(0, 20)}`,
      description: 'Yêu cầu hỗ trợ được ghi nhận từ hệ thống Ticket & SLA.',
      category: ticketCats[i % ticketCats.length],
      priority: prio,
      status,
      customerId: cust.id,
      customerName: cust.name,
      assigneeName: emp.fullName,
      queue: prio === 'urgent' ? 'Hàng đợi Khẩn cấp SLA' : 'Hàng đợi Hỗ trợ Chuẩn',
      channel: i % 3 === 0 ? 'portal' : i % 3 === 1 ? 'email' : 'zalo',
      slaDeadline: now + (i % 4 === 0 && status !== 'Resolved' && status !== 'Closed' ? -3 * hour : 18 * hour),
      firstResponseAt: now - 4 * hour,
      resolvedAt: status === 'Resolved' || status === 'Closed' ? now - hour : undefined,
      escalated: prio === 'urgent',
      rootCause: status === 'Resolved' || status === 'Closed' ? 'Cấu hình quyền truy cập nhóm chưa đồng bộ' : undefined,
      resolution: status === 'Resolved' || status === 'Closed' ? 'Đã cập nhật lại RBAC và xác nhận với khách hàng' : undefined,
      csatScore: status === 'Resolved' || status === 'Closed' ? 4 + (i % 2) : undefined,
      npsScore: status === 'Resolved' || status === 'Closed' ? 8 + (i % 3) : undefined,
      comments: [
        {
          id: `cmt_${i}_1`,
          authorId: emp.id,
          authorName: emp.fullName,
          authorRole: 'agent',
          content: 'Đã tiếp nhận yêu cầu và đang kiểm tra cấu hình hệ thống cho quý khách.',
          isInternal: false,
          createdAt: now - 3 * hour,
        },
      ],
      isDemo: true,
    };
  });

  const campaigns: Campaign[] = Array.from({ length: 10 }, (_, i) => ({
    id: `cmp_${i + 1}`,
    organizationId: orgId,
    ownerId,
    createdAt: now - (25 - i * 2) * day,
    createdBy: ownerId,
    updatedAt: now - day,
    updatedBy: ownerId,
    code: `MKT-2026-${String(i + 1).padStart(2, '0')}`,
    name: `Chiến dịch Tăng trưởng Quý ${((i % 4) + 1)} – Tuyến #${i + 1}`,
    channel: (['Email', 'Zalo', 'Social', 'SMS', 'Multi-channel'] as const)[i % 5],
    status: i < 4 ? 'Active' : i < 7 ? 'Completed' : 'Draft',
    segment: i % 2 === 0 ? 'Enterprise & VIP' : 'Khách hàng SME tiềm năng',
    budget: 35_000_000 + i * 10_000_000,
    spent: 20_000_000 + i * 6_500_000,
    audienceCount: 400 + i * 150,
    sentCount: i < 7 ? 380 + i * 120 : 0,
    openRate: 28 + (i * 3) % 24,
    clickRate: 6.5 + (i % 7),
    leadsGenerated: i < 7 ? 18 + i * 7 : 0,
    revenueAttributed: i < 7 ? 140_000_000 + i * 45_000_000 : 0,
    startDate: new Date(now - 15 * day).toISOString().slice(0, 10),
    endDate: new Date(now + 20 * day).toISOString().slice(0, 10),
    utmSource: i % 2 === 0 ? 'onecrm_email' : 'onecrm_social',
    requiresConsentVerified: true,
    isDemo: true,
  }));

  const conversations: Conversation[] = Array.from({ length: 6 }, (_, i) => {
    const cust = customers[i];
    const channels: Conversation['channel'][] = ['livechat', 'zalo', 'facebook', 'email', 'whatsapp', 'phone'];
    return {
      id: `conv_${i + 1}`,
      organizationId: orgId,
      ownerId,
      assignedTo: employees[4 + (i % 2)].id,
      createdAt: now - (i + 1) * hour,
      createdBy: ownerId,
      updatedAt: now - i * 15 * 60_000,
      updatedBy: ownerId,
      channel: channels[i],
      customerId: cust.id,
      customerName: cust.name,
      customerContact: cust.phone,
      assigneeName: employees[4 + (i % 2)].fullName,
      status: i < 3 ? 'open' : i < 5 ? 'pending' : 'resolved',
      sentiment: i === 2 ? 'negative' : i % 2 === 0 ? 'positive' : 'neutral',
      tags: ['Demo', channels[i].toUpperCase()],
      unreadCount: i < 2 ? 2 : 0,
      slaRemainingMinutes: 15 + i * 12,
      lastMessage: 'Xin chào đội ngũ hỗ trợ, bên mình cần kiểm tra tiến độ hợp đồng và báo giá mở rộng.',
      lastMessageAt: now - i * 18 * 60_000,
      messages: [
        {
          id: 'm_1',
          sender: 'customer',
          senderName: cust.name,
          content: 'Xin chào đội ngũ hỗ trợ, bên mình cần kiểm tra tiến độ hợp đồng và báo giá mở rộng.',
          timestamp: now - 40 * 60_000,
        },
        {
          id: 'm_2',
          sender: 'agent',
          senderName: employees[4 + (i % 2)].fullName,
          content: 'Chào anh/chị, em đã tiếp nhận thông tin trên hồ sơ Customer 360° và đang kiểm tra ngay ạ.',
          timestamp: now - 25 * 60_000,
        },
      ],
      isDemo: true,
    };
  });

  const workflows: WorkflowRule[] = [
    {
      id: 'wf_1',
      organizationId: orgId,
      ownerId,
      createdAt: now - 20 * day,
      createdBy: ownerId,
      updatedAt: now - 2 * day,
      updatedBy: ownerId,
      name: 'Phân công Lead mới & Tạo Task tiếp cận trong 15 phút',
      description: 'Khi có Lead mới → Kiểm tra trùng → Chấm điểm → Phân công tự động → Tạo Task nhắc hẹn.',
      triggerEvent: 'lead.created',
      enabled: true,
      version: 2,
      runCount: 42,
      lastRunAt: now - 2 * hour,
      status: 'active',
      nodes: [
        { id: 'n1', kind: 'trigger', label: 'Lead mới được tạo', config: { event: 'lead.created' } },
        { id: 'n2', kind: 'condition', label: 'Điểm Lead >= 60 hoặc nguồn Website', config: { minScore: '60' } },
        { id: 'n3', kind: 'action', label: 'Tự động phân công nhóm Sales Enterprise', config: { team: 'team_1' } },
        { id: 'n4', kind: 'action', label: 'Tạo Task gọi lại trong 15 phút', config: { priority: 'high' } },
      ],
      logs: [
        { id: 'wl_1', timestamp: now - 2 * hour, status: 'success', summary: 'Đã phân công LD-0018 cho Lê Minh Anh & tạo Task CV-020' },
      ],
      isDemo: true,
    },
    {
      id: 'wf_2',
      organizationId: orgId,
      ownerId,
      createdAt: now - 15 * day,
      createdBy: ownerId,
      updatedAt: now - day,
      updatedBy: ownerId,
      name: 'Cảnh báo Ticket sắp quá hạn SLA',
      description: 'Tự động leo thang (Escalate) cho Trưởng bộ phận CSKH khi còn < 30 phút SLA.',
      triggerEvent: 'ticket.sla_warning',
      enabled: true,
      version: 1,
      runCount: 15,
      lastRunAt: now - 5 * hour,
      status: 'active',
      nodes: [
        { id: 'n1', kind: 'trigger', label: 'SLA còn dưới 30 phút', config: { thresholdMinutes: '30' } },
        { id: 'n2', kind: 'condition', label: 'Trạng thái khác Resolved/Closed', config: { statusNotIn: 'Resolved,Closed' } },
        { id: 'n3', kind: 'action', label: 'Gửi cảnh báo khẩn cho CS Manager', config: { target: 'cs_manager' } },
      ],
      logs: [
        { id: 'wl_2', timestamp: now - 5 * hour, status: 'success', summary: 'Đã cảnh báo SLA cho TK-2026-0001' },
      ],
      isDemo: true,
    },
  ];

  const documents: KnowledgeDoc[] = [
    {
      id: 'doc_1',
      organizationId: orgId,
      ownerId,
      createdAt: now - 20 * day,
      createdBy: ownerId,
      updatedAt: now - 2 * day,
      updatedBy: ownerId,
      code: 'KB-001',
      title: 'Quy trình chuyển đổi Lead thành Khách hàng & Cơ hội (SOP)',
      folder: 'Quy trình Bán hàng (SOP)',
      type: 'sop',
      version: 'v2.1',
      visibility: 'internal',
      approvalStatus: 'approved',
      content: 'Trước khi chuyển đổi Lead thành Customer, hệ thống tự động đối chiếu Email và Số điện thoại để tránh tạo bản ghi trùng lặp.',
      views: 128,
      status: 'published',
      isDemo: true,
    },
    {
      id: 'doc_2',
      organizationId: orgId,
      ownerId,
      createdAt: now - 14 * day,
      createdBy: ownerId,
      updatedAt: now - day,
      updatedBy: ownerId,
      code: 'FAQ-002',
      title: 'Chính sách bảo vệ dữ liệu cá nhân & Quản lý sự đồng ý (VN PDPL)',
      folder: 'Pháp lý & Bảo mật',
      type: 'faq',
      version: 'v1.4',
      visibility: 'customer_portal',
      approvalStatus: 'approved',
      content: 'Khách hàng có quyền xem, cập nhật hoặc rút lại sự đồng ý sử dụng dữ liệu cho mục đích tiếp thị và AI bất kỳ lúc nào.',
      views: 215,
      status: 'published',
      isDemo: true,
    },
    {
      id: 'doc_3',
      organizationId: orgId,
      ownerId,
      createdAt: now - 10 * day,
      createdBy: ownerId,
      updatedAt: now - day,
      updatedBy: ownerId,
      code: 'DOC-003',
      title: 'Cam kết thời gian phản hồi SLA theo mức độ ưu tiên Ticket',
      folder: 'Dịch vụ Khách hàng',
      type: 'article',
      version: 'v1.0',
      visibility: 'customer_portal',
      approvalStatus: 'approved',
      content: 'Khẩn cấp (Urgent): Phản hồi đầu tiên <= 15 phút, xử lý <= 4 giờ. Cao (High): Phản hồi <= 30 phút, xử lý <= 8 giờ.',
      views: 164,
      status: 'published',
      isDemo: true,
    },
  ];

  const loyalty: LoyaltyRecord[] = customers.slice(0, 10).map((c, i) => ({
    id: `loy_${i + 1}`,
    organizationId: orgId,
    ownerId,
    createdAt: now - 20 * day,
    createdBy: ownerId,
    updatedAt: now - day,
    updatedBy: ownerId,
    customerId: c.id,
    customerName: c.name,
    tier: c.segment === 'Enterprise' ? 'Platinum' : c.segment === 'VIP' ? 'Gold' : c.segment === 'Mid-Market' ? 'Silver' : 'Bronze',
    points: 1200 + i * 450,
    lifetimePoints: 3500 + i * 900,
    vouchers: [
      {
        code: `ONEVIP-${2026 + i}`,
        discountLabel: 'Ưu đãi 10% gia hạn gói năm',
        expiresAt: new Date(now + 45 * day).toISOString().slice(0, 10),
        used: false,
      },
    ],
    churnRisk: c.healthScore < 60 ? 'high' : c.healthScore < 75 ? 'medium' : 'low',
    referralCount: i % 4,
    status: 'active',
    isDemo: true,
  }));

  const activities: ActivityItem[] = [
    {
      id: 'act_1',
      organizationId: orgId,
      ownerId,
      entityType: 'customer',
      entityId: customers[0].id,
      entityName: customers[0].name,
      type: 'meeting',
      summary: 'Trình bày giải pháp Customer 360° & AI Copilot cho Ban Giám đốc.',
      actorName: employees[0].fullName,
      timestamp: now - 3 * hour,
      isDemo: true,
    },
    {
      id: 'act_2',
      organizationId: orgId,
      ownerId,
      entityType: 'ticket',
      entityId: tickets[0].id,
      entityName: tickets[0].code,
      type: 'status_change',
      summary: 'Chuyển trạng thái Ticket sang Đang xử lý và gán nhóm SLA.',
      actorName: employees[3].fullName,
      timestamp: now - 5 * hour,
      isDemo: true,
    },
  ];

  const auditLogs: AuditLogItem[] = [
    {
      id: `aud_seed_${now}`,
      organizationId: orgId,
      ownerId,
      userId: ownerId,
      userEmail: ownerEmail,
      action: 'SEED_DEMO_DATA',
      module: 'admin',
      details: 'Khởi tạo bộ dữ liệu mẫu liên kết đa phân hệ (Demo Mode).',
      timestamp: now - hour,
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif_1',
      organizationId: orgId,
      ownerId,
      userId: ownerId,
      title: 'Cảnh báo Ticket sắp quá hạn SLA',
      message: `${tickets[0].code} (${tickets[0].customerName}) cần phản hồi ưu tiên.`,
      type: 'warning',
      category: 'sla',
      read: false,
      linkModule: 'service',
      createdAt: now - 25 * 60_000,
    },
    {
      id: 'notif_2',
      organizationId: orgId,
      ownerId,
      userId: ownerId,
      title: 'Hợp đồng sắp hết hạn gia hạn',
      message: `${contracts[2].code} của ${contracts[2].customerName} còn 12 ngày.`,
      type: 'info',
      category: 'deal',
      read: false,
      linkModule: 'products',
      createdAt: now - 2 * hour,
    },
  ];

  return {
    departments,
    teams,
    employees,
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
    documents,
    loyalty,
    activities,
    auditLogs,
    notifications,
  };
}
