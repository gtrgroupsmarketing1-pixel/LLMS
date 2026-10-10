'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardBody, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface Invoice {
  id: string;
  amount: string;
  currency: string;
  status: string;
  dueDate: string;
}

export default function PortalInvoices() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/portal/invoices')
      .then(async (r) => {
        if (!r.ok) return;
        setItems((await r.json()) as Invoice[]);
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
      <h1 className="text-xl font-bold">Invoices</h1>
      {items.length === 0 && (
        <p className="text-sm text-slate-500">No invoices yet.</p>
      )}
      {items.map((i) => (
        <Card key={i.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {i.currency} {i.amount}
              </div>
              <div className="text-xs text-slate-500">
                Due {new Date(i.dueDate).toLocaleDateString()}
              </div>
            </div>
            <Badge variant={i.status === 'PAID' ? 'success' : 'warning'}>
              {i.status}
            </Badge>
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
