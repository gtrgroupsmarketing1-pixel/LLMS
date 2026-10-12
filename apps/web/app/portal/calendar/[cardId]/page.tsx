'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Input,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/portal/session';

interface CardDetail {
  id: string;
  title: string;
  brief: string | null;
  copyAr: string | null;
  copyEn: string | null;
  channel: string;
  status: string;
  rejectionReason: string | null;
  copy: {
    ar: { text: string | null; dir: 'rtl' | 'ltr' };
    en: { text: string | null; dir: 'rtl' | 'ltr' };
  };
  comments: Array<{
    id: string;
    authorKind: string;
    body: string;
    createdAt: string;
  }>;
}

export default function PortalCardDetailPage() {
  const params = useParams<{ cardId: string }>();
  const router = useRouter();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await authedFetch(`/api/content-portal/cards/${params.cardId}`);
    if (!r.ok) return;
    setCard((await r.json()) as CardDetail);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.cardId]);

  async function comment_submit() {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await authedFetch(
        `/api/content-calendar/portal/cards/${params.cardId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: comment }),
        },
      );
      setComment('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      setMsg('Please describe why you are rejecting.');
      return;
    }
    setBusy(true);
    try {
      await authedFetch(
        `/api/content-calendar/agency/tenants/${''}/cards/${params.cardId}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: 'REJECTED', reason }),
        },
      );
      setMsg('Rejected');
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!card) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  const canDecide = card.status === 'CLIENT_REVIEW';

  return (
    <main className="p-4 space-y-4">
      <button
        onClick={() => router.push('/portal/calendar')}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Calendar
      </button>

      <header>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold">{card.title}</h1>
          <Badge variant={canDecide ? 'warning' : 'default'}>{card.status}</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">{card.channel}</p>
      </header>

      {card.rejectionReason && (
        <Card className="bg-red-50 border-red-200">
          <CardBody className="text-sm text-red-800">
            Rejection reason: {card.rejectionReason}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-3">
          {card.copy.ar.text && (
            <div dir="rtl" className="rounded bg-slate-50 p-3 text-sm">
              {card.copy.ar.text}
            </div>
          )}
          {card.copy.en.text && (
            <div dir="ltr" className="rounded bg-slate-50 p-3 text-sm">
              {card.copy.en.text}
            </div>
          )}
        </CardBody>
      </Card>

      {canDecide && (
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>Your decision</CardTitle>
            {msg && <p className="text-sm text-slate-700">{msg}</p>}
            <Input
              dir="rtl"
              placeholder="سبب الرفض (اختياري)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="danger"
                onClick={reject}
                disabled={busy}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              To approve, use the one-tap link you received on WhatsApp.
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Comments</CardTitle>
          {card.comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-md border p-3 ${
                c.authorKind === 'CLIENT'
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Badge variant={c.authorKind === 'CLIENT' ? 'info' : 'default'}>
                  {c.authorKind}
                </Badge>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Add comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={comment_submit} disabled={busy || !comment.trim()}>
              Post
            </Button>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
