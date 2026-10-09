'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { authedFetch, getAccessToken } from '../../../lib/session';

interface TenantDetail {
  id: string;
  nameAr: string;
  nameEn: string;
  mode: string;
  country: string;
  currency: string;
  timezone: string;
  package: string;
  status: string;
  churnRisk: boolean;
  upgradeReady: boolean;
  createdAt: string;
}

type Tab = 'overview' | 'data' | 'campaigns' | 'reporting';

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    authedFetch(`/api/tenants/${params.id}`)
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        setTenant((await r.json()) as TenantDetail);
      })
      .catch(() => setError('Network error'));
  }, [params.id]);

  if (error) {
    return (
      <main dir="rtl" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#dc2626' }}>{error}</p>
      </main>
    );
  }

  if (!tenant) {
    return (
      <main dir="rtl" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <p>Loading…</p>
      </main>
    );
  }

  const tabs: Tab[] = ['overview', 'data', 'campaigns', 'reporting'];
  const labels: Record<Tab, string> = {
    overview: 'Overview',
    data: 'Data Sources',
    campaigns: 'Campaigns',
    reporting: 'Reporting',
  };

  return (
    <main dir="rtl" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        {tenant.nameEn} · {tenant.nameAr}
      </h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
        {tenant.mode} · {tenant.country} · {tenant.currency} · {tenant.timezone}
      </p>

      <nav style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 14px',
              background: tab === t ? '#0f172a' : 'white',
              color: tab === t ? 'white' : '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {labels[t]}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: '8px 16px',
            fontSize: 14,
            maxWidth: 500,
          }}
        >
          <dt style={{ color: '#64748b' }}>Status</dt>
          <dd>{tenant.status}</dd>
          <dt style={{ color: '#64748b' }}>Package</dt>
          <dd>{tenant.package}</dd>
          <dt style={{ color: '#64748b' }}>Churn risk</dt>
          <dd>{tenant.churnRisk ? 'Yes' : 'No'}</dd>
          <dt style={{ color: '#64748b' }}>Upgrade ready</dt>
          <dd>{tenant.upgradeReady ? 'Yes' : 'No'}</dd>
          <dt style={{ color: '#64748b' }}>Created</dt>
          <dd>{new Date(tenant.createdAt).toLocaleString()}</dd>
        </dl>
      )}

      {tab === 'data' && (
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Data sources module lands in V1.3.
        </p>
      )}

      {tab === 'campaigns' && (
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Campaigns module lands in V1.5.
        </p>
      )}

      {tab === 'reporting' && (
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Reporting module lands in V1.9.
        </p>
      )}
    </main>
  );
}
