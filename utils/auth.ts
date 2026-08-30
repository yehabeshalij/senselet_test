import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) console.warn('⚠️ JWT_SECRET በ .env ውስጥ አልተገኘም!');

export interface StaffTokenPayload {
  staffId: string;
  sessionId: string;
  role: string;
}

export function signStaffToken(payload: StaffTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyStaffToken(token: string): StaffTokenPayload {
  return jwt.verify(token, JWT_SECRET) as StaffTokenPayload;
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function comparePin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}