'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Badge,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../../../lib/session';

interface JourneyRun {
  id: string;
  journeyId: string;
  customerId: string;
  status: string;
  enteredAt: string;
  exitedAt: string | null;
  exitReason: string | null;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  ENTERED: 'default',
  RUNNING: 'warning',
  MESSAGED: 'success',
  COMPLETED: 'success',
  EXITED: 'warning',
  FAILED: 'danger',
};

export default function JourneyRunsPage() {
  const params = useParams<{ id: string; journeyId: string }>();
  const [runs, setRuns] = useState<JourneyRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch(
      `/api/journeys/tenants/${params.id}/journeys/${params.journeyId}/runs`,
    )
      .then(async (r) => {
        if (!r.ok) return;
        setRuns((await r.json()) as JourneyRun[]);
      })
      .finally(() => setLoading(false));
  }, [params.id, params.journeyId]);

  if (loading) {
    return (
      <main className="p-8 max-w-5xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <Link
          href={`/tenants/${params.id}/journeys/${params.journeyId}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Journey
        </Link>
        <h1 className="text-2xl font-bold mt-1">Run history</h1>
      </header>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Entered</TableHead>
              <TableHead>Exited</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  No runs yet.
                </TableCell>
              </TableRow>
            )}
            {runs.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{r.customerId.slice(0, 8)}…</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[r.status] ?? 'default'}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(r.enteredAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs">
                  {r.exitedAt ? new Date(r.exitedAt).toLocaleString() : '—'}
                </TableCell>
                <TableCell className="text-xs">{r.exitReason ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
