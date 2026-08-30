import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleSelector from './components/RoleSelector';
import StaffLogin from './components/StaffLogin';
import WarehouseReceiver from './components/WarehouseReceiver';
import LoadingController from './components/LoadingController';
import OfficeAdmin from './components/OfficeAdmin';
import MerchantStatusCenter from './components/MerchantStatusCenter';
import StaffDashboard from './components/StaffDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import FreightDispatchHub from './components/FreightDispatchHub';

const ROLE_VIEW_MAP: Record<string, string> = {
  RECEIVER: 'receiver', LOADER: 'loader', OFFICE: 'office',
  MERCHANT_SMS: 'merchant', STAFF_EXPENSE: 'staff-expense',
  FREIGHT_HUB: 'freight-hub', OWNER: 'owner',
};

// 🆕 እያንዳንዱ role URL ላይ የሚታይበት path
const ROLE_PATH_MAP: Record<string, string> = {
  RECEIVER: '/receiver',
  LOADER: '/loader',
  MERCHANT_SMS: '/merchant',
  FREIGHT_HUB: '/freight-hub',
  OFFICE: '/office',
  STAFF_EXPENSE: '/staff-expense',
  OWNER: '/owner',
};

const ROLE_LABELS: Record<string, string> = {
  // RECEIVER: '📦 የመዝጋቢ ገጽ', LOADER: '👷 አስጫኝ ገጽ', OFFICE: '🏢 የቢሮ ተቆጣጣሪ',
  // MERCHANT_SMS: '📱 የነጋዴዎች መልእክት', STAFF_EXPENSE: '📝 የወጪ መመዝገቢያ',
  // FREIGHT_HUB: '📊 የጭነት መከታተያ', OWNER: '💰 ሀላፊ ገቢ/ወጪ',
};

function AppContent() {
  const { staff, logout, loading } = useAuth();
  const [pickedRole, setPickedRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 🆕 staff (role) ሲቀየር (ለምሳሌ login ሲሳካ ወይም ገፅ ሲከፈት session ካለ) URL ራሱ ይስተካከላል
  useEffect(() => {
    if (loading) return; // session ገና እየተረጋገጠ ነው — ገና URL አትቀይር
    if (staff) {
      const path = ROLE_PATH_MAP[staff.role] || '/';
      if (location.pathname !== path) {
        navigate(path, { replace: true });
      }
    } else if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [staff, loading, location.pathname, navigate]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳ Loading...</div>;

  if (!staff) {
    if (!pickedRole) return <RoleSelector onSelectRole={setPickedRole} />;
    return <StaffLogin role={pickedRole} roleLabel={ROLE_LABELS[pickedRole]} onBack={() => setPickedRole(null)} />;
  }

  const view = ROLE_VIEW_MAP[staff.role] || 'freight-hub';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontFamily: 'sans-serif' }}>
        <span style={{ fontWeight: 'bold' }}>ሰንሰለት የደረቅ ጭነት አገልግሎት ድርጅት</span>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span>👤 {staff.fullName} ፡ {ROLE_LABELS[staff.role]}</span>
          <button onClick={logout} style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>ውጣ</button>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {view === 'receiver' && <WarehouseReceiver />}
        {view === 'loader' && <LoadingController />}
        {view === 'office' && <OfficeAdmin />}
        {view === 'merchant' && <MerchantStatusCenter />}
        {view === 'freight-hub' && <FreightDispatchHub />}
        {view === 'staff-expense' && <StaffDashboard />}
        {view === 'owner' && <OwnerDashboard />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}