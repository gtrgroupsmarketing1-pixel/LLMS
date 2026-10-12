'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Job {
  id: string;
  status: string;
  startedAt: string;
  matchSummary: Record<string, number> | null;
  backfillStats: Record<string, number> | null;
}

interface Match {
  id: string;
  lmmsCustomerId: string;
  erpExternalId: string | null;
  status: string;
  confidence: number;
  notes: string | null;
}

export default function MigrationPage() {
  const params = useParams<{ id: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignInput, setAssignInput] = useState<Record<string, string>>({});

  async function load() {
    try {
      const r = await authedFetch(`/api/migration/tenants/${params.id}/migration/jobs`);
      if (!r.ok) return;
      setJobs((await r.json()) as Job[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function loadMatches(jobId: string) {
    setActiveJob(jobId);
    const r = await authedFetch(
      `/api/migration/tenants/${params.id}/migration/jobs/${jobId}/unmatched`,
    );
    if (!r.ok) return;
    setMatches((await r.json()) as Match[]);
  }

  async function start() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch(
        `/api/migration/tenants/${params.id}/migration/start`,
        { method: 'POST' },
      );
      const d = (await r.json()) as {
        matched: number;
        unmatched: number;
        ambiguous: number;
      };
      setMsg(
        `Started: matched ${d.matched}, unmatched ${d.unmatched}, ambiguous ${d.ambiguous}`,
      );
      void load();
    } finally {
      setBusy(false);
    }
  }

  async function resolve(
    jobId: string,
    match: Match,
    decision: 'ASSIGN' | 'SKIP',
  ) {
    const erpExternalId =
      decision === 'ASSIGN' ? assignInput[match.id] ?? '' : null;
    if (decision === 'ASSIGN' && !erpExternalId) return;
    await authedFetch(
      `/api/migration/tenants/${params.id}/migration/jobs/${jobId}/resolve-match`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, erpExternalId, decision }),
      },
    );
    void loadMatches(jobId);
  }

  async function backfill(jobId: string) {
    setBusy(true);
    try {
      const r = await authedFetch(
        `/api/migration/tenants/${params.id}/migration/jobs/${jobId}/backfill`,
        { method: 'POST' },
      );
      const d = (await r.json()) as {
        ordersBackfilled: number;
        customersLinked: number;
      };
      setMsg(
        `Backfilled ${d.ordersBackfilled} orders, linked ${d.customersLinked} customers`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function complete(jobId: string) {
    await authedFetch(
      `/api/migration/tenants/${params.id}/migration/jobs/${jobId}/complete`,
      { method: 'POST' },
    );
    setMsg('Migration completed');
    void load();
  }

  async function rollback(jobId: string) {
    const reason = window.prompt('Rollback reason (optional):') ?? '';
    await authedFetch(
      `/api/migration/tenants/${params.id}/migration/jobs/${jobId}/rollback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      },
    );
    setMsg('Rolled back');
    void load();
  }

  if (loading) {
    return (
      <main className="p-8 max-w-5xl mx-auto space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Migration to ERP</h1>
          <p className="text-sm text-slate-500">
            Upgrade a Standalone tenant to ERP-Connected with zero data loss.
          </p>
        </div>
        <Button onClick={start} disabled={busy}>
          Start migration
        </Button>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Jobs</CardTitle>
          {jobs.length === 0 && (
            <p className="text-sm text-slate-500">No migration jobs yet.</p>
          )}
          {jobs.map((j) => (
            <div
              key={j.id}
              className="space-y-2 rounded-md border border-slate-200 p-3"
            >
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    j.status === 'COMPLETED'
                      ? 'success'
                      : j.status === 'ROLLED_BACK' || j.status === 'FAILED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {j.status}
                </Badge>
                <span className="text-xs text-slate-500">
                  {new Date(j.startedAt).toLocaleString()}
                </span>
              </div>
              {j.matchSummary && (
                <div className="text-xs text-slate-600">
                  Matched {j.matchSummary.matched ?? 0} · Unmatched{' '}
                  {j.matchSummary.unmatched ?? 0} · Ambiguous{' '}
                  {j.matchSummary.ambiguous ?? 0}
                </div>
              )}
              {j.backfillStats && (
                <div className="text-xs text-slate-600">
                  Orders backfilled {j.backfillStats.ordersBackfilled ?? 0} · Customers
                  linked {j.backfillStats.customersLinked ?? 0}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadMatches(j.id)}
                >
                  Show unmatched
                </Button>
                {j.status === 'BACKFILLING' && (
                  <>
                    <Button size="sm" onClick={() => backfill(j.id)} disabled={busy}>
                      Backfill orders
                    </Button>
                    <Button size="sm" onClick={() => complete(j.id)}>
                      Complete
                    </Button>
                  </>
                )}
                {j.status !== 'ROLLED_BACK' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => rollback(j.id)}
                  >
                    Rollback
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {activeJob && (
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>Unmatched / ambiguous</CardTitle>
            {matches.length === 0 ? (
              <p className="text-sm text-slate-500">None.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LMMS ID</TableHead>
                    <TableHead>ERP ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">
                        {m.lmmsCustomerId.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.erpExternalId ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning">{m.status}</Badge>
                      </TableCell>
                      <TableCell>{m.confidence}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <Input
                            placeholder="ERP ID"
                            value={assignInput[m.id] ?? ''}
                            onChange={(e) =>
                              setAssignInput({
                                ...assignInput,
                                [m.id]: e.target.value,
                              })
                            }
                            className="h-8 w-28 text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => resolve(activeJob, m, 'ASSIGN')}
                          >
                            Assign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolve(activeJob, m, 'SKIP')}
                          >
                            Skip
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}
    </main>
  );
}
