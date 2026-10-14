'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Deck {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  shareToken: string | null;
  sharedAt: string | null;
  generatedAt: string;
  metrics: {
    kpis?: Record<string, number | null>;
    comparison?: Array<{
      key: string;
      current: number | null;
      previous: number | null;
      changePercent: number | null;
      direction: 'up' | 'down' | 'flat' | 'new';
    }>;
    cohort?: {
      cohortLabel: string;
      totalCustomers: number;
      activeCount: number;
      lapsedCount: number;
      dormantCount: number;
      retention30: number;
      retention60: number;
      retention90: number;
    } | null;
    attribution?: {
      totalAttributedRevenue: number;
      totalAttributedOrders: number;
      unattributedRevenue: number;
      byConfidence: Record<string, { revenue: number; orders: number }>;
    } | null;
  } | null;
  highlights: { positive: string[]; negative: string[] } | null;
  recommendations: { actions: Array<{ key: string; title: string; rationale: string }> } | null;
}

const directionColor: Record<string, string> = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  flat: 'text-slate-500',
  new: 'text-blue-600',
};

export default function QbrPage() {
  const params = useParams<{ id: string }>();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await authedFetch(`/api/qbr/tenants/${params.id}/qbr`);
      if (r.ok) {
        const data = (await r.json()) as Deck[];
        setDecks(data);
        if (data[0]) setSelected(data[0]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function buildLastQuarter() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch(
        `/api/qbr/tenants/${params.id}/qbr/build-last-quarter`,
        { method: 'POST' },
      );
      if (r.ok) {
        const data = (await r.json()) as { deckId: string; rawShareToken: string };
        setMsg(`QBR built. Share token: ${data.rawShareToken}`);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function selectDeck(deckId: string) {
    const r = await authedFetch(`/api/qbr/tenants/${params.id}/qbr/${deckId}`);
    if (r.ok) setSelected((await r.json()) as Deck);
  }

  async function markShared() {
    if (!selected) return;
    await authedFetch(`/api/qbr/tenants/${params.id}/qbr/${selected.id}/share`, {
      method: 'POST',
    });
    await load();
  }

  if (loading) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QBR Decks</h1>
          <p className="text-sm text-slate-500">
            Quarterly business reviews with cohort, attribution, and comparison data.
          </p>
        </div>
        <Button onClick={buildLastQuarter} disabled={busy}>
          Build last quarter
        </Button>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {decks.map((d) => (
          <button
            key={d.id}
            onClick={() => selectDeck(d.id)}
            className={`text-left rounded-lg border p-3 hover:bg-slate-50 ${
              selected?.id === d.id ? 'border-slate-900' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {d.periodStart.slice(0, 10)} → {d.periodEnd.slice(0, 10)}
              </span>
              <Badge variant={d.status === 'SHARED' ? 'success' : 'default'}>
                {d.status}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle>
                  QBR {selected.periodStart.slice(0, 10)} → {selected.periodEnd.slice(0, 10)}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={markShared}>
                  Mark as shared
                </Button>
              </div>
              {selected.shareToken && (
                <p className="text-xs text-slate-500">
                  Share token: <code>{selected.shareToken}</code>
                </p>
              )}
            </CardBody>
          </Card>

          {selected.highlights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardBody className="space-y-2">
                  <CardTitle>Highlights — positive</CardTitle>
                  <ul className="text-sm space-y-1">
                    {selected.highlights.positive.length === 0 && (
                      <li className="text-slate-500">No positive movements.</li>
                    )}
                    {selected.highlights.positive.map((h, i) => (
                      <li key={i}>↑ {h}</li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardBody className="space-y-2">
                  <CardTitle>Highlights — watch</CardTitle>
                  <ul className="text-sm space-y-1">
                    {selected.highlights.negative.length === 0 && (
                      <li className="text-slate-500">No declining metrics.</li>
                    )}
                    {selected.highlights.negative.map((h, i) => (
                      <li key={i}>↓ {h}</li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>
          )}

          {selected.metrics?.comparison && (
            <Card>
              <CardBody className="space-y-3">
                <CardTitle>KPI comparison</CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selected.metrics.comparison.map((c) => (
                    <div key={c.key} className="rounded border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">{c.key}</div>
                      <div className="text-lg font-bold">
                        {c.current ?? '—'}
                      </div>
                      <div className={`text-xs ${directionColor[c.direction]}`}>
                        {c.changePercent !== null
                          ? `${c.changePercent > 0 ? '+' : ''}${c.changePercent}%`
                          : c.direction === 'new'
                            ? 'new'
                            : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {selected.metrics?.cohort && (
            <Card>
              <CardBody className="space-y-3">
                <CardTitle>Cohort — {selected.metrics.cohort.cohortLabel}</CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Total customers</div>
                    <div className="text-xl font-bold">{selected.metrics.cohort.totalCustomers}</div>
                  </div>
                  <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
                    <div className="text-xs text-slate-500">Active</div>
                    <div className="text-xl font-bold">{selected.metrics.cohort.activeCount}</div>
                  </div>
                  <div className="rounded border border-amber-200 bg-amber-50 p-3">
                    <div className="text-xs text-slate-500">Lapsed</div>
                    <div className="text-xl font-bold">{selected.metrics.cohort.lapsedCount}</div>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Dormant</div>
                    <div className="text-xl font-bold">{selected.metrics.cohort.dormantCount}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Retention: 30d {selected.metrics.cohort.retention30}% · 60d{' '}
                  {selected.metrics.cohort.retention60}% · 90d{' '}
                  {selected.metrics.cohort.retention90}%
                </div>
              </CardBody>
            </Card>
          )}

          {selected.metrics?.attribution && (
            <Card>
              <CardBody className="space-y-3">
                <CardTitle>Attribution</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Attributed revenue</div>
                    <div className="text-xl font-bold">
                      {selected.metrics.attribution.totalAttributedRevenue}
                    </div>
                  </div>
                  <div className="rounded border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Attributed orders</div>
                    <div className="text-xl font-bold">
                      {selected.metrics.attribution.totalAttributedOrders}
                    </div>
                  </div>
                  <div className="rounded border border-amber-200 bg-amber-50 p-3">
                    <div className="text-xs text-slate-500">Unattributed revenue</div>
                    <div className="text-xl font-bold">
                      {selected.metrics.attribution.unattributedRevenue}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {selected.recommendations && (
            <Card>
              <CardBody className="space-y-3">
                <CardTitle>Recommendations</CardTitle>
                <ul className="space-y-3">
                  {selected.recommendations.actions.map((a) => (
                    <li key={a.key} className="rounded border border-slate-200 p-3">
                      <div className="font-medium text-sm">{a.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{a.rationale}</div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
