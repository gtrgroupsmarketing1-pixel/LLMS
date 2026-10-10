'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, Input, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface InboxMessage {
  id: string;
  customerId: string;
  channel: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
}

export default function PortalMessages() {
  const [items, setItems] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState<Record<string, string>>({});

  async function load() {
    try {
      const r = await authedFetch('/api/portal/messages');
      if (!r.ok) return;
      setItems((await r.json()) as InboxMessage[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function send(id: string) {
    const body = reply[id];
    if (!body) return;
    await authedFetch(`/api/portal/messages/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setReply({ ...reply, [id]: '' });
    void load();
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
    <main className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Messages</h1>
      {items.length === 0 && (
        <p className="text-sm text-slate-500">No messages.</p>
      )}
      {items.map((m) => (
        <Card key={m.id}>
          <CardBody className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant={m.direction === 'INBOUND' ? 'info' : 'default'}>
                {m.direction}
              </Badge>
              <span>{m.channel}</span>
              <span>·</span>
              <span>{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm">{m.body}</p>
            {m.direction === 'INBOUND' && m.status === 'RECEIVED' && (
              <div className="flex gap-2">
                <Input
                  value={reply[m.id] ?? ''}
                  onChange={(e) =>
                    setReply({ ...reply, [m.id]: e.target.value })
                  }
                  placeholder="Reply…"
                />
                <Button size="sm" onClick={() => send(m.id)}>
                  Send
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
