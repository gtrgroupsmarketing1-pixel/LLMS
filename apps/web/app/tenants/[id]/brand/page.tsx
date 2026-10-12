'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { authedFetch } from '../../../../lib/session';

const CATEGORIES = [
  'LOGO',
  'COLOR_PALETTE',
  'FONT',
  'IMAGE',
  'VIDEO',
  'TEMPLATE',
  'SIGNAGE',
  'VEHICLE_WRAP',
  'UNIFORM',
  'PACKAGING',
  'FLYER',
  'LOYALTY_CARD',
  'PRICE_LIST',
  'OTHER',
] as const;

interface BrandKit {
  id?: string;
  tagline: string | null;
  taglineAr: string | null;
  tone: string | null;
  toneAr: string | null;
  colors: Array<{ name: string; hex: string }> | null;
  fonts: Array<{ name: string; script: string }> | null;
  logoVariants: Record<string, string> | null;
  status: string | null;
}

interface AssetRow {
  id: string;
  name: string;
  nameAr: string | null;
  category: string;
  fileUrl: string;
  usageRights: string;
  usageExpiresAt: string | null;
}

interface ConsistencyReport {
  totalAssets: number;
  checkedAssets: number;
  issuesCount: number;
  issues: Array<{ assetName: string; issue: string; details?: Record<string, unknown> }>;
}

export default function BrandHubPage() {
  const params = useParams<{ id: string }>();
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [report, setReport] = useState<ConsistencyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // brand kit form
  const [tagline, setTagline] = useState('');
  const [taglineAr, setTaglineAr] = useState('');
  const [tone, setTone] = useState('');
  const [toneAr, setToneAr] = useState('');
  const [colorInput, setColorInput] = useState('');

  // asset form
  const [assetName, setAssetName] = useState('');
  const [assetNameAr, setAssetNameAr] = useState('');
  const [assetCategory, setAssetCategory] = useState<string>('LOGO');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetRights, setAssetRights] = useState<string>('UNKNOWN');
  const [assetExpiry, setAssetExpiry] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [kRes, aRes] = await Promise.all([
        authedFetch(`/api/brand/tenants/${params.id}/brand-kit`),
        authedFetch(`/api/brand/tenants/${params.id}/assets`),
      ]);
      const k = kRes.ok ? ((await kRes.json()) as BrandKit | null) : null;
      setKit(k);
      if (k) {
        setTagline(k.tagline ?? '');
        setTaglineAr(k.taglineAr ?? '');
        setTone(k.tone ?? '');
        setToneAr(k.toneAr ?? '');
      }
      if (aRes.ok) setAssets((await aRes.json()) as AssetRow[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function saveKit() {
    setBusy(true);
    setMsg(null);
    try {
      const colors = colorInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((hex) => ({ name: hex, hex }));
      await authedFetch(`/api/brand/tenants/${params.id}/brand-kit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagline,
          taglineAr,
          tone,
          toneAr,
          colors,
        }),
      });
      setMsg('Brand kit saved');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function submitForReview() {
    await authedFetch(`/api/brand/tenants/${params.id}/brand-kit/submit`, {
      method: 'POST',
    });
    setMsg('Sent to client for review');
    await load();
  }

  async function addAsset() {
    if (!assetName || !assetUrl) return;
    setBusy(true);
    try {
      await authedFetch(`/api/brand/tenants/${params.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetName,
          nameAr: assetNameAr || undefined,
          category: assetCategory,
          fileUrl: assetUrl,
          usageRights: assetRights,
          usageExpiresAt: assetExpiry ? new Date(assetExpiry).toISOString() : undefined,
        }),
      });
      setAssetName('');
      setAssetNameAr('');
      setAssetUrl('');
      setAssetExpiry('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteAsset(assetId: string) {
    if (!confirm('Delete this asset?')) return;
    await authedFetch(`/api/brand/tenants/${params.id}/assets/${assetId}`, {
      method: 'DELETE',
    });
    await load();
  }

  async function runCheck() {
    const r = await authedFetch(`/api/brand/tenants/${params.id}/consistency`);
    if (!r.ok) return;
    setReport((await r.json()) as ConsistencyReport);
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
          <h1 className="text-2xl font-bold">Brand Hub</h1>
          <p className="text-sm text-slate-500">
            Brand kit, asset library, consistency checker, and rights management.
          </p>
        </div>
        {kit?.status && (
          <Badge
            variant={
              kit.status === 'APPROVED'
                ? 'success'
                : kit.status === 'CLIENT_REVIEW'
                  ? 'warning'
                  : 'default'
            }
          >
            {kit.status}
          </Badge>
        )}
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Brand kit</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tagline (EN)</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tagline (AR)</Label>
              <Input
                dir="rtl"
                value={taglineAr}
                onChange={(e) => setTaglineAr(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Tone (EN)</Label>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tone (AR)</Label>
              <Input
                dir="rtl"
                value={toneAr}
                onChange={(e) => setToneAr(e.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Colors (comma-separated hex)</Label>
              <Input
                placeholder="#0f172a, #16a34a"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveKit} disabled={busy}>
              Save brand kit
            </Button>
            {kit?.status !== 'CLIENT_REVIEW' && kit?.status !== 'APPROVED' && (
              <Button variant="secondary" onClick={submitForReview}>
                Submit for client review
              </Button>
            )}
            <Button variant="outline" onClick={runCheck}>
              Run consistency check
            </Button>
          </div>
        </CardBody>
      </Card>

      {report && (
        <Card className={report.issuesCount > 0 ? 'bg-amber-50' : 'bg-emerald-50'}>
          <CardBody className="space-y-2">
            <p className="text-sm font-medium">
              Consistency: {report.totalAssets} assets, {report.checkedAssets} checked,{' '}
              {report.issuesCount} issues
            </p>
            {report.issues.slice(0, 10).map((iss, i) => (
              <div key={i} className="text-xs text-slate-700">
                <strong>{iss.assetName}</strong> — {iss.issue}{' '}
                {iss.details ? `(${JSON.stringify(iss.details)})` : ''}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Add asset</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Name (AR)</Label>
              <Input
                dir="rtl"
                value={assetNameAr}
                onChange={(e) => setAssetNameAr(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>File URL</Label>
              <Input
                placeholder="https://..."
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Usage rights</Label>
              <Select
                value={assetRights}
                onChange={(e) => setAssetRights(e.target.value)}
              >
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="PERPETUAL">PERPETUAL</option>
                <option value="TIME_LIMITED">TIME_LIMITED</option>
                <option value="LOCATION_LIMITED">LOCATION_LIMITED</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Usage expires at</Label>
              <Input
                type="date"
                value={assetExpiry}
                onChange={(e) => setAssetExpiry(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addAsset} disabled={busy || !assetName || !assetUrl}>
            Upload asset
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Asset library ({assets.length})</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rights</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    No assets yet.
                  </TableCell>
                </TableRow>
              )}
              {assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 underline-offset-2 hover:underline"
                    >
                      {a.name}
                    </a>
                  </TableCell>
                  <TableCell>{a.category}</TableCell>
                  <TableCell>
                    <Badge variant={a.usageRights === 'PERPETUAL' ? 'success' : 'warning'}>
                      {a.usageRights}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {a.usageExpiresAt
                      ? new Date(a.usageExpiresAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteAsset(a.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </main>
  );
}
