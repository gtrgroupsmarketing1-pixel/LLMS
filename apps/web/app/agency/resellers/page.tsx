'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Input,
  Label,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch, getAccessToken } from '../../../lib/session';

interface Reseller {
  id: string;
  name: string;
  domain: string;
  status: string;
  commissionPct: string | number;
  createdAt: string;
}

export default function ResellersPage() {
  const [items, setItems] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newCommission, setNewCommission] = useState('20');

  async function load() {
    setLoading(true);
    try {
      const r = await authedFetch('/api/resellers');
      if (r.ok) setItems((await r.json()) as Reseller[]);
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

  async function create() {
    if (!newName || !newDomain) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch('/api/resellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          domain: newDomain,
          commissionPct: Number(newCommission),
        }),
      });
      if (r.ok) {
        const data = (await r.json()) as { rawApiKey: string };
        setMsg(`Reseller created. API key (copy now): ${data.rawApiKey}`);
        setNewName('');
        setNewDomain('');
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await authedFetch(`/api/resellers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function setBranding(id: string) {
    const color = prompt('Primary color (hex):', '#0f172a') ?? '#0f172a';
    const logo = prompt('Logo URL:', '') ?? '';
    const support = prompt('Support email:', '') ?? '';
    await authedFetch(`/api/resellers/${id}/white-label`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primaryColor: color,
        logoUrl: logo || null,
        supportEmail: support || null,
      }),
    });
    setMsg('Branding updated');
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
          <h1 className="text-2xl font-bold">Resellers</h1>
          <p className="text-sm text-slate-500">
            White-label partners who resell LMMS under their own brand.
          </p>
        </div>
      </header>

      {msg && (
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="text-sm">{msg}</CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>New reseller</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Domain</Label>
              <Input
                placeholder="app.partner.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Commission %</Label>
              <Input
                type="number"
                value={newCommission}
                onChange={(e) => setNewCommission(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={create} disabled={busy || !newName || !newDomain}>
            Create reseller
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Active resellers ({items.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    No resellers yet.
                  </TableCell>
                </TableRow>
              )}
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.domain}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === 'ACTIVE'
                          ? 'success'
                          : r.status === 'SUSPENDED'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.commissionPct}%</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {r.status === 'PENDING' && (
                        <Button size="sm" onClick={() => setStatus(r.id, 'ACTIVE')}>
                          Activate
                        </Button>
                      )}
                      {r.status === 'ACTIVE' && (
                        <Button size="sm" variant="danger" onClick={() => setStatus(r.id, 'SUSPENDED')}>
                          Suspend
                        </Button>
                      )}
                      {r.status === 'SUSPENDED' && (
                        <Button size="sm" onClick={() => setStatus(r.id, 'ACTIVE')}>
                          Reactivate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setBranding(r.id)}>
                        Branding
                      </Button>
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
