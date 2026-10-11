'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardTitle, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface ReportRow {
  id: string;
  kind: 'MONTHLY_PDF' | 'WEEKLY_SUMMARY' | 'QBR_DECK';
  periodStart: string;
  periodEnd: string;
  status: string;
  generatedAt: string | null;
  payload: Record<string, unknown> | null;
}

export default function PortalReports() {
  const [items, setItems] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    authedFetch('/api/reporting/portal/reports/list')
      .then(async (r) => {
        if (!r.ok) return;
        const data = (await r.json()) as ReportRow[];
        setItems(Array.isArray(data) ? data : []);
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
        <p className="text-sm text-slate-500">No reports generated yet.</p>
      )}

      {items.map((r) => (
        <Card key={r.id}>
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {r.kind === 'MONTHLY_PDF' ? 'Monthly report' : 'Weekly summary'}
              </span>
              <Badge variant={r.status === 'READY' ? 'success' : 'warning'}>
                {r.status}
              </Badge>
            </div>
            <div className="text-xs text-slate-500">
              {r.periodStart.slice(0, 10)} → {r.periodEnd.slice(0, 10)}
              {r.generatedAt &&
                ` · generated ${new Date(r.generatedAt).toLocaleString()}`}
            </div>
            {r.kind === 'WEEKLY_SUMMARY' &&
              r.payload &&
              typeof r.payload.body === 'string' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview(String(r.payload!.body))}
                >
                  Preview summary
                </Button>
              )}
          </CardBody>
        </Card>
      ))}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPreview(null)}
        >
          <pre
            dir="rtl"
            className="max-w-md whitespace-pre-wrap rounded-lg bg-white p-4 text-right text-sm"
          >
            {preview}
          </pre>
        </div>
      )}
    </main>
  );
}
