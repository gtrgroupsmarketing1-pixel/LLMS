'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Badge,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../../lib/session';

interface QueueCard {
  id: string;
  title: string;
  channel: string;
  status: string;
  updatedAt: string;
}

export default function ApprovalQueuePage() {
  const params = useParams<{ id: string }>();
  const [items, setItems] = useState<QueueCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch(`/api/content-notifications/agency/tenants/${params.id}/approval-queue`)
      .then(async (r) => {
        if (!r.ok) return;
        setItems((await r.json()) as QueueCard[]);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

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
          <h1 className="text-2xl font-bold">Approval Queue</h1>
          <p className="text-sm text-slate-500">
            Content cards currently in internal or client review.
          </p>
        </div>
        <Link
          href={`/tenants/${params.id}/calendar`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Calendar
        </Link>
      </header>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500">
                  Nothing waiting for approval.
                </TableCell>
              </TableRow>
            )}
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link
                    href={`/tenants/${params.id}/calendar/${c.id}`}
                    className="text-slate-900 underline-offset-2 hover:underline"
                  >
                    {c.title}
                  </Link>
                </TableCell>
                <TableCell>{c.channel}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.status === 'CLIENT_REVIEW' ? 'warning' : 'info'
                    }
                  >
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {new Date(c.updatedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
