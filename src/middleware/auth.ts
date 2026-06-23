import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: any; // Represents DecodedIdToken or custom auth payload
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Developer mock authentication bypass for CRM local offline sessions
  if (token.startsWith('mock_')) {
    try {
      const payloadBase64 = token.substring(5);
      const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      req.user = JSON.parse(decodedJson);
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized: Invalid mock configuration' });
    }
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
