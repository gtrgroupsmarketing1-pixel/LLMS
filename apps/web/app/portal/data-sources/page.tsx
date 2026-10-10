'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardTitle, Input, Label, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lmms/ui';
import { authedFetch } from '../../../lib/portal/session';

interface DataSourceRow {
  id: string;
  type: string;
  status: string;
  lastSyncAt: string | null;
  fresh: boolean;
}

export default function PortalDataSources() {
  const [sources, setSources] = useState<DataSourceRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const meRes = await authedFetch('/api/portal/me');
      if (!meRes.ok) {
        setError(`Failed: ${meRes.status}`);
        return;
      }
      const me = (await meRes.json()) as { tenantId: string };
      setTenantId(me.tenantId);

      const r = await authedFetch(
        `/api/ingestion/tenants/${me.tenantId}/data-freshness`,
      );
      if (!r.ok) {
        setError(`Failed: ${r.status}`);
        return;
      }
      setSources((await r.json()) as DataSourceRow[]);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;
    setUploading(true);
    setResult(null);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('hasExplicitConsent', 'false');
      const r = await authedFetch('/api/portal/data-sources/csv', {
        method: 'POST',
        body: form,
      });
      if (!r.ok) {
        setError(`Upload failed: ${r.status}`);
        return;
      }
      const data = (await r.json()) as {
        rowsImported: number;
        rowsFlagged: number;
        rowsFailed: number;
        durationMs: number;
      };
      setResult(
        `Imported ${data.rowsImported} · flagged ${data.rowsFlagged} · failed ${data.rowsFailed} (${data.durationMs}ms)`,
      );
      void load();
    } catch {
      setError('Network error');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Data Sources</h1>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Upload customers</CardTitle>
          <p className="text-xs text-slate-500">
            CSV required column: <code>phone</code>.
          </p>
          <div className="space-y-1">
            <Label htmlFor="csv">CSV file</Label>
            <Input
              id="csv"
              type="file"
              accept=".csv"
              onChange={uploadCsv}
              disabled={uploading}
            />
          </div>
          {uploading && <p className="text-sm">Uploading…</p>}
          {result && <p className="text-sm text-emerald-600">{result}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Configured sources</CardTitle>
          {sources.length === 0 ? (
            <p className="text-sm text-slate-500">No sources yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fresh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.type}</TableCell>
                    <TableCell>{s.status}</TableCell>
                    <TableCell>
                      {s.fresh ? (
                        <Badge variant="success">Fresh</Badge>
                      ) : (
                        <Badge variant="warning">Stale</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
