import React, { useState } from 'react';
import WarehouseReceiver from './components/WarehouseReceiver';
import LoadingController from './components/LoadingController';
import OfficeAdmin from './components/OfficeAdmin';
import MerchantStatusCenter from './components/MerchantStatusCenter'; 

// የወጪ መቆጣጠሪያዎች
import StaffDashboard from './components/StaffDashboard';
import OwnerDashboard from './components/OwnerDashboard';

// 🚚 አዲስ የተጨመረው የጭነት መከታተያ እና የመዝገብ ማዕከል
import FreightDispatchHub from './components/FreightDispatchHub';

export default function App() {
  const [deviceRole, setDeviceRole] = useState<
    'receiver' | 'loader' | 'office' | 'merchant' | 'staff-expense' | 'owner-expense' | 'freight-hub'
  >('freight-hub'); // Default አዲሱ እንዲከፈት ተደርጓል

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* መቆጣጠሪያ አሞሌ */}
      <div style={{
        backgroundColor: '#1e293b',
        color: '#fff',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        fontFamily: 'sans-serif'
      }}>
        <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
          <select 
            value={deviceRole} 
            onChange={(e) => setDeviceRole(e.target.value as any)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {/* 🚚 አዲሱ የጭነት መከታተያ */}

            <option value="receiver">የመዝጋቢ ገጽ</option>
            <option value="loader">የአስጫኝ ገጽ</option>
            <option value="office">የቢሮ ተቆጣጣሪ</option>
            <option value="merchant">የነጋዴዎች የእቃ ሚሴጅ መላኪያ</option>
            <option value="freight-hub">የጭነት መከታተያ እና መመዝገቢያ </option>

            
            {/* የወጪ መቆጣጠሪያዎች */}
            <option value="staff-expense">የወጪ መመዝገቢያ</option>
            <option value="owner-expense">የሀላፊ ወጪና ገቢ መቆጣጠሪያ</option>
          </select>
        </div>
      </div>

      {/* ገጽ ማሳያ */}
      <div style={{ flex: 1 }}>
        {deviceRole === 'receiver' && <WarehouseReceiver />}
        {deviceRole === 'loader' && <LoadingController />}
        {deviceRole === 'office' && <OfficeAdmin />}
        {deviceRole === 'merchant' && <MerchantStatusCenter />}
        {deviceRole === 'freight-hub' && <FreightDispatchHub />}
        
        {deviceRole === 'staff-expense' && <StaffDashboard />} 
        {deviceRole === 'owner-expense' && <OwnerDashboard />} 
      </div>
      
    </div>
  );
}

// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import WarehouseReceiver from './components/WarehouseReceiver';
// import LoadingController from './components/LoadingController';
// import OfficeAdmin from './components/OfficeAdmin';
// import MerchantStatusCenter from './components/MerchantStatusCenter';
// import StaffDashboard from './components/StaffDashboard';
// import OwnerDashboard from './components/OwnerDashboard';
// import FreightDispatchHub from './components/FreightDispatchHub';

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/receiver" element={<WarehouseReceiver />} />
//         <Route path="/loader" element={<LoadingController />} />
//         <Route path="/office" element={<OfficeAdmin />} />
//         <Route path="/merchant-sms" element={<MerchantStatusCenter />} />
//         <Route path="/freight-hub" element={<FreightDispatchHub />} />
//         <Route path="/expense" element={<StaffDashboard />} />
//         <Route path="/owner" element={<OwnerDashboard />} />
//         <Route path="*" element={<Navigate to="/freight-hub" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }