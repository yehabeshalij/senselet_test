import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma.js';
import ExcelJS from 'exceljs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireRole } from '../../../middleware/requireStaffAuth.js';

const router = express.Router();
router.use(requireRole('RECEIVER', 'LOADER', 'OFFICE', 'OWNER'));



const upload = multer({ storage: multer.memoryStorage() });


function getEthDateForExcel(date: Date): string {
  try {
    return new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

// =====================================================================
// 🧮 እርዳታ ተግባራት (Helpers)
// =====================================================================

/** CargoItem.packages (JSON) ውስጥ ያለውን የፓኬጅ ዝርዝር በጥንቃቄ ወደ array ይመልሳል */
function getPackagesArray(cargoItem: any): Array<{ id: string; packageNo: number; weight: number }> {
  if (!cargoItem.isMultiPackage || !cargoItem.packages) return [];
  try {
    return Array.isArray(cargoItem.packages) ? cargoItem.packages : [];
  } catch {
    return [];
  }
}


/** የእቃውን description ውስጥ ያለውን መጀመሪያ ቁጥር (ብዛት) ብቻ በአዲስ ቁጥር ይተካል፤ የቀረው ጽሁፍ ሳይነካ ይቆያል */
function updateDescriptionQuantity(description: string, newCount: number): string {
  const match = description.match(/^(\d+)(\s*)(.*)$/);
  if (!match) return description;
  return `${newCount}${match[2] || ' '}${match[3]}`;
}

/** ከጽሁፍ (ለምሳሌ "40 እሽግ አላንግ ግማሽ ጁስ" ወይም cargoItem.description) መጀመሪያ ላይ ያለውን ቁጥር ይመልሳል፤ ካላገኘ null */
function parseLeadingQty(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = String(text).trim().match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * ለአንድ CargoItem፣ አሁን ያለውን ቀሪ (ገና ያልተጫነ) ክብደት/እሽጎች ከ Loading ledger በመነሳት ያሰላል።
 */
function computeRemaining(cargoItem: any) {
  const activeLoadings = (cargoItem.loadings || []).filter((l: any) => l.isActive);

  if (cargoItem.isMultiPackage) {
    const pkgs = getPackagesArray(cargoItem);
    const loadedPkgIds = new Set(activeLoadings.map((l: any) => l.packageId).filter(Boolean));
    const remainingPkgs = pkgs.filter(p => !loadedPkgIds.has(p.id));
    const remainingWeight = remainingPkgs.reduce((s, p) => s + p.weight, 0);
    return { remainingWeight, remainingPkgCount: remainingPkgs.length, remainingPkgs, isFullyLoaded: remainingPkgs.length === 0 };
  }

  const loadedWeight = activeLoadings.reduce((s: number, l: any) => s + l.weight, 0);
  const remainingWeight = Math.max(0, cargoItem.weight - loadedWeight);
  return { remainingWeight, remainingPkgCount: 0, remainingPkgs: [], isFullyLoaded: remainingWeight <= 0 };
}

/** ለአንድ Truck ጠቅላላ የተጫነ ክብደት (ምድብ/ምንጭ ተጣርቶ) ያሰላል */
async function getTruckLoadedWeight(truckId: string, filters?: { category?: string; source?: string; method?: string }) {
  const loadings = await prisma.loading.findMany({
    where: { 
      truckId, 
      isActive: true, 
      ...(filters?.source ? { source: filters.source } : {}), 
      ...(filters?.method ? { method: filters.method } : {}) 
    },
    include: { cargoItem: true }
  });
  return loadings
    .filter(l => !filters?.category || l.cargoItem.category === filters.category)
    .reduce((s, l) => s + l.weight, 0);
}

// =====================================================================
// 📦 1. መጋዘን ያሉ እቃዎች (Section 3 — ንቁ የጭነት ገጽ)
// =====================================================================

// GET /api/loading/warehouse-items?page=1&pageSize=20
router.get('/warehouse-items', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.pageSize) || 20);


    const candidateItems = await prisma.cargoItem.findMany({
  where: { status: { not: 'ተመልሷል' } },
  include: {
    receipt: true,
    loadings: true,
    shortageNotes: { orderBy: { createdAt: 'desc' }, take: 1 } // 👈 አዲስ - የቅናሽ ምክንያት ለማምጣት
  },
  orderBy: { receipt: { createdAt: 'asc' } }
});



    const pendingRows = candidateItems
  .map((item: any) => ({ item, remaining: computeRemaining(item) }))
  .filter(({ remaining }: any) => remaining.remainingWeight > 0)
  .map(({ item, remaining }: any) => {
    let displayDescription = item.description;


if (item.isMultiPackage) {
  displayDescription = updateDescriptionQuantity(item.description, remaining.remainingPkgCount);
} else if (remaining.remainingWeight < item.weight) {
  // ✅ ሁልጊዜ ከ ledger (loadings) በትክክል ከሚሰላው ቀሪ ክብደት ተነስተን የቀረውን ቁጥር እናሰላለን፤
  // ይሄ ማንኛውም አይነት ጭነት/ማውረድ ጥምረት ቢፈጠር (ብዙ መኪኖች፣ ከፊል ማውረድ ወዘተ) ሁልጊዜ ራሱን በራሱ ያስተካክላል
  const originalQty = parseLeadingQty(item.description);
  if (originalQty !== null) {
    const remainingQty = Math.max(0, Math.round(originalQty * remaining.remainingWeight / item.weight));
    displayDescription = updateDescriptionQuantity(item.description, remainingQty);
  }
}

    return {
  id: item.id,
  receiptId: item.receiptId,
  receiptNo: item.receipt.receiptNo,
  dateIn: item.receipt.ethDate,
  merchantName: item.receipt.merchantName,
  merchantPhone: item.receipt.merchantPhone,
  description: displayDescription,
  category: item.category,
  isMultiPackage: item.isMultiPackage,
  weight: remaining.remainingWeight,
  remainingPackages: remaining.remainingPkgs,
  shortageReason: item.shortageNotes?.[0]?.reason || null,
  // 👈 አዲስ - መዝጋቢው ሲቀበል የገባው መረጃ (እቃው ገና ሲገባ ማን እንደወረደው/በየትኛው ታርጋ)
  intakeLoaderType: item.loaderType || null,
  intakeCarPlate: item.receipt.carPlate || null
};
  });
  const search = ((req.query.search as string) || '').trim().toLowerCase();
const filteredRows = search
  ? pendingRows.filter((r: any) =>
      (r.merchantName || '').toLowerCase().includes(search) ||
      (r.merchantPhone || '').toLowerCase().includes(search) ||
      (r.receiptNo || '').toLowerCase().includes(search)
    )
  : pendingRows;

const total = filteredRows.length;
const paged = filteredRows.slice((page - 1) * pageSize, page * pageSize);

res.json({
  success: true,
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
  data: paged
});
  } catch (error: any) {
    console.error('❌ የመጋዘን እቃዎችን ማምጣት አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'የመጋዘን እቃዎችን ማምጣት አልተቻለም' });
  }
});


// GET /api/loading/dashboard-stats/:truckId — ለ "ንቁ የጭነት ገጽ" ላይ ላለው ዳሽቦርድ
router.get('/dashboard-stats/:truckId', async (req: Request, res: Response) => {
  try {
    const truckId = String(req.params.truckId);

    // 📦 1. መጋዘን የቀሩ (ጠቅላላ ሁሉም pending items ደረቅ/ለጠፍ ተከፋፍለው - ትሩክ-ተኮር አይደለም)
    const candidateItems = await prisma.cargoItem.findMany({
      where: { status: { not: 'ተመልሷል' } },
      include: { loadings: true }
    });
    let warehouseDerek = 0, warehouseLetef = 0;
    for (const item of candidateItems) {
      const remaining = computeRemaining(item);
      if (remaining.remainingWeight <= 0) continue;
      if (item.category === 'ደረቅ') warehouseDerek += remaining.remainingWeight;
      else warehouseLetef += remaining.remainingWeight;
    }

    // 🚚 2,3,4: ለተመረጠው መኪና ብቻ - ምንጭ እና ምድብ ተከፋፍሎ
    const loadings = await prisma.loading.findMany({
      where: { truckId, isActive: true },
      include: { cargoItem: true }
    });

    let truckDerek = 0, truckLetef = 0, externalDerek = 0, externalLetef = 0, loadedDerek = 0, loadedLetef = 0;
    for (const l of loadings) {
      const isDerek = l.cargoItem.category === 'ደረቅ';
      if (isDerek) loadedDerek += l.weight; else loadedLetef += l.weight;

      if (l.source === 'መኪናው ጭኖት የመጣ') {
        if (isDerek) truckDerek += l.weight; else truckLetef += l.weight;
      } else if (l.source === 'ከውጭ ጫኞች') {
        if (isDerek) externalDerek += l.weight; else externalLetef += l.weight;
      }
    }

    res.json({
      success: true,
      data: {
        warehouseDerek: Number(warehouseDerek.toFixed(2)),
        warehouseLetef: Number(warehouseLetef.toFixed(2)),
        truckDerek: Number(truckDerek.toFixed(2)),
        truckLetef: Number(truckLetef.toFixed(2)),
        externalDerek: Number(externalDerek.toFixed(2)),
        externalLetef: Number(externalLetef.toFixed(2)),
        loadedDerek: Number(loadedDerek.toFixed(2)),
        loadedLetef: Number(loadedLetef.toFixed(2)),
        totalLoadedWeight: Number((loadedDerek + loadedLetef).toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('❌ ዳሽቦርድ ስታትስቲክስ ማምጣት አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ዳሽቦርድ ስታትስቲክስ ማምጣት አልተቻለም' });
  }
});

// =====================================================================
// 🚚 2. Truck (መኪና) CRUD
// =====================================================================

// GET /api/loading/trucks?status=ACTIVE
router.get('/trucks', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE';

    if (status === 'ACTIVE') {
      const trucks = await prisma.truck.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' }
      });

      const trucksWithWeight = await Promise.all(
        trucks.map(async (truck: any) => {
          const agg = await prisma.loading.aggregate({
            where: { truckId: String(truck.id), isActive: true },
            _sum: { weight: true }
          });
          return { ...truck, loadedWeight: agg._sum.weight || 0 };
        })
      );

      res.json({ success: true, data: trucksWithWeight });
      return;
    }


    const page = Math.max(1, Number(req.query.page) || 1);
const pageSize = Math.max(1, Number(req.query.pageSize) || 10);
const search = ((req.query.search as string) || '').trim();
const month = (req.query.month as string) || ''; // ምሳሌ: "2026-08"

const where: any = { status: 'ARCHIVED' };

if (month) {
  const [y, m] = month.split('-').map(Number);
  if (y && m) {
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.completionDate = { gte: start, lt: end };
  }
}


    if (search) {
  where.OR = [
    { plateNumber: { contains: search, mode: 'insensitive' } },
    { driverName: { contains: search, mode: 'insensitive' } },
    { loaderStaff: { contains: search, mode: 'insensitive' } },
    { truckType: { contains: search, mode: 'insensitive' } },
    // ✅ በዚህ መኪና ላይ የተጫነ እቃ ባለቤት ነጋዴ ስም ወይም ስልክ ካገኘ ደግሞ ይመልሳል
    {
      loadings: {
        some: {
          cargoItem: {
            receipt: {
              OR: [
                { merchantName: { contains: search, mode: 'insensitive' } },
                { merchantPhone: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      }
    }
  ];
}

    const [total, trucks] = await Promise.all([
      prisma.truck.count({ where }),
      prisma.truck.findMany({
        where,
        orderBy: { completionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({
      success: true,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      data: trucks
    });
  } catch (error: any) {
    console.error('❌ መኪኖችን ማምጣት አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'መኪኖችን ማምጣት አልተቻለም' });
  }
});

// GET /api/loading/trucks/:id
router.get('/trucks/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const truck = await prisma.truck.findUnique({
      where: { id },
      include: { nonKgLaborItems: true }
    });
    if (!truck) {
      res.status(404).json({ success: false, error: 'መኪናው አልተገኘም' });
      return;
    }

    const agg = await prisma.loading.aggregate({
      where: { truckId: String(truck.id), isActive: true },
      _sum: { weight: true }
    });

    res.json({ success: true, data: { ...truck, loadedWeight: agg._sum.weight || 0 } });
  } catch (error: any) {
    console.error('❌ መኪና ማምጣት አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'መኪና ማምጣት አልተቻለም' });
  }
});

// POST /api/loading/trucks
router.post('/trucks', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const { plateNumber, truckType, driverName, driverPhone, ownerName, ownerPhone, loaderStaff, entryDate, loadingStartDate } = req.body;

    const latestRate = await prisma.laborRateSetting.findFirst({ orderBy: { createdAt: 'desc' } });

    const truck = await prisma.truck.create({
      data: {
        plateNumber: plateNumber || '',
        truckType: truckType || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        ownerName: ownerName || null,
        ownerPhone: ownerPhone || null,
        loaderStaff: loaderStaff || 'ክንፈ',
        entryDate: entryDate || null,
        loadingStartDate: loadingStartDate || null,
        status: 'ACTIVE',
        isSaved: false,
        gateRate: latestRate?.gateRate ?? 0.30,
        truckRate: latestRate?.truckRate ?? 0.35
      }
    });

    res.status(201).json({ success: true, data: truck });
  } catch (error: any) {
    console.error('❌ መኪና መመዝገብ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'መኪና መመዝገብ አልተቻለም' });
  }
});

// PATCH /api/loading/trucks/:id
router.patch('/trucks/:id', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { plateNumber, truckType, driverName, driverPhone, ownerName, ownerPhone, loaderStaff, markSaved } = req.body;

    if (markSaved) {
      if (!plateNumber || !String(plateNumber).trim()) {
        res.status(400).json({ success: false, error: '❌ እባክዎ የመኪና ታርጋ ቁጥር ያስገቡ!' });
        return;
      }
      if (!truckType) {
        res.status(400).json({ success: false, error: '❌ እባክዎ የመኪና አይነት ይምረጡ!' });
        return;
      }
    }

    const truck = await prisma.truck.update({
      where: { id },
      data: {
        ...(plateNumber !== undefined ? { plateNumber: String(plateNumber).toUpperCase() } : {}),
        ...(truckType !== undefined ? { truckType } : {}),
        ...(driverName !== undefined ? { driverName } : {}),
        ...(driverPhone !== undefined ? { driverPhone } : {}),
        ...(ownerName !== undefined ? { ownerName } : {}),
        ...(ownerPhone !== undefined ? { ownerPhone } : {}),
        ...(loaderStaff !== undefined ? { loaderStaff } : {}),
        isSaved: markSaved ? true : false
      }
    });

    res.json({ success: true, data: truck });
  } catch (error: any) {
    console.error('❌ መኪና ማዘመን አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'መኪና ማዘመን አልተቻለም' });
  }
});

// DELETE /api/loading/trucks/:id
router.delete('/trucks/:id', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    // 📦 በዚህ መኪና ላይ የተጫኑ (ንቁ) እቃዎች ካሉ፣ ትሩኩ ከመሰረዙ በፊት ወደ መጋዘን (ገንዘብ) እንዲመለሱ እናደርጋለን
    const activeLoadings = await prisma.loading.findMany({ where: { truckId: id, isActive: true } });
    const affectedCargoItemIds = [...new Set(activeLoadings.map(l => l.cargoItemId))];

    for (const cargoItemId of affectedCargoItemIds) {
      const cargo = await prisma.cargoItem.findUnique({ where: { id: cargoItemId }, include: { loadings: true } });
      if (!cargo) continue;
      // ✅ የዚህ መኪና ብቻ loadings ን inactive እናደርጋለን (ሌላ መኪና ላይ ያለው ንቁ ሆኖ ይቆያል)
      const otherActiveLoadings = cargo.loadings.filter((l: any) => l.isActive && l.truckId !== id);
      const remainingAfterReturn = computeRemaining({ ...cargo, loadings: otherActiveLoadings });
      await prisma.cargoItem.update({
        where: { id: cargoItemId },
        data: { status: remainingAfterReturn.remainingWeight >= cargo.weight ? 'በመጋዘን ያለ' : (remainingAfterReturn.isFullyLoaded ? 'ተጭኗል' : 'ከፊል ተጭኗል') }
      });
    }

    // 🧹 ይህ መኪና ራሱ እየተሰረዘ ስለሆነ ተያያዥ የሆኑ መዝገቦችን እናጠፋለን (FK constraint ስላለ ቅድሚያ)
    await prisma.loading.deleteMany({ where: { truckId: id } });
    await prisma.shortageNote.deleteMany({ where: { truckId: id } });
    await prisma.nonKgLaborItem.deleteMany({ where: { truckId: id } });

    await prisma.truck.delete({ where: { id } });
    res.json({ success: true, message: '🗑️ መኪናው ተሰርዟል፤ የተጫኑ እቃዎች ካሉ ወደ መጋዘን ተመልሰዋል።' });
  } catch (error: any) {
    console.error('❌ መኪና ማስወገድ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'መኪና ማስወገድ አልተቻለም' });
  }
});
// router.delete('/trucks/:id', async (req: Request, res: Response) => {
//   try {
//     const id = String(req.params.id);
//     const activeCount = await prisma.truck.count({ where: { status: 'ACTIVE' } });
//     if (activeCount <= 1) {
//       res.status(400).json({ success: false, error: '⚠️ ቢያንስ አንድ ንቁ ጭነት መኪና መኖር አለበት!' });
//       return;
//     }
//     const loadedCount = await prisma.loading.count({ where: { truckId: id, isActive: true } });
//     if (loadedCount > 0) {
//       res.status(400).json({ success: false, error: '⚠️ ይህ መኪና ላይ የተጫኑ እቃዎች ስላሉ መሰረዝ አይቻልም - መጀመሪያ እቃዎቹን ያውርዱ!' });
//       return;
//     }
//     await prisma.truck.delete({ where: { id } });
//     res.json({ success: true });
//   } catch (error: any) {
//     console.error('❌ መኪና ማስወገድ አልተቻለም:', error);
//     res.status(500).json({ success: false, error: 'መኪና ማስወገድ አልተቻለም' });
//   }
// });

// =====================================================================
// ✔️ 3. መጫን / ማውረድ / ቅናሽ ሪፖርት
// =====================================================================

// POST /api/loading/trucks/:truckId/load
router.post('/trucks/:truckId/load', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const truckId = String(req.params.truckId);
    const { cargoItemId, packageId, weight, source, method, shortage } = req.body;

    const truck = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck || !truck.isSaved) {
      res.status(400).json({ success: false, error: "⚠️ እባክዎ መጀመሪያ የመኪናውን መረጃ ሞልተው መዝግቡ (Save)!" });
      return;
    }
    if (!source) {
      res.status(400).json({ success: false, error: "⚠️ እባክዎ 'ማን እንደጫነው' ይምረጡ!" });
      return;
    }
    if (source === 'የመጋዘን ጫኝ አውራጅ' && !method) {
      res.status(400).json({ success: false, error: "⚠️ ከመጋዘን ጫኞች ስር 'የአጫጫን ስልት' ይምረጡ!" });
      return;
    }

    const cargoItem = await prisma.cargoItem.findUnique({ where: { id: String(cargoItemId) }, include: { loadings: true } });
    if (!cargoItem) {
      res.status(404).json({ success: false, error: 'እቃው አልተገኘም' });
      return;
    }

    const remaining = computeRemaining(cargoItem);
    const weightNum = Number(weight);
    if (weightNum <= 0 || weightNum > remaining.remainingWeight + 0.001) {
      res.status(400).json({ success: false, error: `⚠️ የገባው ክብደት ትክክል አይደለም (ቀሪ፦ ${remaining.remainingWeight} ኪ.ግ)` });
      return;
    }
    if (shortage?.reason && !shortage?.weight) {
      res.status(400).json({ success: false, error: '⚠️ የቅናሽ ክብደት ያስፈልጋል!' });
      return;
    }

    const operations: any[] = [
      prisma.loading.create({
        data: {
          cargoItemId: String(cargoItemId),
          packageId: packageId ? String(packageId) : null,
          truckId,
          weight: weightNum,
          source,
          method: method || null,
          loadedBy: truck.loaderStaff
        }
      })
    ];

    if (shortage?.reason) {
      operations.push(
        prisma.shortageNote.create({
          data: {
            cargoItemId: String(cargoItemId),
            truckId,
            weight: Number(shortage.weight) || 0,
            quantityText: shortage.quantityText || null,
            reason: shortage.reason
          }
        })
      );
    }

    const results = await prisma.$transaction(operations);
    const loading = results[0];

    const refreshed = await prisma.cargoItem.findUnique({ where: { id: String(cargoItemId) }, include: { loadings: true } });
    if (refreshed) {
      const newRemaining = computeRemaining(refreshed);
      await prisma.cargoItem.update({
        where: { id: String(cargoItemId) },
        data: { status: newRemaining.isFullyLoaded ? 'ተጭኗል' : 'ከፊል ተጭኗል' }
      });
    }

    res.status(201).json({ success: true, data: loading });
  } catch (error: any) {
    console.error('❌ እቃ መጫን አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'እቃ መጫን አልተቻለም' });
  }
});

// POST /api/loading/trucks/:truckId/load-batch
router.post('/trucks/:truckId/load-batch', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const truckId = String(req.params.truckId);
    const { source, method, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: '⚠️ የሚጫን እቃ አልተመረጠም!' });
      return;
    }

    const truck = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck || !truck.isSaved) {
      res.status(400).json({ success: false, error: "⚠️ እባክዎ መጀመሪያ የመኪናውን መረጃ ሞልተው መዝግቡ (Save)!" });
      return;
    }
    if (!source) {
      res.status(400).json({ success: false, error: "⚠️ እባክዎ 'ማን እንደጫነው' ይምረጡ!" });
      return;
    }
    if (source === 'የመጋዘን ጫኝ አውራጅ' && !method) {
      res.status(400).json({ success: false, error: "⚠️ ከመጋዘን ጫኞች ስር 'የአጫጫን ስልት' ይምረጡ!" });
      return;
    }

    const cargoItemIds = [...new Set(items.map((i: any) => String(i.cargoItemId)))];
    const cargoItems = await prisma.cargoItem.findMany({ where: { id: { in: cargoItemIds } }, include: { loadings: true } });
    const cargoMap = new Map(cargoItems.map((c: any) => [c.id, c]));

    for (const it of items) {
      const cargo = cargoMap.get(String(it.cargoItemId));
      if (!cargo) {
        res.status(404).json({ success: false, error: 'አንድ ወይም ከዚያ በላይ እቃዎች አልተገኙም' });
        return;
      }
      const remaining = computeRemaining(cargo);
      if (Number(it.weight) <= 0 || Number(it.weight) > remaining.remainingWeight + 0.001) {
        res.status(400).json({ success: false, error: `⚠️ የ${cargo.description} ክብደት ትክክል አይደለም (ቀሪ፦ ${remaining.remainingWeight} ኪ.ግ)` });
        return;
      }
    }

    const loadings = await prisma.$transaction(
      items.map((it: any) =>
        prisma.loading.create({
          data: {
            cargoItemId: String(it.cargoItemId),
            packageId: it.packageId ? String(it.packageId) : null,
            truckId,
            weight: Number(it.weight),
            source,
            method: method || null,
            loadedBy: truck.loaderStaff
          }
        })
      )
    );

    for (const cargoItemId of cargoItemIds) {
      const refreshed = await prisma.cargoItem.findUnique({ where: { id: cargoItemId }, include: { loadings: true } });
      if (refreshed) {
        const newRemaining = computeRemaining(refreshed);
        await prisma.cargoItem.update({
          where: { id: cargoItemId },
          data: { status: newRemaining.isFullyLoaded ? 'ተጭኗል' : 'ከፊል ተጭኗል' }
        });
      }
    }

    res.status(201).json({ success: true, data: loadings, message: `✔️ ${loadings.length} እቃዎች ታርጋ ${truck.plateNumber} ላይ ተጭነዋል!` });
  } catch (error: any) {
    console.error('❌ በጅምላ መጫን አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'በጅምላ መጫን አልተቻለም' });
  }
});

// POST /api/loading/loadings/:loadingId/unload
router.post('/loadings/:loadingId/unload', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const loadingId = String(req.params.loadingId);

    const loading = await prisma.loading.update({
      where: { id: loadingId },
      data: { isActive: false, unloadedAt: new Date() }
    });


    const refreshed = await prisma.cargoItem.findUnique({ where: { id: String(loading.cargoItemId) }, include: { loadings: true } });
if (refreshed) {
  const remaining = computeRemaining(refreshed);
  const isFullyBackInWarehouse = remaining.remainingWeight >= refreshed.weight;

  await prisma.cargoItem.update({
    where: { id: String(refreshed.id) },
    data: { status: isFullyBackInWarehouse ? 'በመጋዘን ያለ' : (remaining.isFullyLoaded ? 'ተጭኗል' : 'ከፊል ተጭኗል') }
  });

  // 🧹 እቃው ሙሉ በሙሉ ወደ መጋዘን ከተመለሰ (ልክ እንደ በፊቱ ከሆነ)፣ ያለፈው የቅናሽ ምክንያት/ቁጥር
  // ትርጉም ስለሌለው (ትክክለኛ description እና ቁጥር እንደ በፊቱ ስለሚመለስ) እናጠፋዋለን
  if (isFullyBackInWarehouse) {
    await prisma.shortageNote.deleteMany({ where: { cargoItemId: String(refreshed.id) } });
  }
}

    res.json({ success: true, data: loading });
  } catch (error: any) {
    console.error('❌ ማውረድ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ማውረድ አልተቻለም' });
  }
});

// PATCH /api/loading/cargo-items/:id
router.patch('/cargo-items/:id', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { category } = req.body;
    if (!category) {
      res.status(400).json({ success: false, error: 'ምድብ ያስፈልጋል' });
      return;
    }

    const item = await prisma.cargoItem.update({ where: { id }, data: { category } });
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('❌ ምድብ ማዘመን አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ምድብ ማዘመን አልተቻለም' });
  }
});

// POST /api/loading/cargo-items/:cargoItemId/shortage
router.post('/cargo-items/:cargoItemId/shortage', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const cargoItemId = String(req.params.cargoItemId);
    const { truckId, weight, quantityText, reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, error: '⚠️ የቅናሽ ምክንያት ያስፈልጋል!' });
      return;
    }

    const note = await prisma.shortageNote.create({
      data: {
        cargoItemId,
        truckId: String(truckId),
        weight: Number(weight) || 0,
        quantityText: quantityText || null,
        reason
      }
    });

    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    console.error('❌ ቅናሽ ሪፖርት መመዝገብ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ቅናሽ ሪፖርት መመዝገብ አልተቻለም' });
  }
});

// =====================================================================
// 🏆 4. አቺቭመንት (አሁን የተጫኑ) — የመኪና ማጠቃለያ
// =====================================================================

// GET /api/loading/trucks/:truckId/summary
router.get('/trucks/:truckId/summary', async (req: Request, res: Response) => {
  try {
    const truckId = String(req.params.truckId);

    const truck = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck) {
      res.status(404).json({ success: false, error: 'መኪናው አልተገኘም' });
      return;
    }

   const loadings = await prisma.loading.findMany({
  where: { truckId, isActive: true },
  include: {
    cargoItem: {
      include: {
        receipt: true,
        // ✅ ቁልፍ ማስተካከያ - ለዚህ ልዩ መኪና (truckId) የተመዘገበውን ቅናሽ ብቻ እናመጣለን፣
        // ሌላ መኪና ላይ የተመዘገበ ቅናሽ ወደዚህ መኪና ስሌት እንዳይገባ (cross-contamination) ይከላከላል
        shortageNotes: { where: { truckId }, orderBy: { createdAt: 'desc' }, take: 1 }
      }
    }
  }
});

const grouped: Record<string, {
  merchantName: string; merchantPhone: string; receiptNo: string;
  itemsText: string[]; dryWeight: number; letefWeight: number; loadingIds: string[];
  _cargoGroups: Record<string, {
    description: string; weights: number[]; isMultiPackage: boolean; originalWeight: number;
    shortageQuantityText: string | null; shortageReason: string | null;
  }>;
  _receiptNos: Set<string>;
}> = {};

for (const l of loadings) {
  // ✅ አሁን በ merchant ስም ብቻ እንቧደናለን (ደረሰኝ ቁጥር ቢለያይም እንኳ) — ተመሳሳይ ነጋዴ በአንድ ረድፍ ብቻ እንዲታይ
  const key = l.cargoItem.receipt.merchantName;
  if (!grouped[key]) {
    grouped[key] = {
      merchantName: l.cargoItem.receipt.merchantName,
      merchantPhone: l.cargoItem.receipt.merchantPhone || '-',
      receiptNo: '',
      itemsText: [],
      dryWeight: 0,
      letefWeight: 0,
      loadingIds: [],
      _cargoGroups: {},
      _receiptNos: new Set<string>()
    };
  }
  const g = grouped[key];
  g._receiptNos.add(l.cargoItem.receipt.receiptNo);
  if ((!g.merchantPhone || g.merchantPhone === '-') && l.cargoItem.receipt.merchantPhone) {
    g.merchantPhone = l.cargoItem.receipt.merchantPhone;
  }
  g.loadingIds.push(l.id);
  if (l.cargoItem.category === 'ደረቅ') g.dryWeight += l.weight;
  else g.letefWeight += l.weight;

  if (!g._cargoGroups[l.cargoItemId]) {
    g._cargoGroups[l.cargoItemId] = {
      description: l.cargoItem.description,
      weights: [],
      isMultiPackage: l.cargoItem.isMultiPackage,
      originalWeight: l.cargoItem.weight,
      shortageQuantityText: l.cargoItem.shortageNotes?.[0]?.quantityText || null,
      shortageReason: l.cargoItem.shortageNotes?.[0]?.reason || null
    };
  }
  g._cargoGroups[l.cargoItemId].weights.push(l.weight);
}

// 📝 ለያንዳንዱ merchant ቡድን የተጠቃለለ itemsText እንገነባለን — ተመሳሳይ የእቃ ስም ያላቸውን አንድ ላይ እናዋህዳለን
for (const key in grouped) {
  const g: any = grouped[key];
  g.receiptNo = Array.from(g._receiptNos).join(' / ');

  const perCargo = Object.values(g._cargoGroups).map((cg: any) => {
    const totalW = Number(cg.weights.reduce((s: number, w: number) => s + w, 0).toFixed(2));
    const originalQty = parseLeadingQty(cg.description);
    const restMatch = cg.description.match(/^\d+\s*(.*)$/);
    const itemName = restMatch ? restMatch[1].trim() : cg.description.trim();

    let qty = 0;
    if (cg.isMultiPackage) {
      qty = cg.weights.length;
    } else if (originalQty !== null && cg.originalWeight) {
      qty = Math.max(0, Math.round(originalQty * totalW / cg.originalWeight));
    }

    return { itemName, qty, weights: cg.weights as number[], totalW, shortageReason: cg.shortageReason as string | null };
  });

  // 🔗 ተመሳሳይ የእቃ ስም (ቁጥር ውጭ ያለው ጽሁፍ) ያላቸውን cargoItems በአንድ እናዋህዳለን
  const mergedByName: Record<string, { qty: number; weights: number[]; totalW: number; reasons: Set<string> }> = {};
  for (const pc of perCargo) {
    if (!mergedByName[pc.itemName]) {
      mergedByName[pc.itemName] = { qty: 0, weights: [], totalW: 0, reasons: new Set() };
    }
    const m = mergedByName[pc.itemName];
    m.qty += pc.qty;
    m.weights.push(...pc.weights);
    m.totalW = Number((m.totalW + pc.totalW).toFixed(2));
    if (pc.shortageReason) m.reasons.add(pc.shortageReason);
  }

  g.itemsText = Object.entries(mergedByName).map(([itemName, m]) => {
    const weightsStr = m.weights.length > 1
      ? ` (${m.weights.map((w: number) => `${w} `).join('፣ ')})`
      : ` (${m.totalW} ኪ.ግ)`;
    let line = `${m.qty} ${itemName}${weightsStr}`;
    if (m.reasons.size > 0) {
      line += ` — ⚠️ ${Array.from(m.reasons).join('፣ ')}`;
    }
    return line;
  });
}

const loadedRows = Object.values(grouped).map(({ _cargoGroups, _receiptNos, ...rest }: any) => rest);

    // const loadedRows = Object.values(grouped);


    const totalDry = loadedRows.reduce((s, r) => s + r.dryWeight, 0);
    const totalLetef = loadedRows.reduce((s, r) => s + r.letefWeight, 0);


    const loadingsDetail = loadings.map((l: any) => {
  let displayDescription = l.cargoItem.description;

  if (l.cargoItem.isMultiPackage) {
    // ✅ እያንዳንዱ የተመዘገበ Loading ለ multi-package እቃ አንድ ነጠላ ኬሻ ብቻ ይወክላል
    displayDescription = updateDescriptionQuantity(l.cargoItem.description, 1);
  } else {
    // 📐 ነጠላ እቃ ላይ፣ ይሄ የተለየ Loading የያዘውን ክብደት መጠን ተመጣጣኝ ቁጥር እናሰላለን
    const originalQty = parseLeadingQty(l.cargoItem.description);
    if (originalQty !== null && l.cargoItem.weight) {
      const loadedQty = Math.max(1, Math.round(originalQty * l.weight / l.cargoItem.weight));
      displayDescription = updateDescriptionQuantity(l.cargoItem.description, loadedQty);
    }
  }

  return {
    id: l.id,
    cargoItemId: l.cargoItemId,
    packageId: l.packageId,
    description: displayDescription,
    weight: l.weight,
    category: l.cargoItem.category,
    source: l.source,
    method: l.method,
    merchantName: l.cargoItem.receipt.merchantName,
    merchantPhone: l.cargoItem.receipt.merchantPhone,
    receiptNo: l.cargoItem.receipt.receiptNo
  };
});

    const gateWeight = loadings.filter((l: any) => l.source === 'የመጋዘን ጫኝ አውራጅ' && l.method === 'ከመጋዘን').reduce((s: number, l: any) => s + l.weight, 0);
    const truckWeight = loadings.filter((l: any) => l.source === 'የመጋዘን ጫኝ አውራጅ' && l.method === 'ከመኪና').reduce((s: number, l: any) => s + l.weight, 0);
    const transitWeight = loadings.filter((l: any) => l.source === 'መኪናው ጭኖት የመጣ').reduce((s: number, l: any) => s + l.weight, 0);
    const externalWeight = loadings.filter((l: any) => l.source === 'ከውጭ ጫኞች').reduce((s: number, l: any) => s + l.weight, 0);

    const gateCost = Number((gateWeight * truck.gateRate).toFixed(2));
const truckCost = Number((truckWeight * truck.truckRate).toFixed(2));

// ✅ ከኪሎ ግራም ውጭ የተመዘገቡ ልዩ እቃዎችን (NonKgLaborItem) ወደ ጠቅላላ ድምር እንጨምራለን
const nonKgItems = await prisma.nonKgLaborItem.findMany({ where: { truckId } });
const nonKgTotal = Number(nonKgItems.reduce((s, n) => s + n.cost, 0).toFixed(2));

res.json({
  success: true,
  data: {
    truck,
    loadedRows,
    loadingsDetail,
    totalDry,
    totalLetef,
    grandTotal: totalDry + totalLetef,
    labor: {
      gateWeight, truckWeight, transitWeight, externalWeight,
      gateCost, truckCost,
      nonKgTotal, // 👈 አዲስ
      totalPayout: Number((gateCost + truckCost + nonKgTotal).toFixed(2)) // 👈 ✅ አሁን ልዩ እቃዎችንም ያካትታል
    },
    nonKgItems
  }
}); 
  } catch (error: any) {
    console.error('❌ የመኪና ማጠቃለያ ማምጣት አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'የመኪና ማጠቃለያ ማምጣት አልተቻለም' });
  }
});

// POST /api/loading/trucks/:truckId/confirm
router.post('/trucks/:truckId/confirm', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const truckId = String(req.params.truckId);

    const truck = await prisma.truck.update({
      where: { id: truckId },
      data: { status: 'ARCHIVED', completionDate: new Date() }
    });

    res.json({ success: true, data: truck, message: `🎉 የጭነት መኪና (${truck.plateNumber}) ጭነት ተቆልፎ ወደ ማህደር ተዛውሯል!` });
  } catch (error: any) {
    console.error('❌ ጭነት መቆለፍ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ጭነት መቆለፍ አልተቻለም' });
  }
});

// =====================================================================
// 🗄️ 5. ማህደር-ተኮር ተግባራት
// =====================================================================

// PATCH /api/loading/trucks/:truckId/rates
router.patch('/trucks/:truckId/rates', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const truckId = String(req.params.truckId);
    const { gateRate, truckRate } = req.body;

    const existing = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'መኪናው አልተገኘም' });
      return;
    }
    if (existing.isVerified) {
      res.status(400).json({ success: false, error: '⚠️ ክፍያው ተረጋግጦ ስለተቆለፈ ተመኑን መቀየር አይቻልም!' });
      return;
    }

    const truck = await prisma.truck.update({
      where: { id: truckId },
      data: {
        ...(gateRate !== undefined ? { gateRate: Number(gateRate) } : {}),
        ...(truckRate !== undefined ? { truckRate: Number(truckRate) } : {})
      }
    });

    res.json({ success: true, data: truck });
  } catch (error: any) {
    console.error('❌ ተመን ማዘመን አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ተመን ማዘመን አልተቻለም' });
  }
});

// POST /api/loading/trucks/:truckId/non-kg-items
router.post('/trucks/:truckId/non-kg-items', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const truckId = String(req.params.truckId);
    const { name, qty, rate } = req.body;

    if (!name || !qty || !rate) {
      res.status(400).json({ success: false, error: '⚠️ እባክዎ ሁሉንም መስኮች ይሙሉ!' });
      return;
    }

    const cost = Number(qty) * Number(rate);
    const item = await prisma.nonKgLaborItem.create({
      data: { truckId, name, qty: Number(qty), rate: Number(rate), cost }
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('❌ ልዩ እቃ መመዝገብ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ልዩ እቃ መመዝገብ አልተቻለም' });
  }
});

// DELETE /api/loading/non-kg-items/:id
router.delete('/non-kg-items/:id', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = await prisma.nonKgLaborItem.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ success: false, error: 'እቃው አልተገኘም' });
      return;
    }
    const truck = await prisma.truck.findUnique({ where: { id: item.truckId } });
    if (truck?.isVerified) {
      res.status(400).json({ success: false, error: '⚠️ ክፍያው ተረጋግጦ ስለተቆለፈ ማጥፋት አይቻልም!' });
      return;
    }
    await prisma.nonKgLaborItem.delete({ where: { id } });
    res.json({ success: true, message: '🗑️ ልዩ እቃው ተሰርዟል።' });
  } catch (error: any) {
    console.error('❌ ልዩ እቃ ማጥፋት አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ልዩ እቃ ማጥፋት አልተቻለም' });
  }
});

// PATCH /api/loading/trucks/:truckId/verify
router.patch('/trucks/:truckId/verify', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const truckId = String(req.params.truckId);
    const truck = await prisma.truck.update({ where: { id: truckId }, data: { isVerified: true } });
    res.json({ success: true, data: truck, message: '✔ የጫኞች ክፍያ በተሳካ ሁኔታ ተቆልፎ ተመዝግቧል!' });
  } catch (error: any) {
    console.error('❌ ማረጋገጥ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ማረጋገጥ አልተቻለም' });
  }
});

// =====================================================================
// 💰 6. የክፍያ ተመን ቅንብር
// =====================================================================

// GET /api/loading/rate-settings
router.post('/rate-settings', requireRole('LOADER', 'OFFICE', 'OWNER'), async (req: Request, res: Response) => {
  try {
    const latest = await prisma.laborRateSetting.findFirst({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: latest || { gateRate: 0.30, truckRate: 0.35 } });
  } catch (error: any) {
    console.error('❌ ተመን ማምጣት አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ተመን ማምጣት አልተቻለም' });
  }
});

// POST /api/loading/rate-settings
router.post('/rate-settings', async (req: Request, res: Response) => {
  try {
    const { gateRate, truckRate, changedBy } = req.body;
    const setting = await prisma.laborRateSetting.create({
      data: {
        gateRate: Number(gateRate) || 0.30,
        truckRate: Number(truckRate) || 0.35,
        changedBy: changedBy || null
      }
    });
    res.status(201).json({ success: true, data: setting });
  } catch (error: any) {
    console.error('❌ ተመን መመዝገብ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ተመን መመዝገብ አልተቻለም' });
  }
});

// =====================================================================
// 💰 7. የመኪና አጠቃላይ ሂሳብ (Truck Account)
// =====================================================================
function computeTruckAccount(totalRevenue: number, truckPayment: number) {
  const commission = Number((truckPayment * 0.10).toFixed(2));
  const remaining = Number((totalRevenue - truckPayment).toFixed(2));
  const grandTotal = Number((remaining + commission).toFixed(2));
  return { commission, remaining, grandTotal };
}

// GET /api/loading/trucks/:truckId/account
router.get('/trucks/:truckId/account', requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const truckId = String(req.params.truckId);
    const account = await prisma.truckAccount.findUnique({ where: { truckId } });
    const totalRevenue = account?.totalRevenue || 0;
    const truckPayment = account?.truckPayment || 0;
    res.json({ success: true, data: { totalRevenue, truckPayment, ...computeTruckAccount(totalRevenue, truckPayment) } });
  } catch (error: any) {
    console.error('❌ የመኪና ሂሳብ ማምጣት አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'የመኪና ሂሳብ ማምጣት አልተቻለም' });
  }
});

// PATCH /api/loading/trucks/:truckId/account
router.patch('/trucks/:truckId/account', requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const truckId = String(req.params.truckId);
    const { totalRevenue, truckPayment } = req.body;

    const account = await prisma.truckAccount.upsert({
      where: { truckId },
      update: {
        ...(totalRevenue !== undefined ? { totalRevenue: Number(totalRevenue) } : {}),
        ...(truckPayment !== undefined ? { truckPayment: Number(truckPayment) } : {})
      },
      create: {
        truckId,
        totalRevenue: Number(totalRevenue) || 0,
        truckPayment: Number(truckPayment) || 0
      }
    });

    res.json({ success: true, data: { totalRevenue: account.totalRevenue, truckPayment: account.truckPayment, ...computeTruckAccount(account.totalRevenue, account.truckPayment) } });
  } catch (error: any) {
    console.error('❌ የመኪና ሂሳብ ማዘመን አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'የመኪና ሂሳብ ማዘመን አልተቻለም' });
  }
});


// =====================================================================
// 📊 8. ወደ Excel መላክ (ካንተ ማንዋል ፎርማት ጋር የሚመሳሰል)
// =====================================================================
router.get('/trucks/:truckId/export-excel', requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const truckId = String(req.params.truckId);
    const truck = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck) {
      res.status(404).json({ success: false, error: 'መኪናው አልተገኘም' });
      return;
    }

    const loadings = await prisma.loading.findMany({
      where: { truckId, isActive: true },
      include: { cargoItem: { include: { receipt: true } } }
    });

    // 🧮 እንደ /summary ተመሳሳይ merge logic - በ merchant ስም እንቧደናለን፣ ተመሳሳይ የእቃ ስም አንድ ላይ እናዋህዳለን
    const grouped: Record<string, {
      merchantName: string; merchantPhone: string; dryWeight: number; letefWeight: number;
      _cargoGroups: Record<string, { description: string; weights: number[]; isMultiPackage: boolean; originalWeight: number }>;
    }> = {};

    for (const l of loadings) {
      const key = l.cargoItem.receipt.merchantName;
      if (!grouped[key]) {
        grouped[key] = {
          merchantName: l.cargoItem.receipt.merchantName,
          merchantPhone: l.cargoItem.receipt.merchantPhone || '-',
          dryWeight: 0, letefWeight: 0, _cargoGroups: {}
        };
      }
      const g = grouped[key];
      if ((!g.merchantPhone || g.merchantPhone === '-') && l.cargoItem.receipt.merchantPhone) {
        g.merchantPhone = l.cargoItem.receipt.merchantPhone;
      }
      if (l.cargoItem.category === 'ደረቅ') g.dryWeight += l.weight; else g.letefWeight += l.weight;

      if (!g._cargoGroups[l.cargoItemId]) {
        g._cargoGroups[l.cargoItemId] = {
          description: l.cargoItem.description, weights: [],
          isMultiPackage: l.cargoItem.isMultiPackage, originalWeight: l.cargoItem.weight
        };
      }
      g._cargoGroups[l.cargoItemId].weights.push(l.weight);
    }

   const rows = Object.values(grouped).map((g: any) => {
  const perCargo = Object.values(g._cargoGroups).map((cg: any) => {
    const totalW = Number(cg.weights.reduce((s: number, w: number) => s + w, 0).toFixed(2));
    const originalQty = parseLeadingQty(cg.description);
    let qty = 0;
    if (cg.isMultiPackage) {
      qty = cg.weights.length;
    } else if (originalQty !== null && cg.originalWeight) {
      qty = Math.max(0, Math.round(originalQty * totalW / cg.originalWeight));
    }
    const restMatch = cg.description.match(/^\d+\s*(.*)$/);
    const itemName = restMatch ? restMatch[1].trim() : cg.description.trim();
    return { itemName, qty };
  });

  // 🔗 ተመሳሳይ የእቃ ስም ያላቸውን cargoItems (ለምሳሌ 2 ኬሻ ጫማ + 5 ኬሻ ጫማ) ወደ አንድ (7 ኬሻ ጫማ) እናዋህዳለን
  const mergedByName: Record<string, number> = {};
  for (const pc of perCargo) {
    mergedByName[pc.itemName] = (mergedByName[pc.itemName] || 0) + pc.qty;
  }
  const itemsText = Object.entries(mergedByName).map(([itemName, qty]) => `${qty} ${itemName}`.trim());

  return {
    merchantName: g.merchantName,
    merchantPhone: g.merchantPhone,
    itemsText: itemsText.join('\n'),
    dryWeight: g.dryWeight,
    letefWeight: g.letefWeight
  };
});

    // 📗 Excel ፋይል መገንባት
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('የእቃ ዝርዝር');

   sheet.columns = [
  { width: 6 },   // A ተ.ቁ
  { width: 22 },  // B የነጋዴ ስም
  { width: 16 },  // C ስልክ
  { width: 40 },  // D የእቃ ዝርዝር
  { width: 10 },  // E ደረቅ ኪ.ግ
  { width: 10 },  // F ለጠፍ ኪ.ግ
  { width: 8 },   // G ሴ.ሜ
  { width: 9 },   // H ለመኪና
  { width: 9 },   // I ለጠቅላላ
  { width: 15 },  // J የመኪና ኪራይ
  { width: 15 }   // K አጠቃላይ ኪራይ
];

    // 🏢 ራስጌ - የድርጅት ስም
   sheet.mergeCells('A1:K1');
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = 'ሰንሰለት የደረቅ ጭነት አገልግሎት መስጫ የግል ድርጅት  |  Senselet Dry Cargo Services';
    titleRow.getCell(1).font = { size: 15, bold: true, color: { argb: 'FF166534' } };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    titleRow.height = 24;

    sheet.mergeCells('A2:K2');
    const subTitleRow = sheet.getRow(2);
    subTitleRow.getCell(1).value = 'የመኪና ኪራይ መረከቢያ እና የእቃ ማስረከቢያ ሰነድ  |  Car rental inventory and delivery voucher';
    subTitleRow.getCell(1).font = { size: 11, bold: true, color: { argb: 'FF15803D' } };
    subTitleRow.getCell(1).alignment = { horizontal: 'center' };

    // 📍 ታርጋ / መነሻ / መድረሻ / ቀን
    sheet.mergeCells('A4:C4');
    sheet.getCell('A4').value = `ታርጋ ቁጥር: ET ${truck.plateNumber}`;
    sheet.getCell('A4').font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    sheet.getCell('A4').alignment = { horizontal: 'center' };

    sheet.mergeCells('D4:F4');
    sheet.getCell('D4').value = 'መነሻ: አዲስ አባባ መርካቶ';
    sheet.getCell('D4').font = { bold: true, size: 10 };

    sheet.mergeCells('G4:I4');
    sheet.getCell('G4').value = 'መድረሻ: መካነሰላም';
    sheet.getCell('G4').font = { bold: true, size: 10 };

    sheet.mergeCells('J4:K4');
    const completionDate = truck.completionDate ? new Date(truck.completionDate) : new Date();
    sheet.getCell('J4').value = `ቀን: ${getEthDateForExcel(completionDate)} (${completionDate.toLocaleDateString()})`;
    sheet.getCell('J4').font = { bold: true, size: 10 };
    sheet.getCell('J4').alignment = { horizontal: 'right' };

    // 🧾 የአምዶች ራስጌ (ካንተ ማንዋል ፎርማት ጋር ተመሳሳይ)
    const headerLabels = [
  'ተ.ቁ\nNo', 'የእቃ ባለቤት ስም\nOwner', 'አድራሻ/ስልክ\nAddress/Phone',
  'የእቃ አይነት እና ዝርዝር\nItem type and description', 'ደረቅ ኪ.ግ\nDry kg',
  'ለጠፍ ኪ.ግ\nPost it kg', 'ሴ.ሜ\nCm', 'ለመኪና', 'ለጠቅላላ',
  'የመኪና ኪራይ\nCar rental price', 'አጠቃላይ ኪራይ\nGeneral rent'
];
  const headerRow = sheet.getRow(6);
headerLabels.forEach((label, i) => {
  const cell = headerRow.getCell(i + 1);
  cell.value = label;
  cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FF94A3B8' } },
    right: { style: 'thin', color: { argb: 'FF94A3B8' } }
  };
});
headerRow.height = 32;

// 📏 እርዳታ ተግባር - አንድ ጽሁፍ በተወሰነ የአምድ ስፋት ውስጥ ስንት መስመር እንደሚያስፈልገው ይገምታል
function estimateWrappedLines(text: string, columnWidth: number): number {
  if (!text) return 1;
  const charsPerLine = Math.max(4, Math.floor(columnWidth * 1.7)); // ግምታዊ - Excel default font ልክ
  let totalLines = 0;
  for (const explicitLine of String(text).split('\n')) {
    totalLines += Math.max(1, Math.ceil(explicitLine.length / charsPerLine));
  }
  return totalLines;
}

let currentRow = 7;
rows.forEach((r) => {
  const row = sheet.getRow(currentRow);
  row.getCell(1).value = ''; // ተ.ቁ - በእጅ
  row.getCell(2).value = r.merchantName;
  row.getCell(3).value = r.merchantPhone;
  row.getCell(4).value = r.itemsText;
  row.getCell(5).value = r.dryWeight > 0 ? r.dryWeight : '';
  row.getCell(6).value = r.letefWeight > 0 ? r.letefWeight : '';
  // ሴ.ሜ (G) እስከ አጠቃላይ ኪራይ (K) ድረስ ባዶ - በእጅ

  for (let c = 1; c <= 11; c++) {
    const cell = row.getCell(c);
    cell.alignment = { vertical: 'top', horizontal: c === 4 || c === 2 ? 'left' : 'center', wrapText: true };
    cell.font = { size: 12, bold: true, color: { argb: 'FF000000' } }; // ✅ ጥቁር ፎንት ቀለም
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  }

  // ✅ ትክክለኛ ቁመት - በያንዳንዱ አምድ (ስም/ስልክ/ዝርዝር) ውስጥ ያለውን ረጅሙን ጽሁፍ ግምት ውስጥ በማስገባት
  const linesNeeded = Math.max(
    estimateWrappedLines(r.merchantName, 22),
    estimateWrappedLines(r.merchantPhone, 16),
    estimateWrappedLines(r.itemsText, 40)
  );
  row.height = Math.max(22, linesNeeded * 18);
  currentRow++;
});

    // 📤 ምላሽ ላክ
    const truckLabel = (truck.plateNumber || 'truck').replace(/[^a-zA-Z0-9]/g, '');
const dateLabel = completionDate.toISOString().split('T')[0]; // YYYY-MM-DD
const fileName = `ET${truckLabel}_${dateLabel}.xlsx`; // ምሳሌ: ETAAL2010_2026-08-12.xlsx

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('❌ ወደ Excel መላክ አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ወደ Excel መላክ አልተቻለም' });
  }
});


router.post('/truck-accounting-files', requireRole('OFFICE', 'OWNER'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: 'ፋይል አልተመረጠም' }); return; }
    const record = await prisma.truckAccountingFile.create({
      data: {
        fileName: req.file.originalname,
        fileData: req.file.buffer, // 👈 ራሱ ፋይሉ ወደ Neon DB ይገባል
        mimeType: req.file.mimetype || 'application/octet-stream',
        uploadedBy: req.body.uploadedBy || null
      },
      select: { id: true, fileName: true, mimeType: true, uploadedBy: true, uploadedAt: true } // fileData አትመልስ (ትልቅ ስለሆነ)
    });
    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    console.error('❌ ፋይል መጫን አልተቻለም:', error);
    res.status(500).json({ success: false, error: 'ፋይል መጫን አልተቻለም' });
  }
});

router.get('/truck-accounting-files', requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const files = await prisma.truckAccountingFile.findMany({
      orderBy: { uploadedAt: 'desc' },
      select: { id: true, fileName: true, mimeType: true, uploadedBy: true, uploadedAt: true } // ➡️ ዝርዝር ገጽ ላይ ራሱ ፋይሉን አንልክም
    });
    res.json({ success: true, data: files });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'ፋይሎችን ማምጣት አልተቻለም' });
  }
});

// 📥 ራሱ ፋይሉን ማውረጃ (DB ውስጥ ካለው binary data)
router.get('/truck-accounting-files/:id/download', requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const id = String(req.params.id);
    const file = await prisma.truckAccountingFile.findUnique({ where: { id } });
    if (!file) { res.status(404).json({ success: false, error: 'ፋይሉ አልተገኘም' }); return; }
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    res.send(Buffer.from(file.fileData));
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'ፋይል ማውረድ አልተቻለም' });
  }
});

router.delete('/truck-accounting-files/:id', requireRole('OFFICE', 'OWNER'), async (req, res) => {
  try {
    const id = String(req.params.id);
    await prisma.truckAccountingFile.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'ፋይል ማጥፋት አልተቻለም' });
  }
});

export default router;