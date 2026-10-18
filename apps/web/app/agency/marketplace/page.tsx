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
} from '@lmms/ui';
import { authedFetch, getAccessToken } from '../../../lib/session';

interface Template {
  id: string;
  name: string;
  category: string;
  installCount: number;
}

const CATEGORIES = ['CAMPAIGN', 'JOURNEY', 'WEBSITE_PAGE', 'CONTENT_CARD', 'AUTOMATION'];
const SOURCE_TYPES = ['WEBSITE_PAGE', 'JOURNEY', 'CAMPAIGN'];

export default function AgencyMarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  
  // Publish form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('WEBSITE_PAGE');
  const [sourceType, setSourceType] = useState('WEBSITE_PAGE');
  const [sourceId, setSourceId] = useState('');

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
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    void load();
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch('/api/marketplace/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          sourceType,
          sourceId,
        }),
      });
      if (r.ok) {
        setMsg('Template published successfully!');
        setName('');
        setDescription('');
        setSourceId('');
        await load();
      } else {
        setMsg('Failed to publish template. Check the Source ID.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8 max-w-5xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace Admin</h1>
          <p className="text-sm text-slate-500">
            Publish successful templates for all tenants to use.
          </p>
        </div>
      </header>

      {msg && <p className="text-sm font-medium text-slate-800">{msg}</p>}

      <Card>
        <CardBody className="space-y-4">
          <CardTitle>Publish New Template</CardTitle>
          <form onSubmit={publish} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Source Type</Label>
                <Select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Source ID (UUID)</Label>
                <Input value={sourceId} onChange={(e) => setSourceId(e.target.value)} required placeholder="e.g. 123e4567-e89b-12d3..." />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Publishing…' : 'Publish Template'}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Published Templates ({templates.length})</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="rounded border border-slate-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{t.name}</span>
                  <Badge variant="info">{t.category}</Badge>
                </div>
                <div className="text-xs text-slate-500">{t.installCount} installs</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
