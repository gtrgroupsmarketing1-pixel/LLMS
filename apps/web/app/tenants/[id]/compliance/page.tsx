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
  optOutSla: { eventsLast24h: number; propagatedWithin5Min: number; slaPercent: number };
  retentionSchedule: Array<{ country: string; dataType: string; retentionDays: number }>;
  erasureQueue: Array<{ id: string; status: string; dueAt: string; daysRemaining: number }>;
  smsSenderIds: Array<{ country: string; senderId: string; status: string }>;
}

interface Dpa {
  id: string;
  version: number;
  contentMd: string;
  acceptedAt: string | null;
}

interface PrivacyPolicy {
  id: string;
  version: string;
  contentEn: string;
  contentAr: string;
  publishedAt: string;
}

interface ProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  retentionDays: number;
}

export default function CompliancePage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [dpa, setDpa] = useState<Dpa | null>(null);
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [auditOk, setAuditOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [dRes, dpaRes, pRes, aRes, audRes] = await Promise.all([
        authedFetch(`/api/compliance/tenants/${params.id}/compliance/dashboard`),
        authedFetch(`/api/compliance/tenants/${params.id}/dpa`),
        authedFetch(`/api/compliance/compliance/privacy-policy`),
        authedFetch(`/api/compliance/compliance/processing-activities?tenantId=${params.id}`),
        authedFetch(`/api/compliance/tenants/${params.id}/audit/verify`),
      ]);

      if (dRes.ok) setData(await dRes.json());
      if (dpaRes.ok) setDpa(await dpaRes.json());
      if (pRes.ok) setPolicy(await pRes.json());
      if (aRes.ok) setActivities(await aRes.json());
      if (audRes.ok) {
        const a = await audRes.json();
        setAuditOk(a.valid);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function acceptDpa() {
    if (!dpa) return;
    setBusy('dpa');
    setMsg(null);
    try {
      await authedFetch(`/api/compliance/tenants/${params.id}/dpa/${dpa.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData: 'Accepted via Portal' }),
      });
      setMsg('DPA accepted');
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function acceptPolicy() {
    if (!policy) return;
    setBusy('policy');
    setMsg(null);
    try {
      await authedFetch(`/api/compliance/tenants/${params.id}/privacy-policy/${policy.id}/accept`, {
        method: 'POST',
      });
      setMsg('Privacy policy accepted');
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
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
          Consent, DPAs, privacy policies, and regulatory oversight.
        </p>
      </header>

      {msg && <p className="text-sm text-emerald-600 font-medium">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={dpa?.acceptedAt ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}>
          <CardBody className="space-y-2">
            <CardTitle>Data Processing Agreement</CardTitle>
            <p className="text-sm">
              {dpa?.acceptedAt
                ? `Accepted on ${new Date(dpa.acceptedAt).toLocaleDateString()}`
                : 'Action Required: Please review and accept the DPA.'}
            </p>
            {!dpa?.acceptedAt && dpa && (
              <Button size="sm" onClick={acceptDpa} disabled={busy === 'dpa'}>
                {busy === 'dpa' ? 'Accepting…' : 'Accept DPA'}
              </Button>
            )}
            {dpa?.acceptedAt && <Badge variant="success">Signed</Badge>}
          </CardBody>
        </Card>

        <Card className={policy ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}>
          <CardBody className="space-y-2">
            <CardTitle>Privacy Policy</CardTitle>
            <p className="text-sm">
              {policy ? `Latest version: ${policy.version}` : 'No policy published yet.'}
            </p>
            {policy && (
              <Button size="sm" variant="outline" onClick={acceptPolicy} disabled={busy === 'policy'}>
                {busy === 'policy' ? 'Accepting…' : 'Accept Policy'}
              </Button>
            )}
          </CardBody>
        </Card>

        <Card className={auditOk ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}>
          <CardBody className="space-y-2">
            <CardTitle>Audit Chain Integrity</CardTitle>
            <p className="text-sm">
              {auditOk === null ? 'Checking…' : auditOk ? 'Valid — hash chain intact.' : 'Broken — investigate immediately.'}
            </p>
            {auditOk === true && <Badge variant="success">Verified</Badge>}
            {auditOk === false && <Badge variant="danger">Tampered</Badge>}
          </CardBody>
        </Card>
      </div>

      {data && (
        <>
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
              <CardTitle>Processing Activity Registry (Article 30)</CardTitle>
              <p className="text-sm text-slate-500">Data we process, the legal basis, and retention.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Legal Basis</TableHead>
                    <TableHead>Retention</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-xs">{a.purpose}</TableCell>
                      <TableCell><Badge variant="info">{a.legalBasis}</Badge></TableCell>
                      <TableCell>{a.retentionDays} days</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Opt-out SLA (last 24h)</CardTitle>
              <p className="text-sm">
                {data.optOutSla.propagatedWithin5Min} of {data.optOutSla.eventsLast24h} propagated within 5 minutes ({data.optOutSla.slaPercent}%).
              </p>
              <p className="text-sm text-slate-500">Do-Not-Contact list: {data.dncCount} customer(s).</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Retention & Erasure</CardTitle>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Retention (Days)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.retentionSchedule.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.dataType}</TableCell>
                      <TableCell>{r.retentionDays}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <span className="text-sm font-medium">Erasure queue:</span>{' '}
                {data.erasureQueue.length} pending request(s).
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </main>
  );
}
