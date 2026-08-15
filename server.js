// import { PrismaClient } from "@prisma/client";
// import * as crypto from "crypto";
// import * as path from "path";
// import { execSync } from "child_process";
// import * as fs from "fs";
// import express from 'express';
// import cors from 'cors';
// import itemRouter from './frontend/src/routes/itemRoute.js';
// const prisma = new PrismaClient();
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/api', itemRouter);
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 ሰንሰለት ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል!`);
// });
// // 1. እቃ መጋዘን የማስገቢያ ተግባር
// async function receiveItemIntoWarehouse(
//   merchantName: string,
//   merchantPhone: string,
//   typeAndDetails: string,
//   weightKg: number,
//   senderName: string,
//   senderPhone: string,
//   receiverName: string
// ) {
//   try {
//     let merchant = await prisma.merchant.findUnique({
//       where: { phone: merchantPhone }
//     });
//     if (!merchant) {
//       merchant = await prisma.merchant.create({
//         data: {
//           id: crypto.randomUUID(),
//           name: merchantName,
//           phone: merchantPhone
//         }
//       });
//     }
//     const item = await prisma.item.create({
//       data: {
//         id: crypto.randomUUID(),
//         merchantId: merchant.id,
//         typeAndDetails,
//         weightKg,
//         senderName,
//         senderPhone,
//         receiverName,
//         status: "IN_WAREHOUSE"
//       }
//     });
//     console.log(`📥 እቃ መጋዘን ገባ፦ [${typeAndDetails}] - ባለቤት፦ ${merchantName}`);
//     return item;
//   } catch (error) {
//     console.error("❌ እቃ ለመረከብ ስህተት አጋጥሟል:", error);
//   }
// }
// // 2. እቃ ወደ መኪና የመጫኛ ተግባር
// async function loadItemsToTruck(itemIds: string[]) {
//   try {
//     await prisma.item.updateMany({
//       where: { id: { in: itemIds }, status: "IN_WAREHOUSE" },
//       data: { status: "LOADED" }
//     });
//     console.log(`\n--------------------------------------------------`);
//     console.log(`🚚 ሰራተኛው ታብሌት ላይ መርጦ [${itemIds.length}] እቃዎችን ወደ መኪና ጫነ!`);
//     console.log(`--------------------------------------------------`);
//   } catch (error) {
//     console.error("❌ መኪና ላይ ለመጫን ስህተት አጋጥሟል:", error);
//   }
// }
// // 3. የኤክሴል ሪፖርት በፓይተን (openpyxl) ሎጎና ከለር ጠብቆ የማመንጨት ተግባር
// async function generateExcelReportForBilling() {
//   try {
//     const loadedItems = await prisma.item.findMany({
//       where: { status: 'LOADED', waybillId: null },
//       include: { merchant: true }
//     });
//     if (loadedItems.length === 0) {
//       console.log("⚠️ ለጭነት የተዘጋጀ እቃ አልተገኘም!");
//       return;
//     }
//     const aggregatedData: { [key: string]: { name: string; phone: string; details: string[]; totalWeight: number } } = {};
//     for (const item of loadedItems) {
//       const key = item.merchant.phone;
//       if (!aggregatedData[key]) {
//         aggregatedData[key] = {
//           name: item.merchant.name,
//           phone: item.merchant.phone,
//           details: [item.typeAndDetails],
//           totalWeight: item.weightKg
//         };
//       } else {
//         aggregatedData[key].details.push(item.typeAndDetails);
//         aggregatedData[key].totalWeight += item.weightKg;
//       }
//     }
//     const dataList = Object.values(aggregatedData).map((data, idx) => ({
//       index: idx + 1,
//       name: data.name,
//       phone: data.phone,
//       details: data.details.join(' ፣ '),
//       totalWeight: data.totalWeight
//     }));
//     const tempDataPath = path.join(process.cwd(), 'temp_billing_data.json');
//     fs.writeFileSync(tempDataPath, JSON.stringify(dataList, null, 2), 'utf-8');
//     // 📁 1. ሪፖርቶች የሚቀመጡበትን ፎልደር ማዘጋጀት
//     const reportDir = path.join(process.cwd(), 'የሂሳብ_ሪፖርቶች');
//     if (!fs.existsSync(reportDir)) {
//       fs.mkdirSync(reportDir, { recursive: true });
//     }
//     // 📅 2. ትክክለኛውን ቀን እና ሰዓት (ሰዓት፣ ደቂቃ፣ ሰከንድ) ማዘጋጀት
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     const seconds = String(now.getSeconds()).padStart(2, '0');
//     // ውጤት ቅርፅ፦ 2026-07-03_13-45-22
//     const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
//     // 📍 ሙሉ የፋይል መንገድ (በፎልደሩ ውስጥ እንዲቀመጥ)
//     const outputFileName = `የእቃ_ዝርዝር_መጻፊያ_${timestamp}.xlsx`;
//     const fullOutputPath = path.join(reportDir, outputFileName);
//     // 🐍 የፓይተን ኮድ (ፋይሉ ወደ አዲሱ ፎልደር እንዲፃፍ ተደርጓል)
//     const pythonScriptCode = `
// import json
// import openpyxl
// import os
// import sys
// if sys.platform == 'win32':
//     import io
//     sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
//     sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
// try:
//     with open('temp_billing_data.json', 'r', encoding='utf-8') as f:
//         data_list = json.load(f)
//     template_path = 'እቃ ዝርዝር.xlsx'
//     output_path = r'${fullOutputPath}'
//     if os.path.exists(output_path):
//         try:
//             os.remove(output_path)
//         except PermissionError:
//             print("ERROR_PERMISSION_DENIED")
//             sys.exit(0)
//     wb = openpyxl.load_workbook(template_path, data_only=False)
//     ws = wb.active
//     start_row = 8
//     for row_data in data_list:
//         ws[f'A{start_row}'] = row_data['index']
//         ws[f'B{start_row}'] = row_data['name']
//         ws[f'C{start_row}'] = row_data['phone']
//         ws[f'D{start_row}'] = row_data['details']
//         ws[f'E{start_row}'] = row_data['totalWeight']
//         start_row += 1
//     wb.save(output_path)
//     print("SUCCESS")
// except Exception as e:
//     print(f"ERROR: {str(e)}")
// `;
//     const tempPyPath = path.join(process.cwd(), 'update_excel.py');
//     fs.writeFileSync(tempPyPath, pythonScriptCode, 'utf-8');
//     const output = execSync('python update_excel.py', { encoding: 'utf-8' }).trim();
//     if (fs.existsSync(tempDataPath)) fs.unlinkSync(tempDataPath);
//     if (fs.existsSync(tempPyPath)) fs.unlinkSync(tempPyPath);
//     if (output === "SUCCESS") {
//       console.log(`======================================================================================`);
//       console.log(`✅ ሪፖርቱ በስኬት ተፈጥሮ "የሂሳብ_ሪፖርቶች" ፎልደር ውስጥ ገብቷል!`);
//       console.log(`📂 ፋይል ስም፦ ${outputFileName}`);
//       console.log(`======================================================================================`);
//     } else if (output === "ERROR_PERMISSION_DENIED") {
//       console.log(`\n⚠️  ስህተት፦ ይህ ፋይል ቀድሞ ተከፍቷል!`);
//     } else {
//       console.error("❌ የኤክሴል ስክሪፕት ስህተት፦", output);
//     }
//   } catch (error) {
//     console.error("❌ የኤክሴል ሪፖርት ሲሰራ ስህተት አጋጥሟል:", error);
//   }
// }
// // 4. የማስኬጃ ዋና Main Function
// async function main() {
//   console.log("🚀 የሰንሰለት ሙሉ የተያያዘ የዲጂታል ሲስተም ስራ ጀምሯል...\n");
//   // ፈተና ዳታዎችን ማስገባት
//   const item1 = await receiveItemIntoWarehouse("ቦጋለ አሰፋ", "0911223344", "300 ወፍራም ጥላ", 150, "አብረሃም", "0912000000", "ከድር");
//   const item2 = await receiveItemIntoWarehouse("ቦጋለ አሰፋ", "0911223344", "50 ካርቶን ጫማ", 80, "አብረሃም", "0912000000", "ከድር");
//   const item3 = await receiveItemIntoWarehouse("አልማዝ ደምሴ", "0922334455", "200 ባለ 020 ጥላ", 100, "ዮናስ", "0913000000", "ቲና");
//   if (item1 && item2 && item3) {
//     // መኪና ላይ መጫን
//     await loadItemsToTruck([item1.id, item2.id, item3.id]);
//     // ሪፖርት ማመንጨት
//     await generateExcelReportForBilling();
//   }
// }
// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
// import { PrismaClient } from "@prisma/client";
// import * as crypto from "crypto";
// import * as path from "path";
// import { execSync } from "child_process";
// import * as fs from "fs";
// import express from 'express';
// import cors from 'cors';
// import itemRouter from './frontend/src/routes/itemRoute.js';
// const prisma = new PrismaClient();
// const app = express();
// app.use(cors());
// app.use(express.json());
// // ----------------------------------------------------------------------
// // 1. የቆዩ ROUTERs
// // ----------------------------------------------------------------------
// app.use('/api', itemRouter);
// // ----------------------------------------------------------------------
// // 2. QUICK EXPENSE TRACKER APIs (የወጪ መቆጣጠሪያ)
// // ----------------------------------------------------------------------
// // ሁሉንም ወጪዎች ማምጫ (GET)
// app.get('/api/expenses', async (req, res) => {
//   try {
//     const expenses = await (prisma as any).quickExpense.findMany({
//       orderBy: { createdAt: 'desc' },
//     });
//     res.json(expenses);
//   } catch (error) {
//     console.error("❌ ወጪዎችን ለማምጣት ስህተት፦", error);
//     res.status(500).json({ error: 'ወጪዎችን ማምጣት አልተቻለም' });
//   }
// });
// // አዲስ ወጪ መመዝገቢያ (POST)
// app.post('/api/expenses', async (req, res) => {
//   // Frontend reason ወይም title ሊልክ ስለሚችል ሁለቱንም እንቀበላለን
//   const { title, reason, amount, category, registeredBy, notes } = req.body;
//   try {
//     const newExpense = await (prisma as any).quickExpense.create({
//       data: {
//         id: crypto.randomUUID(), // ወይም v4 UUID
//         title: title || reason || "ያልተጠቀሰ ወጪ", // title ከሌለ reasonን ይጠቀማል
//         amount: Number(amount),
//         category: category || "መደበኛ",
//         registeredBy: registeredBy || "ያልተጠቀሰ",
//         notes: notes || "",
//       },
//     });
//     res.json(newExpense);
//   } catch (error) {
//     console.error("❌ ወጪ ለመመዝገብ ስህተት፦", error);
//     res.status(500).json({ error: "ወጪውን መዝግቦ መያዝ አልተቻለም!" });
//   }
// });
// // app.post('/api/expenses', async (req, res) => {
// //   const { title, amount, category, registeredBy, notes } = req.body;
// //   try {
// //     const newExpense = await (prisma as any).quickExpense.create({
// //       data: {
// //         id: crypto.randomUUID(),
// //         title,
// //         amount: parseFloat(amount),
// //         category,
// //         registeredBy: registeredBy || 'ያልተጠቀሰ',
// //         notes: notes || '',
// //       },
// //     });
// //     console.log(`💰 አዲስ ወጪ ተመዘገበ፦ [${title}] - ${amount} ብር`);
// //     res.status(201).json(newExpense);
// //   } catch (error) {
// //     console.error("❌ ወጪ ለመመዝገብ ስህተት፦", error);
// //     res.status(500).json({ error: 'ወጪውን መመዝገብ አልተቻለም' });
// //   }
// // });
// // ----------------------------------------------------------------------
// // 3. MERCHANT STATUS CENTER APIs (የነጋዴዎች ሁኔታ መከታተያ)
// // ----------------------------------------------------------------------
// // ሁሉንም የነጋዴ ስታተሶች ማምጫ (GET)
// app.get('/api/merchants-status', async (req, res) => {
//   try {
//     const merchants = await (prisma as any).merchantStatus.findMany({
//       orderBy: { createdAt: 'desc' },
//     });
//     res.json(merchants);
//   } catch (error) {
//     console.error("❌ የነጋዴዎችን ዳታ ለማምጣት ስህተት፦", error);
//     res.status(500).json({ error: 'የነጋዴዎችን ዳታ ማምጣት አልተቻለም' });
//   }
// });
// // አዲስ የነጋዴ ስታተስ መመዝገቢያ (POST)
// app.post('/api/merchants-status', async (req, res) => {
//   const { merchantName, phoneNumber, goodsDescription, status } = req.body;
//   try {
//     const newMerchant = await (prisma as any).merchantStatus.create({
//       data: {
//         id: crypto.randomUUID(),
//         merchantName,
//         phoneNumber,
//         goodsDescription,
//         status: status || 'pending',
//       },
//     });
//     console.log(`📦 አዲስ የነጋዴ ስታተስ ተመዘገበ፦ [${merchantName}]`);
//     res.status(201).json(newMerchant);
//   } catch (error) {
//     console.error("❌ የነጋዴ ስታተስ ለመመዝገብ ስህተት፦", error);
//     res.status(500).json({ error: 'የነጋዴ ስታተስ መመዝገብ አልተቻለም' });
//   }
// });
// // የነጋዴን ስታተስ ማሻሻያ (PATCH)
// app.patch('/api/merchants-status/:id', async (req, res) => {
//   const { id } = req.params;
//   const { status, smsSent } = req.body;
//   try {
//     const updatedMerchant = await (prisma as any).merchantStatus.update({
//       where: { id },
//       data: {
//         ...(status && { status }),
//         ...(smsSent !== undefined && { smsSent }),
//       },
//     });
//     console.log(`🔄 የነጋዴ ስታተስ ተቀየረ፦ [${updatedMerchant.merchantName}] -> ${status}`);
//     res.json(updatedMerchant);
//   } catch (error) {
//     console.error("❌ ስታተስ ለማዘመን ስህተት፦", error);
//     res.status(500).json({ error: 'ስታተሱን ማዘመን አልተቻለም' });
//   }
// });
// // ----------------------------------------------------------------------
// // 4. የመጋዘንና የኤክሴል ሪፖርት ተግባራት
// // ----------------------------------------------------------------------
// // 1. እቃ መጋዘን የማስገቢያ ተግባር
// async function receiveItemIntoWarehouse(
//   merchantName: string,
//   merchantPhone: string,
//   typeAndDetails: string,
//   weightKg: number,
//   senderName: string,
//   senderPhone: string,
//   receiverName: string
// ) {
//   try {
//     let merchant = await prisma.merchant.findUnique({
//       where: { phone: merchantPhone }
//     });
//     if (!merchant) {
//       merchant = await prisma.merchant.create({
//         data: {
//           id: crypto.randomUUID(),
//           name: merchantName,
//           phone: merchantPhone
//         }
//       });
//     }
//     const item = await prisma.item.create({
//       data: {
//         id: crypto.randomUUID(),
//         merchantId: merchant.id,
//         typeAndDetails,
//         weightKg,
//         senderName,
//         senderPhone,
//         receiverName,
//         status: "IN_WAREHOUSE"
//       }
//     });
//     console.log(`📥 እቃ መጋዘን ገባ፦ [${typeAndDetails}] - ባለቤት፦ ${merchantName}`);
//     return item;
//   } catch (error) {
//     console.error("❌ እቃ ለመረከብ ስህተት አጋጥሟል:", error);
//   }
// }
// // 2. እቃ ወደ መኪና የመጫኛ ተግባር
// async function loadItemsToTruck(itemIds: string[]) {
//   try {
//     await prisma.item.updateMany({
//       where: { id: { in: itemIds }, status: "IN_WAREHOUSE" },
//       data: { status: "LOADED" }
//     });
//     console.log(`\n--------------------------------------------------`);
//     console.log(`🚚 ሰራተኛው ታብሌት ላይ መርጦ [${itemIds.length}] እቃዎችን ወደ መኪና ጫነ!`);
//     console.log(`--------------------------------------------------`);
//   } catch (error) {
//     console.error("❌ መኪና ላይ ለመጫን ስህተት አጋጥሟል:", error);
//   }
// }
// // 3. የኤክሴል ሪፖርት በፓይተን (openpyxl) ማመንጨት
// async function generateExcelReportForBilling() {
//   try {
//     const loadedItems = await prisma.item.findMany({
//       where: { status: 'LOADED', waybillId: null },
//       include: { merchant: true }
//     });
//     if (loadedItems.length === 0) {
//       console.log("⚠️ ለጭነት የተዘጋጀ እቃ አልተገኘም!");
//       return;
//     }
//     const aggregatedData: { [key: string]: { name: string; phone: string; details: string[]; totalWeight: number } } = {};
//     for (const item of loadedItems) {
//       const key = item.merchant.phone;
//       if (!aggregatedData[key]) {
//         aggregatedData[key] = {
//           name: item.merchant.name,
//           phone: item.merchant.phone,
//           details: [item.typeAndDetails],
//           totalWeight: item.weightKg
//         };
//       } else {
//         aggregatedData[key].details.push(item.typeAndDetails);
//         aggregatedData[key].totalWeight += item.weightKg;
//       }
//     }
//     const dataList = Object.values(aggregatedData).map((data, idx) => ({
//       index: idx + 1,
//       name: data.name,
//       phone: data.phone,
//       details: data.details.join(' ፣ '),
//       totalWeight: data.totalWeight
//     }));
//     const tempDataPath = path.join(process.cwd(), 'temp_billing_data.json');
//     fs.writeFileSync(tempDataPath, JSON.stringify(dataList, null, 2), 'utf-8');
//     const reportDir = path.join(process.cwd(), 'የሂሳብ_ሪፖርቶች');
//     if (!fs.existsSync(reportDir)) {
//       fs.mkdirSync(reportDir, { recursive: true });
//     }
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     const seconds = String(now.getSeconds()).padStart(2, '0');
//     const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
//     const outputFileName = `የእቃ_ዝርዝር_መጻፊያ_${timestamp}.xlsx`;
//     const fullOutputPath = path.join(reportDir, outputFileName);
//     const pythonScriptCode = `
// import json
// import openpyxl
// import os
// import sys
// if sys.platform == 'win32':
//     import io
//     sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
//     sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
// try:
//     with open('temp_billing_data.json', 'r', encoding='utf-8') as f:
//         data_list = json.load(f)
//     template_path = 'እቃ ዝርዝር.xlsx'
//     output_path = r'${fullOutputPath}'
//     if os.path.exists(output_path):
//         try:
//             os.remove(output_path)
//         except PermissionError:
//             print("ERROR_PERMISSION_DENIED")
//             sys.exit(0)
//     wb = openpyxl.load_workbook(template_path, data_only=False)
//     ws = wb.active
//     start_row = 8
//     for row_data in data_list:
//         ws[f'A{start_row}'] = row_data['index']
//         ws[f'B{start_row}'] = row_data['name']
//         ws[f'C{start_row}'] = row_data['phone']
//         ws[f'D{start_row}'] = row_data['details']
//         ws[f'E{start_row}'] = row_data['totalWeight']
//         start_row += 1
//     wb.save(output_path)
//     print("SUCCESS")
// except Exception as e:
//     print(f"ERROR: {str(e)}")
// `;
//     const tempPyPath = path.join(process.cwd(), 'update_excel.py');
//     fs.writeFileSync(tempPyPath, pythonScriptCode, 'utf-8');
//     const output = execSync('python update_excel.py', { encoding: 'utf-8' }).trim();
//     if (fs.existsSync(tempDataPath)) fs.unlinkSync(tempDataPath);
//     if (fs.existsSync(tempPyPath)) fs.unlinkSync(tempPyPath);
//     if (output === "SUCCESS") {
//       console.log(`======================================================================================`);
//       console.log(`✅ ሪፖርቱ በስኬት ተፈጥሮ "የሂሳብ_ሪፖርቶች" ፎልደር ውስጥ ገብቷል!`);
//       console.log(`📂 ፋይል ስም፦ ${outputFileName}`);
//       console.log(`======================================================================================`);
//     } else if (output === "ERROR_PERMISSION_DENIED") {
//       console.log(`\n⚠️  ስህተት፦ ይህ ፋይል ቀድሞ ተከፍቷል!`);
//     } else {
//       console.error("❌ የኤክሴል ስክሪፕት ስህተት፦", output);
//     }
//   } catch (error) {
//     console.error("❌ የኤክሴል ሪፖርት ሲሰራ ስህተት አጋጥሟል:", error);
//   }
// }
// // ----------------------------------------------------------------------
// // 5. SERVER START
// // ----------------------------------------------------------------------
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 ሰንሰለት ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል!`);
// });
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import express from 'express';
import cors from 'cors';
const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
// ----------------------------------------------------------------------
// 1. QUICK EXPENSE TRACKER APIs (የወጪ መቆጣጠሪያ)
// ----------------------------------------------------------------------
// ሁሉንም ወጪዎች ማምጫ (GET)
app.get('/api/expenses', async (req, res) => {
    try {
        const expenses = await prisma.quickExpense.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(expenses);
    }
    catch (error) {
        console.error("❌ ወጪዎችን ለማምጣት ስህተት፦", error);
        res.status(500).json({ error: 'ወጪዎችን ማምጣት አልተቻለም' });
    }
});
// አዲስ ወጪ መመዝገቢያ (POST)
app.post('/api/expenses', async (req, res) => {
    const { title, reason, amount, category, registeredBy, notes } = req.body;
    try {
        const newExpense = await prisma.quickExpense.create({
            data: {
                id: crypto.randomUUID(),
                title: title || reason || "ያልተጠቀሰ ወጪ",
                amount: Number(amount),
                category: category || "መደበኛ",
                registeredBy: registeredBy || "ያልተጠቀሰ",
                notes: notes || "",
            },
        });
        res.status(201).json(newExpense);
    }
    catch (error) {
        console.error("❌ ወጪ ለመመዝገብ ስህተት፦", error);
        res.status(500).json({ error: "ወጪውን መዝግቦ መያዝ አልተቻለም!" });
    }
});
// 🗑️ ብድር ሲመለስ ከዳታቤዝ ማጥፊያ (DELETE)
app.delete('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedExpense = await prisma.quickExpense.delete({
            where: { id: id },
        });
        res.json({ message: "በተሳካ ሁኔታ ተሰርዟል", deletedExpense });
    }
    catch (error) {
        console.error("❌ ወጪን ከዳታቤዝ ለማጥፋት ስህተት፦", error);
        res.status(500).json({ error: "ወጪውን ከዳታቤዝ ማጥፋት አልተቻለም!" });
    }
});
// ----------------------------------------------------------------------
// 2. MERCHANT STATUS CENTER APIs
// ----------------------------------------------------------------------
app.get('/api/merchants-status', async (req, res) => {
    try {
        const merchants = await prisma.merchantStatus.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(merchants);
    }
    catch (error) {
        res.status(500).json({ error: 'የነጋዴዎችን ዳታ ማምጣት አልተቻለም' });
    }
});
app.post('/api/merchants-status', async (req, res) => {
    const { merchantName, phoneNumber, goodsDescription, status } = req.body;
    try {
        const newMerchant = await prisma.merchantStatus.create({
            data: {
                id: crypto.randomUUID(),
                merchantName,
                phoneNumber,
                goodsDescription,
                status: status || 'pending',
            },
        });
        res.status(201).json(newMerchant);
    }
    catch (error) {
        res.status(500).json({ error: 'የነጋዴ ስታተስ መመዝገብ አልተቻለም' });
    }
});
app.patch('/api/merchants-status/:id', async (req, res) => {
    const { id } = req.params;
    const { status, smsSent } = req.body;
    try {
        const updatedMerchant = await prisma.merchantStatus.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(smsSent !== undefined && { smsSent }),
            },
        });
        res.json(updatedMerchant);
    }
    catch (error) {
        res.status(500).json({ error: 'ስታተሱን ማዘመን አልተቻለም' });
    }
});
// ----------------------------------------------------------------------
// 3. SERVER START
// ----------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ሰንሰለት ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል!`);
});
//# sourceMappingURL=server.js.map