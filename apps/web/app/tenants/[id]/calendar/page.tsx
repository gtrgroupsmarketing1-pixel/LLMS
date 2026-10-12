'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Label,
  Select,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

const CHANNELS = [
  'WHATSAPP',
  'SMS',
  'EMAIL',
  'INSTAGRAM',
  'FACEBOOK',
  'GOOGLE_BUSINESS',
  'PRINT',
  'IN_STORE',
] as const;
type Channel = (typeof CHANNELS)[number];

interface CardRow {
  id: string;
  title: string;
  status: string;
  channel: string;
  scheduledAt: string | null;
  copy: {
    ar: { text: string | null; dir: 'rtl' | 'ltr' };
    en: { text: string | null; dir: 'rtl' | 'ltr' };
  };
}

export default function TenantCalendarPage() {
  const params = useParams<{ id: string }>();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [title, setTitle] = useState('');
  const [copyAr, setCopyAr] = useState('');
  const [copyEn, setCopyEn] = useState('');
  const [newChannel, setNewChannel] = useState<Channel>('WHATSAPP');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (channelFilter) qs.set('channel', channelFilter);
      const r = await authedFetch(
        `/api/content-calendar/agency/tenants/${params.id}/calendar?${qs}`,
      );
      if (!r.ok) {
        setError(`Failed: ${r.status}`);
        return;
      }
      const data = (await r.json()) as CardRow[];
      setCards(Array.isArray(data) ? data : []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, channelFilter]);

  async function createCard() {
    if (!title) return;
    setBusy(true);
    try {
      await authedFetch(
        `/api/content-calendar/agency/tenants/${params.id}/cards`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, copyAr, copyEn, channel: newChannel }),
        },
      );
      setTitle('');
      setCopyAr('');
      setCopyEn('');
      void load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-sm text-slate-500">
            Bilingual content cards with a full approval workflow.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/tenants/${params.id}/calendar/queue`}
            className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            Approval Queue
          </Link>
          <Link
            href={`/tenants/${params.id}/calendar/analytics`}
            className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            Rejection Analytics
          </Link>
        </div>
      </header>

      {error && <p className="text-red-600">{error}</p>}

      <Card>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="channel">Channel</Label>
              <Select
                id="channel"
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value as Channel)}
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter">Filter channel</Label>
              <Select
                id="filter"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
              >
                <option value="">All</option>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="copyAr">Arabic copy</Label>
              <Input
                id="copyAr"
                dir="rtl"
                value={copyAr}
                onChange={(e) => setCopyAr(e.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="copyEn">English copy</Label>
              <Input
                id="copyEn"
                dir="ltr"
                value={copyEn}
                onChange={(e) => setCopyEn(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={createCard} disabled={busy || !title}>
            Create content card
          </Button>
        </CardBody>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <p className="text-sm text-slate-500">No content cards yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Card key={c.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/tenants/${params.id}/calendar/${c.id}`}
                    className="font-semibold no-underline text-slate-900 hover:underline"
                  >
                    {c.title}
                  </Link>
                  <Badge
                    variant={
                      c.status === 'LIVE' || c.status === 'APPROVED'
                        ? 'success'
                        : c.status === 'REJECTED'
                          ? 'danger'
                          : c.status === 'CLIENT_REVIEW' ||
                              c.status === 'INTERNAL_REVIEW'
                            ? 'warning'
                            : 'default'
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500">{c.channel}</div>
                {c.copy.ar.text && (
                  <div dir="rtl" className="rounded bg-slate-50 p-2 text-sm">
                    {c.copy.ar.text}
                  </div>
                )}
                {c.copy.en.text && (
                  <div dir="ltr" className="rounded bg-slate-50 p-2 text-sm">
                    {c.copy.en.text}
                  </div>
                )}
                <Link
                  href={`/tenants/${params.id}/calendar/${c.id}`}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Open card →
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
