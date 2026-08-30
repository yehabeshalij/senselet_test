import type { Request, Response, NextFunction } from 'express';

// 🔑 ቀላል shared-key ጥበቃ — ሙሉ login ሲኖረን ይህ ይተካል።
// ማንም ትክክለኛውን key የማያውቅ (URL ብቻ ካገኘ) ወደ ጥበቃ ካላቸው routes እንዳይገባ ይከለክላል።
export function requireAppKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.APP_SHARED_KEY;
  if (!expected) {
    // .env ላይ ገና ካልተዋቀረ (dev ላይ) እንዲያልፍ እንፈቅዳለን
    return next();
  }
  const provided = req.headers['x-app-key'];
  if (provided === expected) return next();
  return res.status(401).json({ error: '🔒 ያልተፈቀደ ' });
}