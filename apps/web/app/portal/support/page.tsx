'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardTitle, Input, Label, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface SupportConfig {
  whatsappDeepLink: string;
  agencyNumber: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  kind: string;
  createdAt: string;
}

export default function PortalSupport() {
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [c, t] = await Promise.all([
        authedFetch('/api/portal/support').then((r) => r.json()),
        authedFetch('/api/portal/tickets').then((r) => r.json()),
      ]);
      setConfig(c as SupportConfig);
      setTickets(t as Ticket[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit() {
    if (!subject || !body) return;
    setBusy(true);
    try {
      await authedFetch('/api/portal/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, kind: 'SUPPORT' }),
      });
      setSubject('');
      setBody('');
      void load();
    } finally {
      setBusy(false);
    }
  }

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
      <h1 className="text-xl font-bold">Support</h1>

      {config?.whatsappDeepLink && (
        <a
          href={config.whatsappDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white no-underline"
        >
          💬 WhatsApp the agency
        </a>
      )}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Open a ticket</CardTitle>
          <div className="space-y-1">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="body">Description</Label>
            <Input
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <Button onClick={submit} disabled={busy || !subject || !body}>
            {busy ? 'Submitting…' : 'Submit'}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Your tickets</CardTitle>
          {tickets.length === 0 ? (
            <p className="text-sm text-slate-500">No tickets yet.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                className="border-b border-slate-100 pb-2 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{t.subject}</span>
                  <Badge
                    variant={
                      t.status === 'OPEN'
                        ? 'warning'
                        : t.status === 'RESOLVED'
                          ? 'success'
                          : 'default'
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </main>
  );
}
