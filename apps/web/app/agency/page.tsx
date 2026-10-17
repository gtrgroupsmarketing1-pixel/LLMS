'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
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
import { authedFetch, getAccessToken } from '../../lib/session';

interface Overview {
  totals: {
    tenants: number;
    byMode: Record<string, number>;
    pendingApprovals: number;
    failedSyncs: number;
    churnRisk: number;
    upgradeReady: number;
  };
  tenants: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    mode: string;
    country: string;
    package: string;
    churnRisk: boolean;
    upgradeReady: boolean;
    healthScore: number | null;
  }>;
}

export default function AgencyOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    authedFetch('/api/reporting/agency/overview')
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        setData((await r.json()) as Overview);
      })
      .catch(() => setError('Network error'));
  }, []);

  if (error) {
    return (
      <main className="p-8 max-w-6xl mx-auto">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  const t = data.totals;

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agency Overview</h1>
          <p className="text-sm text-slate-500">All tenants at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/agency/signups"
            className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            Self-Serve Signups
          </Link>
          <Link
            href="/agency/resellers"
            className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            Resellers
          </Link>
          <Link
            href="/agency/tools"
            className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            Agency Tools
          </Link>
          <Link
            href="/agency/pipeline"
            className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            Migration Pipeline
          </Link>
          <Link
            href="/tenants"
            className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            Tenants
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Tenants" value={t.tenants} />
        <Stat label="Pending approvals" value={t.pendingApprovals} />
        <Stat
          label="Failed syncs"
          value={t.failedSyncs}
          tone={t.failedSyncs > 0 ? 'warn' : 'default'}
        />
        <Stat
          label="Churn risk"
          value={t.churnRisk}
          tone={t.churnRisk > 0 ? 'warn' : 'default'}
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.tenants.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/tenants/${row.id}/dashboard`}
                    className="text-slate-900 underline-offset-2 hover:underline"
                  >
                    {row.nameEn}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.mode === 'ERP_CONNECTED'
                        ? 'success'
                        : row.mode === 'UPGRADING'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {row.mode}
                  </Badge>
                </TableCell>
                <TableCell>{row.country}</TableCell>
                <TableCell>{row.package}</TableCell>
                <TableCell className="space-x-1 rtl:space-x-reverse">
                  {row.churnRisk && <Badge variant="danger">Churn risk</Badge>}
                  {row.upgradeReady && <Badge variant="info">Upgrade ready</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'warn';
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
      }`}
    >
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
