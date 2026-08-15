import React, { useState, useEffect } from 'react';
import { QUICKEXPENSE_API_BASE as API_BASE_URL, QUICKINCOME_API_BASE as INCOME_API_URL } from '../config/api';

interface ExpenseItem {
  id: string;
  title?: string;
  reason: string;
  amount: number;
  category: string;
  registeredBy: string;
  time: string;
  ethDate: string;
  ethMonth: string;
  gregDate: string;
  isLoan: boolean;
  isIncome?: boolean;
  isReturned: boolean;
  ownerNote?: string;
  createdAt?: string;
}


const getFormattedDates = () => {
  const date = new Date();



  // 2. ሰዓት ማስተካከያ
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const currentTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;


  const monthNames = [
    "መስከረም", "ጥቅምት", "ሕዳር", "ታኅሣሥ", "ጥር", "የካቲት",
    "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
  ];
  const dayNames = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];
  const dayName = dayNames[date.getDay()];


  // 1. የፈረንጅ ቀንን በሀገር ውስጥ (Local Timezone) በትክክል ማውጣት
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const gregDate = `${year}-${month}-${day}`; // 2026-08-07 ን በትክክል ያመጣል

  // መስከረም 1 (New Year) ስሌት
  const gMonth = date.getMonth() + 1; // 1-12
  const gDate = date.getDate();

  

  let ethYear = gMonth < 9 || (gMonth === 9 && gDate < 11) ? year - 8 : year - 7;
  const isLeapG = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const newYearDay = isLeapG ? 12 : 11;

 

  const startG = new Date(year, 8, newYearDay);
  let diffDays = Math.floor((date.getTime() - startG.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) {
    const prevStartG = new Date(year - 1, 8, isLeapG ? 12 : 11);
    diffDays = Math.floor((date.getTime() - prevStartG.getTime()) / (1000 * 3600 * 24));
  }

  

  let ethMonth = Math.floor(diffDays / 30) + 1;
  let ethDate = (diffDays % 30) + 1;

  if (ethMonth > 13) ethMonth = 13;

  
  const currentEthMonthName = monthNames[ethMonth - 1] || "ነሐሴ";

  return {
    dayName,
    ethDayNum: ethDate,
    ethYearNum: ethYear,
    ethMonthName: currentEthMonthName,
    ethDate: `${currentEthMonthName} ${ethDate}/${ethYear}`,
    gregDate: gregDate, // የተስተካከለው የፈረንጅ ቀን
    time: currentTime
   
  };
};

export default function StaffQuickExpense() {
  const [activeTab, setActiveTab] = useState<'regular' | 'loan' | 'income'>('regular');

  // 🌗 የተመረጠው ገጽታ (dark/light) በ localStorage ተቀምጦ ሪፍሬሽ ቢደረግም እንደተመረጠው ይቆያል
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = window.localStorage.getItem('senselet_staff_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('senselet_staff_theme', theme);
    }
  }, [theme]);

  // 🎯 የታሪክ ማጣሪያ Filter State
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'LOAN'>('ALL');

  // FORM INPUTS
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [openMonthFolders, setOpenMonthFolders] = useState<{ [month: string]: boolean }>({});
  // 🔒 Day folders start CLOSED — staff taps the specific day to open it
  const [openDayFolders, setOpenDayFolders] = useState<{ [day: string]: boolean }>({});

  const [currentDates, setCurrentDates] = useState(getFormattedDates());

  // ቀጥታ የሚሰራ ሰዓት (Real-time Live Clock)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDates(getFormattedDates());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      if (res.ok) {
        const rawData = await res.json();
        const formattedData: ExpenseItem[] = rawData.map((item: any) => ({
          id: String(item.id),
          title: item.title || item.reason || 'ያልተጠቀሰ',
          reason: item.reason || item.title || 'ያልተጠቀሰ',
          amount: Number(item.amount) || 0,
          category: item.category || 'መደበኛ',
          registeredBy: item.registeredBy || 'staff',
          time: item.time || '12:00 AM',
          ethDate: item.ethDate || currentDates.ethDate,
          ethMonth: item.ethMonth || `${currentDates.ethMonthName} ${currentDates.ethYearNum}`,
          gregDate: item.gregDate || currentDates.gregDate,
          isLoan: Boolean(item.isLoan),
          isIncome: Boolean(item.isIncome),
          isReturned: Boolean(item.isReturned),
          ownerNote: item.ownerNote || '',
          createdAt: item.createdAt,
          isDeleted: Boolean(item.isDeleted)
        })).filter((e: any) => !e.isDeleted);

        setExpenses(formattedData.filter(e => !e.isReturned));
      }
    } catch (error) {
      console.error("መረጃ ማምጣት አልተቻለም:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchExpenses().finally(() => setLoading(false));
    const interval = setInterval(fetchExpenses, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !amount || Number(amount) <= 0) {
      alert("እባክዎን ምክንያት እና ትክክለኛ የብር መጠን ያስገቡ!");
      return;
    }

    setIsSubmitting(true);

    if (activeTab === 'income') {
      const newIncomeEntry = {
        title: reason.trim(),
        reason: reason.trim(),
        amount: parseFloat(amount),
        category: "ገቢ",
        registeredBy: "staff",
        time: currentDates.time,
        ethDate: currentDates.ethDate,
        ethMonth: `${currentDates.ethMonthName} ${currentDates.ethYearNum}`,
        gregDate: currentDates.gregDate,
        ownerNote: ""
      };

      try {
        const res = await fetch(INCOME_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newIncomeEntry)
        });

        if (res.ok) {
          setReason('');
          setAmount('');
          await fetchExpenses();
        } else {
          const errorData = await res.json();
          alert(`❌ ገቢ መመዝገብ አልተቻለም፦ ${errorData.error || ''}`);
        }
      } catch (error: any) {
        console.error("ገቢ መመዝገብ አልተቻለም:", error);
      } finally {
        setIsSubmitting(false);
      }

    } else {
      const isLoanSelected = activeTab === 'loan';
      const newEntry = {
        title: reason.trim(),
        reason: reason.trim(),
        amount: parseFloat(amount),
        category: isLoanSelected ? "ብድር" : "መደበኛ",
        registeredBy: "staff",
        time: currentDates.time,
        ethDate: currentDates.ethDate,
        ethMonth: `${currentDates.ethMonthName} ${currentDates.ethYearNum}`,
        gregDate: currentDates.gregDate,
        isLoan: isLoanSelected,
        isIncome: false
      };

      try {
        const res = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry)
        });

        if (res.ok) {
          setReason('');
          setAmount('');
          await fetchExpenses();
        } else {
          alert("መመዝገብ አልተቻለም።");
        }
      } catch (error) {
        console.error("ወጪ መመዝገብ አልተቻለም:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleMarkReturned = async (id: string) => {
    if (!window.confirm("ይህ ብድር ተመልሷል ተብሎ ከዝርዝር እንዲጠፋ ይፈልጋሉ?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/${id}/return`, {
        method: 'PATCH'
      });

      if (res.ok) {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
      } else {
        alert("ብድሩን መመለስ አልተቻለም።");
      }
    } catch (error) {
      console.error("ብድር መመለስ አልተቻለም:", error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const deleteReason = prompt("እባክዎን ይህንን መዝገብ ለምን እንደሚሰርዙት ምክንያት ይጻፉ (ለምሳሌ፦ በስህተት ተመዝግቧል):");
    if (deleteReason === null) return;

    try {
      const res = await fetch(`${API_BASE_URL}/${id}/delete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteReason: deleteReason || "በሰራተኛው በስህተት ተሰርዟል" })
      });

      if (res.ok) {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
        alert("መዝገቡ ተሰርዟል፤ ለባለቤቱ (Owner) ሪፖርት ሆኖ ይላካል።");
      } else {
        alert("መዝገቡን መሰረዝ አልተቻለም።");
      }
    } catch (error) {
      console.error("መዝገብ መሰረዝ ስህተት አጋጥሟል:", error);
    }
  };

  const toggleMonthFolder = (m: string) => {
    setOpenMonthFolders(p => ({ ...p, [m]: !(p[m] ?? true) }));
  };

  const toggleDayFolder = (d: string) => {
    setOpenDayFolders(p => ({ ...p, [d]: !(p[d] ?? false) }));
  };

  const cleanStr = (s: string) => s ? s.replace(/\s+/g, '').replace(/[\/\-\.]/g, '').toLowerCase() : '';

  const todayRecords = expenses.filter(item => {
    if (!item.ethDate) return false;
    return cleanStr(item.ethDate) === cleanStr(currentDates.ethDate) ||
           item.gregDate === currentDates.gregDate;
  });

  const todayRegularExpenseTotal = todayRecords.filter(e => !e.isIncome && !e.isLoan).reduce((sum, e) => sum + e.amount, 0);
  const todayLoanTotal = todayRecords.filter(e => e.isLoan).reduce((sum, e) => sum + e.amount, 0);
  const todayIncomeTotal = todayRecords.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);

  const colors = {
    bg: theme === 'dark' ? '#0f172a' : '#f8fafc',
    cardBg: theme === 'dark' ? '#1e293b' : '#ffffff',
    textMain: theme === 'dark' ? '#f8fafc' : '#0f172a',
    textMuted: theme === 'dark' ? '#94a3b8' : '#64748b',
    border: theme === 'dark' ? '#334155' : '#e2e8f0',
    inputBg: theme === 'dark' ? '#0f172a' : '#ffffff',
    inputBorder: theme === 'dark' ? '#334155' : '#cbd5e1',
    headerMonthBg: theme === 'dark' ? '#334155' : '#f1f5f9',
    badgeEthBg: theme === 'dark' ? '#451a03' : '#fff7ed',
    badgeEthText: theme === 'dark' ? '#f97316' : '#ea580c',
    badgeGregBg: theme === 'dark' ? '#1e293b' : '#f1f5f9',
  };

  const filteredExpenses = expenses.filter(item => {
    if (filterType === 'EXPENSE') return !item.isIncome && !item.isLoan;
    if (filterType === 'INCOME') return item.isIncome;
    if (filterType === 'LOAN') return item.isLoan;
    return true;
  });

  const nestedFolders: { [month: string]: { [day: string]: ExpenseItem[] } } = {};

  filteredExpenses.forEach(exp => {
    let mKey = exp.ethMonth ? exp.ethMonth.trim() : '';
    if (!mKey || mKey.includes('undefined')) {
      mKey = `${currentDates.ethMonthName} ${currentDates.ethYearNum}`;
    }
    mKey = mKey.replace(/\s+/g, ' ');

    let dKey = exp.ethDate ? exp.ethDate.trim() : '';
    if (!dKey || dKey.includes('undefined')) {
      dKey = `${currentDates.ethMonthName} ${currentDates.ethDayNum}/${currentDates.ethYearNum}`;
    }
    dKey = dKey.replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ');

    if (!nestedFolders[mKey]) nestedFolders[mKey] = {};
    if (!nestedFolders[mKey][dKey]) nestedFolders[mKey][dKey] = [];

    nestedFolders[mKey][dKey].push(exp);
  });

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', padding: '12px 10px', color: colors.textMain, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        .sq-num::-webkit-outer-spin-button,
        .sq-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .sq-num { -moz-appearance: textfield; }
        .sq-chevron { display: inline-block; transition: transform 0.18s ease; }
        .sq-chevron.open { transform: rotate(90deg); }
        .sq-tap { -webkit-tap-highlight-color: transparent; transition: transform 0.1s ease, opacity 0.1s ease; }
        .sq-tap:active { transform: scale(0.97); opacity: 0.9; }
        .sq-brand-title { font-size: 14.5px; }
        .sq-brand-sub { font-size: 11.5px; }
        @media (max-width: 340px) {
          .sq-brand-title { font-size: 13px; }
          .sq-brand-sub { font-size: 10.5px; }
        }
      `}</style>

      <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* 🏢 BRANDING HEADER - SENSELET DRY CARGO SERVICES */}
        <div style={{
          backgroundColor: colors.cardBg,
          padding: '16px',
          borderRadius: '18px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>

          {/* 1. Branding Row (Logo Left, Text Center) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: '16px'
          }}>
            <div style={{
              width: '68px',
              height: '68px',
              flexShrink: 0,
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              boxSizing: 'border-box',
              boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
            }}>
              <img
                src="/logo3.jpg"
                alt="Senselet Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              flexGrow: 1,
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <span className="sq-brand-title" style={{ fontWeight: '900', color: '#2e7d32', lineHeight: '1.3' }}>
                ሰንሰለት የደረቅ ጭነት አገልግሎት መስጫ ድርጅት
              </span>
              <span className="sq-brand-sub" style={{ fontWeight: '800', color: '#388e3c', letterSpacing: '0.3px' }}>
                Senselet Dry Cargo Services
              </span>
            </div>
          </div>

          {/* 2. Header Row (Title, Toggle, Dates, Clock) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📝 የወጪ መመዝገቢያ
              </h1>

              <button
                className="sq-tap"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  backgroundColor: theme === 'dark' ? '#334155' : '#f1f5f9',
                  color: theme === 'dark' ? '#f8fafc' : '#334155',
                  border: `1px solid ${colors.border}`,
                  padding: '7px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            {/* DATES & LIVE CLOCK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>

                <div style={{ backgroundColor: colors.badgeEthBg, border: `1px solid ${theme === 'dark' ? '#78350f' : '#ffedd5'}`, padding: '6px 11px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', color: colors.badgeEthText, display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <span>🇪🇹 ቀን፦</span>
                  <span>{currentDates.ethDate}</span>
                </div>

                <div style={{ backgroundColor: colors.badgeGregBg, border: `1px solid ${colors.border}`, padding: '6px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📅</span>
                  <span>({currentDates.gregDate})</span>
                </div>
              </div>

              <div style={{ backgroundColor: theme === 'dark' ? '#0369a1' : '#0284c7', color: '#ffffff', padding: '9px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)', letterSpacing: '0.5px' }}>
                <span>⏰ ሰዓት፦</span>
                <span>{currentDates.time}</span>
              </div>
            </div>
          </div>

        </div>

        {/* DASHBOARD CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '12px 6px', borderRadius: '14px', border: `1px solid ${colors.border}`, textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: colors.textMuted, display: 'block' }}>መደበኛ ወጪ</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#0284c7', marginTop: '4px', display: 'block' }}>
              {todayRegularExpenseTotal.toLocaleString()}
            </span>
          </div>
          <div style={{ backgroundColor: colors.cardBg, padding: '12px 6px', borderRadius: '14px', border: `1px solid ${colors.border}`, textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: colors.textMuted, display: 'block' }}>የዛሬ ብድር</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#ef4444', marginTop: '4px', display: 'block' }}>
              {todayLoanTotal.toLocaleString()}
            </span>
          </div>
          <div style={{ backgroundColor: colors.cardBg, padding: '12px 6px', borderRadius: '14px', border: `1px solid ${colors.border}`, textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: colors.textMuted, display: 'block' }}>የዛሬ ገቢ</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#10b981', marginTop: '4px', display: 'block' }}>
              +{todayIncomeTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* FORM SECTION */}
        <div style={{ backgroundColor: colors.cardBg, padding: '14px', borderRadius: '18px', border: `1px solid ${colors.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px', gap: '6px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '900', margin: 0, color: colors.textMain, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {activeTab === 'regular' && '💳 መደበኛ ወጪ'}
              {activeTab === 'loan' && '🚨 የቀን ብድር'}
              {activeTab === 'income' && '🟢 ከሀይሉክስ የሚገኝ ገቢ'}
            </h2>
            <div style={{ display: 'flex', backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
              <button type="button" className="sq-tap" onClick={() => setActiveTab('regular')} style={{ padding: '7px 11px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: '900', cursor: 'pointer', backgroundColor: activeTab === 'regular' ? '#0284c7' : 'transparent', color: activeTab === 'regular' ? '#ffffff' : colors.textMuted }}>መደበኛ</button>
              <button type="button" className="sq-tap" onClick={() => setActiveTab('loan')} style={{ padding: '7px 11px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: '900', cursor: 'pointer', backgroundColor: activeTab === 'loan' ? '#ef4444' : 'transparent', color: activeTab === 'loan' ? '#ffffff' : colors.textMuted }}>ብድር</button>
              <button type="button" className="sq-tap" onClick={() => setActiveTab('income')} style={{ padding: '7px 11px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: '900', cursor: 'pointer', backgroundColor: activeTab === 'income' ? '#10b981' : 'transparent', color: activeTab === 'income' ? '#ffffff' : colors.textMuted }}>ገቢ</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '800', color: colors.textMuted }}>ምክንያት (Description)</label>
              <input type="text" placeholder={activeTab === 'income' ? "ምሳሌ፦ ሮቶ ያመጣበት..." : "ምሳሌ፦ ለድርጅቱ ጫኝ አውራጅ..."} value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg, color: colors.textMain, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '800', color: colors.textMuted }}>የብር መጠን (ETB)</label>
              <input className="sq-num" type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg, color: activeTab === 'income' ? '#10b981' : activeTab === 'loan' ? '#ef4444' : colors.textMain, fontSize: '15px', fontWeight: '900', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" className="sq-tap" disabled={isSubmitting} style={{ width: '100%', backgroundColor: activeTab === 'income' ? '#10b981' : activeTab === 'loan' ? '#ef4444' : '#0284c7', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '4px', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}>
              {isSubmitting ? 'በመመዝገብ ላይ...' : activeTab === 'income' ? '💾 ገቢውን መዝግብ' : activeTab === 'loan' ? '💾 ብድሩን መዝግብ' : '💾 ወጪውን መዝግብ'}
            </button>
          </form>
        </div>

        {/* HISTORY SECTION WITH FILTERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: '900', margin: 0, color: colors.textMuted }}>📂 የተመዘገቡ ወጪዎችና ገቢ የየእለት እና የወሩ በፎልደር</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', backgroundColor: colors.cardBg, padding: '4px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
              <button
                type="button"
                className="sq-tap"
                onClick={() => setFilterType('ALL')}
                style={{
                  padding: '8px 2px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: filterType === 'ALL' ? '#0284c7' : 'transparent',
                  color: filterType === 'ALL' ? '#ffffff' : colors.textMuted,
                  transition: 'all 0.2s'
                }}
              >
                🌐 ሁሉንም
              </button>

              <button
                type="button"
                className="sq-tap"
                onClick={() => setFilterType('EXPENSE')}
                style={{
                  padding: '8px 2px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: filterType === 'EXPENSE' ? '#0284c7' : 'transparent',
                  color: filterType === 'EXPENSE' ? '#ffffff' : colors.textMuted,
                  transition: 'all 0.2s'
                }}
              >
                ⚪ ወጪ
              </button>

              <button
                type="button"
                className="sq-tap"
                onClick={() => setFilterType('INCOME')}
                style={{
                  padding: '8px 2px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: filterType === 'INCOME' ? '#10b981' : 'transparent',
                  color: filterType === 'INCOME' ? '#ffffff' : colors.textMuted,
                  transition: 'all 0.2s'
                }}
              >
                🟢 ገቢ
              </button>

              <button
                type="button"
                className="sq-tap"
                onClick={() => setFilterType('LOAN')}
                style={{
                  padding: '8px 2px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: filterType === 'LOAN' ? '#e11d48' : 'transparent',
                  color: filterType === 'LOAN' ? '#ffffff' : colors.textMuted,
                  transition: 'all 0.2s'
                }}
              >
                🚨 ብድር
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: colors.textMuted, padding: '16px', fontSize: '12px' }}>መረጃ በመጫን ላይ ነው...</p>
          ) : Object.keys(nestedFolders).length === 0 ? (
            <div style={{ backgroundColor: colors.cardBg, padding: '16px', borderRadius: '14px', textAlign: 'center', color: colors.textMuted, border: `1px solid ${colors.border}`, fontSize: '12px' }}>
              ምንም የተመዘገበ መረጃ የለም።
            </div>
          ) : (
            Object.keys(nestedFolders).map(monthKey => {
              const monthData = nestedFolders[monthKey];
              const monthItems = Object.values(monthData).flat();
              const monthTotalIncome = monthItems.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);
              const monthTotalExpense = monthItems.filter(e => !e.isIncome).reduce((sum, e) => sum + e.amount, 0);
              const isMonthOpen = openMonthFolders[monthKey] ?? true;

              return (
                <div key={monthKey} style={{ backgroundColor: colors.cardBg, borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                  <div className="sq-tap" onClick={() => toggleMonthFolder(monthKey)} style={{ padding: '12px', backgroundColor: colors.headerMonthBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '900' }}>{isMonthOpen ? '📂' : '📁'} የ{monthKey}</span>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontWeight: '900', flexWrap: 'wrap' }}>
                      <span style={{ color: '#10b981' }}>🟢 ገቢ፦ {monthTotalIncome.toLocaleString()}</span>
                      <span style={{ color: '#ef4444' }}>🔴 ወጪ፦ {monthTotalExpense.toLocaleString()}</span>
                    </div>
                  </div>

                  {isMonthOpen && (
                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.keys(monthData).map(dayKey => {
                        const dayItems = monthData[dayKey];
                        const dayInc = dayItems.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);
                        const dayExp = dayItems.filter(e => !e.isIncome).reduce((sum, e) => sum + e.amount, 0);
                        // 🔒 Closed by default — opens only when the staff taps this day
                        const isDayOpen = openDayFolders[dayKey] ?? false;

                        return (
                          <div key={dayKey} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                            <div
                              className="sq-tap"
                              onClick={() => toggleDayFolder(dayKey)}
                              style={{
                                padding: '11px 12px',
                                backgroundColor: isDayOpen ? (theme === 'dark' ? '#0c1830' : '#eef6ff') : (theme === 'dark' ? '#0f172a' : '#f1f5f9'),
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                flexWrap: 'wrap',
                                gap: '6px'
                              }}
                            >
                              <span style={{ fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={`sq-chevron ${isDayOpen ? 'open' : ''}`}>▶</span>
                                🇪🇹 ቀን፦ {dayKey} <span style={{ opacity: 0.65 }}>({dayItems.length})</span>
                              </span>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontWeight: '800' }}>
                                <span style={{ color: '#10b981' }}>ገቢ፦ {dayInc.toLocaleString()}</span>
                                <span style={{ color: '#ef4444' }}>ወጪ፦ {dayExp.toLocaleString()}</span>
                              </div>
                            </div>

                            {isDayOpen && (
                              <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {dayItems.map(item => (
                                  <div key={item.id} style={{ padding: '10px 11px', backgroundColor: colors.cardBg, borderRadius: '10px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <div style={{ flex: 1, paddingRight: '6px', minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '12.5px', fontWeight: '900', wordBreak: 'break-word' }}>{item.reason}</span>
                                          {item.isIncome ? (
                                            <span style={{ fontSize: '9px', fontWeight: '900', backgroundColor: '#d1fae5', color: '#047857', padding: '2px 5px', borderRadius: '4px' }}>🟢 ገቢ</span>
                                          ) : item.isLoan ? (
                                            <span style={{ fontSize: '9px', fontWeight: '900', backgroundColor: '#ffe4e6', color: '#e11d48', padding: '2px 5px', borderRadius: '4px' }}>🚨 ብድር</span>
                                          ) : (
                                            <span style={{ fontSize: '9px', fontWeight: '900', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 5px', borderRadius: '4px' }}>⚪ ወጪ</span>
                                          )}
                                        </div>
                                        <span style={{ fontSize: '10px', color: colors.textMuted, fontWeight: '700', marginTop: '3px', display: 'block' }}>⏱️ {item.time}</span>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                        <span style={{ fontSize: '13px', fontWeight: '900', color: item.isIncome ? '#10b981' : item.isLoan ? '#e11d48' : '#0284c7', whiteSpace: 'nowrap' }}>
                                          {item.amount.toLocaleString()} ETB
                                        </span>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                          {item.isLoan && !item.isReturned && (
                                            <button className="sq-tap" onClick={() => handleMarkReturned(item.id)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                                              ✓ ተመልሷል
                                            </button>
                                          )}

                                          {!item.isLoan && (
                                            <button className="sq-tap" onClick={() => handleDeleteExpense(item.id)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                                              🗑️ ሰርዝ
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {item.ownerNote && (
                                      <div style={{ backgroundColor: theme === 'dark' ? '#451a03' : '#fffbe3', border: `1px solid ${theme === 'dark' ? '#78350f' : '#fef08a'}`, padding: '6px 8px', borderRadius: '7px', marginTop: '2px' }}>
                                         <span style={{ fontSize: '10.5px', color: theme === 'dark' ? '#fde047' : '#b45309', fontWeight: '800' }}>
  💬 
  {/* 👇 ለብቻው የተቀየረው ክፍል ይሄ ነው 👇 */}
  <span style={{ color: '#ef4444', fontWeight: '900' }}>
    የሃላፊ መልዕክት፦
  </span>
  {/* 👆 --------------------------------- 👆 */}
  
  "{item.ownerNote}"
</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}