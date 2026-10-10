'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Automation {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  mode: string;
  status: string;
  priority: number;
  available: boolean;
  lockReason: string | null;
}

export default function AutomationsPage() {
  const params = useParams<{ id: string }>();
  const [items, setItems] = useState<Automation[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await authedFetch(`/api/automations/tenants/${params.id}/automations`);
      if (!r.ok) {
        setError(`Failed: ${r.status}`);
        return;
      }
      setItems((await r.json()) as Automation[]);
    } catch {
      setError('Network error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function seed() {
    await authedFetch(`/api/automations/tenants/${params.id}/automations/seed`, {
      method: 'POST',
    });
    void load();
  }

  async function toggleKill(id: string, killed: boolean) {
    const url = killed ? 'revive' : 'kill';
    await authedFetch(
      `/api/automations/tenants/${params.id}/automations/${id}/${url}`,
      { method: 'POST' },
    );
    void load();
  }

  async function runNow() {
    setRunning(true);
    setResult(null);
    try {
      const r = await authedFetch(
        `/api/automations/tenants/${params.id}/automations/run-now`,
        { method: 'POST' },
      );
      const data = (await r.json()) as {
        evaluated: number;
        sent: number;
        skipped: number;
        failures: number;
      };
      setResult(
        `Evaluated ${data.evaluated}, sent ${data.sent}, skipped ${data.skipped}, failures ${data.failures}`,
      );
      void load();
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-sm text-slate-500">
            Set-and-forget journeys driven by events and time triggers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={seed}>
            Seed automations
          </Button>
          <Button size="sm" onClick={runNow} disabled={running}>
            {running ? 'Running…' : 'Run now'}
          </Button>
        </div>
      </header>

      {result && <p className="text-sm text-emerald-600">{result}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Arabic</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500">
                  No automations yet. Click &quot;Seed automations&quot; to add the
                  standard library.
                </TableCell>
              </TableRow>
            )}
            {items.map((a) => (
              <TableRow key={a.id} className={a.available ? '' : 'opacity-50'}>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.nameAr ?? '—'}</TableCell>
                <TableCell>{a.mode}</TableCell>
                <TableCell>{a.priority}</TableCell>
                <TableCell>
                  {!a.available ? (
                    <Badge variant="outline">🔒 {a.lockReason}</Badge>
                  ) : a.status === 'KILLED' ? (
                    <Badge variant="danger">Killed</Badge>
                  ) : a.status === 'PAUSED' ? (
                    <Badge variant="warning">Paused</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!a.available}
                    onClick={() => toggleKill(a.id, a.status === 'KILLED')}
                  >
                    {a.status === 'KILLED' ? 'Revive' : 'Kill'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
