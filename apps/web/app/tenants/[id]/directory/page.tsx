'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { authedFetch } from '../../../../lib/session';

const COUNTRIES = ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'] as const;
const STATUSES = ['NOT_SUBMITTED', 'PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'];

interface Listing {
  id: string;
  country: string;
  platformName: string;
  platformUrl: string | null;
  status: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  notes: string | null;
}

export default function DirectoryListingsPage() {
  const params = useParams<{ id: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncCountry, setSyncCountry] = useState<string>('AE');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await authedFetch(
        `/api/reviews/tenants/${params.id}/directory`,
      );
      if (r.ok) setListings((await r.json()) as Listing[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function sync() {
    setBusy(true);
    try {
      await authedFetch(`/api/reviews/tenants/${params.id}/directory/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: syncCountry }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(listingId: string, status: string) {
    await authedFetch(
      `/api/reviews/tenants/${params.id}/directory/${listingId}/status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      },
    );
    await load();
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
      <header>
        <h1 className="text-2xl font-bold">Directory Listings</h1>
        <p className="text-sm text-slate-500">
          GCC local listings — status per country and platform.
        </p>
      </header>

      <Card>
        <CardBody className="flex gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Country</label>
            <Select
              value={syncCountry}
              onChange={(e) => setSyncCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={sync} disabled={busy}>
            Sync directory checklist
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Listings ({listings.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    No listings yet. Sync a country to seed the checklist.
                  </TableCell>
                </TableRow>
              )}
              {listings.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.country}</TableCell>
                  <TableCell>
                    {l.platformUrl ? (
                      <a
                        href={l.platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {l.platformName}
                      </a>
                    ) : (
                      l.platformName
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        l.status === 'VERIFIED'
                          ? 'success'
                          : l.status === 'REJECTED'
                            ? 'danger'
                            : l.status === 'SUBMITTED'
                              ? 'info'
                              : 'default'
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {l.notes ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value)}
                      className="w-40"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
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
