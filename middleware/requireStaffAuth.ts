import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyStaffToken } from '../utils/auth.js';

export interface AuthedRequest extends Request {
  staff?: { id: string; role: string; fullName: string };
  sessionId?: string;
}

export async function requireStaffAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '🔒 መግባት ያስፈልጋል' });
  }
  const token = header.slice(7);
  try {
    const payload = verifyStaffToken(token);
    const [staff, session] = await Promise.all([
      prisma.staff.findUnique({ where: { id: payload.staffId } }),
      prisma.staffSession.findUnique({ where: { id: payload.sessionId } }),
    ]);
    if (!staff || !staff.isActive) {
      return res.status(401).json({ success: false, error: '🔒 ለመጠቀም ተቋርጧል ሀላፊ ያናግሩ' });
    }
    if (!session || session.staffId !== staff.id || session.expiresAt < new Date()) {
      return res.status(401).json({ success: false, error: '🔒 session ተቋርጧል (ሌላ ዲቫይስ ገብቶ ይሆናል፣ ወይም ሰዓት አልፎታል)፣ እንደገና ይግቡ' });
    }

    
    if (!staff.roles.includes(payload.role as any)) {
      return res.status(403).json({ success: false, error: '🔒 ይህ ሚና ለዚህ ሰራተኛ ከዚህ በኋላ አልተፈቀደም፣ እንደገና ይግቡ' });
    }

    req.staff = { id: staff.id, role: payload.role, fullName: staff.fullName };
    req.sessionId = session.id;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: '🔒 ልክ ያልሆነ ወይም ጊዜው ያለፈበት ፓስወርድ' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.staff || !roles.includes(req.staff.role)) {
      return res.status(403).json({ success: false, error: '🔒 ይህን ለመጠቀም ፍቃድ የሎትም' });
    }
    return next();
  };
}