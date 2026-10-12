'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Journey {
  id: string;
  name: string;
  nameAr: string | null;
  status: string;
  priority: number;
  frequencyCapHours: number;
  createdAt: string;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  PAUSED: 'warning',
  ARCHIVED: 'info',
};

export default function JourneysListPage() {
  const params = useParams<{ id: string }>();
  const [items, setItems] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await authedFetch(`/api/journeys/tenants/${params.id}/journeys`);
      if (!r.ok) {
        setError(`Failed: ${r.status}`);
        return;
      }
      setItems((await r.json()) as Journey[]);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function create() {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const definition = {
        nodes: [
          {
            id: 'trigger-1',
            type: 'TRIGGER',
            x: 100,
            y: 100,
            trigger: { type: 'NEW_CUSTOMER', mode: 'EVENT' },
          },
          {
            id: 'end-1',
            type: 'END',
            x: 500,
            y: 100,
          },
        ],
        edges: [{ id: 'e1', from: 'trigger-1', to: 'end-1' }],
      };
      const r = await authedFetch(`/api/journeys/tenants/${params.id}/journeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          definition,
        }),
      });
      if (!r.ok) {
        setError(`Create failed: ${r.status}`);
        return;
      }
      const created = (await r.json()) as Journey;
      window.location.href = `/tenants/${params.id}/journeys/${created.id}`;
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8 max-w-5xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journeys</h1>
          <p className="text-sm text-slate-500">
            Visual automation builder — trigger → wait → condition → send.
          </p>
        </div>
      </header>

      {error && <p className="text-red-600">{error}</p>}

      <Card>
        <div className="flex gap-2 p-4">
          <Input
            placeholder="New journey name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button onClick={create} disabled={busy || !newName.trim()}>
            {busy ? 'Creating…' : 'Create journey'}
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Cap (h)</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  No journeys yet.
                </TableCell>
              </TableRow>
            )}
            {items.map((j) => (
              <TableRow key={j.id}>
                <TableCell>
                  <Link
                    href={`/tenants/${params.id}/journeys/${j.id}`}
                    className="text-slate-900 underline-offset-2 hover:underline"
                  >
                    {j.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[j.status] ?? 'default'}>
                    {j.status}
                  </Badge>
                </TableCell>
                <TableCell>{j.priority}</TableCell>
                <TableCell>{j.frequencyCapHours}</TableCell>
                <TableCell>
                  <Link
                    href={`/tenants/${params.id}/journeys/${j.id}/runs`}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Runs →
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
