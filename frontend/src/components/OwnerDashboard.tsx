import React, { useState, useEffect } from 'react';
import { QUICKEXPENSE_API_BASE as API_BASE_URL } from '../config/api';
import StaffManagement from './StaffManagement';

interface ExpenseItem {
  id: string;
  amount: number;
  reason: string;
  time: string;
  ethDate: string;
  ethMonth: string;
  gregDate: string;
  isLoan: boolean;
  isIncome?: boolean;
  isReturned?: boolean;
  registeredBy?: string;
  ownerNote?: string;
  isDeleted?: boolean;
  deleteReason?: string;
}

const getFormattedDates = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const gregDate = `${year}-${month}-${day}`;

  const monthNames = [
    "መስከረም", "ጥቅምት", "ሕዳር", "ታኅሣሥ", "ጥር", "የካቲት",
    "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
  ];

  let ethYear = (date.getMonth() + 1) < 9 || ((date.getMonth() + 1) === 9 && date.getDate() < 11) ? year - 8 : year - 7;
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
    shortEthDate: `${currentEthMonthName} ${ethDate}/${ethYear}`,
    ethMonth: `${currentEthMonthName} ${ethYear}`,
    ethMonthName: currentEthMonthName,
    ethYearNum: ethYear,
    ethDayNum: ethDate,
    gregDate: gregDate
  };
};

export default function OwnerDashboard() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<'finance' | 'staff'>('finance');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = window.localStorage.getItem('senselet_owner_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('senselet_owner_theme', theme);
    }
  }, [theme]);

  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'LOAN'>('ALL');

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  const [openMonthFolders, setOpenMonthFolders] = useState<{ [month: string]: boolean }>({});
  const [openDayFolders, setOpenDayFolders] = useState<{ [day: string]: boolean }>({});

  const [currentDates] = useState(getFormattedDates());
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchExpenses = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch(API_BASE_URL);
      if (res.ok) {
        const rawData = await res.json();
        const formattedData: ExpenseItem[] = rawData.map((item: any) => ({
          id: String(item.id),
          amount: Number(item.amount) || 0,
          reason: item.reason || item.title || 'ያልተጠቀሰ',
          time: item.time || '12:00 AM',
          ethDate: item.ethDate || currentDates.shortEthDate,
          ethMonth: item.ethMonth || currentDates.ethMonth,
          gregDate: item.gregDate || currentDates.gregDate,
          isLoan: Boolean(item.isLoan),
          isIncome: Boolean(item.isIncome),
          isReturned: Boolean(item.isReturned),
          registeredBy: item.registeredBy || 'staff',
          ownerNote: item.ownerNote || '',
          isDeleted: Boolean(item.isDeleted),
          deleteReason: item.deleteReason || ''
        }));

        setExpenses(formattedData.filter(e => !e.isReturned));
      }
    } catch (error) {
      console.error("መረጃ ማምጣት አልተቻለም:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(true);
    const interval = setInterval(() => {
      fetchExpenses(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveNote = async (id: string) => {
    if (!id) return;
    setIsSavingNote(true);
    const messageToSend = noteText.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerNote: messageToSend })
      });

      if (res.ok) {
        setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ownerNote: messageToSend } : exp));
        setEditingNoteId(null);
        setNoteText('');
      } else {
        alert("መልእክቱን ማስተላለፍ አልተቻለም።");
      }
    } catch (error) {
      console.error("አስተያየት ሴቭ ማድረግ አልተቻለም:", error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("ይህ መዝገብ ጨርሶ ከዳታቤዝ እንዲጠፋ ይፈልጋሉ?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
      } else {
        alert("መዝገቡን ማጥፋት አልተቻለም።");
      }
    } catch (error) {
      console.error("ማጥፋት አልተቻለም:", error);
    }
  };

  const toggleMonthFolder = (m: string) => {
    setOpenMonthFolders(p => ({ ...p, [m]: !(p[m] ?? true) }));
  };

  const toggleDayFolder = (d: string) => {
    setOpenDayFolders(p => ({ ...p, [d]: !(p[d] ?? false) }));
  };

  const todayRecords = expenses.filter(item => {
    const cleanItemDate = (item.ethDate || '').replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim();
    const cleanTodayDate = currentDates.shortEthDate.replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim();
    return cleanItemDate === cleanTodayDate && !item.isDeleted;
  });

  const todayRegularExpenseTotal = todayRecords.filter(e => !e.isIncome && !e.isLoan).reduce((sum, e) => sum + e.amount, 0);
  const todayLoanTotal = todayRecords.filter(e => e.isLoan).reduce((sum, e) => sum + e.amount, 0);
  const todayIncomeTotal = todayRecords.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#090d16' : '#f4f6fb',
    cardBg: isDark ? '#131b2e' : '#ffffff',
    cardBorder: isDark ? '#1e293b' : '#e2e8f0',
    textMain: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    subtleBg: isDark ? '#0f172a' : '#f8fafc',
    shadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
  };

  const ResponsiveStyles = () => (
    <style>{`
      .sl-app { -webkit-tap-highlight-color: transparent; }
      .sl-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 14px;
      }
      .sl-brand__logo-wrap {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 68px;
        height: 68px;
        border-radius: 20px;
        background: #ffffff;
        box-shadow: 0 6px 18px rgba(16,24,40,0.12);
        padding: 8px;
        box-sizing: border-box;
      }
      .sl-brand__logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
      .sl-brand__text { display: flex; flex-direction: column; gap: 3px; align-items: center; }
      .sl-brand__title { font-size: 14px; font-weight: 900; color: #2e7d32; line-height: 1.35; }
      .sl-brand__subtitle { font-size: 11.5px; font-weight: 800; color: #388e3c; letter-spacing: 0.3px; }

      .sl-toprow { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
      .sl-toprow__title { display: flex; align-items: center; gap: 8px; justify-content: center; }
      .sl-toprow__actions { display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; }

      .sl-summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .sl-filter-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
      .sl-daypill { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }

      @media (min-width: 560px) {
        .sl-brand { flex-direction: row; text-align: left; gap: 18px; }
        .sl-brand__logo-wrap { width: 76px; height: 76px; }
        .sl-brand__text { align-items: flex-start; }
        .sl-brand__title { font-size: 15px; }
        .sl-daypill { flex-direction: row; align-items: center; justify-content: space-between; width: 100%; }
      }

      @media (min-width: 720px) {
        .sl-toprow { flex-direction: row; align-items: center; justify-content: space-between; text-align: left; }
        .sl-toprow__title { justify-content: flex-start; }
        .sl-summary-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .sl-filter-tabs { display: flex; }
      }

      @media (min-width: 960px) {
        .sl-brand__logo-wrap { width: 84px; height: 84px; }
        .sl-brand__title { font-size: 16px; }
        .sl-brand__subtitle { font-size: 12.5px; }
      }

      .sl-folder-chevron { display: inline-block; transition: transform 0.2s ease; }
      .sl-folder-chevron.open { transform: rotate(90deg); }

      .sl-card-hover { transition: transform 0.15s ease, box-shadow 0.15s ease; }
      @media (hover: hover) {
        .sl-card-hover:hover { transform: translateY(-2px); }
      }
    `}</style>
  );

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
    <div className="sl-app" style={{ backgroundColor: colors.bg, minHeight: '100vh', padding: '16px 12px', color: colors.textMain, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', boxSizing: 'border-box' }}>
      <ResponsiveStyles />
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>

        {/* 🏢 BRANDING + HEADER */}
        <div style={{
          backgroundColor: colors.cardBg,
          padding: '20px 18px',
          borderRadius: '22px',
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: colors.shadow,
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>

          <div className="sl-brand">
            <div className="sl-brand__logo-wrap">
              <img src="/logo3.jpg" alt="Senselet Logo" />
            </div>
            <div className="sl-brand__text">
              <span className="sl-brand__title">ሰንሰለት የደረቅ ጭነት አገልግሎት መስጫ የግል ድርጅት</span>
              <span className="sl-brand__subtitle">Senselet Dry Cargo Services</span>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: colors.cardBorder, width: '100%' }} />

          {/* Title + toggle buttons */}
          <div className="sl-toprow">
            <div>
              <div className="sl-toprow__title">
                <span style={{ fontSize: '22px' }}>💻</span>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', background: 'linear-gradient(to right, #0284c7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  የተቆጣጣሪ/ሃላፊ ማዕከል
                </h1>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: colors.textMuted, fontWeight: '600' }}>የእለት ፋይናንስ ፣ ገቢ፣ ወጪ እና ብድር መከታተያ</p>
            </div>

            <div className="sl-toprow__actions">
              <button
                onClick={() => setActiveSection(activeSection === 'finance' ? 'staff' : 'finance')}
                style={{
                  backgroundColor: activeSection === 'staff' ? '#2563eb' : (isDark ? '#334155' : '#f1f5f9'),
                  color: activeSection === 'staff' ? '#fff' : (isDark ? '#f8fafc' : '#334155'),
                  border: 'none', padding: '9px 14px', borderRadius: '20px', fontSize: '12px',
                  fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                {activeSection === 'finance' ? '👥 ሰራተኞች ማስተዳደሪያ' : '💰 ገቢ/ወጪ መቆጣጠሪያ'}
              </button>

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  backgroundColor: theme === 'dark' ? '#334155' : '#f1f5f9',
                  color: theme === 'dark' ? '#f8fafc' : '#334155',
                  border: 'none', padding: '9px 14px', borderRadius: '20px', fontSize: '12px',
                  fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>

          {/* Live Date & Time Pill */}
          <div style={{ backgroundColor: colors.subtleBg, padding: '12px 16px', borderRadius: '14px', border: `1px solid ${colors.cardBorder}`, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#0284c7' }}>
              <span>🇪🇹 ቀን ፦</span>
              <span style={{ backgroundColor: isDark ? '#1e293b' : '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '8px' }}>{currentDates.shortEthDate}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: colors.textMuted }}>
              <span>📅</span>
              <span style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9', padding: '4px 8px', borderRadius: '8px' }}>({currentDates.gregDate})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#10b981' }}>
              <span>⏱️ ሰዓት፦</span>
              <span style={{ backgroundColor: isDark ? '#064e3b' : '#d1fae5', color: '#047857', padding: '4px 10px', borderRadius: '8px' }}>{currentTime}</span>
            </div>

          </div>
        </div>

        {/* 🎯 ትክክለኛው ማስተካከያ፦ ternary ራሱ ቀጥታ ከ header card ውጪ ነው፣ maxWidth wrapper ግን ከ ternary ውጪ (ከታች) ብቻ ይዘጋል */}
        {activeSection === 'staff' ? (
          <StaffManagement theme={theme} />
        ) : (
          <>
            {/* 📊 SUMMARY CARDS */}
            <div className="sl-summary-grid">

              <div className="sl-card-hover" style={{ backgroundColor: colors.cardBg, padding: '18px', borderRadius: '20px', border: `1px solid ${colors.cardBorder}`, boxShadow: colors.shadow, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: colors.textMuted }}>የእለት መደበኛ ወጪ</span>
                  <span style={{ backgroundColor: isDark ? '#0369a133' : '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}>ወጪ</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7', letterSpacing: '-0.5px' }}>
                  {todayRegularExpenseTotal.toLocaleString()} <small style={{ fontSize: '12px', color: colors.textMuted }}>ETB</small>
                </div>
              </div>

              <div className="sl-card-hover" style={{ backgroundColor: colors.cardBg, padding: '18px', borderRadius: '20px', border: `1px solid ${colors.cardBorder}`, boxShadow: colors.shadow, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: colors.textMuted }}>የእለት ብድር</span>
                  <span style={{ backgroundColor: isDark ? '#9f123933' : '#ffe4e6', color: '#e11d48', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}>ብድር</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#ef4444', letterSpacing: '-0.5px' }}>
                  {todayLoanTotal.toLocaleString()} <small style={{ fontSize: '12px', color: colors.textMuted }}>ETB</small>
                </div>
              </div>

              <div className="sl-card-hover" style={{ backgroundColor: colors.cardBg, padding: '18px', borderRadius: '20px', border: `1px solid ${colors.cardBorder}`, boxShadow: colors.shadow, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: colors.textMuted }}>የእለት የሃይሉክስ ገቢ</span>
                  <span style={{ backgroundColor: isDark ? '#065f4633' : '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' }}>ገቢ</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', letterSpacing: '-0.5px' }}>
                  {todayIncomeTotal.toLocaleString()} <small style={{ fontSize: '12px', color: colors.textMuted }}>ETB</small>
                </div>
              </div>
            </div>

            {/* 📂 HISTORY SECTION WITH TAB FILTERS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '900', margin: 0, color: colors.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📂</span> የተመዘገቡ ወጪዎችና ገቢ የየእለት እና የወሩ በፎልደር
                </h2>

                <div className="sl-filter-tabs" style={{ backgroundColor: colors.cardBg, padding: '4px', borderRadius: '14px', border: `1px solid ${colors.cardBorder}` }}>
                  <button
                    onClick={() => setFilterType('ALL')}
                    style={{ padding: '9px 4px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer', backgroundColor: filterType === 'ALL' ? '#0284c7' : 'transparent', color: filterType === 'ALL' ? '#ffffff' : colors.textMuted, transition: '0.2s' }}
                  >
                    ሁሉንም
                  </button>
                  <button
                    onClick={() => setFilterType('EXPENSE')}
                    style={{ padding: '9px 4px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer', backgroundColor: filterType === 'EXPENSE' ? '#0284c7' : 'transparent', color: filterType === 'EXPENSE' ? '#ffffff' : colors.textMuted, transition: '0.2s' }}
                  >
                    ወጪ
                  </button>
                  <button
                    onClick={() => setFilterType('INCOME')}
                    style={{ padding: '9px 4px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer', backgroundColor: filterType === 'INCOME' ? '#10b981' : 'transparent', color: filterType === 'INCOME' ? '#ffffff' : colors.textMuted, transition: '0.2s' }}
                  >
                    ገቢ
                  </button>
                  <button
                    onClick={() => setFilterType('LOAN')}
                    style={{ padding: '9px 4px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer', backgroundColor: filterType === 'LOAN' ? '#ef4444' : 'transparent', color: filterType === 'LOAN' ? '#ffffff' : colors.textMuted, transition: '0.2s' }}
                  >
                    ብድር
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ backgroundColor: colors.cardBg, padding: '40px', borderRadius: '20px', textAlign: 'center', color: colors.textMuted, border: `1px solid ${colors.cardBorder}`, fontSize: '14px', fontWeight: '700' }}>
                  🔄 መረጃዎች በመጫን ላይ ናቸው...
                </div>
              ) : Object.keys(nestedFolders).length === 0 ? (
                <div style={{ backgroundColor: colors.cardBg, padding: '40px', borderRadius: '20px', textAlign: 'center', color: colors.textMuted, border: `1px solid ${colors.cardBorder}`, fontSize: '14px', fontWeight: '700' }}>
                  📭 ምንም የተቀመጠ መዝገብ የለም።
                </div>
              ) : (
                Object.keys(nestedFolders).map(monthKey => {
                  const monthData = nestedFolders[monthKey];
                  const monthItems = Object.values(monthData).flat();

                  const monthTotalIncome = monthItems.filter(e => e.isIncome && !e.isDeleted).reduce((sum, e) => sum + e.amount, 0);
                  const monthTotalExpense = monthItems.filter(e => !e.isIncome && !e.isDeleted).reduce((sum, e) => sum + e.amount, 0);

                  const isMonthOpen = openMonthFolders[monthKey] ?? true;

                  return (
                    <div key={monthKey} style={{ backgroundColor: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.cardBorder}`, overflow: 'hidden', boxShadow: colors.shadow }}>

                      <div onClick={() => toggleMonthFolder(monthKey)} style={{ padding: '16px 20px', backgroundColor: isDark ? '#1e293b' : '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{isMonthOpen ? '📂' : '📁'}</span>
                          <span style={{ fontSize: '15px', fontWeight: '900', color: colors.textMain }}>የ{monthKey}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontWeight: '900', flexWrap: 'wrap' }}>
                          <span style={{ backgroundColor: isDark ? '#065f4633' : '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '6px' }}>🟢 ገቢ፦ {monthTotalIncome.toLocaleString()} ETB</span>
                          <span style={{ backgroundColor: isDark ? '#9f123933' : '#ffe4e6', color: '#e11d48', padding: '4px 8px', borderRadius: '6px' }}>🔴 ወጪ፦ {monthTotalExpense.toLocaleString()} ETB</span>
                        </div>
                      </div>

                      {isMonthOpen && (
                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {Object.keys(monthData).map(dayKey => {
                            const dayItems = monthData[dayKey];

                            const dayInc = dayItems.filter(e => e.isIncome && !e.isDeleted).reduce((sum, e) => sum + e.amount, 0);
                            const dayExp = dayItems.filter(e => !e.isIncome && !e.isDeleted).reduce((sum, e) => sum + e.amount, 0);

                            const isDayOpen = openDayFolders[dayKey] ?? false;

                            return (
                              <div key={dayKey} style={{ border: `1px solid ${colors.cardBorder}`, borderRadius: '16px', overflow: 'hidden' }}>

                                <div
                                  onClick={() => toggleDayFolder(dayKey)}
                                  style={{
                                    padding: '14px 16px',
                                    backgroundColor: isDayOpen ? (isDark ? '#0c1830' : '#eef6ff') : colors.subtleBg,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                  }}
                                >
                                  <span style={{ fontSize: '13px', fontWeight: '900', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className={`sl-folder-chevron ${isDayOpen ? 'open' : ''}`}>▶</span>
                                    ቀን {dayKey} <span style={{ opacity: 0.6, fontSize: '11px', fontWeight: '700' }}>({dayItems.length} መዝገብ)</span>
                                  </span>
                                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontWeight: '800' }}>
                                    <span style={{ color: '#10b981' }}>ገቢ +{dayInc.toLocaleString()} ETB</span>
                                    <span style={{ color: '#ef4444' }}>ወጪ -{dayExp.toLocaleString()} ETB</span>
                                  </div>
                                </div>

                                {isDayOpen && (
                                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {dayItems.map(item => (
                                      <div key={item.id} style={{ padding: '14px', backgroundColor: item.isDeleted ? (isDark ? '#450a0a22' : '#fef2f2') : colors.cardBg, borderRadius: '14px', border: `1px solid ${item.isDeleted ? '#fca5a5' : colors.cardBorder}`, display: 'flex', flexDirection: 'column', gap: '10px', transition: '0.2s' }}>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                              <span style={{ fontSize: '15px', fontWeight: '900', textDecoration: item.isDeleted ? 'line-through' : 'none', wordBreak: 'break-word', color: colors.textMain }}>
                                                {item.reason}
                                              </span>

                                              {item.isDeleted ? (
                                                <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '6px' }}>የተሰረዘ</span>
                                              ) : item.isIncome ? (
                                                <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#d1fae5', color: '#047857', padding: '2px 8px', borderRadius: '6px' }}>🟢 ገቢ</span>
                                              ) : item.isLoan ? (
                                                <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#ffe4e6', color: '#e11d48', padding: '2px 8px', borderRadius: '6px' }}>🚨 ብድር</span>
                                              ) : (
                                                <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px' }}>⚪ ወጪ</span>
                                              )}
                                            </div>
                                            <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: '700', marginTop: '4px', display: 'block' }}>⏱️ ሰዓት፦ {item.time}</span>
                                          </div>

                                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <span style={{ fontSize: '16px', fontWeight: '900', color: item.isDeleted ? '#94a3b8' : item.isIncome ? '#10b981' : item.isLoan ? '#ef4444' : '#0284c7', textDecoration: item.isDeleted ? 'line-through' : 'none' }}>
                                              {item.amount.toLocaleString()} <small style={{ fontSize: '11px', fontWeight: '700' }}>ETB</small>
                                            </span>
                                          </div>

                                        </div>

                                        {item.isDeleted && (
                                          <div style={{ backgroundColor: isDark ? '#7f1d1d33' : '#fee2e2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '800', flex: 1, wordBreak: 'break-word' }}>
                                              🚨 የስረዛ ምክንያት፦ "{item.deleteReason || 'ያልተጠቀሰ'}"
                                            </span>
                                            <button onClick={() => handlePermanentDelete(item.id)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                                              🗑️ አጥፋ
                                            </button>
                                          </div>
                                        )}

                                        {!item.isDeleted && (
                                          <div style={{ borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '8px', marginTop: '2px' }}>
                                            {editingNoteId === item.id ? (
                                              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                                                <input
                                                  type="text"
                                                  placeholder="ለሰራተኛው የሚላክ መልእክት ይፃፉ..."
                                                  value={noteText}
                                                  onChange={e => setNoteText(e.target.value)}
                                                  style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #0284c7', backgroundColor: colors.subtleBg, color: colors.textMain, fontSize: '12px', outline: 'none' }}
                                                  autoFocus
                                                />
                                                <button onClick={() => handleSaveNote(item.id)} disabled={isSavingNote} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                                                  {isSavingNote ? '...' : '💾 ላክ'}
                                                </button>
                                                <button onClick={() => setEditingNoteId(null)} style={{ backgroundColor: 'transparent', color: colors.textMuted, border: 'none', fontSize: '13px', fontWeight: '800', cursor: 'pointer', padding: '4px' }}>
                                                  ✖️
                                                </button>
                                              </div>
                                            ) : (
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

                                                <span style={{ fontSize: '12px', color: colors.textMain, fontWeight: '700', wordBreak: 'break-word', flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                  <span>💬</span>
                                                  {item.ownerNote ? (
                                                    <>
                                                      <span style={{ color: '#d97706', fontWeight: '800' }}>
                                                        የሃላፊ መልእክት፦
                                                      </span>
                                                      <span style={{ color: colors.textMuted }}>
                                                        "{item.ownerNote}"
                                                      </span>
                                                    </>
                                                  ) : (
                                                    <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>
                                                      ምንም የተላከ መልእክት የለም
                                                    </span>
                                                  )}
                                                </span>
                                                <button onClick={() => { setEditingNoteId(item.id); setNoteText(item.ownerNote || ''); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '12px', fontWeight: '800', paddingLeft: '8px', flexShrink: 0 }}>
                                                  {item.ownerNote ? '✏️ ኤዲት' : '✉️ መልእክት ፃፍ'}
                                                </button>
                                              </div>
                                            )}
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
          </>
        )}

      </div>
    </div>
  );
}