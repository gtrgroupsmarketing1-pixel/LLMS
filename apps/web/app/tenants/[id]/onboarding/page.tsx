'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Task {
  id: string;
  key: string;
  title: string;
  status: string;
  completedAt: string | null;
}

export default function OnboardingChecklistPage() {
  const params = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const r = await authedFetch(`/api/self-serve/tenants/${params.id}/onboarding`);
      if (r.ok) setTasks((await r.json()) as Task[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function complete(key: string) {
    setBusy(key);
    try {
      await authedFetch(
        `/api/self-serve/tenants/${params.id}/onboarding/${key}/complete`,
        { method: 'POST' },
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <main className="p-8 max-w-3xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Welcome to LMMS</h1>
        <p className="text-sm text-slate-500">
          Complete these steps to get the most out of your account.
        </p>
      </header>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Progress</CardTitle>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Checklist</CardTitle>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {t.status === 'COMPLETED' ? '✅' : '⬜'}
                  </span>
                  <div>
                    <div className={`font-medium ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}`}>
                      {t.title}
                    </div>
                    {t.completedAt && (
                      <div className="text-xs text-slate-500">
                        Completed {new Date(t.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                {t.status !== 'COMPLETED' && (
                  <Button size="sm" variant="outline" onClick={() => complete(t.key)} disabled={busy === t.key}>
                    Mark complete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </main>
  );
}
