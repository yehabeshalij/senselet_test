import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'contacts.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (error) {
    console.error('❌ contacts.json ማንበብ አልተቻለም:', error);
    res.status(500).json({ error: 'ኮንታክት ፋይል ማንበብ አልተቻለም' });
  }
});

export default router;