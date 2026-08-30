import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma.js';
import { comparePin, signStaffToken } from '../../../utils/auth.js';
import { requireStaffAuth } from '../../../middleware/requireStaffAuth.js';
import type { AuthedRequest } from '../../../middleware/requireStaffAuth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 ደቂቃ ብቻ
  max: 15, // 15 ሙከራ በ5 ደቂቃ ውስጥ
  skipSuccessfulRequests: true, // 🆕 ትክክለኛ login ከሆነ አይቆጠርም — ትክክለኛ ሰራተኞች በተደጋጋሚ ቢገቡ አይያዙም
  message: { success: false, error: '⚠️ እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ' },
  standardHeaders: true,
  legacyHeaders: false,
});

const MAX_DEVICE_SESSIONS = 2;
const SESSION_HOURS = 8;



router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { username, pin, deviceLabel, expectedRole } = req.body;
    if (!username || !pin) {
      return res.status(400).json({ success: false, error: 'Username እና PIN ያስፈልጋሉ' });
    }
    const staff = await prisma.staff.findUnique({ where: { username: String(username).trim() } });
    if (!staff || !staff.isActive) {
      return res.status(401).json({ success: false, error: '❌ የተሳሳተ Username ወይም PIN' });
    }
    const ok = await comparePin(String(pin), staff.pinHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: '❌ የተሳሳተ Username ወይም PIN' });
    }

    // 🎯 የተጫነው tile (expectedRole) ከ roles ዝርዝሩ ውስጥ አንዱ መሆኑን ማረጋገጥ
    if (expectedRole && !staff.roles.includes(expectedRole)) {
      return res.status(403).json({
        success: false,
        error: `❌ ይሄኛው "${staff.username}" ለዚህ ገጽ ፍቃድ የለውም ።`
      });
    }
    // 🎯 ለዚህ session (device) ንቁ የሆነው ሚና — የተመረጠው tile ነው (ካልተላከ የመጀመሪያው ሚናው ይሆናል)
    const sessionRole = expectedRole || staff.roles[0];

    const MAX_DEVICE_SESSIONS = 2;
    const SESSION_HOURS = 8;
    const activeSessions = await prisma.staffSession.findMany({
      where: { staffId: staff.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    });
    if (activeSessions.length >= MAX_DEVICE_SESSIONS) {
      const toEvict = activeSessions.slice(0, activeSessions.length - MAX_DEVICE_SESSIONS + 1);
      await prisma.staffSession.deleteMany({ where: { id: { in: toEvict.map(s => s.id) } } });
    }

    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
    const session = await prisma.staffSession.create({
      data: { staffId: staff.id, deviceLabel: deviceLabel || null, expiresAt },
    });

    await prisma.staff.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });

    const token = signStaffToken({ staffId: staff.id, sessionId: session.id, role: sessionRole });
    return res.json({
      success: true,
      token,
      staff: { id: staff.id, fullName: staff.fullName, role: sessionRole, roles: staff.roles }, // 👈 roles ተጨምሯል
    });
  } catch (e: any) {
    console.error('❌ Login error:', e);
    return res.status(500).json({ success: false, error: 'መግባት አልተቻለም' });
  }
});

router.get('/me', requireStaffAuth, (req: AuthedRequest, res: Response) => {
  return res.json({ success: true, staff: req.staff });
});

router.post('/logout', requireStaffAuth, async (req: AuthedRequest, res: Response) => {
  if (req.sessionId) {
    await prisma.staffSession.delete({ where: { id: req.sessionId } }).catch(() => {});
  }
  return res.json({ success: true });
});

export default router;