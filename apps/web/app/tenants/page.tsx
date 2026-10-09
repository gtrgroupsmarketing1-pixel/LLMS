'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedFetch, getAccessToken } from '../../lib/session';

interface Tenant {
  id: string;
  nameAr: string;
  nameEn: string;
  mode: string;
  country: string;
  package: string;
  status: string;
  churnRisk: boolean;
  upgradeReady: boolean;
}

export default function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    authedFetch('/api/tenants')
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        const data = (await r.json()) as { items: Tenant[] };
        setItems(data.items ?? []);
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main dir="rtl" style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22 }}>Tenants</h1>
        <button
          onClick={() => {
            localStorage.removeItem('lmms.accessToken');
            localStorage.removeItem('lmms.refreshToken');
            window.location.href = '/login';
          }}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </header>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p style={{ color: '#64748b' }}>
          No tenants yet. Create one via the API to get started.
        </p>
      )}

      {items.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ textAlign: 'right', background: '#f1f5f9' }}>
              <th style={{ padding: 8 }}>Name (EN)</th>
              <th style={{ padding: 8 }}>Name (AR)</th>
              <th style={{ padding: 8 }}>Mode</th>
              <th style={{ padding: 8 }}>Country</th>
              <th style={{ padding: 8 }}>Package</th>
              <th style={{ padding: 8 }}>Flags</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 8 }}>
                  <Link href={`/tenants/${t.id}`}>{t.nameEn}</Link>
                </td>
                <td style={{ padding: 8 }}>{t.nameAr}</td>
                <td style={{ padding: 8 }}>{t.mode}</td>
                <td style={{ padding: 8 }}>{t.country}</td>
                <td style={{ padding: 8 }}>{t.package}</td>
                <td style={{ padding: 8 }}>
                  {t.churnRisk && <span title="Churn risk">⚠️</span>}
                  {t.upgradeReady && <span title="Upgrade ready">⬆️</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
