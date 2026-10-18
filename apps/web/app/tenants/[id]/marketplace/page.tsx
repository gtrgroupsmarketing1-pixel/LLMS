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

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  installCount: number;
  authorId: string;
}

export default function TenantMarketplacePage() {
  const params = useParams<{ id: string }>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await authedFetch('/api/marketplace/templates');
      if (r.ok) setTemplates((await r.json()) as Template[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function install(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const r = await authedFetch(`/api/marketplace/templates/${id}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: params.id }),
      });
      if (r.ok) {
        setMsg('Template installed successfully! It is now available in your workspace.');
        await load();
      }
    } finally {
      setBusy(null);
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
      <header>
        <h1 className="text-2xl font-bold">Template Marketplace</h1>
        <p className="text-sm text-slate-500">
          Install pre-built campaigns, journeys, and website pages directly into your account.
        </p>
      </header>

      {msg && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardBody className="text-sm text-emerald-800">{msg}</CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardBody className="space-y-3 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle>{t.name}</CardTitle>
                  <Badge variant="info">{t.category}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-4">{t.description || 'No description provided.'}</p>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-3">{t.installCount} installs</div>
                <Button
                  onClick={() => install(t.id)}
                  disabled={busy === t.id}
                  className="w-full"
                >
                  {busy === t.id ? 'Installing…' : 'Install Template'}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </main>
  );
}
