import React, { useState, useEffect, useCallback } from 'react';
import { LOADING_API_BASE as API_BASE } from '../config/api';


// =====================================================================
// 🔌 ትንሽ fetch wrapper — ስህተት ካለ ራሱ throw ያደርጋል፣ ካልሆነ .data ብቻ ይመልሳል
// =====================================================================
async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* no body */ }
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || 'ከሰርቨር ጋር መገናኘት አልተቻለም');
  }
  return json;
}
const apiGet = (path: string) => apiCall(path);
const apiPost = (path: string, body?: any) => apiCall(path, { method: 'POST', body: JSON.stringify(body || {}) });
const apiPatch = (path: string, body?: any) => apiCall(path, { method: 'PATCH', body: JSON.stringify(body || {}) });
const apiDelete = (path: string) => apiCall(path, { method: 'DELETE' });

// =====================================================================
// 📦 Types — ከ loadingRoute.ts response ቅርጽ ጋር የሚመሳሰሉ
// =====================================================================
interface RemainingPackage { id: string; packageNo: number; weight: number; }

interface WarehouseRow {
  id: string; // CargoItem.id
  receiptNo: string;
  dateIn: string;
  merchantName: string;
  merchantPhone: string;
  description: string;
  category: 'ደረቅ' | 'ለጠፍ';
  isMultiPackage: boolean;
  weight: number; // ቀሪ (remaining) ክብደት - ከ ledger ራሱ የተሰላ
  remainingPackages: RemainingPackage[];
//   shortageReason?: string | null; // 👈 አዲስ
  shortageReason?: string | null;
intakeLoaderType?: string | null; // 👈 አዲስ
intakeCarPlate?: string | null;   // 👈 አዲስ
}

interface TruckBase {
  id: string;
  plateNumber: string;
  truckType: string;
  driverName: string;
  driverPhone: string;
  ownerName: string;
  ownerPhone: string;
  loaderStaff: string;
  entryDate: string;
  loadingStartDate: string;
  isSaved: boolean;
  isVerified: boolean;
  gateRate: number;
  truckRate: number;
  completionDate?: string | null;
  loadedWeight?: number;
}

interface LoadedRow {
  merchantName: string;
  merchantPhone: string;
  receiptNo: string;
  itemsText: string[];
  dryWeight: number;
  letefWeight: number;
  loadingIds: string[];
}

interface LoadingDetail {
  id: string;
  cargoItemId: string;
  packageId: string | null;
  description: string;
  weight: number;
  category: 'ደረቅ' | 'ለጠፍ';
  source: string;
  method: string | null;
  merchantName: string;
  merchantPhone: string;
  receiptNo: string;
}

interface NonKgItem { id?: string; name: string; qty: number; rate: number; cost: number; }

interface TruckSummary {
  truck: TruckBase;
  loadedRows: LoadedRow[];
  loadingsDetail: LoadingDetail[];
  totalDry: number;
  totalLetef: number;
  grandTotal: number;
  labor: { gateWeight: number; truckWeight: number; transitWeight: number; externalWeight: number; gateCost: number; truckCost: number; nonKgTotal: number; totalPayout: number };
//   labor: { gateWeight: number; truckWeight: number; transitWeight: number; externalWeight: number; gateCost: number; truckCost: number; totalPayout: number };
  nonKgItems?: NonKgItem[];
}


// 🎯 ትክክለኛ የኢትዮጵያ ቀን (WarehouseReceiver.tsx ላይ ካለው ተመሳሳይ ስሌት)
function getEthiopianDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

const TRUCK_TYPES = ['Isuzu', 'FSR', 'Casoni', 'ተሳቢ'];
const LOADER_STAFF_OPTIONS = ['ክንፈ', 'ብርሀኑ', 'አሌክስ'];
const NON_KG_ITEM_PRESETS = ['ሶፍት', 'ዳይፐር', 'ፍራሽ ትልቁ', 'ፍራሽ ትንሹ', 'ማጠጫ', 'ጀሪካን', 'ኮንዲት', 'ፒፒሲ' , 'ሌላ እቃ'];
const WAREHOUSE_PAGE_SIZE = 20;
const ARCHIVES_PAGE_SIZE = 15;

const emptyTruckFields = {
  plateNumber: '', truckType: '', driverName: '', driverPhone: '',
  ownerName: '', ownerPhone: '', loaderStaff: 'ክንፈ',
  entryDate: '', loadingStartDate: ''
};

export default function LoadingController() {
  const [currentView, setCurrentView] = useState<'loader' | 'achievement' | 'archives'>('loader');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const showApiError = (e: any) => showToast(`❌ ${e?.message || 'ስህተት ተፈጥሯል'}`, 'error');

  // ---------------- Section 3: warehouse pending items ----------------
  const [warehouseRows, setWarehouseRows] = useState<WarehouseRow[]>([]);
  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseTotal, setWarehouseTotal] = useState(0);
  const [warehouseTotalPages, setWarehouseTotalPages] = useState(1);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  // ---------------- Section 1: Active trucks ----------------
  const [activeTrucks, setActiveTrucks] = useState<TruckBase[]>([]);
  const [selectedTruckIndex, setSelectedTruckIndex] = useState(0);
  const activeTruck = activeTrucks[selectedTruckIndex] || null;
  const isTruckSaved = activeTruck ? activeTruck.isSaved : false;



  const [dashboardStats, setDashboardStats] = useState({
  warehouseDerek: 0, warehouseLetef: 0,
  truckDerek: 0, truckLetef: 0,
  externalDerek: 0, externalLetef: 0,
  loadedDerek: 0, loadedLetef: 0,
  totalLoadedWeight: 0
});

const fetchDashboardStats = useCallback(async (truckId: string, silent: boolean = false) => {
  try {
    const res = await apiGet(`/dashboard-stats/${truckId}`);
    setDashboardStats(res.data);
  } catch (e) {
    if (!silent) showApiError(e);
  }
}, []);

useEffect(() => {
  if (currentView === 'loader' && activeTruck?.id) {
    fetchDashboardStats(activeTruck.id, true);
  }
}, [currentView, activeTruck?.id, fetchDashboardStats]);


// 🔄 silent=true ስንልክ (ለምሳሌ ከ polling)፣ ስክሪኑ ላይ ምንም "በመጫን ላይ..." ብልጭታ አይታይም
const fetchWarehouseItems = useCallback(async (page: number, silent: boolean = false) => {
  if (!silent) setWarehouseLoading(true);
  try {
    const res = await apiGet(`/warehouse-items?page=${page}&pageSize=${WAREHOUSE_PAGE_SIZE}`);
    setWarehouseRows(res.data);
    setWarehouseTotal(res.total);
    setWarehouseTotalPages(res.totalPages);
  } catch (e) {
    if (!silent) showApiError(e);
  } finally {
    if (!silent) setWarehouseLoading(false);
  }
}, []);

  useEffect(() => { fetchWarehouseItems(warehousePage); }, [warehousePage, fetchWarehouseItems]);


  useEffect(() => {
  if (currentView !== 'loader') return;
  const pollInterval = setInterval(() => {
    fetchWarehouseItems(warehousePage, true);
    if (activeTruck?.id) fetchDashboardStats(activeTruck.id, true);
  }, 6000);
  return () => clearInterval(pollInterval);
}, [currentView, warehousePage, fetchWarehouseItems, activeTruck?.id, fetchDashboardStats]);

// 🔄 አስጫኙ ወደ "ማህደር" tab በተቀየረ ቁጥር ዝርዝሩን ዳግም ያመጣል (Confirm & Lock ካደረገ በኋላ
// browser refresh ሳያደርግ አዲሱ የተቆለፈ መኪና ወዲያውኑ እንዲታይ)
useEffect(() => {
  if (currentView === 'archives') {
    fetchArchivedTrucks(archivesPage, searchQuery);
  }
}, [currentView]);

  // per-row loader selections (local only, until "ጫን" is pressed)
  const [itemSelections, setItemSelections] = useState<{ [id: string]: { source: string; method: string } }>({});
  const [selectedPackages, setSelectedPackages] = useState<{ [pkgId: string]: boolean }>({});
  const [shortageDetails, setShortageDetails] = useState<{ [id: string]: { hasShortage: boolean; shortageWeight: number; shortageReason: string; shortageItemQty: string } }>({});

  const [editModalItem, setEditModalItem] = useState<WarehouseRow | null>(null);
const [editForm, setEditForm] = useState({ merchantName: '', merchantPhone: '', description: '', weight: '' });

const openEditModal = (item: WarehouseRow) => {
  setEditModalItem(item);
  setEditForm({
    merchantName: item.merchantName,
    merchantPhone: item.merchantPhone,
    description: item.description,
    weight: String(item.weight)
  });
};

// const submitEditItem = async () => {
//   if (!editModalItem) return;
//   try {
//     await apiPatch(`/warehouse-items/${editModalItem.id}/correct`, {
//       merchantName: editForm.merchantName.trim(),
//       merchantPhone: editForm.merchantPhone.trim(),
//       description: editForm.description.trim(),
//       ...(!editModalItem.isMultiPackage ? { weight: editForm.weight } : {})
//     });
//     showToast('✔️ መረጃው ተስተካክሏል', 'success');
//     setEditModalItem(null);
//     fetchWarehouseItems(warehousePage);
//   } catch (e) {
//     showApiError(e);
//   }
// };

const submitEditItem = async () => {
  if (!editModalItem) return;
  try {
    const res = await apiPatch(`/warehouse-items/${editModalItem.id}/correct`, {
      merchantName: editForm.merchantName.trim(),
      merchantPhone: editForm.merchantPhone.trim(),
      description: editForm.description.trim(),
      ...(!editModalItem.isMultiPackage ? { weight: editForm.weight } : {})
    });
    showToast(res.message || '✔️ መረጃው ተስተካክሏል', 'success');
    setEditModalItem(null);
    fetchWarehouseItems(warehousePage);
  } catch (e) {
    showApiError(e);
  }
};

  const handleSourceChange = (itemId: string, sourceValue: string) => {
    let defaultMethod = '';
    if (sourceValue === 'መኪናው ጭኖት የመጣ') defaultMethod = 'መኪናው ጭኖት የመጣው';
    if (sourceValue === 'ከውጭ ጫኞች') defaultMethod = 'የውጭ ጫኞች';
    setItemSelections(prev => ({ ...prev, [itemId]: { source: sourceValue, method: defaultMethod } }));
  };
  const handleMethodChange = (itemId: string, methodValue: string) => {
    setItemSelections(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || { source: '', method: '' }), method: methodValue } }));
  };
  const handlePackageCheckToggle = (packageId: string) => {
    setSelectedPackages(prev => ({ ...prev, [packageId]: !prev[packageId] }));
  };
  const toggleShortageForm = (itemId: string) => {
    setShortageDetails(prev => {
      const existing = prev[itemId] || { hasShortage: false, shortageWeight: 0, shortageReason: '', shortageItemQty: '' };
      return { ...prev, [itemId]: { ...existing, hasShortage: !existing.hasShortage } };
    });
  };
  const handleShortageFieldChange = (itemId: string, field: 'shortageWeight' | 'shortageReason' | 'shortageItemQty', value: any) => {
    setShortageDetails(prev => {
      const existing = prev[itemId] || { hasShortage: true, shortageWeight: 0, shortageReason: '', shortageItemQty: '' };
      return { ...prev, [itemId]: { ...existing, [field]: value } };
    });
  };

  const handleCategoryChange = async (itemId: string, newCategory: 'ለጠፍ' | 'ደረቅ') => {
    setWarehouseRows(prev => prev.map(r => r.id === itemId ? { ...r, category: newCategory } : r));
    try {
      await apiPatch(`/cargo-items/${itemId}`, { category: newCategory });
    } catch (e) {
      showApiError(e);
      fetchWarehouseItems(warehousePage);
    }
  };


  const fetchActiveTrucks = useCallback(async () => {
    try {
      const res = await apiGet('/trucks?status=ACTIVE');
      if (res.data.length === 0) {
        const created = await apiPost('/trucks', emptyTruckFields);
        setActiveTrucks([{ ...created.data, loadedWeight: 0 }]);
        setSelectedTruckIndex(0);
      } else {
        setActiveTrucks(res.data);
        setSelectedTruckIndex(idx => Math.min(idx, res.data.length - 1));
      }
    } catch (e) {
      showApiError(e);
    }
  }, []);

  useEffect(() => { fetchActiveTrucks(); }, [fetchActiveTrucks]);

  const updateActiveTruckField = (field: keyof typeof emptyTruckFields, value: string) => {
    setActiveTrucks(prev => prev.map((t, idx) => idx === selectedTruckIndex ? { ...t, [field]: value, isSaved: false } : t));
  };

  const addNewActiveTruck = async () => {
    if (activeTrucks.length >= 3) {
      showToast('⚠️ በአንድ ጊዜ መጫን የሚችሉት ቢበዛ 3 ንቁ መኪናዎችን ብቻ ነው!', 'error');
      return;
    }
    try {
      const created = await apiPost('/trucks', emptyTruckFields);
      setActiveTrucks(prev => [...prev, { ...created.data, loadedWeight: 0 }]);
      setSelectedTruckIndex(activeTrucks.length);
      showToast('➕ አዲስ ባዶ የመኪና ጭነት መዝገብ ተጨምሯል።', 'info');
    } catch (e) { showApiError(e); }
  };

const removeActiveTruck = async (index: number) => {
  const truckToRemove = activeTrucks[index];
  if (!truckToRemove) return;
  try {
    await apiDelete(`/trucks/${truckToRemove.id}`);
    const remaining = activeTrucks.filter((_, i) => i !== index);
    setActiveTrucks(remaining);
    setSelectedTruckIndex(0);
    showToast('🗑️ የተመረጠው መኪና ተሰርዟል፤ የተጫኑ እቃዎች ካሉ ወደ መጋዘን ተመልሰዋል።', 'info');
    fetchWarehouseItems(warehousePage, true); // 👈 የተመለሱ እቃዎች ወዲያውኑ እንዲታዩ
    if (remaining.length === 0) {
      fetchActiveTrucks(); // 👈 ምንም ትሩክ ስላልቀረ አዲስ ባዶ መዝገብ በራሱ እንዲፈጠር
    }
  } catch (e) { showApiError(e); }
};

  const saveTruckMasterAtIndex = async (index: number) => {
    const truck = activeTrucks[index];
    if (!truck) return;
    if (!truck.plateNumber.trim()) { showToast('❌ እባክዎ የመኪና ታርጋ ቁጥር ያስገቡ!', 'error'); return; }
    if (!truck.truckType) { showToast('❌ እባክዎ የመኪና አይነት ይምረጡ!', 'error'); return; }
    try {
      const res = await apiPatch(`/trucks/${truck.id}`, {
        plateNumber: truck.plateNumber, truckType: truck.truckType,
        driverName: truck.driverName, driverPhone: truck.driverPhone,
        ownerName: truck.ownerName, ownerPhone: truck.ownerPhone,
        loaderStaff: truck.loaderStaff, markSaved: true
      });
      setActiveTrucks(prev => prev.map((t, idx) => idx === index ? { ...t, ...res.data } : t));
      showToast(`📢 የመኪና ታርጋ ${truck.plateNumber} (${truck.truckType}) በተሳካ ሁኔታ ተቀምጧል!`, 'success');
    } catch (e) { showApiError(e); }
  };

  // ---------------- Loading (ጫን) flow ----------------
  const [pendingLoadItem, setPendingLoadItem] = useState<{ itemId: string } | null>(null);

  const buildLoadPayload = (itemId: string) => {
    const row = warehouseRows.find(r => r.id === itemId);
    const sel = itemSelections[itemId];
    const shortage = shortageDetails[itemId];
    return { row, sel, shortage };
  };

  const validateBeforeLoad = (itemId: string): boolean => {
    const savedTrucks = activeTrucks.filter(t => t.isSaved && t.plateNumber.trim() !== '');
    if (savedTrucks.length === 0) {
      showToast('⚠️ እባክዎ መጀመሪያ ከላይ የመኪናውን መረጃ ሞልተው መዝግብ (Save) ያድርጉ!', 'error');
      return false;
    }
    const sel = itemSelections[itemId];
    if (!sel || !sel.source) {
      showToast("⚠️ እባክዎ መጀመሪያ እቃውን 'ማን እንደጫነው' መርጠው ይሙሉ!", 'error');
      return false;
    }
    if (sel.source === 'የመጋዘን ጫኝ አውራጅ' && !sel.method) {
      showToast("⚠️ እባክዎ ከመጋዘን ጫኞች ስር 'የአጫጫን ስልት' መርጠው ይሙሉ!", 'error');
      return false;
    }
    return true;
  };

  const handleLoadItemWithTruckRouting = (itemId: string) => {
    if (!validateBeforeLoad(itemId)) return;
    const savedTrucks = activeTrucks.filter(t => t.isSaved && t.plateNumber.trim() !== '');
    if (savedTrucks.length === 1) {
      executeLoadItemOnTruck(itemId, savedTrucks[0].id);
    } else {
      setPendingLoadItem({ itemId });
    }
  };

  const executeLoadItemOnTruck = async (itemId: string, targetTruckId: string) => {
    const { row, sel, shortage } = buildLoadPayload(itemId);
    if (!row || !sel) return;
    const targetTruck = activeTrucks.find(t => t.id === targetTruckId);
    if (!targetTruck) return;

    try {
      if (row.isMultiPackage) {
        const chosenPkgs = row.remainingPackages.filter(p => selectedPackages[p.id]);
        if (chosenPkgs.length === 0) {
          showToast('⚠️ እባክዎ መጀመሪያ ከታች ካሉት እሽጎች (ኬሻዎች) ለመጫን የፈለጉትን ቼክ ማርክ ያድርጉ!', 'error');
          return;
        }
        const res = await apiPost(`/trucks/${targetTruckId}/load-batch`, {
          source: sel.source, method: sel.method || null,
          items: chosenPkgs.map(p => ({ cargoItemId: row.id, packageId: p.id, weight: p.weight }))
        });
        setSelectedPackages(prev => {
          const copy = { ...prev };
          chosenPkgs.forEach(p => delete copy[p.id]);
          return copy;
        });
        showToast(res.message || `✔️ ${chosenPkgs.length} ኬሻዎች ታርጋ ${targetTruck.plateNumber} ላይ ተጭነዋል!`, 'success');
      } else {
        const shortageW = shortage?.hasShortage ? Number(shortage.shortageWeight) : 0;
        if (shortageW >= row.weight) {
          showToast('⚠️ የቅናሽ ክብደት ከጠቅላላው ክብደት እኩል ወይም መብለጥ አይችልም!', 'error');
          return;
        }
        if (shortage?.hasShortage && !shortage.shortageReason) {
          showToast('⚠️ የቅናሽ ምክንያት ይምረጡ!', 'error');
          return;
        }
        const loadWeight = row.weight - shortageW;
        await apiPost(`/trucks/${targetTruckId}/load`, {
          cargoItemId: row.id, weight: loadWeight, source: sel.source, method: sel.method || null,
          shortage: shortageW > 0 ? { weight: shortageW, quantityText: shortage.shortageItemQty, reason: shortage.shortageReason } : undefined
        });
        showToast(`✔️ እቃው ታርጋ ${targetTruck.plateNumber} ላይ በተሳካ ሁኔታ ተጭኗል!`, 'success');
      }

      setItemSelections(prev => { const c = { ...prev }; delete c[itemId]; return c; });
      setShortageDetails(prev => { const c = { ...prev }; delete c[itemId]; return c; });
      fetchWarehouseItems(warehousePage);
      fetchActiveTrucks();
      if (currentView === 'achievement' && activeTruck) fetchSelectedTruckSummary(activeTruck.id);
    } catch (e) {
      showApiError(e);
    }
  };

  // ---------------- Achievement page ----------------
  const [selectedTruckSummary, setSelectedTruckSummary] = useState<TruckSummary | null>(null);
  const fetchSelectedTruckSummary = useCallback(async (truckId: string) => {
    try {
      const res = await apiGet(`/trucks/${truckId}/summary`);
      setSelectedTruckSummary(res.data);
    } catch (e) { showApiError(e); }
  }, []);

  useEffect(() => {
    if (currentView === 'achievement' && activeTruck) {
      fetchSelectedTruckSummary(activeTruck.id);
    }
  }, [currentView, activeTruck?.id, fetchSelectedTruckSummary]);

  const [confirmModal, setConfirmModal] = useState(false);
  const handleFinalConfirmAndArchive = async () => {
    if (!activeTruck) return;
    try {
      const res = await apiPost(`/trucks/${activeTruck.id}/confirm`);
      showToast(res.message, 'success');
      setConfirmModal(false);
      await fetchActiveTrucks();
      fetchWarehouseItems(warehousePage);
    } catch (e) { showApiError(e); }
  };

  // ---------------- Unload modal ----------------
  const [unloadModal, setUnloadModal] = useState<{ isOpen: boolean; receiptNo?: string; merchantName?: string; items: LoadingDetail[] }>({ isOpen: false, items: [] });

  const openUnloadSelectionModal = (row: LoadedRow) => {
    if (!selectedTruckSummary) return;
    const items = selectedTruckSummary.loadingsDetail.filter(l => row.loadingIds.includes(l.id));
    setUnloadModal({ isOpen: true, receiptNo: row.receiptNo, merchantName: row.merchantName, items });
  };

  const handleUnloadLoading = async (loadingId: string) => {
    try {
      await apiPost(`/loadings/${loadingId}/unload`);
      showToast('↩️ የተመረጠው ዕቃ በተሳካ ሁኔታ ከመኪናው ላይ ወርዶ ወደ መጋዘን ተመልሷል!', 'info');
      setUnloadModal(prev => {
        const remaining = prev.items.filter(i => i.id !== loadingId);
        return remaining.length === 0 ? { isOpen: false, items: [] } : { ...prev, items: remaining };
      });
      fetchWarehouseItems(warehousePage);
      if (activeTruck) fetchSelectedTruckSummary(activeTruck.id);
      if (activeTruck) fetchDashboardStats(activeTruck.id, true);
      fetchActiveTrucks();
    } catch (e) { showApiError(e); }
  };

  // ---------------- Archives page ----------------
  const [archivedTrucks, setArchivedTrucks] = useState<TruckBase[]>([]);
  const [archivesTotal, setArchivesTotal] = useState(0);
  const [archivesTotalPages, setArchivesTotalPages] = useState(1);
  const [archivesPage, setArchivesPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
  const [archiveSummaries, setArchiveSummaries] = useState<{ [id: string]: TruckSummary }>({});
  const [collapsedItemsListIds, setCollapsedItemsListIds] = useState<Set<string>>(new Set());
  const [collapsedPayoutIds, setCollapsedPayoutIds] = useState<Set<string>>(new Set());
const togglePayoutCollapse = (truckId: string) => {
  setCollapsedPayoutIds(prev => {
    const next = new Set(prev);
    if (next.has(truckId)) next.delete(truckId); else next.add(truckId);
    return next;
  });
};
  const toggleItemsListCollapse = (truckId: string) => {
    setCollapsedItemsListIds(prev => {
      const next = new Set(prev);
      if (next.has(truckId)) next.delete(truckId); else next.add(truckId);
      return next;
    });
  };

  const fetchArchivedTrucks = useCallback(async (page: number, search: string) => {
    try {
      const res = await apiGet(`/trucks?status=ARCHIVED&search=${encodeURIComponent(search)}&page=${page}&pageSize=${ARCHIVES_PAGE_SIZE}`);
      setArchivedTrucks(res.data);
      setArchivesTotal(res.total);
      setArchivesTotalPages(res.totalPages);
    } catch (e) { showApiError(e); }
  }, []);

  useEffect(() => { fetchArchivedTrucks(archivesPage, searchQuery); }, [archivesPage, fetchArchivedTrucks]);
  // debounce search a little
  useEffect(() => {
    const t = setTimeout(() => { setArchivesPage(1); fetchArchivedTrucks(1, searchQuery); }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, fetchArchivedTrucks]);

  const toggleExpandArchive = async (truckId: string) => {
    if (expandedArchiveId === truckId) { setExpandedArchiveId(null); return; }
    setExpandedArchiveId(truckId);
    if (!archiveSummaries[truckId]) {
      try {
        const res = await apiGet(`/trucks/${truckId}/summary`);
        setArchiveSummaries(prev => ({ ...prev, [truckId]: res.data }));
      } catch (e) { showApiError(e); }
    }
  };

  const handleArchiveRateChange = async (truckId: string, type: 'gate' | 'truck', value: number) => {
    try {
      const res = await apiPatch(`/trucks/${truckId}/rates`, type === 'gate' ? { gateRate: value } : { truckRate: value });
      const fresh = await apiGet(`/trucks/${truckId}/summary`);
      setArchiveSummaries(prev => ({ ...prev, [truckId]: fresh.data }));
      setArchivedTrucks(prev => prev.map(t => t.id === truckId ? { ...t, ...res.data } : t));
    } catch (e) { showApiError(e); }
  };

  const [archiveNonKgName, setArchiveNonKgName] = useState('');
  const [archiveNonKgQty, setArchiveNonKgQty] = useState('');
  const [archiveNonKgRate, setArchiveNonKgRate] = useState('');

  const addPostArchiveNonKgItem = async (truckId: string) => {
    if (!archiveNonKgName.trim()) { showToast('❌ እባክዎ የእቃውን አይነት ይምረጡ!', 'error'); return; }
    if (!archiveNonKgQty || Number(archiveNonKgQty) <= 0) { showToast('❌ እባክዎ ትክክለኛ ብዛት ያስገቡ!', 'error'); return; }
    if (!archiveNonKgRate || Number(archiveNonKgRate) <= 0) { showToast('❌ እባክዎ ትክክለኛ ተመን ያስገቡ!', 'error'); return; }
    try {
      await apiPost(`/trucks/${truckId}/non-kg-items`, { name: archiveNonKgName, qty: archiveNonKgQty, rate: archiveNonKgRate });
      const fresh = await apiGet(`/trucks/${truckId}/summary`);
      setArchiveSummaries(prev => ({ ...prev, [truckId]: fresh.data }));
      setArchiveNonKgName(''); setArchiveNonKgQty(''); setArchiveNonKgRate('');
      showToast('✔️ ልዩ እቃው ወደ ማህደር ተጨምሮ ክፍያው ተሰልቷል!', 'success');
    } catch (e) { showApiError(e); }
  };

  const deleteNonKgItem = async (truckId: string, itemId: string) => {
  try {
    await apiDelete(`/non-kg-items/${itemId}`);
    const fresh = await apiGet(`/trucks/${truckId}/summary`);
    setArchiveSummaries(prev => ({ ...prev, [truckId]: fresh.data }));
    showToast('🗑️ ልዩ እቃው ተሰርዟል፣ ሂሳቡ ዳግም ተሰልቷል።', 'info');
  } catch (e) { showApiError(e); }
};

  const triggerDoubleVerifyLabor = async (truckId: string) => {
    try {
      const res = await apiPatch(`/trucks/${truckId}/verify`);
      setArchivedTrucks(prev => prev.map(t => t.id === truckId ? { ...t, isVerified: true } : t));
      setArchiveSummaries(prev => prev[truckId] ? { ...prev, [truckId]: { ...prev[truckId], truck: { ...prev[truckId].truck, isVerified: true } } } : prev);
      showToast(res.message, 'success');
    } catch (e) { showApiError(e); }
  };

  return (
    <div style={{ padding: '15px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif', direction: 'ltr', position: 'relative' }}>

      <style>{`
        .vehicle-form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: end; }
        .form-field-group { display: flex; flex-direction: column; gap: 5px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; transition: box-shadow 0.15s ease, border-color 0.15s ease; }
        .form-field-group:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08); }
        .form-field-label { font-size: 11px; color: #64748b; font-weight: 800; display: flex; align-items: center; gap: 5px; text-transform: uppercase; letter-spacing: 0.02em; }
        .form-input-box { padding: 6px 4px; font-size: 14px; border: none; border-radius: 4px; height: 28px; box-sizing: border-box; color: #0f172a; outline: none; background: transparent; width: 100%; font-weight: 700; }
        .form-select-box { padding: 6px 4px; font-size: 14px; border: none; border-radius: 4px; height: 28px; background-color: transparent; font-weight: 800; color: #1e40af; cursor: pointer; box-sizing: border-box; outline: none; width: 100%; }
        .package-check-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; cursor: pointer; border: 1px solid #cbd5e1; background-color: #f8fafc; user-select: none; transition: all 0.15s ease; }
        .package-check-badge.active { background-color: #dbeafe; border-color: #2563eb; color: #1e40af; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .archive-payout-grid { display: grid; grid-template-columns: 1.7fr 1.1fr; gap: 20px; }
        .mobile-only-hint { display: none !important; }
        .board-card { border: 1px solid #cbd5e1; background-color: #fff; border-radius: 10px; padding: 12px 15px; cursor: pointer; transition: all 0.2s ease; position: relative; }
        .board-card.active { border-color: #d97706; background: linear-gradient(135deg, #fffbeb 0%, #fff 100%); box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.15); }
        @media (max-width: 1200px) { .dashboard-grid { grid-template-columns: repeat(2, 1fr); } .archive-payout-grid { grid-template-columns: 1fr; } }
        @media (max-width: 900px) { .vehicle-form-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .mobile-only-hint { display: inline-flex !important; } }
        @media (max-width: 600px) { .vehicle-form-grid { grid-template-columns: 1fr; } .dashboard-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Confirm & Lock modal */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>⚠️ ሁሉንም ጭነቶች ጭነዋል እርግጠኛ ኖት?</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
              የመኪና ታርጋ {activeTruck?.plateNumber} ጭነት ሙሉ በሙሉ ማለቁ ካረጋገጡ በኋላ መረጃው ወደ ተጭነው ያለቁ ማህደር ይዘዋወራል ፣ ይህ ገጽ ደግሞ ለአዲስ መኪና ባዶ ይሆናል።
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setConfirmModal(false)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>ይቅር</button>
              <button onClick={handleFinalConfirmAndArchive} style={{ padding: '8px 18px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>አዎ አረጋግጥ</button>
            </div>
          </div>
        </div>
      )}

      {/* Unload modal */}
      {unloadModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '580px', width: '90%', maxHeight: '80%', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>↩️ ከመኪና ማውረጃ መስኮት (ነጋዴ፦ {unloadModal.merchantName})</h3>
              <button onClick={() => setUnloadModal({ isOpen: false, items: [] })} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>እባክዎ ከመኪናው ላይ ወርዶ ወደ መጋዘን መመለስ ያለበትን እቃ በትክክል መርጠው ይጫኑ፦</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {unloadModal.items.map((item, index) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{index + 1}. {item.description}</span>
                    <span style={{ marginLeft: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{item.weight} ኪ.ግ</span>
                  </div>
                  <button onClick={() => handleUnloadLoading(item.id)} style={{ padding: '6px 14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>↩️ ከመኪና አውርድ</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Multi-truck destination picker */}
      {pendingLoadItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10005 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '440px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>❓ የትኛው መኪና ላይ ልጫን?</h3>
              <button onClick={() => setPendingLoadItem(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>በአሁኑ ሰዓት በአስጫኙ የተመዘገቡ 2 ወይም ከዚያ በላይ ንቁ መኪኖች ስላሉ፣ እባክዎ ይህን እቃ መጫን የሚፈልጉበትን መኪና ይምረጡ፦</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeTrucks.filter(t => t.isSaved && t.plateNumber.trim() !== '').map(truck => (
                <button key={truck.id} onClick={() => { executeLoadItemOnTruck(pendingLoadItem.itemId, truck.id); setPendingLoadItem(null); }}
                  style={{ padding: '12px 15px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🚗 ታርጋ፦ ET {truck.plateNumber} ({truck.truckType})</span>
                  <span style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>👤 {truck.driverName || 'የሹፌር ስም የሌለ'}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setPendingLoadItem(null)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', color: '#475569' }}>ይቅር (አቋርጥ)</button>
            </div>
          </div>
        </div>
      )}

      {editModalItem && (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', zIndex: 10010, padding: '20px' }}>
    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '460px', width: '100%', margin: '20px auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>✏️ የመዝገብ መረጃ አርም ({editModalItem.receiptNo})</h3>
        <button onClick={() => setEditModalItem(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>👤 የነጋዴ ስም</label>
          <input type="text" value={editForm.merchantName} onChange={e => setEditForm(f => ({ ...f, merchantName: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>📞 ስልክ</label>
          <input type="text" value={editForm.merchantPhone} onChange={e => setEditForm(f => ({ ...f, merchantPhone: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>📦 የእቃ መግለጫ</label>
          <input type="text" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>
        {!editModalItem.isMultiPackage && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>⚖️ ኪ.ግ</label>
            <input type="number" value={editForm.weight} onChange={e => setEditForm(f => ({ ...f, weight: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>* እቃው ተጭኖ ከጀመረ ክብደት መቀየር አይቻልም</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
        <button onClick={submitEditItem} style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>💾 UPDATE</button>
        <button onClick={() => setEditModalItem(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ይቅር</button>
      </div>
    </div>
  </div>
)}

      {/* Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 15px auto', backgroundColor: '#0f172a', color: '#fff', padding: '15px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        {/* <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><span>🚚</span> ፕሮፌሽናል የጭነት ሎጂስቲክስና የሂሳብ ማመጣጠኛ ማዕከል</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>የላቀ የአስጫኝ እና የጫኞች የሂሳብ ማጠቃለያ ቁጥጥር ስሪት (ታብሌት 2)</p>
        </div> */}
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 🆕 ሎጎው ሰፋ ብሎ (ያለ ተጨማሪ ሄደር) */}
              <img
                src="/logo11.jpg"
                alt="የድርጅቱ ሎጎ"
                style={{ width: '110px', height: '80px', objectFit: 'fill' }}
              />
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                <span style={{ fontSize: '24px' }}>ሰንሰለት የደረቅ ጭነት አገልግሎት መስጫ<br/></span>
                የአስጫኝ እና የመኪና አስገቢ ማዕከል
              </h1>
            </div>
          </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setCurrentView('loader')} style={{ padding: '8px 16px', backgroundColor: currentView === 'loader' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>የመጋዘን እቃዎች መቆጣጠሪያ ገጽ</button>
          <button onClick={() => setCurrentView('achievement')} style={{ padding: '8px 16px', backgroundColor: currentView === 'achievement' ? '#d97706' : '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>የተጫኑ እቃዎች መቆጣጠሪያ ገጽ</button>
          <button onClick={() => setCurrentView('archives')} style={{ padding: '8px 16px', backgroundColor: currentView === 'archives' ? '#10b981' : '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}> ተጭነው ያለቁ ማስቀመጫ ገጽ ({archivesTotal})</button>
        </div>
      </div>

      {currentView === 'loader' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Section 1: Truck form */}
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -8px rgba(15,23,42,0.12)', marginBottom: '20px', background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 120px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '30px', height: '30px', borderRadius: '9px', backgroundColor: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>📝</span>
                የሚጫን መኪና መመዝገቢያ ፎርም <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: '12px' }}>(በመኪና አስገቢ የሚሞላ)</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* <button onClick={addNewActiveTruck} style={{ padding: '7px 14px', backgroundColor: '#fff', color: '#0284c7', border: '1.5px solid #bae6fd', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>➕ አዲስ የሚጫን መኪና ጨምር</button> */}
                <button onClick={addNewActiveTruck} style={{
                                backgroundColor: '#000000', color: '#ffffff', border: 'none', padding: '12px 20px',
                                borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
                              }}>➕ የሚጫን መኪና መዝግብ</button>

                <span style={{ fontSize: '11px', color: isTruckSaved ? '#16a34a' : '#d97706', fontWeight: 'bold', backgroundColor: isTruckSaved ? '#dcfce7' : '#fffbeb', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: isTruckSaved ? '#16a34a' : '#d97706', display: 'inline-block' }}></span>
                  {isTruckSaved ? '● መረጃው ተመዝግቧል (Active)' : '● አልተመዘገበም - እባክዎ ፎርሙን ሞልተው ሴቭ ያድርጉ'}
                </span>
              </div>
            </div>

            <div className="vehicle-form-grid">
              <div className="form-field-group">
                <label className="form-field-label"><span>🚛</span> የመኪና ታርጋ *</label>
                <input type="text" value={activeTruck?.plateNumber || ''} placeholder="ET 3-A99999" onChange={e => updateActiveTruckField('plateNumber', e.target.value.toUpperCase())} className="form-input-box" />
              </div>
              <div className="form-field-group">
                <label className="form-field-label" style={{ color: '#2563eb' }}><span>🚚</span> የመኪና አይነት *</label>
                <select value={activeTruck?.truckType || ''} onChange={e => updateActiveTruckField('truckType', e.target.value)} className="form-select-box">
                  <option value="">-- ይምረጡ --</option>
                  {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-field-group">
                <label className="form-field-label"><span>👤</span> የሹፌር ስም</label>
                <input type="text" value={activeTruck?.driverName || ''} onChange={e => updateActiveTruckField('driverName', e.target.value)} className="form-input-box" />
              </div>
              <div className="form-field-group">
                <label className="form-field-label"><span>📞</span> የሹፌር ስልክ</label>
                <input type="text" value={activeTruck?.driverPhone || ''} onChange={e => updateActiveTruckField('driverPhone', e.target.value)} className="form-input-box" />
              </div>
              <div className="form-field-group">
                <label className="form-field-label"><span>🧑‍💼</span> የባለሀብት ስም</label>
                <input type="text" value={activeTruck?.ownerName || ''} onChange={e => updateActiveTruckField('ownerName', e.target.value)} className="form-input-box" />
              </div>
              <div className="form-field-group">
                <label className="form-field-label"><span>📞</span> የባለሀብት ስልክ</label>
                <input type="text" value={activeTruck?.ownerPhone || ''} onChange={e => updateActiveTruckField('ownerPhone', e.target.value)} className="form-input-box" />
              </div>
              <div className="form-field-group">
                <label className="form-field-label" style={{ color: '#2563eb' }}><span>👷</span> አስጫኝ ሰራተኛ</label>
                <select value={activeTruck?.loaderStaff || 'ክንፈ'} onChange={e => updateActiveTruckField('loaderStaff', e.target.value)} className="form-select-box">
                  {LOADER_STAFF_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field-group" style={{ backgroundColor: 'transparent', border: 'none', padding: 0, justifyContent: 'center' }}>
                <button onClick={() => saveTruckMasterAtIndex(selectedTruckIndex)} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', height: '52px', boxShadow: '0 6px 14px rgba(37, 99, 235, 0.25)' }}>💾 መረጃ መዝግብ (Save)</button>
              </div>
            </div>
          </div>


          {/* Section 2: Weight Dashboard */}
<div style={{ maxWidth: '1400px', margin: '0 auto 20px auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
    <span style={{ fontSize: '18px' }}>📊</span>
    <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>መጋዘን ያሉን እና የተጫኑ እቃዎች መቆጣጠሪያ ዳሽቦርድ</h4>
  </div>

  <div className="dashboard-grid">
    <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', padding: '15px', borderRadius: '12px', borderLeft: '6px solid #d97706', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '64px', opacity: 0.1 }}>📦</div>
      <div>
        <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📦</span> መጋዘን ያሉን እቃዎች
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', padding: '5px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>ለጠፍ</span>
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '800' }}>{dashboardStats.warehouseLetef} <span style={{ fontSize: '10px', fontWeight: '500' }}>ኪ.ግ</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', padding: '5px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>ደረቅ</span>
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '800' }}>{dashboardStats.warehouseDerek} <span style={{ fontSize: '10px', fontWeight: '500' }}>ኪ.ግ</span></span>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(217, 119, 6, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '600' }}>የመጋዘን ያለን ኩንታል</span>
  <span style={{ backgroundColor: '#d97706', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '900' }}>{dashboardStats.warehouseLetef + dashboardStats.warehouseDerek} ኪ.ግ</span>
</div>
<div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(217, 119, 6, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '800',  }}>አጠቃላይ ያለን ኩንታል </span>
  <span style={{ backgroundColor: '#92400e', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '900' }}>
    {(((dashboardStats.warehouseLetef + dashboardStats.warehouseDerek) + dashboardStats.totalLoadedWeight) / 100).toFixed(2)} ኩ.ል
  </span>
</div>
    </div>

    <div style={{ background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', padding: '15px', borderRadius: '12px', borderLeft: '6px solid #0891b2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '64px', opacity: 0.1 }}>📥</div>
      <div>
        <span style={{ fontSize: '12px', color: '#0e7490', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📥</span> መኪናው ጭኖት የመጣው
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', padding: '5px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>ለጠፍ</span>
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '800' }}>{dashboardStats.truckLetef} <span style={{ fontSize: '10px', fontWeight: '500' }}>ኪ.ግ</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', padding: '5px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>ደረቅ</span>
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '800' }}>{dashboardStats.truckDerek} <span style={{ fontSize: '10px', fontWeight: '500' }}>ኪ.ግ</span></span>
          </div>
        </div>
      </div>
    </div>

    <div style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', padding: '15px', borderRadius: '12px', borderLeft: '6px solid #4f46e5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '64px', opacity: 0.1 }}>👥</div>
      <div>
        <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>👥</span> በውጪ ጫኝ አውራጅ የተጫነ
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', padding: '5px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>ለጠፍ</span>
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '800' }}>{dashboardStats.externalLetef} <span style={{ fontSize: '10px', fontWeight: '500' }}>ኪ.ግ</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', padding: '5px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>ደረቅ</span>
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '800' }}>{dashboardStats.externalDerek} <span style={{ fontSize: '10px', fontWeight: '500' }}>ኪ.ግ</span></span>
          </div>
        </div>
      </div>
    </div>

    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '15px', borderRadius: '12px', borderLeft: '6px solid #10b981', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '64px', opacity: 0.05 }}>🧮</div>
      <div>
        <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🧮</span> ጠቅላላ መኪና ላይ የተጫነ ኩንታል
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: '5px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>ለጠፍ ድምር</span>
            <span style={{ fontSize: '14px', color: '#34d399', fontWeight: '800' }}>{dashboardStats.loadedLetef} <span style={{ fontSize: '10px', fontWeight: '500' }}>ኪ.ግ</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: '5px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>ደረቅ ድምር</span>
            <span style={{ fontSize: '14px', color: '#34d399', fontWeight: '800' }}>{dashboardStats.loadedDerek} <span style={{ fontSize: '10px', fontWeight: '500' }}>ኪ.ግ</span></span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>ጠቅላላ የተጫነ ድምር</span>
        <span style={{ backgroundColor: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '900' }}>{dashboardStats.totalLoadedWeight} ኪ.ግ</span>
      </div>
    </div>
  </div>
</div>

          {/* Section 3: Pending warehouse items */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #0f172a', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: '0', fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>📦 መጋዘን ያሉን ያልተጫኑ እቃዎች</h3>
              <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' }}>⚠️ መጋዘን ያሉ እቃዎች ጠቅላላ ብዛት፦ {warehouseTotal} እቃ</span>
            </div>

            {warehouseLoading ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>⏳ loading...</p>
            ) : warehouseRows.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#16a34a', padding: '30px', fontWeight: 'bold', fontStyle: 'italic', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>🎉 ሁሉም የመጋዘን ዕቃዎች ተጭነው አልቀዋል!</p>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1060px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '32px', textAlign: 'center' }}>ተ.ቁ</th>
                      <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '58px' }}>ቀን</th>
                      <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '58px' }}>ደረሰኝ</th>
                      <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '78px' }}>ስም</th>
                      <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '72px' }}>ስልክ</th>
                      <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '175px' }}>የእቃ ዝርዝር</th>
                    <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '50px' }}>ደረቅ ኪ.ግ</th>
<th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '50px' }}>ለጠፍ ኪ.ግ</th>
<th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '65px' }}>ምድብ</th>
<th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '120px' }}> ማን ጫነው</th>
<th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '80px' }}> የአጫጫን ስልት</th>
<th style={{ padding: '10px 6px', border: '1px solid #1e293b', textAlign: 'center', width: '110px' }}>ድርጊት</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseRows.map((item, idxOnPage) => {
                      const rowIndex = (warehousePage - 1) * WAREHOUSE_PAGE_SIZE + idxOnPage;
                      const sel = itemSelections[item.id] || { source: '', method: '' };
                      const shortage = shortageDetails[item.id] || { hasShortage: false, shortageWeight: 0, shortageReason: '', shortageItemQty: '' };

                      return (
                        <React.Fragment key={item.id}>
                          <tr style={{ backgroundColor: rowIndex % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '11px' }}>{rowIndex + 1}</td>
                            <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '10px', wordBreak: 'break-word' }}>{item.dateIn}</td>
                            <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e3a8a', fontSize: '10px', wordBreak: 'break-word' }}>{item.receiptNo}</td>
                            <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b', fontSize: '11px', wordBreak: 'break-word' }}>👤 {item.merchantName}</td>
                            <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '10.5px', wordBreak: 'break-word' }}>{item.merchantPhone}</td>
                       
<td style={{ padding: '8px 8px', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '13px', lineHeight: '1.4' }}>
  📦 {item.description}
  {item.isMultiPackage && <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '10px' }}>Multi-Pack</span>}
  {(item.intakeLoaderType === 'የውጭ ጫኝ ያወረደው' || item.intakeLoaderType === 'የመጋዘን ልጆች የጫኑት') && (
    <div style={{ marginTop: '4px', fontSize: '9.5px', color: '#0369a1', fontWeight: 'bold' }}>
      🚛 {item.intakeLoaderType}{item.intakeCarPlate ? ` — ታርጋ፦ ET ${item.intakeCarPlate}` : ''}
    </div>
  )}
  {item.shortageReason && (
    <div style={{ marginTop: '4px', fontSize: '9.5px', color: '#b45309', fontWeight: 'bold' }}>
      ⚠️ ምክንያት፦ {item.shortageReason}
    </div>
  )}
</td>
                         <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
  {item.category === 'ደረቅ' ? (
    <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}>{item.weight}</span>
  ) : (
    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>-</span>
  )}
</td>
<td style={{ padding: '10px 4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
  {item.category === 'ለጠፍ' ? (
    <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e40af' }}>{item.weight}</span>
  ) : (
    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>-</span>
  )}
</td>
<td style={{ padding: '10px 4px', border: '1px solid #e2e8f0' }}>
  <select value={item.category} onChange={e => handleCategoryChange(item.id, e.target.value as 'ለጠፍ' | 'ደረቅ')} style={{ padding: '5px 4px', fontWeight: 'bold', fontSize: '11px', border: '1px solid #0f172a', borderRadius: '4px', backgroundColor: item.category === 'ለጠፍ' ? '#dbeafe' : '#f3f4f6', color: item.category === 'ለጠፍ' ? '#1e40af' : '#1f2937', cursor: 'pointer', width: '100%' }}>
    <option value="ደረቅ">ደረቅ</option>
    <option value="ለጠፍ">ለጠፍ</option>
  </select>
</td>
                            <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0' }}>
                              <select value={sel.source} onChange={e => handleSourceChange(item.id, e.target.value)} style={{ padding: '5px 3px', width: '100%', fontSize: '10.5px', border: sel.source ? '1px solid #cbd5e1' : '2px solid #ef4444', borderRadius: '4px', backgroundColor: sel.source ? '#fff' : '#fef2f2', fontWeight: sel.source ? 'bold' : 'normal', cursor: 'pointer' }}>
                                <option value="">-- ይምረጡ * --</option>
                                <option value="የመጋዘን ጫኝ አውራጅ">የመጋዘን ጫኝ አውራጅ</option>
                                <option value="ከውጭ ጫኞች">ቀጥታ የተጫነ</option>
                                <option value="መኪናው ጭኖት የመጣ">መኪናው ጭኖት የመጣው</option>
                              </select>
                            </td>
                            <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0' }}>
                              {sel.source === 'የመጋዘን ጫኝ አውራጅ' ? (
                                <select value={sel.method} onChange={e => handleMethodChange(item.id, e.target.value)} style={{ padding: '5px 3px', width: '100%', fontSize: '10px', border: sel.method ? '1px solid #cbd5e1' : '2px solid #ef4444', borderRadius: '4px', backgroundColor: '#fff', fontWeight: sel.method ? 'bold' : 'normal' }}>
                                  <option value="">-- ስልት * --</option>
                                  <option value="ከመጋዘን">ከመጋዘን </option>
                                  <option value="ከመኪና">ከመኪና </option>
                                </select>
                              ) : (
                                <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '10.5px', paddingLeft: '4px' }}>{sel.method || '---'}</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <button type="button" onClick={() => handleLoadItemWithTruckRouting(item.id)} style={{ width: '100%', padding: '6px 4px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>✔️ ጫን</button>
    <button type="button" onClick={() => openEditModal(item)} style={{ width: '100%', padding: '4px 3px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', fontSize: '9.5px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ EDIT</button>
    {!item.isMultiPackage && (
      <button type="button" onClick={() => toggleShortageForm(item.id)} style={{ width: '100%', padding: '4px 3px', backgroundColor: shortage.hasShortage ? '#fee2e2' : '#f1f5f9', color: shortage.hasShortage ? '#b91c1c' : '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '9.5px', fontWeight: 'bold', cursor: 'pointer' }}>
        {shortage.hasShortage ? '⚠️ ሪፖርት አጥፋ' : '⚠️ ቅነሳ ሪፖርት'}
      </button>
    )}
  </div>
</td>
                          </tr>

                          {shortage.hasShortage && !item.isMultiPackage && (
                            <tr>
                              {/* <td colSpan={11} style={{ backgroundColor: '#fffbeb', padding: '15px 20px', border: '2px solid #fde68a', borderRadius: '8px' }}> */}
                               <td colSpan={12} style={{ backgroundColor: '#fffbeb', padding: '15px 20px', border: '2px solid #fde68a', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 'bold', color: '#b45309', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><span>⚠️</span> የጉዳት ወይም የቅናሽ ሪፖርት መሙያ፦</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1.5', minWidth: '220px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>የተቀነሰው የእቃ አይነት እና ብዛት፦</span>
                                    <input type="text" placeholder="ምሳሌ፦ 2 ኬሻ ወይም 3 ጠረጴዛ" value={shortage.shortageItemQty || ''} onChange={e => handleShortageFieldChange(item.id, 'shortageItemQty', e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', height: '36px', boxSizing: 'border-box' }} />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ክብደት (ኪ.ግ)፦</span>
                                    <input type="number" placeholder="ኪ.ግ" value={shortage.shortageWeight || ''} onChange={e => handleShortageFieldChange(item.id, 'shortageWeight', Number(e.target.value))} style={{ width: '80px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', height: '36px', boxSizing: 'border-box' }} />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1.2', minWidth: '220px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ምክንያት፦</span>
                                    <select value={shortage.shortageReason} onChange={e => handleShortageFieldChange(item.id, 'shortageReason', e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', height: '36px', backgroundColor: '#fff', boxSizing: 'border-box' }}>
                                      <option value="">-- ምክንያት ያስገቡ * --</option>
                                      <option value="መኪናው ስላልያዘው (ቦታ እጥረት)">የመኪናው ኩንታል ስለሞላ</option>
                                      <option value="በመጫን ላይ የተሰበረ/የተበላሸ">ቦታ አልመች ብሎ የተመለሰ</option>
                                      <option value="እቃው ተሰብሮ/ፈስሶ የቀረ (ኪሳራ)">እቃው ተሰብሮ/ተብላሽቶ/ፈሶ የቀረ እቃ</option>
                                      <option value="በመጫን ላይ የተሰበረ/የተበላሸ">እቃው በመጫን ላይ የተሰበረ/የተበላሸ</option>
                                      <option value="ሌላ ምክንያት">ሌላ ምክንያት</option>
                                    </select>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {item.isMultiPackage && item.remainingPackages.length > 0 && (
                            <tr>
                              {/* <td colSpan={11} style={{ padding: '8px 20px', backgroundColor: '#f0f9ff', border: '1px solid #cbd5e1' }}> */}
                                <td colSpan={12} style={{ padding: '8px 20px', backgroundColor: '#f0f9ff', border: '1px solid #cbd5e1' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a8a' }}>📦 የእያንዳንዱ እቃዎች ኪ.ግ ፦</span>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                                    {item.remainingPackages.map(p => {
                                      const isChecked = !!selectedPackages[p.id];
                                      return (
                                        <div key={p.id} onClick={() => handlePackageCheckToggle(p.id)} className={`package-check-badge ${isChecked ? 'active' : ''}`} style={{ backgroundColor: isChecked ? '#dbeafe' : '#fff', padding: '3px 8px', fontSize: '10px' }}>
                                          <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ pointerEvents: 'none', width: '11px', height: '11px' }} />
                                          <span>• ኬሻ #{p.packageNo} ({p.weight} ኪ.ግ)</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {warehouseTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
                <button type="button" onClick={() => setWarehousePage(p => Math.max(1, p - 1))} disabled={warehousePage === 1} style={{ padding: '8px 16px', backgroundColor: warehousePage === 1 ? '#e2e8f0' : '#0f172a', color: warehousePage === 1 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: warehousePage === 1 ? 'not-allowed' : 'pointer' }}>⬅️ ቀዳሚ (Previous)</button>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ገጽ {warehousePage} / {warehouseTotalPages}</span>
                <button type="button" onClick={() => setWarehousePage(p => Math.min(warehouseTotalPages, p + 1))} disabled={warehousePage === warehouseTotalPages} style={{ padding: '8px 16px', backgroundColor: warehousePage === warehouseTotalPages ? '#e2e8f0' : '#0f172a', color: warehousePage === warehouseTotalPages ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: warehousePage === warehouseTotalPages ? 'not-allowed' : 'pointer' }}>ቀጣይ (Next) ➡️</button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === 'achievement' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '15px 20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
              ባሁን ሰአት እየተጫነ ያለ የተመዘገቡ መኪናዎች
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {activeTrucks.map((truck, idx) => (
                <div key={truck.id} onClick={() => setSelectedTruckIndex(idx)} className={`board-card ${idx === selectedTruckIndex ? 'active' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>አስጫኝ፦ <strong style={{ color: '#0f172a' }}>{truck.loaderStaff || '---'}</strong></span>
                    {activeTrucks.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removeActiveTruck(idx); }} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px' }}>&times;</button>
                    )}
                  </div>
                  <div style={{ margin: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#1e3a8a' }}>{truck.plateNumber ? `ET ${truck.plateNumber}` : '🚨 ታርጋ አልተሞላም'}</span>
                    {truck.truckType && <span style={{ fontSize: '9px', backgroundColor: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{truck.truckType}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#475569' }}>
                    <span>👤 ሹፌር፦ <strong>{truck.driverName || '---'}</strong></span>
                    <span style={{ color: '#16a34a', fontWeight: '800' }}>{truck.loadedWeight || 0} ኪ.ግ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', border: '3px solid #1e293b', borderRadius: '12px' }}>
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>📄 ተመዝግበው እየተጫኑ ያሉ እቃዎች</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#475569' }}>
  መኪና ታርጋ ቁጥር፦ <strong>{activeTruck?.plateNumber || '---'}</strong> &nbsp;|&nbsp; የመኪና አይነት፦ <strong style={{ color: '#2563eb' }}>{activeTruck?.truckType || '---'}</strong> &nbsp;|&nbsp; ሹፌር፦ <strong>{activeTruck?.driverName || '---'}</strong> &nbsp;|&nbsp; አስጫኝ፦ <strong style={{ color: '#d97706' }}>{activeTruck?.loaderStaff || '---'}</strong>
</p>
              </div>
              <div style={{ maxHeight: '385px', overflowY: 'auto', overflowX: 'auto', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '850px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '40px', textAlign: 'center' }}>ተ.ቁ</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '140px' }}>የነጋዴ ስም</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '95px' }}>ስልክ</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1' }}>የእቃዎች ዝርዝር</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'right' }}>ደረቅ ኪ.ግ</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'right' }}>ለጠፍ ኪ.ግ</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '100px', textAlign: 'center' }}>ድርጊት</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedTruckSummary || selectedTruckSummary.loadedRows.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>በዚህ የመኪና ({activeTruck?.plateNumber || '---'}) ታርጋ ላይ የተጫነ ዕቃ የለም።</td></tr>
                    ) : (
                      selectedTruckSummary.loadedRows.map((row, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                          <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center' }}>{index + 1}</td>
                          <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e293b' }}>👤 {row.merchantName}</td>
                          <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#475569' }}>{row.merchantPhone || '-'}</td>
                          <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#334155', wordBreak: 'break-word' }}>{row.itemsText.map((txt, i) => <div key={i} style={{ padding: '2px 0' }}>• {txt}</div>)}</td>
                          <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{row.dryWeight > 0 ? `${row.dryWeight} ኪ.ግ` : '-'}</td>
                          <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>{row.letefWeight > 0 ? `${row.letefWeight} ኪ.ግ` : '-'}</td>
                          <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                            <button type="button" onClick={() => openUnloadSelectionModal(row)} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>↩️ አውርድ/መልስ</button>
                          </td>
                        </tr>
                      ))
                    )}
                    {selectedTruckSummary && selectedTruckSummary.loadedRows.length > 0 && (
                      <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
                        <td colSpan={4} style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>🧮 አጠቃላይ የተጫነ ድምር (Grand Total)፦</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#166534', fontSize: '14px' }}>{selectedTruckSummary.totalDry} ኪ.ግ</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#1e40af', fontSize: '14px' }}>{selectedTruckSummary.totalLetef} ኪ.ግ</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', backgroundColor: '#cbd5e1' }}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setConfirmModal(true)} disabled={!selectedTruckSummary || selectedTruckSummary.loadedRows.length === 0}
                style={{ width: '100%', padding: '12px', backgroundColor: (!selectedTruckSummary || selectedTruckSummary.loadedRows.length === 0) ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', fontWeight: 'bold', cursor: (!selectedTruckSummary || selectedTruckSummary.loadedRows.length === 0) ? 'not-allowed' : 'pointer', borderRadius: '8px', fontSize: '14px' }}>
                🎉 ጭነቱ ሙሉ በሙሉ ተጭኖ አልቋል (Confirm & Lock Loading)
              </button>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', border: '2px solid #bfdbfe', borderRadius: '12px' }}>
              <div style={{ borderBottom: '2px solid #bfdbfe', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0', fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a' }}> 📄 የአጫጫን ስራ አፈጻጸም መመልከቻ ዳሽቦርድ (አስጫኝ ሰራተኛ፦ {activeTruck?.loaderStaff || '---'})</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px' }}><span>👷</span> የመጋዘን ጫኝ አውራጆች </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span>• ከመጋዘን የጫኑት፦</span>
                      <span><strong>{selectedTruckSummary?.labor.gateWeight || 0} ኪ.ግ</strong> </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span>• ከመኪና የጫኑት፦</span>
                      <span><strong>{selectedTruckSummary?.labor.truckWeight || 0} ኪ.ግ</strong> </span>
                    </div>
                  

                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
  <span> ጠቅላላ የተጫነ ኩንታል ድምር፦</span>
  <span style={{ fontSize: '15px', color: '#16a34a', fontWeight: '900' }}>
    {(selectedTruckSummary?.labor.gateWeight || 0) + (selectedTruckSummary?.labor.truckWeight || 0)} ኪ.ግ
  </span>
</div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                     <span style={{ fontWeight: 'bold', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px' }}><span>👥</span> ከውጭ ቀጥታ የተጫነ </span>
                  <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                    • ጠቅላላ ከውጭ ቀጥታ የተጫነ ኩንታል፦ <strong>{selectedTruckSummary?.labor.externalWeight || 0} ኪ.ግ</strong>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>* ከውጭ ቀጥታ ተሸካሚዎች ለጫኑት ክፍያ አይኖረውም።</p>
                  </div>
                 
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px' }}><span>📥</span> መኪናው ጭኖት የመጣው</span>
                  <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                    • ጠቅላላ መኪናው ጭኖት የመጣው ኩንታል፦ <strong>{selectedTruckSummary?.labor.transitWeight || 0} ኪ.ግ</strong>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>* መኪናው ጭኖት የመጣውን ሂሳብ ስራ ላይ ለመኪናው ይሰላል።</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'archives' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>🗄️ ተጭነው ያለቁ መኪናዎች ማስቀመጫ ማህደር</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>የተጠናቀቁ ጭነቶች እና ክፍያ ማስቀመጫ ማህደር</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 12px', width: '100%', maxWidth: '320px' }}>
              <span style={{ marginRight: '8px', fontSize: '14px', color: '#64748b' }}>🔍</span>
             <input type="text" placeholder="ፈልግ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#1e293b' }} />  
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}>&times;</button>}
            </div>
          </div>

          {archivedTrucks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>🗄️</span>
              <p style={{ fontWeight: 'bold', fontSize: '16px' }}>ተጭኖ ያለቀ መኪና አልተገኘም።</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {archivedTrucks.map(truck => {
                const isExpanded = expandedArchiveId === truck.id;
                const summary = archiveSummaries[truck.id];

                return (
                  <div key={truck.id} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                    <div onClick={() => toggleExpandArchive(truck.id)} style={{ backgroundColor: '#1e293b', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
  <span style={{ fontWeight: '900', fontSize: '13px', color: '#38bdf8' }}>
    📅 {truck.completionDate ? getEthiopianDate(new Date(truck.completionDate)) : '-'}
  </span>
  <span style={{ fontSize: '9.5px', color: '#64748b' }}>
    {truck.completionDate ? new Date(truck.completionDate).toLocaleString() : ''}
  </span>
</div>
    <span>🚗</span> ታርጋ፦ ET {truck.plateNumber} {truck.truckType && <span style={{ backgroundColor: '#2563eb', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>{truck.truckType}</span>}


<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>🧑 ሹፌር፦ {truck.driverName || '-'}</span>
  <span style={{ fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}></span>
    {/* <span>🚗</span> ታርጋ፦ ET {truck.plateNumber} {truck.truckType && <span style={{ backgroundColor: '#2563eb', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>{truck.truckType}</span>} */}
  {/* </span> */}
  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>📞 {truck.driverPhone || '-'}</span>
</div>

<span style={{ fontSize: '12px', color: '#94a3b8' }}>👤 አስጫኝ፦ <strong>{truck.loaderStaff}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', backgroundColor: truck.isVerified ? '#10b981' : '#d97706', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{truck.isVerified ? '✔ ክፍያው ተረጋግጧል' : '⏳ ክፍያው አልተረጋገጠም'}</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}>{isExpanded ? '🔼' : '🔽'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      !summary ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>⏳ loading...</div>
                      ) : (
                        <div className="archive-payout-grid" style={{ padding: '20px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
                          <div style={{ minWidth: 0 }}>
                            <div onClick={() => toggleItemsListCollapse(truck.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><span>📄</span> የተጫኑ ዕቃዎች ዝርዝር ማህደር</h4>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>{collapsedItemsListIds.has(truck.id) ? '🔽 ክፈት' : '🔼 ዝጋ'}</span>
                            </div>
                            {!collapsedItemsListIds.has(truck.id) && (
                              <>
                                <div style={{ maxHeight: '350px', overflowY: 'auto', overflowX: 'auto', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '680px', tableLayout: 'fixed' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#0f172a', color: '#fff', textAlign: 'left' }}>
                                        <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '40px', textAlign: 'center' }}>ተ.ቁ</th>
                                        <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '130px' }}>የነጋዴ ስም</th>
                                        <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '95px' }}>ስልክ</th>
                                        <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>የእቃዎች ዝርዝር</th>
                                        <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'right' }}>ደረቅ ኪ.ግ</th>
                                        <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'right' }}>ለጠፍ ኪ.ግ</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {summary.loadedRows.map((row, index) => (
                                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center' }}>{index + 1}</td>
                                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e293b' }}>👤 {row.merchantName}</td>
                                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#475569' }}>{row.merchantPhone}</td>
                                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#334155', wordBreak: 'break-word' }}>{row.itemsText.map((t, i) => <div key={i} style={{ padding: '2px 0' }}>• {t}</div>)}</td>
                                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{row.dryWeight > 0 ? `${row.dryWeight} ኪ.ግ` : '-'}</td>
                                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>{row.letefWeight > 0 ? `${row.letefWeight} ኪ.ግ` : '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div style={{ marginTop: '10px', backgroundColor: '#e2e8f0', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>🧮 ጠቅላላ የተጫነ ክብደት ድምር (ደረቅ + ለጠፍ)፦
                                    <span style={{ fontSize: '11px', color: '#475569', marginLeft: '8px', fontWeight: 'normal' }}>(ደረቅ፦ {summary.totalDry} ኪ.ግ | ለጠፍ፦ {summary.totalLetef} ኪ.ግ)</span>
                                  </span>
                                  <span style={{ fontSize: '13px', backgroundColor: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontWeight: '900' }}>{summary.grandTotal} ኪ.ግ</span>
                                </div>
                              </>
                            )}
                          </div>
                          <div style={{ paddingLeft: '20px', borderLeft: '1px dashed #cbd5e1' }}>
                            <div onClick={() => togglePayoutCollapse(truck.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
    <h4 style={{ margin: 0, fontSize: '13px', color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><span>💸</span> የመጋዘን ጫኝ አውራጆች የክፍያ ማረጋገጫ ማህደር</h4>
    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>{collapsedPayoutIds.has(truck.id) ? '🔽 ክፈት' : '🔼 ዝጋ'}</span>
  </div>
  {!collapsedPayoutIds.has(truck.id) && (
  <>
                            <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                              <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#0f172a' }}>👤 የጫኝ አውራጆች ክፍያ ማስያ ፦</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• ከመጋዘን የጫኑት፦</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span><strong>{summary.labor.gateWeight} ኪ.ግ</strong> × </span>
                                    <input type="number" step="0.01" disabled={truck.isVerified} value={truck.gateRate} onChange={(e) => handleArchiveRateChange(truck.id, 'gate', Number(e.target.value))} style={{ width: '55px', padding: '2px 4px', fontSize: '12px', border: '1px solid #2563eb', borderRadius: '4px', textAlign: 'center', backgroundColor: '#eff6ff', fontWeight: 'bold' }} />
                                    <span>= <strong>{summary.labor.gateCost.toFixed(2)} ብር</strong></span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• ከመኪና የጫኑት፦</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span><strong>{summary.labor.truckWeight} ኪ.ግ</strong> × </span>
                                    <input type="number" step="0.01" disabled={truck.isVerified} value={truck.truckRate} onChange={(e) => handleArchiveRateChange(truck.id, 'truck', Number(e.target.value))} style={{ width: '55px', padding: '2px 4px', fontSize: '12px', border: '1px solid #2563eb', borderRadius: '4px', textAlign: 'center', backgroundColor: '#eff6ff', fontWeight: 'bold' }} />
                                    <span>= <strong>{summary.labor.truckCost.toFixed(2)} ብር</strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '6px', border: '1px solid #fde68a', marginTop: '10px', fontSize: '12px' }}>
                              <span style={{ fontWeight: 'bold', color: '#92400e', display: 'block', marginBottom: '4px' }}>📦 ከኩንታል ውጭ የተጫኑ እቃዎች መመዝገቢያ ፦</span>
                              {(!summary.nonKgItems || summary.nonKgItems.length === 0) ? (
                                <div style={{ fontStyle: 'italic', color: '#78350f', fontSize: '11px' }}>የተመዘገበ እቃ የለም።</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {summary.nonKgItems.map((ni, i) => (
  <div key={ni.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#78350f', fontSize: '11px' }}>
    <span>• {ni.name} ({ni.qty} × {ni.rate} ብር)</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <strong>{ni.cost.toFixed(2)} ብር</strong>
      {!truck.isVerified && ni.id && (
        <button onClick={() => deleteNonKgItem(truck.id, ni.id!)} title="ይህን  እቃ አጥፋ" style={{ border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', width: '18px', height: '18px', lineHeight: '18px', padding: 0 }}>×</button>
      )}
    </div>
  </div>
))}
                                </div>
                              )}
                            </div>

                            {!truck.isVerified && (
                              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                                <span style={{ fontWeight: 'bold', color: '#166534', display: 'block', marginBottom: '6px', fontSize: '11px' }}>➕ ከኩንታል ውጪ ተጨማሪ እቃ መዝግብ </span>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                              <select value={archiveNonKgName} onChange={e => setArchiveNonKgName(e.target.value)} style={{ flex: '0.9', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', minWidth: '80px' }}>
  <option value="">-- ምረጥ --</option>
  {NON_KG_ITEM_PRESETS.map((p, i) => <option key={i} value={p}>{p}</option>)}
</select>
<input type="number" placeholder="ብዛት" value={archiveNonKgQty} onChange={e => setArchiveNonKgQty(e.target.value)} style={{ width: '65px', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
<input type="number" placeholder="ብር" value={archiveNonKgRate} onChange={e => setArchiveNonKgRate(e.target.value)} style={{ width: '65px', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <button onClick={() => addPostArchiveNonKgItem(truck.id)} style={{ width: '100%', padding: '6px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>💾 ወደ መመዝገቢያ ጨምር</button>
                              </div>
                            )}

                            <div style={{ fontSize: '11px', marginTop: '10px', color: '#475569' }}>
                              <div>• ከውጭ ቀጥታ የተጫነው፦ <strong>{summary.labor.externalWeight} ኪ.ግ</strong></div>
                              <div>• መኪናው ጭኖት የመጣው ፦ <strong>{summary.labor.transitWeight} ኪ.ግ</strong></div>
                            </div>

                            <div style={{ marginTop: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>ጠቅላላ የጫኝ አውራጅ ሰራተኛ ክፍያ ድምር፦</span>
                            <span style={{ fontSize: '16px', fontWeight: '900', color: '#16a34a' }}>{summary.labor.totalPayout.toFixed(2)} ብር</span>
                            </div>
                            <button onClick={() => triggerDoubleVerifyLabor(truck.id)} disabled={truck.isVerified}
                              style={{ width: '100%', marginTop: '12px', padding: '10px', backgroundColor: truck.isVerified ? '#10b981' : '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: truck.isVerified ? 'not-allowed' : 'pointer' }}>
                              {truck.isVerified ? '✔ የሰራተኛ ሂሳብ ክፍያ ተረጋግጦ ተቆልፏል' : '🔒 የሰራተኛን ሂሳብ ክፍያ አረጋግጫለው ( አስጫኝ የሚያረጋግጠው )'}
                          </button>
                          </>
                          )}
                        </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {archivesTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '18px' }}>
              <button type="button" onClick={() => setArchivesPage(p => Math.max(1, p - 1))} disabled={archivesPage === 1} style={{ padding: '8px 16px', backgroundColor: archivesPage === 1 ? '#e2e8f0' : '#0f172a', color: archivesPage === 1 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: archivesPage === 1 ? 'not-allowed' : 'pointer' }}>⬅️ ቀዳሚ (Previous)</button>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ገጽ {archivesPage} / {archivesTotalPages}</span>
              <button type="button" onClick={() => setArchivesPage(p => Math.min(archivesTotalPages, p + 1))} disabled={archivesPage === archivesTotalPages} style={{ padding: '8px 16px', backgroundColor: archivesPage === archivesTotalPages ? '#e2e8f0' : '#0f172a', color: archivesPage === archivesTotalPages ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: archivesPage === archivesTotalPages ? 'not-allowed' : 'pointer' }}>ቀጣይ (Next) ➡️</button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#2563eb', color: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 99999, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{toast.type === 'success' ? '✔️' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}




