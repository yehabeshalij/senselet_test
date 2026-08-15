import React, { useState, useMemo, useEffect } from 'react';
import { FREIGHT_API_BASE as API_BASE, CONTACTS_API_URL, apiFetch as apiFetchWithKey } from '../config/api';



const CONTACTS_JSON_PATH = CONTACTS_API_URL;




const PAGE_SIZE = 15; // 🆕 በገጽ የሚታይ ብዛት (ንቁ ጭነቶች / ታሪክ ማህደር / ሃሳብ-ችግር ሁሉም)

// የመለኪያ አማራጮች
const UNIT_OPTIONS = ['ፍሬ', 'እሽግ', 'ሊትር', 'ኬሻ', 'ሌላ'] as const;
export type UnitType = (typeof UNIT_OPTIONS)[number];

// የትራንስፖርት/የማጓጓዣ አይነቶች
export type TransportType =
  | 'ተደውሏል'
  | 'ሰው ተልኳል'
  | 'ሃይሉክስ የድርጅቱ ተልኳል'
  | 'ሃይሉክስ ከውጭ ተልኳል'
  | 'ኦባማ ተልኳል'
  | 'አይሱዙ ተልኳል'
  | 'ኤፍ ኤስ አር ተልኳል'
  | 'ካሶኒ ተልኳል'
  | 'ተሳቢ ተልኳል';

export interface CargoItem {
  id: string;
  name: string;
  unitCount: number;
  unit?: UnitType | string;
  weightPerUnitKg?: number;
  isWeightUnknown?: boolean;
}

export interface FreightOrder {
  id: string;
  orderNo: string;
  date: string;
  ethDate?: string;
  time: string;
  createdAt?: string;
  updatedAt?: string;   // 🆕 ደረጃ 2 - ለማህደር ቅደም ተከተል
  archivedAt?: string;  // 🆕 ደረጃ 2 - ወደ ማህደር የገባበት ሰዓት

  merchantName: string;
  merchantPhone: string;

  items: CargoItem[];
  totalQuintals: number | 'ያልታወቀ';

  pickupLocations: {
    location: string;
    shipperName?: string;
    shipperPhone?: string;
  }[];
  destination: string;

  transportType?: TransportType;
  driverName?: string;
  driverPhone?: string;
  truckPlateNo?: string;
  truckCapacityQuintal?: number;

  partialLoadingIssue?: string;
  needsWarehousePickup?: boolean;

  // 🆕 ደረጃ 1 - status አሁን ማንኛውንም ጽሁፍ (custom) መያዝ ይችላል
  status: string;
  notes?: string;

  previousStatus?: string;
  isVoided?: boolean;
  voidReason?: string;
}

// 🆕 ሃሳብ/ችግር መዝገብ ሞዴል
export interface FeedbackEntry {
  id: string;
  name: string;
  phone?: string;
  message: string;
  status: 'ክፍት' | 'ለሃላፊ ተልኳል' | 'ተፈትቷል';
  staffNote?: string;
  ownerNote?: string;
  createdAt?: string;
}

// 🆕 ደረጃ 4/6 - ቀላል የኮንታክት ሞዴል
interface ContactRecord {
  name: string;
  phone: string;
}

const getCorrectEthiopianDate = (date = new Date()) => {
  const gregYear = date.getFullYear();
  const gregMonth = date.getMonth() + 1;
  const gregDay = date.getDate();

  const gregStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const ethMonths = [
    'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
    'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
  ];

  const isLeapYear = (gregYear % 4 === 3);
  const newYearDay = isLeapYear ? 12 : 11;

  let ethYear = gregYear - 8;
  let ethMonth = 0;
  let ethDay = 0;

  const dateNum = new Date(gregYear, gregMonth - 1, gregDay).getTime();
  const newYearDate = new Date(gregYear, 8, newYearDay).getTime();

  if (dateNum >= newYearDate) {
    ethYear = gregYear - 7;
    const diffDays = Math.floor((dateNum - newYearDate) / (1000 * 60 * 60 * 24));
    ethMonth = Math.floor(diffDays / 30) + 1;
    ethDay = (diffDays % 30) + 1;
  } else {
    const prevNewYearDate = new Date(gregYear - 1, 8, (gregYear - 1 % 4 === 3) ? 12 : 11).getTime();
    const diffDays = Math.floor((dateNum - prevNewYearDate) / (1000 * 60 * 60 * 24));
    ethMonth = Math.floor(diffDays / 30) + 1;
    ethDay = (diffDays % 30) + 1;
  }

  const ethStr = `${ethMonths[ethMonth - 1]} ${ethDay}, ${ethYear}`;

  return {
    ethStr,
    fullFormat: `${ethStr} (${gregStr})`
  };
};

function mapApiOrder(o: any): FreightOrder {
  const rawDate = o.ethDate || o.date || '';

  return {
    id: o.id || o._id,
    orderNo: o.orderNo,
    date: rawDate,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt ?? undefined,       // 🆕
    archivedAt: o.archivedAt ?? undefined,     // 🆕
    time: o.time || '',
    merchantName: o.merchantName,
    merchantPhone: o.merchantPhone,
    items: (o.items || []).map((it: any) => ({
      id: it.id,
      name: it.name,
      unitCount: it.unitCount,
      unit: it.unit ?? 'ፍሬ',
      weightPerUnitKg: it.weightPerUnitKg ?? undefined,
      isWeightUnknown: it.isWeightUnknown ?? false,
    })),
    totalQuintals: o.totalQuintalsUnknown ? 'ያልታወቀ' : Number(o.totalQuintals ?? 0),
    pickupLocations: (o.pickupLocations || []).map((l: any) => ({
      location: l.location,
      shipperName: l.shipperName ?? undefined,
      shipperPhone: l.shipperPhone ?? undefined,
    })),
    destination: o.destination,
    transportType: o.transportType ?? undefined,
    driverName: o.driverName ?? undefined,
    driverPhone: o.driverPhone ?? undefined,
    truckPlateNo: o.truckPlateNo ?? undefined,
    truckCapacityQuintal: o.truckCapacityQuintal ?? undefined,
    partialLoadingIssue: o.partialLoadingIssue ?? undefined,
    needsWarehousePickup: o.needsWarehousePickup ?? false,
    status: o.status,
    notes: o.notes ?? undefined,
    previousStatus: o.previousStatus ?? undefined,
    isVoided: o.isVoided ?? false,
    voidReason: o.voidReason ?? undefined,
  };
}

// 🆕 mapApiFeedback
function mapApiFeedback(f: any): FeedbackEntry {
  return {
    id: f.id,
    name: f.name,
    phone: f.phone ?? undefined,
    message: f.message,
    status: f.status,
    staffNote: f.staffNote ?? undefined,
    ownerNote: f.ownerNote ?? undefined,
    createdAt: f.createdAt,
  };
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'ጥያቄው አልተሳካም');

  return data;
}

// =====================================================================
// 🆕 ደረጃ 4 እና 6 — ቀላል የኮንታክት መምረጫ ሞዳል (ከ /contacts.json ያነባል)
// =====================================================================
function ContactPickerModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (name: string, phone: string) => void;
}) {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // fetch(CONTACTS_JSON_PATH)
    apiFetchWithKey(CONTACTS_JSON_PATH)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((raw: any[]) => {
        const parsed: ContactRecord[] = (raw || [])
          .map((r) => {
            const name = (r['Display Name'] || `${r['First Name'] || ''} ${r['Last Name'] || ''}`).trim();
            const phone = String(r['Mobile Phone'] || r['Home Phone'] || r['Business Phone'] || '').trim();
            return { name, phone };
          })
          .filter(c => c.phone && /\d{6,}/.test(c.phone));
        setContacts(parsed);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts.slice(0, 150);
    return contacts.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term)).slice(0, 150);
  }, [contacts, search]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>📖 ኮንታክት ይምረጡ</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
        </div>

        <div style={{ padding: '12px 20px 8px 20px' }}>
          <input
            autoFocus
            type="text"
            placeholder="🔍 በስም ወይም በስልክ ቁጥር ይፈልጉ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        <div style={{ overflowY: 'auto', padding: '4px 12px 16px 12px', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>⏳ ስምና ስልክ በመጫን ላይ...</div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>
              ⚠️ ኮንታክት ፋይሉን ማንበብ አልተቻለም። ({CONTACTS_JSON_PATH})<br />
              <span style={{ color: '#64748b', fontWeight: '600' }}>እባክዎ በእጅ ያስገቡ።</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>ምንም ኮንታክት አልተገኘም። እባክዎ በእጅ ያስገቡ።</div>
          ) : (
            filtered.map((c, idx) => (
              <div
                key={idx}
                onClick={() => onSelect(c.name, c.phone)}
                style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f8fafc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || 'ስም የለም'}</span>
                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', whiteSpace: 'nowrap' }}>{c.phone}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function FreightDispatchHub() {
  const [orders, setOrders] = useState<FreightOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archive' | 'feedback'>('active'); // 🆕 'feedback' ታክሏል
  const [searchTerm, setSearchTerm] = useState('');

  // 🆕 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [assignDriverModalOrder, setAssignDriverModalOrder] = useState<FreightOrder | null>(null);
  const [updateStatusModalOrder, setUpdateStatusModalOrder] = useState<FreightOrder | null>(null);
  const [voidModalOrder, setVoidModalOrder] = useState<FreightOrder | null>(null);

  // 🆕 Feedback state
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [isNewFeedbackModalOpen, setIsNewFeedbackModalOpen] = useState(false);
  const [respondModalEntry, setRespondModalEntry] = useState<FeedbackEntry | null>(null);
  const [fbName, setFbName] = useState('');
  const [fbPhone, setFbPhone] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [responseNoteInput, setResponseNoteInput] = useState('');
  const [responderName, setResponderName] = useState(''); // 🆕 ደረጃ 3 - የፈታው ሰው ስም

  // 🆕 ደረጃ 4/6 - የኮንታክት መምረጫ መክፈቻ/መዝጊያ
  const [showDriverContactPicker, setShowDriverContactPicker] = useState(false);
  const [showFeedbackContactPicker, setShowFeedbackContactPicker] = useState(false);

  const [merchantName, setMerchantName] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [manualQuintals, setManualQuintals] = useState<string>('');
  const [destination, setDestination] = useState('መካነ ሰላም');
  const [notes, setNotes] = useState('');
  const [voidReasonInput, setVoidReasonInput] = useState('');

  const [items, setItems] = useState<CargoItem[]>([
    // 🆕 ደረጃ 7 - ነባሪ ቁጥሮች (100/35) ጠፍተዋል፤ placeholder ብቻ ይታያል
    { id: '1', name: '', unitCount: 0, unit: 'ፍሬ', weightPerUnitKg: undefined, isWeightUnknown: false },
  ]);

  const [locations, setLocations] = useState<{ location: string; shipperName: string; shipperPhone: string }[]>([
    { location: '', shipperName: '', shipperPhone: '' },
  ]);

  const [driverData, setDriverData] = useState<{
    transportType: TransportType;
    driverName: string;
    driverPhone: string;
    truckPlateNo: string;
    truckCapacityQuintal: string;
  }>({
    transportType: 'ኤፍ ኤስ አር ተልኳል',
    driverName: '',
    driverPhone: '',
    truckPlateNo: '',
    truckCapacityQuintal: '',
  });

  // 🆕 ደረጃ 1 - custom status ጽሁፍ ማስቀመጫ
  const CUSTOM_STATUS_VALUE = '__custom__';
  const [customStatusText, setCustomStatusText] = useState('');

  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '' as string,
    partialLoadingIssue: '',
    needsWarehousePickup: false,
    notes: '',
  });

  const autoComputedTotal = useMemo(() => {
    let total = 0;
    items.forEach((it) => {
      if (!it.isWeightUnknown && it.weightPerUnitKg) {
        total += (Number(it.unitCount) || 0) * (Number(it.weightPerUnitKg) || 0) / 100;
      }
    });
    return total;
  }, [items]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/orders');
      setOrders(data.map(mapApiOrder));
    } catch (err: any) {
      alert(`⚠️ ዳታ ማምጣት አልተቻለም: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 loadFeedback
  const loadFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const data = await apiFetch('/feedback');
      setFeedbackEntries(data.map(mapApiFeedback));
    } catch (err: any) {
      alert(`⚠️ ሃሳብ እና ችግር ዝርዝር ማምጣት አልተቻለም: ${err.message}`);
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadFeedback();
  }, []);

  // 🆕 tab ወይም search ሲቀየር ገጽ ወደ 1 ይመለስ
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const handleAddItem = () => {
    setItems([...items, { id: String(Date.now()), name: '', unitCount: 0, unit: 'ፍሬ', isWeightUnknown: false }]);
  };

  const handleAddLocation = () => {
    setLocations([...locations, { location: '', shipperName: '', shipperPhone: '' }]);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName || items[0].name === '') {
      alert('⚠️ እባክዎን የነጋዴውን ስም እና የእቃውን አይነት ያስገቡ!');
      return;
    }

    setSaving(true);
    try {
      const newOrder = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          merchantName,
          merchantPhone,
          items,
          manualQuintals,
          pickupLocations: locations,
          destination,
          notes,
        }),
      });

      setOrders((prev) => [mapApiOrder(newOrder), ...prev]);
      setIsNewOrderModalOpen(false);

      setMerchantName('');
      setMerchantPhone('');
      setNotes('');
      setManualQuintals('');
      setItems([{ id: '1', name: '', unitCount: 0, unit: 'ፍሬ', weightPerUnitKg: undefined, isWeightUnknown: false }]);
      setLocations([{ location: '', shipperName: '', shipperPhone: '' }]);
    } catch (err: any) {
      alert(`⚠️ ኦርደር መመዝገብ አልተቻለም: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDriverModalOrder) return;

    setSaving(true);
    try {
      const updated = await apiFetch(`/orders/${assignDriverModalOrder.id}/assign-driver`, {
        method: 'PATCH',
        body: JSON.stringify(driverData),
      });
      setOrders((prev) => prev.map((ord) => (ord.id === updated.id ? mapApiOrder(updated) : ord)));
      setAssignDriverModalOrder(null);
    } catch (err: any) {
      alert(`⚠️ ሹፌር መመደብ አልተቻለም: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDriver = async (orderId: string) => {
    if (!window.confirm('⚠️ ሹፌሩ/ተሸካሚው ቀርቷል ብለው መመዝገብ ይፈልጋሉ?')) return;
    try {
      const updated = await apiFetch(`/orders/${orderId}/cancel-driver`, { method: 'PATCH' });
      setOrders((prev) => prev.map((ord) => (ord.id === updated.id ? mapApiOrder(updated) : ord)));
    } catch (err: any) {
      alert(`⚠️ ማዘመን አልተቻለም: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateStatusModalOrder) return;

    // 🆕 ደረጃ 1 - custom ሁኔታ ከሆነ የተጻፈውን ጽሁፍ እንደ ሁኔታ እንልካለን
    const finalStatus =
      statusUpdateData.status === CUSTOM_STATUS_VALUE
        ? (customStatusText.trim() || 'ሌላ ሁኔታ')
        : statusUpdateData.status;

    if (statusUpdateData.status === CUSTOM_STATUS_VALUE && !customStatusText.trim()) {
      alert('⚠️ እባክዎ ሁኔታውን በጽሁፍ ይግለጹ!');
      return;
    }

    setSaving(true);
    try {
      const updated = await apiFetch(`/orders/${updateStatusModalOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ ...statusUpdateData, status: finalStatus }),
      });
      setOrders((prev) => prev.map((ord) => (ord.id === updated.id ? mapApiOrder(updated) : ord)));
      setUpdateStatusModalOrder(null);
      setCustomStatusText('');
    } catch (err: any) {
      alert(`⚠️ ሁኔታ ማዘመን አልተቻለም: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveOrder = async (order: FreightOrder) => {
    if (!window.confirm('🏛️ ይህን ጭነት ወደ ታሪክ ማህደር ማዛወር ይፈልጋሉ?')) return;
    try {
      const updated = await apiFetch(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ታሪክ ማህደር', previousStatus: order.status }),
      });
      const mapped = mapApiOrder(updated);
      // 🆕 ደረጃ 2 - archivedAt ከሰርቨሩ ካልመጣ አሁን በተጫነበት ሰዓት እናስቀምጣለን
      if (!mapped.archivedAt) {
        mapped.archivedAt = mapped.updatedAt || new Date().toISOString();
      }
      setOrders((prev) => prev.map((ord) => (ord.id === mapped.id ? mapped : ord)));
    } catch (err: any) {
      alert(`⚠️ ወደ ማህደር ማዛወር አልተቻለም: ${err.message}`);
    }
  };

  const submitVoidOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidModalOrder) return;
    if (!voidReasonInput.trim()) {
      alert('⚠️ የመጥፋት ምክንያት ያስፈልጋል');
      return;
    }
    setSaving(true);
    try {
      const updated = await apiFetch(`/orders/${voidModalOrder.id}/void`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: voidReasonInput.trim() }),
      });
      const mapped = mapApiOrder(updated);
      // 🆕 ደረጃ 5 - isVoided ስለተደረገ archivedAt እዚሁ እናስቀምጣለን (ደረጃ 2 ቅደም ተከተል እንዲሰራ)
      if (!mapped.archivedAt) {
        mapped.archivedAt = mapped.updatedAt || new Date().toISOString();
      }
      setOrders((prev) => prev.map((ord) => (ord.id === mapped.id ? mapped : ord)));
      setVoidModalOrder(null);
      setVoidReasonInput('');
    } catch (err: any) {
      alert(`⚠️ ማጥፋት አልተቻለም: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreOrder = async (order: FreightOrder) => {
    if (!window.confirm('🔄 ይህን ጭነት ወደ ንቁ ጭነቶች መመለስ ይፈልጋሉ?')) return;
    try {
      const updated = await apiFetch(`/orders/${order.id}/restore`, { method: 'PATCH' });
      setOrders((prev) => prev.map((ord) => (ord.id === updated.id ? mapApiOrder(updated) : ord)));
    } catch (err: any) {
      alert(`⚠️ መመለስ አልተቻለም: ${err.message}`);
    }
  };

  // 🆕 ሃሳብ/ችግር መመዝገቢያ
  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName.trim() || !fbMessage.trim()) {
      alert('⚠️ ስም እና የሃሳብ እና ችግር ይዘት ያስፈልጋሉ');
      return;
    }
    setSaving(true);
    try {
      const newEntry = await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ name: fbName.trim(), phone: fbPhone.trim(), message: fbMessage.trim() }),
      });
      setFeedbackEntries((prev) => [mapApiFeedback(newEntry), ...prev]);
      setIsNewFeedbackModalOpen(false);
      setFbName('');
      setFbPhone('');
      setFbMessage('');
    } catch (err: any) {
      alert(`⚠️ መመዝገብ አልተቻለም: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 🆕 ምላሽ/ውሳኔ መስጫ — ካስፈለገ ወደ ሃላፊ ይላካል፣ ወይም ችግሩ ይፈታል
  const submitFeedbackResponse = async (action: 'escalate' | 'resolve') => {
    if (!respondModalEntry) return;
    setSaving(true);
    try {
      const path = action === 'escalate' ? 'escalate' : 'resolve';
      const resolvedBy = respondModalEntry.status === 'ለሃላፊ ተልኳል' ? 'owner' : 'staff';
      // 🆕 ደረጃ 3 - የመለሰው/የፈታው ሰው ስም ወደ ማስታወሻው ውስጥ እናስገባለን
      const composedNote = responderName.trim()
        ? `👤 ${responderName.trim()}፦ ${responseNoteInput.trim()}`
        : responseNoteInput.trim();

      const updated = await apiFetch(`/feedback/${respondModalEntry.id}/${path}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: composedNote, resolvedBy }),
      });
      setFeedbackEntries((prev) => prev.map((f) => (f.id === updated.id ? mapApiFeedback(updated) : f)));
      setRespondModalEntry(null);
      setResponseNoteInput('');
      setResponderName('');
    } catch (err: any) {
      alert(`⚠️ ምላሽ መስጠት አልተቻለም: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === 'feedback') return [];
    let list = orders.filter((ord) => {
      const matchesTab = activeTab === 'archive' ? ord.status === 'ታሪክ ማህደር' : ord.status !== 'ታሪክ ማህደር';
      const matchesSearch =
        ord.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.transportType && ord.transportType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ord.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ord.pickupLocations.some(
          (l) =>
            l.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.shipperName && l.shipperName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      return matchesTab && matchesSearch;
    });

    // 🆕 ደረጃ 2 - በማህደር ውስጥ በኦርደር ቁጥር ሳይሆን ባለቀ/በገባበት ሰዓት (የቅርብ ጊዜው ከላይ)
    if (activeTab === 'archive') {
      list = [...list].sort((a, b) => {
        const ta = new Date(a.archivedAt || a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.archivedAt || b.updatedAt || b.createdAt || 0).getTime();
        return tb - ta;
      });
    }

    return list;
  }, [orders, activeTab, searchTerm]);

  // 🆕 pagination slices
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const feedbackTotalPages = Math.max(1, Math.ceil(feedbackEntries.length / PAGE_SIZE));
  const paginatedFeedback = feedbackEntries.slice((feedbackPage - 1) * PAGE_SIZE, feedbackPage * PAGE_SIZE);

  const getTransportTag = (type?: TransportType) => {
    if (!type) return null;
    switch (type) {
      case 'ተደውሏል':
        return { bg: '#f1f5f9', text: '#475569', icon: '📞' };
      case 'ሰው ተልኳል':
        return { bg: '#fef3c7', text: '#d97706', icon: '🏃‍♂️' };
      case 'ሃይሉክስ የድርጅቱ ተልኳል':
        return { bg: '#e0e7ff', text: '#4338ca', icon: '🛻' };
      case 'ሃይሉክስ ከውጭ ተልኳል':
        return { bg: '#ffedd5', text: '#c2410c', icon: '⚡' };
      case 'ኦባማ ተልኳል':
        return { bg: '#e0f2fe', text: '#0369a1', icon: '🚚' };
      case 'አይሱዙ ተልኳል':
        return { bg: '#dbeafe', text: '#1d4ed8', icon: '🚚' };
      case 'ኤፍ ኤስ አር ተልኳል':
        return { bg: '#dcfce7', text: '#15803d', icon: '🚛' };
      case 'ካሶኒ ተልኳል':
        return { bg: '#d1fae5', text: '#047857', icon: '🚛' };
      case 'ተሳቢ ተልኳል':
        return { bg: '#fce7f3', text: '#be185d', icon: '🚛' };
      default:
        return { bg: '#f1f5f9', text: '#475569', icon: '🚚' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'መኪና አልተገኘም':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: '⚠️ አልተመደበም/አልተነገረም' };
      case 'መኪና/ሰው የተመደበለት':
        return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd', label: '🚛 የተመደበ/የተደወለ' };
      case 'በመጫን ላይ':
        return { bg: '#fefae0', text: '#b45309', border: '#fef08a', label: '🔄 በመጫን ላይ ነው/እየጫነ ነው' };
      case 'ወደ ሚጫንበት እየሄደ ነው':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: '🚚 መኪናው ወደ ሚጫንበት እየሄደ ነው' };
      case 'ሰዓት ይዞት መንገድ ላይ ነው':
        return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: '⏱️ ሰዓት ይዞት መንገድ ላይ ነው' };
      case 'ተጭኖ ወደ መርካቶ መጋዘን እየሄደ ነው':
        return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: '🏬 ወደ መርካቶ መጋዘን እየሄደ ነው' };
      case 'የተጫነ/በመንገድ ላይ':
        return { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: '📦 ተጭኖ ወደ መካነሰላም በመጓዝ ላይ' };
      case 'መካነ ሰላም ገብቷል':
        return { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff', label: '🏁 መካነ ሰላም ገብቷል' };
      case 'እያራገፈ ነው':
        return { bg: '#fefce8', text: '#a16207', border: '#fef08a', label: '📤 እያራገፈ ነው' };
      case 'አራግፎ ጨርሷል':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff', label: '✅ አራግፎ ጨርሷል' };
      case 'ሹፌሩ ቀርቷል':
        return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1', label: '❌ ሹፌሩ/ተሸካሚ ቀርቷል' };
      case 'ታሪክ ማህደር':
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: '✅ ሂደቱ ተጠናቋል' };
      default:
        // 🆕 ደረጃ 1 - custom ጽሁፍ ሁኔታዎችም እዚህ በራሱ በጽሁፉ ይታያሉ
        return { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe', label: `📝 ${status}` };
    }
  };

  // 🆕 ሃሳብ/ችግር status badge
  const getFeedbackBadge = (status: FeedbackEntry['status']) => {
    switch (status) {
      case 'ክፍት':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: '🆕 ክፍት' };
      case 'ለሃላፊ ተልኳል':
        return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: '📤 ለሃላፊ ተልኳል' };
      case 'ተፈትቷል':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: '✅ ተፈትቷል' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: String(status) };
    }
  };

  // 🆕 Pagination controls (Prev/Next) — ተመሳሳይ ለ3ቱም ገጾች ጥቅም ላይ ይውላል
  const PaginationBar = ({
    page,
    totalPages: tp,
    onPrev,
    onNext,
  }: {
    page: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
  }) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px' }}>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        style={{
          padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: page <= 1 ? '#f8fafc' : '#ffffff',
          color: page <= 1 ? '#cbd5e1' : '#0f172a', fontSize: '11px', fontWeight: '800', cursor: page <= 1 ? 'default' : 'pointer'
        }}
      >
        ⬅️ ቀዳሚ
      </button>
      <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>ገጽ {page} ከ {tp}</span>
      <button
        onClick={onNext}
        disabled={page >= tp}
        style={{
          padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: page >= tp ? '#f8fafc' : '#ffffff',
          color: page >= tp ? '#cbd5e1' : '#0f172a', fontSize: '11px', fontWeight: '800', cursor: page >= tp ? 'default' : 'pointer'
        }}
      >
        ቀጣይ ➡️
      </button>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px 16px', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>

        <div style={{
          backgroundColor: '#0f172a', borderRadius: '16px', padding: '24px', color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)', marginBottom: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* 🆕 ሎጎው ሰፋ ብሎ (ያለ ተጨማሪ ሄደር) */}
              <img
                src="/logo11.jpg"
                alt="የድርጅቱ ሎጎ"
                style={{ width: '110px', height: '80px', objectFit: 'fill' }}
              />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                <span style={{ fontSize: '28px' }}>ሰንሰለት የደረቅ ጭነት አገልግሎት መስጫ<br/></span>
                ጭነት መከታተያ እና መመዝገቢያ
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* 🆕 አዲስ ሃሳብ/ችግር በተን — ከ "አዲስ የጭነት ጥያቄ" ግራ በኩል */}
            <button
              onClick={() => setIsNewFeedbackModalOpen(true)}
              style={{
                backgroundColor: '#7c3aed', color: '#ffffff', border: 'none', padding: '12px 20px',
                borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
              }}
            >
              💬 ሃሳብ እና ችግር መመዝገቢያ
            </button>

            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              style={{
                backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '12px 20px',
                borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
              }}
            >
              ➕ የጭነት መመዝገቢያ እና መከታተያ
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                backgroundColor: activeTab === 'active' ? '#ffffff' : 'transparent',
                color: activeTab === 'active' ? '#0f172a' : '#64748b'
              }}
            >
              🔥 የተመዘገቡ ጭነቶች ({orders.filter(o => o.status !== 'ታሪክ ማህደር').length})
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              style={{
                border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                backgroundColor: activeTab === 'archive' ? '#ffffff' : 'transparent',
                color: activeTab === 'archive' ? '#0f172a' : '#64748b'
              }}
            >
              🏛️ የታሪክ ማህደር ({orders.filter(o => o.status === 'ታሪክ ማህደር').length})
            </button>
            {/* 🆕 3ኛ ታብ — ሃሳብ/ችግር */}
            <button
              onClick={() => setActiveTab('feedback')}
              style={{
                border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                backgroundColor: activeTab === 'feedback' ? '#ffffff' : 'transparent',
                color: activeTab === 'feedback' ? '#0f172a' : '#64748b'
              }}
            >
              💬 የሚፈቱ አስተያየቶች ({feedbackEntries.length})
            </button>
          </div>

          {activeTab !== 'feedback' && (
            <input
              type="text"
              placeholder="🔍 Search ፈልግ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '340px', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '12px', fontWeight: '600', outline: 'none' }}
            />
          )}
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

          {activeTab === 'feedback' ? (
            // ============================= 🆕 FEEDBACK TABLE =============================
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800' }}>
                      <th style={{ padding: '14px' }}>ቀን</th>
                      <th style={{ padding: '14px' }}>ስም / ስልክ</th>
                      <th style={{ padding: '14px' }}>የሃሳብ/ችግር ይዘት</th>
                      <th style={{ padding: '14px' }}>ማስታወሻ/ውሳኔ</th>
                      <th style={{ padding: '14px', textAlign: 'center' }}>ሁኔታ</th>
                      <th style={{ padding: '14px', textAlign: 'center' }}>ተግባራት</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackLoading ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '600' }}>⏳ Laoding....</td>
                      </tr>
                    ) : paginatedFeedback.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '600' }}>ምንም የተመዘገበ ሃሳብ/ችግር የለም።</td>
                      </tr>
                    ) : (
                      paginatedFeedback.map((f, idx) => {
                        const fbBadge = getFeedbackBadge(f.status);
                        const fDate = f.createdAt ? new Date(f.createdAt) : new Date();
                        const fConverted = getCorrectEthiopianDate(fDate);
                        return (
                          <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td style={{ padding: '14px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: '800' }}>{fConverted.ethStr}</div>
                              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                                {fDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>{f.name}</div>
                              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700', marginTop: '2px' }}>📞 {f.phone || 'ስልክ አልተመዘገበም'}</div>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top', maxWidth: '280px' }}>
                              <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '600', lineHeight: '1.5' }}>{f.message}</div>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top', maxWidth: '220px' }}>
                              {f.staffNote && (
                                <div style={{ marginBottom: '6px', padding: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '10px', color: '#1d4ed8', fontWeight: '700' }}>
                                  {/* 👤 ሰራተኛ፦ {f.staffNote} */}
                                   {f.staffNote}
                                </div>
                              )}
                              {f.ownerNote && (
                                <div style={{ padding: '6px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px', fontSize: '10px', color: '#7c3aed', fontWeight: '700' }}>
                                  👔 ሃላፊ፦ {f.ownerNote}
                                </div>
                              )}
                              {!f.staffNote && !f.ownerNote && <span style={{ fontSize: '10px', color: '#94a3b8' }}>—</span>}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <span style={{
                                padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                                backgroundColor: fbBadge.bg, color: fbBadge.text, border: `1px solid ${fbBadge.border}`,
                                display: 'inline-block', whiteSpace: 'nowrap'
                              }}>
                                {fbBadge.label}
                              </span>
                            </td>
                            <td style={{ padding: '14px', textAlign: 'center', verticalAlign: 'middle' }}>
                              {f.status !== 'ተፈትቷል' ? (
                                <button
                                  onClick={() => { setRespondModalEntry(f); setResponseNoteInput(''); setResponderName(''); }}
                                  style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '110px' }}
                                >
                                  💬 ምላሽ ስጥ
                                </button>
                              ) : (
                                <span style={{ fontSize: '10px', color: '#047857', fontWeight: '800' }}>✅ ተጠናቋል</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {!feedbackLoading && feedbackEntries.length > 0 && (
                <PaginationBar
                  page={feedbackPage}
                  totalPages={feedbackTotalPages}
                  onPrev={() => setFeedbackPage((p) => Math.max(1, p - 1))}
                  onNext={() => setFeedbackPage((p) => Math.min(feedbackTotalPages, p + 1))}
                />
              )}
            </>
          ) : (
            // ============================= ORDERS TABLE (ንቁ ጭነቶች / ታሪክ ማህደር) =============================
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800' }}>
                      <th style={{ padding: '14px' }}>ደረሰኝ / ቀን</th>
                      <th style={{ padding: '14px' }}>የነጋዴ መረጃ</th>
                      <th style={{ padding: '14px' }}>የእቃው አይነት እና መጠን (ኩንታል)</th>
                      <th style={{ padding: '14px' }}>የመጫኛ ቦታ(ዎች) እና የአስጫኝ መረጃ</th>
                      <th style={{ padding: '14px' }}>የተመደበ ሹፌር/ሰው</th>
                      <th style={{ padding: '14px', textAlign: 'center' }}>ሁኔታ (Status)</th>
                      <th style={{ padding: '14px', textAlign: 'center' }}>ተግባራት</th>
                      <th style={{ padding: '14px', textAlign: 'center' }}>ማህደር / ስረዛ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '600' }}>
                          ⏳ Loading....
                        </td>
                      </tr>
                    ) : paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '600' }}>
                          ምንም የተመዘገበ የጭነት መረጃ አልተገኘም።
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((ord, idx) => {
                        // 🆕 ደረጃ 5 - በሌላ የቀረ/የተጫነ ኦርደር በማህደር ውስጥ ቀይ ምልክት ይደረግበታል
                        const badge = ord.isVoided
                          ? { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', label: '🗑️ ተሰርዟል / በሌላ ተጭኗል' }
                          : getStatusBadge(ord.status);
                        const tTag = getTransportTag(ord.transportType);
                        const regDateObj = ord.createdAt ? new Date(ord.createdAt) : new Date();
                        const converted = getCorrectEthiopianDate(regDateObj);
                        const rowBg = ord.isVoided ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');

                        return (
                          <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: rowBg }}>

                            <td style={{ padding: '14px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: '900', color: '#2563eb', fontSize: '13px' }}>{ord.orderNo}</div>

                              <div style={{ marginTop: '2px' }}>
                                <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: '800' }}>
                                  {converted.ethStr}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginLeft: '16px' }}>
                                  {regDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              </div>

                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>🕒 {ord.time}</div>

                              {/* 🆕 ደረጃ 2 - በማህደር ውስጥ የተዘጋበት/የገባበት ሰዓት ማሳያ */}
                              {activeTab === 'archive' && ord.archivedAt && (
                                <div style={{ fontSize: '9.5px', color: '#7c3aed', fontWeight: '800', marginTop: '4px', backgroundColor: '#faf5ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                  🏛️ ወደ ማህደር የገባ፦ {new Date(ord.archivedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '14px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>{ord.merchantName}</div>
                              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700', marginTop: '2px' }}>📞 {ord.merchantPhone || 'ስልክ አልተመዘገበም'}</div>
                            </td>

                            <td style={{ padding: '14px', verticalAlign: 'top' }}>
                              {ord.items.map((it, i) => (
                                <div key={i} style={{ marginBottom: '6px' }}>
                                  <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '12px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                    📦 {it.name}
                                  </span>
                                  <span style={{ fontWeight: '800', color: '#2563eb', marginLeft: '6px' }}>
                                    ({it.unitCount} {it.unit || 'ፍሬ'})
                                  </span>
                                  {it.isWeightUnknown ? (
                                    <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '800', marginLeft: '4px' }}>
                                      ( ኪሎ አልተጠቀሰም)
                                    </span>
                                  ) : (
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                                       የአንዱ፡ {it.weightPerUnitKg} ኪ.ግ
                                    </div>
                                  )}
                                </div>
                              ))}

                              <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: '900', color: '#d97706', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                                 ጠቅላላ፡ {typeof ord.totalQuintals === 'number' ? `${ord.totalQuintals} ኩንታል` : 'ያልታወቀ'}
                              </div>

                              {ord.partialLoadingIssue && (
                                <div style={{ marginTop: '6px', padding: '6px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '10px', color: '#dc2626', fontWeight: '800' }}>
                                  ⚠️ ማስታወሻ፦ {ord.partialLoadingIssue}
                                </div>
                              )}

                              {ord.notes && (
                                <div style={{ marginTop: '6px', padding: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '10px', color: '#1d4ed8', fontWeight: '700' }}>
                                  📝 ማስታወሻ፦ {ord.notes}
                                </div>
                              )}

                              {ord.isVoided && ord.voidReason && (
                                <div style={{ marginTop: '6px', padding: '6px', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '6px', fontSize: '10px', color: '#be185d', fontWeight: '800' }}>
                                  🗑️የስረዛ ምክንያት፦ {ord.voidReason}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '14px', verticalAlign: 'top' }}>
                              {ord.pickupLocations.map((loc, i) => (
                                <div key={i} style={{ marginBottom: '8px', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontWeight: '800', color: '#15803d', fontSize: '12px' }}>
                                    📍 ቦታ {i + 1}፦ {loc.location || 'አልተጠቀሰም'}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: '700', marginTop: '2px' }}>
                                    👤 አስጫኝ፦ {loc.shipperName || 'ያልተመዘገበ'}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '700' }}>
                                    📞 ስልክ፦ {loc.shipperPhone || 'ያልተመዘገበ'}
                                  </div>
                                </div>
                              ))}
                              <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', marginTop: '4px' }}>🏁 መድረሻ፦ {ord.destination}</div>
                            </td>

                            <td style={{ padding: '14px', verticalAlign: 'top' }}>
                              {ord.driverName ? (
                                <>
                                  {tTag && (
                                    <div style={{ marginBottom: '6px' }}>
                                      <span style={{
                                        backgroundColor: tTag.bg, color: tTag.text, padding: '3px 8px', borderRadius: '6px',
                                        fontWeight: '800', fontSize: '10px', display: 'inline-block'
                                      }}>
                                        {tTag.icon} {ord.transportType}
                                      </span>
                                    </div>
                                  )}
                                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12px' }}>👤 {ord.driverName}</div>
                                  <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700' }}>📞 {ord.driverPhone}</div>
                                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#475569', marginTop: '2px' }}>🚗 ታርጋ፦ {ord.truckPlateNo}</div>
                                  {ord.truckCapacityQuintal ? (
                                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                                      ⚖️ አቅም፦ {ord.truckCapacityQuintal} ኩንታል
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '800' }}>⚠️ አልተመደበም/አልተነገረም</span>
                              )}
                            </td>

                            <td style={{ padding: '14px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <span style={{
                                padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                                backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}`,
                                display: 'inline-block', whiteSpace: 'nowrap'
                              }}>
                                {badge.label}
                              </span>
                            </td>

                            <td style={{ padding: '14px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>

                                {(!ord.driverName || ord.status === 'ሹፌሩ ቀርቷል') && ord.status !== 'ታሪክ ማህደር' && (
                                  <button
                                    onClick={() => {
                                      setAssignDriverModalOrder(ord);
                                      setDriverData({
                                        transportType: 'ኤፍ ኤስ አር ተልኳል',
                                        driverName: '',
                                        driverPhone: '',
                                        truckPlateNo: '',
                                        truckCapacityQuintal: ''
                                      });
                                    }}
                                    style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '120px' }}
                                  >
                                     ሹፌር/ሰው መድብ
                                  </button>
                                )}

                                {ord.driverName && ord.status !== 'ታሪክ ማህደር' && (
                                  <button
                                    onClick={() => {
                                      setUpdateStatusModalOrder(ord);
                                      setStatusUpdateData({
                                        status: ord.status,
                                        partialLoadingIssue: ord.partialLoadingIssue || '',
                                        needsWarehousePickup: ord.needsWarehousePickup || false,
                                        notes: ''
                                      });
                                      setCustomStatusText('');
                                    }}
                                    style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '120px' }}
                                  >
                                    🔄 ሁኔታውን ቀይር
                                  </button>
                                )}
                              </div>
                            </td>

                            <td style={{ padding: '14px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>

                                {ord.status !== 'ታሪክ ማህደር' ? (
                                  <>
                                    <button
                                      onClick={() => handleArchiveOrder(ord)}
                                      style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '120px' }}
                                    >
                                      🏛️ ወደ ማህደር
                                    </button>

                                    {ord.driverName && (
                                      <button
                                        onClick={() => handleCancelDriver(ord.id)}
                                        style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '120px' }}
                                      >
                                        ❌ ቀርቷል / ሰርዝ
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setVoidModalOrder(ord);
                                        setVoidReasonInput('');
                                      }}
                                      style={{ backgroundColor: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '120px' }}
                                    >
                                      🗑️ አጥፋ
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleRestoreOrder(ord)}
                                    style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', width: '120px' }}
                                  >
                                    🔄 ወደ ተመዘገቡ ጭነቶች መልስ
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {!loading && filteredOrders.length > 0 && (
                <PaginationBar
                  page={currentPage}
                  totalPages={totalPages}
                  onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
              )}
            </>
          )}
        </div>

      </div>

      {isNewOrderModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>📝 የጭነት መመዝገቢያ መሙያ ፎርም</h3>
              <button onClick={() => setIsNewOrderModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>የነጋዴው ስም *</label>
                  <input
                    type="text"
                    required
                    value={merchantName}
                    onChange={e => setMerchantName(e.target.value)}
                    placeholder="ለምሳሌ፡ አቶ አለሙ"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>የነጋዴው ስልክ *</label>
                  <input
                    type="tel"
                    required
                    value={merchantPhone}
                    onChange={e => setMerchantPhone(e.target.value)}
                    placeholder="09..."
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>📦 የእቃ(ዎች) ዝርዝር</label>
                  <button type="button" onClick={handleAddItem} style={{ backgroundColor: '#e2e8f0', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>➕ ተጨማሪ እቃ ጨምር</button>
                </div>

                {items.map((it, idx) => (
                  <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input type="text" required placeholder="የእቃ አይነት (ጁስ ፣ MDF ፣ ኮምፖርሳቶ...)" value={it.name} onChange={e => {
                      const newItems = [...items]; newItems[idx].name = e.target.value; setItems(newItems);
                    }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} />

                    {/* 🆕 ደረጃ 7 - placeholder "ብዛት" ብቻ፣ ነባሪ ቁጥር የለም */}
                    <input type="number" required placeholder="ብዛት" value={it.unitCount || ''} onChange={e => {
                      const newItems = [...items]; newItems[idx].unitCount = Number(e.target.value); setItems(newItems);
                    }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} />

                    <select
                      value={it.unit || 'ፍሬ'}
                      onChange={e => {
                        const newItems = [...items]; newItems[idx].unit = e.target.value; setItems(newItems);
                      }}
                      style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>

                    {/* 🆕 ደረጃ 7 - placeholder "ኪ.ግ" ብቻ፣ ነባሪ ቁጥር የለም */}
                    <input type="number" disabled={it.isWeightUnknown} placeholder="ኪ.ግ" value={it.weightPerUnitKg || ''} onChange={e => {
                      const newItems = [...items]; newItems[idx].weightPerUnitKg = Number(e.target.value); setItems(newItems);
                    }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', backgroundColor: it.isWeightUnknown ? '#e2e8f0' : '#fff' }} />

                    <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', cursor: 'pointer' }}>
                      <input type="checkbox" checked={it.isWeightUnknown || false} onChange={e => {
                        const newItems = [...items]; newItems[idx].isWeightUnknown = e.target.checked; setItems(newItems);
                      }} />
                      ኪሎው አልታወቀም
                    </label>
                  </div>
                ))}

                <div style={{ marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                      🧮 ራሱ-ሰር የተሰላ ጠቅላላ ኩንታል፦
                    </label>
                    <div style={{
                      width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px',
                      fontSize: '12px', fontWeight: '800', backgroundColor: '#f1f5f9', color: '#0f172a', boxSizing: 'border-box'
                    }}>
                      {autoComputedTotal.toFixed(2)} ኩንታል
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', display: 'block', marginBottom: '4px' }}>
                      ⚖️ ጠቅላላ ኩንታል (በእጅ መመዝገብ ከፈለጉ)፦
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualQuintals}
                      onChange={e => setManualQuintals(e.target.value)}
                      placeholder="ለምሳሌ፦ 120"
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>📍 የመጫኛ ቦታ(ዎች) እና አስጫኝ መረጃ</label>
                  <button type="button" onClick={handleAddLocation} style={{ backgroundColor: '#e2e8f0', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>➕ ተጨማሪ ቦታ ጨምር</button>
                </div>

                {locations.map((loc, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" placeholder={`ቦታ ${idx + 1} (ለምሳሌ፡ ዱከም)`} value={loc.location} onChange={e => {
                      const newLocs = [...locations]; newLocs[idx].location = e.target.value; setLocations(newLocs);
                    }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} />

                    <input type="text" placeholder="የአስጫኝ ስም" value={loc.shipperName} onChange={e => {
                      const newLocs = [...locations]; newLocs[idx].shipperName = e.target.value; setLocations(newLocs);
                    }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} />

                    <input type="tel" placeholder="የአስጫኝ ስልክ" value={loc.shipperPhone} onChange={e => {
                      const newLocs = [...locations]; newLocs[idx].shipperPhone = e.target.value; setLocations(newLocs);
                    }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>ተጨማሪ ማስታወሻ</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="ተጨማሪ መመሪያዎች ካሉ..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', marginTop: '4px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '⏳ በመመዝገብ ላይ...' : '💾 መዝግብ'}
                </button>
                <button type="button" onClick={() => setIsNewOrderModalOpen(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>ሰርዝ</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {assignDriverModalOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                🚚 የመኪና/ሰው መመደቢያ እና ማሳወቂያ ({assignDriverModalOrder.orderNo})
              </h3>
              <button onClick={() => setAssignDriverModalOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleAssignDriver} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div style={{ backgroundColor: '#e0f2fe', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1' }}>🚚 የተመደበ መምረጫና ማሳወቂያ *</label>
                <select
                  value={driverData.transportType}
                  onChange={e => setDriverData({ ...driverData, transportType: e.target.value as TransportType })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #0284c7', borderRadius: '6px', fontSize: '12px', marginTop: '4px', fontWeight: '800' }}
                >
                  <option value="ተደውሏል">📞 ተደውሏል</option>
                  <option value="ሰው ተልኳል">🏃‍♂️ ሰው ተልኳል</option>
                  <option value="ሃይሉክስ የድርጅቱ ተልኳል">🛻 ሃይሉክስ የድርጅቱ ተልኳል</option>
                  <option value="ሃይሉክስ ከውጭ ተልኳል">⚡ ሃይሉክስ ከውጭ ተልኳል</option>
                  <option value="ኦባማ ተልኳል">🚚 ኦባማ ተልኳል</option>
                  <option value="አይሱዙ ተልኳል">🚚 አይሱዙ ተልኳል</option>
                  <option value="ኤፍ ኤስ አር ተልኳል">🚛 ኤፍ ኤስ አር ተልኳል</option>
                  <option value="ካሶኒ ተልኳል">🚛 ካሶኒ ተልኳል</option>
                  <option value="ተሳቢ ተልኳል">🚛 ተሳቢ ተልኳል</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>የሹፌር/የደላላ/የተሸካሚ ስም *</label>
                <input type="text" required value={driverData.driverName} onChange={e => setDriverData({ ...driverData, driverName: e.target.value })} placeholder="ስም ያስገቡ" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>የሹፌር/የደላላ/የተሸካሚ ስልክ *</label>
                {/* 🆕 ደረጃ 4 - ከኮንታክት ውስጥ መርጦ ማስገቢያ 📖 በተን */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="tel"
                    required
                    value={driverData.driverPhone}
                    onChange={e => setDriverData({ ...driverData, driverPhone: e.target.value })}
                    placeholder="09..."
                    style={{ width: '100%', padding: '8px 40px 8px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDriverContactPicker(true)}
                    title="ከኮንታክት ውስጥ ምረጥ"
                    style={{ position: 'absolute', right: '4px', top: '4px', padding: '4px 8px', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '16px' }}
                  >
                    📖
                  </button>
                </div>
              </div>

              {/* 🆕 ደረጃ 4 - ታርጋ እና አቅም ወደ ራሳቸው ሳጥን ተነጣጥለዋል */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>🚗 የመኪና ታርጋ</label>
                  <input type="text" value={driverData.truckPlateNo} onChange={e => setDriverData({ ...driverData, truckPlateNo: e.target.value })} placeholder="3-A12345" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>⚖️ የመኪናው አቅም (ኩንታል)</label>
                  <input type="number" value={driverData.truckCapacityQuintal} onChange={e => setDriverData({ ...driverData, truckCapacityQuintal: e.target.value })} placeholder="200" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '⏳ በመመደብ ላይ...' : '✅ መድብ'}
                </button>
                <button type="button" onClick={() => setAssignDriverModalOrder(null)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>ሰርዝ</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🆕 ደረጃ 4 - Driver ኮንታክት መምረጫ ሞዳል */}
      {showDriverContactPicker && (
        <ContactPickerModal
          onClose={() => setShowDriverContactPicker(false)}
          onSelect={(name, phone) => {
            setDriverData(prev => ({
              ...prev,
              driverName: prev.driverName || name,
              driverPhone: phone,
            }));
            setShowDriverContactPicker(false);
          }}
        />
      )}

      {updateStatusModalOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>🔄 የጭነት ሁኔታ መቀየሪያ ({updateStatusModalOrder.orderNo})</h3>
              <button onClick={() => setUpdateStatusModalOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>መኪናው ያለበት ሁኔታ (Status)</label>
                <select
                  value={statusUpdateData.status}
                  onChange={e => setStatusUpdateData({ ...statusUpdateData, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', marginTop: '4px', fontWeight: '700' }}
                >
                  <option value="በመጫን ላይ">🔄 በመጫን ላይ ነው / እየጫነ ነው</option>
                  <option value="ወደ ሚጫንበት እየሄደ ነው">🚚 ወደ ሚጫንበት እየሄደ ነው</option>
                  <option value="ሰዓት ይዞት መንገድ ላይ ነው">⏱️ ሰዓት ይዞት መንገድ ላይ ነው</option>
                  <option value="ተጭኖ ወደ መርካቶ መጋዘን እየሄደ ነው">🏬 ተጭኖ ወደ መርካቶ መጋዘን እየሄደ ነው</option>
                  <option value="የተጫነ/በመንገድ ላይ">📦 ተጭኖ ጨርሶ ወደ መካነ ሰላም በመጓዝ ላይ ነው</option>
                  <option value="መካነ ሰላም ገብቷል">🏁 መካነ ሰላም ገብቷል</option>
                  <option value="እያራገፈ ነው">📤 እያራገፈ ነው</option>
                  <option value="አራግፎ ጨርሷል">✅ አራግፎ ጨርሷል</option>
                  {/* 🆕 ደረጃ 1 - ራስ-ሰር ካልተዘረዘሩት ውጭ በጽሁፍ የሚገለጽ ሁኔታ */}
                  <option value={CUSTOM_STATUS_VALUE}>✍️ ሌላ መግለጫ ጻፍ</option>
                </select>
              </div>

              {/* 🆕 ደረጃ 1 - custom ሁኔታ ሲመረጥ የሚታይ የጽሁፍ ሳጥን */}
              {statusUpdateData.status === CUSTOM_STATUS_VALUE && (
                <div style={{ backgroundColor: '#fdf4ff', padding: '10px', borderRadius: '8px', border: '1px solid #f5d0fe' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#a21caf' }}>✍️ ሁኔታውን በጽሁፍ ይግለጹ *</label>
                  <input
                    type="text"
                    required
                    value={customStatusText}
                    onChange={e => setCustomStatusText(e.target.value)}
                    placeholder="ለምሳሌ፦ መኪናው መንገድ ላይ ተበላሽቷል / እስካሁን ከፋብሪካ አልጨረሱለትም..."
                    style={{ width: '100%', padding: '9px', border: '1px solid #e9d5ff', borderRadius: '8px', fontSize: '12px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626' }}>⚠️ የጉድለት/ችግር ማብራሪያ መጻፊያ</label>
                <textarea
                  rows={2}
                  value={statusUpdateData.partialLoadingIssue}
                  onChange={e => setStatusUpdateData({ ...statusUpdateData, partialLoadingIssue: e.target.value })}
                  placeholder="ለምሳሌ፡ ዱከም ያለውን ጭኗል፤ ቃሊቲ ያለውን አልጭንም ብሏል..."
                  style={{ width: '100%', padding: '9px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '⏳ በመቀየር ላይ...' : '💾 ሁኔታውን ቀይር'}
                </button>
                <button type="button" onClick={() => setUpdateStatusModalOrder(null)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>ሰርዝ</button>
              </div>

            </form>

          </div>
        </div>
      )}

      {voidModalOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#be185d' }}>🗑️ ጭነቱን አጥፋ ({voidModalOrder.orderNo})</h3>
              <button onClick={() => setVoidModalOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={submitVoidOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#fdf2f8', padding: '10px', borderRadius: '8px', border: '1px solid #fbcfe8', fontSize: '11px', color: '#831843', fontWeight: '700' }}>
                ይህ ጭነት ነጋዴው ትቶት ከቀረ / ሌላ ቦታ የተጫነ ከሆነ ምክንያቱን ይጻፉ። ጭነቱ ወደ ታሪክ ማህደር ውስጥ በቀይ ምልክት (🗑️ ተሰርዟል/በሌላ ተጭኗል) ተለይቶ ይመዘገባል።
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>ምክንያት *</label>
                <textarea
                  rows={3}
                  required
                  value={voidReasonInput}
                  onChange={e => setVoidReasonInput(e.target.value)}
                  placeholder="ለምሳሌ፡ ነጋዴው ስልክ አልመለሰም / እቃው ሌላ ቦታ ተልኮ ነበር ወዘተ..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, backgroundColor: '#be185d', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '⏳ በማጥፋት ላይ...' : '🗑️ አጥፋ'}
                </button>
                <button type="button" onClick={() => setVoidModalOrder(null)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>ተወው</button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 🆕 አዲስ ሃሳብ/ችግር መመዝገቢያ MODAL */}
      {isNewFeedbackModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>💬 አዲስ ሃሳብ/ችግር መመዝገቢያ</h3>
              <button onClick={() => setIsNewFeedbackModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#faf5ff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', fontSize: '11px', color: '#6b21a8', fontWeight: '700', marginBottom: '14px' }}>
              ነጋዴ ደውሎ እቃ ተሰብሮ፣ ሂሳብ በዝቶ፣ ስንት እንደሚያስከፍል ጠይቆ ወይም ማንኛውም ሃሳብ/አስተያየት ከሰጠ እዚህ ይመዝግቡ።
            </div>

            <form onSubmit={handleCreateFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>ስም *</label>
                  <input
                    type="text"
                    required
                    value={fbName}
                    onChange={e => setFbName(e.target.value)}
                    placeholder="ለምሳሌ፡ አቶ ካሳሁን"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>ስልክ</label>
                  {/* 🆕 ደረጃ 6 - ከኮንታክት ውስጥ መርጦ ማስገቢያ 📖 በተን፣ ካልተገኘ በእጅ ይጻፍ */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="tel"
                      value={fbPhone}
                      onChange={e => setFbPhone(e.target.value)}
                      placeholder="09..."
                      style={{ width: '100%', padding: '9px 40px 9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFeedbackContactPicker(true)}
                      title="ከኮንታክት ውስጥ ምረጥ"
                      style={{ position: 'absolute', right: '4px', padding: '4px 8px', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '16px' }}
                    >
                      📖
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>የሃሳብ/ችግር ይዘት *</label>
                <textarea
                  rows={4}
                  required
                  value={fbMessage}
                  onChange={e => setFbMessage(e.target.value)}
                  placeholder="ደንበኛው የተናገረውን ሃሳብ መፈታት ያለበትን ይጻፉ..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, backgroundColor: '#7c3aed', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '⏳ በመመዝገብ ላይ...' : '💾 መዝግብ'}
                </button>
                <button type="button" onClick={() => setIsNewFeedbackModalOpen(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>ሰርዝ</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🆕 ደረጃ 6 - Feedback ኮንታክት መምረጫ ሞዳል */}
      {showFeedbackContactPicker && (
        <ContactPickerModal
          onClose={() => setShowFeedbackContactPicker(false)}
          onSelect={(name, phone) => {
            setFbPhone(phone);
            setFbName(prev => prev || name);
            setShowFeedbackContactPicker(false);
          }}
        />
      )}

      {/* 🆕 ምላሽ/ውሳኔ መስጫ MODAL */}
      {respondModalEntry && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>💬 ምላሽ/ውሳኔ ({respondModalEntry.name})</h3>
              <button onClick={() => setRespondModalEntry(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#0f172a', fontWeight: '600', marginBottom: '14px' }}>
              {respondModalEntry.message}
            </div>

            {respondModalEntry.status === 'ለሃላፊ ተልኳል' && (
              <div style={{ backgroundColor: '#fff7ed', padding: '8px', borderRadius: '8px', border: '1px solid #fed7aa', fontSize: '11px', color: '#c2410c', fontWeight: '700', marginBottom: '12px' }}>
                ⚠️ ይህ ችግር ቀደም ብሎ ወደ ሃላፊ ተልኳል — አሁን የሚሰጡት ምላሽ የሃላፊ ውሳኔ ተብሎ ይመዘገባል።
              </div>
            )}

            {/* 🆕 ደረጃ 3 - የፈታው/የመለሰው ሰራተኛ ወይም ሃላፊ ስም */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>👤 ችግሩን የፈታ ሰራተኛ/ሃላፊ ስም</label>
              <input
                type="text"
                value={responderName}
                onChange={e => setResponderName(e.target.value)}
                placeholder="ስምዎን ያስገቡ (ማን እንዳስተናገደ ለመለየት)"
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>ማስታወሻ / ምላሽ</label>
              <textarea
                rows={3}
                value={responseNoteInput}
                onChange={e => setResponseNoteInput(e.target.value)}
                placeholder="ምላሽዎን ወይም ውሳኔዎን ይጻፉ..."
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                disabled={saving}
                onClick={() => submitFeedbackResponse('resolve')}
                style={{ flex: 1, backgroundColor: '#047857', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                ✅ ችግሩን ፍታ
              </button>
              {respondModalEntry.status !== 'ለሃላፊ ተልኳል' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => submitFeedbackResponse('escalate')}
                  style={{ flex: 1, backgroundColor: '#c2410c', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}
                >
                  📤 ለሃላፊ አሳውቅ
                </button>
              )}
              <button type="button" onClick={() => setRespondModalEntry(null)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>ተወው</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}