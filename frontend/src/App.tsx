// // // // // // import React, { useState } from 'react';
// // // // // // import { PackagePlus, ArrowRight, Building2 } from 'lucide-react';

// // // // // // export default function App() {
// // // // // //   const [formData, setFormData] = useState({
// // // // // //     merchantName: '',
// // // // // //     merchantPhone: '',
// // // // // //     typeAndDetails: '',
// // // // // //     weightKg: '',
// // // // // //     senderName: '',
// // // // // //     senderPhone: '',
// // // // // //     receiverName: ''
// // // // // //   });
// // // // // //   const [loading, setLoading] = useState(false);

// // // // // //   const handleSubmit = async (e: React.FormEvent) => {
// // // // // //     e.preventDefault();
// // // // // //     setLoading(true);
    
// // // // // //     try {
// // // // // //       const response = await fetch('http://localhost:3000/api/receive', {
// // // // // //         method: 'POST',
// // // // // //         headers: { 'Content-Type': 'application/json' },
// // // // // //         body: JSON.stringify({
// // // // // //           ...formData,
// // // // // //           weightKg: parseFloat(formData.weightKg)
// // // // // //         })
// // // // // //       });

// // // // // //       if (response.ok) {
// // // // // //         alert("✅ በስኬት ተመዝግቧል!");
// // // // // //         setFormData({
// // // // // //           merchantName: '',
// // // // // //           merchantPhone: '',
// // // // // //           typeAndDetails: '',
// // // // // //           weightKg: '',
// // // // // //           senderName: '',
// // // // // //           senderPhone: '',
// // // // // //           receiverName: ''
// // // // // //         });
// // // // // //       } else {
// // // // // //         alert("⚠️ ስህተት፦ ዳታው አልተመዘገበም!");
// // // // // //       }
// // // // // //     } catch (error) {
// // // // // //       alert("❌ ከጀርባ ሰርቨር ጋር መገናኘት አልተቻለም!");
// // // // // //     } finally {
// // // // // //       setLoading(false);
// // // // // //     }
// // // // // //   };

// // // // // //   return (
// // // // // //     <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col items-center justify-center py-16 px-6 antialiased">
      
// // // // // //       {/* 📦 ዋናው ካርድ */}
// // // // // //       <div className="w-full max-w-2xl bg-white border border-gray-300 rounded-xl p-10 shadow-sm">
        
// // // // // //         {/* 🔝 ራስጌ ክፍል */}
// // // // // //         <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-200">
// // // // // //           <div className="flex items-center gap-2">
// // // // // //             <PackagePlus className="w-7 h-7 text-slate-900" />
// // // // // //             <div>
// // // // // //               <h1 className="text-xl font-bold text-slate-900 tracking-tight">ሰንሰለት መጋዘን</h1>
// // // // // //               <p className="text-gray-500 text-xs font-medium mt-0.5">አዲስ ሸቀጥ መመዝገቢያ</p>
// // // // // //             </div>
// // // // // //           </div>
// // // // // //           <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
// // // // // //             <Building2 className="w-4 h-4 text-gray-400" />
// // // // // //             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">የድርጅቱ ሎጎ</span>
// // // // // //           </div>
// // // // // //         </div>

// // // // // //         {/* ፎርም */}
// // // // // //         <form onSubmit={handleSubmit} className="space-y-8">
          
// // // // // //           <div className="grid grid-cols-2 gap-8">
            
// // // // // //             {/* 👈 የግራ ክፍል (የባለቤት ስም፣ የእቃ ዝርዝር፣ ያስረካቢ ስም እና ስልክ) */}
// // // // // //             <div className="flex flex-col items-center space-y-6">
// // // // // //               {/* 1. የባለቤት ሙሉ ስም ቦክስ */}
// // // // // //               <div className="w-full max-w-[280px]">
// // // // // //                 <label className="block text-sm font-bold text-slate-700 mb-2">የባለቤት ሙሉ ስም *</label>
// // // // // //                 <input 
// // // // // //                   type="text" 
// // // // // //                   required 
// // // // // //                   value={formData.merchantName} 
// // // // // //                   onChange={e => setFormData({...formData, merchantName: e.target.value})} 
// // // // // //                   className="w-full h-28 bg-white border border-gray-300 rounded-md px-4 text-base text-slate-900 focus:outline-none focus:border-slate-900 transition shadow-sm text-center" 
// // // // // //                 />
// // // // // //               </div>

// // // // // //               {/* 2. የእቃ አይነት እና ዝርዝር ማብራሪያ ቦክስ */}
// // // // // //               <div className="w-full max-w-[280px]">
// // // // // //                 <label className="block text-sm font-bold text-slate-700 mb-2">የእቃ አይነት እና ማብራሪያ *</label>
// // // // // //                 <input 
// // // // // //                   type="text" 
// // // // // //                   required 
// // // // // //                   value={formData.typeAndDetails} 
// // // // // //                   onChange={e => setFormData({...formData, typeAndDetails: e.target.value})} 
// // // // // //                   className="w-full h-28 bg-white border border-gray-300 rounded-md px-4 text-base text-slate-900 focus:outline-none focus:border-slate-900 transition shadow-sm text-center" 
// // // // // //                 />
// // // // // //               </div>

// // // // // //               {/* 3. ያስረካቢ ስም ቦክስ */}
// // // // // //               <div className="w-full max-w-[280px]">
// // // // // //                 <label className="block text-sm font-bold text-slate-700 mb-2">Template - ያስረካቢ ስም *</label>
// // // // // //                 <input 
// // // // // //                   type="text" 
// // // // // //                   required 
// // // // // //                   value={formData.senderName} 
// // // // // //                   onChange={e => setFormData({...formData, senderName: e.target.value})} 
// // // // // //                   className="w-full h-28 bg-white border border-gray-300 rounded-md px-4 text-base text-slate-900 focus:outline-none focus:border-slate-900 transition shadow-sm text-center" 
// // // // // //                 />
// // // // // //               </div>

// // // // // //               {/* 4. ያስረካቢ ስልክ ቦክስ */}
// // // // // //               <div className="w-full max-w-[280px]">
// // // // // //                 <label className="block text-sm font-bold text-slate-700 mb-2">Template - ያስረካቢ ስልክ *</label>
// // // // // //                 <input 
// // // // // //                   type="text" 
// // // // // //                   required 
// // // // // //                   value={formData.senderPhone} 
// // // // // //                   onChange={e => setFormData({...formData, senderPhone: e.target.value})} 
// // // // // //                   className="w-full h-28 bg-white border border-gray-300 rounded-md px-4 text-base text-slate-900 focus:outline-none focus:border-slate-900 transition shadow-sm text-center" 
// // // // // //                   placeholder="09........"
// // // // // //                 />
// // // // // //               </div>
// // // // // //             </div>

// // // // // //             {/* 👉 የቀኝ ክፍል (የባለቤት ስልክ፣ ኪሎግራም፣ የተረካቢ ስም) */}
// // // // // //             <div className="flex flex-col items-center space-y-6">
// // // // // //               {/* 5. የባለቤት ስልክ ቁጥር ቦክስ */}
// // // // // //               <div className="w-full max-w-[280px]">
// // // // // //                 <label className="block text-sm font-bold text-slate-700 mb-2">የባለቤት ስልክ ቁጥር *</label>
// // // // // //                 <input 
// // // // // //                   type="text" 
// // // // // //                   required 
// // // // // //                   value={formData.merchantPhone} 
// // // // // //                   onChange={e => setFormData({...formData, merchantPhone: e.target.value})} 
// // // // // //                   className="w-full h-28 bg-white border border-gray-300 rounded-md px-4 text-base text-slate-900 focus:outline-none focus:border-slate-900 transition shadow-sm text-center" 
// // // // // //                   placeholder="09........"
// // // // // //                 />
// // // // // //               </div>

// // // // // //               {/* 6. ክብደት (ኪሎግራም) ቦክስ */}
// // // // // //               <div className="w-full max-w-[280px]">
// // // // // //                 <label className="block text-sm font-bold text-slate-700 mb-2">ክብደት (በኪሎ ግራም) *</label>
// // // // // //                 <div className="relative w-full h-28">
// // // // // //                   <input 
// // // // // //                     type="number" 
// // // // // //                     required 
// // // // // //                     value={formData.weightKg} 
// // // // // //                     onChange={e => setFormData({...formData, weightKg: e.target.value})} 
// // // // // //                     className="w-full h-full bg-white border border-gray-300 rounded-md pl-4 pr-14 text-base text-slate-900 focus:outline-none focus:border-slate-900 transition shadow-sm text-center" 
// // // // // //                     placeholder="0.00"
// // // // // //                   />
// // // // // //                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">ኪሎ</span>
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               {/* 7. የተረካቢ ሰራተኛ ስም ቦክስ */}
// // // // // //               <div className="w-full max-w-[280px]">
// // // // // //                 <label className="block text-sm font-bold text-slate-700 mb-2">የተረካቢ ሰራተኛ ስም *</label>
// // // // // //                 <input 
// // // // // //                   type="text" 
// // // // // //                   required 
// // // // // //                   value={formData.receiverName} 
// // // // // //                   onChange={e => setFormData({...formData, receiverName: e.target.value})} 
// // // // // //                   className="w-full h-28 bg-white border border-gray-300 rounded-md px-4 text-base text-slate-900 focus:outline-none focus:border-slate-900 transition shadow-sm text-center" 
// // // // // //                 />
// // // // // //               </div>
// // // // // //             </div>

// // // // // //           </div>

// // // // // //           {/* 🔘 ማስገቢያ በተን - ወደ ታች ዝቅ እንዲል pt-20 ተደርጓል */}
// // // // // //           <div className="pt-20 flex justify-center">
// // // // // //             <button 
// // // // // //               type="submit" 
// // // // // //               disabled={loading} 
// // // // // //               className="w-full max-w-[280px] h-14 bg-slate-900 text-white text-base font-bold rounded-md hover:bg-slate-800 transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md"
// // // // // //             >
// // // // // //               {loading ? 'እየተመዘገበ ነው...' : (
// // // // // //                 <>
// // // // // //                   ሸቀጡን አስግብ
// // // // // //                   <ArrowRight className="w-5 h-5" />
// // // // // //                 </>
// // // // // //               )}
// // // // // //             </button>
// // // // // //           </div>

// // // // // //         </form>
// // // // // //       </div>
// // // // // //     </div>
// // // // // //   );
// // // // // // }

// // // // // // 

// // // // // // import React, { useState } from 'react';
// // // // // // import WarehouseReceiver from './components/WarehouseReceiver';
// // // // // // import LoadingController from './components/LoadingController';
// // // // // // import OfficeAdmin from './components/OfficeAdmin';

// // // // // // export default function App() {
// // // // // //   // የትኛውን ገጽ/መሣሪያ መክፈት እንደምትፈልግ እዚህ መምረጥ ትችላለህ
// // // // // //   const [deviceRole, setDeviceRole] = useState<'receiver' | 'loader' | 'office'>('receiver');

// // // // // //   return (
// // // // // //     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
// // // // // //       {/* መሣሪያዎቹን ለመቀያየር የሚያገለግል የሙከራ አሞሌ */}
// // // // // //       <div style={{
// // // // // //         backgroundColor: '#1e293b',
// // // // // //         color: '#fff',
// // // // // //         padding: '10px 20px',
// // // // // //         display: 'flex',
// // // // // //         justifyContent: 'space-between',
// // // // // //         alignItems: 'center',
// // // // // //         fontSize: '14px',
// // // // // //         fontFamily: 'sans-serif'
// // // // // //       }}>
// // // // // //         <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
// // // // // //         <div style={{ display: 'flex', gap: '10px' }}>
// // // // // //           <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
// // // // // //           <select 
// // // // // //             value={deviceRole} 
// // // // // //             onChange={(e) => setDeviceRole(e.target.value as any)}
// // // // // //             style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: 'bold' }}
// // // // // //           >
// // // // // //             <option value="receiver">ታብሌት 1 (እቃ ተረካቢ)</option>
// // // // // //             <option value="loader">ታብሌት 2 (ጭነት ተቆጣጣሪ)</option>
// // // // // //             <option value="office">የቢሮ ኮምፒውተር (PC)</option>
// // // // // //           </select>
// // // // // //         </div>
// // // // // //       </div>

// // // // // //       {/* የተመረጠውን ገጽ ብቻ ያሳያል */}
// // // // // //       <div style={{ flex: 1 }}>
// // // // // //         {deviceRole === 'receiver' && <WarehouseReceiver />}
// // // // // //         {deviceRole === 'loader' && <LoadingController />}
// // // // // //         {deviceRole === 'office' && <OfficeAdmin />}
// // // // // //       </div>
      
// // // // // //     </div>
// // // // // //   );
// // // // // // }

// // // // // import React, { useState } from 'react';
// // // // // import WarehouseReceiver from './components/WarehouseReceiver';
// // // // // import LoadingController from './components/LoadingController';
// // // // // import OfficeAdmin from './components/OfficeAdmin';
// // // // // import MerchantStatusCenter from './components/MerchantStatusCenter'; // 👈 አዲሱ ገጽ እዚህ ብቻ ተጨመረ

// // // // // export default function App() {
// // // // //   // የትኛውን ገጽ/መሣሪያ መክፈት እንደምትፈልግ እዚህ መምረጥ ትችላለህ (አዲሱን 'merchant' ጨምረንበታል)
// // // // //   const [deviceRole, setDeviceRole] = useState<'receiver' | 'loader' | 'office' | 'merchant'>('receiver');

// // // // //   return (
// // // // //     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
// // // // //       {/* መሣሪያዎቹን ለመቀያየር የሚያገለግል የሙከራ አሞሌ */}
// // // // //       <div style={{
// // // // //         backgroundColor: '#1e293b',
// // // // //         color: '#fff',
// // // // //         padding: '10px 20px',
// // // // //         display: 'flex',
// // // // //         justifyContent: 'space-between',
// // // // //         alignItems: 'center',
// // // // //         fontSize: '14px',
// // // // //         fontFamily: 'sans-serif'
// // // // //       }}>
// // // // //         <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
// // // // //         <div style={{ display: 'flex', gap: '10px' }}>
// // // // //           <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
// // // // //           <select 
// // // // //             value={deviceRole} 
// // // // //             onChange={(e) => setDeviceRole(e.target.value as any)}
// // // // //             style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: 'bold' }}
// // // // //           >
// // // // //             <option value="receiver">ታብሌት 1 (እቃ ተረካቢ)</option>
// // // // //             <option value="loader">ታብሌት 2 (ጭነት ተቆጣጣሪ)</option>
// // // // //             <option value="office">የቢሮ ኮምፒውተር (PC)</option>
// // // // //             <option value="merchant">የነጋዴዎች ሁኔታ እና SMS ማዕከል</option> {/* 👈 4ኛ አማራጭ እዚህ ገባ */}
// // // // //           </select>
// // // // //         </div>
// // // // //       </div>

// // // // //       {/* የተመረጠውን ገጽ ብቻ ያሳያል */}
// // // // //       <div style={{ flex: 1 }}>
// // // // //         {deviceRole === 'receiver' && <WarehouseReceiver />}
// // // // //         {deviceRole === 'loader' && <LoadingController />}
// // // // //         {deviceRole === 'office' && <OfficeAdmin />}
// // // // //         {deviceRole === 'merchant' && <MerchantStatusCenter />} {/* 👈 አዲሱ ገጽ እዚህ ይከፈታል */}
// // // // //       </div>
      
// // // // //     </div>
// // // // //   );
// // // // // }

// // // // // import React, { useState } from 'react';
// // // // // import WarehouseReceiver from './components/WarehouseReceiver';
// // // // // import LoadingController from './components/LoadingController';
// // // // // import OfficeAdmin from './components/OfficeAdmin';
// // // // // import MerchantStatusCenter from './components/MerchantStatusCenter'; 

// // // // // // 👈 አዲሶቹን ገጾች እዚህ እናስገባቸዋለን
// // // // // import QuickExpenseTracker from './components/QuickExpenseTracker';
// // // // // import ExpenseArchiveDashboard from './components/ExpenseArchiveDashboard';

// // // // // // የወጪ ዳታ መዋቅር (Interface)
// // // // // interface ExpenseItem {
// // // // //   id: string;
// // // // //   amount: number;
// // // // //   reason: string;
// // // // //   category: string;
// // // // //   time: string;
// // // // //   date: string;
// // // // // }

// // // // // export default function App() {
// // // // //   // የትኛውን ገጽ/መሣሪያ መክፈት እንደምትፈልግ ለመምረጥ (አዲሶቹን 'quick-expense' እና 'expense-archive' ጨምረንባቸዋል)
// // // // //   const [deviceRole, setDeviceRole] = useState<'receiver' | 'loader' | 'office' | 'merchant' | 'quick-expense' | 'expense-archive'>('receiver');

// // // // //   // 💰 ከስልክ የሚመዘገቡት ወጪዎች ተጠራቅመው የሚቀመጡበት የጋራ ማህደር (State)
// // // // //   const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([
// // // // //     // ለናሙና ያህል ጥቂት መረጃዎች (ለአለቃህ ስታሳይ ዝግጁ እንዲሆን)
// // // // //     { id: '1', amount: 2000, reason: 'ሃይሉክስ 700 ቆርቆሮ ያመጣበት', category: 'ትራንስፖርት', time: '09:30 AM', date: 'ሰኔ 28 / 2018' },
// // // // //     { id: '2', amount: 500, reason: 'ለሰራተኞች የሻይ እና ቁርስ', category: 'አስተናግዶ', time: '10:15 AM', date: 'ሰኔ 28 / 2018' }
// // // // //   ]);

// // // // //   // 📝 አዲስ ወጪ ከስልክ ሲመዘገብ ወደ ማህደሩ የሚጨምር ተግባር
// // // // //   const handleAddNewExpense = (newExpense: ExpenseItem) => {
// // // // //     setAllExpenses(prev => [newExpense, ...prev]); // አዲሱ ወጪ ሁልጊዜ ከላይ እንዲቀመጥ
// // // // //   };

// // // // //   return (
// // // // //     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
// // // // //       {/* መሣሪያዎቹን ለመቀያየር የሚያገለግል የሙከራ አሞሌ */}
// // // // //       <div style={{
// // // // //         backgroundColor: '#1e293b',
// // // // //         color: '#fff',
// // // // //         padding: '10px 20px',
// // // // //         display: 'flex',
// // // // //         justifyContent: 'space-between',
// // // // //         alignItems: 'center',
// // // // //         fontSize: '14px',
// // // // //         fontFamily: 'sans-serif',
// // // // //         flexWrap: 'wrap',
// // // // //         gap: '10px'
// // // // //       }}>
// // // // //         <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
// // // // //         <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
// // // // //           <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
// // // // //           <select 
// // // // //             value={deviceRole} 
// // // // //             onChange={(e) => setDeviceRole(e.target.value as any)}
// // // // //             style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', fontWeight: 'bold', backgroundColor: '#ffffff', color: '#1e293b' }}
// // // // //           >
// // // // //             <optgroup label="📦 የእቃና ጭነት መቆጣጠሪያ">
// // // // //               <option value="receiver">ታብሌት 1 (እቃ ተረካቢ)</option>
// // // // //               <option value="loader">ታብሌት 2 (ጭነት ተቆጣጣሪ)</option>
// // // // //               <option value="office">የቢሮ ኮምፒውተር (PC)</option>
// // // // //               <option value="merchant">የነጋዴዎች ሁኔታ እና SMS ማዕከል</option>
// // // // //             </optgroup>
            
// // // // //             <optgroup label="💰 የፋይናንስና ወጪ መቆጣጠሪያ (አዲስ)">
// // // // //               <option value="quick-expense">📱 ስልክ፡ ቅጽበታዊ የወጪ መመዝገቢያ</option>
// // // // //               <option value="expense-archive">📂 ፒሲ/ማታ፡ የዕለታዊ ወጪዎች ዋና ማህደር</option>
// // // // //             </optgroup>
// // // // //           </select>
// // // // //         </div>
// // // // //       </div>

// // // // //       {/* የተመረጠውን ገጽ ብቻ ያሳያል */}
// // // // //       <div style={{ flex: 1 }}>
// // // // //         {deviceRole === 'receiver' && <WarehouseReceiver />}
// // // // //         {deviceRole === 'loader' && <LoadingController />}
// // // // //         {deviceRole === 'office' && <OfficeAdmin />}
// // // // //         {deviceRole === 'merchant' && <MerchantStatusCenter />}
        
// // // // //         {/* 📱 የወጪ መመዝገቢያ (ከተመዝጋቢው ተግባር ጋር ተያይዟል) */}
// // // // //         {deviceRole === 'quick-expense' && (
// // // // //           <QuickExpenseTracker onAddExpense={handleAddNewExpense} />
// // // // //         )}
        
// // // // //         {/* 📂 የወጪዎች ማህደር ማሳያ (ከጠቅላላው የወጪ ሊስት ጋር ተያይዟል) */}
// // // // //         {deviceRole === 'expense-archive' && (
// // // // //           <ExpenseArchiveDashboard expenses={allExpenses} />
// // // // //         )}
// // // // //       </div>
      
// // // // //     </div>
// // // // //   );
// // // // // }

// // // // import React, { useState } from 'react';
// // // // import WarehouseReceiver from './components/WarehouseReceiver';
// // // // import LoadingController from './components/LoadingController';
// // // // import OfficeAdmin from './components/OfficeAdmin';
// // // // import MerchantStatusCenter from './components/MerchantStatusCenter'; 

// // // // // 👈 አዲሱ የአንድ ገጽ የተዋሃደ የወጪ ማዕከል እዚህ ገባ
// // // // import ExpenseManagementCenter from './components/ExpenseManagementCenter';

// // // // export default function App() {
// // // //   // የትኛውን ገጽ/መሣሪያ መክፈት እንደምትፈልግ (አዲሱን 'expense-center' ጨምረንበታል)
// // // //   const [deviceRole, setDeviceRole] = useState<'receiver' | 'loader' | 'office' | 'merchant' | 'expense-center'>('receiver');

// // // //   return (
// // // //     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
// // // //       {/* መሣሪያዎቹን ለመቀያየር የሚያገለግል የሙከራ አሞሌ */}
// // // //       <div style={{
// // // //         backgroundColor: '#1e293b',
// // // //         color: '#fff',
// // // //         padding: '10px 20px',
// // // //         display: 'flex',
// // // //         justifyContent: 'space-between',
// // // //         alignItems: 'center',
// // // //         fontSize: '14px',
// // // //         fontFamily: 'sans-serif'
// // // //       }}>
// // // //         <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
// // // //         <div style={{ display: 'flex', gap: '10px' }}>
// // // //           <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
// // // //           <select 
// // // //             value={deviceRole} 
// // // //             onChange={(e) => setDeviceRole(e.target.value as any)}
// // // //             style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: 'bold' }}
// // // //           >
// // // //             <option value="receiver">ታብሌት 1 (እቃ ተረካቢ)</option>
// // // //             <option value="loader">ታብሌት 2 (ጭነት ተቆጣጣሪ)</option>
// // // //             <option value="office">የቢሮ ኮምፒውተር (PC)</option>
// // // //             <option value="merchant">የነጋዴዎች ሁኔታ እና SMS ማዕከል</option>
// // // //             <option value="expense-center"> የወጪ መቆጣጠሪያና ዋና ማህደር (አዲስ)</option> {/* 👈 5ኛ አማራጭ እዚህ ገባ */}
// // // //             <option value="expense-center"> የወጪ መቆጣጠሪያና ዋና ማህደር (አዲስ)</option> {/* 👈 5ኛ አማራጭ እዚህ ገባ */}
// // // //           </select>
// // // //         </div>
// // // //       </div>

// // // //       {/* የተመረጠውን ገጽ ብቻ ያሳያል */}
// // // //       <div style={{ flex: 1 }}>
// // // //         {deviceRole === 'receiver' && <WarehouseReceiver />}
// // // //         {deviceRole === 'loader' && <LoadingController />}
// // // //         {deviceRole === 'office' && <OfficeAdmin />}
// // // //         {deviceRole === 'merchant' && <MerchantStatusCenter />}
        
// // // //         {/* 👈 አዲሱ የተዋሃደ የወጪ ገጽ እዚህ ይከፈታል */}
// // // //         {deviceRole === 'expense-center' && <ExpenseManagementCenter />} 
// // // //       </div>
      
// // // //     </div>
// // // //   );
// // // // }

// // // // import React, { useState } from 'react';
// // // // import WarehouseReceiver from './components/WarehouseReceiver';
// // // // import LoadingController  from './components/LoadingController';
// // // // import OfficeAdmin from './components/OfficeAdmin';
// // // // import MerchantStatusCenter from './components/MerchantStatusCenter'; 
// // // // import ExpenseManagementCenter from './components/ExpenseManagementCenter';

// // // // // 👈 አዲሱ የመኪናዎች ስምሪትና ወረፋ መቆጣጠሪያ ማዕከል እዚህ ገባ
// // // // import FleetQueueManager from './components/FleetQueueManager';

// // // // export default function App() {
// // // //   // የትኛውን ገጽ/መሣሪያ መክፈት እንደምትፈልግ (አዲሱን 'fleet-manager' ጨምረንበታል)
// // // //   const [deviceRole, setDeviceRole] = useState<'receiver' | 'loader' | 'office' | 'merchant' | 'expense-center' | 'fleet-manager'>('receiver');

// // // //   return (
// // // //     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
// // // //       {/* መሣሪያዎቹን ለመቀያየር የሚያገለግል የሙከራ አሞሌ */}
// // // //       <div style={{
// // // //         backgroundColor: '#1e293b',
// // // //         color: '#fff',
// // // //         padding: '10px 20px',
// // // //         display: 'flex',
// // // //         justifyContent: 'space-between',
// // // //         alignItems: 'center',
// // // //         fontSize: '14px',
// // // //         fontFamily: 'sans-serif'
// // // //       }}>
// // // //         <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
// // // //         <div style={{ display: 'flex', gap: '10px' }}>
// // // //           <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
// // // //           <select 
// // // //             value={deviceRole} 
// // // //             onChange={(e) => setDeviceRole(e.target.value as any)}
// // // //             style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
// // // //           >
// // // //             <option value="receiver">ታብሌት 1 (እቃ ተረካቢ)</option>
// // // //             <option value="loader">ታብሌት 2 (ጭነት ተቆጣጣሪ)</option>
// // // //             <option value="office">የቢሮ ኮምፒውተር (PC)</option>
// // // //             <option value="merchant">የነጋዴዎች ሁኔታ እና SMS ማዕከል</option>
// // // //             <option value="expense-center">የወጪ መቆጣጠሪያና ዋና ማህደር</option>
// // // //             {/* 👈 6ኛ አዲስ አማራጭ እዚህ ገባ */}
// // // //             <option value="fleet-manager">🚛 የመኪናዎች ስምሪትና ወረፋ መቆጣጠሪያ (አዲስ)</option> 
// // // //           </select>
// // // //         </div>
// // // //       </div>

// // // //       {/* የተመረጠውን ገጽ ብቻ ያሳያል */}
// // // //       <div style={{ flex: 1 }}>
// // // //         {deviceRole === 'receiver' && <WarehouseReceiver />}
// // // //         {deviceRole === 'loader' && <LoadingController />}
// // // //         {deviceRole === 'office' && <OfficeAdmin />}
// // // //         {deviceRole === 'merchant' && <MerchantStatusCenter />}
// // // //         {deviceRole === 'expense-center' && <ExpenseManagementCenter />}
        
// // // //         {/* 👈 አዲሱ የመኪናዎች መቆጣጠሪያ ገጽ እዚህ ይከፈታል */}
// // // //         {deviceRole === 'fleet-manager' && <FleetQueueManager />} 
// // // //       </div>
      
// // // //     </div>
// // // //   );
// // // // }

// // // import React, { useState } from 'react';
// // // import WarehouseReceiver from './components/WarehouseReceiver';
// // // import LoadingController from './components/LoadingController';
// // // import OfficeAdmin from './components/OfficeAdmin';
// // // import MerchantStatusCenter from './components/MerchantStatusCenter'; 

// // // // የወጪ መቆጣጠሪያዎች
// // // import StaffDashboard from './components/StaffDashboard';
// // // import OwnerDashboard from './components/OwnerDashboard';

// // // export default function App() {
// // //   const [deviceRole, setDeviceRole] = useState<
// // //     'receiver' | 'loader' | 'office' | 'merchant' | 'staff-expense' | 'owner-expense'
// // //   >('receiver');

// // //   return (
// // //     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
// // //       {/* መሣሪያዎቹን ለመቀያየር የሚያገለግል የሙከራ አሞሌ */}
// // //       <div style={{
// // //         backgroundColor: '#1e293b',
// // //         color: '#fff',
// // //         padding: '10px 20px',
// // //         display: 'flex',
// // //         justifyContent: 'space-between', // 👈 justify የነበረው ወደ justifyContent አስተካክለነዋል
// // //         alignItems: 'center',
// // //         fontSize: '14px',
// // //         fontFamily: 'sans-serif'
// // //       }}>
// // //         <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
// // //         <div style={{ display: 'flex', gap: '10px' }}>
// // //           <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
// // //           <select 
// // //             value={deviceRole} 
// // //             onChange={(e) => setDeviceRole(e.target.value as any)}
// // //             style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
// // //           >
// // //             <option value="receiver">ታብሌት 1 (እቃ ተረካቢ)</option>
// // //             <option value="loader">ታብሌት 2 (ጭነት ተቆጣጣሪ)</option>
// // //             <option value="office">የቢሮ ኮምፒውተር (PC)</option>
// // //             <option value="merchant">የነጋዴዎች ሁኔታ እና SMS ማዕከል</option>
            
// // //             {/* የወጪ መቆጣጠሪያዎች */}
// // //             <option value="staff-expense">💵 የወጪ መመዝገቢያ (Staff Expense)</option>
// // //             <option value="owner-expense">👑 የባለቤት መቆጣጠሪያ ማዕከል (Owner 🔒)</option>
// // //           </select>
// // //         </div>
// // //       </div>

// // //       {/* የተመረጠውን ገጽ ማሳያ */}
// // //       <div style={{ flex: 1 }}>
// // //         {deviceRole === 'receiver' && <WarehouseReceiver />}
// // //         {deviceRole === 'loader' && <LoadingController />}
// // //         {deviceRole === 'office' && <OfficeAdmin />}
// // //         {deviceRole === 'merchant' && <MerchantStatusCenter />}
        
// // //         {deviceRole === 'staff-expense' && <StaffDashboard />} 
// // //         {deviceRole === 'owner-expense' && <OwnerDashboard />} 
// // //       </div>
      
// // //     </div>
// // //   );
// // // }

// // import React, { useState } from 'react';
// // import WarehouseReceiver from './components/WarehouseReceiver';
// // import LoadingController from './components/LoadingController';
// // import OfficeAdmin from './components/OfficeAdmin';
// // import MerchantStatusCenter from './components/MerchantStatusCenter'; 

// // // የወጪ መቆጣጠሪያዎች
// // import StaffDashboard from './components/StaffDashboard';
// // import OwnerDashboard from './components/OwnerDashboard';

// // export default function App() {
// //   const [deviceRole, setDeviceRole] = useState<
// //     'receiver' | 'loader' | 'office' | 'merchant' | 'staff-expense' | 'owner-expense'
// //   >('receiver');

// //   return (
// //     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
// //       {/* መቆጣጠሪያ አሞሌ */}
// //       <div style={{
// //         backgroundColor: '#1e293b',
// //         color: '#fff',
// //         padding: '10px 20px',
// //         display: 'flex',
// //         justifyContent: 'space-between', // 👈 ስህተት የነበረው justifyContent ተስተካክሏል
// //         alignItems: 'center',
// //         fontSize: '14px',
// //         fontFamily: 'sans-serif'
// //       }}>
// //         <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
// //         <div style={{ display: 'flex', gap: '10px' }}>
// //           <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
// //           <select 
// //             value={deviceRole} 
// //             onChange={(e) => setDeviceRole(e.target.value as any)}
// //             style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
// //           >
// //             <option value="receiver">ታብሌት 1 (እቃ ተረካቢ)</option>
// //             <option value="loader">ታብሌት 2 (ጭነት ተቆጣጣሪ)</option>
// //             <option value="office">የቢሮ ኮምፒውተር (PC)</option>
// //             <option value="merchant">የነጋዴዎች ሁኔታ እና SMS ማዕከል</option>
            
// //             {/* የወጪ መቆጣጠሪያዎች */}
// //             <option value="staff-expense">💵 የወጪ መመዝገቢያ (Staff Expense)</option>
// //             <option value="owner-expense">👑 የባለቤት መቆጣጠሪያ ማዕከል (Owner 🔒)</option>
// //           </select>
// //         </div>
// //       </div>

// //       {/* ገጽ ማሳያ */}
// //       <div style={{ flex: 1 }}>
// //         {deviceRole === 'receiver' && <WarehouseReceiver />}
// //         {deviceRole === 'loader' && <LoadingController />}
// //         {deviceRole === 'office' && <OfficeAdmin />}
// //         {deviceRole === 'merchant' && <MerchantStatusCenter />}
        
// //         {deviceRole === 'staff-expense' && <StaffDashboard />} 
// //         {deviceRole === 'owner-expense' && <OwnerDashboard />} 
// //       </div>
      
// //     </div>
// //   );
// // }

// import React, { useState } from 'react';
// import WarehouseReceiver from './components/WarehouseReceiver';
// import LoadingController from './components/LoadingController';
// import OfficeAdmin from './components/OfficeAdmin';
// import MerchantStatusCenter from './components/MerchantStatusCenter'; 

// // የወጪ መቆጣጠሪያዎች
// import StaffDashboard from './components/StaffDashboard';
// import OwnerDashboard from './components/OwnerDashboard';

// // 🚚 አዲስ የተጨመረው የጭነት መከታተያ እና የመዝገብ ማዕከል
// import FreightDispatchHub from './components/FreightDispatchHub';

// export default function App() {
//   const [deviceRole, setDeviceRole] = useState<
//     'receiver' | 'loader' | 'office' | 'merchant' | 'staff-expense' | 'owner-expense' | 'freight-hub'
//   >('freight-hub'); // Default አዲሱ እንዲከፈት ተደርጓል

//   return (
//     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
//       {/* መቆጣጠሪያ አሞሌ */}
//       <div style={{
//         backgroundColor: '#1e293b',
//         color: '#fff',
//         padding: '10px 20px',
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         fontSize: '14px',
//         fontFamily: 'sans-serif'
//       }}>
//         <span style={{ fontWeight: 'bold' }}>⚙️ የሰንሰለት ሲስተም መቆጣጠሪያ</span>
//         <div style={{ display: 'flex', gap: '10px' }}>
//           <label style={{ marginRight: '5px' }}>የመሣሪያ ሚና ይምረጡ፦ </label>
//           <select 
//             value={deviceRole} 
//             onChange={(e) => setDeviceRole(e.target.value as any)}
//             style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
//           >
//             {/* 🚚 አዲሱ የጭነት መከታተያ */}

//             <option value="receiver">ታብሌት 1 (እቃ ተረካቢ)</option>
//             <option value="loader">ታብሌት 2 (ጭነት ተቆጣጣሪ)</option>
//             <option value="office">የቢሮ ኮምፒውተር (PC)</option>
//             <option value="merchant">የነጋዴዎች ሁኔታ እና SMS ማዕከል</option>
//             <option value="freight-hub">🚚 የጭነት መከታተያ እና መዝገብ (Freight Hub)</option>

            
//             {/* የወጪ መቆጣጠሪያዎች */}
//             <option value="staff-expense">💵 የወጪ መመዝገቢያ (Staff Expense)</option>
//             <option value="owner-expense">👑 የባለቤት መቆጣጠሪያ ማዕከል (Owner 🔒)</option>
//           </select>
//         </div>
//       </div>

//       {/* ገጽ ማሳያ */}
//       <div style={{ flex: 1 }}>
//         {deviceRole === 'receiver' && <WarehouseReceiver />}
//         {deviceRole === 'loader' && <LoadingController />}
//         {deviceRole === 'office' && <OfficeAdmin />}
//         {deviceRole === 'merchant' && <MerchantStatusCenter />}
//         {deviceRole === 'freight-hub' && <FreightDispatchHub />}
        
//         {deviceRole === 'staff-expense' && <StaffDashboard />} 
//         {deviceRole === 'owner-expense' && <OwnerDashboard />} 
//       </div>
      
//     </div>
//   );
// }

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WarehouseReceiver from './components/WarehouseReceiver';
import LoadingController from './components/LoadingController';
import OfficeAdmin from './components/OfficeAdmin';
import MerchantStatusCenter from './components/MerchantStatusCenter';
import StaffDashboard from './components/StaffDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import FreightDispatchHub from './components/FreightDispatchHub';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/receiver" element={<WarehouseReceiver />} />
        <Route path="/loader" element={<LoadingController />} />
        <Route path="/office" element={<OfficeAdmin />} />
        <Route path="/merchant-sms" element={<MerchantStatusCenter />} />
        <Route path="/freight-hub" element={<FreightDispatchHub />} />
        <Route path="/expense" element={<StaffDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="*" element={<Navigate to="/freight-hub" replace />} />
      </Routes>
    </BrowserRouter>
  );
}