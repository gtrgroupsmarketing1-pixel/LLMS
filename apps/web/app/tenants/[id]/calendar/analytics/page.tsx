'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardBody,
  CardTitle,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../../lib/session';

interface Analytics {
  total: number;
  buckets: Array<{ reason: string; count: number; percent: number }>;
}

export default function RejectionAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch(
      `/api/content-notifications/agency/tenants/${params.id}/rejection-analytics`,
    )
      .then(async (r) => {
        if (!r.ok) return;
        setData((await r.json()) as Analytics);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <main className="p-8 max-w-3xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rejection Analytics</h1>
          <p className="text-sm text-slate-500">
            Why content cards get rejected — drives template and brief improvements.
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
        <CardBody className="space-y-3">
          <CardTitle>Total rejected: {data?.total ?? 0}</CardTitle>
          {(!data || data.buckets.length === 0) && (
            <p className="text-sm text-slate-500">No rejections yet.</p>
          )}
          {data?.buckets.map((b, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{b.reason}</span>
                <span className="text-slate-500">
                  {b.count} · {b.percent}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-slate-900"
                  style={{ width: `${Math.min(100, b.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </main>
  );
}
