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

interface SignupRequest {
  id: string;
  businessName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  country: string;
  status: string;
  createdAt: string;
  rejectionReason: string | null;
}

export default function AgencySignupsPage() {
  const [items, setItems] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await authedFetch('/api/self-serve/signups');
      if (r.ok) setItems((await r.json()) as SignupRequest[]);
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

  async function approve(id: string) {
    setBusy(id);
    try {
      await authedFetch(`/api/self-serve/signups/${id}/approve`, { method: 'POST' });
      setMsg('Approved');
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function provision(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const r = await authedFetch(`/api/self-serve/signups/${id}/provision`, {
        method: 'POST',
      });
      const data = (await r.json()) as { id: string };
      setMsg(`Provisioned tenant ${data.id}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    const reason = prompt('Reason for rejection:') ?? 'no_reason';
    setBusy(id);
    try {
      await authedFetch(`/api/self-serve/signups/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      setMsg('Rejected');
      await load();
    } finally {
      setBusy(null);
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

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Self-Serve Signups</h1>
          <p className="text-sm text-slate-500">Approve, reject, or provision new tenant requests.</p>
        </div>
        <Link href="/agency" className="text-sm text-slate-500 hover:text-slate-900">
          ← Agency Overview
        </Link>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Requests ({items.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    No signup requests yet.
                  </TableCell>
                </TableRow>
              )}
              {items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.businessName}</TableCell>
                  <TableCell className="text-xs">
                    {s.contactName ?? '—'}
                    <div className="text-slate-500">{s.email}</div>
                  </TableCell>
                  <TableCell>{s.country}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.status === 'PROVISIONED'
                          ? 'success'
                          : s.status === 'APPROVED'
                            ? 'info'
                            : s.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                      }
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {s.status === 'PENDING' && (
                        <>
                          <Button size="sm" onClick={() => approve(s.id)} disabled={busy === s.id}>
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => reject(s.id)} disabled={busy === s.id}>
                            Reject
                          </Button>
                        </>
                      )}
                      {s.status === 'APPROVED' && (
                        <Button size="sm" onClick={() => provision(s.id)} disabled={busy === s.id}>
                          Provision Tenant
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
