'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardTitle, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface BrandKit {
  id: string;
  tagline: string | null;
  taglineAr: string | null;
  tone: string | null;
  toneAr: string | null;
  colors: Array<{ name: string; hex: string }> | null;
  status: string;
}

export default function PortalBrandPage() {
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const me = await authedFetch('/api/portal/me').then((r) => r.json());
      const r = await authedFetch(`/api/brand/portal/tenants/${me.tenantId}/brand-kit`);
      if (r.ok) setKit((await r.json()) as BrandKit | null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve() {
    setBusy(true);
    try {
      const me = await authedFetch('/api/portal/me').then((r) => r.json());
      const r = await authedFetch(
        `/api/brand/portal/tenants/${me.tenantId}/brand-kit/approve`,
        { method: 'POST' },
      );
      if (r.ok) {
        setMsg('Brand kit approved');
        await load();
      } else {
        setMsg(`Failed: ${r.status}`);
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (!kit) {
    return (
      <main className="p-4 space-y-3">
        <h1 className="text-xl font-bold">Brand</h1>
        <p className="text-sm text-slate-500">
          Your brand kit is being prepared by the agency.
        </p>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Brand</h1>
        <Badge
          variant={
            kit.status === 'APPROVED'
              ? 'success'
              : kit.status === 'CLIENT_REVIEW'
                ? 'warning'
                : 'default'
          }
        >
          {kit.status}
        </Badge>
      </header>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Brand kit</CardTitle>
          {kit.taglineAr && (
            <div dir="rtl" className="rounded bg-slate-50 p-3 text-sm">
              {kit.taglineAr}
            </div>
          )}
          {kit.tagline && (
            <div dir="ltr" className="rounded bg-slate-50 p-3 text-sm">
              {kit.tagline}
            </div>
          )}
          {kit.colors && kit.colors.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {kit.colors.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded border border-slate-200 p-1 pr-3"
                >
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: c.hex }}
                  />
                  <span className="text-xs">{c.name || c.hex}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {kit.status === 'CLIENT_REVIEW' && (
        <Card>
          <CardBody className="space-y-2">
            <p className="text-sm">Ready to approve your brand kit?</p>
            {msg && <p className="text-sm text-slate-700">{msg}</p>}
            <Button onClick={approve} disabled={busy}>
              {busy ? 'Approving…' : 'Approve brand kit'}
            </Button>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
