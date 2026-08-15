// // // // import express from 'express';
// // // // import cors from 'cors';
// // // // import { PrismaClient } from '@prisma/client';

// // // // const app = express();
// // // // const prisma = new PrismaClient();

// // // // app.use(cors());
// // // // app.use(express.json());

// // // // // 1. ሁሉንም ወጪዎች ማምጫ (Get All Expenses)
// // // // app.get('/api/quickexpense', async (req, res) => {
// // // //   try {
// // // //     const expenses = await prisma.quickExpense.findMany({
// // // //       orderBy: { createdAt: 'desc' }
// // // //     });
// // // //     return res.json(expenses);
// // // //   } catch (error) {
// // // //     console.error("❌ ዳታ ማምጣት አልተቻለም:", error);
// // // //     return res.status(500).json({ error: "ዳታቤዝ ማግኘት አልተቻለም" });
// // // //   }
// // // // });

// // // // // 2. አዲስ ወጪ/ብድር መመዝገቢያ (Create Expense/Loan)
// // // // app.post('/api/quickexpense', async (req, res) => {
// // // //   try {
// // // //     const { title, reason, amount, category, registeredBy, time, ethDate, ethMonth, gregDate, isLoan } = req.body;

// // // //     const newExpense = await prisma.quickExpense.create({
// // // //       data: {
// // // //         title: title || reason,
// // // //         reason: reason,
// // // //         amount: Number(amount),
// // // //         category: category || (isLoan ? "ብድር" : "መደበኛ"),
// // // //         registeredBy: registeredBy || "staff",
// // // //         time: time,
// // // //         ethDate: ethDate,
// // // //         ethMonth: ethMonth,
// // // //         gregDate: gregDate,
// // // //         isLoan: Boolean(isLoan),
// // // //         isReturned: false,
// // // //         ownerNote: ""
// // // //       }
// // // //     });

// // // //     return res.status(201).json(newExpense);
// // // //   } catch (error) {
// // // //     console.error("❌ ወጪ መመዝገብ አልተቻለም:", error);
// // // //     return res.status(500).json({ error: "መመዝገብ አልተቻለም" });
// // // //   }
// // // // });

// // // // // 3. የኦውነር መልእክት ማዘመኛ (Update Owner Note)
// // // // app.put('/api/quickexpense/:id', async (req, res) => {
// // // //   try {
// // // //     const { id } = req.params;
// // // //     const { ownerNote } = req.body;

// // // //     const updatedExpense = await prisma.quickExpense.update({
// // // //       where: { id: id },
// // // //       data: { ownerNote: ownerNote ?? "" }
// // // //     });

// // // //     return res.json(updatedExpense);
// // // //   } catch (error) {
// // // //     console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
// // // //     return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
// // // //   }
// // // // });

// // // // // 4. ብድር ተመልሷል ማድረጊያ (Mark Loan as Returned)
// // // // app.patch('/api/quickexpense/:id/return', async (req, res) => {
// // // //   try {
// // // //     const { id } = req.params;

// // // //     const updated = await prisma.quickExpense.update({
// // // //       where: { id: id },
// // // //       data: { isReturned: true }
// // // //     });

// // // //     return res.json(updated);
// // // //   } catch (error) {
// // // //     console.error("❌ ብድር መመለስ አልተቻለም:", error);
// // // //     return res.status(500).json({ error: "ብድሩን መመለስ አልተቻለም" });
// // // //   }
// // // // });

// // // // const PORT = process.env.PORT || 3000;
// // // // app.listen(PORT, () => {
// // // //   console.log(`🚀 ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል`);
// // // // });

// // // import express, { Request, Response } from 'express';
// // // import cors from 'cors';
// // // import { PrismaClient } from '@prisma/client';
// // // import axios from 'axios';

// // // const app = express();
// // // const prisma = new PrismaClient();

// // // app.use(cors());
// // // app.use(express.json());

// // // // 🔑 የ AfroMessage API Key
// // // const AFROMESSAGE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGl0eSI6ImI2NTAyM2I4LTY0NTItNDk1Mi1iNWY4LTY2NjI0M2I0Y2U3YSIsInRva2VuX3R5cGUiOiJhcGlfa2V5IiwiaWF0IjoxNzgyNjc5MDIzLCJleHAiOjE5NDA0NDcwMjN9.MTMyMTViYjQ2In0.BgYCZb_hjQE8tY6RcxpWsPsv_yd0LWc6CSZIaZQMrEs';

// // // // ==========================================
// // // // 📌 SECTION 1: የቆዩት QUICKEXPENSE APIs (ያልተነኩ)
// // // // ==========================================

// // // // 1. ሁሉንም ወጪዎች ማምጫ (Get All Expenses)
// // // app.get('/api/quickexpense', async (req: Request, res: Response) => {
// // //   try {
// // //     const expenses = await prisma.quickExpense.findMany({
// // //       orderBy: { createdAt: 'desc' }
// // //     });
// // //     return res.json(expenses);
// // //   } catch (error) {
// // //     console.error("❌ ዳታ ማምጣት አልተቻለም:", error);
// // //     return res.status(500).json({ error: "ዳታቤዝ ማግኘት አልተቻለም" });
// // //   }
// // // });

// // // // 2. አዲስ ወጪ/ብድር መመዝገቢያ (Create Expense/Loan)
// // // app.post('/api/quickexpense', async (req: Request, res: Response) => {
// // //   try {
// // //     const { title, reason, amount, category, registeredBy, time, ethDate, ethMonth, gregDate, isLoan } = req.body;

// // //     const newExpense = await prisma.quickExpense.create({
// // //       data: {
// // //         title: title || reason,
// // //         reason: reason,
// // //         amount: Number(amount),
// // //         category: category || (isLoan ? "ብድር" : "መደበኛ"),
// // //         registeredBy: registeredBy || "staff",
// // //         time: time,
// // //         ethDate: ethDate,
// // //         ethMonth: ethMonth,
// // //         gregDate: gregDate,
// // //         isLoan: Boolean(isLoan),
// // //         isReturned: false,
// // //         ownerNote: ""
// // //       }
// // //     });

// // //     return res.status(201).json(newExpense);
// // //   } catch (error) {
// // //     console.error("❌ ወጪ መመዝገብ አልተቻለም:", error);
// // //     return res.status(500).json({ error: "መመዝገብ አልተቻለም" });
// // //   }
// // // });

// // // // 3. የኦውነር መልእክት ማዘመኛ (Update Owner Note)
// // // app.put('/api/quickexpense/:id', async (req: Request, res: Response) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const { ownerNote } = req.body;

// // //     const updatedExpense = await prisma.quickExpense.update({
// // //       where: { id: id },
// // //       data: { ownerNote: ownerNote ?? "" }
// // //     });

// // //     return res.json(updatedExpense);
// // //   } catch (error) {
// // //     console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
// // //     return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
// // //   }
// // // });

// // // // 4. ብድር ተመልሷል ማድረጊያ (Mark Loan as Returned)
// // // app.patch('/api/quickexpense/:id/return', async (req: Request, res: Response) => {
// // //   try {
// // //     const { id } = req.params;

// // //     const updated = await prisma.quickExpense.update({
// // //       where: { id: id },
// // //       data: { isReturned: true }
// // //     });

// // //     return res.json(updated);
// // //   } catch (error) {
// // //     console.error("❌ ብድር መመለስ አልተቻለም:", error);
// // //     return res.status(500).json({ error: "ብድሩን መመለስ አልተቻለም" });
// // //   }
// // // });

// // // // ==========================================
// // // // 📌 SECTION 2: አዲሶቹ የነጋዴ እቃዎች እና SMS APIs
// // // // ==========================================

// // // // 5. ሁሉንም የመጋዘን እቃዎች ማምጫ (Get All Transactions/Items)
// // // app.get('/api/transactions', async (req: Request, res: Response) => {
// // //   try {
// // //     // ማስታወሻ: በ schema.prisma ላይ ያለው ሞዴል ስም transaction ከሆነ (prisma.transaction)
// // //     // ወይም merchantTransaction ከሆነ እንደ ስሙ ይስተካከላል
// // //     const transactions = await (prisma as any).transaction.findMany({
// // //       orderBy: { createdAt: 'desc' },
// // //       include: { items: true } // items የተቀራረበ ሞዴል ካለው
// // //     });
// // //     return res.json(transactions);
// // //   } catch (error) {
// // //     console.error("❌ የመጋዘን እቃዎችን ማምጣት አልተቻለም:", error);
// // //     return res.status(500).json({ error: "የመጋዘን እቃዎችን ማግኘት አልተቻለም" });
// // //   }
// // // });

// // // // 6. የነጋዴውን ስልክ ቁጥር ማስተካከያ (Update Merchant Phone)
// // // app.patch('/api/transactions/:id/phone', async (req: Request, res: Response) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const { merchantPhone } = req.body;

// // //     const updated = await (prisma as any).transaction.update({
// // //       where: { id: id },
// // //       data: { merchantPhone: merchantPhone }
// // //     });

// // //     return res.json({ success: true, updated });
// // //   } catch (error) {
// // //     console.error("❌ የስልክ ቁጥር ማዘመን አልተቻለም:", error);
// // //     return res.status(500).json({ error: "ስልክ ቁጥሩን ማዘመን አልተቻለም" });
// // //   }
// // // });

// // // // 7. በ AfroMessage በኩል SMS መላኪያ (Send SMS via AfroMessage)
// // // app.post('/api/sms/send', async (req: Request, res: Response) => {
// // //   try {
// // //     const { transactionId, phone, message } = req.body;

// // //     if (!phone || !message) {
// // //       return res.status(400).json({ success: false, error: "ስልክ ቁጥር እና መልዕክት ያስፈልጋል!" });
// // //     }

// // //     // AfroMessage API ጥሪ
// // //     const response = await axios.get('https://api.afromessage.com/api/send', {
// // //       headers: {
// // //         'Authorization': `Bearer ${AFROMESSAGE_TOKEN}`
// // //       },
// // //       params: {
// // //         to: phone,
// // //         message: message
// // //       }
// // //     });

// // //     if (response.data && (response.data.acknowledge === 'success' || response.data.status === 'ACKNOWLEDGED')) {
// // //       // ኤስኤምኤስ ከተላከ በኋላ ዳታቤዙ ላይ 'isSmsSent' የሚለውን true ማድረግ
// // //       if (transactionId) {
// // //         await (prisma as any).transaction.update({
// // //           where: { id: transactionId },
// // //           data: { isSmsSent: true }
// // //         });
// // //       }

// // //       console.log(`📱 SMS በተሳካ ሁኔታ ተልኳል ለ: ${phone}`);
// // //       return res.json({ success: true, message: "SMS በተሳካ ሁኔታ ተልኳል!", data: response.data });
// // //     } else {
// // //       console.error("❌ AfroMessage Error Response:", response.data);
// // //       return res.status(400).json({ success: false, error: response.data?.response?.message || "SMS መላክ አልተቻለም" });
// // //     }

// // //   } catch (error: any) {
// // //     console.error("❌ SMS Request Error:", error.response?.data || error.message);
// // //     return res.status(500).json({ success: false, error: "ከ AfroMessage ጋር መገናኘት አልተቻለም" });
// // //   }
// // // });

// // // // ==========================================
// // // // 🚀 SERVER PORT
// // // // ==========================================
// // // const PORT = process.env.PORT || 3000;
// // // app.listen(PORT, () => {
// // //   console.log(`🚀 ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል`);
// // // });

// // // import express, { Request, Response } from 'express';
// // import express from 'express';
// // import type { Request, Response } from 'express';
// // import cors from 'cors';
// // import { PrismaClient } from '@prisma/client';
// // import axios from 'axios';

// // const app = express();
// // const prisma = new PrismaClient();

// // app.use(cors());
// // app.use(express.json());

// // // 🔑 የ AfroMessage API Key
// // const AFROMESSAGE_TOKEN = process.env.AFROMESSAGE_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGl0eSI6ImI2NTAyM2I4LTY0NTItNDk1Mi1iNWY4LTY2NjI0M2I0Y2U3YSIsInRva2VuX3R5cGUiOiJhcGlfa2V5IiwiaWF0IjoxNzgyNjc5MDIzLCJleHAiOjE5NDA0NDcwMjN9.MTMyMTViYjQ2In0.BgYCZb_hjQE8tY6RcxpWsPsv_yd0LWc6CSZIaZQMrEs';

// // // ==========================================
// // // 📌 SECTION 1: የቆዩት QUICKEXPENSE APIs
// // // ==========================================

// // // 1. ሁሉንም ወጪዎች ማምጫ (Get All Expenses)
// // app.get('/api/quickexpense', async (_req: Request, res: Response) => {
// //   try {
// //     const expenses = await prisma.quickExpense.findMany({
// //       orderBy: { createdAt: 'desc' }
// //     });
// //     return res.json(expenses);
// //   } catch (error) {
// //     console.error("❌ ዳታ ማምጣት አልተቻለም:", error);
// //     return res.status(500).json({ error: "ዳታቤዝ ማግኘት አልተቻለም" });
// //   }
// // });

// // // 2. አዲስ ወጪ/ብድር መመዝገቢያ (Create Expense/Loan)
// // app.post('/api/quickexpense', async (req: Request, res: Response) => {
// //   try {
// //     const { title, reason, amount, category, registeredBy, time, ethDate, ethMonth, gregDate, isLoan } = req.body;

// //     const newExpense = await prisma.quickExpense.create({
// //       data: {
// //         title: title || reason || "ያልተጠቀሰ",
// //         reason: reason || "",
// //         amount: Number(amount) || 0,
// //         category: category || (isLoan ? "ብድር" : "መደበኛ"),
// //         registeredBy: registeredBy || "staff",
// //         time: time || "",
// //         ethDate: ethDate || "",
// //         ethMonth: ethMonth || "",
// //         gregDate: gregDate || "",
// //         isLoan: Boolean(isLoan),
// //         isReturned: false,
// //         ownerNote: ""
// //       }
// //     });

// //     return res.status(201).json(newExpense);
// //   } catch (error) {
// //     console.error("❌ ወጪ መመዝገብ አልተቻለም:", error);
// //     return res.status(500).json({ error: "መመዝገብ አልተቻለም" });
// //   }
// // });

// // // // 3. የኦውነር መልእክት ማዘመኛ (Update Owner Note)
// // // app.put('/api/quickexpense/:id', async (req: Request, res: Response) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const { ownerNote } = req.body;

// // //     const updatedExpense = await prisma.quickExpense.update({
// // //       where: { id },
// // //       data: { ownerNote: ownerNote ?? "" }
// // //     });

// // //     return res.json(updatedExpense);
// // //   } catch (error) {
// // //     console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
// // //     return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
// // //   }
// // // });

// // // 3. የኦውነር መልእክት ማዘመኛ (Update Owner Note)
// // app.put('/api/quickexpense/:id', async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { ownerNote } = req.body;

// //     const updatedExpense = await prisma.quickExpense.update({
// //       where: { id: id },
// //       data: { ownerNote: ownerNote ?? "" }
// //     });

// //     return res.json(updatedExpense);
// //   } catch (error) {
// //     console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
// //     return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
// //   }
// // });

// // // // 4. ብድር ተመልሷል ማድረጊያ (Mark Loan as Returned)
// // // app.patch('/api/quickexpense/:id/return', async (req: Request, res: Response) => {
// // //   try {
// // //     const { id } = req.params;

// // //     const updated = await prisma.quickExpense.update({
// // //       where: { id },
// // //       data: { isReturned: true }
// // //     });

// // //     return res.json(updated);
// // //   } catch (error) {
// // //     console.error("❌ ብድር መመለስ አልተቻለም:", error);
// // //     return res.status(500).json({ error: "ብድሩን መመለስ አልተቻለም" });
// // //   }
// // // });

// // // 4. ብድር ተመልሷል ማድረጊያ (Mark Loan as Returned)
// // app.patch('/api/quickexpense/:id/return', async (req, res) => {
// //   try {
// //     const { id } = req.params;

// //     const updated = await prisma.quickExpense.update({
// //       where: { id: id },
// //       data: { isReturned: true }
// //     });

// //     return res.json(updated);
// //   } catch (error) {
// //     console.error("❌ ብድር መመለስ አልተቻለም:", error);
// //     return res.status(500).json({ error: "ብድሩን መመለስ አልተቻለም" });
// //   }
// // });


// // // ==========================================
// // // 📌 SECTION 2: አዲሱ WAREHOUSE RECEIVER & CARGO APIs
// // // ==========================================

// // // 5. አዲስ የተረከበውን እቃ ወደ Neon PostgreSQL ማስገቢያ (Warehouse Receiver Save API)
// // // 5. አዲስ የተረከበውን እቃ ወደ Neon PostgreSQL ማስገቢያ (በአውቶማቲክ የደረሰኝ ቁጥር እና የተሟላ ዳታ)
// // app.post('/api/warehouse/receive', async (req: Request, res: Response) => {
// //   try {
// //     const {
// //       ethDate,
// //       time,
// //       merchantName,
// //       merchantPhone,
// //       senderName,
// //       senderPhone,
// //       receiverName,
// //       carPlate,
// //       totalWeight,
// //       cargoList
// //     } = req.body;

// //     // 🔢 1. አውቶማቲክ የደረሰኝ ቁጥር ማፍለቂያ (የመጨረሻውን ፈልጎ 1 ይጨምራል)
// //     const lastReceipt = await (prisma as any).warehouseReceipt.findFirst({
// //       orderBy: { createdAt: 'desc' }
// //     });

// //     let nextReceiptNo = "№ 04301";
// //     if (lastReceipt && lastReceipt.receiptNo) {
// //       const match = lastReceipt.receiptNo.match(/\d+/);
// //       if (match) {
// //         const lastNum = parseInt(match[0], 10);
// //         const nextNum = lastNum + 1;
// //         nextReceiptNo = `№ ${String(nextNum).padStart(5, '0')}`;
// //       }
// //     }

// //     // 🕒 2. አውቶማቲክ ሰዓት እና ቀን ማስተካከያ
// //     const currentTime = time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
// //     const currentDate = ethDate || "ሀምሌ 16, 2018";

// //     // 💾 3. ወደ Neon PostgreSQL ዳታቤዝ ማስገባት
// //     const newReceipt = await (prisma as any).warehouseReceipt.create({
// //       data: {
// //         receiptNo: nextReceiptNo,
// //         ethDate: currentDate,
// //         time: currentTime,
// //         merchantName: merchantName || "ያልተጠቀሰ",
// //         merchantPhone: merchantPhone || "", // ግዴታ አይደለም
// //         senderName: senderName || "",       // የአስረካቢ ስም
// //         senderPhone: senderPhone || "",     // የአስረካቢ ስልክ
// //         receiverName: receiverName || "",   // የተረካቢ ሰራተኛ ስም
// //         carPlate: carPlate ? carPlate.trim().toUpperCase() : "", // ግዴታ አይደለም
// //         totalWeight: Number(totalWeight) || 0,
// //         items: {
// //           create: Array.isArray(cargoList) ? cargoList.map((item: any) => ({
// //             description: item.description || 'እቃ',
// //             weight: Number(item.weight) || 0,
// //             category: item.category || 'ደረቅ',
// //             isLoaded: item.isLoaded || false,
// //             loaderType: item.loaderType || '',
// //             isMultiPackage: item.isMultiPackage || false,
// //             rawWeightsInput: item.rawWeightsInput || '',
// //             packages: item.packages ? JSON.parse(JSON.stringify(item.packages)) : [] // የኬሻ እና ON/OFF ዳታ
// //           })) : []
// //         }
// //       },
// //       include: {
// //         items: true
// //       }
// //     });

// //     return res.status(201).json({
// //       success: true,
// //       message: "መረጃው በስኬት ዳታቤዝ ገብቷል!",
// //       data: newReceipt
// //     });

// //   } catch (error: any) {
// //     console.error("❌ ዳታቤዝ ላይ ማስገባት አልተቻለም:", error);
// //     return res.status(500).json({ message: "በዳታቤዝ መዝገባ ወቅት ስህተት ተፈጥሯል", error: error.message });
// //   }
// // });

// // // 5. አዲስ የተረከበውን እቃ ወደ Neon PostgreSQL ማስገቢያ (በአውቶማቲክ የደረሰኝ ቁጥር እና Flexible validation)
// // // 5. አዲስ የተረከበውን እቃ ወደ Neon PostgreSQL ማስገቢያ
// // app.post('/api/warehouse/receive', async (req: Request, res: Response) => {
// //   try {
// //     const {
// //       ethDate,
// //       gregDate,
// //       time,
// //       merchantName,
// //       merchantPhone,
// //       senderName,
// //       senderPhone,
// //       receiverName,
// //       carPlate,
// //       totalWeight,
// //       cargoList
// //     } = req.body;

// //     // 🔢 1. አውቶማቲክ ተከታታይ የደረሰኝ ቁጥር ማፍለቂያ
// //     const lastReceipt = await (prisma as any).warehouseReceipt.findFirst({
// //       orderBy: { createdAt: 'desc' }
// //     });

// //     let nextReceiptNo = "№ 04301";
// //     if (lastReceipt && lastReceipt.receiptNo) {
// //       const match = lastReceipt.receiptNo.match(/\d+/);
// //       if (match) {
// //         const lastNum = parseInt(match[0], 10);
// //         const nextNum = lastNum + 1;
// //         nextReceiptNo = `№ ${String(nextNum).padStart(5, '0')}`;
// //       }
// //     }

// //     // 🕒 2. አውቶማቲክ የአሁናዊ ቀን እና ሰዓት ማዘጋጃ
// //     const now = new Date();
// //     const currentTime = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
// //     const currentDateGreg = gregDate || now.toISOString().split('T')[0]; // የአውሮፓ ቀን (2026-07-23)
// //     const currentDateEth = ethDate || "ሐምሌ 16, 2018";                  // የኢትዮጵያ ቀን

// //     // 💾 3. ወደ Neon PostgreSQL ማስገባት (ስልክ እና ታርጋ ባዶ ቢሆኑም ያልፋሉ!)
// //     const newReceipt = await (prisma as any).warehouseReceipt.create({
// //       data: {
// //         receiptNo: nextReceiptNo,
// //         ethDate: `${currentDateEth} (${currentDateGreg})`, // የኢትዮጵያ + የአውሮፓ ቀን አንድ ላይ
// //         time: currentTime,                                 // ሰዓት
// //         merchantName: merchantName || "ያልተጠቀሰ",
// //         merchantPhone: merchantPhone ? String(merchantPhone).trim() : "", // ባዶ ቢሆን ያልፋል!
// //         senderName: senderName || "ያልተጠቀሰ",
// //         senderPhone: senderPhone ? String(senderPhone).trim() : "",     // ባዶ ቢሆን ያልፋል!
// //         receiverName: receiverName || "ያልተጠቀሰ",
// //         carPlate: carPlate ? String(carPlate).trim().toUpperCase() : "",// ባዶ ቢሆን ያልፋል!
// //         totalWeight: Number(totalWeight) || 0,
// //         items: {
// //           create: Array.isArray(cargoList) ? cargoList.map((item: any) => ({
// //             description: item.description || 'እቃ',
// //             weight: Number(item.weight) || 0,
// //             category: item.category || 'ደረቅ',
// //             isLoaded: item.isLoaded || false,
// //             loaderType: item.loaderType || '',
// //             isMultiPackage: item.isMultiPackage || false,
// //             rawWeightsInput: item.rawWeightsInput || '',
// //             packages: item.packages ? JSON.parse(JSON.stringify(item.packages)) : []
// //           })) : []
// //         }
// //       },
// //       include: {
// //         items: true
// //       }
// //     });

// //     return res.status(201).json({
// //       success: true,
// //       message: "መረጃው በስኬት ዳታቤዝ ገብቷል!",
// //       data: newReceipt
// //     });

// //   } catch (error: any) {
// //     console.error("❌ ዳታቤዝ ላይ ማስገባት አልተቻለም:", error);
// //     return res.status(500).json({ message: "በዳታቤዝ መዝገባ ወቅት ስህተት ተፈጥሯል", error: error.message });
// //   }
// // });

// // // 6. በመኪና ታርጋ ቁጥር የተመዘገቡ እቃዎችን ፈልጎ ማምጫ (ለጫኙ / Loader View)
// // app.get('/api/warehouse/by-plate/:carPlate', async (req: Request, res: Response) => {
// //   try {
// //     const { carPlate } = req.params;

// //     const receipts = await (prisma as any).warehouseReceipt.findMany({
// //       where: { carPlate: carPlate },
// //       include: { items: true },
// //       orderBy: { createdAt: 'desc' }
// //     });

// //     return res.json(receipts);
// //   } catch (error) {
// //     console.error("❌ በታርጋ ፈልጎ ማምጣት አልተቻለም:", error);
// //     return res.status(500).json({ error: "መረጃውን ማግኘት አልተቻለም" });
// //   }
// // });


// // // ==========================================
// // // 📌 SECTION 3: የነጋዴ እቃዎች እና SMS APIs
// // // ==========================================

// // // 7. ሁሉንም የመጋዘን እቃዎች ማምጫ (Get All Transactions/Items)
// // app.get('/api/transactions', async (_req: Request, res: Response) => {
// //   try {
// //     const transactions = await (prisma as any).transaction.findMany({
// //       orderBy: { createdAt: 'desc' },
// //       include: { items: true }
// //     });
// //     return res.json(transactions);
// //   } catch (error) {
// //     console.error("❌ የመጋዘን እቃዎችን ማምጣት አልተቻለም:", error);
// //     return res.status(500).json({ error: "የመጋዘን እቃዎችን ማግኘት አልተቻለም" });
// //   }
// // });

// // // 8. የነጋዴውን ስልክ ቁጥር ማስተካከያ (Update Merchant Phone)
// // app.patch('/api/transactions/:id/phone', async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;
// //     const { merchantPhone } = req.body;

// //     const updated = await (prisma as any).transaction.update({
// //       where: { id },
// //       data: { merchantPhone }
// //     });

// //     return res.json({ success: true, updated });
// //   } catch (error) {
// //     console.error("❌ የስልክ ቁጥር ማዘመን አልተቻለም:", error);
// //     return res.status(500).json({ error: "ስልክ ቁጥሩን ማዘመን አልተቻለም" });
// //   }
// // });

// // // 9. በ AfroMessage በኩል SMS መላኪያ (Send SMS via AfroMessage)
// // app.post('/api/sms/send', async (req: Request, res: Response) => {
// //   try {
// //     const { transactionId, phone, message } = req.body;

// //     if (!phone || !message) {
// //       return res.status(400).json({ success: false, error: "ስልክ ቁጥር እና መልዕክት ያስፈልጋል!" });
// //     }

// //     // AfroMessage API ጥሪ
// //     const response = await axios.get('https://api.afromessage.com/api/send', {
// //       headers: {
// //         'Authorization': `Bearer ${AFROMESSAGE_TOKEN}`
// //       },
// //       params: {
// //         to: phone,
// //         message: message
// //       }
// //     });

// //     if (response.data && (response.data.acknowledge === 'success' || response.data.status === 'ACKNOWLEDGED')) {
// //       if (transactionId) {
// //         await (prisma as any).transaction.update({
// //           where: { id: transactionId },
// //           data: { isSmsSent: true }
// //         });
// //       }

// //       console.log(`📱 SMS በተሳካ ሁኔታ ተልኳል ለ: ${phone}`);
// //       return res.json({ success: true, message: "SMS በተሳካ ሁኔታ ተልኳል!", data: response.data });
// //     } else {
// //       console.error("❌ AfroMessage Error Response:", response.data);
// //       return res.status(400).json({ success: false, error: response.data?.response?.message || "SMS መላክ አልተቻለም" });
// //     }

// //   } catch (error: any) {
// //     console.error("❌ SMS Request Error:", error.response?.data || error.message);
// //     return res.status(500).json({ success: false, error: "ከ AfroMessage ጋር መገናኘት አልተቻለም" });
// //   }
// // });

// // // ==========================================
// // // 🚀 SERVER PORT
// // // ==========================================
// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`🚀 ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል`);
// // });

// // // const PORT = process.env.PORT || 3000;
// // // app.listen(PORT, () => {
// // //   console.log(`🚀 ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል`);
// // // });

// // import { createClient } from '@supabase/supabase-js';
// import express from 'express';
// import type { Request, Response } from 'express';
// import cors from 'cors';
// // import freightRoute from './frontend/src/routes/freightRoute.js';
// import { PrismaClient } from '@prisma/client';
// import axios from 'axios';

// // import express from 'express';
// // import cors from 'cors';
// // import orderRoutes from './frontend/src/routes/orderRoute.js';
// // import freightRoute from './freightRoute';
// // ከላይ ከሌሎቹ route imports ጋር ይሄን ጨምር፡
// // import orderRoute from './frontend/src/routes/orderRoute.js'; // ወይም እንደ ፋይልህ አቀማመጥ

// // ከ አፕሊኬሽን ሚድልዌሮችህ በኋላ (app.use...) ይሄን ጨምር፡


// const app = express();
// const prisma = new PrismaClient();



// app.use(cors());
// app.use(express.json());
// // app.use('/api', orderRoutes);
// // app.use('/api/freight', freightRoute);
// // app.use('/api/dispatches', freightRoute);
// // app.use('/api', orderRoute);

// // 🔑 AfroMessage API Key
// const AFROMESSAGE_TOKEN = process.env.AFROMESSAGE_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiMWw3bUR6VnFjMjhCRkt1N1JYQ043eEgxdEtkT3dmbUMiLCJleHAiOjE5NDI1MTY2MjIsImlhdCI6MTc4NDc1MDIyMiwianRpIjoiYTY0NDNiODYtNTJhZS00NjEzLWFiMTYtMjZlMTMyMTViYjQ2In0.BgYCZb_hjQE8tY6RcxpWsPsv_yd0LWc6CSZIaZQMrEs';
// const AFROMESSAGE_IDENTIFIER = process.env.AFROMESSAGE_IDENTIFIER || 'e80ad9d8-adf3-463f-80f4-7c4b39f7f164';

// // // 🔑 Supabase Client Setup
// // const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
// // const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// // const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// // ==========================================
// // 📌 SECTION 1: QUICKEXPENSE APIs (ወጪዎች እና ብድር)
// // ==========================================

// // 1. ሁሉንም ወጪዎች ማምጫ
// app.get('/api/quickexpense', async (_req: Request, res: Response) => {
//   try {
//     const expenses = await prisma.quickExpense.findMany({
//       orderBy: { createdAt: 'desc' }
//     });
//     return res.json(expenses);
//   } catch (error) {
//     console.error("❌ ዳታ ማምጣት አልተቻለም:", error);
//     return res.status(500).json({ error: "ዳታቤዝ ማግኘት አልተቻለም" });
//   }
// });

// // 2. አዲስ ወጪ/ብድር መመዝገቢያ
// app.post('/api/quickexpense', async (req: Request, res: Response) => {
//   try {
//     const { title, reason, amount, category, registeredBy, time, ethDate, ethMonth, gregDate, isLoan } = req.body;

//     const newExpense = await prisma.quickExpense.create({
//       data: {
//         title: title || reason || "ያልተጠቀሰ",
//         reason: reason || "",
//         amount: Number(amount) || 0,
//         category: category || (isLoan ? "ብድር" : "መደበኛ"),
//         registeredBy: registeredBy || "staff",
//         time: time || "",
//         ethDate: ethDate || "",
//         ethMonth: ethMonth || "",
//         gregDate: gregDate || "",
//         isLoan: Boolean(isLoan),
//         isReturned: false,
//         ownerNote: ""
//       }
//     });

//     return res.status(201).json(newExpense);
//   } catch (error) {
//     console.error("❌ ወጪ መመዝገብ አልተቻለም:", error);
//     return res.status(500).json({ error: "መመዝገብ አልተቻለም" });
//   }
// });

// // 3. የኦውነር መልእክት ማዘመኛ (Update Owner Note)
// app.put('/api/quickexpense/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { ownerNote } = req.body;

//     const updatedExpense = await prisma.quickExpense.update({
//       where: { id: id },
//       data: { ownerNote: ownerNote ?? "" }
//     });

//     return res.json(updatedExpense);
//   } catch (error) {
//     console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
//     return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
//   }
// });
// // // 3. የኦውነር መልእክት ማዘመኛ
// // app.put('/api/quickexpense/:id', async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;
// //     const { ownerNote } = req.body;

// //     const updatedExpense = await prisma.quickExpense.update({
// //       where: { id },
// //       data: { ownerNote: ownerNote ?? "" }
// //     });

// //     return res.json(updatedExpense);
// //   } catch (error) {
// //     console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
// //     return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
// //   }
// // });

// // 4. ብድር ተመልሷል ማድረጊያ (Mark Loan as Returned)
// app.patch('/api/quickexpense/:id/return', async (req, res) => {
//   try {
//     const { id } = req.params;

//     const updated = await prisma.quickExpense.update({
//       where: { id: id },
//       data: { isReturned: true }
//     });

//     return res.json(updated);
//   } catch (error) {
//     console.error("❌ ብድር መመለስ አልተቻለም:", error);
//     return res.status(500).json({ error: "ብድሩን መመለስ አልተቻለም" });
//   }
// });


// // ==========================================
// // 📌 SECTION 2: WAREHOUSE RECEIVER & CARGO APIs
// // ==========================================


// // 5. አዲስ የተረከበውን እቃ መመዝገቢያ (ለ WarehouseReceipt እና CargoItem)
// app.post('/api/warehouse/receive', async (req: Request, res: Response) => {
//   try {
//     const {
//       receiptNo,
//       ethDate,
//       gregDate,
//       time,
//       merchantName,
//       merchantPhone,
//       senderName,
//       senderPhone,
//       receiverName,
//       carPlate,
//       totalWeight,
//       cargoList
//     } = req.body;

//     // 🔢 1. አውቶማቲክ ተከታታይ የደረሰኝ ቁጥር ማፍለቂያ
//     let finalReceiptNo = receiptNo ? String(receiptNo).trim() : "";

//     if (!finalReceiptNo) {
//       const lastReceipt = await (prisma as any).warehouseReceipt.findFirst({
//         orderBy: { createdAt: 'desc' }
//       });

//       finalReceiptNo = "№ 04301";
//       if (lastReceipt && lastReceipt.receiptNo) {
//         const match = lastReceipt.receiptNo.match(/\d+/);
//         if (match) {
//           const lastNum = parseInt(match[0], 10);
//           const nextNum = lastNum + 1;
//           finalReceiptNo = `№ ${String(nextNum).padStart(5, '0')}`;
//         }
//       }
//     }

//     // 🛑 2. የደረሰኝ ቁጥሩ ቀድሞ የተመዘገበ ከሆነ ይከላከላል (ቀይ መስመሩ እዚህ ጋር ጠፍቷል!)
//     const existing = await (prisma as any).warehouseReceipt.findFirst({
//       where: { receiptNo: finalReceiptNo }
//     });

//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: `⚠️ የደረሰኝ ቁጥር ${finalReceiptNo} ቀደም ብሎ ተመዝግቧል! ድግግሞሽ አይፈቀድም።`
//       });
//     }

//     // 🕒 3. ቀን እና ሰዓት ማዘጋጀት
//     const now = new Date();
//     const currentTime = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
//     const currentDateGreg = gregDate || now.toISOString().split('T')[0];
//     const currentDateEth = ethDate || "ሐምሌ 16, 2018";
//     const dateFormatted = `${currentDateEth} (${currentDateGreg})`;

//     // 💾 4. ወደ ዳታቤዝ ማስገባት
//     const newReceipt = await (prisma as any).warehouseReceipt.create({
//       data: {
//         receiptNo: finalReceiptNo,
//         ethDate: dateFormatted,
//         time: currentTime,
//         merchantName: merchantName || "ያልተጠቀሰ",
//         merchantPhone: merchantPhone ? String(merchantPhone).trim() : "",
//         senderName: senderName || "ያልተጠቀሰ",
//         senderPhone: senderPhone ? String(senderPhone).trim() : "",
//         receiverName: receiverName || "ያልተጠቀሰ",
//         carPlate: carPlate ? String(carPlate).trim().toUpperCase() : "",
//         totalWeight: Number(totalWeight) || 0,
//         items: {
//           create: Array.isArray(cargoList) ? cargoList.map((item: any) => ({
//             description: item.description || 'እቃ',
//             weight: Number(item.weight) || 0,
//             category: item.category || 'ደረቅ',
//             isLoaded: item.isLoaded || false,
//             loaderType: item.loaderType || '',
//             isMultiPackage: item.isMultiPackage || false,
//             rawWeightsInput: item.rawWeightsInput || '',
//             status: 'በመጋዘን ያለ',
//             packages: item.packages ? JSON.parse(JSON.stringify(item.packages)) : []
//           })) : []
//         }
//       },
//       include: {
//         items: true
//       }
//     });

//     return res.status(201).json({
//       success: true,
//       message: "መረጃው በስኬት ዳታቤዝ ገብቷል!",
//       data: newReceipt
//     });

//   } catch (error: any) {
//     console.error("❌ ዳታቤዝ ላይ ማስገባት አልተቻለም:", error);
//     return res.status(500).json({ message: "በዳታቤዝ መዝገባ ወቅት ስህተት ተፈጥሯል", error: error.message });
//   }
// });

// // 7.1. የተወሰነን እቃ ብቻ "ተመልሷል" ማድረጊያ API
// app.patch('/api/warehouse/items/:itemId/return', async (req: Request, res: Response) => {
//   try {
//     const { itemId } = req.params;

//     // የልዩ እቃውን (CargoItem) status ወደ "ተመልሷል" ይቀይረዋል
//     const updatedItem = await (prisma as any).cargoItem.update({
//       where: { id: String(itemId) },
//       data: { status: 'ተመልሷል' }
//     });

//     return res.json({
//       success: true,
//       message: 'እቃው ተመልሷል ተብሎ በተሳካ ሁኔታ ተመዝግቧል!',
//       data: updatedItem
//     });
//   } catch (error: any) {
//     console.error("❌ እቃውን መመለስ አልተቻለም:", error);
//     return res.status(500).json({ error: "እቃውን መመለስ አልተቻለም" });
//   }
// });

// // የደረሰኝ ID (receiptId) በመጠቀም በስሩ ያሉትን እቃዎች በሙሉ "ተመልሷል" ማድረጊያ API
// app.patch('/api/warehouse/receipts/:receiptId/return-all', async (req: Request, res: Response) => {
//   try {
//     const { receiptId } = req.params;

//     // በዚያ ደረሰኝ ስር ያሉ እቃዎችን status በሙሉ 'ተመልሷል' ያደርገዋል
//     const updatedItems = await (prisma as any).cargoItem.updateMany({
//       where: { receiptId: String(receiptId) },
//       data: { status: 'ተመልሷል' }
//     });

//     return res.json({
//       success: true,
//       message: 'የደረሰኙ እቃዎች በሙሉ ተመልሰዋል ተብለው ተመዝግበዋል!',
//       data: updatedItems
//     });
//   } catch (error: any) {
//     console.error("❌ እቃዎችን መመለስ አልተቻለም:", error);
//     return res.status(500).json({ error: "እቃዎችን መመለስ አልተቻለም", details: error.message });
//   }
// });

// // 6. ሁሉንም የመጋዘን ደረሰኞች እና እቃዎች ማምጫ
// app.get('/api/warehouse/receipts', async (_req: Request, res: Response) => {
//   try {
//     const receipts = await prisma.warehouseReceipt.findMany({
//       include: { items: true },
//       orderBy: { createdAt: 'desc' }
//     });
//     return res.json(receipts);
//   } catch (error) {
//     console.error("❌ የመጋዘን ደረሰኞችን ማምጣት አልተቻለም:", error);
//     return res.status(500).json({ error: "መረጃውን ማግኘት አልተቻለም" });
//   }
// });

// // 6. በመኪና ታርጋ ቁጥር የተመዘገቡ እቃዎችን ፈልጎ ማምጫ (ለጫኙ / Loader View)
// app.get('/api/warehouse/by-plate/:carPlate', async (req: Request, res: Response) => {
//   try {
//     const { carPlate } = req.params;

//     const receipts = await (prisma as any).warehouseReceipt.findMany({
//       where: { carPlate: carPlate },
//       include: { items: true },
//       orderBy: { createdAt: 'desc' }
//     });

//     return res.json(receipts);
//   } catch (error) {
//     console.error("❌ በታርጋ ፈልጎ ማምጣት አልተቻለም:", error);
//     return res.status(500).json({ error: "መረጃውን ማግኘት አልተቻለም" });
//   }
// });



// // 8. የነጋዴውን ስልክ ቁጥር ወይም መረጃ ማስተካከያ በ Receipt ID
// app.patch('/api/warehouse/receipts/:id/phone', async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { merchantPhone } = req.body;

//     const updated = await (prisma as any).warehouseReceipt.update({
//       where: { id: String(id) },
//       data: { merchantPhone: String(merchantPhone || '') }
//     });

//     return res.json({ success: true, updated });
//   } catch (error: any) {
//     console.error("❌ የስልክ ቁጥር ማዘመን አልተቻለም:", error);
//     return res.status(500).json({ error: "ስልክ ቁጥሩን ማዘመን አልተቻለም" });
//   }
// });

// // 9. በ AfroMessage በኩል SMS መላኪያ
// // 9. በ AfroMessage በኩል SMS መላኪያ
// app.post('/api/sms/send', async (req: Request, res: Response) => {
//   try {
//     const { receiptId, phone, message } = req.body;

//     if (!phone || !message) {
//       return res.status(400).json({ success: false, error: "ስልክ ቁጥር እና መልዕክት ያስፈልጋል!" });
//     }

//     // 💡 ስልክ ቁጥሩን ማስተካከያ (0912345678 -> +251912345678)
//     let formattedPhone = phone.toString().trim();
//     if (formattedPhone.startsWith('0')) {
//       formattedPhone = '+251' + formattedPhone.slice(1);
//     } else if (formattedPhone.startsWith('251')) {
//       formattedPhone = '+' + formattedPhone;
//     } else if (!formattedPhone.startsWith('+251')) {
//       formattedPhone = '+251' + formattedPhone;
//     }

//     // AfroMessage API ጥሪ
//     const response = await axios.get('https://api.afromessage.com/api/send', {
//       headers: {
//         'Authorization': `Bearer ${AFROMESSAGE_TOKEN.trim()}`
//       },
//       params: {
//         to: formattedPhone, // 👈 እዚህ ጋር formattedPhone ተተክቷል
//         message: message
//       }
//     });

//     if (response.data && (response.data.acknowledge === 'success' || response.data.status === 'ACKNOWLEDGED')) {
//       if (receiptId) {
//         await prisma.merchantStatus.create({
//           data: {
//             merchantName: "Customer",
//             phoneNumber: formattedPhone,
//             goodsDescription: message,
//             status: "SENT",
//             smsSent: true
//           }
//         });
//       }

//       console.log(`📱 SMS በተሳካ ሁኔታ ተልኳል ለ: ${formattedPhone}`);
//       return res.json({ success: true, message: "SMS በተሳካ ሁኔታ ተልኳል!", data: response.data });
//     } else {
//       console.error("❌ AfroMessage Error Response:", response.data);
//       return res.status(400).json({ success: false, error: response.data?.response?.errors?.[0] || response.data?.response?.message || "SMS መላክ አልተቻለም" });
//     }

//   } catch (error: any) {
//     console.error("❌ SMS Request Error Details:", error.response?.data || error.message);
//     return res.status(500).json({ 
//       success: false, 
//       error: error.response?.data?.response?.errors?.[0] || error.response?.data?.message || "ከ AfroMessage ጋር መገናኘት አልተቻለም" 
//     });
//   }
// });


// // ==========================================
// // 🚀 SERVER PORT
// // ==========================================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል`);
// });

// import express from 'express';
// import type { Request, Response } from 'express';
// import cors from 'cors';
// import { PrismaClient } from '@prisma/client';
// import axios from 'axios';



// import freightRoute from './frontend/src/routes/freightRoute.js';
// // import loadingRoute from './frontend/src/routes/Loadingroute.js';
// // import loadingRoute from "./frontend/src/routes/Loadingroute.js"
// import loadingRoute from "./frontend/src/routes/loadingRoute.js"
// import path from 'path';

import 'dotenv/config';               // 🆕 ይህን ካላደረግህ .env ላይኖር ይችላል
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

import freightRoute from './frontend/src/routes/freightRoute.js';
import loadingRoute from "./frontend/src/routes/loadingRoute.js"
import contactsRoute from './frontend/src/routes/contactsRoute.js';          // 🆕
import { requireAppKey } from './middleware/requireAppKey.js';  // 🆕
import path from 'path';






// const app = express();
// const prisma = new PrismaClient();



// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));



// app.use('/api/freight', freightRoute);
// app.use('/api/loading', loadingRoute)

// // 🔑 AfroMessage API Key
// const AFROMESSAGE_TOKEN = process.env.AFROMESSAGE_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiaUt3UmVGdXgxNjE5VVc0ajZuZWhuRDViRk12dURNTTgiLCJleHAiOjE5NDM0Nzk1NDcsImlhdCI6MTc4NTcxMzE0NywianRpIjoiOWUwOWQyMjktZjk1Yy00Nzk1LTk3YTktNTgzZGIxNjgzMDc3In0.CWBa4AszR9g-qPiUWiJNJjhXo_dM31hrhRYICotaWzY';


// const AFROMESSAGE_IDENTIFIER = process.env.AFROMESSAGE_IDENTIFIER || 'e80ad9d8-adf3-463f-80f4-7c4b39f7f164';

const app = express();
const prisma = new PrismaClient();

// 🔒 CORS — ከዚህ በፊት app.use(cors()) ማንንም ይፈቅድ ነበር። አሁን ገደብ አድርገናል።
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Postman / curl (ምንም origin የሌላቸው) ካልፈለግክ ገድብ - ለጊዜው እናስተናግዳቸዋለን
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: ይህ origin አልተፈቀደም'));
  }
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/freight', freightRoute);
app.use('/api/loading', loadingRoute);
app.use('/api/contacts', requireAppKey, contactsRoute);   // 🆕 ጥበቃ ተጨምሮለታል

// 🔑 SMS token — ከዚህ በፊት hardcoded fallback ነበረው (ተጋልጦ ነበር!)
// አሁን ከ .env ካልመጣ ጨርሶ ስህተት ይሰጣል፣ የቆየ token አይጠቀምም።
const AFROMESSAGE_TOKEN = process.env.AFROMESSAGE_TOKEN;
const AFROMESSAGE_IDENTIFIER = process.env.AFROMESSAGE_IDENTIFIER;

if (!AFROMESSAGE_TOKEN || !AFROMESSAGE_IDENTIFIER) {
  console.warn('⚠️  AFROMESSAGE_TOKEN ወይም AFROMESSAGE_IDENTIFIER በ .env ውስጥ አልተገኘም — SMS መላክ አይሰራም!');
}

// 🆕 Owner PIN ማረጋገጫ — backend ላይ ብቻ ተቀምጦ ይፈተሻል፣ frontend bundle ላይ አይታይም
app.post('/api/owner/verify-pin', (req: Request, res: Response) => {
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


// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ==========================================
// 📌 SECTION 1: QUICKEXPENSE APIs (ወጪዎች እና ብድር)
// ==========================================

// 1. ሁሉንም ወጪዎች ማምጫ
app.get('/api/quickexpense', async (_req: Request, res: Response) => {
  try {
    const expenses = await prisma.quickExpense.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(expenses);
  } catch (error) {
    console.error("❌ ዳታ ማምጣት አልተቻለም:", error);
    return res.status(500).json({ error: "ዳታቤዝ ማግኘት አልተቻለም" });
  }
});

// 2. አዲስ ወጪ/ብድር መመዝገቢያ
app.post('/api/quickexpense', async (req: Request, res: Response) => {
  try {
    const { title, reason, amount, category, registeredBy, time, ethDate, ethMonth, gregDate, isLoan } = req.body;

    const newExpense = await prisma.quickExpense.create({
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

// 3. የኦውነር መልእክት ማዘመኛ (Update Owner Note)
app.put('/api/quickexpense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerNote } = req.body;

    const updatedExpense = await prisma.quickExpense.update({
      where: { id: id },
      data: { ownerNote: ownerNote ?? "" }
    });

    return res.json(updatedExpense);
  } catch (error) {
    console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
    return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
  }
});
// // 3. የኦውነር መልእክት ማዘመኛ
// app.put('/api/quickexpense/:id', async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { ownerNote } = req.body;

//     const updatedExpense = await prisma.quickExpense.update({
//       where: { id },
//       data: { ownerNote: ownerNote ?? "" }
//     });

//     return res.json(updatedExpense);
//   } catch (error) {
//     console.error("❌ የኦውነር መልእክት ማዘመን አልተቻለም:", error);
//     return res.status(500).json({ error: "መልእክቱን ማዘመን አልተቻለም" });
//   }
// });

// 4. ብድር ተመልሷል ማድረጊያ (Mark Loan as Returned)
app.patch('/api/quickexpense/:id/return', async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.quickExpense.update({
      where: { id: id },
      data: { isReturned: true }
    });

    return res.json(updated);
  } catch (error) {
    console.error("❌ ብድር መመለስ አልተቻለም:", error);
    return res.status(500).json({ error: "ብድሩን መመለስ አልተቻለም" });
  }
});


app.post('/api/quickincome', async (req: Request, res: Response) => {
  try {
    const { title, reason, amount, category, registeredBy, time, ethDate, ethMonth, gregDate, ownerNote } = req.body;

    const newIncome = await prisma.quickExpense.create({
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
    // 🔴 ኤረሩን ቀጥታ ወደ Client እንልካለን ችግሩ ምን እንደሆነ በግልጽ እንዲታይ
    return res.status(500).json({ error: error.message || "ገቢ መመዝገብ አልተቻለም" });
  }
});

// 🗑️ መዝገብ ጨርሶ ከዳታቤዝ ማጥፊያ (Hard Delete) Route
app.delete('/api/quickexpense/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.quickExpense.delete({
  where: { id: id as string },
});

    res.status(200).json({ message: "መዝገቡ ሙሉ በሙሉ ከዳታቤዝ ተሰርዟል!" });
  } catch (error) {
    console.error("መዝገቡን ማጥፋት አልተቻለም:", error);
    res.status(500).json({ error: "መዝገቡን ማጥፋት አልተቻለም።" });
  }
});

// 🔴 1. መዝገብ መሰረዣ ኤፒአይ (Soft Delete API for Staff)
app.patch('/api/quickexpense/:id/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deleteReason } = req.body;

    const deletedExpense = await prisma.quickExpense.update({
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
    return res.status(500).json({ error: "መዝገቡን መሰረዝ አልተቻለም" });
  }
});

// 👁️ 2. ለአለቃው (Owner) የተሰረዙትን ብቻ ማሳያ ኤፒአይ
app.get('/api/quickexpense/deleted', async (_req: Request, res: Response) => {
  try {
    const deletedExpenses = await prisma.quickExpense.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: 'desc' }
    });
    return res.json(deletedExpenses);
  } catch (error: any) {
    console.error("❌ የተሰረዙ መረጃዎችን ማምጣት አልተቻለም:", error);
    return res.status(500).json({ error: "የተሰረዙ መረጃዎችን ማምጣት አልተቻለም" });
  }
});


// ==========================================
// 📌 SECTION 2: WAREHOUSE RECEIVER & CARGO APIs
// ==========================================


// 5. አዲስ የተረከበውን እቃ መመዝገቢያ (ለ WarehouseReceipt እና CargoItem)
app.post('/api/warehouse/receive', async (req: Request, res: Response) => {
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

    // 🔢 1. አውቶማቲክ ተከታታይ የደረሰኝ ቁጥር ማፍለቂያ
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

    // 🛑 2. የደረሰኝ ቁጥሩ ቀድሞ የተመዘገበ ከሆነ ይከላከላል (ቀይ መስመሩ እዚህ ጋር ጠፍቷል!)
    const existing = await (prisma as any).warehouseReceipt.findFirst({
      where: { receiptNo: finalReceiptNo }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `⚠️ የደረሰኝ ቁጥር ${finalReceiptNo} ቀደም ብሎ ተመዝግቧል! ድግግሞሽ አይፈቀድም።`
      });
    }

    // 🕒 3. ቀን እና ሰዓት ማዘጋጀት
    const now = new Date();
    const currentTime = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentDateGreg = gregDate || now.toISOString().split('T')[0];
    const currentDateEth = ethDate || "ሐምሌ 16, 2018";
    const dateFormatted = `${currentDateEth} (${currentDateGreg})`;

    // 💾 4. ወደ ዳታቤዝ ማስገባት
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
    return res.status(500).json({ message: "በዳታቤዝ መዝገባ ወቅት ስህተት ተፈጥሯል", error: error.message });
  }
});

// 7.1. የተወሰነን እቃ ብቻ "ተመልሷል" ማድረጊያ API
app.patch('/api/warehouse/items/:itemId/return', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    // የልዩ እቃውን (CargoItem) status ወደ "ተመልሷል" ይቀይረዋል
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
    return res.status(500).json({ error: "እቃውን መመለስ አልተቻለም" });
  }
});

// የደረሰኝ ID (receiptId) በመጠቀም በስሩ ያሉትን እቃዎች በሙሉ "ተመልሷል" ማድረጊያ API
app.patch('/api/warehouse/receipts/:receiptId/return-all', async (req: Request, res: Response) => {
  try {
    const { receiptId } = req.params;

    // በዚያ ደረሰኝ ስር ያሉ እቃዎችን status በሙሉ 'ተመልሷል' ያደርገዋል
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
    return res.status(500).json({ error: "እቃዎችን መመለስ አልተቻለም", details: error.message });
  }
});

// 🎯 7.2. 🛑 [አዲስ የተጨመረ API] — የ WarehouseReceipt SMS Status ማዘመኛ
app.patch('/api/warehouse/receipts/:id/sms-status', async (req: Request, res: Response) => {
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
    return res.status(500).json({ error: "የ SMS status ማዘመን አልተቻለም" });
  }
});

// 6. ሁሉንም የመጋዘን ደረሰኞች እና እቃዎች ማምጫ
app.get('/api/warehouse/receipts', async (_req: Request, res: Response) => {
  try {
    const receipts = await prisma.warehouseReceipt.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(receipts);
  } catch (error) {
    console.error("❌ የመጋዘን ደረሰኞችን ማምጣት አልተቻለም:", error);
    return res.status(500).json({ error: "መረጃውን ማግኘት አልተቻለም" });
  }
});

// 6. በመኪና ታርጋ ቁጥር የተመዘገቡ እቃዎችን ፈልጎ ማምጫ (ለጫኙ / Loader View)
app.get('/api/warehouse/by-plate/:carPlate', async (req: Request, res: Response) => {
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



// 8. የነጋዴውን ስልክ ቁጥር ወይም መረጃ ማስተካከያ በ Receipt ID
app.patch('/api/warehouse/receipts/:id/phone', async (req: Request, res: Response) => {
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
    return res.status(500).json({ error: "ስልክ ቁጥሩን ማዘመን አልተቻለም" });
  }
});

// 9. በ AfroMessage በኩል SMS መላኪያ
// 9. በ AfroMessage በኩል SMS መላኪያ
// app.post('/api/sms/send', async (req: Request, res: Response) => {
//   try {
//     const { receiptId, phone, message } = req.body;

//     if (!phone || !message) {
//       return res.status(400).json({ success: false, error: "ስልክ ቁጥር እና መልዕክት ያስፈልጋል!" });
//     }

    
//     let formattedPhone = phone.toString().trim();
//     if (formattedPhone.startsWith('0')) {
//       formattedPhone = '+251' + formattedPhone.slice(1);
//     } else if (formattedPhone.startsWith('251')) {
//       formattedPhone = '+' + formattedPhone;
//     } else if (!formattedPhone.startsWith('+251')) {
//       formattedPhone = '+251' + formattedPhone;
//     }

//     // AfroMessage API ጥሪ
//     const response = await axios.get('https://api.afromessage.com/api/send', {
//       headers: {
//         'Authorization': `Bearer ${AFROMESSAGE_TOKEN.trim()}`
//       },
//       params: {
//         to: formattedPhone, // 👈 እዚህ ጋር formattedPhone ተተክቷል
//         message: message
//       }
//     });

//     if (response.data && (response.data.acknowledge === 'success' || response.data.status === 'ACKNOWLEDGED')) {
//       if (receiptId) {
//         await prisma.merchantStatus.create({
//           data: {
//             merchantName: "Customer",
//             phoneNumber: formattedPhone,
//             goodsDescription: message,
//             status: "SENT",
//             smsSent: true
//           }
//         });
//       }

//       console.log(`📱 SMS በተሳካ ሁኔታ ተልኳል ለ: ${formattedPhone}`);
//       return res.json({ success: true, message: "SMS በተሳካ ሁኔታ ተልኳል!", data: response.data });
//     } else {
//       console.error("❌ AfroMessage Error Response:", response.data);
//       return res.status(400).json({ success: false, error: response.data?.response?.errors?.[0] || response.data?.response?.message || "SMS መላክ አልተቻለም" });
//     }

//   } catch (error: any) {
//     console.error("❌ SMS Request Error Details:", error.response?.data || error.message);
//     return res.status(500).json({ 
//       success: false, 
//       error: error.response?.data?.response?.errors?.[0] || error.response?.data?.message || "ከ AfroMessage ጋር መገናኘት አልተቻለም" 
//     });
//   }
// });

app.post('/api/sms/send', async (req: Request, res: Response) => {
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
        await prisma.merchantStatus.create({
          data: { merchantName: "Customer", phoneNumber: formattedPhone, goodsDescription: message, status: "SENT", smsSent: true }
        });
      }
      console.log(`📱 SMS በተሳካ ሁኔታ ተልኳል ለ: ${formattedPhone}`);
      return res.json({ success: true, message: "SMS በተሳካ ሁኔታ ተልኳል!", data: response.data });
    } else {
      return res.status(400).json({ success: false, error: response.data?.response?.errors?.[0] || "SMS መላክ አልተቻለም" });
    }
  } catch (error: any) {
    console.error("❌ SMS Error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.response?.data?.message || "ከ AfroMessage ጋር መገናኘት አልተቻለም" });
  }
});


// ==========================================
// 🚀 SERVER PORT
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል`);
});

