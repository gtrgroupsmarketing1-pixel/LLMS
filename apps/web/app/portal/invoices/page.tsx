'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface Invoice {
  id: string;
  number: string;
  status: string;
  currency: string;
  total: string | number;
  dueDate: string;
  paidAt: string | null;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  SENT: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  VOID: 'default',
  REFUNDED: 'default',
};

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/billing/portal/invoices')
      .then(async (r) => {
        if (!r.ok) return;
        setInvoices((await r.json()) as Invoice[]);
      })
      .finally(() => setLoading(false));
  }, []);

  function openPdf(invoiceId: string) {
    const token = localStorage.getItem('lmms.accessToken');
    fetch(`/api/billing/portal/invoices/${invoiceId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      });
  }

  if (loading) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Invoices</h1>
      {invoices.length === 0 && (
        <p className="text-sm text-slate-500">No invoices yet.</p>
      )}
      {invoices.map((i) => (
        <Card key={i.id}>
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{i.number}</span>
              <Badge variant={statusVariant[i.status] ?? 'default'}>
                {i.status}
              </Badge>
            </div>
            <div className="text-sm">
              {i.currency} {String(i.total)}
            </div>
            <div className="text-xs text-slate-500">
              {i.paidAt
                ? `Paid ${new Date(i.paidAt).toLocaleDateString()}`
                : `Due ${new Date(i.dueDate).toLocaleDateString()}`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPdf(i.id)}
            >
              Download PDF
            </Button>
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
