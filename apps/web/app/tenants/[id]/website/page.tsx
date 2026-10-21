'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
import { authedFetch } from '../../../../lib/session';
import { PAGE_TEMPLATES } from '@lmms/website/templates';

interface Website {
  id: string;
  subdomain: string;
  customDomain: string | null;
  status: string;
  publishedAt: string | null;
}

interface PageRow {
  id: string;
  slug: string;
  titleEn: string;
  status: string;
}

export default function WebsiteBuilderPage() {
  const params = useParams<{ id: string }>();
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState<string>(PAGE_TEMPLATES[0]?.key ?? '');
  const [newSlug, setNewSlug] = useState('home');

  async function load() {
    setLoading(true);
    try {
      const [wRes, pRes] = await Promise.all([
        authedFetch(`/api/website/tenants/${params.id}/website`),
        authedFetch(`/api/website/tenants/${params.id}/website/pages`),
      ]);
      if (wRes.ok) setWebsite((await wRes.json()) as Website);
      if (pRes.ok) setPages((await pRes.json()) as PageRow[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function publish() {
    setBusy(true);
    try {
      await authedFetch(`/api/website/tenants/${params.id}/website/publish`, {
        method: 'POST',
      });
      setMsg('Website published');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function createPage() {
    const tpl = PAGE_TEMPLATES.find((t) => t.key === templateKey);
    if (!tpl) return;
    setBusy(true);
    try {
      const r = await authedFetch(
        `/api/website/tenants/${params.id}/website/pages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: newSlug,
            titleEn: tpl.title,
            titleAr: tpl.titleAr,
            blocks: tpl.blocks,
          }),
        },
      );
      if (r.ok) {
        setMsg('Page created');
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function publishPage(pageId: string) {
    await authedFetch(
      `/api/website/tenants/${params.id}/website/pages/${pageId}/publish`,
      { method: 'POST' },
    );
    setMsg('Page published');
    await load();
  }

  if (loading) {
    return (
      <main className="p-8 max-w-5xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!website) return null;

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Builder</h1>
          <p className="text-sm text-slate-500">
            Public subdomain site for this tenant.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={publish} disabled={busy || website.status === 'PUBLISHED'}>
            {website.status === 'PUBLISHED' ? 'Published' : 'Publish website'}
          </Button>
          <Link
            href={`/s/${website.subdomain}`}
            target="_blank"
            className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            Open live site →
          </Link>
        </div>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Website</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Subdomain</Label>
              <Input value={website.subdomain} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Custom domain (not active yet)</Label>
              <Input value={website.customDomain ?? ''} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <div>
                <Badge variant={website.status === 'PUBLISHED' ? 'success' : 'default'}>
                  {website.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Add page from template</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Template</Label>
              <Select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
              >
                {PAGE_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={createPage} disabled={busy || !newSlug}>
            Create page
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Pages ({pages.length})</CardTitle>
          {pages.length === 0 ? (
            <p className="text-sm text-slate-500">No pages yet. Use a template above.</p>
          ) : (
            <ul className="space-y-2">
              {pages.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded border border-slate-200 p-3"
                >
                  <div>
                    <span className="font-medium">{p.titleEn}</span>
                    <span className="ml-2 text-xs text-slate-500">/{p.slug}</span>
                    <Badge
                      variant={p.status === 'PUBLISHED' ? 'success' : 'default'}
                      className="ml-2"
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {p.status !== 'PUBLISHED' && (
                      <Button size="sm" onClick={() => publishPage(p.id)}>
                        Publish
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
