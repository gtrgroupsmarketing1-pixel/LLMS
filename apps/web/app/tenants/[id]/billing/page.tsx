'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Input,
  Label,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Invoice {
  id: string;
  number: string;
  status: string;
  currency: string;
  total: string | number;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
}

interface Payment {
  id: string;
  provider: string;
  status: string;
  amount: string | number;
  currency: string;
  paymentUrl: string | null;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  SENT: 'info',
  PAID: 'success',
  OVERDUE: 'danger',
  VOID: 'default',
  REFUNDED: 'default',
};

export default function BillingPage() {
  const params = useParams<{ id: string }>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [baseFee, setBaseFee] = useState('1500');
  const [currency, setCurrency] = useState('AED');
  const [country, setCountry] = useState('AE');

  async function load() {
    setLoading(true);
    try {
      const [iRes, pRes] = await Promise.all([
        authedFetch(`/api/billing/tenants/${params.id}/invoices`),
        authedFetch(`/api/billing/tenants/${params.id}/payments`),
      ]);
      if (iRes.ok) setInvoices((await iRes.json()) as Invoice[]);
      if (pRes.ok) setPayments((await pRes.json()) as Payment[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function createInvoice() {
    setBusy(true);
    setMsg(null);
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const dueDate = new Date(Date.now() + 14 * 86_400_000);
      const r = await authedFetch(
        `/api/billing/tenants/${params.id}/invoices`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantPrefix: params.id.slice(0, 4),
            country,
            currency,
            periodStart,
            periodEnd,
            dueDate,
            baseFee: Number(baseFee),
            baseFeeDescription: 'Monthly package fee',
            usageLines: [],
          }),
        },
      );
      if (r.ok) {
        setMsg('Invoice created');
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function generatePdf(invoiceId: string) {
    await authedFetch(
      `/api/billing/tenants/${params.id}/invoices/${invoiceId}/pdf`,
      { method: 'POST' },
    );
    setMsg('PDF generated');
    await load();
  }

  async function sendInvoice(invoiceId: string) {
    await authedFetch(
      `/api/billing/tenants/${params.id}/invoices/${invoiceId}/send`,
      { method: 'POST' },
    );
    setMsg('Invoice sent');
    await load();
  }

  async function initiatePayment(invoiceId: string, provider: string) {
    const r = await authedFetch(
      `/api/billing/tenants/${params.id}/invoices/${invoiceId}/payments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          returnUrl: `${window.location.origin}/tenants/${params.id}/billing`,
        }),
      },
    );
    if (!r.ok) {
      setMsg(`Payment init failed: ${r.status}`);
      return;
    }
    const p = (await r.json()) as Payment;
    if (p.paymentUrl) {
      window.open(p.paymentUrl, '_blank');
    }
    setMsg(`Payment initiated via ${provider}`);
    await load();
  }

  async function capturePayment(paymentId: string) {
    await authedFetch(
      `/api/billing/tenants/${params.id}/payments/${paymentId}/capture`,
      { method: 'POST' },
    );
    setMsg('Payment captured');
    await load();
  }

  if (loading) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-slate-500">
          Invoices, VAT per country, and payment gateway integration.
        </p>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Create invoice</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Base fee</Label>
              <Input
                type="number"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {['AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                {['AE', 'SA', 'KW', 'QA', 'BH', 'OM'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button onClick={createInvoice} disabled={busy}>
            Generate invoice
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Invoices ({invoices.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.number}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[i.status] ?? 'default'}>
                      {i.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {i.currency} {String(i.total)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(i.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => generatePdf(i.id)}>
                        PDF
                      </Button>
                      {i.status === 'DRAFT' && (
                        <Button size="sm" onClick={() => sendInvoice(i.id)}>
                          Send
                        </Button>
                      )}
                      {i.status === 'SENT' && (
                        <>
                          <Button size="sm" onClick={() => initiatePayment(i.id, 'STRIPE')}>
                            Pay Stripe
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => initiatePayment(i.id, 'TELR')}>
                            Pay Telr
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Payments ({payments.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500">
                    No payments yet.
                  </TableCell>
                </TableRow>
              )}
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.provider}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === 'CAPTURED'
                          ? 'success'
                          : p.status === 'FAILED'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.currency} {String(p.amount)}
                  </TableCell>
                  <TableCell>
                    {p.status === 'PENDING' && (
                      <Button size="sm" onClick={() => capturePayment(p.id)}>
                        Capture
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </main>
  );
}
