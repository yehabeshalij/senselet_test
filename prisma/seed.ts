
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 👇 እያንዳንዱ username ላይ የፈለከውን አዲስ 6-ዲጂት PIN አስቀምጥ (ይለያዩ)
  const updates = [
    { username: 'office1', newPin: '123456' },
    { username: 'yimene1', newPin: '654321' },
  ];

  for (const u of updates) {
    const pinHash = await bcrypt.hash(u.newPin, 10);
    const staff = await prisma.staff.update({
      where: { username: u.username },
      data: { pinHash },
    });
    // 🔒 ነባር session ካለ እናጠፋዋለን፣ አዲሱ PIN ወዲያውኑ ስራ ላይ እንዲውል
    await prisma.staffSession.deleteMany({ where: { staffId: staff.id } });
    console.log(`✅ ${u.username} → አዲስ PIN ተቀምጧል`);
  }
}

main()
  .catch((e) => console.error('❌ ስህተት:', e))
  .finally(async () => await prisma.$disconnect());
