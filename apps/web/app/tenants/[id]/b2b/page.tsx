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
  Label,
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

const CATEGORIES = [
  'HOTEL',
  'GYM',
  'SALON',
  'AIRBNB',
  'RESTAURANT',
  'OFFICE',
  'HOSPITAL',
  'SCHOOL',
  'OTHER',
] as const;

interface Prospect {
  id: string;
  businessName: string;
  category: string;
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  nextFollowUpAt: string | null;
}

interface Stats {
  prospectsByStatus: Array<{ status: string; count: number }>;
  activeContracts: number;
  activeContractValue: number;
}

export default function B2BPage() {
  const params = useParams<{ id: string }>();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [bizName, setBizName] = useState('');
  const [category, setCategory] = useState<string>('HOTEL');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [country, setCountry] = useState('AE');

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filter) qs.set('status', filter);
      const [pRes, sRes] = await Promise.all([
        authedFetch(`/api/b2b/tenants/${params.id}/prospects?${qs}`),
        authedFetch(`/api/b2b/tenants/${params.id}/pipeline-stats`),
      ]);
      if (pRes.ok) setProspects((await pRes.json()) as Prospect[]);
      if (sRes.ok) setStats((await sRes.json()) as Stats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, filter]);

  async function create() {
    if (!bizName) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch(
        `/api/b2b/tenants/${params.id}/prospects`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: bizName,
            category,
            contactName,
            contactEmail,
            country,
          }),
        },
      );
      if (r.ok) {
        setBizName('');
        setContactName('');
        setContactEmail('');
        setMsg('Prospect added');
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function transition(prospectId: string, to: string) {
    await authedFetch(
      `/api/b2b/tenants/${params.id}/prospects/${prospectId}/transition`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      },
    );
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
          <h1 className="text-2xl font-bold">B2B Pipeline</h1>
          <p className="text-sm text-slate-500">
            Hotels, gyms, salons, and offices — outreach to signed contract.
          </p>
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All statuses</option>
          {['NEW', 'CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </Select>
      </header>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Total prospects</div><div className="text-2xl font-bold">{stats.prospectsByStatus.reduce((s, x) => s + x.count, 0)}</div></CardBody></Card>
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Won</div><div className="text-2xl font-bold">{stats.prospectsByStatus.find((x) => x.status === 'WON')?.count ?? 0}</div></CardBody></Card>
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Active contracts</div><div className="text-2xl font-bold">{stats.activeContracts}</div></CardBody></Card>
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Contract value</div><div className="text-2xl font-bold">{stats.activeContractValue}</div></CardBody></Card>
        </div>
      )}

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Add prospect</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Business name</Label>
              <Input value={bizName} onChange={(e) => setBizName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                {['AE', 'SA', 'KW', 'QA', 'BH', 'OM'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Contact name</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Contact email</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={create} disabled={busy || !bizName}>
            Add prospect
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Pipeline ({prospects.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next follow-up</TableHead>
                <TableHead>Advance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    No prospects yet.
                  </TableCell>
                </TableRow>
              )}
              {prospects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.businessName}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-xs">
                    {p.contactName ?? '—'}
                    {p.contactEmail && (
                      <div className="text-slate-500">{p.contactEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === 'WON'
                          ? 'success'
                          : p.status === 'LOST'
                            ? 'danger'
                            : p.status === 'PROPOSAL' || p.status === 'NEGOTIATION'
                              ? 'warning'
                              : 'default'
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.nextFollowUpAt
                      ? new Date(p.nextFollowUpAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {p.status === 'NEW' && (
                        <Button size="sm" onClick={() => transition(p.id, 'CONTACTED')}>
                          Contact
                        </Button>
                      )}
                      {p.status === 'CONTACTED' && (
                        <>
                          <Button size="sm" onClick={() => transition(p.id, 'REPLIED')}>
                            Replied
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => transition(p.id, 'MEETING')}>
                            Meeting
                          </Button>
                        </>
                      )}
                      {p.status === 'REPLIED' && (
                        <Button size="sm" onClick={() => transition(p.id, 'MEETING')}>
                          Meeting
                        </Button>
                      )}
                      {p.status === 'MEETING' && (
                        <Button size="sm" onClick={() => transition(p.id, 'PROPOSAL')}>
                          Proposal
                        </Button>
                      )}
                      {p.status === 'PROPOSAL' && (
                        <>
                          <Button size="sm" onClick={() => transition(p.id, 'NEGOTIATION')}>
                            Negotiation
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => transition(p.id, 'WON')}>
                            Won
                          </Button>
                        </>
                      )}
                      {p.status === 'NEGOTIATION' && (
                        <Button size="sm" onClick={() => transition(p.id, 'WON')}>
                          Won
                        </Button>
                      )}
                      {p.status !== 'WON' && p.status !== 'LOST' && (
                        <Button size="sm" variant="danger" onClick={() => transition(p.id, 'LOST')}>
                          Lost
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </main>
  );
}
