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
  Select,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Review {
  id: string;
  authorName: string | null;
  rating: number;
  text: string | null;
  sentiment: string;
  topics: string[] | null;
  responded: boolean;
  escalated: boolean;
  reviewedAt: string;
  responses: Array<{
    id: string;
    language: string;
    body: string;
    status: string;
  }>;
}

interface Stats {
  total: number;
  averageRating: number | null;
  negativePending: number;
  escalatedPending: number;
}

export default function ReviewsInboxPage() {
  const params = useParams<{ id: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filter === 'negative') qs.set('sentiment', 'NEGATIVE');
      if (filter === 'unresponded') qs.set('responded', 'false');
      if (filter === 'escalated') qs.set('escalated', 'true');
      const [rRes, sRes] = await Promise.all([
        authedFetch(`/api/reviews/tenants/${params.id}/reviews?${qs}`),
        authedFetch(`/api/reviews/tenants/${params.id}/reviews/stats`),
      ]);
      if (rRes.ok) setReviews((await rRes.json()) as Review[]);
      if (sRes.ok) setStats((await sRes.json()) as Stats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, filter]);

  async function draft(reviewId: string, language: 'ar' | 'en') {
    setBusy(reviewId);
    setMsg(null);
    try {
      const r = await authedFetch(
        `/api/reviews/tenants/${params.id}/reviews/${reviewId}/draft`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language }),
        },
      );
      if (r.ok) setMsg(`Drafted ${language.toUpperCase()} response`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function approve(responseId: string) {
    await authedFetch(
      `/api/reviews/tenants/${params.id}/reviews/responses/${responseId}/approve`,
      { method: 'POST' },
    );
    await load();
  }

  async function post(responseId: string) {
    await authedFetch(
      `/api/reviews/tenants/${params.id}/reviews/responses/${responseId}/post`,
      { method: 'POST' },
    );
    await load();
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-slate-500">
            Unified inbox with sentiment, topic tags, and approval-gated responses.
          </p>
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All reviews</option>
          <option value="negative">Negative only</option>
          <option value="unresponded">Unresponded only</option>
          <option value="escalated">Escalated only</option>
        </Select>
      </header>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardBody></Card>
          <Card><CardBody className="space-y-1"><div className="text-xs text-slate-500">Avg rating</div><div className="text-2xl font-bold">{stats.averageRating ?? '—'}</div></CardBody></Card>
          <Card className={stats.negativePending > 0 ? 'bg-amber-50' : ''}><CardBody className="space-y-1"><div className="text-xs text-slate-500">Negative pending</div><div className="text-2xl font-bold">{stats.negativePending}</div></CardBody></Card>
          <Card className={stats.escalatedPending > 0 ? 'bg-red-50' : ''}><CardBody className="space-y-1"><div className="text-xs text-slate-500">Escalated</div><div className="text-2xl font-bold">{stats.escalatedPending}</div></CardBody></Card>
        </div>
      )}

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-500">No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <Card key={r.id} className={r.escalated ? 'border-red-300' : ''}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.authorName ?? 'Anonymous'}</span>
                    <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    {r.escalated && <Badge variant="danger">Escalated</Badge>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    <Badge
                      variant={
                        r.sentiment === 'POSITIVE'
                          ? 'success'
                          : r.sentiment === 'NEGATIVE'
                            ? 'danger'
                            : 'default'
                      }
                    >
                      {r.sentiment}
                    </Badge>{' '}
                    {Array.isArray(r.topics) && r.topics.length > 0 && (
                      <span className="ml-1">
                        {r.topics.map((t) => (
                          <span key={t} className="mr-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                            {t}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="ml-2">{new Date(r.reviewedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {r.text && (
                <div className="rounded bg-slate-50 p-3 text-sm whitespace-pre-wrap">
                  {r.text}
                </div>
              )}

              {r.responses.length > 0 && (
                <div className="space-y-2">
                  {r.responses.map((resp) => (
                    <div
                      key={resp.id}
                      className={`rounded border p-3 ${
                        resp.status === 'POSTED'
                          ? 'bg-emerald-50 border-emerald-200'
                          : resp.status === 'APPROVED'
                            ? 'bg-blue-50 border-blue-200'
                            : resp.status === 'REJECTED'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <Badge
                          variant={
                            resp.status === 'POSTED'
                              ? 'success'
                              : resp.status === 'APPROVED'
                                ? 'info'
                                : resp.status === 'REJECTED'
                                  ? 'danger'
                                  : 'default'
                          }
                        >
                          {resp.status}
                        </Badge>
                        <span className="text-slate-500">{resp.language.toUpperCase()}</span>
                      </div>
                      <p
                        dir={resp.language === 'ar' ? 'rtl' : 'ltr'}
                        className="mt-2 text-sm whitespace-pre-wrap"
                      >
                        {resp.body}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {resp.status === 'DRAFTED' && (
                          <Button
                            size="sm"
                            onClick={() => approve(resp.id)}
                          >
                            Approve
                          </Button>
                        )}
                        {resp.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => post(resp.id)}
                          >
                            Post to Platform
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!r.responded && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => draft(r.id, 'ar')}
                    disabled={busy === r.id}
                  >
                    Draft (AR)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => draft(r.id, 'en')}
                    disabled={busy === r.id}
                  >
                    Draft (EN)
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))
      )}
    </main>
  );
}
