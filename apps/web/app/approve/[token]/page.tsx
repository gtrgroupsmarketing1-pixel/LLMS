'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, CardBody, CardTitle, Skeleton } from '@lmms/ui';

interface ApprovalData {
  card: {
    id: string;
    title: string;
    channel: string;
  };
  copy: {
    ar: { text: string | null; dir: 'rtl' | 'ltr' };
    en: { text: string | null; dir: 'rtl' | 'ltr' };
  };
  expired: boolean;
  used: boolean;
  decision: string | null;
}

export default function OneTapApprovalPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<ApprovalData | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/content-calendar/public/approve/${params.token}`)
      .then(async (r) => {
        if (!r.ok) {
          setError(`Not found (${r.status})`);
          return;
        }
        setData((await r.json()) as ApprovalData);
      })
      .catch(() => setError('Network error'));
  }, [params.token]);

  async function decide(decision: 'APPROVE' | 'REJECT') {
    setBusy(true);
    try {
      const r = await fetch(`/api/content-calendar/public/approve/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      });
      const out = (await r.json()) as { error?: string };
      setBusy(false);
      if (r.ok) setDone(decision === 'APPROVE' ? 'Approved ✓' : 'Rejected');
      else setDone(`Error: ${out.error ?? 'unknown'}`);
    } catch {
      setBusy(false);
      setDone('Network error');
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardBody>
            <p className="text-red-600">{error}</p>
          </CardBody>
        </Card>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main dir="rtl" className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="text-center space-y-2">
            <p className="text-xl font-bold">{done}</p>
          </CardBody>
        </Card>
      </main>
    );
  }

  if (data.expired) {
    return (
      <main dir="rtl" className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="space-y-2">
            <CardTitle>Link expired</CardTitle>
            <p className="text-sm text-slate-500">
              Please approve via the portal.
            </p>
          </CardBody>
        </Card>
      </main>
    );
  }

  if (data.used) {
    return (
      <main dir="rtl" className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="space-y-2">
            <CardTitle>Already decided</CardTitle>
            <p className="text-sm text-slate-500">{data.decision}</p>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardBody className="space-y-4">
          <header>
            <CardTitle>{data.card.title}</CardTitle>
            <p className="text-xs text-slate-500 mt-1">{data.card.channel}</p>
          </header>

          {data.copy.ar.text && (
            <div dir="rtl" className="rounded bg-slate-50 p-3 text-sm">
              {data.copy.ar.text}
            </div>
          )}
          {data.copy.en.text && (
            <div dir="ltr" className="rounded bg-slate-50 p-3 text-sm">
              {data.copy.en.text}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-500">سبب الرفض (اختياري)</label>
            <textarea
              dir="rtl"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 p-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => decide('APPROVE')}
              disabled={busy}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Approve
            </Button>
            <Button
              onClick={() => decide('REJECT')}
              disabled={busy}
              variant="danger"
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
