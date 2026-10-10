'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch, getAccessToken } from '../../lib/session';

interface Tenant {
  id: string;
  nameAr: string;
  nameEn: string;
  mode: string;
  country: string;
  package: string;
  status: string;
  churnRisk: boolean;
  upgradeReady: boolean;
}

const modeBadge: Record<string, 'info' | 'success' | 'warning'> = {
  ERP_CONNECTED: 'success',
  STANDALONE: 'info',
  UPGRADING: 'warning',
};

export default function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    authedFetch('/api/tenants')
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        const data = (await r.json()) as { items: Tenant[] };
        setItems(data.items ?? []);
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            localStorage.removeItem('lmms.accessToken');
            localStorage.removeItem('lmms.refreshToken');
            window.location.href = '/login';
          }}
        >
          Sign out
        </Button>
      </header>

      {loading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <Card>
          <div className="p-6 text-center text-slate-500 text-sm">
            No tenants yet.
          </div>
        </Card>
      )}

      {items.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (AR)</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link
                      href={`/tenants/${t.id}`}
                      className="text-slate-900 underline-offset-2 hover:underline"
                    >
                      {t.nameEn}
                    </Link>
                  </TableCell>
                  <TableCell>{t.nameAr}</TableCell>
                  <TableCell>
                    <Badge variant={modeBadge[t.mode] ?? 'default'}>{t.mode}</Badge>
                  </TableCell>
                  <TableCell>{t.country}</TableCell>
                  <TableCell>{t.package}</TableCell>
                  <TableCell className="space-x-1 rtl:space-x-reverse">
                    {t.churnRisk && <Badge variant="danger">Churn risk</Badge>}
                    {t.upgradeReady && <Badge variant="info">Upgrade ready</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </main>
  );
}
