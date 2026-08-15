import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 📥 አዲስ ሸቀጥ መጋዘን ሲገባ የሚቀበል ኤፒአይ
router.post('/receive', async (req, res) => {
  try {
    const { 
      merchantName, 
      merchantPhone, 
      typeAndDetails, 
      weightKg, 
      senderName, 
      senderPhone, 
      receiverName 
    } = req.body;

    if (!merchantName || !merchantPhone || !typeAndDetails || !weightKg || !senderName || !senderPhone || !receiverName) {
      return res.status(400).json({ error: "እባክዎ ሁሉንም አስፈላጊ መረጃዎች ያሟሉ!" });
    }

    // የነጋዴውን (Merchant) መረጃ ማጣራት ወይም አዲስ መፍጠር
    const merchant = await prisma.merchant.upsert({
      where: { phone: merchantPhone },
      update: { name: merchantName },
      create: { name: merchantName, phone: merchantPhone }
    });

    // ያስረካቢውን (SenderTemplate) መረጃ ማጣራት ወይም አዲስ መፍጠር
    const sender = await prisma.senderTemplate.upsert({
      where: { phone: senderPhone },
      update: { name: senderName },
      create: { name: senderName, phone: senderPhone }
    });

    // አዲሱን እቃ መጋዘን ማስገባት
    const newItem = await prisma.item.create({
      data: {
        merchantId: merchant.id,
        senderId: sender.id,
        typeAndDetails,
        weightKg: parseFloat(weightKg),
        senderName,
        senderPhone,
        receiverName,
        status: 'IN_WAREHOUSE'
      }
    });

    return res.status(201).json({ 
      success: true, 
      message: "✅ ሸቀጡ በስኬት መጋዘን ውስጥ ተመዝግቧል!", 
      data: newItem 
    });

  } catch (error) {
    console.error("በመመዝገብ ላይ ስህተት አጋጥሟል፦", error);
    return res.status(500).json({ error: "❌ የሰርቨር ስህተት አጋጥሟል!" });
  }
});

export default router;