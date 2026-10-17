'use client';

import { useEffect, useState } from 'react';
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
import { authedFetch, getAccessToken } from '../../../lib/session';

interface Tenant {
  id: string;
  nameEn: string;
  region: string;
}

export default function ResidencyAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      // Reuse the reporting overview to get all tenants
      const r = await authedFetch('/api/reporting/agency/overview');
      if (r.ok) {
        const data = await r.json();
        setTenants(data.tenants);
      }
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

  async function changeRegion(id: string, region: string) {
    setBusy(id);
    setMsg(null);
    try {
      await authedFetch(`/api/residency/tenants/${id}/region`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region }),
      });
      setMsg(`Region updated for tenant ${id.slice(0, 8)}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function requestExport(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const r = await authedFetch(`/api/residency/tenants/${id}/exports`, {
        method: 'POST',
      });
      if (r.ok) setMsg(`Export requested for tenant ${id.slice(0, 8)}`);
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
          <h1 className="text-2xl font-bold">Data Residency</h1>
          <p className="text-sm text-slate-500">
            Manage tenant data regions and export requests.
          </p>
        </div>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Tenant Regions ({tenants.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nameEn}</TableCell>
                  <TableCell>
                    <Badge variant={t.region === 'UAE' ? 'info' : 'warning'}>
                      {t.region}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={t.region}
                        onChange={(e) => changeRegion(t.id, e.target.value)}
                        disabled={busy === t.id}
                        className="w-32 h-8 text-xs"
                      >
                        <option value="UAE">UAE</option>
                        <option value="KSA">KSA</option>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestExport(t.id)}
                        disabled={busy === t.id}
                      >
                        Export
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
