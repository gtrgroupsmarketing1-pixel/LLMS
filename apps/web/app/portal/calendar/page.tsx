'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, CardBody, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface CardRow {
  id: string;
  title: string;
  channel: string;
  status: string;
  scheduledAt: string | null;
  copy: {
    ar: { text: string | null; dir: 'rtl' | 'ltr' };
    en: { text: string | null; dir: 'rtl' | 'ltr' };
  };
}

export default function PortalCalendarPage() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/content-portal/cards')
      .then(async (r) => {
        if (!r.ok) return;
        setCards((await r.json()) as CardRow[]);
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
      <h1 className="text-xl font-bold">Content Calendar</h1>
      {cards.length === 0 && (
        <p className="text-sm text-slate-500">No content cards yet.</p>
      )}
      {cards.map((c) => (
        <Card key={c.id}>
          <CardBody className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/portal/calendar/${c.id}`}
                className="font-semibold no-underline text-slate-900 hover:underline"
              >
                {c.title}
              </Link>
              <Badge
                variant={
                  c.status === 'CLIENT_REVIEW'
                    ? 'warning'
                    : c.status === 'APPROVED' || c.status === 'LIVE'
                      ? 'success'
                      : c.status === 'REJECTED'
                        ? 'danger'
                        : 'default'
                }
              >
                {c.status}
              </Badge>
            </div>
            <div className="text-xs text-slate-500">{c.channel}</div>
            {c.copy.ar.text && (
              <div dir="rtl" className="rounded bg-slate-50 p-2 text-sm">
                {c.copy.ar.text}
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
