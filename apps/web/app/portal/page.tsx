'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardBody, CardTitle, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../lib/portal/session';

interface DashboardData {
  tenant: { id: string; nameEn: string; nameAr: string; mode: string };
  metrics: {
    campaignsSentThisMonth: number;
    messagesSentThisMonth: number;
    pendingApprovals: number;
    negativeReviewsPending: number;
    unreadMessages: number;
  };
  freshness: { lastSyncAt: string | null; fresh: boolean };
}

interface UpgradePrompt {
  show: boolean;
  dismissedUntil: string | null;
  reason?: string;
}

export default function PortalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradePrompt | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch('/api/portal/dashboard')
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        setData((await r.json()) as DashboardData);
      })
      .catch(() => setError('Network error'));

    authedFetch('/api/portal/upgrade-prompt')
      .then(async (r) => {
        if (!r.ok) return;
        setUpgrade((await r.json()) as UpgradePrompt);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  async function dismiss() {
    setDismissing(true);
    await authedFetch('/api/portal/upgrade-prompt/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 7 }),
    });
    setUpgrade({ show: false, dismissedUntil: null });
    setDismissing(false);
  }

  if (error) {
    return (
      <main className="p-4">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </main>
    );
  }

  const fresh = data.freshness.fresh;

  return (
    <main className="p-4 space-y-4">
      <header>
        <h1 className="text-xl font-bold">{data.tenant.nameAr}</h1>
        <p className="text-xs text-slate-500">{data.tenant.nameEn}</p>
      </header>

      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
          fresh
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        <span>{fresh ? '🟢' : '🟡'}</span>
        <span>{fresh ? 'Data fresh' : 'Data may be stale'}</span>
        {data.freshness.lastSyncAt && (
          <span className="opacity-70">
            · {new Date(data.freshness.lastSyncAt).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Campaigns (month)"
          value={data.metrics.campaignsSentThisMonth}
          href="/portal/campaigns"
        />
        <MetricCard
          label="Messages (month)"
          value={data.metrics.messagesSentThisMonth}
          href="/portal/campaigns"
        />
        <MetricCard
          label="Pending approvals"
          value={data.metrics.pendingApprovals}
          href="/portal/approvals"
          tone={data.metrics.pendingApprovals > 0 ? 'warn' : 'default'}
        />
        <MetricCard
          label="Unread messages"
          value={data.metrics.unreadMessages}
          href="/portal/messages"
        />
      </div>

      {upgrade?.show && (
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="space-y-2">
            <CardTitle>Unlock more with ERP connection</CardTitle>
            <p className="text-xs text-blue-900">{upgrade.reason}</p>
            <div className="flex gap-2">
              <Link href="/portal/data-sources">
                <Button size="sm">Learn more</Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={dismiss}
                disabled={dismissing}
              >
                Dismiss 7 days
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  href,
  tone = 'default',
}: {
  label: string;
  value: number;
  href: string;
  tone?: 'default' | 'warn';
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg border p-4 no-underline ${
        tone === 'warn'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </Link>
  );
}
