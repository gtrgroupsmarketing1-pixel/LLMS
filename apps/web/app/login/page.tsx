'use client';

import { useState } from 'react';
import { setTokens } from '../../lib/session';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/agency/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError('Invalid credentials');
        return;
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      setTokens(data.accessToken, data.refreshToken);
      window.location.href = '/tenants';
    } catch {
      setError('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        maxWidth: 400,
        margin: '5rem auto',
        padding: '0 1rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>LMMS</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 13 }}>
        Agency sign-in
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          style={{ padding: 12, fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          style={{ padding: 12, fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 8 }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: 12,
            background: busy ? '#94a3b8' : '#0f172a',
            color: 'white',
            border: 0,
            borderRadius: 8,
            fontSize: 15,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {error && (
        <p style={{ color: '#dc2626', marginTop: 12, fontSize: 13 }}>{error}</p>
      )}
    </main>
  );
}
