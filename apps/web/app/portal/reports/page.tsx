'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardBody, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface Report {
  id: string;
  generatedAt: string;
  url: string;
}

export default function PortalReports() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/portal/reports')
      .then(async (r) => {
        if (!r.ok) return;
        const data = (await r.json()) as { items: Report[] };
        setItems(data.items ?? []);
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

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Reports</h1>
      {items.length === 0 && (
        <p className="text-sm text-slate-500">
          Monthly PDFs and weekly summaries arrive in V1.9.
        </p>
      )}
      {items.map((r) => (
        <Card key={r.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                Report · {new Date(r.generatedAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-slate-500">PDF</div>
            </div>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline"
            >
              Open
            </a>
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
