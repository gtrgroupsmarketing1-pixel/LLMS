'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface Campaign {
  id: string;
  name: string;
  status: string;
  channel: string;
  sentCount: number;
  totalCost: string | number;
  createdAt: string;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  SCHEDULED: 'info',
  SENDING: 'warning',
  SENT: 'success',
  PAUSED: 'warning',
  CANCELLED: 'danger',
  FAILED: 'danger',
};

export default function PortalCampaigns() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/portal/campaigns')
      .then(async (r) => {
        if (!r.ok) return;
        setItems((await r.json()) as Campaign[]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Campaigns</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-slate-500">
                  No campaigns yet.
                </TableCell>
              </TableRow>
            )}
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[c.status] ?? 'default'}>
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell>{c.sentCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
