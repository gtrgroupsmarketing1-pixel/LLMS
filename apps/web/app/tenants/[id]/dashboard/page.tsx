'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Card,
  CardBody,
  CardTitle,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Dashboard {
  tenant: { id: string; nameEn: string; nameAr: string; mode: string; country: string };
  period: { start: string; end: string };
  kpis: Record<string, number | null>;
  freshness: {
    lastSyncAt: string | null;
    fresh: boolean;
    sources: Array<{
      id: string;
      type: string;
      status: string;
      lastSyncAt: string | null;
      fresh: boolean;
    }>;
  };
}

const LABELS: Record<string, string> = {
  campaignsSent: 'Campaigns sent',
  messagesSent: 'Messages sent',
  deliveryRate: 'Delivery rate',
  readRate: 'Read rate',
  replyRate: 'Reply rate',
  failureRate: 'Failure rate',
  optOutRate: 'Opt-out rate',
  attributedRevenue: 'Attributed revenue',
  attributedOrders: 'Attributed orders',
  unattributedRevenue: 'Unattributed revenue',
  commercialContractsSigned: 'Contracts signed',
  commercialContractValue: 'Contract value',
  reviewsNew: 'New reviews',
  averageRating: 'Avg rating',
  reviewsRespondedRate: 'Review response rate',
  gbpCalls: 'GBP calls',
  gbpDirections: 'GBP directions',
  roas: 'ROAS',
  costPerAcquisition: 'CPA',
};

function isRate(key: string): boolean {
  return (
    key.endsWith('Rate') ||
    key === 'readRate' ||
    key === 'replyRate' ||
    key === 'failureRate' ||
    key === 'optOutRate'
  );
}

export default function TenantDashboardPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  async function load() {
    try {
      const r = await authedFetch(`/api/reporting/tenants/${params.id}/dashboard`);
      if (!r.ok) {
        setError(`Failed: ${r.status}`);
        return;
      }
      setData((await r.json()) as Dashboard);
    } catch {
      setError('Network error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function generate(kind: 'monthly' | 'weekly') {
    setGenerating(kind);
    setGenMsg(null);
    try {
      const r = await authedFetch(
        `/api/reporting/tenants/${params.id}/reports/${kind}/generate`,
        { method: 'POST' },
      );
      const out = (await r.json()) as { status?: string };
      setGenMsg(`${kind} report: ${out.status ?? 'ok'}`);
    } finally {
      setGenerating(null);
    }
  }

  if (error) {
    return (
      <main className="p-8 max-w-5xl mx-auto">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-8 max-w-5xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  const k = data.kpis;

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">
          {data.tenant.nameAr} · {data.tenant.nameEn}
        </h1>
        <p className="text-xs text-slate-500">
          {data.tenant.mode} · {data.tenant.country} ·{' '}
          {data.period.start.slice(0, 10)} → {data.period.end.slice(0, 10)}
        </p>
      </header>

      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
          data.freshness.fresh
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        <span>{data.freshness.fresh ? '🟢' : '🟡'}</span>
        <span>{data.freshness.fresh ? 'Data fresh' : 'Data may be stale'}</span>
        {data.freshness.lastSyncAt && (
          <span className="opacity-70">
            · {new Date(data.freshness.lastSyncAt).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(k).map(([key, value]) => (
          <Card key={key}>
            <CardBody className="space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                {LABELS[key] ?? key}
              </div>
              <div className="text-xl font-bold">
                {value === null
                  ? '—'
                  : isRate(key)
                    ? `${(value * 100).toFixed(1)}%`
                    : String(value)}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {data.freshness.sources.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>Data sources</CardTitle>
            <ul className="text-sm space-y-2">
              {data.freshness.sources.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span>{s.type}</span>
                  <Badge variant={s.fresh ? 'success' : 'warning'}>
                    {s.fresh ? 'Fresh' : s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => generate('monthly')}
          disabled={generating !== null}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {generating === 'monthly' ? 'Generating…' : 'Generate monthly PDF'}
        </button>
        <button
          onClick={() => generate('weekly')}
          disabled={generating !== null}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {generating === 'weekly' ? 'Generating…' : 'Generate weekly summary'}
        </button>
      </div>
      {genMsg && <p className="text-sm text-slate-700">{genMsg}</p>}
    </main>
  );
}
