'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardBody, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface Review {
  id: string;
  authorName: string | null;
  rating: number;
  text: string | null;
  sentiment: string;
  responded: boolean;
  escalated: boolean;
  reviewedAt: string;
  responses: Array<{
    id: string;
    language: string;
    body: string;
    status: string;
  }>;
}

export default function PortalReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/reviews/portal/reviews')
      .then(async (r) => {
        if (!r.ok) return;
        setReviews((await r.json()) as Review[]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }

  const negatives = reviews.filter((r) => r.rating <= 2 && !r.responded);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Reviews</h1>

      {negatives.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardBody className="text-sm text-red-800">
            ⚠️ {negatives.length} negative review
            {negatives.length > 1 ? 's' : ''} awaiting response.
          </CardBody>
        </Card>
      )}

      {reviews.length === 0 && (
        <p className="text-sm text-slate-500">No reviews yet.</p>
      )}

      {reviews.map((r) => (
        <Card key={r.id}>
          <CardBody className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.authorName ?? 'Anonymous'}</span>
                <span className="text-amber-500">
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </span>
              </div>
              <Badge
                variant={
                  r.sentiment === 'POSITIVE'
                    ? 'success'
                    : r.sentiment === 'NEGATIVE'
                      ? 'danger'
                      : 'default'
                }
              >
                {r.sentiment}
              </Badge>
            </div>
            {r.text && (
              <p className="text-sm whitespace-pre-wrap">{r.text}</p>
            )}
            {r.responses.length > 0 && r.responses[0].status === 'POSTED' && (
              <div className="rounded bg-emerald-50 border border-emerald-200 p-3 text-sm">
                <span className="text-xs text-emerald-700 font-medium">
                  Agency responded:
                </span>
                <p
                  dir={r.responses[0].language === 'ar' ? 'rtl' : 'ltr'}
                  className="mt-1"
                >
                  {r.responses[0].body}
                </p>
              </div>
            )}
            <div className="text-xs text-slate-500">
              {new Date(r.reviewedAt).toLocaleString()}
            </div>
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
