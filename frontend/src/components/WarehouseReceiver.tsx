
import React, { useState, useRef, useEffect } from 'react';
import ContactDirectoryModal from './ContactDirectoryModal';
import { WAREHOUSE_API_BASE, LOADING_API_BASE } from '../config/api';


// -------------------------------------------------------------
// 📖 VCF / VCard ዳታህ (እዚህ ውስጥ የሁሉንም VCF መረጃ ማስገባት ትችላለህ)
// -------------------------------------------------------------
const VCF_DATA = '';

interface PackageItem {
  id: string;
  packageNo: number;
  weight: number;
  isLoaded: boolean;
  loaderType: string;
}

interface CargoItem {
  id: string;
  description: string;
  weight: number;
  category: 'ደረቅ' | 'ለጠፍ';
  isLoaded: boolean;
  loaderType: 'መኪናው ጭኖት የመጣው' | 'የውጭ ጫኝ ያወረደው' | 'የመጋዘን ልጆች የጫኑት' | '';
  isMultiPackage?: boolean;
  rawWeightsInput?: string;
  packages?: PackageItem[];
}

// 🎯 ትክክለኛ የኢትዮጵያ ቀን በ Intl.DateTimeFormat (መጋቢት 15 የሚለውን ስህተት ሙሉ በሙሉ ያስቀራል)
function getEthiopianDate(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatter.format(date);
  } catch (e) {
    return "ሐምሌ 17, 2018";
  }
}

export default function WarehouseReceiver() {
  const [cargoList, setCargoList] = useState<CargoItem[]>([
    { id: '1', description: '', weight: 0, category: 'ደረቅ', isLoaded: false, loaderType: '', isMultiPackage: false, rawWeightsInput: '', packages: [] }
  ]);

  const [formData, setFormData] = useState({
    merchantName: '',
    merchantPhone: '',
    senderName: '',
    senderPhone: '',
    receiverName: ''
  });

  const [carPlate, setCarPlate] = useState('');
  const [showDirectory, setShowDirectory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinted, setIsPrinted] = useState<boolean>(false);

  // 🕒 አውቶማቲክ የቀን እና ሰዓት State — በየሰከንዱ ይዘምናል (አንድ ብቻ፣ ሁሉም ቦታ የሚያገለግል)
  const [currentDateTime, setCurrentDateTime] = useState({
    ethDate: getEthiopianDate(),
    gregDate: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  });

  const [activeTruckPlates, setActiveTruckPlates] = useState<{ plateNumber: string; truckType: string | null }[]>([]);

const fetchActiveTruckPlates = async () => {
  try {
    const res = await fetch(`${LOADING_API_BASE}/trucks?status=ACTIVE`);
    if (res.ok) {
      const json = await res.json();
      const plates = (json.data || [])
        .filter((t: any) => t.isSaved && t.plateNumber && t.plateNumber.trim() !== '')
        .map((t: any) => ({ plateNumber: t.plateNumber, truckType: t.truckType }));
      setActiveTruckPlates(plates);
    }
  } catch (err) {
    console.log("የተመዘገቡ ታርጋዎችን ማምጣት አልተቻለም");
  }
};



useEffect(() => {
  fetchActiveTruckPlates();
  // 🔄 አስጫኙ አዲስ መኪና በሚመዘግብበት/በሚያጠፋበት ጊዜ ገጹ ሪፍሬሽ ሳይደረግ እንዲዘምን በየ8 ሰከንዱ ይፈትሻል
  const interval = setInterval(fetchActiveTruckPlates, 8000);
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime({
        ethDate: getEthiopianDate(now),
        gregDate: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. የደረሰኝ ቁጥር State (ከዳታቤዝ ተጠይቆ የሚመጣ)
  const [receiptNo, setReceiptNo] = useState<string>("№ 04300");

  // 🎯 ከኤፒአይህ (/api/warehouse/receipts) የመጨረሻውን የደረሰኝ ቁጥር ማምጫ
  const fetchLatestReceiptNo = async () => {
    try {
      // const res = await fetch('WAREHOUSE_API_BASE/warehouse/receipts');
      const res = await fetch(`${WAREHOUSE_API_BASE}/receipts`);
      if (res.ok) {
        const receipts = await res.json();
        if (receipts && receipts.length > 0) {
          const lastReceipt = receipts[0];
          const lastReceiptNoStr = lastReceipt.receiptNo || lastReceipt.receiptNumber || "";
          const match = lastReceiptNoStr.match(/\d+/);

          if (match) {
            const nextNum = parseInt(match[0], 10) + 1;
            setReceiptNo(`№ ${String(nextNum).padStart(5, '0')}`);
          }
        }
      }
    } catch (err) {
      console.log("የደረሰኝ ቁጥር ከዳታቤዝ ማምጣት አልተቻለም፣ በቋሚው ይቀጥላል");
    }
  };

  useEffect(() => {
    fetchLatestReceiptNo();
  }, []);

  const addCargoRow = () => {
    const newId = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setCargoList([...cargoList, { id: newId, description: '', weight: 0, category: 'ደረቅ', isLoaded: false, loaderType: '', isMultiPackage: false, rawWeightsInput: '', packages: [] }]);
  };

  const removeCargoRow = (id: string) => {
    if (cargoList.length > 1) {
      setCargoList(cargoList.filter(item => item.id !== id));
    }
  };

  const parsePackages = (rawInput: string): PackageItem[] => {
    if (!rawInput.trim()) return [];
    return rawInput.split(/[,\u1363]/)
      .map(val => val.trim())
      .filter(val => val !== "" && !isNaN(Number(val)))
      .map((val, idx) => ({
        id: `pkg-${Date.now()}-${idx}`,
        packageNo: idx + 1,
        weight: Number(val),
        isLoaded: false,
        loaderType: ''
      }));
  };

  const handleCargoChange = (index: number, field: keyof CargoItem, value: any) => {
    setCargoList(prev => prev.map((item, i) => {
      if (i !== index) return item;

      let updated = { ...item, [field]: value };

      if (field === 'isMultiPackage') {
        updated.isMultiPackage = value;
        if (!value) {
          updated.rawWeightsInput = '';
          updated.packages = [];
          updated.weight = 0;
        }
      }

      if (field === 'rawWeightsInput') {
        updated.rawWeightsInput = value;
        const parsedPkgs = parsePackages(value);
        updated.packages = parsedPkgs;
        updated.weight = parsedPkgs.reduce((sum, p) => sum + p.weight, 0);
      }

      if (field === 'weight' && !item.isMultiPackage) {
        updated.weight = Number(value) || 0;
      }

      return updated;
    }));
  };

  const toggleLoadedStatus = (index: number, type: 'መኪናው ጭኖት የመጣው' | 'የውጭ ጫኝ ያወረደው' | 'የመጋዘን ልጆች የጫኑት' | '') => {
    setCargoList(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const isLoaded = type !== '';
      const updatedPackages = item.packages?.map(p => ({
        ...p,
        isLoaded: isLoaded,
        loaderType: type
      })) || [];

      return {
        ...item,
        isLoaded: isLoaded,
        loaderType: type,
        packages: updatedPackages
      };
    }));
  };

  const handleSelectMerchant = (name: string, phone: string) => {
    setFormData(prev => ({
      ...prev,
      merchantName: name,
      merchantPhone: phone
    }));
    setShowDirectory(false);
    showNotification(`👤 የ${name} መረጃ በተሳካ ሁኔታ ተሞልቷል!`, 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalWeight = cargoList.reduce((sum, item) => sum + item.weight, 0);

  const isFormStarted =
    formData.merchantName.length > 0 ||
    formData.merchantPhone.length > 0 ||
    formData.senderName.length > 0 ||
    formData.senderPhone.length > 0 ||
    formData.receiverName.length > 0 ||
    carPlate.length > 0 ||
    cargoList.some(item => item.description.length > 0 || item.weight > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPrinted) {
      showNotification("⚠️ እባክዎ መጀመሪያ ደረሰኙን ያትሙ (POS Print)!", 'error');
      return;
    }

    const payload = {
      receiptNo: receiptNo,
      ethDate: currentDateTime.ethDate,
      gregDate: currentDateTime.gregDate,
      time: currentDateTime.time,
      merchantName: formData.merchantName,
      merchantPhone: formData.merchantPhone,
      senderName: formData.senderName,
      senderPhone: formData.senderPhone,
      receiverName: formData.receiverName,
      carPlate: carPlate ? carPlate.toUpperCase() : '',
      totalWeight,
      cargoList
    };

    try {
      showNotification("⏳ መረጃው በመመዝገብ ላይ ነው...", 'success');

      const response = await fetch(`${WAREHOUSE_API_BASE}/receive`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

      const result = await response.json();

      if (response.ok) {
        const savedReceiptNo = result.data?.receiptNo || receiptNo;
        showNotification(`🚀 መረጃው ተመዝግቧል! የደረሰኝ ቁጥር፦ (${savedReceiptNo})`, 'success');

        setIsPrinted(false);
        setCargoList([
          { id: Date.now().toString(), description: '', weight: 0, category: 'ደረቅ', isLoaded: false, loaderType: '', isMultiPackage: false, rawWeightsInput: '', packages: [] }
        ]);
        setFormData({
          merchantName: '',
          merchantPhone: '',
          senderName: '',
          senderPhone: '',
          receiverName: ''
        });
        setCarPlate('');

        const match = savedReceiptNo.match(/\d+/);
        if (match) {
          const nextNum = parseInt(match[0], 10) + 1;
          setReceiptNo(`№ ${String(nextNum).padStart(5, '0')}`);
        }

      } else {
        showNotification(`❌ መረጃውን ማስገባት አልተቻለም፦ ${result.message || 'ስህተት አለ'}`, 'error');
      }
    } catch (error) {
      console.error("API Error:", error);
      showNotification("❌ ከሰርቨር ጋር መገናኘት አልተቻለም! እባክዎ ሰርቨርዎ መስራቱን ያረጋግጡ።", 'error');
    }
  };

  const handlePrint = () => {
    setIsPrinted(true);
    window.print();
    showNotification("🖨️ ደረሰኙ ታትሟል! አሁን መረጃውን መመዝገብ ይችላሉ።", 'success');
  };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '0px 0px 40px 0px', fontFamily: 'sans-serif' }}>

      <style>{`
        .main-wrapper-container {
          border: 1px solid #cbd5e1;
          max-width: 1350px;
          margin: 0 auto 30px auto;
          background-color: #fff;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border-radius: 8px;
          overflow: hidden;
        }

        .responsive-grid-layout {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 25px;
          padding: 25px 30px;
        }

        .cargo-row-item {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          align-items: center;
          background-color: #fff;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          flex-wrap: nowrap;
        }

        /* ✨ ለስልክ/ላፕቶፕ የመጫን ስሜት (tap feedback) — ለሁሉም ቁልፎች */
        .tap-btn {
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.1s ease, opacity 0.1s ease, box-shadow 0.15s ease;
        }
        .tap-btn:active {
          transform: scale(0.96);
          opacity: 0.92;
        }

        /* ✨ የኪሎ ማስገቢያ (number input) ላይ ያለውን spinner arrow ማጥፋት — ንፁህ ገፅታ */
        .num-input::-webkit-outer-spin-button,
        .num-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .num-input { -moz-appearance: textfield; }

        /* 🏢 ራስጌ ሎጎ — ስፋቱ በስክሪኑ ልክ የሚስተካከል (ትንንሽ ስልኮች ላይ እንዳይጨናነቅ) */
        .header-logo {
          width: 220px;
          max-width: 42vw;
          height: auto;
          max-height: 72px;
          object-fit: contain;
        }
        .header-title-main { font-size: 20px; }
        .header-title-sub { font-size: 12px; }
        .header-meta-block { text-align: right; align-items: flex-end; }

        @media (max-width: 1100px) {
          .responsive-grid-layout {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 15px;
          }
        }

        @media (max-width: 768px) {
          .cargo-row-item {
            flex-wrap: wrap;
          }
          .cargo-row-item input, .cargo-row-item select, .cargo-row-item button {
            width: 100% !important;
          }
          .header-top-bar {
            flex-direction: column;
            gap: 14px;
            align-items: center !important;
            padding: 16px 18px !important;
          }
          .header-top-bar > div { flex: none !important; width: 100%; }
          .header-logo { width: 150px; max-width: 55vw; max-height: 58px; margin: 0 auto; }
          .header-title-main { font-size: 16px !important; }
          .header-title-sub { font-size: 11px !important; }
          .header-meta-block {
            text-align: center !important;
            align-items: center !important;
            padding-right: 0 !important;
          }
          .header-meta-block > div:first-child { display: flex; justify-content: center; }
          .header-meta-block > div:last-child { align-items: center !important; }
          .header-meta-block > div:last-child > div { justify-content: center !important; }
          .bottom-bar-layout {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 15px !important;
          }
          .plate-box-width {
            width: 100% !important;
          }
          .toast-notice {
            left: 12px !important;
            right: 12px !important;
            top: 12px !important;
            width: auto !important;
          }
        }

        /* 🖨️ 1 ገፅ ብቻ እንዲወጣ እና ለPOS(80mm) ማተሚያ የተስተካከለ PRINT CSS */
        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          /* 🎯 ወሳኙ ማስተካከያ፦ ከዚህ በፊት visibility:hidden ስለነበር የተደበቀው ቅጽ
             ቦታውን (ቁመቱን) ይዞ ስለሚቆይ 2ኛ ባዶ ገፅ ይፈጥር ነበር።
             display:none ግን ከሌይአውት ሙሉ በሙሉ ስለሚያስወግደው 1 ገፅ ብቻ ያትማል። */
          .no-print {
            display: none !important;
          }

          .print-page-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }

          .preview-outer-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            background: transparent !important;
          }

          .pos-print-area {
            position: static !important;
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            border-radius: 0 !important;
          }

          .pos-print-area, .pos-print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .pos-print-area > div {
            width: 80mm !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
`}</style>

      {/* 🔔 ቶስት ማሳወቂያ */}
      {toast && (
        <div className="no-print toast-notice" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          zIndex: 9999,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{toast.type === 'success' ? '✔️' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* 📦 Header ክፍል */}
      <div className="max-w-7xl mx-auto p-4 print-page-wrapper">
        <div className="main-wrapper-container no-print">

          <div className="header-top-bar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            padding: '6px 30px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            marginBottom: '16px'
          }}>

            {/* 1. 👈 የግራ በኩል፦ ጎላ ብሎ የሚታይ ሎጎ */}
            <div style={{
              flex: '1',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '4px'
            }}>
              <img
                src="/logo3.jpg"
                alt="Senselet Dry Cargo Logo"
                className="header-logo"
              />
            </div>

            {/* 🎯 2. መሃል አርእስት */}
            <div style={{ flex: '2', textAlign: 'center' }}>
              <h2 className="header-title-main" style={{
                margin: 0,
                color: '#166534',
                fontWeight: '700',
                fontFamily: 'sans-serif'
              }}>
                ሰንሰለት የደረቅ ጭነት አገልግሎት ድርጅት
              </h2>
              <span className="header-title-sub" style={{
                color: '#15803d',
                fontWeight: '700',
                display: 'block',
                marginTop: '8px'
              }}>
                Senselet Dry Cargo Services
              </span>
            </div>

            {/* 👉 3. የቀኝ በኩል አውቶማቲክ ቁጥር + ቀን + ሰዓት */}
            <div className="header-meta-block" style={{
              flex: '1',
              paddingRight: '20px'
            }}>

              <div>
                <span style={{ fontSize: '22px', color: '#1e3a8a', fontWeight: '900' }}>{receiptNo}</span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 'bold', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span>📅 {currentDateTime.ethDate} </span>/
                  <span>({currentDateTime.gregDate})</span>
                  <span style={{ fontSize: '12px', color: '#059669', fontFamily: 'monospace' }}>⏰ {currentDateTime.time}</span>
                </div>
              </div>
            </div>

          </div>

          <form onSubmit={handleSubmit}>
            <div className="responsive-grid-layout">

              {/* ⬅️ የግራ አምድ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>የእቃው ባለቤት ሙሉ ስም *</label>
                  <input
                    type="text"
                    placeholder="የእቃው ባለቤት ሙሉ ስም"
                    required
                    id="merchantName"
                    value={formData.merchantName}
                    onChange={e => setFormData({...formData, merchantName: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #94a3b8', borderRadius: '4px', boxSizing: 'border-box', height: '42px', fontSize: '14px' }}
                  />
                </div>

                <div style={{ border: '1px solid #cbd5e1', padding: '20px', backgroundColor: '#fcfcfc', borderRadius: '6px', display: 'flex', flexDirection: 'column', minHeight: '240px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>የእቃ አይነት እና የየራሳቸው ኪሎ ግራም *</label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {cargoList.map((item, index) => (
                      <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div className="cargo-row-item">

                          <input
                            type="text"
                            placeholder="ምሳሌ፦ 1 ካርቶን / 1 ቋጠሮ ልብስ"
                            required
                            value={item.description}
                            onChange={e => handleCargoChange(index, 'description', e.target.value)}
                            style={{ flex: '1.5', minWidth: '140px', padding: '8px 12px', border: '1px solid #94a3b8', borderRadius: '4px', height: '40px', boxSizing: 'border-box', fontSize: '14px' }}
                          />

                          <button
                            type="button"
                            className="tap-btn"
                            onClick={() => handleCargoChange(index, 'isMultiPackage', !item.isMultiPackage)}
                            style={{
                              padding: '0px 12px',
                              backgroundColor: item.isMultiPackage ? '#1e3a8a' : '#e2e8f0',
                              color: item.isMultiPackage ? '#fff' : '#1e293b',
                              border: '1px solid #94a3b8',
                              borderRadius: '4px',
                              height: '40px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            📦 {item.isMultiPackage ? "የኬሻ ዝርዝር (ON)" : "የኬሻ ዝርዝር (OFF)"}
                          </button>

                          {item.isMultiPackage ? (
                            <input
                              type="text"
                              placeholder="በኮማ፦ 50፣52፣48"
                              required
                              value={item.rawWeightsInput || ''}
                              onChange={e => handleCargoChange(index, 'rawWeightsInput', e.target.value)}
                              style={{ flex: '2.5', minWidth: '180px', padding: '8px 12px', border: '2px solid #1e3a8a', borderRadius: '4px', height: '40px', boxSizing: 'border-box', fontSize: '14px', backgroundColor: '#f0fdf4' }}
                            />
                          ) : (
                            <input
                              className="num-input"
                              type="number"
                              inputMode="decimal"
                              placeholder="ኪሎ"
                              // required
                              value={item.weight || ''}
                              onChange={e => handleCargoChange(index, 'weight', e.target.value)}
                              style={{ flex: '1', minWidth: '80px', padding: '8px 12px', border: '1px solid #94a3b8', borderRadius: '4px', height: '40px', boxSizing: 'border-box', fontSize: '14px' }}
                            />
                          )}

                          <select
                            value={item.loaderType}
                            onChange={e => toggleLoadedStatus(index, e.target.value as any)}
                            style={{ flex: '1.2', minWidth: '130px', padding: '8px', border: '1px solid #94a3b8', backgroundColor: item.isLoaded ? '#dcfce7' : '#f3f4f6', color: item.isLoaded ? '#15803d' : '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', height: '40px', fontSize: '13px' }}
                          >
                            <option value="">⏳ አልተጫነም</option>
                            <option value="መኪናው ጭኖት የመጣው">🚛 መኪናው ጭኖት የመጣው</option>
                            <option value="የውጭ ጫኝ ያወረደው">👷 የውጭ ጫኝ ያወረደው</option>
                            <option value="የመጋዘን ልጆች የጫኑት">📦 የመጋዘን ልጆች የጫኑት</option>
                          </select>

                          <select
                            value={item.category}
                            onChange={e => handleCargoChange(index, 'category', e.target.value as any)}
                            style={{ width: '80px', padding: '8px', border: '1px solid #94a3b8', backgroundColor: '#fff', fontWeight: 'bold', borderRadius: '4px', height: '40px', fontSize: '13px' }}
                          >
                            <option value="ደረቅ">ደረቅ</option>
                            <option value="ለጠፍ">ለጠፍ</option>
                          </select>

                          {cargoList.length > 1 && (
                            <button type="button" className="tap-btn" onClick={() => removeCargoRow(item.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', height: '40px' }}>X</button>
                          )}
                        </div>

                        {item.isMultiPackage && item.packages && item.packages.length > 0 && (
                          <div style={{ width: '100%', marginTop: '-3px', marginBottom: '10px', fontSize: '12px', color: '#166534', fontWeight: 'bold', paddingLeft: '8px' }}>
                            👉 ጠቅላላ ተለይተው የተመዘገቡ እሽጎች፦ <span style={{ backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '4px' }}>{item.packages.length} ኬሻ (ጠቅላላ ክብደት፦ {item.weight} ኪ.ግ)</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <button type="button" className="tap-btn" onClick={addCargoRow} style={{ padding: '10px 20px', backgroundColor: '#1e2530', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ➕ አዲስ እቃ ጨምር
                    </button>
                  </div>
                </div>
              </div>

              {/* ➡️ የቀኝ አምድ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>
                    የእቃው ባለቤት ስልክ ቁጥር
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="09........"
                      value={formData.merchantPhone}
                      onChange={e => setFormData({...formData, merchantPhone: e.target.value})}
                      style={{ width: '100%', padding: '10px 45px 10px 10px', border: '1px solid #94a3b8', borderRadius: '4px', backgroundColor: '#fff', boxSizing: 'border-box', height: '42px', fontSize: '14px' }}
                    />
                    <button
                      type="button"
                      className="tap-btn"
                      onClick={() => setShowDirectory(true)}
                      style={{ position: 'absolute', right: '5px', padding: '4px 8px', cursor: 'pointer' }}
                    >
                      📖
                    </button>

                  </div>
                  {/* ✅ VCF የሚያነበው ሞዳል */}
                  {showDirectory && (
                    <ContactDirectoryModal
                      vcfRawData={VCF_DATA}
                      onClose={() => setShowDirectory(false)}
                      onSelectContact={(contact: any) => {
                        const phone = typeof contact === 'object' ? (contact.phone || contact.tel) : contact;
                        const name = typeof contact === 'object' ? (contact.name || contact.fn) : '';

                        setFormData(prev => ({
                          ...prev,
                          merchantPhone: phone || '',
                          ...(name ? { merchantName: name } : {})
                        }));

                        setShowDirectory(false);
                      }}
                    />
                  )}

                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>አጠቃላይ ክብደት (ኪ.ግ)</label>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: '4px', border: '1px solid #94a3b8', padding: '10px', height: '42px', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{totalWeight} ኪ.ግ</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#1e3a8a' }}>ያስረካቢ ስም *</label>
                  <input
                    type="text"
                    required
                    value={formData.senderName}
                    onChange={e => setFormData({...formData, senderName: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #94a3b8', borderRadius: '4px', backgroundColor: '#fff', boxSizing: 'border-box', height: '42px', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#1e3a8a' }}>ያስረካቢ ስልክ </label>
                  <input
                    type="text"
                    placeholder="09........"
                    value={formData.senderPhone}
                    onChange={e => setFormData({...formData, senderPhone: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #94a3b8', borderRadius: '4px', backgroundColor: '#fff', boxSizing: 'border-box', height: '42px', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>የተረካቢ ሰራተኛ ስም *</label>
                  <input
                    type="text"
                    required
                    value={formData.receiverName}
                    onChange={e => setFormData({...formData, receiverName: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #94a3b8', borderRadius: '4px', backgroundColor: '#fff', boxSizing: 'border-box', height: '42px', fontSize: '14px' }}
                  />
                </div>
              </div>

            </div>

            <div className="bottom-bar-layout" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', marginTop: '20px' }}>

           <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
  <span style={{ position: 'absolute', left: '10px', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>ET</span>
  <input
    type="text"
    placeholder="AA:B00000"
    value={carPlate}
    onChange={e => setCarPlate(e.target.value.toUpperCase())}
    style={{ width: '100%', padding: '10px 10px 10px 30px', border: '2px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', boxSizing: 'border-box', height: '42px' }}
  />
</div>

{/* 📋 በአስጫኙ በኩል በአሁኑ ሰዓት የተመዘገቡ ንቁ ታርጋዎች (ለማወቅ ብቻ - ምርጫ አይደለም) */}
<div style={{ marginTop: '4px', fontSize: '10.5px', color: '#64748b' }}>
  {activeTruckPlates.length === 0 ? (
    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>🚫 መኪና የለም</span>
  ) : (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
      <span style={{ fontWeight: 'bold', color: '#475569' }}>🚛 የተመዘገቡ፦</span>
      {activeTruckPlates.map(t => (
        <span key={t.plateNumber} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
          ET {t.plateNumber} ({t.truckType || '—'})
        </span>
      ))}
    </div>
  )}
</div>

              <button
                type="submit"
                className="tap-btn"
                disabled={!isPrinted}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: isPrinted ? 'pointer' : 'not-allowed',
                  backgroundColor: isPrinted ? '#059669' : '#64748b',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '15px'
                }}
              >
                💾 መረጃውን መዝግብ
              </button>
            </div>
          </form>
        </div>

        {/* 🧾 POS Print Preview */}
        {isFormStarted && (
          <div className="preview-outer-card" style={{ border: '1px solid #cbd5e1', maxWidth: '1350px', margin: '20px auto 0 auto', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>

            {/* የማተሚያ አዝራር */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>🖨️ የPOS ማተሚያ ቅድመ-ዕይታ</h3>
              <button className="tap-btn" onClick={handlePrint} style={{ padding: '10px 22px', backgroundColor: '#0f172a', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }}>
                🖨️ ትኬት ፕሪንት
              </button>
            </div>

            {/* 🎯 የህትመት ክልል */}
            <div className="pos-print-area" style={{ display: 'flex', justifyContent: 'center', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
              <div
                ref={printRef}
                style={{
                  width: '80mm',
                  backgroundColor: '#fff',
                  padding: '10px 8px',
                  border: '1px dashed #666',
                  fontFamily: 'sans-serif',
                  color: '#000',
                  fontSize: '11px',
                  boxSizing: 'border-box',
                  pageBreakAfter: 'avoid',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}
              >

                {/* HEADER */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid #1e293b',
                  paddingBottom: '6px',
                  marginBottom: '8px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {/* 1. 👈 ሎጎ */}
                  <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-start' }}>
                    <img
                      src="/logo3.jpg"
                      alt="Logo"
                      style={{
                        width: '100%',
                        maxWidth: '60px',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  </div>

                  {/* 2. 🎯 የመሃል አርእስት */}
                  <div style={{ flex: '2', textAlign: 'center', padding: '0 2px' }}>
                    <div style={{ fontWeight: '900', fontSize: '12px', color: '#166534', lineHeight: '1.2' }}>
                      ሰንሰለት የደረቅ ጭነት
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#15803d', marginTop: '1px' }}>
                      አገልግሎት መስጫ ድርጅት
                    </div>
                    <div style={{ fontSize: '8px', fontWeight: '700', color: '#475569', marginTop: '1px' }}>
                      Senselet Dry Cargo Services
                    </div>
                  </div>

                  {/* 3. 👉 አድራሻ እና ስልክ */}
                  <div style={{ flex: '1', textAlign: 'right', fontSize: '7.5px', lineHeight: '1.2', fontWeight: '700', color: '#0f172a' }}>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#dc2626' }}>📍</span> <strong>አድራሻ፦</strong> መርካቶ ምዕራብ ሆቴል
                    </div>
                    <div style={{ color: '#334155', fontSize: '7px', whiteSpace: 'nowrap' }}>
                      ዝቅ ብሎ ሃጂ ቱሬ ህንጻ ጎን
                    </div>
                    <div style={{ color: '#166534', fontWeight: '800', fontSize: '7px', whiteSpace: 'nowrap' }}>
                      ሰንሰለት (ይመኔ) መጋዘን
                    </div>
                    <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px', fontFamily: 'monospace', fontSize: '8px', fontWeight: 'bold', color: '#0284c7' }}>
                      <span>📞 0900972959</span>
                      <span>📞 0962388542</span>
                    </div>
                  </div>
                </div>

                {/* 🎯 የደረሰኝ ቁጥር እና ቀን */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>
                  <span>{receiptNo}</span>
                  {carPlate && <span style={{ border: '1px solid #000', padding: '1px 3px', borderRadius: '2px' }}>ታርጋ፦ {carPlate}</span>}
                  <div style={{ textAlign: 'right' }}>
                    <div>ቀን፦ {currentDateTime.ethDate}</div>
                    <div style={{ fontSize: '7.5px', color: '#555' }}>({currentDateTime.gregDate})</div>
                  </div>
                </div>

                {/* የባለቤት መረጃ */}
                <div style={{ marginBottom: '3px', fontSize: '10.5px' }}><strong>የባለቤት ስም፦</strong> {formData.merchantName || '-'}</div>
                <div style={{ marginBottom: '6px', fontSize: '10.5px' }}><strong>ስልክ፦</strong> {formData.merchantPhone || '-'}</div>

                {/* 4. የእቃ ዝርዝር እና ኪሎ */}
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}>የእቃ ዝርዝር እና ኪሎ፦</div>
                <div style={{ borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '8px' }}>
                  {cargoList.map((item) => (
                    <div key={item.id} style={{ marginBottom: '4px', borderBottom: item.isMultiPackage ? '1px dotted #e2e8f0' : 'none', paddingBottom: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10.5px' }}>
                        <span>• {item.description || '...'}</span>
                        <span>{item.weight ? `${item.weight} ኪ.ግ` : '-'}</span>
                      </div>

                      {item.isMultiPackage && item.packages && (
                        <div style={{ paddingLeft: '6px', fontSize: '9px', color: '#333', display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                          {item.packages.map(p => (
                            <span key={p.id} style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                              ኬሻ #{p.packageNo}: {p.weight}kg
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: '9px', color: '#555', paddingLeft: '6px', fontStyle: 'italic', marginTop: '1px' }}>
                        ሁኔታ፦ {item.isLoaded ? `${item.loaderType}` : '⏳ አልተጫነም'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 5. ጠቅላላ ክብደት */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '12px', marginBottom: '10px' }}>
                  <span>ጠቅላላ ክብደት፦</span>
                  <span>{totalWeight} ኪ.ግ</span>
                </div>

                {/* 6. ያስረካቢ እና ተረካቢ */}
                <div style={{ borderTop: '1px solid #eee', paddingTop: '6px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div><strong>ያስረካቢ ስም፦</strong> {formData.senderName || '-'}</div>
                  <div><strong>ያስረካቢ ስልክ፦</strong> {formData.senderPhone || '-'}</div>
                  <div><strong>የተረካቢ ስም፦</strong> {formData.receiverName || '-'}</div>
                </div>

                {/* 7. የምስጋና ጽሁፍ */}
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', fontWeight: 'bold' }}>
                  * ስለመረጡን እናመሰግናለን ! ሰንሰለት *
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}