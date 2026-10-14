'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch, getAccessToken } from '../../../lib/session';

interface RankedTenant {
  tenantId: string;
  nameEn: string;
  nameAr: string;
  country: string;
  score: number;
  tier: string;
  attributedRevenue90d: number;
  tenureDays: number;
  lastPitchedAt: string | null;
  convertedAt: string | null;
}

interface PitchPack {
  tenantId: string;
  tenantName: string;
  tier: string;
  score: number;
  headline: string;
  benefits: string[];
  talkingPoints: string[];
  evidence: Array<{ label: string; value: string }>;
}

interface ConversionReport {
  totalPitches: number;
  accepted: number;
  declined: number;
  deferred: number;
  pending: number;
  conversionRate: number;
  declineReasons: Array<{ reason: string; count: number }>;
}

const tierVariant: Record<string, 'danger' | 'warning' | 'default'> = {
  HOT: 'danger',
  WARM: 'warning',
  COLD: 'default',
};

export default function MigrationPipelinePage() {
  const [tenants, setTenants] = useState<RankedTenant[]>([]);
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [pack, setPack] = useState<PitchPack | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        authedFetch('/api/migration-pipeline/pipeline'),
        authedFetch('/api/migration-pipeline/conversion-report'),
      ]);
      if (pRes.ok) setTenants((await pRes.json()) as RankedTenant[]);
      if (rRes.ok) setReport((await rRes.json()) as ConversionReport);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    void load();
  }, []);

  async function viewPack(tenantId: string) {
    setSelectedTenantId(tenantId);
    setMsg(null);
    const r = await authedFetch(
      `/api/migration-pipeline/tenants/${tenantId}/pitch-pack`,
    );
    if (r.ok) setPack((await r.json()) as PitchPack);
  }

  async function sendPitch(tenantId: string) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch(
        `/api/migration-pipeline/tenants/${tenantId}/pitch`,
        { method: 'POST' },
      );
      if (r.ok) {
        setMsg('Pitch sent');
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function scoreTenant(tenantId: string) {
    setBusy(true);
    try {
      const r = await authedFetch(
        `/api/migration-pipeline/tenants/${tenantId}/score`,
        { method: 'POST' },
      );
      const data = (await r.json()) as { score: number; tier: string };
      setMsg(`Scored: ${data.score} (${data.tier})`);
      await load();
    } finally {
      setBusy(false);
    }
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
          <h1 className="text-2xl font-bold">Migration Pipeline</h1>
          <p className="text-sm text-slate-500">
            Standalone → ERP-Connected upgrade candidates, ranked by readiness.
          </p>
        </div>
        <Link
          href="/agency"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Agency
        </Link>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      {report && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Total pitches</div><div className="text-2xl font-bold">{report.totalPitches}</div></CardBody></Card>
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Accepted</div><div className="text-2xl font-bold text-emerald-700">{report.accepted}</div></CardBody></Card>
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Declined</div><div className="text-2xl font-bold text-red-700">{report.declined}</div></CardBody></Card>
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Deferred</div><div className="text-2xl font-bold text-amber-700">{report.deferred}</div></CardBody></Card>
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Conversion rate</div><div className="text-2xl font-bold">{report.conversionRate}%</div></CardBody></Card>
        </div>
      )}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Ranked candidates ({tenants.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Attributed 90d</TableHead>
                <TableHead>Tenure</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    No Standalone tenants to rank.
                  </TableCell>
                </TableRow>
              )}
              {tenants.map((t) => (
                <TableRow key={t.tenantId}>
                  <TableCell>
                    <Link
                      href={`/tenants/${t.tenantId}`}
                      className="text-slate-900 underline-offset-2 hover:underline"
                    >
                      {t.nameEn}
                    </Link>
                    {t.convertedAt && (
                      <Badge variant="success" className="ml-2">
                        Converted
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{t.country}</TableCell>
                  <TableCell>
                    <Badge variant={tierVariant[t.tier] ?? 'default'}>{t.tier}</Badge>
                  </TableCell>
                  <TableCell>{t.score}</TableCell>
                  <TableCell>{t.attributedRevenue90d.toFixed(2)}</TableCell>
                  <TableCell>{t.tenureDays}d</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => scoreTenant(t.tenantId)} disabled={busy}>
                        Score
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => viewPack(t.tenantId)}>
                        Pitch pack
                      </Button>
                      <Button size="sm" onClick={() => sendPitch(t.tenantId)} disabled={busy}>
                        Send
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {pack && (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Pitch pack — {pack.tenantName}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={tierVariant[pack.tier] ?? 'default'}>
                  {pack.tier}
                </Badge>
                <span className="text-sm text-slate-500">Score {pack.score}</span>
              </div>
            </div>

            <p className="text-base font-medium text-slate-800">{pack.headline}</p>

            <div>
              <p className="text-xs text-slate-500 uppercase mb-2">Evidence</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {pack.evidence.map((e) => (
                  <div key={e.label} className="rounded border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">{e.label}</div>
                    <div className="font-medium">{e.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase mb-2">Benefits</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                {pack.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            {pack.talkingPoints.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">Talking points</p>
                <ul className="text-sm space-y-2">
                  {pack.talkingPoints.map((tp, i) => (
                    <li key={i} className="rounded bg-slate-50 p-3">
                      {tp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => sendPitch(pack.tenantId)} disabled={busy}>
                Send pitch
              </Button>
              <Button
                variant="outline"
                onClick={() => setPack(null)}
              >
                Close
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
