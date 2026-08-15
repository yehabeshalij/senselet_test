// // // import { Router } from 'express';
// // // import type { Request, Response, NextFunction } from 'express';
// // // import { PrismaClient } from '@prisma/client';

// // // const prisma = new PrismaClient();
// // // const router = Router();

// // // const wrap =
// // //   (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
// // //   (req: Request, res: Response, next: NextFunction) => {
// // //     Promise.resolve(fn(req, res, next)).catch((err) => {
// // //       console.error('❌ Freight route error:', err);
// // //       res.status(500).json({ error: err.message || 'የውስጥ ስህተት ተከስቷል' });
// // //     });
// // //   };

// // // const freightInclude = {
// // //   items: true,
// // //   pickupLocations: true,
// // // };

// // // function computeTotalQuintals(
// // //   items: { unitCount: number; weightPerUnitKg?: number; isWeightUnknown?: boolean }[],
// // //   manualQuintals?: string | number
// // // ): { totalQuintals: number | null; totalQuintalsUnknown: boolean } {
// // //   if (manualQuintals !== undefined && manualQuintals !== null && manualQuintals !== '' && !isNaN(Number(manualQuintals))) {
// // //     return { totalQuintals: Number(manualQuintals), totalQuintalsUnknown: false };
// // //   }
// // //   let total = 0;
// // //   let hasUnknown = false;
// // //   for (const it of items) {
// // //     if (it.isWeightUnknown || !it.weightPerUnitKg) {
// // //       hasUnknown = true;
// // //     } else {
// // //       total += (Number(it.unitCount) * Number(it.weightPerUnitKg)) / 100;
// // //     }
// // //   }
// // //   if (hasUnknown && total === 0) return { totalQuintals: null, totalQuintalsUnknown: true };
// // //   return { totalQuintals: total, totalQuintalsUnknown: false };
// // // }

// // // // 1. የሰጠኸኝ Function እዚያው ይኖር
// // // const getEthiopianDate = () => {
// // //   const now = new Date();
  
// // //   const ethioDateStr = new Intl.DateTimeFormat('am-ET-u-ca-ethioaa', {
// // //     day: 'numeric',
// // //     month: 'long',
// // //     year: 'numeric'
// // //   }).format(now);

// // //   const gregDateStr = now.toLocaleDateString('en-US', {
// // //     month: 'short',
// // //     day: 'numeric',
// // //     year: 'numeric'
// // //   });

// // //   return `${ethioDateStr} (${gregDateStr})`;
// // // };

// // // // 2. አዲስ ኦርደር መመዝገቢያው (POST Route) ላይ እንዲህ ተጠቀምበት፦
// // // router.post('/orders', async (req, res) => {
// // //   try {
// // //     const { merchantName, merchantPhone, items, manualQuintals, pickupLocations, destination, notes } = req.body;

// // //     // 🕒 ቀኑን እና ሰዓቱን እዚህ ጋር እንወስዳለን
// // //     const formattedDate = getEthiopianDate(); // 👈 እቺ ናት ዋናዋ!
// // //     const formattedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

// // //     // የኦርደር ቁጥር ማመንጫ (ለምሳሌ ORD-001)
// // //     const orderCount = await prisma.freightOrder.count();
// // //     const orderNo = `ORD-${String(orderCount + 1).padStart(3, '0')}`;

// // //     // Database ውስጥ ማስገባት
// // //     const newOrder = await prisma.freightOrder.create({
// // //       data: {
// // //         orderNo,
// // //         ethDate: formattedDate, // 👈 እዚህ ጋር ethDate ላይ የተቀየረውን 'formattedDate' ይወስዳል
// // //         time: formattedTime,
// // //         merchantName,
// // //         merchantPhone,
// // //         destination,
// // //         notes,
// // //         // ... ሌላው እንደነበረ ይቀጥላል
// // //       },
// // //     });

// // //     res.json(newOrder);
// // //   } catch (error) {
// // //     res.status(500).json({ error: 'ኦርደር መመዝገብ አልተቻለም' });
// // //   }
// // // });

// // // // const getEthiopianDate = () => {
// // // //   const now = new Date();
// // // //   const months = ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ'];
// // // //   const day = now.getDate();
// // // //   const month = months[(now.getMonth() + 4) % 12];
// // // //   const year = 2018;
// // // //   return `${month} ${day}, ${year}`;
// // // // };

// // // async function nextOrderNo(): Promise<string> {
// // //   const last = await prisma.freightOrder.findFirst({ orderBy: { createdAt: 'desc' } });
// // //   let n = 1;
// // //   if (last?.orderNo) {
// // //     const m = last.orderNo.match(/\d+/);
// // //     if (m && m[0]) n = parseInt(m[0], 10) + 1;
// // //   }
// // //   return `ORD-${String(n).padStart(3, '0')}`;
// // // }

// // // // =============================================================================
// // // // GET /orders
// // // // =============================================================================
// // // router.get(
// // //   '/orders',
// // //   wrap(async (_req: Request, res: Response) => {
// // //     const orders = await prisma.freightOrder.findMany({
// // //       include: freightInclude,
// // //       orderBy: { createdAt: 'desc' },
// // //     });
// // //     return res.json(orders);
// // //   })
// // // );

// // // router.get(
// // //   '/orders/:id',
// // //   wrap(async (req: Request, res: Response) => {
// // //     const { id } = req.params;
// // //     const order = await prisma.freightOrder.findUnique({
// // //       where: { id: String(id) },
// // //       include: freightInclude,
// // //     });
// // //     if (!order) return res.status(404).json({ error: 'ኦርደሩ አልተገኘም' });
// // //     return res.json(order);
// // //   })
// // // );

// // // // =============================================================================
// // // // POST /orders
// // // // =============================================================================
// // // router.post(
// // //   '/orders',
// // //   wrap(async (req: Request, res: Response) => {
// // //     const {
// // //       merchantName,
// // //       merchantPhone,
// // //       items,
// // //       manualQuintals,
// // //       pickupLocations,
// // //       destination,
// // //       notes,
// // //       ethDate,
// // //       time,
// // //     } = req.body as {
// // //       merchantName: string;
// // //       merchantPhone: string;
// // //       items: { name: string; unitCount: number; weightPerUnitKg?: number; isWeightUnknown?: boolean }[];
// // //       manualQuintals?: string | number;
// // //       pickupLocations?: { location: string; shipperName?: string; shipperPhone?: string }[];
// // //       destination: string;
// // //       notes?: string;
// // //       ethDate?: string;
// // //       time?: string;
// // //     };

// // //     if (!merchantName || !items?.length || !items[0]?.name) {
// // //       return res.status(400).json({ error: 'የነጋዴውን ስም እና የእቃውን አይነት ያስገቡ' });
// // //     }

// // //     const orderNo = await nextOrderNo();
// // //     const { totalQuintals, totalQuintalsUnknown } = computeTotalQuintals(items, manualQuintals);
// // //     const safePickupLocations = Array.isArray(pickupLocations) ? pickupLocations : [];

// // //     const order = await prisma.freightOrder.create({
// // //       data: {
// // //         orderNo,
// // //         ethDate: ethDate || getEthiopianDate(),
// // //         time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
// // //         merchantName,
// // //         merchantPhone,
// // //         totalQuintals,
// // //         totalQuintalsUnknown,
// // //         destination: destination || 'ያልተጠቀሰ',
// // //         notes: notes || null,
// // //         status: 'መኪና አልተገኘም',
// // //         items: {
// // //           create: items.map((it) => ({
// // //             name: it.name,
// // //             unitCount: Number(it.unitCount) || 0,
// // //             weightPerUnitKg: it.weightPerUnitKg !== undefined ? Number(it.weightPerUnitKg) : null,
// // //             isWeightUnknown: Boolean(it.isWeightUnknown),
// // //           })),
// // //         },
// // //         pickupLocations: {
// // //           create: safePickupLocations.map((l) => ({
// // //             location: l.location || 'ያልተጠቀሰ',
// // //             shipperName: l.shipperName || null,
// // //             shipperPhone: l.shipperPhone || null,
// // //           })),
// // //         },
// // //       },
// // //       include: freightInclude,
// // //     });

// // //     return res.status(201).json(order);
// // //   })
// // // );

// // // // =============================================================================
// // // // PATCH /orders/:id/assign-driver
// // // // =============================================================================
// // // router.patch(
// // //   '/orders/:id/assign-driver',
// // //   wrap(async (req: Request, res: Response) => {
// // //     const { id } = req.params;
// // //     const { transportType, driverName, driverPhone, truckPlateNo, truckCapacityQuintal } = req.body;

// // //     if (!transportType || !driverName || !driverPhone) {
// // //       return res.status(400).json({ error: 'የትራንስፖርት አይነት፣ ስም እና ስልክ ያስፈልጋሉ' });
// // //     }

// // //     const order = await prisma.freightOrder.update({
// // //       where: { id: String(id) },
// // //       data: {
// // //         transportType,
// // //         driverName,
// // //         driverPhone,
// // //         truckPlateNo: truckPlateNo || 'N/A',
// // //         truckCapacityQuintal: truckCapacityQuintal ? Number(truckCapacityQuintal) : null,
// // //         status: 'መኪና/ሰው የተመደበለት',
// // //       },
// // //       include: freightInclude,
// // //     });

// // //     return res.json(order);
// // //   })
// // // );

// // // // =============================================================================
// // // // PATCH /orders/:id/cancel-driver
// // // // =============================================================================
// // // router.patch(
// // //   '/orders/:id/cancel-driver',
// // //   wrap(async (req: Request, res: Response) => {
// // //     const { id } = req.params;
// // //     const order = await prisma.freightOrder.update({
// // //       where: { id: String(id) },
// // //       data: {
// // //         status: 'ሹፌሩ ቀርቷል',
// // //         driverName: null,
// // //         driverPhone: null,
// // //         truckPlateNo: null,
// // //         transportType: null,
// // //         truckCapacityQuintal: null,
// // //       },
// // //       include: freightInclude,
// // //     });

// // //     return res.json(order);
// // //   })
// // // );

// // // // =============================================================================
// // // // PATCH /orders/:id/status
// // // // =============================================================================
// // // router.patch(
// // //   '/orders/:id/status',
// // //   wrap(async (req: Request, res: Response) => {
// // //     const { id } = req.params;
// // //     const { status, partialLoadingIssue, needsWarehousePickup, notes } = req.body as {
// // //       status: string;
// // //       partialLoadingIssue?: string;
// // //       needsWarehousePickup?: boolean;
// // //       notes?: string;
// // //     };

// // //     if (!status) return res.status(400).json({ error: 'status ያስፈልጋል' });

// // //     const current = await prisma.freightOrder.findUniqueOrThrow({
// // //       where: { id: String(id) },
// // //     });

// // //     const order = await prisma.freightOrder.update({
// // //       where: { id: String(id) },
// // //       data: {
// // //         status,
// // //         partialLoadingIssue: partialLoadingIssue || current.partialLoadingIssue,
// // //         needsWarehousePickup: needsWarehousePickup ?? current.needsWarehousePickup,
// // //         notes: notes ? `${current.notes || ''} | ${notes}` : current.notes,
// // //       },
// // //       include: freightInclude,
// // //     });

// // //     return res.json(order);
// // //   })
// // // );

// // // export default router;

// // import { Router } from 'express';
// // import type { Request, Response, NextFunction } from 'express';
// // import { PrismaClient } from '@prisma/client';

// // const prisma = new PrismaClient();
// // const router = Router();

// // const wrap =
// //   (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
// //   (req: Request, res: Response, next: NextFunction) => {
// //     Promise.resolve(fn(req, res, next)).catch((err) => {
// //       console.error('❌ Freight route error:', err);
// //       res.status(500).json({ error: err.message || 'የውስጥ ስህተት ተከስቷል' });
// //     });
// //   };

// // const freightInclude = {
// //   items: true,
// //   pickupLocations: true,
// // };

// // function computeTotalQuintals(
// //   items: { unitCount: number; weightPerUnitKg?: number; isWeightUnknown?: boolean }[],
// //   manualQuintals?: string | number
// // ): { totalQuintals: number | null; totalQuintalsUnknown: boolean } {
// //   if (manualQuintals !== undefined && manualQuintals !== null && manualQuintals !== '' && !isNaN(Number(manualQuintals))) {
// //     return { totalQuintals: Number(manualQuintals), totalQuintalsUnknown: false };
// //   }
// //   let total = 0;
// //   let hasUnknown = false;
// //   for (const it of items) {
// //     if (it.isWeightUnknown || !it.weightPerUnitKg) {
// //       hasUnknown = true;
// //     } else {
// //       total += (Number(it.unitCount) * Number(it.weightPerUnitKg)) / 100;
// //     }
// //   }
// //   if (hasUnknown && total === 0) return { totalQuintals: null, totalQuintalsUnknown: true };
// //   return { totalQuintals: total, totalQuintalsUnknown: false };
// // }

// // // የኢትዮጵያ ቀን ማሳያ (Node ላይ ICU support ላይ ተመስርቶ፣ frontend-ው ላይ ደግሞ
// // // getCorrectEthiopianDate በሚል የራሱ ትክክለኛ ስሌት አለው፤ ይሄ ለ fallback ብቻ ነው)
// // const getEthiopianDate = () => {
// //   const now = new Date();
// //   try {
// //     const ethioDateStr = new Intl.DateTimeFormat('am-ET-u-ca-ethioaa', {
// //       day: 'numeric',
// //       month: 'long',
// //       year: 'numeric',
// //     }).format(now);
// //     const gregDateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
// //     return `${ethioDateStr} (${gregDateStr})`;
// //   } catch {
// //     return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
// //   }
// // };

// // async function nextOrderNo(): Promise<string> {
// //   const last = await prisma.freightOrder.findFirst({ orderBy: { createdAt: 'desc' } });
// //   let n = 1;
// //   if (last?.orderNo) {
// //     const m = last.orderNo.match(/\d+/);
// //     if (m && m[0]) n = parseInt(m[0], 10) + 1;
// //   }
// //   return `ORD-${String(n).padStart(3, '0')}`;
// // }

// // // =============================================================================
// // // GET /orders
// // // =============================================================================
// // router.get(
// //   '/orders',
// //   wrap(async (_req: Request, res: Response) => {
// //     const orders = await prisma.freightOrder.findMany({
// //       include: freightInclude,
// //       orderBy: { createdAt: 'desc' },
// //     });
// //     return res.json(orders);
// //   })
// // );

// // router.get(
// //   '/orders/:id',
// //   wrap(async (req: Request, res: Response) => {
// //     const { id } = req.params;
// //     const order = await prisma.freightOrder.findUnique({
// //       where: { id: String(id) },
// //       include: freightInclude,
// //     });
// //     if (!order) return res.status(404).json({ error: 'ኦርደሩ አልተገኘም' });
// //     return res.json(order);
// //   })
// // );

// // // =============================================================================
// // // POST /orders  — ⚠️ ይህ ብቸኛው POST /orders handler ነው (ቀድሞ የነበረው ያልተሟላ
// // // duplicate handler ተነስቷል፤ items/pickupLocations እንዲቀመጡ ይህ ብቻ ያስፈልጋል)
// // // =============================================================================
// // router.post(
// //   '/orders',
// //   wrap(async (req: Request, res: Response) => {
// //     const {
// //       merchantName,
// //       merchantPhone,
// //       items,
// //       manualQuintals,
// //       pickupLocations,
// //       destination,
// //       notes,
// //       ethDate,
// //       time,
// //     } = req.body as {
// //       merchantName: string;
// //       merchantPhone: string;
// //       items: { name: string; unitCount: number; unit?: string; weightPerUnitKg?: number; isWeightUnknown?: boolean }[];
// //       manualQuintals?: string | number;
// //       pickupLocations?: { location: string; shipperName?: string; shipperPhone?: string }[];
// //       destination: string;
// //       notes?: string;
// //       ethDate?: string;
// //       time?: string;
// //     };

// //     if (!merchantName || !items?.length || !items[0]?.name) {
// //       return res.status(400).json({ error: 'የነጋዴውን ስም እና የእቃውን አይነት ያስገቡ' });
// //     }

// //     const orderNo = await nextOrderNo();
// //     const { totalQuintals, totalQuintalsUnknown } = computeTotalQuintals(items, manualQuintals);
// //     const safePickupLocations = Array.isArray(pickupLocations) ? pickupLocations : [];

// //     const order = await prisma.freightOrder.create({
// //       data: {
// //         orderNo,
// //         ethDate: ethDate || getEthiopianDate(),
// //         time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
// //         merchantName,
// //         merchantPhone,
// //         totalQuintals,
// //         totalQuintalsUnknown,
// //         destination: destination || 'ያልተጠቀሰ',
// //         notes: notes || null,
// //         status: 'መኪና አልተገኘም',
// //         items: {
// //           create: items.map((it) => ({
// //             name: it.name,
// //             unitCount: Number(it.unitCount) || 0,
// //             unit: it.unit || 'ፍሬ',
// //             weightPerUnitKg: it.weightPerUnitKg !== undefined ? Number(it.weightPerUnitKg) : null,
// //             isWeightUnknown: Boolean(it.isWeightUnknown),
// //           })),
// //         },
// //         pickupLocations: {
// //           create: safePickupLocations.map((l) => ({
// //             location: l.location || 'ያልተጠቀሰ',
// //             shipperName: l.shipperName || null,
// //             shipperPhone: l.shipperPhone || null,
// //           })),
// //         },
// //       },
// //       include: freightInclude,
// //     });

// //     return res.status(201).json(order);
// //   })
// // );

// // // =============================================================================
// // // PATCH /orders/:id/assign-driver
// // // =============================================================================
// // router.patch(
// //   '/orders/:id/assign-driver',
// //   wrap(async (req: Request, res: Response) => {
// //     const { id } = req.params;
// //     const { transportType, driverName, driverPhone, truckPlateNo, truckCapacityQuintal } = req.body;

// //     if (!transportType || !driverName || !driverPhone) {
// //       return res.status(400).json({ error: 'የትራንስፖርት አይነት፣ ስም እና ስልክ ያስፈልጋሉ' });
// //     }

// //     const order = await prisma.freightOrder.update({
// //       where: { id: String(id) },
// //       data: {
// //         transportType,
// //         driverName,
// //         driverPhone,
// //         truckPlateNo: truckPlateNo || 'N/A',
// //         truckCapacityQuintal: truckCapacityQuintal ? Number(truckCapacityQuintal) : null,
// //         status: 'መኪና/ሰው የተመደበለት',
// //       },
// //       include: freightInclude,
// //     });

// //     return res.json(order);
// //   })
// // );

// // // =============================================================================
// // // PATCH /orders/:id/cancel-driver
// // // =============================================================================
// // router.patch(
// //   '/orders/:id/cancel-driver',
// //   wrap(async (req: Request, res: Response) => {
// //     const { id } = req.params;
// //     const order = await prisma.freightOrder.update({
// //       where: { id: String(id) },
// //       data: {
// //         status: 'ሹፌሩ ቀርቷል',
// //         driverName: null,
// //         driverPhone: null,
// //         truckPlateNo: null,
// //         transportType: null,
// //         truckCapacityQuintal: null,
// //       },
// //       include: freightInclude,
// //     });

// //     return res.json(order);
// //   })
// // );

// // // =============================================================================
// // // PATCH /orders/:id/status  — status ማዘመኛ (አሁን 'ታሪክ ማህደር'ንም ጨምሮ ማንኛውንም
// // // status value ይቀበላል፤ archive ቁልፉም ይህንኑ endpoint ይጠቀማል)
// // // =============================================================================
// // router.patch(
// //   '/orders/:id/status',
// //   wrap(async (req: Request, res: Response) => {
// //     const { id } = req.params;
// //     const { status, partialLoadingIssue, needsWarehousePickup, notes } = req.body as {
// //       status: string;
// //       partialLoadingIssue?: string;
// //       needsWarehousePickup?: boolean;
// //       notes?: string;
// //     };

// //     if (!status) return res.status(400).json({ error: 'status ያስፈልጋል' });

// //     const current = await prisma.freightOrder.findUniqueOrThrow({
// //       where: { id: String(id) },
// //     });

// //     const order = await prisma.freightOrder.update({
// //       where: { id: String(id) },
// //       data: {
// //         status,
// //         partialLoadingIssue: partialLoadingIssue || current.partialLoadingIssue,
// //         needsWarehousePickup: needsWarehousePickup ?? current.needsWarehousePickup,
// //         notes: notes ? `${current.notes || ''} | ${notes}` : current.notes,
// //       },
// //       include: freightInclude,
// //     });

// //     return res.json(order);
// //   })
// // );

// // export default router;

// import { Router } from 'express';
// import type { Request, Response, NextFunction } from 'express';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
// const router = Router();

// const wrap =
//   (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
//   (req: Request, res: Response, next: NextFunction) => {
//     Promise.resolve(fn(req, res, next)).catch((err) => {
//       console.error('❌ Freight route error:', err);
//       res.status(500).json({ error: err.message || 'የውስጥ ስህተት ተከስቷል' });
//     });
//   };

// const freightInclude = {
//   items: true,
//   pickupLocations: true,
// };

// function computeTotalQuintals(
//   items: { unitCount: number; weightPerUnitKg?: number; isWeightUnknown?: boolean }[],
//   manualQuintals?: string | number
// ): { totalQuintals: number | null; totalQuintalsUnknown: boolean } {
//   if (manualQuintals !== undefined && manualQuintals !== null && manualQuintals !== '' && !isNaN(Number(manualQuintals))) {
//     return { totalQuintals: Number(manualQuintals), totalQuintalsUnknown: false };
//   }
//   let total = 0;
//   let hasUnknown = false;
//   for (const it of items) {
//     if (it.isWeightUnknown || !it.weightPerUnitKg) {
//       hasUnknown = true;
//     } else {
//       total += (Number(it.unitCount) * Number(it.weightPerUnitKg)) / 100;
//     }
//   }
//   if (hasUnknown && total === 0) return { totalQuintals: null, totalQuintalsUnknown: true };
//   return { totalQuintals: total, totalQuintalsUnknown: false };
// }

// // የኢትዮጵያ ቀን ማሳያ (fallback ብቻ — frontend-ው createdAt ተጠቅሞ በራሱ በትክክል ይለውጠዋል)
// const getEthiopianDate = () => {
//   const now = new Date();
//   try {
//     const ethioDateStr = new Intl.DateTimeFormat('am-ET-u-ca-ethioaa', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric',
//     }).format(now);
//     const gregDateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
//     return `${ethioDateStr} (${gregDateStr})`;
//   } catch {
//     return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
//   }
// };

// async function nextOrderNo(): Promise<string> {
//   const last = await prisma.freightOrder.findFirst({ orderBy: { createdAt: 'desc' } });
//   let n = 1;
//   if (last?.orderNo) {
//     const m = last.orderNo.match(/\d+/);
//     if (m && m[0]) n = parseInt(m[0], 10) + 1;
//   }
//   return `ORD-${String(n).padStart(3, '0')}`;
// }

// // =============================================================================
// // GET /orders
// // =============================================================================
// router.get(
//   '/orders',
//   wrap(async (_req: Request, res: Response) => {
//     const orders = await prisma.freightOrder.findMany({
//       include: freightInclude,
//       orderBy: { createdAt: 'desc' },
//     });
//     return res.json(orders);
//   })
// );

// router.get(
//   '/orders/:id',
//   wrap(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const order = await prisma.freightOrder.findUnique({
//       where: { id: String(id) },
//       include: freightInclude,
//     });
//     if (!order) return res.status(404).json({ error: 'ኦርደሩ አልተገኘም' });
//     return res.json(order);
//   })
// );

// // =============================================================================
// // POST /orders
// // =============================================================================
// router.post(
//   '/orders',
//   wrap(async (req: Request, res: Response) => {
//     const {
//       merchantName,
//       merchantPhone,
//       items,
//       manualQuintals,
//       pickupLocations,
//       destination,
//       notes,
//       ethDate,
//       time,
//     } = req.body as {
//       merchantName: string;
//       merchantPhone: string;
//       items: { name: string; unitCount: number; unit?: string; weightPerUnitKg?: number; isWeightUnknown?: boolean }[];
//       manualQuintals?: string | number;
//       pickupLocations?: { location: string; shipperName?: string; shipperPhone?: string }[];
//       destination: string;
//       notes?: string;
//       ethDate?: string;
//       time?: string;
//     };

//     if (!merchantName || !items?.length || !items[0]?.name) {
//       return res.status(400).json({ error: 'የነጋዴውን ስም እና የእቃውን አይነት ያስገቡ' });
//     }

//     const orderNo = await nextOrderNo();
//     const { totalQuintals, totalQuintalsUnknown } = computeTotalQuintals(items, manualQuintals);
//     const safePickupLocations = Array.isArray(pickupLocations) ? pickupLocations : [];

//     const order = await prisma.freightOrder.create({
//       data: {
//         orderNo,
//         ethDate: ethDate || getEthiopianDate(),
//         time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         merchantName,
//         merchantPhone,
//         totalQuintals,
//         totalQuintalsUnknown,
//         destination: destination || 'ያልተጠቀሰ',
//         notes: notes || null,
//         status: 'መኪና አልተገኘም',
//         items: {
//           create: items.map((it) => ({
//             name: it.name,
//             unitCount: Number(it.unitCount) || 0,
//             unit: it.unit || 'ፍሬ',
//             weightPerUnitKg: it.weightPerUnitKg !== undefined ? Number(it.weightPerUnitKg) : null,
//             isWeightUnknown: Boolean(it.isWeightUnknown),
//           })),
//         },
//         pickupLocations: {
//           create: safePickupLocations.map((l) => ({
//             location: l.location || 'ያልተጠቀሰ',
//             shipperName: l.shipperName || null,
//             shipperPhone: l.shipperPhone || null,
//           })),
//         },
//       },
//       include: freightInclude,
//     });

//     return res.status(201).json(order);
//   })
// );

// // =============================================================================
// // PATCH /orders/:id/assign-driver
// // =============================================================================
// router.patch(
//   '/orders/:id/assign-driver',
//   wrap(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const { transportType, driverName, driverPhone, truckPlateNo, truckCapacityQuintal } = req.body;

//     if (!transportType || !driverName || !driverPhone) {
//       return res.status(400).json({ error: 'የትራንስፖርት አይነት፣ ስም እና ስልክ ያስፈልጋሉ' });
//     }

//     const order = await prisma.freightOrder.update({
//       where: { id: String(id) },
//       data: {
//         transportType,
//         driverName,
//         driverPhone,
//         truckPlateNo: truckPlateNo || 'N/A',
//         truckCapacityQuintal: truckCapacityQuintal ? Number(truckCapacityQuintal) : null,
//         status: 'መኪና/ሰው የተመደበለት',
//       },
//       include: freightInclude,
//     });

//     return res.json(order);
//   })
// );

// // =============================================================================
// // PATCH /orders/:id/cancel-driver
// // =============================================================================
// router.patch(
//   '/orders/:id/cancel-driver',
//   wrap(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const order = await prisma.freightOrder.update({
//       where: { id: String(id) },
//       data: {
//         status: 'ሹፌሩ ቀርቷል',
//         driverName: null,
//         driverPhone: null,
//         truckPlateNo: null,
//         transportType: null,
//         truckCapacityQuintal: null,
//       },
//       include: freightInclude,
//     });

//     return res.json(order);
//   })
// );

// // =============================================================================
// // PATCH /orders/:id/status  — status ማዘመኛ (archive ቁልፉም ይህንኑ ይጠቀማል፣
// // previousStatus ካስገቡ ወደ ማህደር ከመግባቱ በፊት የነበረውን ደረጃ ያስቀምጣል — ለ "መልስ" ቁልፍ)
// // =============================================================================
// router.patch(
//   '/orders/:id/status',
//   wrap(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const { status, partialLoadingIssue, needsWarehousePickup, notes, previousStatus } = req.body as {
//       status: string;
//       partialLoadingIssue?: string;
//       needsWarehousePickup?: boolean;
//       notes?: string;
//       previousStatus?: string;
//     };

//     if (!status) return res.status(400).json({ error: 'status ያስፈልጋል' });

//     const current = await prisma.freightOrder.findUniqueOrThrow({
//       where: { id: String(id) },
//     });

//     const order = await prisma.freightOrder.update({
//       where: { id: String(id) },
//       data: {
//         status,
//         previousStatus: previousStatus !== undefined ? previousStatus : (current as any).previousStatus,
//         partialLoadingIssue: partialLoadingIssue || current.partialLoadingIssue,
//         needsWarehousePickup: needsWarehousePickup ?? current.needsWarehousePickup,
//         notes: notes ? `${current.notes || ''} | ${notes}` : current.notes,
//       },
//       include: freightInclude,
//     });

//     return res.json(order);
//   })
// );

// // =============================================================================
// // PATCH /orders/:id/void  — 🆕 ነጋዴው ትቶት የቀረ/የጠፋ ጭነት፣ ምክንያት ጋር ወደ ማህደር ይገባል
// // =============================================================================
// router.patch(
//   '/orders/:id/void',
//   wrap(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const { reason } = req.body as { reason?: string };

//     if (!reason || !reason.trim()) {
//       return res.status(400).json({ error: 'የመጥፋት ምክንያት ያስፈልጋል' });
//     }

//     const current = await prisma.freightOrder.findUniqueOrThrow({ where: { id: String(id) } });

//     const order = await prisma.freightOrder.update({
//       where: { id: String(id) },
//       data: {
//         status: 'ታሪክ ማህደር',
//         previousStatus: current.status,
//         isVoided: true,
//         voidReason: reason.trim(),
//       } as any,
//       include: freightInclude,
//     });

//     return res.json(order);
//   })
// );

// // =============================================================================
// // PATCH /orders/:id/restore  — 🆕 በስህተት ወደ ማህደር/ጥፋት የገባን ወደ ንቁ ጭነቶች ይመልሳል
// // =============================================================================
// router.patch(
//   '/orders/:id/restore',
//   wrap(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const current = await prisma.freightOrder.findUniqueOrThrow({ where: { id: String(id) } });

//     const fallbackStatus = current.driverName ? 'መኪና/ሰው የተመደበለት' : 'መኪና አልተገኘም';
//     const restoredStatus = (current as any).previousStatus || fallbackStatus;

//     const order = await prisma.freightOrder.update({
//       where: { id: String(id) },
//       data: {
//         status: restoredStatus,
//         previousStatus: null,
//         isVoided: false,
//         voidReason: null,
//       } as any,
//       include: freightInclude,
//     });

//     return res.json(order);
//   })
// );

// export default router;

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error('❌ Freight route error:', err);
      res.status(500).json({ error: err.message || 'የውስጥ ስህተት ተከስቷል' });
    });
  };

const freightInclude = {
  items: true,
  pickupLocations: true,
};

function computeTotalQuintals(
  items: { unitCount: number; weightPerUnitKg?: number; isWeightUnknown?: boolean }[],
  manualQuintals?: string | number
): { totalQuintals: number | null; totalQuintalsUnknown: boolean } {
  if (manualQuintals !== undefined && manualQuintals !== null && manualQuintals !== '' && !isNaN(Number(manualQuintals))) {
    return { totalQuintals: Number(manualQuintals), totalQuintalsUnknown: false };
  }
  let total = 0;
  let hasUnknown = false;
  for (const it of items) {
    if (it.isWeightUnknown || !it.weightPerUnitKg) {
      hasUnknown = true;
    } else {
      total += (Number(it.unitCount) * Number(it.weightPerUnitKg)) / 100;
    }
  }
  if (hasUnknown && total === 0) return { totalQuintals: null, totalQuintalsUnknown: true };
  return { totalQuintals: total, totalQuintalsUnknown: false };
}

// የኢትዮጵያ ቀን ማሳያ (fallback ብቻ — frontend-ው createdAt ተጠቅሞ በራሱ በትክክል ይለውጠዋል)
const getEthiopianDate = () => {
  const now = new Date();
  try {
    const ethioDateStr = new Intl.DateTimeFormat('am-ET-u-ca-ethioaa', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    const gregDateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${ethioDateStr} (${gregDateStr})`;
  } catch {
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

async function nextOrderNo(): Promise<string> {
  const last = await prisma.freightOrder.findFirst({ orderBy: { createdAt: 'desc' } });
  let n = 1;
  if (last?.orderNo) {
    const m = last.orderNo.match(/\d+/);
    if (m && m[0]) n = parseInt(m[0], 10) + 1;
  }
  return `ORD-${String(n).padStart(3, '0')}`;
}

// =============================================================================
// GET /orders
// =============================================================================
router.get(
  '/orders',
  wrap(async (_req: Request, res: Response) => {
    const orders = await prisma.freightOrder.findMany({
      include: freightInclude,
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  })
);

router.get(
  '/orders/:id',
  wrap(async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await prisma.freightOrder.findUnique({
      where: { id: String(id) },
      include: freightInclude,
    });
    if (!order) return res.status(404).json({ error: 'ኦርደሩ አልተገኘም' });
    return res.json(order);
  })
);

// =============================================================================
// POST /orders
// =============================================================================
router.post(
  '/orders',
  wrap(async (req: Request, res: Response) => {
    const {
      merchantName,
      merchantPhone,
      items,
      manualQuintals,
      pickupLocations,
      destination,
      notes,
      ethDate,
      time,
    } = req.body as {
      merchantName: string;
      merchantPhone: string;
      items: { name: string; unitCount: number; unit?: string; weightPerUnitKg?: number; isWeightUnknown?: boolean }[];
      manualQuintals?: string | number;
      pickupLocations?: { location: string; shipperName?: string; shipperPhone?: string }[];
      destination: string;
      notes?: string;
      ethDate?: string;
      time?: string;
    };

    if (!merchantName || !items?.length || !items[0]?.name) {
      return res.status(400).json({ error: 'የነጋዴውን ስም እና የእቃውን አይነት ያስገቡ' });
    }

    const orderNo = await nextOrderNo();
    const { totalQuintals, totalQuintalsUnknown } = computeTotalQuintals(items, manualQuintals);
    const safePickupLocations = Array.isArray(pickupLocations) ? pickupLocations : [];

    const order = await prisma.freightOrder.create({
      data: {
        orderNo,
        ethDate: ethDate || getEthiopianDate(),
        time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        merchantName,
        merchantPhone,
        totalQuintals,
        totalQuintalsUnknown,
        destination: destination || 'ያልተጠቀሰ',
        notes: notes || null,
        status: 'መኪና አልተገኘም',
        items: {
          create: items.map((it) => ({
            name: it.name,
            unitCount: Number(it.unitCount) || 0,
            unit: it.unit || 'ፍሬ',
            weightPerUnitKg: it.weightPerUnitKg !== undefined ? Number(it.weightPerUnitKg) : null,
            isWeightUnknown: Boolean(it.isWeightUnknown),
          })),
        },
        pickupLocations: {
          create: safePickupLocations.map((l) => ({
            location: l.location || 'ያልተጠቀሰ',
            shipperName: l.shipperName || null,
            shipperPhone: l.shipperPhone || null,
          })),
        },
      },
      include: freightInclude,
    });

    return res.status(201).json(order);
  })
);

// =============================================================================
// PATCH /orders/:id/assign-driver
// =============================================================================
router.patch(
  '/orders/:id/assign-driver',
  wrap(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { transportType, driverName, driverPhone, truckPlateNo, truckCapacityQuintal } = req.body;

    if (!transportType || !driverName || !driverPhone) {
      return res.status(400).json({ error: 'የትራንስፖርት አይነት፣ ስም እና ስልክ ያስፈልጋሉ' });
    }

    const order = await prisma.freightOrder.update({
      where: { id: String(id) },
      data: {
        transportType,
        driverName,
        driverPhone,
        truckPlateNo: truckPlateNo || 'N/A',
        truckCapacityQuintal: truckCapacityQuintal ? Number(truckCapacityQuintal) : null,
        status: 'መኪና/ሰው የተመደበለት',
      },
      include: freightInclude,
    });

    return res.json(order);
  })
);

// =============================================================================
// PATCH /orders/:id/cancel-driver
// =============================================================================
router.patch(
  '/orders/:id/cancel-driver',
  wrap(async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await prisma.freightOrder.update({
      where: { id: String(id) },
      data: {
        status: 'ሹፌሩ ቀርቷል',
        driverName: null,
        driverPhone: null,
        truckPlateNo: null,
        transportType: null,
        truckCapacityQuintal: null,
      },
      include: freightInclude,
    });

    return res.json(order);
  })
);

// =============================================================================
// PATCH /orders/:id/status
// =============================================================================
router.patch(
  '/orders/:id/status',
  wrap(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, partialLoadingIssue, needsWarehousePickup, notes, previousStatus } = req.body as {
      status: string;
      partialLoadingIssue?: string;
      needsWarehousePickup?: boolean;
      notes?: string;
      previousStatus?: string;
    };

    if (!status) return res.status(400).json({ error: 'status ያስፈልጋል' });

    const current = await prisma.freightOrder.findUniqueOrThrow({
      where: { id: String(id) },
    });

    const order = await prisma.freightOrder.update({
      where: { id: String(id) },
      data: {
        status,
        previousStatus: previousStatus !== undefined ? previousStatus : (current as any).previousStatus,
        partialLoadingIssue: partialLoadingIssue || current.partialLoadingIssue,
        needsWarehousePickup: needsWarehousePickup ?? current.needsWarehousePickup,
        notes: notes ? `${current.notes || ''} | ${notes}` : current.notes,
      },
      include: freightInclude,
    });

    return res.json(order);
  })
);

// =============================================================================
// PATCH /orders/:id/void
// =============================================================================
router.patch(
  '/orders/:id/void',
  wrap(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'የመጥፋት ምክንያት ያስፈልጋል' });
    }

    const current = await prisma.freightOrder.findUniqueOrThrow({ where: { id: String(id) } });

    const order = await prisma.freightOrder.update({
      where: { id: String(id) },
      data: {
        status: 'ታሪክ ማህደር',
        previousStatus: current.status,
        isVoided: true,
        voidReason: reason.trim(),
      } as any,
      include: freightInclude,
    });

    return res.json(order);
  })
);

// =============================================================================
// PATCH /orders/:id/restore
// =============================================================================
router.patch(
  '/orders/:id/restore',
  wrap(async (req: Request, res: Response) => {
    const { id } = req.params;
    const current = await prisma.freightOrder.findUniqueOrThrow({ where: { id: String(id) } });

    const fallbackStatus = current.driverName ? 'መኪና/ሰው የተመደበለት' : 'መኪና አልተገኘም';
    const restoredStatus = (current as any).previousStatus || fallbackStatus;

    const order = await prisma.freightOrder.update({
      where: { id: String(id) },
      data: {
        status: restoredStatus,
        previousStatus: null,
        isVoided: false,
        voidReason: null,
      } as any,
      include: freightInclude,
    });

    return res.json(order);
  })
);

// =============================================================================
// 🆕 FEEDBACK / SUGGESTIONS  (ሃሳብ/ችግር መዝገብ)
// =============================================================================

// GET /feedback — ሁሉንም ሃሳቦች/ችግሮች ማምጫ
router.get(
  '/feedback',
  wrap(async (_req: Request, res: Response) => {
    const entries = await prisma.feedbackEntry.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(entries);
  })
);

// POST /feedback — ነጋዴ የደወለበትን ሃሳብ/ችግር መመዝገቢያ
router.post(
  '/feedback',
  wrap(async (req: Request, res: Response) => {
    const { name, phone, message } = req.body as { name: string; phone?: string; message: string };

    if (!name || !message) {
      return res.status(400).json({ error: 'ስም እና የሃሳብ/ችግር ይዘት ያስፈልጋሉ' });
    }

    const entry = await prisma.feedbackEntry.create({
      data: {
        name,
        phone: phone || null,
        message,
        status: 'ክፍት',
      },
    });

    return res.status(201).json(entry);
  })
);

// PATCH /feedback/:id/resolve — ሰራተኛ ወይም ሃላፊ ችግሩን ፈታ
// resolvedBy: 'staff' | 'owner' — staffNote ወይም ownerNote ላይ ማስታወሻውን ይመዘግባል
router.patch(
  '/feedback/:id/resolve',
  wrap(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { note, resolvedBy } = req.body as { note?: string; resolvedBy?: 'staff' | 'owner' };

    const current = await prisma.feedbackEntry.findUniqueOrThrow({ where: { id: String(id) } });

    const data: any = { status: 'ተፈትቷል' };
    if (resolvedBy === 'owner') {
      data.ownerNote = note || current.ownerNote;
    } else {
      data.staffNote = note || current.staffNote;
    }

    const entry = await prisma.feedbackEntry.update({ where: { id: String(id) }, data });
    return res.json(entry);
  })
);

// PATCH /feedback/:id/escalate — ችግሩ ከሰራተኛው አቅም በላይ ከሆነ ወደ ሃላፊ መላኪያ
router.patch(
  '/feedback/:id/escalate',
  wrap(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { note } = req.body as { note?: string };

    const entry = await prisma.feedbackEntry.update({
      where: { id: String(id) },
      data: { status: 'ለሃላፊ ተልኳል', staffNote: note ?? undefined },
    });

    return res.json(entry);
  })
);

export default router;