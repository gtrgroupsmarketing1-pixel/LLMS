'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Campaign {
  id: string;
  name: string;
  status: string;
  channel: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  totalCost: string | number;
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

export default function CampaignsPage() {
  const params = useParams<{ id: string }>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch(`/api/campaigns/tenants/${params.id}/campaigns`)
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        setCampaigns((await r.json()) as Campaign[]);
      })
      .catch(() => setError('Network error'));
  }, [params.id]);

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-sm text-slate-500">WhatsApp campaigns sent to segments.</p>
      </header>

      {error && <p className="text-red-600">{error}</p>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500">
                  No campaigns yet.
                </TableCell>
              </TableRow>
            )}
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.channel}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[c.status] ?? 'default'}>
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell>{c.totalRecipients}</TableCell>
                <TableCell>{c.sentCount}</TableCell>
                <TableCell>{c.failedCount}</TableCell>
                <TableCell>{String(c.totalCost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
