'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export default function PortalNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await authedFetch('/api/push/portal/notifications');
      if (r.ok) setItems((await r.json()) as Notification[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    await authedFetch(`/api/push/notifications/${id}/read`, { method: 'POST' });
    await load();
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
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Notifications</h1>
      {items.length === 0 && (
        <p className="text-sm text-slate-500">No notifications yet.</p>
      )}
      {items.map((n) => (
        <Card
          key={n.id}
          className={n.readAt ? 'opacity-60' : 'border-blue-200 bg-blue-50'}
        >
          <CardBody className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium">{n.title}</span>
              {!n.readAt && <Badge variant="info">New</Badge>}
            </div>
            <p className="text-sm text-slate-700">{n.body}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {new Date(n.createdAt).toLocaleString()}
              </span>
              {!n.readAt && (
                <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                  Mark read
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
