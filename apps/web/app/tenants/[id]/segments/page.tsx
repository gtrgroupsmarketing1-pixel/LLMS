'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  sample: Array<{
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  }>;
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
      const r = await authedFetch(
        `/api/segmentation/tenants/${params.id}/segments`,
      );
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
    try {
      const r = await authedFetch(`/api/segmentation/segments/${id}/preview`);
      if (!r.ok) return;
      setPreview((await r.json()) as PreviewResult);
    } catch {
      // ignore
    }
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
    <main dir="rtl" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20 }}>Segments</h1>
        <button
          onClick={ensurePrebuilt}
          disabled={seeding}
          style={{
            padding: '6px 12px',
            background: '#0f172a',
            color: 'white',
            border: 0,
            borderRadius: 6,
            fontSize: 13,
            cursor: seeding ? 'not-allowed' : 'pointer',
          }}
        >
          {seeding ? 'Seeding…' : 'Seed prebuilt'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'right', background: '#f1f5f9' }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Arabic</th>
            <th style={{ padding: 8 }}>Mode</th>
            <th style={{ padding: 8 }}>Size</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {segments.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 12, color: '#64748b' }}>
                No segments yet. Click &quot;Seed prebuilt&quot; to add the standard
                library.
              </td>
            </tr>
          )}
          {segments.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: 8 }}>{s.name}</td>
              <td style={{ padding: 8 }}>{s.nameAr ?? '—'}</td>
              <td style={{ padding: 8 }}>{s.mode}</td>
              <td style={{ padding: 8 }}>{s.lastCount}</td>
              <td style={{ padding: 8 }}>
                {!s.available && (
                  <span title={s.lockReason ?? ''}>🔒 {s.lockReason}</span>
                )}
                {s.available && s.campaignBlocked && (
                  <span title="Stale ERP data">⚠️ stale</span>
                )}
                {s.available && !s.campaignBlocked && '✅'}
              </td>
              <td style={{ padding: 8 }}>
                <button
                  onClick={() => previewSegment(s.id)}
                  disabled={!s.available}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    borderRadius: 4,
                    cursor: s.available ? 'pointer' : 'not-allowed',
                  }}
                >
                  Preview
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {preview && (
        <section
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f8fafc',
            borderRadius: 8,
          }}
        >
          <h2 style={{ fontSize: 15, marginBottom: 8 }}>
            Preview — {preview.count} customers ({preview.elapsedMs}ms)
          </h2>
          <ul style={{ fontSize: 13, listStyle: 'none', padding: 0 }}>
            {preview.sample.map((s) => (
              <li key={s.id} style={{ padding: '4px 0', direction: 'ltr' }}>
                {s.name ?? '—'} · {s.phone} · {s.email ?? '—'}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setPreview(null)}
            style={{
              marginTop: 8,
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #cbd5e1',
              background: 'white',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </section>
      )}
    </main>
  );
}
