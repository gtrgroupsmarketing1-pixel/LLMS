'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Input,
  Label,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../../lib/session';

interface CardDetail {
  id: string;
  title: string;
  brief: string | null;
  copyAr: string | null;
  copyEn: string | null;
  channel: string;
  status: string;
  currentVersion: number;
  rejectionReason: string | null;
  createdAt: string;
  copy: {
    ar: { text: string | null; dir: 'rtl' | 'ltr' };
    en: { text: string | null; dir: 'rtl' | 'ltr' };
  };
  versions: Array<{
    id: string;
    version: number;
    changedBy: string;
    changeNote: string | null;
    changedAt: string;
  }>;
  comments: Array<{
    id: string;
    authorId: string;
    authorKind: string;
    body: string;
    createdAt: string;
  }>;
}

interface Notification {
  id: string;
  kind: string;
  sentAt: string;
  sentTo: string | null;
  status: string;
}

const TRANSITIONS: Record<string, Array<{ to: string; label: string; variant?: 'primary' | 'secondary' | 'danger' | 'outline' }>> = {
  DRAFT: [{ to: 'INTERNAL_REVIEW', label: 'Send to Internal Review' }],
  INTERNAL_REVIEW: [
    { to: 'DRAFT', label: 'Back to Draft', variant: 'outline' },
    { to: 'CLIENT_REVIEW', label: 'Send to Client Review', variant: 'secondary' },
  ],
  CLIENT_REVIEW: [
    { to: 'DRAFT', label: 'Back to Draft', variant: 'outline' },
    { to: 'REJECTED', label: 'Reject', variant: 'danger' },
    { to: 'APPROVED', label: 'Approve', variant: 'primary' },
  ],
  APPROVED: [{ to: 'SCHEDULED', label: 'Schedule' }],
  SCHEDULED: [
    { to: 'DRAFT', label: 'Unschedule', variant: 'outline' },
    { to: 'LIVE', label: 'Publish now' },
  ],
  LIVE: [{ to: 'COMPLETED', label: 'Mark Completed' }],
  REJECTED: [{ to: 'DRAFT', label: 'Revise' }],
  COMPLETED: [],
};

export default function CardDetailPage() {
  const params = useParams<{ id: string; cardId: string }>();
  const router = useRouter();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);

  async function load() {
    try {
      const [cRes, nRes] = await Promise.all([
        authedFetch(
          `/api/content-calendar/agency/tenants/${params.id}/cards/${params.cardId}`,
        ),
        authedFetch(
          `/api/content-notifications/agency/tenants/${params.id}/cards/${params.cardId}/notifications`,
        ),
      ]);
      if (!cRes.ok) {
        setError(`Failed: ${cRes.status}`);
        return;
      }
      setCard((await cRes.json()) as CardDetail);
      if (nRes.ok) setNotifications((await nRes.json()) as Notification[]);
    } catch {
      setError('Network error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, params.cardId]);

  async function transition(to: string) {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { to };
      if (to === 'REJECTED' && rejectReason) body.reason = rejectReason;
      const r = await authedFetch(
        `/api/content-calendar/agency/tenants/${params.id}/cards/${params.cardId}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!r.ok) {
        setError(`Transition failed: ${r.status}`);
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function sendForReview() {
    setBusy(true);
    try {
      const r = await authedFetch(
        `/api/content-calendar/agency/tenants/${params.id}/cards/${params.cardId}/send-for-client-review`,
        { method: 'POST' },
      );
      if (!r.ok) return;
      const data = (await r.json()) as { approvalUrl: string };
      setApprovalUrl(data.approvalUrl);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function addComment() {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await authedFetch(
        `/api/content-calendar/agency/tenants/${params.id}/cards/${params.cardId}/comments`,
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

  async function notifyClient() {
    if (!approvalUrl) return;
    setBusy(true);
    try {
      await authedFetch(
        `/api/content-notifications/agency/tenants/${params.id}/cards/${params.cardId}/notify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentTo: 'client', approvalUrl }),
        },
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!card) {
    return (
      <main className="p-8 max-w-4xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <button
          onClick={() => router.push(`/tenants/${params.id}/calendar`)}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Calendar
        </button>
        <div className="flex items-start justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold">{card.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {card.channel} · v{card.currentVersion} ·{' '}
              {new Date(card.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge
            variant={
              card.status === 'LIVE' || card.status === 'APPROVED'
                ? 'success'
                : card.status === 'REJECTED'
                  ? 'danger'
                  : card.status === 'CLIENT_REVIEW' ||
                      card.status === 'INTERNAL_REVIEW'
                    ? 'warning'
                    : 'default'
            }
          >
            {card.status}
          </Badge>
        </div>
      </header>

      {card.rejectionReason && (
        <Card className="bg-red-50 border-red-200">
          <CardBody className="text-sm text-red-800">
            <strong>Rejection reason:</strong> {card.rejectionReason}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-4">
          <CardTitle>Content</CardTitle>
          {card.brief && (
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Brief</p>
              <p className="text-sm">{card.brief}</p>
            </div>
          )}
          {card.copyAr && (
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Arabic</p>
              <div dir="rtl" className="rounded bg-slate-50 p-3 text-sm">
                {card.copyAr}
              </div>
            </div>
          )}
          {card.copyEn && (
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">English</p>
              <div dir="ltr" className="rounded bg-slate-50 p-3 text-sm">
                {card.copyEn}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Lifecycle</CardTitle>
          <div className="flex flex-wrap gap-2">
            {card.status === 'INTERNAL_REVIEW' && (
              <Button onClick={sendForReview} disabled={busy}>
                Send to Client (one-tap link)
              </Button>
            )}
            {(TRANSITIONS[card.status] ?? []).map((t) => (
              <Button
                key={t.to}
                variant={t.variant ?? 'primary'}
                onClick={() => transition(t.to)}
                disabled={busy}
              >
                {t.label}
              </Button>
            ))}
          </div>
          {(card.status === 'CLIENT_REVIEW' || card.status === 'REJECTED') && (
            <div className="space-y-1">
              <Label htmlFor="rejectReason">Rejection reason (optional)</Label>
              <Input
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          )}
          {approvalUrl && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3 space-y-2">
              <p className="text-sm font-medium">One-tap approval URL:</p>
              <code className="block break-all text-xs bg-white p-2 rounded">
                {approvalUrl}
              </code>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void navigator.clipboard?.writeText(approvalUrl)}
                >
                  Copy
                </Button>
                <Button size="sm" onClick={notifyClient} disabled={busy}>
                  Record notification
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Comments ({card.comments.length})</CardTitle>
          {card.comments.length === 0 && (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
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
            <Button onClick={addComment} disabled={busy || !comment.trim()}>
              Post
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Notification history</CardTitle>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications sent.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {notifications.map((n) => (
                <li key={n.id} className="flex justify-between">
                  <span>{n.kind}</span>
                  <span className="text-slate-500 text-xs">
                    {new Date(n.sentAt).toLocaleString()} · {n.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Version history ({card.versions.length})</CardTitle>
          <ul className="text-sm space-y-1">
            {card.versions.map((v) => (
              <li key={v.id} className="flex justify-between">
                <span>v{v.version} — {v.changeNote ?? 'updated'}</span>
                <span className="text-slate-500 text-xs">
                  {new Date(v.changedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </main>
  );
}
