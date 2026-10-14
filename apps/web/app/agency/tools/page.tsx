'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Input,
  Label,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch, getAccessToken } from '../../../lib/session';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  linkType: string;
  assignedTo: string | null;
  dueAt: string | null;
}

interface WorkloadRow {
  userId: string;
  openTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  minutesLast7Days: number;
}

interface DigestSection {
  key: string;
  label: string;
  count: number;
  items: Array<{ id: string; label: string; meta?: string }>;
}

interface Digest {
  generatedAt: string;
  sections: DigestSection[];
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  BLOCKED: 'danger',
  DONE: 'success',
  CANCELLED: 'default',
};

export default function AgencyToolsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workload, setWorkload] = useState<WorkloadRow[]>([]);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('NORMAL');
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter) qs.set('status', statusFilter);
      const [tRes, wRes, dRes] = await Promise.all([
        authedFetch(`/api/agency/tasks?${qs}`),
        authedFetch('/api/agency/workload'),
        authedFetch('/api/agency/digest'),
      ]);
      if (tRes.ok) setTasks((await tRes.json()) as Task[]);
      if (wRes.ok) setWorkload((await wRes.json()) as WorkloadRow[]);
      if (dRes.ok) setDigest((await dRes.json()) as Digest);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function createTask() {
    if (!newTitle.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch('/api/agency/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, priority: newPriority }),
      });
      if (r.ok) {
        setNewTitle('');
        setMsg('Task created');
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function transition(taskId: string, to: string) {
    await authedFetch(`/api/agency/tasks/${taskId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to }),
    });
    await load();
  }

  async function seedSops() {
    setBusy(true);
    try {
      const r = await authedFetch('/api/agency/sops/seed', { method: 'POST' });
      const data = (await r.json()) as { seeded: number };
      setMsg(`Seeded ${data.seeded} SOPs`);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agency Tools</h1>
          <p className="text-sm text-slate-500">
            Tasks, SOPs, workload, and the 9 AM digest.
          </p>
        </div>
        <Button variant="outline" onClick={seedSops} disabled={busy}>
          Seed SOPs
        </Button>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      {digest && (
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>Daily digest — {new Date(digest.generatedAt).toLocaleString()}</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {digest.sections.map((s) => (
                <div
                  key={s.key}
                  className={`rounded border p-3 ${
                    s.count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-xs text-slate-500">{s.label}</div>
                  <div className="text-2xl font-bold">{s.count}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>New task</CardTitle>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label>Title</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={createTask} disabled={busy || !newTitle.trim()}>
              Create
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Tasks ({tasks.length})</CardTitle>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All</option>
              {['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    No tasks yet.
                  </TableCell>
                </TableRow>
              )}
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.priority === 'URGENT'
                          ? 'danger'
                          : t.priority === 'HIGH'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[t.status] ?? 'default'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {t.linkType}
                  </TableCell>
                  <TableCell className="text-xs">
                    {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.status === 'OPEN' && (
                        <Button size="sm" onClick={() => transition(t.id, 'IN_PROGRESS')}>
                          Start
                        </Button>
                      )}
                      {t.status === 'IN_PROGRESS' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => transition(t.id, 'BLOCKED')}>
                            Block
                          </Button>
                          <Button size="sm" onClick={() => transition(t.id, 'DONE')}>
                            Done
                          </Button>
                        </>
                      )}
                      {t.status === 'BLOCKED' && (
                        <Button size="sm" onClick={() => transition(t.id, 'IN_PROGRESS')}>
                          Unblock
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Workload</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>In progress</TableHead>
                <TableHead>Blocked</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>7d minutes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workload.map((w) => (
                <TableRow key={w.userId}>
                  <TableCell className="text-xs">{w.userId.slice(0, 8)}…</TableCell>
                  <TableCell>{w.openTasks}</TableCell>
                  <TableCell>{w.inProgressTasks}</TableCell>
                  <TableCell className={w.blockedTasks > 0 ? 'text-red-600 font-medium' : ''}>
                    {w.blockedTasks}
                  </TableCell>
                  <TableCell className={w.overdueTasks > 0 ? 'text-red-600 font-medium' : ''}>
                    {w.overdueTasks}
                  </TableCell>
                  <TableCell>{w.minutesLast7Days}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </main>
  );
}
