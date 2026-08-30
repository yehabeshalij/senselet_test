import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../../lib/prisma.js';
import { hashPin } from '../../../utils/auth.js';
import { requireStaffAuth, requireRole } from '../../../middleware/requireStaffAuth.js';
import type { AuthedRequest } from '../../../middleware/requireStaffAuth.js';

const router = Router();

router.use(requireStaffAuth, requireRole('OFFICE', 'OWNER'));



router.get('/', async (_req: AuthedRequest, res: Response) => {
  const staff = await prisma.staff.findMany({
    select: { id: true, fullName: true, username: true, roles: true, isActive: true, lastLoginAt: true, createdAt: true }, // 👈 roles
    orderBy: { createdAt: 'desc' }
  });
  return res.json({ success: true, data: staff });
});


router.post('/', async (req: AuthedRequest, res: Response) => {
  try {
    const { fullName, username, pin, roles } = req.body; // 👈 roles (array)
    if (!fullName || !username || !pin || !Array.isArray(roles) || roles.length === 0) {
  return res.status(400).json({ success: false, error: 'ሁሉም መስኮች እና ቢያንስ 1 ሚና ያስፈልጋሉ' });
}
// 🆕 ጨምር
if (String(pin).length < 6) {
  return res.status(400).json({ success: false, error: '⚠️ PIN ቢያንስ 6 ዲጂት መሆን አለበት' });
}
    const pinHash = await hashPin(String(pin));
    const staff = await prisma.staff.create({
      data: { fullName, username: String(username).trim(), pinHash, roles, createdBy: req.staff?.fullName }
    });
    return res.status(201).json({ success: true, data: { id: staff.id, username: staff.username } });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'ይሄ Username ቀድሞ ተይዟል' });
    }
    console.error(e);
    return res.status(500).json({ success: false, error: 'ሰራተኛ ክሬት ማድረግ አልተቻለም' });
  }
});

router.patch('/:id/reset-pin', async (req: AuthedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, error: 'አዲስ PIN ያስፈልጋል' });
    const pinHash = await hashPin(String(pin));
    const staff = await prisma.staff.update({
      where: { id },
      data: { pinHash }
    });
    // 🔒 PIN ስለተቀየረ ነባር session ሁሉ ወዲያውኑ ይሰረዛሉ (ሁሉም ዲቫይሶች ላይ ወዲያውኑ logout)
    await prisma.staffSession.deleteMany({ where: { staffId: staff.id } });
    return res.json({ success: true, message: 'PIN ተቀይሯል', data: { id: staff.id } });
  } catch (e: any) {
    console.error('❌ reset-pin error:', e);
    return res.status(500).json({ success: false, error: 'PIN መቀየር አልተቻለም' });
  }
});

router.patch('/:id/deactivate', async (req: AuthedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const staff = await prisma.staff.update({
      where: { id },
      data: { isActive: false }
    });
    await prisma.staffSession.deleteMany({ where: { staffId: staff.id } });
    return res.json({ success: true, message: 'ሰራተኛው ተቋርጧል', data: { id: staff.id } });
  } catch (e: any) {
    console.error('❌ deactivate error:', e);
    return res.status(500).json({ success: false, error: 'ማቋረጥ አልተቻለም' });
  }
});

router.patch('/:id/reactivate', async (req: AuthedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const staff = await prisma.staff.update({
      where: { id },
      data: { isActive: true }
    });
    return res.json({ success: true, data: { id: staff.id } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'ሰራተኛ እንደገና ማስጀመር አልተቻለም' });
  }
});


// 🗑️ ሙሉ በሙሉ ማጥፊያ (permanent) — ሰራተኛ ሲቀየር/ሲለቅ ሙሉ ታሪኩን ለማጥፋት

router.patch('/:id/roles', async (req: AuthedRequest, res: Response) => {
  try {
    const { roles } = req.body;
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ success: false, error: 'ቢያንስ 1 ሚና ይምረጡ' });
    }
    const staff = await prisma.staff.update({ where: { id: req.params.id as any }, data: { roles } });
    return res.json({ success: true, data: { id: staff.id, roles: staff.roles } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'ሚናዎች መቀየር አልተቻለም' });
  }
});
router.delete('/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const id = String(req.params.id);

    // 🔒 ራስን ማጥፋት እንዳይቻል መከላከያ (አንድ ሰው በስህተት እራሱን እንዳያጠፋ)
    if (req.staff?.id === id) {
      return res.status(400).json({ success: false, error: '⚠️ የራስዎን መለያ ማጥፋት አይችሉም' });
    }

    // ተያያዥ session ካሉ አስቀድሞ ማጥፋት (foreign key constraint እንዳያግድ)
    await prisma.staffSession.deleteMany({ where: { staffId: id } });
    await prisma.staff.delete({ where: { id: id as any } });

    return res.json({ success: true, message: 'ሰራተኛው ሙሉ በሙሉ ተሰርዟል' });
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'ሰራተኛው አልተገኘም' });
    }
    console.error('❌ delete staff error:', e);
    return res.status(500).json({ success: false, error: 'ማጥፋት አልተቻለም' });
  }
});

export default router;