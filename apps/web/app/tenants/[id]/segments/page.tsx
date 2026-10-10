'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Segment {
  id: string;
  name: string;
  nameAr: string | null;
  mode: string;
  isPrebuilt: boolean;
  lastCount: number;
  available: boolean;
  lockReason: string | null;
  campaignBlocked: boolean;
}

interface PreviewResult {
  count: number;
  sample: Array<{ id: string; name: string | null; phone: string; email: string | null }>;
  elapsedMs: number;
}

export default function SegmentsPage() {
  const params = useParams<{ id: string }>();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function load() {
    try {
      const r = await authedFetch(`/api/segmentation/tenants/${params.id}/segments`);
      if (!r.ok) {
        setError(`Failed: ${r.status}`);
        return;
      }
      setSegments((await r.json()) as Segment[]);
    } catch {
      setError('Network error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function previewSegment(id: string) {
    const r = await authedFetch(`/api/segmentation/segments/${id}/preview`);
    if (!r.ok) return;
    setPreview((await r.json()) as PreviewResult);
  }

  async function ensurePrebuilt() {
    setSeeding(true);
    try {
      await authedFetch(
        `/api/segmentation/tenants/${params.id}/segments/ensure-prebuilt`,
        { method: 'POST' },
      );
      await load();
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segments</h1>
          <p className="text-sm text-slate-500">
            Target groups for campaigns and automations.
          </p>
        </div>
        <Button onClick={ensurePrebuilt} disabled={seeding} size="sm">
          {seeding ? 'Seeding…' : 'Seed prebuilt'}
        </Button>
      </header>

      {error && <p className="text-red-600">{error}</p>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Arabic</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500">
                  No segments yet. Click &quot;Seed prebuilt&quot; to add the standard
                  library.
                </TableCell>
              </TableRow>
            )}
            {segments.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.nameAr ?? '—'}</TableCell>
                <TableCell>{s.mode}</TableCell>
                <TableCell>{s.lastCount}</TableCell>
                <TableCell>
                  {!s.available && (
                    <Badge variant="outline" title={s.lockReason ?? ''}>
                      Locked — {s.lockReason}
                    </Badge>
                  )}
                  {s.available && s.campaignBlocked && (
                    <Badge variant="warning">Stale ERP data</Badge>
                  )}
                  {s.available && !s.campaignBlocked && (
                    <Badge variant="success">Ready</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewSegment(s.id)}
                    disabled={!s.available}
                  >
                    Preview
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {preview && (
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>
              Preview — {preview.count} customers ({preview.elapsedMs}ms)
            </CardTitle>
            <ul className="text-sm space-y-1">
              {preview.sample.map((s) => (
                <li key={s.id} dir="ltr" className="text-slate-700">
                  {s.name ?? '—'} · {s.phone} · {s.email ?? '—'}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
              Close
            </Button>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
