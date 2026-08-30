import 'dotenv/config'; 
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
import axios from 'axios';
import path from 'path';


import freightRoute from './frontend/src/routes/freightRoute.js';
import loadingRoute from "./frontend/src/routes/loadingRoute.js";
import contactsRoute from './frontend/src/routes/contactsRoute.js';
import { requireAppKey } from './middleware/requireAppKey.js';
import authRoute from './frontend/src/routes/authRoute.js';
import staffRoute from './frontend/src/routes/staffRoute.js';
import { requireStaffAuth, requireRole } from './middleware/requireStaffAuth.js';
import rateLimit from 'express-rate-limit';


// 🔒 Production ላይ ሰርቨሩ ያለ አስፈላጊ secrets እንዳይነሳ መከላከያ
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k] || process.env[k]!.trim() === '');
  if (missing.length > 0) {
    console.error(`❌ የሚከተሉት environment variables አልተዋቀሩም: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET!.length < 32) {
    console.error('❌ JWT_SECRET በጣም አጭር ነው (ቢያንስ 32 ባይት ያስፈልጋል)። `openssl rand -hex 32` ተጠቀም።');
    process.exit(1);
  }
  if (!process.env.AFROMESSAGE_TOKEN || !process.env.AFROMESSAGE_IDENTIFIER) {
    console.warn('⚠️ AFROMESSAGE_TOKEN/IDENTIFIER አልተዋቀሩም — SMS መላክ አይሰራም (ሌላው ሁሉ ይሰራል)');
  }
  if (!process.env.OWNER_PIN) {
    console.warn('⚠️ OWNER_PIN አልተዋቀረም — /api/owner/verify-pin አይሰራም');
  }
}
validateEnv();

const app = express();

const ownerPinLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { success: false, error: '⚠️ እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ' },
});

// 🔒 CORS configuration — የተፈቀዱ Frontend origins
const allowedOrigins = [
  'https://senselet-test.vercel.app',
  'https://senselet-test-git-main-alexos-projects-91db6b69.vercel.app',
  'http://localhost:5173',
  ...(process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',').map(s => s.trim()) : [])
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy: ይህ Origin አልተፈቀደም!'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-key', 'X-App-Key'],
  credentials: true
}));

// Middlewares
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes — ሁሉም requireStaffAuth ያስፈልጋቸዋል
app.use('/api/freight', requireStaffAuth, freightRoute);
app.use('/api/loading', requireStaffAuth, loadingRoute);
app.use('/api/contacts', requireStaffAuth, contactsRoute);
app.use('/api/auth', authRoute);
app.use('/api/staff', staffRoute);

// 🔑 SMS tokens setup
const AFROMESSAGE_TOKEN = process.env.AFROMESSAGE_TOKEN;
const AFROMESSAGE_IDENTIFIER = process.env.AFROMESSAGE_IDENTIFIER;

if (!AFROMESSAGE_TOKEN || !AFROMESSAGE_IDENTIFIER) {
  console.warn('⚠️ AFROMESSAGE_TOKEN ወይም AFROMESSAGE_IDENTIFIER በ .env ውስጥ አልተገኘም!');
}

// 🆕 Owner PIN — OFFICE ብቻ እንዲሞክር
app.post('/api/owner/verify-pin', requireStaffAuth, requireRole('OFFICE'), (req: Request, res: Response) => {
  const { pin } = req.body;
  const correctPin = process.env.OWNER_PIN;
  if (!correctPin) {
    return res.status(500).json({ success: false, error: 'OWNER_PIN በ.env ውስጥ አልተዋቀረም' });
  }
  if (pin && String(pin) === String(correctPin)) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'የተሳሳተ ሚስጥር ቁጥር ነው!' });
});

// ==========================================
// 📌 SECTION 1: QUICKEXPENSE APIs
// ==========================================

app.get('/api/quickexpense', requireStaffAuth, requireRole('STAFF_EXPENSE', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const expenses = await (prisma as any).quickExpense.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(expenses);
  } catch (error) {
    console.error("❌ ዳታ ማምጣት አልተቻለም:", error);
    return res.status(500).json({ error: "ዳታቤዝ ማግኘት አልተቻለም" });
  }
});

app.post('/api/quickexpense', requireStaffAuth, requireRole('STAFF_EXPENSE', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { title, reason, amount, category, registeredBy, time, ethDate, ethMonth, gregDate, isLoan } = req.body;

    const newExpense = await (prisma as any).quickExpense.create({
      data: {
        title: title || reason || "ያልተጠቀሰ",
        reason: reason || "",
        amount: Number(amount) || 0,
        category: category || (isLoan ? "ብድር" : "መደበኛ"),
        registeredBy: registeredBy || "staff",
        time: time || "",
        ethDate: ethDate || "",
        ethMonth: ethMonth || "",
        gregDate: gregDate || "",
        isLoan: Boolean(isLoan),
        isReturned: false,
        ownerNote: ""
      }
    });

    return res.status(201).json(newExpense);
  } catch (error) {
    console.error("❌ ወጪ መመዝገብ አልተቻለም:", error);
    return res.status(500).json({ error: "መመዝገብ አልተቻለም" });
  }
});

app.put('/api/quickexpense/:id', requireStaffAuth, requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerNote } = req.body;

    const updatedExpense = await (prisma as any).quickExpense.update({
      where: { id: id },
      data: { ownerNote: ownerNote ?? "" }
    });

    return res.json(updatedExpense);
  } catch (error) {
    console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
    return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
  }
});

app.patch('/api/quickexpense/:id/return', requireStaffAuth, requireRole('STAFF_EXPENSE', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await (prisma as any).quickExpense.update({
      where: { id: id },
      data: { isReturned: true }
    });

    return res.json(updated);
  } catch (error) {
    console.error("❌ ብድር መመለስ አልተቻለም:", error);
    return res.status(500).json({ error: "ብድሩን መመለስ አልተቻለም" });
  }
});

app.post('/api/quickincome', requireStaffAuth, requireRole('STAFF_EXPENSE', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { title, reason, amount, category, registeredBy, time, ethDate, ethMonth, gregDate, ownerNote } = req.body;

    const newIncome = await (prisma as any).quickExpense.create({
      data: {
        title: String(title || reason || "ያልተጠቀሰ ገቢ"),
        reason: String(reason || title || "ያልተጠቀሰ ገቢ"),
        amount: Number(amount) || 0,
        category: category ? String(category) : "ገቢ",
        registeredBy: registeredBy ? String(registeredBy) : "staff",
        time: time ? String(time) : "",
        ethDate: ethDate ? String(ethDate) : "",
        ethMonth: ethMonth ? String(ethMonth) : "",
        gregDate: gregDate ? String(gregDate) : "",
        ownerNote: ownerNote ? String(ownerNote) : "",
        isIncome: true,
        isLoan: false,
        isReturned: false
      }
    });

    return res.status(201).json(newIncome);
  } catch (error: any) {
    console.error("❌ ገቢ መመዝገብ አልተቻለም:", error);

    return res.status(500).json({
    message: "ገቢ መመዝገብ አልተቻለም",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

app.delete('/api/quickexpense/:id', requireStaffAuth, requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { id } = req.params;

    await (prisma as any).quickExpense.delete({
      where: { id: String(id) },
    });

    res.status(200).json({ message: "መዝገቡ ሙሉ በሙሉ ከዳታቤዝ ተሰርዟል!" });
  } catch (error) {
    console.error("መዝገቡን ማጥፋት አልተቻለም:", error);
    res.status(500).json({ error: "መዝገቡን ማጥፋት አልተቻለም።" });
  }
});

app.patch('/api/quickexpense/:id/delete', requireStaffAuth, requireRole('STAFF_EXPENSE', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteReason } = req.body;

    const deletedExpense = await (prisma as any).quickExpense.update({
      where: { id: String(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deleteReason: deleteReason || "በሰራተኛው በስህተት ተሰርዟል"
      }
    });

    return res.json({
      success: true,
      message: "መዝገቡ በተሳካ ሁኔታ ተሰርዟል!",
      data: deletedExpense
    });
  } catch (error: any) {
    console.error("❌ መዝገቡን መሰረዝ አልተቻለም:", error);
    // return res.status(500).json({ error: "መዝገቡን መሰረዝ አልተቻለም" });

    return res.status(500).json({
    message: "መዝገቡን መሰረዝ አልተቻለም",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

app.get('/api/quickexpense/deleted', requireStaffAuth, requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const deletedExpenses = await (prisma as any).quickExpense.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: 'desc' }
    });
    return res.json(deletedExpenses);
  } catch (error: any) {
    console.error("❌ የተሰረዙ መረጃዎችን ማምጣት አልተቻለም:", error);
    // return res.status(500).json({ error: "የተሰረዙ መረጃዎችን ማምጣት አልተቻለም" });

    return res.status(500).json({
    message: "የተሰረዙ መረጃዎችን ማምጣት አልተቻለም",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// ==========================================
// 📌 SECTION 2: WAREHOUSE RECEIVER & CARGO APIs
// ==========================================

app.post('/api/warehouse/receive', requireStaffAuth, requireRole('RECEIVER', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const {
      receiptNo,
      ethDate,
      gregDate,
      time,
      merchantName,
      merchantPhone,
      senderName,
      senderPhone,
      receiverName,
      carPlate,
      totalWeight,
      cargoList
    } = req.body;

    let finalReceiptNo = receiptNo ? String(receiptNo).trim() : "";

    if (!finalReceiptNo) {
      const lastReceipt = await (prisma as any).warehouseReceipt.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      finalReceiptNo = "№ 04301";
      if (lastReceipt && lastReceipt.receiptNo) {
        const match = lastReceipt.receiptNo.match(/\d+/);
        if (match) {
          const lastNum = parseInt(match[0], 10);
          const nextNum = lastNum + 1;
          finalReceiptNo = `№ ${String(nextNum).padStart(5, '0')}`;
        }
      }
    }

    const existing = await (prisma as any).warehouseReceipt.findFirst({
      where: { receiptNo: finalReceiptNo }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `⚠️ የደረሰኝ ቁጥር ${finalReceiptNo} ቀደም ብሎ ተመዝግቧል! ድግግሞሽ አይፈቀድም።`
      });
    }

    const now = new Date();
    const currentTime = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentDateGreg = gregDate || now.toISOString().split('T')[0];
    const currentDateEth = ethDate || "ሐምሌ 16, 2018";
    const dateFormatted = `${currentDateEth} (${currentDateGreg})`;

    const newReceipt = await (prisma as any).warehouseReceipt.create({
      data: {
        receiptNo: finalReceiptNo,
        ethDate: dateFormatted,
        time: currentTime,
        merchantName: merchantName || "ያልተጠቀሰ",
        merchantPhone: merchantPhone ? String(merchantPhone).trim() : "",
        senderName: senderName || "ያልተጠቀሰ",
        senderPhone: senderPhone ? String(senderPhone).trim() : "",
        receiverName: receiverName || "ያልተጠቀሰ",
        carPlate: carPlate ? String(carPlate).trim().toUpperCase() : "",
        totalWeight: Number(totalWeight) || 0,
        items: {
          create: Array.isArray(cargoList) ? cargoList.map((item: any) => ({
            description: item.description || 'እቃ',
            weight: Number(item.weight) || 0,
            category: item.category || 'ደረቅ',
            isLoaded: item.isLoaded || false,
            loaderType: item.loaderType || '',
            isMultiPackage: item.isMultiPackage || false,
            rawWeightsInput: item.rawWeightsInput || '',
            status: 'በመጋዘን ያለ',
            packages: item.packages ? JSON.parse(JSON.stringify(item.packages)) : []
          })) : []
        }
      },
      include: {
        items: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "መረጃው በስኬት ዳታቤዝ ገብቷል!",
      data: newReceipt
    });

  } catch (error: any) {
    console.error("❌ ዳታቤዝ ላይ ማስገባት አልተቻለም:", error);
    // return res.status(500).json({ message: "በዳታቤዝ መዝገባ ወቅት ስህተት ተፈጥሯል", error: error.message });

    return res.status(500).json({
    message: "በዳታቤዝ መዝገባ ወቅት ስህተት ተፈጥሯል",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

app.patch('/api/warehouse/items/:itemId/return', requireStaffAuth, requireRole('MERCHANT_SMS', 'RECEIVER', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { itemId } = req.params;

    const updatedItem = await (prisma as any).cargoItem.update({
      where: { id: String(itemId) },
      data: { status: 'ተመልሷል' }
    });

    return res.json({
      success: true,
      message: 'እቃው ተመልሷል ተብሎ በተሳካ ሁኔታ ተመዝግቧል!',
      data: updatedItem
    });
  } catch (error: any) {
    console.error("❌ እቃውን መመለስ አልተቻለም:", error);
    // return res.status(500).json({ error: "እቃውን መመለስ አልተቻለም" });

  return res.status(500).json({
    message: "እቃውን መመለስ አልተቻለም",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

app.patch('/api/warehouse/receipts/:receiptId/return-all', requireStaffAuth, requireRole('MERCHANT_SMS', 'RECEIVER', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { receiptId } = req.params;

    const updatedItems = await (prisma as any).cargoItem.updateMany({
      where: { receiptId: String(receiptId) },
      data: { status: 'ተመልሷል' }
    });

    return res.json({
      success: true,
      message: 'የደረሰኙ እቃዎች በሙሉ ተመልሰዋል ተብለው ተመዝግበዋል!',
      data: updatedItems
    });
  } catch (error: any) {
    console.error("❌ እቃዎችን መመለስ አልተቻለም:", error);

  return res.status(500).json({
    message: "እቃዎችን መመለስ አልተቻለም",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

app.patch('/api/warehouse/receipts/:id/sms-status', requireStaffAuth, requireRole('MERCHANT_SMS', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { smsSent } = req.body;

    const updatedReceipt = await (prisma as any).warehouseReceipt.update({
      where: { id: String(id) },
      data: { smsSent: smsSent ?? true }
    });

    return res.json({
      success: true,
      message: 'የ SMS ሁኔታ በተሳካ ሁኔታ ታድሷል!',
      data: updatedReceipt
    });
  } catch (error: any) {
    console.error("❌ የ SMS Status ማዘመን አልተቻለም:", error);
    // return res.status(500).json({ error: "የ SMS status ማዘመን አልተቻለም" });

  return res.status(500).json({
    message: "የ SMS status ማዘመን አልተቻለም",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

app.get('/api/warehouse/receipts', requireStaffAuth, requireRole('RECEIVER', 'MERCHANT_SMS', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const receipts = await (prisma as any).warehouseReceipt.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(receipts);
  } catch (error) {
    console.error("❌ የመጋዘን ደረሰኞችን ማምጣት አልተቻለም:", error);
    return res.status(500).json({ error: "መረጃውን ማግኘት አልተቻለም" });
  }
});

app.get('/api/warehouse/by-plate/:carPlate', requireStaffAuth, requireRole('RECEIVER', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { carPlate } = req.params;

    const receipts = await (prisma as any).warehouseReceipt.findMany({
      where: { carPlate: carPlate },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(receipts);
  } catch (error) {
    console.error("❌ በታርጋ ፈልጎ ማምጣት አልተቻለም:", error);
    return res.status(500).json({ error: "መረጃውን ማግኘት አልተቻለም" });
  }
});

app.patch('/api/warehouse/receipts/:id/phone', requireStaffAuth, requireRole('MERCHANT_SMS', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { merchantPhone } = req.body;

    const updated = await (prisma as any).warehouseReceipt.update({
      where: { id: String(id) },
      data: { merchantPhone: String(merchantPhone || '') }
    });

    return res.json({ success: true, updated });
  } catch (error: any) {
    console.error("❌ የስልክ ቁጥር ማዘመን አልተቻለም:", error);
    // return res.status(500).json({ error: "ስልክ ቁጥሩን ማዘመን አልተቻለም" });

  return res.status(500).json({
    message: "ስልክ ቁጥሩን ማዘመን አልተቻለም",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

app.post('/api/sms/send', requireStaffAuth, requireRole('MERCHANT_SMS', 'OFFICE', 'OWNER'), async (req, res) => {
  try {
    if (!AFROMESSAGE_TOKEN || !AFROMESSAGE_IDENTIFIER) {
      return res.status(500).json({ success: false, error: 'SMS ሰርቨር በትክክል አልተዋቀረም (.env ን ያረጋግጡ)' });
    }
    const { receiptId, phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: "ስልክ ቁጥር እና መልዕክት ያስፈልጋል!" });
    }

    let formattedPhone = phone.toString().trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+251' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('251')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+251')) {
      formattedPhone = '+251' + formattedPhone;
    }

    const response = await axios.get('https://api.afromessage.com/api/send', {
      headers: { 'Authorization': `Bearer ${AFROMESSAGE_TOKEN.trim()}` },
      params: { to: formattedPhone, message }
    });

    if (response.data && (response.data.acknowledge === 'success' || response.data.status === 'ACKNOWLEDGED')) {
      if (receiptId) {
        await (prisma as any).merchantStatus.create({
          data: { merchantName: "Customer", phoneNumber: formattedPhone, goodsDescription: message, status: "SENT", smsSent: true }
        });
      }
      console.log(`📱 SMS በተሳካ ሁኔታ ተልኳል ለ: ${formattedPhone}`);
      return res.json({ success: true, message: "SMS በተሳካ ሁኔታ ተልኳል!", data: response.data });
    } else {
      return res.status(400).json({ success: false, error: response.data?.response?.errors?.[0] || "SMS መላክ አልተቻለም" });
    }
  } catch (error: any) {
    // console.error("❌ SMS Error:", error.response?.data || error.message);
    // return res.status(500).json({ success: false, error: error.response?.data?.message || "ከ AfroMessage ጋር መገናኘት አልተቻለም" });

    console.error("❌ SMS Error:", error);
  return res.status(500).json({
    message: "ከ AfroMessage ጋር መገናኘት አልተቻለም",
    error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// ==========================================
// 🚀 SERVER PORT
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል`);
});