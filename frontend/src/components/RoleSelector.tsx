import React, { useState, useEffect } from 'react';

const ROLE_TILES = [
  { role: 'RECEIVER',      label: '📦 የመዝጋቢ ገጽ',              color: '#0891b2' },
  { role: 'LOADER',        label: '👷 አስጫኝ ገጽ',                color: '#d97706' },
  { role: 'MERCHANT_SMS',  label: '📱 የነጋዴዎች የእቃ መልእክት',        color: '#7c3aed' },
  { role: 'FREIGHT_HUB',   label: '📊 የጭነት መከታተያና መመዝገቢያ',     color: '#2563eb' },
  { role: 'OFFICE',        label: '🏢 የቢሮ ተቆጣጣሪ',               color: '#334155' },
  { role: 'STAFF_EXPENSE', label: '📝 የወጪ መመዝገቢያ',             color: '#0d9488' },
  { role: 'OWNER',         label: '💰 ሀላፊ ገቢና ወጪ መቆጣጠሪያ',      color: '#111827' },
];

function getEthiopianDateTime() {
  const now = new Date();
  try {
    const datePart = new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(now);
    const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return { datePart, timePart };
  } catch {
    return { datePart: now.toLocaleDateString(), timePart: now.toLocaleTimeString() };
  }
}

export default function RoleSelector({ onSelectRole }: { onSelectRole: (role: string) => void }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('senselet_role_selector_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'dark';
  });
  const [clock, setClock] = useState(getEthiopianDateTime());

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('senselet_role_selector_theme', theme);
  }, [theme]);

  useEffect(() => {
    const t = setInterval(() => setClock(getEthiopianDateTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0f172a' : '#f4f6fb',
    cardBorder: isDark ? '#1e293b' : '#e2e8f0',
    textMain: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 14px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      <style>{`
        .rs-tile { -webkit-tap-highlight-color: transparent; transition: transform 0.1s ease, opacity 0.1s ease; }
        .rs-tile:active { transform: scale(0.97); opacity: 0.92; }
        .rs-grid { display: grid; grid-template-columns: 1fr; gap: 12px; width: 100%; max-width: 420px; }
        @media (min-width: 640px) { .rs-grid { grid-template-columns: repeat(2, 1fr); max-width: 720px; } }
        @media (min-width: 960px) { .rs-grid { grid-template-columns: repeat(3, 1fr); max-width: 980px; } }
        .rs-topbar { flex-direction: column; align-items: flex-start; gap: 8px; }
        @media (min-width: 560px) { .rs-topbar { flex-direction: row; align-items: center; justify-content: space-between; } }
      `}</style>

      {/* 🕒 Top bar — የኢትዮጵያ ቀን/ሰዓት (ግራ) + theme toggle (ቀኝ) */}
      <div className="rs-topbar" style={{ width: '100%', maxWidth: '980px', display: 'flex', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: colors.textMuted, flexWrap: 'wrap' }}>
          <span> ቀን ፡- {clock.datePart}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>⏱️ {clock.timePart}</span>
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rs-tile"
          style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0', color: isDark ? '#f8fafc' : '#334155', border: 'none', padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <span>{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '26px', textAlign: 'center' }}>
        {/* 🎯 ትልቅ ሎጎ (64px → 100px) */}
        <img src="/logo3.jpg" alt="Senselet Logo" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '18px', backgroundColor: '#fff', padding: '8px', marginBottom: '14px', boxShadow: '0 8px 22px rgba(0,0,0,0.2)' }} />
        <h1 style={{ color: colors.textMain, fontSize: '18px', fontWeight: 900, margin: 0, lineHeight: 1.4 }}>ሰንሰለት የደረቅ ጭነት አገልግሎት ድርጅት</h1>
        <p style={{ color: colors.textMuted, fontSize: '13px', margin: '6px 0 0 0' }}>እባክዎ የስራ ሚናዎን ይምረጡ</p>
      </div>

      <div className="rs-grid">
        {ROLE_TILES.map(t => (
          <button
            key={t.role}
            className="rs-tile"
            onClick={() => onSelectRole(t.role)}
            style={{ padding: '20px 16px', backgroundColor: t.color, color: '#fff', border: 'none', borderRadius: '14px', fontSize: '14.5px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.35 }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}