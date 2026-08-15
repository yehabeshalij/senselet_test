import React, { useState, useEffect, useCallback } from 'react';
import MerchantStatusCenter from './MerchantStatusCenter';
import { LOADING_API_BASE as API_BASE } from '../config/api';

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
const apiPatch = (path: string, body?: any) => apiCall(path, { method: 'PATCH', body: JSON.stringify(body || {}) });
const apiPost = (path: string, body?: any) => apiCall(path, { method: 'POST', body: JSON.stringify(body || {}) });

// =====================================================================
// 📦 Types
// =====================================================================
interface RemainingPackage { id: string; packageNo: number; weight: number; }
interface WarehouseRow {
  id: string;
  receiptNo: string;
  dateIn: string;
  merchantName: string;
  merchantPhone: string;
  description: string;
  category: 'ደረቅ' | 'ለጠፍ';
  isMultiPackage: boolean;
  weight: number;
  remainingPackages: RemainingPackage[];
  shortageReason?: string | null;
  intakeLoaderType?: string | null;
  intakeCarPlate?: string | null;
}
interface TruckBase {
  id: string; plateNumber: string; truckType: string; driverName: string; driverPhone: string;
  ownerName: string; ownerPhone: string; loaderStaff: string; isSaved: boolean; isVerified: boolean;
  gateRate: number; truckRate: number; completionDate?: string | null; loadedWeight?: number;
}

const WAREHOUSE_PAGE_SIZE = 500; // 👈 "ሙሉ በሙሉ" ማሳየት ስለሚያስፈልግ ትልቅ ገደብ (pagination አያስፈልገውም)
function getEthiopianDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export default function OfficeAdmin() {
//   const [activeTab, setActiveTab] = useState<'a1' | 'a2' | 'a3' | 'a4'>('a1');
const [activeTab, setActiveTab] = useState<'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7'>('a1');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={{ padding: '15px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header */}

       <div style={{ maxWidth: '1400px', margin: '0 auto 15px auto', backgroundColor: '#0f172a', color: '#fff', padding: '15px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 🆕 ሎጎው ሰፋ ብሎ (ያለ ተጨማሪ ሄደር) */}
              <img
                src="/logo11.jpg"
                alt="የድርጅቱ ሎጎ"
                style={{ width: '110px', height: '80px', objectFit: 'fill' }}
              />
              <h1 style={{ margin: 0, fontSize: '13px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                <span style={{ fontSize: '24px' }}>ሰንሰለት የደረቅ ጭነት አገልግሎት መስጫ<br/></span>
                ሁሉንም የጭነት እንቅስቃሴዎች መከታተያ እና መቆጣጠሪያ ገጽ
              </h1>
            </div>
          </div>
      </div>

      <div style={{ maxWidth: '1500px', margin: '0 auto', display: 'flex', gap: '15px', alignItems: 'flex-start' }} className="oa-main-layout">
        {/* Left Sidebar */}
        <div className="oa-sidebar" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: sidebarCollapsed ? '56px' : '210px', width: sidebarCollapsed ? '56px' : 'auto', position: 'sticky', top: '15px', transition: 'min-width 0.2s ease, width 0.2s ease' }}>
  <button onClick={() => setSidebarCollapsed(p => !p)} title={sidebarCollapsed ? 'ማስፋት' : 'ማጥበብ'}
    style={{ padding: '8px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '9px', marginBottom: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    {sidebarCollapsed ? '➡️' : '⬅️'}
  </button>
 {[
  { key: 'a1', label: '📊 1. የመጋዘን እቃዎች መከታተያ', icon: '📊', color: '#2563eb' },
  { key: 'a2', label: '↩️ 2. ተጭኖ ያለቀ ፋይል', icon: '↩️', color: '#d97706' },
  { key: 'a3', label: '👁️ 3. እየተጫነ ያለ መከታተያ', icon: '👁️', color: '#0891b2' },
  { key: 'a4', label: '🗄️ 4. ፋይል ማስቀመጫ ማህደር', icon: '🗄️', color: '#10b981' },
  { key: 'a5', label: '📱 5. SMS ክትትል', icon: '📱', color: '#7c3aed' },
  { key: 'a6', label: '📁 6. የመኪና ሂሳብ ፋይሎች', icon: '📁', color: '#0d9488' },
  { key: 'a7', label: '💰 7. ገቢ/ወጪ (በቅርቡ)', icon: '💰', color: '#64748b' },
].map(t => (
    <button key={t.key} onClick={() => setActiveTab(t.key as any)} title={t.label}
      style={{ padding: sidebarCollapsed ? '11px 0' : '11px 14px', backgroundColor: activeTab === t.key ? t.color : '#f8fafc', color: activeTab === t.key ? '#fff' : '#334155', border: activeTab === t.key ? 'none' : '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: sidebarCollapsed ? '16px' : '13px', textAlign: sidebarCollapsed ? 'center' : 'left', transition: 'all 0.15s ease', boxShadow: activeTab === t.key ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none' }}>
      {sidebarCollapsed ? t.icon : t.label}
    </button>
  ))}
</div>
       

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
         {activeTab === 'a1' && <Achievement1 />}
{activeTab === 'a2' && <Achievement2 />}
{activeTab === 'a3' && <Achievement3 />}
{activeTab === 'a4' && <Achievement4 />}
{activeTab === 'a5' && <MerchantStatusCenter />}
{activeTab === 'a6' && <Achievement6 />}
{activeTab === 'a7' && <PlaceholderTab title="💰 7. ገቢ እና ወጪ መቆጣጠሪያ" note=" Comming soon ...... የድርጅቱን ገቢ/ወጪ እና ዳታ የሚሰበሰብበት ገጽ ።" />}
        </div>
      </div>

      <style>{`
        .oa-dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        @media (max-width: 1200px) { .oa-dashboard-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .oa-dashboard-grid { grid-template-columns: 1fr; } }
        .archive-payout-grid { display: grid; grid-template-columns: 1.7fr 1.1fr; gap: 20px; }
        @media (max-width: 1200px) { .archive-payout-grid { grid-template-columns: 1fr; } }
        @media (max-width: 900px) {
          .oa-main-layout { flex-direction: column; }
          .oa-sidebar { min-width: 100%; flex-direction: row !important; overflow-x: auto; position: static !important; }
          .oa-sidebar button { white-space: nowrap; }
        }
      `}</style>
    </div>
  );
}


function Achievement1() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const showApiError = (e: any) => showToast(`❌ ${e?.message || 'ስህተት ተፈጥሯል'}`, 'error');

  const [activeTrucks, setActiveTrucks] = useState<TruckBase[]>([]);
  const [selectedTruckIndex, setSelectedTruckIndex] = useState(0);
  const activeTruck = activeTrucks[selectedTruckIndex] || null;

  const fetchActiveTrucks = useCallback(async (silent: boolean = false) => {
    try {
      const res = await apiGet('/trucks?status=ACTIVE');
      setActiveTrucks(res.data);
      setSelectedTruckIndex(idx => Math.min(idx, Math.max(0, res.data.length - 1)));
    } catch (e) { if (!silent) showApiError(e); }
  }, []);
  useEffect(() => { fetchActiveTrucks(); }, [fetchActiveTrucks]);

  const [dashboardStats, setDashboardStats] = useState({
    warehouseDerek: 0, warehouseLetef: 0, truckDerek: 0, truckLetef: 0,
    externalDerek: 0, externalLetef: 0, loadedDerek: 0, loadedLetef: 0, totalLoadedWeight: 0
  });
  const fetchDashboardStats = useCallback(async (truckId: string, silent: boolean = false) => {
    try {
      const res = await apiGet(`/dashboard-stats/${truckId}`);
      setDashboardStats(res.data);
    } catch (e) { if (!silent) showApiError(e); }
  }, []);
  useEffect(() => {
    if (activeTruck?.id) fetchDashboardStats(activeTruck.id, true);
  }, [activeTruck?.id, fetchDashboardStats]);

  // ---------- መጋዘን ያሉ እቃዎች (search + pagination) ----------
  const A1_PAGE_SIZE = 25;
  const [warehouseRows, setWarehouseRows] = useState<WarehouseRow[]>([]);
  const [warehouseTotal, setWarehouseTotal] = useState(0);
  const [warehouseTotalPages, setWarehouseTotalPages] = useState(1);
  const [warehousePage, setWarehousePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  const fetchWarehouseItems = useCallback(async (page: number, search: string, silent: boolean = false) => {
    if (!silent) setWarehouseLoading(true);
    try {
      const res = await apiGet(`/warehouse-items?page=${page}&pageSize=${A1_PAGE_SIZE}&search=${encodeURIComponent(search)}`);
      setWarehouseRows(res.data);
      setWarehouseTotal(res.total);
      setWarehouseTotalPages(res.totalPages);
    } catch (e) { if (!silent) showApiError(e); }
    finally { if (!silent) setWarehouseLoading(false); }
  }, []);

  useEffect(() => { fetchWarehouseItems(warehousePage, searchQuery); }, [warehousePage]);
  // 🔍 search ገባ ቁጥር ገጹን ወደ 1 መልሶ ትንሽ delay ጠብቆ ይፈልጋል
  useEffect(() => {
    const t = setTimeout(() => { setWarehousePage(1); fetchWarehouseItems(1, searchQuery); }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWarehouseItems(warehousePage, searchQuery, true);
      fetchActiveTrucks(true);
      if (activeTruck?.id) fetchDashboardStats(activeTruck.id, true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchWarehouseItems, warehousePage, searchQuery, fetchActiveTrucks, activeTruck?.id, fetchDashboardStats]);

  const handleCategoryChange = async (itemId: string, newCategory: 'ለጠፍ' | 'ደረቅ') => {
    setWarehouseRows(prev => prev.map(r => r.id === itemId ? { ...r, category: newCategory } : r));
    try {
      await apiPatch(`/cargo-items/${itemId}`, { category: newCategory });
      showToast('✔️ ምድብ ተስተካክሏል', 'success');
    } catch (e) {
      showApiError(e);
      fetchWarehouseItems(warehousePage, searchQuery);
    }
  };

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
      {/* ዳሽቦርድ */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '18px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span> መጋዘን ያሉን እና የተጫኑ እቃዎች መቆጣጠሪያ ዳሽቦርድ
          </h4>
          {activeTrucks.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {activeTrucks.map((t, idx) => (
                <button key={t.id} onClick={() => setSelectedTruckIndex(idx)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: idx === selectedTruckIndex ? '2px solid #d97706' : '1px solid #cbd5e1', backgroundColor: idx === selectedTruckIndex ? '#fffbeb' : '#fff', fontSize: '11px', fontWeight: 'bold', color: idx === selectedTruckIndex ? '#92400e' : '#475569', cursor: 'pointer' }}>
                  🚗 {t.plateNumber ? `ET ${t.plateNumber}` : 'ታርጋ የለም'} <span style={{ opacity: 0.7 }}>({t.loaderStaff})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!activeTruck ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>⏳ Loading ....</p>
        ) : (
          <div className="oa-dashboard-grid">
            <DashCard color="#d97706" bg="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" icon="📦" title="መጋዘን የቀሩ / የተመለሱ"
              letef={dashboardStats.warehouseLetef} derek={dashboardStats.warehouseDerek}
              footerLabel="ጠቅላላ ቀሪ ድምር" footerValue={`${dashboardStats.warehouseLetef + dashboardStats.warehouseDerek} ኪ.ግ`} footerColor="#d97706"
              extra={`አጠቃላይ ኩንታል፦ ${(((dashboardStats.warehouseLetef + dashboardStats.warehouseDerek) + dashboardStats.totalLoadedWeight) / 100).toFixed(2)} ኩ.ል`} />
            <DashCard color="#0891b2" bg="linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)" icon="📥" title="መኪናው ጭኖት የመጣው (ትራንዚት)"
              letef={dashboardStats.truckLetef} derek={dashboardStats.truckDerek} />
            <DashCard color="#4f46e5" bg="linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" icon="👥" title="ከውጭ ጫኞች የተጫነ (ኮንትራት)"
              letef={dashboardStats.externalLetef} derek={dashboardStats.externalDerek} />
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '15px', borderRadius: '12px', borderLeft: '6px solid #10b981', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '64px', opacity: 0.05 }}>🧮</div>
              <div>
                <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><span>🧮</span> ጠቅላላ የተጫነ ክብደት</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  <Row label="ለጠፍ ድምር" value={`${dashboardStats.loadedLetef} ኪ.ግ`} dark />
                  <Row label="ደረቅ ድምር" value={`${dashboardStats.loadedDerek} ኪ.ግ`} dark />
                </div>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>ጠቅላላ የተጫነ ድምር</span>
                <span style={{ backgroundColor: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '900' }}>{dashboardStats.totalLoadedWeight} ኪ.ግ</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* የመኪና መረጃ */}
      {activeTruck && (
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚛</span> እየተጫነ ያለ የመኪና መረጃ
            <span style={{ fontSize: '11px', color: activeTruck.isSaved ? '#16a34a' : '#d97706', fontWeight: 'bold', backgroundColor: activeTruck.isSaved ? '#dcfce7' : '#fffbeb', padding: '3px 10px', borderRadius: '20px' }}>
              {activeTruck.isSaved ? '● ተመዝግቧል' : '● ገና አልተመዘገበም'}
            </span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
            <InfoBox label="🚛 ታርጋ" value={activeTruck.plateNumber ? `ET ${activeTruck.plateNumber}` : '-'} />
            <InfoBox label="🚚 አይነት" value={activeTruck.truckType || '-'} />
            <InfoBox label="👤 ሹፌር" value={activeTruck.driverName || '-'} />
            <InfoBox label="📞 ሹፌር ስልክ" value={activeTruck.driverPhone || '-'} />
            <InfoBox label="🧑‍💼 ባለሀብት" value={activeTruck.ownerName || '-'} />
            <InfoBox label="📞 ባለሀብት ስልክ" value={activeTruck.ownerPhone || '-'} />
            <InfoBox label="👷 አስጫኝ" value={activeTruck.loaderStaff || '-'} />
            <InfoBox label="⚖️ ጭነት" value={`${activeTruck.loadedWeight || 0} ኪ.ግ`} highlight />
          </div>
        </div>
      )}

      {/* ሙሉ pending warehouse items */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '2px solid #0f172a', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>📦 መጋዘን ያሉ እቃዎች (ያልተጫነ እቃ ያላቸው ነጋዴዎች ብቻ)</h3>
          <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' }}>⚠️ ጠቅላላ ብዛት፦ {warehouseTotal} እቃ</span>
        </div>

        {/* 🔍 Search box */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', width: '100%', maxWidth: '360px', marginBottom: '14px' }}>
          <span style={{ marginRight: '8px', fontSize: '14px', color: '#64748b' }}>🔍</span>
          {/* <input type="text" placeholder="የነጋዴ ስም ወይም ስልክ ፈልግ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} */}
         <input type="text" placeholder="የነጋዴ ስም፣ ስልክ ወይም ደረሰኝ ቁጥር ፈልግ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#1e293b' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}>&times;</button>}
        </div>
       

        {warehouseLoading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>⏳ Loading ...</p>
        ) : warehouseRows.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#16a34a', padding: '30px', fontWeight: 'bold', fontStyle: 'italic', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>🎉 ምንም አልተገኘም ወይም ሁሉም እቃዎች ተጭነው አልቀዋል!</p>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '980px', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '32px', textAlign: 'center' }}>ተ.ቁ</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '58px' }}>ቀን</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '58px' }}>ደረሰኝ</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '90px' }}>ስም</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '80px' }}>ስልክ</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b' }}>የእቃ መግለጫ</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '45px' }}>ኪ.ግ</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '75px' }}>ምድብ ✏️</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #1e293b', width: '150px' }}>ማን ጫነው? 🔒</th>
                </tr>
              </thead>
              <tbody>
                {warehouseRows.map((item, idxOnPage) => {
                  const rowIndex = (warehousePage - 1) * A1_PAGE_SIZE + idxOnPage;
                  return (
                    <tr key={item.id} style={{ backgroundColor: idxOnPage % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 4px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '11px' }}>{rowIndex + 1}</td>
                      <td style={{ padding: '8px 4px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '10px' }}>{item.dateIn}</td>
                      <td style={{ padding: '8px 4px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e3a8a', fontSize: '10px' }}>{item.receiptNo}</td>
                      <td style={{ padding: '8px 4px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b', fontSize: '11px', wordBreak: 'break-word' }}>👤 {item.merchantName}</td>
                      <td style={{ padding: '8px 4px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '10.5px', wordBreak: 'break-word' }}>{item.merchantPhone}</td>
                      <td style={{ padding: '8px 8px', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '12.5px', lineHeight: '1.4' }}>
                        📦 {item.description}
                        {item.isMultiPackage && <span style={{ display: 'inline-block', marginLeft: '6px', fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '10px' }}>Multi-Pack</span>}
                        {item.shortageReason && <div style={{ marginTop: '3px', fontSize: '9.5px', color: '#b45309', fontWeight: 'bold' }}>⚠️ {item.shortageReason}</div>}
                      </td>
                      <td style={{ padding: '8px 4px', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}>{item.weight}</td>
                      <td style={{ padding: '8px 4px', border: '1px solid #e2e8f0' }}>
                        <select value={item.category} onChange={e => handleCategoryChange(item.id, e.target.value as 'ለጠፍ' | 'ደረቅ')}
                          style={{ padding: '5px 4px', fontWeight: 'bold', fontSize: '11px', border: '1px solid #0f172a', borderRadius: '4px', backgroundColor: item.category === 'ለጠፍ' ? '#dbeafe' : '#f3f4f6', color: item.category === 'ለጠፍ' ? '#1e40af' : '#1f2937', cursor: 'pointer', width: '100%' }}>
                          <option value="ደረቅ">ደረቅ</option>
                          <option value="ለጠፍ">ለጠፍ</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 4px', border: '1px solid #e2e8f0', fontSize: '10.5px', color: '#64748b' }}>
                        {(item.intakeLoaderType === 'የውጭ ጫኝ ያወረደው' || item.intakeLoaderType === 'የመጋዘን ልጆች የጫኑት') ? (
                          <span style={{ color: '#0369a1', fontWeight: 'bold' }}>🚛 {item.intakeLoaderType}{item.intakeCarPlate ? ` (ET ${item.intakeCarPlate})` : ''}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-- ገና አልተወሰነም --</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {warehouseTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
            <button onClick={() => setWarehousePage(p => Math.max(1, p - 1))} disabled={warehousePage === 1}
              style={{ padding: '8px 16px', backgroundColor: warehousePage === 1 ? '#e2e8f0' : '#0f172a', color: warehousePage === 1 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: warehousePage === 1 ? 'not-allowed' : 'pointer' }}>⬅️ ቀዳሚ</button>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ገጽ {warehousePage} / {warehouseTotalPages}</span>
            <button onClick={() => setWarehousePage(p => Math.min(warehouseTotalPages, p + 1))} disabled={warehousePage === warehouseTotalPages}
              style={{ padding: '8px 16px', backgroundColor: warehousePage === warehouseTotalPages ? '#e2e8f0' : '#0f172a', color: warehousePage === warehouseTotalPages ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: warehousePage === warehouseTotalPages ? 'not-allowed' : 'pointer' }}>ቀጣይ ➡️</button>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#2563eb', color: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 99999, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{toast.type === 'success' ? '✔️' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 🧩 እርዳታ Components
// =====================================================================
function Row({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', padding: '5px 10px', borderRadius: '8px' }}>
      <span style={{ fontSize: '12px', color: dark ? '#cbd5e1' : '#4b5563', fontWeight: '600' }}>{label}</span>
      <span style={{ fontSize: '14px', color: dark ? '#34d399' : '#1e293b', fontWeight: '800' }}>{value}</span>
    </div>
  );
}

function DashCard({ color, bg, icon, title, letef, derek, footerLabel, footerValue, footerColor, extra }: any) {
  return (
    <div style={{ background: bg, padding: '15px', borderRadius: '12px', borderLeft: `6px solid ${color}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '64px', opacity: 0.1 }}>{icon}</div>
      <div>
        <span style={{ fontSize: '12px', color, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><span>{icon}</span> {title}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          <Row label="ለጠፍ" value={`${letef} ኪ.ግ`} />
          <Row label="ደረቅ" value={`${derek} ኪ.ግ`} />
        </div>
      </div>
      {footerLabel && (
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${color}33`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color, fontWeight: '600' }}>{footerLabel}</span>
            <span style={{ backgroundColor: footerColor, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '900' }}>{footerValue}</span>
          </div>
          {extra && <span style={{ fontSize: '10px', color, fontWeight: '700', textAlign: 'right' }}>{extra}</span>}
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ backgroundColor: highlight ? '#f0fdf4' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: '800', color: highlight ? '#16a34a' : '#1e293b' }}>{value}</div>
    </div>
  );
}




interface LoadedRow2 { merchantName: string; merchantPhone: string; itemsText: string[]; dryWeight: number; letefWeight: number; loadingIds: string[]; }
interface LoadingDetail2 { id: string; description: string; weight: number; category: 'ደረቅ' | 'ለጠፍ'; }
interface TruckSummary2 { truck: TruckBase; loadedRows: LoadedRow2[]; loadingsDetail: LoadingDetail2[]; totalDry: number; totalLetef: number; grandTotal: number; }
interface TruckAccountData { totalRevenue: number; truckPayment: number; commission: number; remaining: number; grandTotal: number; }

const ARCHIVES_PAGE_SIZE_A2 = 10;

function Achievement2() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const showApiError = (e: any) => showToast(`❌ ${e?.message || 'ስህተት ተፈጥሯል'}`, 'error');

  const [archivedTrucks, setArchivedTrucks] = useState<TruckBase[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<{ [id: string]: TruckSummary2 }>({});
  const [loadingList, setLoadingList] = useState(false);
  const [accounts, setAccounts] = useState<{ [id: string]: TruckAccountData }>({});
const fetchAccount = async (truckId: string) => {
  try {
    const res = await apiGet(`/trucks/${truckId}/account`);
    setAccounts(prev => ({ ...prev, [truckId]: res.data }));
  } catch (e) { showApiError(e); }
};

const updateAccountField = async (truckId: string, field: 'totalRevenue' | 'truckPayment', value: number) => {
  // ⚡ ወዲያውኑ በስክሪኑ ላይ እናዘምናለን (optimistic) ከዛ ወደ ሰርቨር እንልካለን
  setAccounts(prev => {
    const current = prev[truckId] || { totalRevenue: 0, truckPayment: 0, commission: 0, remaining: 0, grandTotal: 0 };
    const updated = { ...current, [field]: value };
    const commission = Number((updated.truckPayment * 0.10).toFixed(2));
    const remaining = Number((updated.totalRevenue - updated.truckPayment).toFixed(2));
    const grandTotal = Number((remaining + commission).toFixed(2));
    return { ...prev, [truckId]: { ...updated, commission, remaining, grandTotal } };
  });
};

const saveAccountField = async (truckId: string, field: 'totalRevenue' | 'truckPayment', value: number) => {
  try {
    const res = await apiPatch(`/trucks/${truckId}/account`, { [field]: value });
    setAccounts(prev => ({ ...prev, [truckId]: res.data }));
  } catch (e) { showApiError(e); }
};

  const fetchArchived = useCallback(async (p: number, search: string) => {
    setLoadingList(true);
    try {
      const res = await apiGet(`/trucks?status=ARCHIVED&search=${encodeURIComponent(search)}&page=${p}&pageSize=${ARCHIVES_PAGE_SIZE_A2}`);
      setArchivedTrucks(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) { showApiError(e); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { fetchArchived(page, searchQuery); }, [page, fetchArchived]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchArchived(1, searchQuery); }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, fetchArchived]);

  const fetchSummary = async (truckId: string, silent: boolean = false) => {
    try {
      const res = await apiGet(`/trucks/${truckId}/summary`);
      setSummaries(prev => ({ ...prev, [truckId]: res.data }));
    } catch (e) { if (!silent) showApiError(e); }
  };

const toggleExpand = async (truckId: string) => {
  if (expandedId === truckId) { setExpandedId(null); return; }
  setExpandedId(truckId);
  if (!summaries[truckId]) await fetchSummary(truckId);
  if (!accounts[truckId]) await fetchAccount(truckId);
};

  // ---------- ማውረጃ modal (ልክ እንደ LoadingController) ----------
  const [unloadModal, setUnloadModal] = useState<{ isOpen: boolean; truckId: string; merchantName: string; items: LoadingDetail2[] }>({ isOpen: false, truckId: '', merchantName: '', items: [] });

  const openUnloadModal = (truckId: string, row: LoadedRow2) => {
    const summary = summaries[truckId];
    if (!summary) return;
    const items = summary.loadingsDetail.filter(l => row.loadingIds.includes(l.id));
    setUnloadModal({ isOpen: true, truckId, merchantName: row.merchantName, items });
  };

  const handleAdminUnload = async (loadingId: string) => {
    try {
      await apiPost(`/loadings/${loadingId}/unload`);
      showToast('↩️ እቃው በተሳካ ሁኔታ ወደ መጋዘን ተመልሷል!', 'info');
      setUnloadModal(prev => {
        const remaining = prev.items.filter(i => i.id !== loadingId);
        return remaining.length === 0 ? { isOpen: false, truckId: '', merchantName: '', items: [] } : { ...prev, items: remaining };
      });
      await fetchSummary(unloadModal.truckId, true);
      fetchArchived(page, searchQuery);
    } catch (e) { showApiError(e); }
  };

 // ---------- Excel Export (ካንተ ማንዋል ፎርማት ጋር የሚመሳሰል) ----------
const handleExportExcel = async (truck: TruckBase) => {
  try {
    const res = await fetch(`${API_BASE}/trucks/${truck.id}/export-excel`);
    if (!res.ok) throw new Error('ፋይሉን ማምጣት አልተቻለም');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // link.download = `${truck.plateNumber || 'truck'}.xlsx`;
    const completionDateStr = truck.completionDate ? new Date(truck.completionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
link.download = `ET${(truck.plateNumber || 'truck').replace(/[^a-zA-Z0-9]/g, '')}_${completionDateStr}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📊 ፋይሉ ወርዷል!', 'success');
  } catch (e: any) {
    showToast(`❌ ${e?.message || 'ፋይሉን ማውረድ አልተቻለም'}`, 'error');
  }
};

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', paddingBottom: '15px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>↩️ ተጭነው ያለቁ መኪናዎች ፋይል </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>ተጭነው የተጠናቀቁ ፋይሎች </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 12px', width: '100%', maxWidth: '320px' }}>
          <span style={{ marginRight: '8px', fontSize: '14px', color: '#64748b' }}>🔍</span>
          <input type="text" placeholder="ታርጋ፣ ሹፌር፣ አስጫኝ፣ ነጋዴ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#1e293b' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}>&times;</button>}
        </div>
      </div>

      {loadingList ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>⏳ Loading ...</p>
      ) : archivedTrucks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>🗄️</span>
          <p style={{ fontWeight: 'bold', fontSize: '16px' }}>የተፈለገው መረጃ ወይም ተጭኖ ያለቀ መኪና አልተገኘ።</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {archivedTrucks.map(truck => {
            const isExpanded = expandedId === truck.id;
            const summary = summaries[truck.id];
            return (
              <div key={truck.id} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                <div 
  onClick={() => toggleExpand(truck.id)} 
  style={{ 
    backgroundColor: '#1e293b', 
    color: '#fff', 
    padding: '12px 20px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '24px', // በዋና ዋና ክፍሎች መካከል ያለው ርቀት (እነሱን የሚያቀራርበው ይህ ነው)
    cursor: 'pointer', 
    flexWrap: 'wrap',
    borderRadius: '12px'
  }}
>
  {/* 1. ቀንና ሰዓት */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '130px' }}>
    <span style={{ fontWeight: '900', fontSize: '13px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
      📅 {truck.completionDate ? getEthiopianDate(new Date(truck.completionDate)) : '-'}
    </span>
    <span style={{ fontSize: '9.5px', color: '#64748b' }}>
      {truck.completionDate ? new Date(truck.completionDate).toLocaleString() : ''}
    </span>
  </div>

  {/* 2. የታርጋ ቁጥር እና የመኪና አይነት (በአንድ ላይ ተሰባስበዋል) */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '15px' }}>🚗</span>
    <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.5px' }}>
      ET {truck.plateNumber}
    </span>
    {truck.truckType && (
      <span style={{ backgroundColor: '#2563eb', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
        {truck.truckType}
      </span>
    )}
  </div>

  {/* 3. የሹፌር መረጃ */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>
      🧑 ሹፌር፦ {truck.driverName || '-'}
    </span>
    <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '500' }}>
      📞 {truck.driverPhone || '-'}
    </span>
  </div>

  {/* 4. የአስጫኝ መረጃ */}
  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
    👷 አስጫኝ፦ <strong style={{ color: '#fff' }}>{truck.loaderStaff}</strong>
  </div>

  {/* 5. የቀስት ምልክት (ወደ ቀኝ ዳር እንዲግፋ marginLeft: 'auto' ተሰጥቶታል) */}
  <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#94a3b8' }}>
    {isExpanded ? '🔼' : '🔽'}
  </div>
</div>

                {isExpanded && (
                  !summary ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>⏳ Loading ...</div>
                  ) : (
                    <div style={{ padding: '18px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
<button onClick={() => handleExportExcel(truck)} style={{ padding: '7px 14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
  📊 ወደ Excel ላክ
</button>
                      </div>
                      <div style={{ overflowX: 'auto', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '850px', tableLayout: 'auto' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#0f172a', color: '#fff', textAlign: 'left' }}>
                              <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '40px', textAlign: 'center' }}>ተ.ቁ</th>
                              <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '140px' }}>የነጋዴ ስም</th>
                              <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '100px' }}>ስልክ</th>
                              <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1' }}>የእቃዎች ዝርዝር</th>
                              <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'right' }}>ደረቅ ኪ.ግ</th>
                              <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'right' }}>ለጠፍ ኪ.ግ</th>
                              <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '70px', textAlign: 'center' }}>ሴ.ሜ</th>
                              <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '110px', textAlign: 'center' }}>ድርጊት</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.loadedRows.map((row, index) => (
                              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>👤 {row.merchantName}</td>
                                <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#475569' }}>{row.merchantPhone || '-'}</td>
                                <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', wordBreak: 'break-word' }}>{row.itemsText.map((t, i) => <div key={i} style={{ padding: '2px 0' }}>• {t}</div>)}</td>
                                <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{row.dryWeight > 0 ? `${row.dryWeight} ኪ.ግ` : '-'}</td>
                                <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>{row.letefWeight > 0 ? `${row.letefWeight} ኪ.ግ` : '-'}</td>
                                <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '10.5px' }}>-</td>
                                <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                  <button onClick={() => openUnloadModal(truck.id, row)} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>↩️ ተመላሽ</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ marginTop: '10px', backgroundColor: '#e2e8f0', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>🧮  አጠቃላይ ድምር (ደረቅ፦ {summary.totalDry} ኪ.ግ | ለጠፍ፦ {summary.totalLetef} ኪ.ግ)</span>
                        <span style={{ fontSize: '13px', backgroundColor: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontWeight: '900' }}>{summary.grandTotal} ኪ.ግ</span>
                      </div>
                      {/* 💰 የመኪናዎች ሂሳብ ማስገቢያ */}
{(() => {
  const acc = accounts[truck.id];
  return (
    <div style={{ marginTop: '18px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
      <h4 style={{ margin: '0 0 14px 0', fontSize: '13.5px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>💰</span> የመኪናዎች ሂሳብ ማስገቢያ
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>🧮 አጠቃላይ ሂሳብ (ብር)</label>
          <input type="number" value={acc?.totalRevenue || ''} placeholder="0"
            onChange={e => updateAccountField(truck.id, 'totalRevenue', Number(e.target.value))}
            onBlur={e => saveAccountField(truck.id, 'totalRevenue', Number(e.target.value))}
            style={{ width: '100%', padding: '9px 10px', border: '2px solid #bfdbfe', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#eff6ff', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>🚚 የመኪና ሂሳብ (ብር)</label>
          <input type="number" value={acc?.truckPayment || ''} placeholder="0"
            onChange={e => updateAccountField(truck.id, 'truckPayment', Number(e.target.value))}
            onBlur={e => saveAccountField(truck.id, 'truckPayment', Number(e.target.value))}
            style={{ width: '100%', padding: '9px 10px', border: '2px solid #fed7aa', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fff7ed', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>🤝 ኮሚሽን (10%)</label>
          <div style={{ padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#7c3aed' }}>{(acc?.commission || 0).toFixed(2)} ብር</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px 14px', fontSize: '12.5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#475569' }}>አጠቃላይ ሂሳብ − የመኪና ሂሳብ = ቀሪው</span>
          <strong style={{ color: '#0f172a' }}>{(acc?.remaining || 0).toFixed(2)} ብር</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
          <span style={{ fontWeight: 'bold', color: '#0f172a' }}>ቀሪው + ኮሚሽን = አጠቃላይ ድምር</span>
          <span style={{ fontSize: '15px', fontWeight: '900', color: '#16a34a' }}>{(acc?.grandTotal || 0).toFixed(2)} ብር</span>
        </div>
      </div>
    </div>
  );
})()}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '18px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 16px', backgroundColor: page === 1 ? '#e2e8f0' : '#0f172a', color: page === 1 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>⬅️ ቀዳሚ</button>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ገጽ {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 16px', backgroundColor: page === totalPages ? '#e2e8f0' : '#0f172a', color: page === totalPages ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>ቀጣይ ➡️</button>
        </div>
      )}

      {/* ማውረጃ modal */}
      {unloadModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '580px', width: '90%', maxHeight: '80%', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>↩️ ከመኪና ማውረጃ (ነጋዴ፦ {unloadModal.merchantName})</h3>
              <button onClick={() => setUnloadModal({ isOpen: false, truckId: '', merchantName: '', items: [] })} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {unloadModal.items.map((item, index) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{index + 1}. {item.description}</span>
                    <span style={{ marginLeft: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{item.weight} ኪ.ግ</span>
                  </div>
                  <button onClick={() => handleAdminUnload(item.id)} style={{ padding: '6px 14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>↩️ ከመኪና አውርድ</button>
                </div>
              ))}
            </div>
          </div>
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



interface LoadedRow3 { merchantName: string; merchantPhone: string; receiptNo: string; itemsText: string[]; dryWeight: number; letefWeight: number; }
interface TruckSummary3 { truck: TruckBase; loadedRows: LoadedRow3[]; totalDry: number; totalLetef: number; grandTotal: number; }

function Achievement3() {
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const showApiError = (e: any) => { setToast({ message: `❌ ${e?.message || 'ስህተት ተፈጥሯል'}`, type: 'error' }); setTimeout(() => setToast(null), 4000); };

  const [activeTrucks, setActiveTrucks] = useState<TruckBase[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeTruck = activeTrucks[selectedIdx] || null;

  const fetchActiveTrucks = useCallback(async (silent: boolean = false) => {
    try {
      const res = await apiGet('/trucks?status=ACTIVE');
      setActiveTrucks(res.data);
      setSelectedIdx(idx => Math.min(idx, Math.max(0, res.data.length - 1)));
    } catch (e) { if (!silent) showApiError(e); }
  }, []);
  useEffect(() => { fetchActiveTrucks(); }, [fetchActiveTrucks]);

  const [summary, setSummary] = useState<TruckSummary3 | null>(null);
  const [tableCollapsed, setTableCollapsed] = useState(false);
  const fetchSummary = useCallback(async (truckId: string, silent: boolean = false) => {
    try {
      const res = await apiGet(`/trucks/${truckId}/summary`);
      setSummary(res.data);
    } catch (e) { if (!silent) showApiError(e); }
  }, []);

  useEffect(() => {
    if (activeTruck?.id) fetchSummary(activeTruck.id, true);
  }, [activeTruck?.id, fetchSummary]);

  // 🔄 ገጹ ክፍት ሆኖ ባለ ጊዜ በየ6 ሰከንዱ ራሱን በጸጥታ ያድሳል
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveTrucks(true);
      if (activeTruck?.id) fetchSummary(activeTruck.id, true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchActiveTrucks, activeTruck?.id, fetchSummary]);

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
      <div style={{ marginBottom: '18px', backgroundColor: '#fff', padding: '15px 20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#0891b2', borderRadius: '50%', display: 'inline-block' }}></span>
          👁️ በአሁኑ ሰዓት በመጫን ላይ ያሉ መኪናዎች
        </span>
        {activeTrucks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Loading.....</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {activeTrucks.map((truck, idx) => (
              <div key={truck.id} onClick={() => setSelectedIdx(idx)}
                style={{ border: idx === selectedIdx ? '1px solid #0891b2' : '1px solid #cbd5e1', background: idx === selectedIdx ? 'linear-gradient(135deg, #ecfeff 0%, #fff 100%)' : '#fff', borderRadius: '10px', padding: '12px 15px', cursor: 'pointer', boxShadow: idx === selectedIdx ? '0 4px 6px -1px rgba(8, 145, 178, 0.15)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>👷 አስጫኝ : {truck.loaderStaff || '---'}</span>
                  <span style={{ fontSize: '9px', backgroundColor: truck.isSaved ? '#dcfce7' : '#fffbeb', color: truck.isSaved ? '#16a34a' : '#d97706', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{truck.isSaved ? '● ንቁ' : '● ገና'}</span>
                </div>
                <div style={{ margin: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#0e7490' }}>ታርጋ ፡ {truck.plateNumber ? `ET ${truck.plateNumber}` : '🚨 ታርጋ የለም'}</span>
                  {truck.truckType && <span style={{ fontSize: '9px', backgroundColor: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{truck.truckType}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}>
                  <span>👤 ሹፌር ፡  <strong>{truck.driverName || '---'}</strong></span>
                  <span style={{ color: '#16a34a', fontWeight: '800' }}>{truck.loadedWeight || 0} ኪ.ግ</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTruck && (
        <div style={{ backgroundColor: '#fff', padding: '20px', border: '2px solid #cffafe', borderRadius: '12px' }}>
          <div onClick={() => setTableCollapsed(p => !p)} style={{ borderBottom: '2px solid #cffafe', paddingBottom: '10px', marginBottom: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
  <div>
    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>📄ተመዝግበው እየተጫኑ ያሉ እቃዎች</h4>
    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#475569' }}>
  መኪና ታርጋ ቁጥር፦ <strong>{activeTruck?.plateNumber || '---'}</strong> &nbsp;|&nbsp; የመኪና አይነት፦ <strong style={{ color: '#2563eb' }}>{activeTruck?.truckType || '---'}</strong> &nbsp;|&nbsp; ሹፌር፦ <strong>{activeTruck?.driverName || '---'}</strong> &nbsp;|&nbsp; አስጫኝ፦ <strong style={{ color: '#d97706' }}>{activeTruck?.loaderStaff || '---'}</strong>
</p>
  </div>
  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0891b2', whiteSpace: 'nowrap' }}>{tableCollapsed ? '🔽 ክፈት' : '🔼 ዝጋ'}</span>
</div>
{!tableCollapsed && (
          <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '850px', tableLayout: 'fixed' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ backgroundColor: '#0f172a', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '40px', textAlign: 'center' }}>ተ.ቁ</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '140px' }}>የነጋዴ ስም</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '95px' }}>ስልክ</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1' }}>የእቃዎች ዝርዝር</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'right' }}>ደረቅ ኪ.ግ</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'right' }}>ለጠፍ ኪ.ግ</th>
                </tr>
              </thead>
              <tbody>
                {!summary || summary.loadedRows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>የተጫነ አዲስ ዕቃ የለም።</td></tr>
                ) : (
                  summary.loadedRows.map((row, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>👤 {row.merchantName}</td>
                      <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#475569' }}>{row.merchantPhone || '-'}</td>
                      <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', wordBreak: 'break-word' }}>{row.itemsText.map((t, i) => <div key={i} style={{ padding: '2px 0' }}>• {t}</div>)}</td>
                      <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{row.dryWeight > 0 ? `${row.dryWeight} ኪ.ግ` : '-'}</td>
                      <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>{row.letefWeight > 0 ? `${row.letefWeight} ኪ.ግ` : '-'}</td>
                    </tr>
                  ))
                )}
                {summary && summary.loadedRows.length > 0 && (
                  <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold', fontSize: '13px' }}>
                    <td colSpan={4} style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>🧮 ጠቅላላ ድምር፦</td>
                    <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#166534' }}>{summary.totalDry} ኪ.ግ</td>
                    <td style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#1e40af' }}>{summary.totalLetef} ኪ.ግ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: toast.type === 'error' ? '#ef4444' : '#2563eb', color: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 99999, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{toast.type === 'error' ? '❌' : 'ℹ️'}</span><span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
interface NonKgItem4 { id?: string; name: string; qty: number; rate: number; cost: number; }
interface TruckSummary4 {
  truck: TruckBase; loadedRows: LoadedRow3[]; totalDry: number; totalLetef: number; grandTotal: number;
  labor: { gateWeight: number; truckWeight: number; transitWeight: number; externalWeight: number; gateCost: number; truckCost: number; nonKgTotal: number; totalPayout: number };
  nonKgItems?: NonKgItem4[];
}

const ARCHIVES_PAGE_SIZE_A4 = 10;

function Achievement4() {
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null);
  const showApiError = (e: any) => { setToast({ message: `❌ ${e?.message || 'ስህተት ተፈጥሯል'}`, type: 'error' }); setTimeout(() => setToast(null), 4000); };

  const [archivedTrucks, setArchivedTrucks] = useState<TruckBase[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<{ [id: string]: TruckSummary4 }>({});
  const [collapsedItemsIds, setCollapsedItemsIds] = useState<Set<string>>(new Set());
  const toggleItemsCollapse = (id: string) => setCollapsedItemsIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [loadingList, setLoadingList] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
});
const monthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });


const fetchArchived = useCallback(async (p: number, search: string, month: string) => {
  setLoadingList(true);
  try {
    const res = await apiGet(`/trucks?status=ARCHIVED&search=${encodeURIComponent(search)}&page=${p}&pageSize=${ARCHIVES_PAGE_SIZE_A2}&month=${month}`);
    setArchivedTrucks(res.data);
    setTotal(res.total);
    setTotalPages(res.totalPages);
  } catch (e) { showApiError(e); }
  finally { setLoadingList(false); }
}, []);

useEffect(() => { fetchArchived(page, searchQuery, monthKey); }, [page, monthKey]);
useEffect(() => {
  const t = setTimeout(() => { setPage(1); fetchArchived(1, searchQuery, monthKey); }, 350);
  return () => clearTimeout(t);
}, [searchQuery]);

const goToPrevMonth = () => { setPage(1); setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)); };
const goToNextMonth = () => { setPage(1); setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)); };
  const toggleExpand = async (truckId: string) => {
    if (expandedId === truckId) { setExpandedId(null); return; }
    setExpandedId(truckId);
    if (!summaries[truckId]) {
      try {
        const res = await apiGet(`/trucks/${truckId}/summary`);
        setSummaries(prev => ({ ...prev, [truckId]: res.data }));
      } catch (e) { showApiError(e); }
    }
  };

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', paddingBottom: '15px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>🗄️  ተጭነው ያለቁ መኪናዎች ፋይል ማስቀመጫ ማህደር</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>የተጠናቀቁ ጭነቶች እና ክፍያ ማስቀመጫ ማህደር</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 12px', width: '100%', maxWidth: '320px' }}>
          <span style={{ marginRight: '8px', fontSize: '14px', color: '#64748b' }}>🔍</span>
          <input type="text" placeholder="ታርጋ፣ ሹፌር፣ አስጫኝ፣ ነጋዴ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#1e293b' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}>&times;</button>}
        </div>
      </div>

      {archivedTrucks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>🗄️</span>
          <p style={{ fontWeight: 'bold', fontSize: '16px' }}>የተፈለገው መረጃ ወይም ተጭኖ ያለቀ መኪና አልተገኘ።</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {archivedTrucks.map(truck => {
            const isExpanded = expandedId === truck.id;
            const summary = summaries[truck.id];
            return (
              <div key={truck.id} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                <div onClick={() => toggleExpand(truck.id)} style={{ backgroundColor: '#1e293b', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '900', fontSize: '14px', color: '#38bdf8' }}>📅 {truck.completionDate ? getEthiopianDate(new Date(truck.completionDate)) : '-'}</span>
                    <span style={{ fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>🚗</span> ET {truck.plateNumber} {truck.truckType && <span style={{ backgroundColor: '#2563eb', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>{truck.truckType}</span>}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>👤 ሹፌር፦ <strong>{truck.driverName || '-'}</strong></span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>👷 አስጫኝ፦ <strong>{truck.loaderStaff}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', backgroundColor: truck.isVerified ? '#10b981' : '#d97706', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{truck.isVerified ? '✔ ክፍያው ተረጋግጧል' : '⏳ ክፍያው አልተረጋገጠም'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}>{isExpanded ? '🔼' : '🔽'}</span>
                  </div>
                </div>

                {isExpanded && (
                  !summary ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>⏳ Loading ...</div>
                  ) : (
                    <div className="archive-payout-grid" style={{ padding: '20px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
                      <div style={{ minWidth: 0 }}>
                        <div onClick={() => toggleItemsCollapse(truck.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><span>📄</span> የተጫኑ ዕቃዎች ዝርዝር ማህደር</h4>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>{collapsedItemsIds.has(truck.id) ? '🔽 ክፈት' : '🔼 ዝጋ'}</span>
                        </div>
                        {!collapsedItemsIds.has(truck.id) && (
                          <>
                            <div style={{ maxHeight: '350px', overflowY: 'auto', overflowX: 'auto', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '680px', tableLayout: 'fixed' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#0f172a', color: '#fff', textAlign: 'left' }}>
  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '32px', textAlign: 'center' }}>ተ.ቁ</th>
  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '95px' }}>የነጋዴ ስም</th>
  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '75px' }}>ስልክ</th>
  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', minWidth: '250px' }}>የእቃዎች ዝርዝር</th>
  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '60px', textAlign: 'right' }}>ደረቅ ኪ.ግ</th>
  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '60px', textAlign: 'right' }}>ለጠፍ ኪ.ግ</th>
  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '45px', textAlign: 'center' }}>ሴ.ሜ</th>
  <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', width: '85px', textAlign: 'center' }}>ድርጊት</th>
</tr>
                                </thead>
                                <tbody>
                                  {summary.loadedRows.map((row, index) => (
                                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                      <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center' }}>{index + 1}</td>
                                      <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>👤 {row.merchantName}</td>
                                      <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#475569' }}>{row.merchantPhone}</td>
                                      <td style={{ padding: '8px', border: '1px solid #cbd5e1', wordBreak: 'break-word' }}>{row.itemsText.map((t, i) => <div key={i} style={{ padding: '2px 0' }}>• {t}</div>)}</td>
                                      <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{row.dryWeight > 0 ? `${row.dryWeight} ኪ.ግ` : '-'}</td>
                                      <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>{row.letefWeight > 0 ? `${row.letefWeight} ኪ.ግ` : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div style={{ marginTop: '10px', backgroundColor: '#e2e8f0', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>🧮 ድምር (ደረቅ፦ {summary.totalDry} ኪ.ግ | ለጠፍ፦ {summary.totalLetef} ኪ.ግ)</span>
                              <span style={{ fontSize: '13px', backgroundColor: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontWeight: '900' }}>{summary.grandTotal} ኪ.ግ</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div style={{ borderLeft: '1px dashed #cbd5e1', paddingLeft: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><span>💸</span> የመጋዘን ጫኝ አውራጆች የክፍያ ማረጋገጫ ማህደር</h4>
                        <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>👤  የጫኝ አውራጆች ክፍያ ማስያ ፦</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>• ከመጋዘን የጫኑት ፦</span>
                              <span><strong>{summary.labor.gateWeight} ኪ.ግ</strong> × {truck.gateRate} = <strong>{summary.labor.gateCost.toFixed(2)} ብር</strong></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>• ከመኪና የጫኑት ፦</span>
                              <span><strong>{summary.labor.truckWeight} ኪ.ግ</strong> × {truck.truckRate} = <strong>{summary.labor.truckCost.toFixed(2)} ብር</strong></span>
                            </div>
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '6px', border: '1px solid #fde68a', marginTop: '10px', fontSize: '12px' }}>
                          <span style={{ fontWeight: 'bold', color: '#92400e', display: 'block', marginBottom: '4px' }}>📦 ከኩንታል ውጭ የተጫኑ እቃዎች መመዝገቢያ ፦</span>
                          {(!summary.nonKgItems || summary.nonKgItems.length === 0) ? (
                            <div style={{ fontStyle: 'italic', color: '#78350f', fontSize: '11px' }}>የተመዘገበ ልዩ እቃ የለም።</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {summary.nonKgItems.map((ni, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#78350f', fontSize: '11px' }}>
                                  <span>• {ni.name} ({ni.qty} × {ni.rate} ብር)</span>
                                  <strong>{ni.cost.toFixed(2)} ብር</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: '11px', marginTop: '10px', color: '#475569' }}>
                          <div>• ከውጭ ቀጥታ የተጫነው ፦ <strong>{summary.labor.externalWeight} ኪ.ግ</strong></div>
                          <div>• መኪናው ጭኖት የመጣው ፦ <strong>{summary.labor.transitWeight} ኪ.ግ</strong></div>
                        </div>

                        <div style={{ marginTop: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>ጠቅላላ የጫኝ አውራጅ ሰራተኛ ክፍያ ድምር፦</span>
                          <span style={{ fontSize: '16px', fontWeight: '900', color: '#16a34a' }}>{summary.labor.totalPayout.toFixed(2)} ብር</span>
                        </div>

                        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: truck.isVerified ? '#f0fdf4' : '#f1f5f9', border: `1px solid ${truck.isVerified ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '6px', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', color: truck.isVerified ? '#166534' : '#64748b' }}>
                          {/* {truck.isVerified ? '✔ የጫኞች ክፍያ ተረጋግጦ ተቆልፏል' : '⏳ ገና ክፍያው በቢሮ/አስጫኙ አልተረጋገጠም'} */}
                              {truck.isVerified ? '✔ የሰራተኛ ሂሳብ ክፍያ ተረጋግጦ ተቆልፏል' : '🔒 የሰራተኛን ሂሳብ ክፍያ አረጋግጫለው ( አስጫኝ የሚያረጋግጠው )'}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '18px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 16px', backgroundColor: page === 1 ? '#e2e8f0' : '#0f172a', color: page === 1 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>⬅️ ቀዳሚ</button>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ገጽ {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 16px', backgroundColor: page === totalPages ? '#e2e8f0' : '#0f172a', color: page === totalPages ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>ቀጣይ ➡️</button>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#ef4444', color: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 99999, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>❌</span><span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
function PlaceholderTab({ title, note }: { title: string; note: string }) {
  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
      <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🚧</span>
      <h3 style={{ margin: 0, color: '#0f172a' }}>{title}</h3>
      <p style={{ color: '#64748b', marginTop: '8px' }}>{note}</p>
    </div>
  );
}

interface TruckFile {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

function Achievement6() {
  const [files, setFiles] = useState<TruckFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. 📥 ፋይሎችን ከ Backend ማምጣት (GET)
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/truck-accounting-files`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ፋይሎችን ማምጣት አልተቻለም');
      }
      setFiles(json.data || []);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'የፋይል መረጃ ማምጣት አልተቻለም';
      showToast(`❌ ${errMsg}`, 'error');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // 2. 📤 ኤክሴል ፋይል መስቀል (POST)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/truck-accounting-files`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ፋይል መስቀል አልተቻለም');
      }

      showToast('✔️ ፋይሉ ተሰቅሏል!', 'success');
      fetchFiles();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'ፋይል መስቀል አልተቻለም';
      showToast(`❌ ${errMsg}`, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 3. 🗑️ ፋይል ማጥፋት (DELETE)
  const handleDelete = async (id: string) => {
    if (!window.confirm('ይህን ፋይል ማጥፋት ይፈልጋሉ?')) return;

    try {
      const res = await fetch(`${API_BASE}/truck-accounting-files/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ፋይሉን ማጥፋት አልተቻለም');
      }

      showToast('🗑️ ፋይሉ ተሰርዟል', 'success');
      fetchFiles();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'ፋይሉን ማጥፋት አልተቻለም';
      showToast(`❌ ${errMsg}`, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #cbd5e1' }}>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>📁 የመኪና ሂሳብ ኤክሴል ፋይሎች ማስቀመጫ</h3>
      <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#64748b' }}>በማኗል የተሰራውን የመኪና ሂሳብ ኤክሴል ፋይል እዚህ ይስቀሉ</p>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: uploading ? '#94a3b8' : '#0d9488', color: '#fff', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: '20px' }}>
        {uploading ? '⏳ በመስቀል ላይ...' : '📤 ኤክሴል ፋይል ስቀል'}
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
      </label>

      {files.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>ገና ምንም ፋይል አልተሰቀለም</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>📄 {f.fileName}</div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>🕒 {new Date(f.uploadedAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* <a href={`${API_BASE.replace(/\/api$/, '')}${f.filePath}`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none' }}>⬇️ አውርድ</a> */}
               <a href={`${API_BASE}/truck-accounting-files/${f.id}/download`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none' }}>⬇️ አውርድ</a>
                <button onClick={() => handleDelete(f.id)} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '16px 24px', borderRadius: '8px', zIndex: 99999, fontWeight: 'bold' }}>{toast.message}</div>
      )}
    </div>
  );
}