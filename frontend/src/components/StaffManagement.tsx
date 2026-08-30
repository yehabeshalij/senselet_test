import React, { useState, useEffect, useCallback } from 'react';
import { STAFF_API_BASE } from '../config/api';

interface StaffRow {
  id: string;
  fullName: string;
  username: string;
  roles: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: 'RECEIVER', label: '📦 የመዝጋቢ ገጽ' },
  { value: 'LOADER', label: '👷 አስጫኝ ገጽ' },
  { value: 'MERCHANT_SMS', label: '📱 ለነጋዴዎች የእቃ ሚሴጅ መላኪያ' },
  { value: 'FREIGHT_HUB', label: '📊 የጭነት መከታተያና መመዝገቢያ' },
  { value: 'OFFICE', label: '🏢 የቢሮ ተቆጣጣሪ' },
  { value: 'STAFF_EXPENSE', label: '📝 የወጪ መመዝገቢያ' },
  { value: 'OWNER', label: '💰 የሀላፊ ገቢና ወጪ መቆጣጠሪያ' },
];

const roleLabel = (r: string) => ROLE_OPTIONS.find(o => o.value === r)?.label || r;

function formatEthiopianDateTime(dateStr: string | null): string {
  if (!dateStr) return 'ገና አልገባም';
  const d = new Date(dateStr);
  try {
    const datePart = new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
    const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} — ${timePart}`;
  } catch {
    return d.toLocaleString();
  }
}


function PinInput({
  value, onChange, placeholder, autoComplete = 'new-password', style,
}: { value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; style?: React.CSSProperties }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', flex: '1 1 auto', ...style }}>
      <input
        type={visible ? 'text' : 'password'}
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '7px 40px 7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        title={visible ? 'Hide' : 'Show'}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b'
        }}
      >
        {visible ? (
          /* Hide Icon (የተሰረዘ አይን SVG) */
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        ) : (
          /* Show Icon (አይን SVG) */
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
            <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
            <line x1="2" y1="2" x2="22" y2="22"></line>
          </svg>
        )}
      </button>
    </div>
  );
}

async function staffApi(path: string, options?: RequestInit) {
  const res = await fetch(`${STAFF_API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.error || 'ጥያቄው አልተሳካም');
  return json;
}

export default function StaffManagement({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  const colors = {
    cardBg: isDark ? '#131b2e' : '#ffffff',
    cardBorder: isDark ? '#1e293b' : '#e2e8f0',
    textMain: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    inputBg: isDark ? '#0f172a' : '#ffffff',
  };

  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState('');

  const fetchStaff = useCallback(async () => {
    try {
      const res = await staffApi('/');
      setStaffList(res.data);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const toggleNewRole = (role: string) => {
    setNewRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim() || !newPin.trim() || newRoles.length === 0) {
      showToast('⚠️ ቢያንስ 1 ሚና ይምረጡ', 'error');
      return;
    }
    if (newPin.trim().length < 4) {
      showToast('⚠️ PIN ቢያንስ 4 ቁጥር ይሁን', 'error');
      return;
    }
    setSaving(true);
    try {
      await staffApi('/', {
        method: 'POST',
        body: JSON.stringify({ fullName: newFullName.trim(), username: newUsername.trim(), pin: newPin.trim(), roles: newRoles }),
      });
      showToast(`✔️ ${newFullName} ተፈጥሯል! Username: ${newUsername} — PIN: ${newPin}`, 'success');
      setNewFullName(''); setNewUsername(''); setNewPin(''); setNewRoles([]); setShowAddForm(false);
      fetchStaff();
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPin = async (id: string) => {
    if (!resetPin.trim() || resetPin.trim().length < 4) {
      showToast('⚠️ አዲስ PIN ቢያንስ 4 ቁጥር ያስፈልጋል', 'error');
      return;
    }
    try {
      await staffApi(`/${id}/reset-pin`, { method: 'PATCH', body: JSON.stringify({ pin: resetPin.trim() }) });
      showToast('✔️ PIN ተቀይሯል — ነባር ገጽ ወዲያውኑ ተዘግቷል', 'success');
      setResetTargetId(null); setResetPin('');
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'error');
    }
  };

  const handleToggleActive = async (staff: StaffRow) => {
    const action = staff.isActive ? 'deactivate' : 'reactivate';
    if (staff.isActive && !window.confirm(`${staff.fullName} ን እንዲያቆም ይፈልጋሉ? login ማድረግ እንዳይችል`)) return;
    try {
      await staffApi(`/${staff.id}/${action}`, { method: 'PATCH' });
      showToast(staff.isActive ? '🚫 ቆሟል' : '✔️ ሰራተኛው ተመልሷል', 'success');
      fetchStaff();
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'error');
    }
  };

  const [editRolesTargetId, setEditRolesTargetId] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);

  const startEditRoles = (s: StaffRow) => { setEditRolesTargetId(s.id); setDraftRoles(s.roles); };
  const toggleDraftRole = (role: string) => {
    setDraftRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };
  const saveRoles = async (id: string) => {
    if (draftRoles.length === 0) { showToast('⚠️ ቢያንስ 1 ሚና ይምረጡ', 'error'); return; }
    try {
      await staffApi(`/${id}/roles`, { method: 'PATCH', body: JSON.stringify({ roles: draftRoles }) });
      showToast('✔️ የስራ ድርሻዎች ተቀይረዋል', 'success');
      setEditRolesTargetId(null);
      fetchStaff();
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'error');
    }
  };

  const handlePermanentDelete = async (staff: StaffRow) => {
    const confirmed = window.confirm(
      `⚠️ "${staff.fullName}" (${staff.username}) ሙሉ በሙሉ ከሲስተሙ ማጥፋት ይፈልጋሉ?`
    );
    if (!confirmed) return;
    try {
      await staffApi(`/${staff.id}`, { method: 'DELETE' });
      showToast(`🗑️ ${staff.fullName} ሙሉ በሙሉ ተሰርዟል`, 'success');
      fetchStaff();
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'error');
    }
  };

  return (
    <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.cardBorder}`, padding: '18px', color: colors.textMain }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
          👥 ሰራተኞች ማስተዳደሪያ (Username/PIN)
        </h3>
        <button onClick={() => setShowAddForm(p => !p)} style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}>
          {showAddForm ? '✖️ ዝጋ' : '➕ አዲስ ሰራተኛ'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} style={{ backgroundColor: colors.inputBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          <input type="text" placeholder="ሙሉ ስም " value={newFullName} onChange={e => setNewFullName(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.cardBorder}`, fontSize: '13px', backgroundColor: colors.inputBg, color: colors.textMain }} />
          <input type="text" placeholder="Username (ለምሳሌ፦ kinfe1)" value={newUsername} onChange={e => setNewUsername(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.cardBorder}`, fontSize: '13px', backgroundColor: colors.inputBg, color: colors.textMain }} />

          {/* 🆕 PIN Show/Hide ተጠቅሟል */}
          <PinInput value={newPin} onChange={setNewPin} placeholder="የመጀመሪያ PIN (ቢያንስ 6 ቁጥር)" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: colors.textMuted }}>የስራ ድርሻዎች (ከ1 በላይ መምረጥ ይችላሉ)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
              {ROLE_OPTIONS.map(o => (
                <label key={o.value} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '8px',
                  border: `1px solid ${newRoles.includes(o.value) ? '#2563eb' : colors.cardBorder}`,
                  backgroundColor: newRoles.includes(o.value) ? (isDark ? '#1e3a8a33' : '#eff6ff') : 'transparent',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: colors.textMain
                }}>
                  <input type="checkbox" checked={newRoles.includes(o.value)} onChange={() => toggleNewRole(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ padding: '11px', backgroundColor: saving ? '#94a3b8' : '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⏳ በመመደብ ላይ...' : '💾 ሰራተኛ መድብ'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: colors.textMuted, padding: '20px' }}>⏳ Loading...</p>
      ) : staffList.length === 0 ? (
        <p style={{ textAlign: 'center', color: colors.textMuted, padding: '20px' }}>ገና ምንም ሰራተኛ አልተመደበም</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {staffList.map(s => (
            <div key={s.id} style={{ border: `1px solid ${colors.cardBorder}`, borderRadius: '10px', padding: '12px', backgroundColor: s.isActive ? 'transparent' : (isDark ? '#450a0a22' : '#fef2f2') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '13.5px' }}>{s.fullName} <span style={{ fontWeight: 600, color: colors.textMuted, fontSize: '11.5px' }}>({s.username})</span></div>
                  <div style={{ fontSize: '11.5px', color: colors.textMuted, marginTop: '3px' }}>
                    {s.isActive ? '🟢 ንቁ' : '🔴 ቆሟል'} · መጨረሻ የገባበት ቀን፦ {formatEthiopianDateTime(s.lastLoginAt)}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {s.roles.map(r => (
                      <span key={r} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: isDark ? '#1e3a8a55' : '#dbeafe', color: isDark ? '#93c5fd' : '#1e40af' }}>
                        {roleLabel(r)}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => startEditRoles(s)} style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${colors.cardBorder}`, fontSize: '11px', fontWeight: 700, backgroundColor: colors.inputBg, color: colors.textMain, cursor: 'pointer' }}>
                  ✏️ ሚና ለመምረጥ
                </button>
              </div>

              {editRolesTargetId === s.id && (
                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', border: `1px dashed ${colors.cardBorder}`, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '6px', marginBottom: '10px' }}>
                    {ROLE_OPTIONS.map(o => (
                      <label key={o.value} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '6px',
                        border: `1px solid ${draftRoles.includes(o.value) ? '#2563eb' : colors.cardBorder}`,
                        backgroundColor: draftRoles.includes(o.value) ? (isDark ? '#1e3a8a33' : '#eff6ff') : 'transparent',
                        fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', color: colors.textMain
                      }}>
                        <input type="checkbox" checked={draftRoles.includes(o.value)} onChange={() => toggleDraftRole(o.value)} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => saveRoles(s.id)} style={{ padding: '7px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>💾 ቀይር</button>
                    <button onClick={() => setEditRolesTargetId(null)} style={{ padding: '7px 12px', backgroundColor: colors.cardBorder, color: colors.textMain, border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>ተወው</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {resetTargetId === s.id ? (
                  <>
                    {/* 🆕 PIN Show/Hide ተጠቅሟል */}
                    <PinInput value={resetPin} onChange={setResetPin} placeholder="አዲስ PIN" style={{ flex: '1 1 120px' }} />
                    <button onClick={() => handleResetPin(s.id)} style={{ padding: '7px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>💾 ቀይር</button>
                    <button onClick={() => { setResetTargetId(null); setResetPin(''); }} style={{ padding: '7px 12px', backgroundColor: colors.cardBorder, color: colors.textMain, border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>ተወው</button>
                  </>
                ) : (
                  <button onClick={() => { setResetTargetId(s.id); setResetPin(''); }} style={{ padding: '7px 12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>🔑 PIN ቀይር</button>
                )}
                <button onClick={() => handleToggleActive(s)} style={{ padding: '7px 12px', backgroundColor: s.isActive ? '#ef4444' : '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>
                  {s.isActive ? '🚫 ያቁም' : '✔️ መልስ'}
                </button>
                <button onClick={() => handlePermanentDelete(s)} style={{ padding: '7px 12px', backgroundColor: '#7f1d1d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>
                  🗑️ ሙሉ በሙሉ አጥፋ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '14px 20px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 99999, fontWeight: 'bold' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}