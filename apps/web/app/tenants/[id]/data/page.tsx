'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Card,
  CardBody,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface DataSourceRow {
  id: string;
  type: string;
  status: string;
  lastSyncAt: string | null;
  fresh: boolean;
}

export default function DataSourcesPage() {
  const params = useParams<{ id: string }>();
  const [sources, setSources] = useState<DataSourceRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await authedFetch(`/api/ingestion/tenants/${params.id}/data-freshness`);
      if (!r.ok) {
        setError(`Failed: ${r.status}`);
        return;
      }
      setSources((await r.json()) as DataSourceRow[]);
    } catch {
      setError('Network error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function uploadCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('hasExplicitConsent', 'false');
      const r = await authedFetch(`/api/ingestion/tenants/${params.id}/csv`, {
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

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Data Sources</h1>
        <p className="text-sm text-slate-500">
          Upload customer CSVs, view freshness, and manage integrations.
        </p>
      </header>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Import customers from CSV</CardTitle>
          <p className="text-sm text-slate-500">
            Required column: <code>phone</code>. Optional: <code>email</code>,{' '}
            <code>name</code>, <code>language</code>, <code>zone</code>,{' '}
            <code>consent_status</code>.
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
            <p className="text-sm text-slate-500">No data sources yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last sync</TableHead>
                  <TableHead>Fresh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.type}</TableCell>
                    <TableCell>{s.status}</TableCell>
                    <TableCell>
                      {s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : '—'}
                    </TableCell>
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
