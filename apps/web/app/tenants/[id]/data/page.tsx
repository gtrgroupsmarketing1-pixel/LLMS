'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
    <main dir="rtl" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Data Sources</h1>

      <div
        style={{
          padding: 16,
          border: '1px dashed #cbd5e1',
          borderRadius: 8,
          marginBottom: 16,
          background: 'white',
        }}
      >
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px 0' }}>
          Upload a customer CSV. Columns required: phone. Optional: email, name,
          language, zone, consent_status.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={uploadCsv}
          disabled={uploading}
          style={{ fontSize: 13 }}
        />
        {uploading && <p style={{ fontSize: 13 }}>Uploading…</p>}
      </div>

      {result && (
        <p style={{ color: '#16a34a', fontSize: 13, marginBottom: 12 }}>{result}</p>
      )}
      {error && (
        <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'right', background: '#f1f5f9' }}>
            <th style={{ padding: 8 }}>Type</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Last sync</th>
            <th style={{ padding: 8 }}>Fresh</th>
          </tr>
        </thead>
        <tbody>
          {sources.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 12, color: '#64748b' }}>
                No data sources configured yet.
              </td>
            </tr>
          )}
          {sources.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: 8 }}>{s.type}</td>
              <td style={{ padding: 8 }}>{s.status}</td>
              <td style={{ padding: 8 }}>
                {s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : '—'}
              </td>
              <td style={{ padding: 8 }}>{s.fresh ? '🟢' : '🟡'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
