'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface Review {
  id: string;
  platform: string;
  rating: number;
  text: string;
  responded: boolean;
  createdAt: string;
}

export default function PortalReviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/portal/reviews')
      .then(async (r) => {
        if (!r.ok) return;
        setItems((await r.json()) as Review[]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
      </main>
    );
  }

  const negatives = items.filter((r) => r.rating <= 2 && !r.responded);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Reviews</h1>

      {negatives.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardBody>
            <p className="text-sm text-red-800">
              ⚠️ {negatives.length} negative review
              {negatives.length > 1 ? 's' : ''} awaiting response.
            </p>
          </CardBody>
        </Card>
      )}

      {items.length === 0 && (
        <p className="text-sm text-slate-500">
          The reviews module lands in V2.5.
        </p>
      )}

      {items.map((r) => (
        <Card key={r.id}>
          <CardBody className="space-y-2">
            <div className="text-xs text-slate-500">
              {r.platform} · {r.rating}★ ·{' '}
              {new Date(r.createdAt).toLocaleDateString()}
            </div>
            <p className="text-sm">{r.text}</p>
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
