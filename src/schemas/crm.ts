import { z } from 'zod';

export const customerSchema = z.object({
  type: z.enum(['individual', 'business']),
  name: z.string().trim().min(2, 'Tên khách hàng tối thiểu 2 ký tự').max(120, 'Tối đa 120 ký tự'),
  phone: z.string().trim().min(8, 'Số điện thoại không hợp lệ').max(20, 'Tối đa 20 ký tự'),
  email: z.string().trim().email('Email không đúng định dạng').max(120, 'Tối đa 120 ký tự'),
  address: z.string().trim().max(250, 'Tối đa 250 ký tự').optional().default(''),
  taxId: z.string().trim().max(30, 'Mã số thuế tối đa 30 ký tự').optional().default(''),
  group: z.string().trim().min(1).max(60),
  segment: z.enum(['Enterprise', 'Mid-Market', 'SMB', 'VIP', 'Standard']),
  source: z.string().trim().max(60).optional().default('Direct'),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  notes: z.string().max(2000).optional().default(''),
});

export const leadSchema = z.object({
  name: z.string().trim().min(2, 'Tên Lead tối thiểu 2 ký tự').max(120),
  company: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().min(8, 'Số điện thoại không hợp lệ').max(20),
  email: z.string().trim().email('Email không hợp lệ').max(120),
  source: z.enum(['Website', 'Advertising', 'Social', 'Referral', 'Import', 'Direct']),
  estimatedValue: z.number().min(0, 'Giá trị phải >= 0'),
  notes: z.string().max(2000).optional().default(''),
});

export const dealSchema = z.object({
  title: z.string().trim().min(3, 'Tên cơ hội tối thiểu 3 ký tự').max(150),
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  value: z.number().min(0, 'Giá trị phải >= 0'),
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.string().min(4, 'Chọn ngày dự kiến chốt'),
  discountPercent: z.number().min(0).max(100).default(0),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'Tiêu đề tối thiểu 2 ký tự').max(160),
  description: z.string().max(2000).optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().min(4, 'Chọn hạn hoàn thành'),
  type: z.enum(['task', 'appointment', 'follow_up', 'meeting']),
  linkedType: z.enum(['customer', 'lead', 'deal', 'ticket']).optional(),
  linkedId: z.string().optional(),
});

export const ticketSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề ticket tối thiểu 3 ký tự').max(200),
  description: z.string().trim().min(5, 'Mô tả chi tiết tối thiểu 5 ký tự').max(5000),
  category: z.enum(['technical', 'billing', 'complaint', 'incident', 'inquiry']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  channel: z.enum(['portal', 'email', 'zalo', 'facebook', 'phone', 'livechat']).default('portal'),
});

export const productSchema = z.object({
  sku: z.string().trim().min(2, 'SKU tối thiểu 2 ký tự').max(40),
  name: z.string().trim().min(2, 'Tên sản phẩm tối thiểu 2 ký tự').max(140),
  type: z.enum(['product', 'service']),
  category: z.string().trim().min(1).max(60),
  unit: z.string().trim().min(1).max(30),
  price: z.number().min(0),
  cost: z.number().min(0),
  stock: z.number().min(0),
  description: z.string().max(1000).optional().default(''),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(3, 'Tên chiến dịch tối thiểu 3 ký tự').max(140),
  channel: z.enum(['Email', 'SMS', 'Zalo', 'Social', 'Multi-channel']),
  segment: z.string().trim().min(1),
  budget: z.number().min(0),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  utmSource: z.string().trim().max(80).default('onecrm'),
});
