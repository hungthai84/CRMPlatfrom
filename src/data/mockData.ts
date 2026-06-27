import { Customer, Opportunity, Ticket, Campaign, AIInsight } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: 'CUS-001',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    phone: '0901234567',
    avatar: 'https://i.pravatar.cc/150?u=1',
    tier: 'Platinum',
    loyaltyPoints: 12500,
    segment: 'High Value',
    lifetimeValue: 150000000,
    lastInteraction: '2026-05-30T10:30:00Z',
    churnRisk: 'Low'
  },
  {
    id: 'CUS-002',
    name: 'Trần Thị Bích',
    email: 'bich.tran@corporate.vn',
    phone: '0987654321',
    avatar: 'https://i.pravatar.cc/150?u=2',
    tier: 'Diamond',
    loyaltyPoints: 45000,
    segment: 'Corporate',
    lifetimeValue: 850000000,
    lastInteraction: '2026-05-29T14:15:00Z',
    churnRisk: 'Medium'
  },
  {
    id: 'CUS-003',
    name: 'Lê Hoàng Phong',
    email: 'phong.le@gmail.com',
    phone: '0912345678',
    avatar: 'https://i.pravatar.cc/150?u=3',
    tier: 'Member',
    loyaltyPoints: 150,
    segment: 'Retail',
    lifetimeValue: 2000000,
    lastInteraction: '2026-05-20T09:00:00Z',
    churnRisk: 'High'
  }
];

export const mockOpportunities: Opportunity[] = [
  { id: 'OPP-01', title: 'Hợp Đồng Cung Cấp Laptop Q3', company: 'Techcom Corp', amount: 450000000, stage: 'Negotiation', probability: 80, expectedClose: '2026-06-15' },
  { id: 'OPP-02', title: 'Triển khai CRM cho Chuỗi', company: 'RetailX', amount: 120000000, stage: 'Proposal', probability: 40, expectedClose: '2026-06-30' },
  { id: 'OPP-03', title: 'Gói chăm sóc Server năm 2026', company: 'ABC Logistics', amount: 50000000, stage: 'Qualification', probability: 20, expectedClose: '2026-07-01' },
  { id: 'OPP-04', title: 'Đại tu hệ thống POS toàn quốc', company: 'WinMart', amount: 890000000, stage: 'Closed Won', probability: 100, expectedClose: '2026-05-28' },
  { id: 'OPP-05', title: 'Máy làm lạnh CN khu vực Nam', company: 'CoolingTech', amount: 30000000, stage: 'Lead', probability: 10, expectedClose: '2026-08-10' },
];

export const mockLeadsData = [
  { id: 'LD-101', name: 'Phạm Minh Trí', company: 'TechVina Corp', value: 15000000, priority: 'High', status: 'Mới', phone: '0901234555' },
  { id: 'LD-102', name: 'Trần Cường', company: 'Đầu tư Á Châu', value: 34000000, priority: 'Medium', status: 'Mới', phone: '0983444222' },
  { id: 'LD-103', name: 'Lê Kiều Trang', company: 'Sơn Hà Group', value: 12000000, priority: 'Low', status: 'Mới', phone: '0912333211' },
  { id: 'LD-104', name: 'Đặng Quốc Anh', company: 'BĐS Hải Đường', value: 45000000, priority: 'High', status: 'Đang gọi', phone: '0934111222' },
  { id: 'LD-105', name: 'Vũ Thị Mai', company: 'Y tế Hoàn Mỹ', value: 25000000, priority: 'Low', status: 'Đang gọi', phone: '0977888999' },
];

export const mockTickets: Ticket[] = [
  { 
    id: 'TCK-9001', 
    ticketId: 'YT-2026-09001',
    title: 'Lỗi đồng bộ ERP - POS cửa hàng D1', 
    description: 'Dữ liệu tồn kho không khớp giữa ERP và POS',
    customerName: 'Trần Thị Bích', 
    customerId: 'CUS-001',
    status: 'new', 
    priority: 'high', 
    category: 'technical',
    source: 'chat',
    ownerId: 'dummy_owner',
    slaDeadline: Date.now() + 3600000,
    createdAt: Date.now(), 
    updatedAt: Date.now() 
  },
  { 
    id: 'TCK-9002', 
    ticketId: 'YT-2026-09002',
    title: 'Hỏi về chính sách bảo hành Laptop', 
    description: 'Khách muốn gia hạn bảo hành lên 3 năm',
    customerName: 'Nguyễn Văn An', 
    customerId: 'CUS-002',
    status: 'pending', 
    priority: 'medium', 
    category: 'consultancy',
    source: 'email',
    ownerId: 'dummy_owner',
    slaDeadline: Date.now() + 86400000,
    createdAt: Date.now(), 
    updatedAt: Date.now() 
  },
  { 
    id: 'TCK-9003', 
    ticketId: 'YT-2026-09003',
    title: 'Refund đơn hàng #89324', 
    description: 'Khách hàng trả hàng do lỗi kỹ thuật',
    customerName: 'Lê Hoàng Phong', 
    customerId: 'CUS-003',
    status: 'resolved', 
    priority: 'urgent', 
    category: 'billing',
    source: 'zalo',
    ownerId: 'dummy_owner',
    slaDeadline: Date.now() - 3600000,
    createdAt: Date.now(), 
    updatedAt: Date.now() 
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'CAM-01',
    name: 'Khởi động Hè 2026',
    type: 'Email',
    status: 'Active',
    budget: 50000000,
    spent: 12000000,
    leads: 320,
    conversion: 15.4,
    startDate: '2026-05-01',
    endDate: '2026-06-30'
  }
];

export const mockInsights: AIInsight[] = [
  {
    id: 'INS-01',
    type: 'churn_risk',
    severity: 'high',
    title: 'Nguy cơ rời bỏ: CUS-003',
    description: 'Tương tác giảm mạnh trong tháng qua',
    targetId: 'CUS-003',
    targetName: 'Lê Hoàng Phong',
    recommendation: 'Gửi voucher giảm giá 50% ngay lập tức',
    createdAt: Date.now()
  }
];
