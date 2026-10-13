'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Report {
  period: { start: string; end: string };
  totalAttributedRevenue: number;
  totalAttributedOrders: number;
  unattributedRevenue: number;
  unattributedOrders: number;
  byConfidence: {
    HIGH: { revenue: number; orders: number };
    MEDIUM: { revenue: number; orders: number };
    ESTIMATED: { revenue: number; orders: number };
  };
  bySource: Array<{
    source: string;
    revenue: number;
    orders: number;
    confidence: string;
  }>;
}

export default function AttributionPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await authedFetch(
        `/api/attribution/tenants/${params.id}/attribution/report?days=${days}`,
      );
      if (r.ok) setReport((await r.json()) as Report);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, days]);

  async function reattribute() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch(
        `/api/attribution/tenants/${params.id}/attribution/reattribute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days }),
        },
      );
      const data = (await r.json()) as { attributedCount: number; unmatched: number };
      setMsg(`Re-attributed ${data.attributedCount}, unmatched ${data.unmatched}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8 max-w-5xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!report) return null;

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attribution</h1>
          <p className="text-sm text-slate-500">
            Campaign-level revenue with confidence scoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onChange={(e) => setDays(Number(e.target.value))}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
          <Button onClick={reattribute} disabled={busy}>
            Re-attribute now
          </Button>
          <Link
            href={`/tenants/${params.id}/ads`}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Ads →
          </Link>
        </div>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Attributed revenue</div><div className="text-2xl font-bold">{report.totalAttributedRevenue}</div></CardBody></Card>
        <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Attributed orders</div><div className="text-2xl font-bold">{report.totalAttributedOrders}</div></CardBody></Card>
        <Card className="bg-amber-50"><CardBody className="space-y-1"><div className="text-xs text-slate-500">Unattributed revenue</div><div className="text-2xl font-bold">{report.unattributedRevenue}</div></CardBody></Card>
        <Card className="bg-amber-50"><CardBody className="space-y-1"><div className="text-xs text-slate-500">Unattributed orders</div><div className="text-2xl font-bold">{report.unattributedOrders}</div></CardBody></Card>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>By confidence</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
              <Badge variant="success">HIGH</Badge>
              <div className="text-xl font-bold mt-1">{report.byConfidence.HIGH.revenue}</div>
              <div className="text-xs text-slate-500">{report.byConfidence.HIGH.orders} orders</div>
            </div>
            <div className="rounded border border-amber-200 bg-amber-50 p-3">
              <Badge variant="warning">MEDIUM</Badge>
              <div className="text-xl font-bold mt-1">{report.byConfidence.MEDIUM.revenue}</div>
              <div className="text-xs text-slate-500">{report.byConfidence.MEDIUM.orders} orders</div>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <Badge variant="default">ESTIMATED</Badge>
              <div className="text-xl font-bold mt-1">{report.byConfidence.ESTIMATED.revenue}</div>
              <div className="text-xs text-slate-500">{report.byConfidence.ESTIMATED.orders} orders</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>By source</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.bySource.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500">
                    No attribution data in the selected period.
                  </TableCell>
                </TableRow>
              )}
              {report.bySource.map((s) => (
                <TableRow key={s.source}>
                  <TableCell>{s.source}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.confidence === 'HIGH'
                          ? 'success'
                          : s.confidence === 'MEDIUM'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {s.confidence}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.revenue}</TableCell>
                  <TableCell>{s.orders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </main>
  );
}
