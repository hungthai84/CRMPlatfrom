import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { runCrmCopilot } from './server/ai/geminiService.ts';

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      return res.status(429).json({ error: 'Quá giới hạn yêu cầu. Vui lòng thử lại sau.' });
    }
    bucket.count += 1;
    return next();
  };
}

const copilotBodySchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  taskType: z
    .enum([
      'chat',
      'customer_summary',
      'conversation_summary',
      'email_draft',
      'lead_scoring',
      'report_insight',
      'workflow_suggestion',
    ])
    .default('chat'),
  contextSummary: z.string().max(18000).default('No context provided.'),
  allowedModules: z.array(z.string().max(40)).max(20).default(['dashboard']),
  language: z.enum(['vi', 'en']).default('vi'),
  userRole: z.string().max(40).default('user'),
});

const integrationTestSchema = z.object({
  integrationId: z.string().trim().min(1).max(60),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'ONECRM Enterprise API',
      timestamp: Date.now(),
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Protected AI Copilot endpoint
  app.post(
    '/api/ai/copilot',
    rateLimit(30, 60_000),
    requireAuth,
    async (req: AuthRequest, res) => {
      const parsed = copilotBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Dữ liệu đầu vào AI không hợp lệ.',
          details: parsed.error.flatten(),
        });
      }

      try {
        const result = await runCrmCopilot(parsed.data);
        return res.json({
          ...result,
          executedBy: req.user?.email || req.user?.uid,
          timestamp: Date.now(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Lỗi xử lý Gemini AI';
        console.error('AI Copilot error:', message);
        return res.status(500).json({ error: message });
      }
    }
  );

  // Server-side integration adapter status (checks real env secrets, never fakes connected state)
  app.get('/api/integrations/status', requireAuth, (_req, res) => {
    const adapters = [
      {
        id: 'zalo_oa',
        name: 'Zalo Official Account',
        category: 'messaging',
        provider: 'Zalo Cloud API',
        status: process.env.ZALO_OA_ACCESS_TOKEN ? 'connected' : 'not_connected',
        requiredEnvVars: ['ZALO_OA_APP_ID', 'ZALO_OA_SECRET_KEY', 'ZALO_OA_ACCESS_TOKEN'],
        docsHint: 'Cấu hình ZALO_OA_ACCESS_TOKEN trong Settings > Secrets để nhận & gửi tin nhắn Zalo OA.',
      },
      {
        id: 'facebook_messenger',
        name: 'Facebook Messenger & Instagram',
        category: 'messaging',
        provider: 'Meta Graph API',
        status: process.env.META_PAGE_ACCESS_TOKEN ? 'connected' : 'not_connected',
        requiredEnvVars: ['META_APP_SECRET', 'META_PAGE_ACCESS_TOKEN', 'META_VERIFY_TOKEN'],
        docsHint: 'Cấu hình Meta Page Access Token để đồng bộ hội thoại Messenger.',
      },
      {
        id: 'whatsapp_business',
        name: 'WhatsApp Business Cloud',
        category: 'messaging',
        provider: 'Meta WhatsApp Cloud API',
        status: process.env.WHATSAPP_CLOUD_TOKEN ? 'connected' : 'not_connected',
        requiredEnvVars: ['WHATSAPP_CLOUD_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
        docsHint: 'Cần xác thực tài khoản WhatsApp Business Cloud.',
      },
      {
        id: 'email_smtp',
        name: 'Enterprise Email (SMTP / SendGrid)',
        category: 'email',
        provider: 'SMTP / SendGrid',
        status: process.env.SMTP_HOST || process.env.SENDGRID_API_KEY ? 'connected' : 'not_connected',
        requiredEnvVars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'],
        docsHint: 'Thiết lập máy chủ gửi Email để kích hoạt Email Marketing & thông báo.',
      },
      {
        id: 'telephony_sip',
        name: 'Contact Center & Tổng đài VoIP',
        category: 'telephony',
        provider: 'SIP / Stringee / OMICall',
        status: process.env.TELEPHONY_API_KEY ? 'connected' : 'not_connected',
        requiredEnvVars: ['TELEPHONY_API_KEY', 'TELEPHONY_SIP_DOMAIN'],
        docsHint: 'Kết nối tổng đài IP để ghi âm cuộc gọi & pop-up hồ sơ khách hàng.',
      },
      {
        id: 'payment_gateway',
        name: 'Cổng thanh toán (VNPay / MoMo / Stripe)',
        category: 'payment',
        provider: 'Payment Adapter',
        status: process.env.PAYMENT_SECRET_KEY ? 'connected' : 'not_connected',
        requiredEnvVars: ['PAYMENT_MERCHANT_ID', 'PAYMENT_SECRET_KEY'],
        docsHint: 'Cấu hình khóa bí mật cổng thanh toán ở server-side.',
      },
      {
        id: 'esignature',
        name: 'Ký số Hợp đồng (E-Signature)',
        category: 'esign',
        provider: 'VNPT SmartCA / DocuSign Adapter',
        status: process.env.ESIGN_API_KEY ? 'connected' : 'not_connected',
        requiredEnvVars: ['ESIGN_CLIENT_ID', 'ESIGN_API_KEY'],
        docsHint: 'Kết nối nhà cung cấp chữ ký số trước khi gửi hợp đồng ký điện tử.',
      },
    ];
    res.json({ adapters, checkedAt: Date.now() });
  });

  app.post('/api/integrations/test', rateLimit(20, 60_000), requireAuth, (req, res) => {
    const parsed = integrationTestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'integrationId không hợp lệ' });
    }
    const { integrationId } = parsed.data;
    const envMap: Record<string, string | undefined> = {
      zalo_oa: process.env.ZALO_OA_ACCESS_TOKEN,
      facebook_messenger: process.env.META_PAGE_ACCESS_TOKEN,
      whatsapp_business: process.env.WHATSAPP_CLOUD_TOKEN,
      email_smtp: process.env.SMTP_HOST || process.env.SENDGRID_API_KEY,
      telephony_sip: process.env.TELEPHONY_API_KEY,
      payment_gateway: process.env.PAYMENT_SECRET_KEY,
      esignature: process.env.ESIGN_API_KEY,
    };

    const isConfigured = Boolean(envMap[integrationId]);
    return res.json({
      integrationId,
      connected: isConfigured,
      status: isConfigured ? 'connected' : 'not_connected',
      message: isConfigured
        ? 'Kết nối hợp lệ với cấu hình server-side.'
        : 'Chưa kết nối: thiếu biến môi trường hoặc khóa API ở phía server.',
      checkedAt: Date.now(),
    });
  });

  // Webhook receiver endpoint with signature header inspection
  app.post('/api/webhooks/incoming/:channel', rateLimit(60, 60_000), (req, res) => {
    const channel = req.params.channel;
    const webhookSecret = process.env.WEBHOOK_VERIFY_SECRET;
    if (!webhookSecret) {
      return res.status(503).json({
        accepted: false,
        channel,
        status: 'not_connected',
        message: 'Webhook chưa được kích hoạt (thiếu WEBHOOK_VERIFY_SECRET).',
      });
    }
    const providedSig = req.headers['x-onecrm-signature'];
    if (providedSig !== webhookSecret) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    return res.json({
      accepted: true,
      channel,
      receivedAt: Date.now(),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ONECRM Server running on http://localhost:${PORT}`);
  });
}

startServer();
