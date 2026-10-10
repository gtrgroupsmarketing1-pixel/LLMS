'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { authedFetch } from '../../../../lib/session';

interface ComplianceDashboard {
  consentBreakdown: Array<{ channel: string; status: string; count: number }>;
  dncCount: number;
  optOutSla: {
    eventsLast24h: number;
    propagatedWithin5Min: number;
    slaPercent: number;
  };
  retentionSchedule: Array<{
    country: string;
    dataType: string;
    retentionDays: number;
  }>;
  erasureQueue: Array<{
    id: string;
    status: string;
    dueAt: string;
    daysRemaining: number;
  }>;
  smsSenderIds: Array<{ country: string; senderId: string; status: string }>;
}

export default function CompliancePage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [auditOk, setAuditOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch(`/api/compliance/tenants/${params.id}/compliance/dashboard`)
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        setData((await r.json()) as ComplianceDashboard);
      })
      .catch(() => setError('Network error'));

    authedFetch(`/api/compliance/tenants/${params.id}/audit/verify`)
      .then(async (r) => {
        if (!r.ok) return;
        const d = (await r.json()) as { valid: boolean };
        setAuditOk(d.valid);
      })
      .catch(() => {
        // ignore
      });
  }, [params.id]);

  if (error) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-8 max-w-4xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Compliance</h1>
        <p className="text-sm text-slate-500">
          Consent, opt-out, retention, erasure, and audit trail.
        </p>
      </header>

      <Card>
        <CardBody className="space-y-2">
          <CardTitle>Audit chain integrity</CardTitle>
          <p className="text-sm">
            {auditOk === null
              ? 'Checking…'
              : auditOk
                ? 'Valid — hash chain intact.'
                : 'Broken — investigate immediately.'}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Consent breakdown</CardTitle>
          {data.consentBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No consent records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.consentBreakdown.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell>{c.channel}</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell>{c.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Opt-out SLA (last 24h)</CardTitle>
          <p className="text-sm">
            {data.optOutSla.propagatedWithin5Min} of {data.optOutSla.eventsLast24h}{' '}
            propagated within 5 minutes ({data.optOutSla.slaPercent}%).
          </p>
          <p className="text-sm text-slate-500">
            Do-Not-Contact list: {data.dncCount} customer(s).
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Retention policy</CardTitle>
          {data.retentionSchedule.length === 0 ? (
            <p className="text-sm text-slate-500">
              No retention policies seeded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Data type</TableHead>
                  <TableHead>Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.retentionSchedule.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.country}</TableCell>
                    <TableCell>{r.dataType}</TableCell>
                    <TableCell>{r.retentionDays}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Erasure queue</CardTitle>
          {data.erasureQueue.length === 0 ? (
            <p className="text-sm text-slate-500">No pending erasures.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Days remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.erasureQueue.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Badge variant="warning">{e.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(e.dueAt).toLocaleDateString()}</TableCell>
                    <TableCell>{e.daysRemaining}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>SMS sender IDs</CardTitle>
          {data.smsSenderIds.length === 0 ? (
            <p className="text-sm text-slate-500">No SMS senders registered.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Sender ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.smsSenderIds.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{s.country}</TableCell>
                    <TableCell>{s.senderId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === 'APPROVED'
                            ? 'success'
                            : s.status === 'PENDING'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
