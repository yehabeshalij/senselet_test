import { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { API_ORIGIN, CONTACTS_API_URL, apiFetch, SMS_SEND_URL, WAREHOUSE_API_BASE } from '../config/api';

export interface CargoItem {
  id?: string;
  description: string;
  weight: number; 
  weightsList?: string;
  category: 'ደረቅ' | 'ለጠፍ';
  isLoaded?: boolean | string;
  loaderType?: string;
  status?: 'በመጋዘን ያለ' | 'ተመልሷል' | string;
}

export interface MerchantTransaction {
  id: string;
  receiptNo: string;
  date: string; 
  time: string; 
  merchantName: string;
  merchantPhone: string; 
  delivererName: string; 
  delivererPhone: string; 
  receivedBy: string; 
  loadingStatus: 'አልተጫነም' | 'መኪናው ጭኖት የመጣ' | 'የውጭ ጫኝ ያወረደው' | 'የመጋዘን ልጆች የጫኑት' | string;
  status: string;
  isSmsSent: boolean; 
  items: CargoItem[]; 
}

interface SavedContact {
  id: string;
  name: string;
  phone: string;
}

interface GoogleContact {
  "Display Name"?: string;
  "First Name"?: string;
  "Last Name"?: string;
  "Mobile Phone"?: string;
  "Home Phone"?: string;
  "Business Phone"?: string;
}

const MOCK_CONTACTS: SavedContact[] = [
  { id: 'c1', name: 'ጫላ ደሳለኝ (ዋና)', phone: '0911554433' },
  { id: 'c2', name: 'ጫላ ደሳለኝ (ሁለተኛ)', phone: '0922110099' },
  { id: 'c3', name: 'ፋጡማ አህመድ', phone: '0930112233' },
];

const API_BASE_URL = `${API_ORIGIN}/api`;      // ✅

const thStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontWeight: '800',
  color: '#475569',
  borderBottom: '1px solid #e2e8f0',
  fontSize: '11px',
  textTransform: 'uppercase'
};

export default function MerchantStatusCenter() {
  const isProcessingRef = useRef<boolean>(false);
  const focusedPhoneIdRef = useRef<string | null>(null);

  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [savedContacts, setSavedContacts] = useState<GoogleContact[]>([]);
  const [contactSearchTerm, setContactSearchTerm] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeContactTxId, setActiveContactTxId] = useState<string | null>(null);
  const [showBossPreview, setShowBossPreview] = useState<boolean>(true);

  // 🎯 Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // 🎯 SMS የተላከላቸውን Receipt IDs መያዣ State (በ localStorage መነሻነት ይጫናል)
  const [sentSmsIds, setSentSmsIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sentSmsIdsList');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 🎯 በእጅ በሚፃፍበት ጊዜ Auto-refresh እንዳያጠፋብን የሚያግዝ State
const [editingPhones, setEditingPhones] = useState<{ [key: string]: string }>({});

  // sentSmsIds በተቀየረ ቁጥር localStorage ውስጥ ማስቀመጥ
  useEffect(() => {
    localStorage.setItem('sentSmsIdsList', JSON.stringify(sentSmsIds));
  }, [sentSmsIds]);

  const isSmsSent = (tx: any) => {
    return Boolean(
      tx?.isSmsSent || 
      tx?.smsSent || 
      tx?.merchantStatus === 'SENT' || 
      sentSmsIds.includes(tx?.id)
    );
  };

  const hasNoPhone = (tx: any) => {
    return !tx?.merchantPhone && !tx?.phoneNumber;
  };

  const [smsMode, setSmsMode] = useState<'auto' | 'manual'>(() => {
    return (localStorage.getItem('smsMode') as 'auto' | 'manual') || 'manual';
  });

  // 1. ኤስኤምኤስ ያልተላከላቸውን በየ 10 ሰከንዱ እየፈለገ የሚልክ Function
  const processAutoSMS = async () => {
    if (isProcessingRef.current) return;

    // SMS ያልተላከላቸውን እና ስልክ ቁጥር ያላቸውን ብቻ መለየት
    const pendingReceipts = transactions.filter((tx: any) => {
      const isSent = isSmsSent(tx);
      const hasPhone = tx.merchantPhone || tx.phoneNumber;
      return !isSent && hasPhone;
    });

    if (pendingReceipts.length > 0) {
      isProcessingRef.current = true;
      console.log(`🚀 ${pendingReceipts.length} ያልተላኩ እቃዎች ተገኝተዋል። በየ 10 ሰከንዱ ይላካሉ...`);

      for (const tx of pendingReceipts) {
        // ከመላኩ በፊት ድጋሚ ከተላከ ይዘለዋል
        if (!isSmsSent(tx)) {
          await handleSendSMS(tx);
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
      }
      isProcessingRef.current = false;
    }
  };

  // 2. አውቶማቲክ Mode ከበራ በየጊዜው እንዲያካሂደው በ useEffect ማሰር
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (smsMode === 'auto') {
      processAutoSMS();

      interval = setInterval(() => {
        processAutoSMS();
      }, 10000); 
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [smsMode, transactions, sentSmsIds]);

  // Mode ሲቀየር በ LocalStorage መዝግቦ መያዝ
  const handleModeChange = (mode: 'auto' | 'manual') => {
    setSmsMode(mode);
    localStorage.setItem('smsMode', mode);
  };

  // Fetch Receipts Data from Backend API
  const fetchReceipts = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/warehouse/receipts`);
      
      const formattedData: MerchantTransaction[] = res.data.map((item: any) => {
        const itemId = item.id || item._id;
        // LocalStorage ወይም backend ላይ sms ከተላከ መፈተሻ
        const isSentInLocal = sentSmsIds.includes(itemId);
        const isSentInBackend = item.isSmsSent || item.smsSent || item.merchantStatus === 'SENT';

        return {
          id: itemId,
          receiptNo: item.receiptNo || 'REC-000',
          date: item.ethDate || item.date || 'ቀን አልተጠቀሰም',
          time: item.time || '00:00',
          merchantName: item.merchantName || 'ያልታወቀ',
          merchantPhone: item.merchantPhone || '',
          delivererName: item.senderName || item.delivererName || 'ያልተገለጸ',
          delivererPhone: item.senderPhone || item.delivererPhone || '',
          receivedBy: item.receivedBy || item.receiverName || item.clerkName || item.registeredBy || 'ሰራተኛ',
          loadingStatus: item.loadingStatus || item.loaderType || item.loadingOption || 'አልተጫነም',
          status: item.status || 'አልተጫነም',
          isSmsSent: Boolean(isSentInBackend || isSentInLocal),
          items: (item.items || []).map((i: any) => ({
            description: i.description || i.name || 'እቃ',
            weight: Number(i.weight || i.totalWeight || 0),
            weightsList: i.rawWeightsInput || item.rawWeightsInput || i.rawWeightInput || '',
            category: i.category || 'ለጠፍ',
            isLoaded: i.isLoaded,
            loaderType: i.loaderType,
            status: i.status || 'በመጋዘን ያለ'
          }))
        };
      });

      setTransactions(formattedData);
    } catch (error) {
      console.error("❌ ከባክኤንድ ዳታ ማምጣት አልተቻለም:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // contacts.json ን ከ public/ ማምጫ useEffect
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await apiFetch(CONTACTS_API_URL);
        const data = await res.json();
        setSavedContacts(data);
      } catch (err) {
        console.error("❌ contacts.json ማምጣት አልተቻለም:", err);
      }
    };
    fetchContacts();
  }, []);

  // 1592 ኮንታክቶች ውስጥ በስም ወይም በስልክ ቁጥር መፈለጊያ Logic
  const filteredContacts = useMemo(() => {
    const allContacts = savedContacts
      .map((c) => {
        const name = c["Display Name"] || `${c["First Name"] || ''} ${c["Last Name"] || ''}`.trim() || 'ያልተሰየመ';
        const phone = c["Mobile Phone"] || c["Home Phone"] || c["Business Phone"] || '';
        return { name, phone };
      })
      .filter((c) => c.phone.trim() !== '');

    allContacts.sort((a, b) => a.name.localeCompare(b.name));

    if (!contactSearchTerm.trim()) {
      return allContacts;
    }

    const term = contactSearchTerm.toLowerCase();
    return allContacts.filter((c) => 
      c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );
  }, [savedContacts, contactSearchTerm]);

  useEffect(() => {
    fetchReceipts(true);

    
    const interval = setInterval(() => {
  // 🛑 ማንኛውም ስልክ ሳጥን በአርትዖት ላይ (focus) ከሆነ auto-refresh እንዳያደናቅፍ
  if (focusedPhoneIdRef.current) return;
  fetchReceipts(false); 
}, 3000);

    return () => clearInterval(interval);
  }, [sentSmsIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePhoneChange = (id: string, newPhone: string) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, merchantPhone: newPhone } : tx));
  };

  const handleUpdatePhoneInBackend = async (id: string, newPhone: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/warehouse/receipts/${id}/phone`, {
        merchantPhone: newPhone
      });
    } catch (error) {
      console.error("ስልክ ማዘመን አልተቻለም:", error);
    }
  };

  const handleSelectContact = (phone: string) => {
    if (activeContactTxId) {
      handlePhoneChange(activeContactTxId, phone);
      handleUpdatePhoneInBackend(activeContactTxId, phone);
      setActiveContactTxId(null);
    }
  };

  const getEthioDateString = () => {
    const now = new Date();
    const ethMonths = [
      "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት",
      "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
    ];

    try {
      const formatter = new Intl.DateTimeFormat('am-ET-u-ca-ethiopian', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return formatter.format(now);
    } catch (e) {
      return `${ethMonths[now.getMonth()]} ${now.getDate()} ቀን ${now.getFullYear() - 8} ዓ.ም`;
    }
  };

  const handleSendSMS = async (tx: any) => {
    if (!tx) {
      alert('⚠️ የደረሰኝ መረጃ አልተገኘም!');
      return;
    }

    // አስቀድሞ ከተላከ በድጋሚ እንዳይልከው ይከለክላል
    if (isSmsSent(tx)) {
      alert('⚠️ የዚህ ደረሰኝ SMS አስቀድሞ ተልኳል!');
      return;
    }

    const phone = tx.merchantPhone || tx.phoneNumber;

    if (!phone || phone.toString().trim() === '') {
      alert('⚠️ እባክዎን አስቀድመው የነጋዴውን ስልክ ቁጥር ያስገቡ!');
      return;
    }

    let rawDate = tx.ethDate || tx.ethiopianDate || tx.date || "ሐምሌ 17, 2018";

    let formattedEthioDate = rawDate;
    if (rawDate && typeof rawDate === 'string') {
      const parts = rawDate.trim().split(/\s+/);
      if (parts.length >= 3 && !isNaN(Number(parts[0]))) {
        formattedEthioDate = `${parts[1]} ${parts[0]}, ${parts[2]}`;
      }
    }

    const timeStr = tx.time || tx.entryTime || new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });

    const itemsList = tx.items && tx.items.length > 0 
      ? tx.items.map((i: any) => i.description || i.name).join(', ') 
      : (tx.goodsDescription || "እቃ");

    const customMessage = `ውድ ደንበኛችን በቀን ${formattedEthioDate} በ ${timeStr}✨ "${itemsList}" ✨ ሰንሰለት የደረቅ ጭነት አገልግሎት ድርጅት መጋዘን ገብቷል።`;

    try {
      const response = await fetch(SMS_SEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId: tx.id,
          phone: phone,
          message: customMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ መልዕክቱ ተልኳል!`);
        
        // 🎯 1. በ state እና በ LocalStorage ውስጥ ID ውን መመዝገብ
        setSentSmsIds((prev) => Array.from(new Set([...prev, tx.id])));

        // 🎯 2. Local State ን ወዲያውኑ ማዘመን
        setTransactions((prev) =>
          prev.map((item) =>
            item.id === tx.id ? { ...item, isSmsSent: true } : item
          )
        );

        // 🎯 3. ባክኤንድ ላይም የተላከ መሆኑን መመዝገብ (የባክኤንድህን endpoint መሠረት በማድረግ)
        try {
          await axios.patch(`${API_BASE_URL}/warehouse/receipts/${tx.id}/sms-status`, {
            isSmsSent: true
          });
        } catch (e) {
          console.log("Backend SMS Status Update Optional Notify:", e);
        }

      } else {
        alert(`❌ ኤስኤምኤስ መላክ አልተቻለም፡ ${data.error}`);
      }
    } catch (error) {
      console.error('SMS Error:', error);
      alert('❌ ከኤስኤምኤስ ሰርቨሩ ጋር መገናኘት አልተቻለም!');
    }
  };

  const handleReturnCargoItem = async (receiptId: string) => {
    if (!receiptId) {
      alert("⚠️ የደረሰኝ መታወቂያ አልተገኘም!");
      return;
    }

    if (!window.confirm("እርግጠኛ ነዎት የዚህን ደረሰኝ እቃ/እቃዎች ተመልሷል ብለው መመዝገብ ይፈልጋሉ?")) return;

    try {
    const res = await axios.patch(`${WAREHOUSE_API_BASE}/receipts/${receiptId}/return-all`);

      if (res.data.success) {
        alert("✅ እቃው ተመልሷል ተብሎ በተሳካ ሁኔታ ተመዝግቧል!");
        if (typeof fetchReceipts === 'function') {
          fetchReceipts(false);
        }
      }
    } catch (err: any) {
      console.error("እቃ መመለስ አልተቻለም:", err);
      alert("⚠️ እቃውን መመለስ አልተቻለም!");
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => 
      tx.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchantPhone.includes(searchTerm) ||
      tx.receiptNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const currentTransactions = useMemo(() => {
    return filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredTransactions, indexOfFirstItem, indexOfLastItem]);

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '24px 16px', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', 
          borderTop: '4px solid #2563eb', 
          borderLeft: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          overflow: 'hidden',
          padding: '20px'
        }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* 🆕 ሎጎው ሰፋ ብሎ (ያለ ተጨማሪ ሄደር) */}
              <img
                src="/logo3.jpg"
                alt="የድርጅቱ ሎጎ"
                style={{ width: '110px', height: '80px', objectFit: 'fill' }}
              />
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                <span style={{ fontSize: '22px' }}>ሰንሰለት የደረቅ ጭነት አገልግሎት መስጫ ድርጅት<br/></span>
                መጋዘን የገቡ እቃዎች መከታተያ እና SMS መላኪያ
              </h1>
            </div>
          </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>

              <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <button 
                  onClick={() => handleModeChange('manual')}
                  style={{
                    border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer',
                    backgroundColor: smsMode === 'manual' ? '#ffffff' : 'transparent',
                    color: smsMode === 'manual' ? '#0f172a' : '#64748b',
                  }}
                >
                  🖐️ ማኑዋል (Manual)
                </button>
                <button 
                  onClick={() => {
                    handleModeChange('auto');
                    processAutoSMS();
                  }}
                  style={{
                    border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer',
                    backgroundColor: smsMode === 'auto' ? '#10b981' : 'transparent',
                    color: smsMode === 'auto' ? '#ffffff' : '#64748b',
                  }}
                >
                  🤖 አውቶማቲክ (Auto)
                </button>
              </div>

              <input 
                type="text" 
                placeholder="🔍 ፈልግ..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '200px', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#334155', backgroundColor: '#f8fafc', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ ...thStyle, width: '45px', textAlign: 'center' }}>ተ.ቁ</th> 
                  <th style={{ ...thStyle, width: '110px' }}>ቀን / ሰዓት</th>
                  <th style={{ ...thStyle, width: '90px' }}>የደረሰኝ ቁጥር</th>
                  <th style={{ ...thStyle, width: '120px' }}>የነጋዴ ስም</th>
                  <th style={{ ...thStyle, width: '160px' }}>የነጋዴ ስልክ</th>
                  <th style={{ ...thStyle, width: '180px' }}>መጋዘን የገባው እቃ</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '100px' }}>ደረቅ ኪ.ግ</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '160px' }}>ለጠፍ ኪ.ግ</th>
                  <th style={{ ...thStyle, width: '140px' }}>የአስረካቢ ስም / ስልክ</th>
                  <th style={{ ...thStyle, width: '120px' }}>የተረካቢ ስም</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '150px' }}>የጭነት ሁኔታ</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '100px' }}>ተግባር (SMS)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#2563eb', fontWeight: '700' }}>
                      🔄 መረጃ ከዳታቤዝ እየመጣ ነው...
                    </td>
                  </tr>
                ) : currentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontWeight: '600' }}>
                      ምንም የተመዘገበ መረጃ አልተገኘም።
                    </td>
                  </tr>
                ) : (
                  currentTransactions.map((tx, idx) => {
                    const isEven = idx % 2 === 0;
                    const phoneNotAvailable = hasNoPhone(tx);
                    const serialNumber = indexOfFirstItem + idx + 1;
                    const items = tx.items || [];
                    const sentStatus = isSmsSent(tx);

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isEven ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '800', color: '#64748b' }}>{serialNumber}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: '700', color: '#334155' }}>{tx.date}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>🕒 {tx.time}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: '800', color: '#2563eb' }}>{tx.receiptNo}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '800', color: '#0f172a' }}>{tx.merchantName}</td>
                        
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '145px' }}>
                        

<input 
  type="tel"
  value={editingPhones[tx.id] !== undefined ? editingPhones[tx.id] : (tx.merchantPhone || '')}
  
  onChange={(e) => {
    const val = e.target.value;
    // 🎯 1. Local State-ን ያዘምናል
    setEditingPhones(prev => ({ ...prev, [tx.id]: val }));
    
    // 🎯 2. Main State-ንም በቅጽበት ያዘምናል (SMS በተኑ አዲሱን ቁጥር እንዲያገኘው)
    handlePhoneChange(tx.id, val);
  }}
  

onFocus={() => { focusedPhoneIdRef.current = tx.id; }}
onBlur={(e) => {
  const finalValue = e.target.value;
  handleUpdatePhoneInBackend(tx.id, finalValue);
  focusedPhoneIdRef.current = null;
  setEditingPhones(prev => {
    const copy = { ...prev };
    delete copy[tx.id];
    return copy;
  });
}}
  
  placeholder="ስልክ ያስገቡ..."
  disabled={sentStatus}
  style={{
    width: '100%', padding: '5px 28px 5px 8px', 
    border: phoneNotAvailable ? '1px solid #ef4444' : '1px solid #cbd5e1',
    borderRadius: '5px', fontSize: '11px', fontWeight: '700',
    color: phoneNotAvailable ? '#ef4444' : '#1e293b',
    backgroundColor: sentStatus ? '#f1f5f9' : (phoneNotAvailable ? '#fef2f2' : '#ffffff'),
    outline: 'none', boxSizing: 'border-box'
  }}
/>
                              <button
                                onClick={() => setActiveContactTxId(tx.id)}
                                disabled={sentStatus}
                                title="ከስልክ ማውጫ ምረጥ"
                                style={{
                                  position: 'absolute', right: '4px', border: 'none', background: 'transparent',
                                  cursor: sentStatus ? 'not-allowed' : 'pointer', fontSize: '11px', padding: '2px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sentStatus ? 0.3 : 0.8
                                }}
                              >
                                📖
                              </button>
                            </div>
                            {phoneNotAvailable && <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: '800' }}>🚨 ስልክ የለም!</span>}
                          </div>
                        </td>

                        {/* መጋዘን የገባው እቃ */}
                        <td style={{ padding: '10px 14px', color: '#334155' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {items.map((item, index) => (
                              <div key={index} style={{ fontWeight: '700', color: item.status === 'ተመልሷል' ? '#94a3b8' : '#0f172a', fontSize: '11px', minHeight: '22px', display: 'flex', alignItems: 'center', textDecoration: item.status === 'ተመልሷል' ? 'line-through' : 'none' }}>
                                • {item.description}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* ደረቅ ኪ.ግ */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {items.map((item, index) => (
                              <div key={index} style={{ minHeight: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.category === 'ደረቅ' ? (
                                  <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '11px' }}>
                                    {item.weight} ኪ.ግ
                                  </span>
                                ) : (
                                  <span style={{ color: '#cbd5e1', fontWeight: '700' }}>-</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* ለጠፍ ኪ.ግ (ዝርዝር) */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {items.map((item, index) => {
                              const hasList = item.weightsList && item.weightsList !== 'EMPTY_STRING' && item.weightsList.trim() !== '';

                              return (
                                <div key={index} style={{ minHeight: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                  {item.category === 'ለጠፍ' ? (
                                    <>
                                      <span style={{ fontWeight: '800', color: '#2563eb', fontSize: '11px' }}>
                                        {item.weight} ኪ.ግ
                                      </span>
                                      {hasList && (
                                        <span style={{ 
                                          fontSize: '9px', color: '#0369a1', backgroundColor: '#e0f2fe', 
                                          padding: '2px 4px', borderRadius: '4px', fontWeight: '700', 
                                          border: '1px solid #bae6fd', marginTop: '2px', wordBreak: 'break-word', maxWidth: '100%' 
                                        }}>
                                          [{item.weightsList}]
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span style={{ color: '#cbd5e1', fontWeight: '700' }}>-</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* አስረካቢ */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: '700', color: '#334155' }}>{tx.delivererName}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>📞 {tx.delivererPhone}</div>
                        </td>

                        {/* ተረካቢ ሰራተኛ */}
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontWeight: '700', color: '#0f172a', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            👤 {tx.receivedBy}
                          </span>
                        </td>
                        
                        {/* 🎯 የጭነት ሁኔታ እና የመመለሻ ቁልፍ */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {items.map((item: any, index: number) => {
                              const isReturned = item.status === 'ተመልሷል';
                              const isLoaded = item.isLoaded === true || item.isLoaded === 'true';
                              const loaderText = item.loaderType && item.loaderType !== 'EMPTY_STRING' ? item.loaderType : 'የመጋዘን ልጆች የጫኑት';

                              return (
                                <div key={index} style={{ minHeight: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  {isReturned ? (
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      padding: '3px 8px',
                                      borderRadius: '5px',
                                      backgroundColor: '#fff7ed',
                                      color: '#c2410c',
                                      border: '1px solid #ffedd5',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      ↩️ ተመልሷል
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      padding: '3px 8px',
                                      borderRadius: '5px',
                                      backgroundColor: isLoaded ? '#dcfce7' : '#f8fafc',
                                      color: isLoaded ? '#15803d' : '#64748b',
                                      border: isLoaded ? '1px solid #86efac' : '1px solid #e2e8f0',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {isLoaded ? `📦 ${loaderText}` : '⏳ አልተጫነም'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                                
                        {/* ተግባር (SMS እና እቃ መመለሻ) */}
                        <td style={{ padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            
                            {/* 1. የ SMS መላኪያ ቁልፍ (ከተላከ በኋላ ተልኳል ብሎ ይቆልፋል) */}
                            <button 
                              onClick={() => handleSendSMS(tx)} 
                              disabled={sentStatus || phoneNotAvailable}
                              className="btn btn-primary"
                              style={{ 
                                backgroundColor: phoneNotAvailable
                                  ? '#cbd5e1' 
                                  : sentStatus
                                    ? '#64748b'
                                    : '#10b981',
                                color: '#ffffff', 
                                border: 'none', 
                                padding: '5px 8px', 
                                borderRadius: '5px', 
                                fontWeight: '800', 
                                fontSize: '10px',
                                cursor: (sentStatus || phoneNotAvailable)
                                  ? 'not-allowed' 
                                  : 'pointer', 
                                width: '75px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {sentStatus ? '✅ ተልኳል' : '📟 SMS ላክ'}
                            </button>
                              
                            {/* 2. ከ SMS አጠገብ የተቀመጠችው የመልስ ቁልፍ */}
                            {tx.items && tx.items.some((item: any) => item.status !== 'ተመልሷል') && (
                              <button
                                onClick={() => {
                                  const receiptId: string = (tx as any)?.id || (tx as any)?._id || '';
                                  handleReturnCargoItem(receiptId);
                                }}
                                title="እቃውን ተመልሷል ብሎ መመዝገቢያ"
                                style={{
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '5px',
                                  padding: '5px 8px',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                ↩️
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

   {/* Pagination*/}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                ከ {totalItems} መዝገቦች ውስጥ {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} እያዩ ነው (በየገጹ 15)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ◀ ፕሪቬስ (Prev)
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: currentPage === page ? '#2563eb' : '#ffffff', color: currentPage === page ? '#ffffff' : '#334155', cursor: 'pointer' }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  ኔክስት (Next) ▶
                </button>
              </div>
            </div>
          )}

{activeContactTxId !== null && (
  // <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, padding: '16px', overflowY: 'auto' }}>
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', margin: '16px auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>📖 ስልክ ማውጫ</h3>
        </div>
        <button 
          onClick={() => { setActiveContactTxId(null); setContactSearchTerm(''); }} 
          style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', color: '#64748b' }}
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <input 
        type="text" 
        placeholder="🔍 በስም ወይም በስልክ ፈልግ..." 
        value={contactSearchTerm}
        onChange={e => setContactSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }}
      />

      {/* Full 1592 Contacts Scrollable Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '6px' }}>
        {filteredContacts.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>ምንም የተመዘገበ ኮንታክት አልተገኘም።</div>
        ) : (
          filteredContacts.map((c, idx) => (
            <div 
              key={idx}
              onClick={() => {
                handleSelectContact(c.phone);
                setContactSearchTerm('');
              }}
              style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              <div>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{c.name}</div>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', marginTop: '2px' }}>📞 {c.phone}</div>
              </div>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '800' }}>ምረጥ ➔</span>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
}

