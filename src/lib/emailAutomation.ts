import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'sales' | 'support' | 'followup' | 'other';
  lastModified: number;
}

export interface EmailAutomationRule {
  id: string;
  name: string;
  triggerStage: 'Awareness' | 'Consideration' | 'Purchase' | 'Retention' | 'Loyalty';
  templateId: string;
  isActive: boolean;
  createdAt: number;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  ruleName: string;
  customerName: string;
  customerEmail: string;
  templateName: string;
  subject: string;
  status: 'Gửi thành công' | 'Lỗi';
}

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'temp-1',
    name: 'Chào mừng Khách hàng mới (Onboarding)',
    subject: 'Chào mừng {customer_name} đến với hệ sinh thái Power Service!',
    body: 'Kính gửi {customer_name},\n\nTôi là Hùng Thái, đại diện hỗ trợ tài khoản của quý khách tại Power Service CRM. Chúng tôi vô cùng trân quý khi được hợp tác cùng doanh nghiệp của bạn.\n\nTrong tuần đầu tiên này, hệ thống sẽ gửi các chỉ dẫn cơ bản để đội ngũ của quý khách làm quen nhanh chóng. Nếu có bất cứ vướng mắc gì, xin vui lòng phản hồi email này hoặc gọi hotline hỗ trợ của chúng tôi.\n\nTrân trọng,\nHùng Thái - Power Service CRM.',
    category: 'welcome',
    lastModified: Date.now() - 2 * 24 * 3600000
  },
  {
    id: 'temp-2',
    name: 'Báo giá Gia hạn & Nâng cấp Dịch vụ',
    subject: 'Đề xuất Báo giá Gia dịch vụ & Thăng hạng Thân thiết - {customer_name}',
    body: 'Xin chào {customer_name},\n\nNhư đã thảo luận trong lịch hẹn chăm sóc trước đó, tôi xin phép gửi đề xuất báo giá gia hạn gói giải pháp CRM nâng cao của doanh nghiệp kèm theo ưu đãi nâng cấp lên tính năng họp trực tuyến HD trực tiếp cho đội ngũ CSKH.\n\nDoanh nghiệp của bạn sẽ được thăng hạng Loyalty lên mức Platinum với đầy đủ đặc quyền hỗ trợ lỗi 24/7 tức thì.\n\nQuý khách vui lòng xem chi tiết báo giá đính kèm và phản hồi để chúng tôi tiến hành chuẩn bị hợp đồng trước ngày {follow_up_date}.\n\nTrân trọng,\nĐội ngũ CSKH Power Service.',
    category: 'sales',
    lastModified: Date.now() - 5 * 24 * 3600000
  },
  {
    id: 'temp-3',
    name: 'Khảo sát Ý kiến & Đánh giá mức độ hài lòng',
    subject: 'Ý kiến đóng góp từ {customer_name} giúp hoàn thiện dịch vụ hỗ trợ',
    body: 'Kính gửi {customer_name},\n\nChúng tôi ghi nhận phiếu hỗ trợ kỹ thuật của Quý khách liên quan đến cấu hình hệ thống vừa được xử lý thành công vào ngày vừa qua.\n\nĐể giúp chúng tôi liên tục cải tiến chất lượng chăm sóc, rất mong {customer_name} dành 1 phút để thực hiện khảo sát ngắn sau đây:\nLink khảo sát: https://crm.powerservice.com/survey/{customer_id}\n\nXin chân thành cảm ơn sự đồng hành và những góp ý chân thành từ quý khách!\n\nĐội ngũ Kỹ thuật CSKH.',
    category: 'support',
    lastModified: Date.now() - 10 * 24 * 3600000
  },
  {
    id: 'temp-4',
    name: '[Tự động] Chăm sóc Leads trễ tương tác (>7 Ngày)',
    subject: 'Power Service CRM hỗ trợ: Tiếp tục trao đổi đề xuất cùng {customer_name}',
    body: 'Kính gửi {customer_name},\n\nTôi liên hệ lại từ đội ngũ Power Service CRM. Chúng tôi nhận thấy đã hơn 1 tuần trôi qua kể từ khi ghi nhận yêu cầu tư vấn ban đầu của Quý khách liên quan đến giải pháp quản trị doanh nghiệp.\n\nHùng Thái rất mong muốn được hỗ trợ Giải đáp trực tiếp các vướng mắc của Quý khách. Xin vui lòng cho chúng tôi biết khung giờ phù hợp để kết nối lại, hoặc phản hồi email này nếu Quý khách cần thêm thông tin.\n\nTrân trọng,\nĐội ngũ CSKH Power Service CRM.',
    category: 'followup',
    lastModified: Date.now()
  }
];

export function getTemplates(): EmailTemplate[] {
  const saved = localStorage.getItem('crm_email_templates');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_TEMPLATES;
    }
  }
  return DEFAULT_TEMPLATES;
}

export const STAGES_TRANSLATION: Record<string, string> = {
  'Awareness': 'Nhận thức (Awareness)',
  'Consideration': 'Cân nhắc (Consideration)',
  'Purchase': 'Mua hàng (Purchase)',
  'Retention': 'Duy trì (Retention)',
  'Loyalty': 'Thân thiết (Loyalty)'
};

export const DEFAULT_AUTOMATION_RULES: EmailAutomationRule[] = [
  {
    id: 'ar-1',
    name: 'Tự động gửi Onboarding khi nhận thức',
    triggerStage: 'Awareness',
    templateId: 'temp-1',
    isActive: true,
    createdAt: Date.now()
  },
  {
    id: 'ar-2',
    name: 'Gửi yêu cầu Khảo sát ý kiến khi hoàn tất mua hàng',
    triggerStage: 'Purchase',
    templateId: 'temp-3',
    isActive: true,
    createdAt: Date.now()
  }
];

export function getAutomationRules(): EmailAutomationRule[] {
  const saved = localStorage.getItem('crm_email_automation_rules');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_AUTOMATION_RULES;
    }
  }
  // Initialize with defaults if none exists
  localStorage.setItem('crm_email_automation_rules', JSON.stringify(DEFAULT_AUTOMATION_RULES));
  return DEFAULT_AUTOMATION_RULES;
}

export function saveAutomationRules(rules: EmailAutomationRule[]) {
  localStorage.setItem('crm_email_automation_rules', JSON.stringify(rules));
}

export function getAutomationLogs(): AutomationLog[] {
  const saved = localStorage.getItem('crm_automation_logs');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function addAutomationLog(log: Omit<AutomationLog, 'id' | 'timestamp'>) {
  const logs = getAutomationLogs();
  const newLog: AutomationLog = {
    ...log,
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('crm_automation_logs', JSON.stringify([newLog, ...logs].slice(0, 50))); // Keep last 50 logs
}

// Interceptor function called when customer changes journeyStage
export async function triggerLifecycleEmail(
  customerId: string,
  customerName: string,
  customerEmail: string,
  newStage: 'Awareness' | 'Consideration' | 'Purchase' | 'Retention' | 'Loyalty'
): Promise<boolean> {
  try {
    const rules = getAutomationRules();
    const activeRule = rules.find(r => r.isActive && r.triggerStage === newStage);
    if (!activeRule) {
      console.log(`No active automation rule found for transition to: ${newStage}`);
      return false;
    }

    const templates = getTemplates();
    const template = templates.find(t => t.id === activeRule.templateId);
    if (!template) {
      console.warn(`Template associated with rule ${activeRule.name} not found!`);
      return false;
    }

    // Compile template body and subject
    const followUpDate = new Date(Date.now() + 3 * 24 * 3600000).toLocaleDateString();
    
    const compile = (str: string) => {
      return str
        .replace(/{customer_name}/g, customerName)
        .replace(/{customer_id}/g, customerId)
        .replace(/{follow_up_date}/g, followUpDate);
    };

    const compiledSubject = compile(template.subject);
    const compiledBody = compile(template.body);

    // Save as dynamic touchpoint in Firestore
    const tpRef = collection(db, 'customers', customerId, 'touchpoints');
    await addDoc(tpRef, {
      customerId,
      title: `📧 [EMAIL AUTOMATION] ${compiledSubject}`,
      description: `Được kích hoạt tự động theo quy trình: "${activeRule.name}"\n\nNội dung email:\n\n${compiledBody}`,
      channel: 'email',
      sentiment: 'Neutral',
      timestamp: Date.now()
    });

    // Save into log
    addAutomationLog({
      ruleName: activeRule.name,
      customerName,
      customerEmail: customerEmail || 'N/A',
      templateName: template.name,
      subject: compiledSubject,
      status: 'Gửi thành công'
    });

    // Push standard Notification to the system so user gets notified!
    const notificationsRaw = localStorage.getItem('local_crm_notifications') || '[]';
    try {
      const notifications = JSON.parse(notificationsRaw);
      notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: 'system',
        title: '📧 Email Tự Động Kích Hoạt',
        message: `Hệ thống vừa gửi email "${template.name}" cho khách hàng "${customerName}" do chuyển sang giai đoạn "${STAGES_TRANSLATION[newStage] || newStage}".`,
        type: 'success',
        category: 'crm',
        read: false,
        createdAt: Date.now()
      });
      localStorage.setItem('local_crm_notifications', JSON.stringify(notifications));
      window.dispatchEvent(new Event('storage')); // Trigger update across tabs
    } catch (e) {
      console.error(e);
    }

    return true;
  } catch (error) {
    console.error('Failed to run email automation pipeline:', error);
    return false;
  }
}
