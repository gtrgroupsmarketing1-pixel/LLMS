'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, Input, Skeleton } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  totalRecipients: number;
  status: string;
  createdAt: string;
}

export default function PortalApprovals() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await authedFetch('/api/portal/approvals');
      if (!r.ok) {
        setError(`Failed: ${r.status}`);
        return;
      }
      setItems((await r.json()) as Campaign[]);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(id: string) {
    await authedFetch(`/api/portal/approvals/${id}/approve`, { method: 'POST' });
    void load();
  }

  async function reject(id: string) {
    const text = reason[id] ?? '';
    if (!text) return;
    await authedFetch(`/api/portal/approvals/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: text }),
    });
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
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Pending approvals</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {items.length === 0 && (
        <p className="text-sm text-slate-500">Nothing waiting for approval.</p>
      )}
      {items.map((c) => (
        <Card key={c.id}>
          <CardBody className="space-y-3">
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-slate-500">
                <Badge variant="info" className="mr-1">
                  {c.channel}
                </Badge>
                {c.totalRecipients} recipients
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => approve(c.id)}>
                Approve
              </Button>
              <Input
                placeholder="Reason (required to reject)"
                value={reason[c.id] ?? ''}
                onChange={(e) =>
                  setReason({ ...reason, [c.id]: e.target.value })
                }
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => reject(c.id)}
                disabled={!reason[c.id]}
              >
                Reject
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </main>
  );
}
