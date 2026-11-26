import { auth } from '../lib/firebase';

export interface CopilotRequest {
  prompt: string;
  taskType:
    | 'chat'
    | 'customer_summary'
    | 'conversation_summary'
    | 'email_draft'
    | 'lead_scoring'
    | 'report_insight'
    | 'workflow_suggestion';
  contextSummary: string;
  allowedModules: string[];
  language: 'vi' | 'en';
  userRole: string;
}

export interface CopilotResponse {
  answer: string;
  sourcesUsed: string[];
  suggestedActions: string[];
  proposedWriteAction?: {
    actionType: 'create_task' | 'update_lead_score' | 'draft_reply' | 'none';
    title: string;
    description: string;
    requiresConfirmation: boolean;
  };
  model: string;
  executedBy?: string;
  timestamp?: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function callCrmCopilot(payload: CopilotRequest): Promise<CopilotResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/copilot', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Không thể kết nối AI Copilot.');
  }
  return data;
}

export async function fetchIntegrationsStatus() {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/integrations/status', { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Không thể tải trạng thái tích hợp.');
  }
  return data;
}

export async function testIntegrationConnection(integrationId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/integrations/test', {
    method: 'POST',
    headers,
    body: JSON.stringify({ integrationId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Kiểm tra kết nối thất bại.');
  }
  return data;
}
