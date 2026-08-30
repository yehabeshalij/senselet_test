import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface StaffLoginProps {
  role?: string | null;
  roleLabel?: string;
  onBack: () => void;
}

export default function StaffLogin({ role, roleLabel, onBack }: StaffLoginProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !pin.trim()) {
      setError('እባክዎን የተጠቃሚ ስም እና PIN ያስገቡ');
      return;
    }
    try {
      setSubmitting(true);
      await (login as any)(username.trim(), pin.trim(), role || undefined);
      // 🎯 ከገባ በኋላ browser "Save password?" prompt እንዲነሳ — ፎርሙ submit ማድረጉ በራሱ በቂ ነው
    } catch (err: any) {
      setError(err.message || 'መግባት አልተቻለም');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>⬅ ወደ ኋላ</button>
          <span style={{ fontSize: '12px', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '4px 8px', borderRadius: '4px' }}>
            {roleLabel || role || 'ሰራተኛ'}
          </span>
        </div>

        <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', textAlign: 'center', fontSize: '20px' }}>ሰራተኛ መግቢያ</h2>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', border: '1px solid #fecaca' }}>
            ⚠️ {error}
          </div>
        )}

        {/* 🎯 name="staff-login" ያለው <form> browser ራሱ ተመሳሳይ ፎርም እንደ login manager እንዲያውቀው ያደርገዋል */}
        <form onSubmit={handleSubmit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#334155', marginBottom: '6px' }}>የተጠቃሚ ስም (Username)</label>
            <input
              type="text" name="username" autoComplete="username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="የተጠቃሚ ስም ያስገቡ" required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#334155', marginBottom: '6px' }}>ሚስጥር ቁጥር (PIN)</label>
            {/* 🎯 PIN Show/Hide + autoComplete="current-password" browser ራሱ "Save password?" እንዲያቀርብ ያደርገዋል */}
            <div style={{ position: 'relative' }}>
              <input
                type={showPin ? 'text' : 'password'}
                name="password" autoComplete="current-password" inputMode="numeric"
                value={pin} onChange={(e) => setPin(e.target.value)}
                placeholder="****" required
                style={{ width: '100%', padding: '10px 40px 10px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
             
              <button 
  type="button" 
  onClick={() => setShowPin(v => !v)} 
  title={showPin ? 'Hide' : 'Show'}
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
  {showPin ? (
    /* Hide Icon (አይኑ የተሰረዘበት SVG) */
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
          </div>

          <button type="submit" disabled={submitting}
            style={{ width: '100%', padding: '12px', backgroundColor: submitting ? '#94a3b8' : '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
            {submitting ? 'እየገባ ነው...' : 'ግባ'}
          </button>
        </form>
      </div>
    </div>
  );
}