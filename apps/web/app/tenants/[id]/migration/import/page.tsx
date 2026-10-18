'use client';

import { useState } from 'react';
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
} from '@lmms/ui';
import { authedFetch } from '../../../../../lib/session';

interface Job {
  id: string;
  status: string;
  successRows: number;
  errorRows: number;
  totalRows: number;
}

export default function CompetitorImportWizard() {
  const params = useParams<{ id: string }>();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [sourceSystem, setSourceSystem] = useState('CLEANCLOUD');
  const [jobId, setJobId] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [jobResult, setJobResult] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mappings
  const [phoneCol, setPhoneCol] = useState('');
  const [nameCol, setNameCol] = useState('');
  const [emailCol, setEmailCol] = useState('');
  const [zoneCol, setZoneCol] = useState('');

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('sourceSystem', sourceSystem);
      const r = await authedFetch(`/api/erp-migration/tenants/${params.id}/upload`, {
        method: 'POST',
        body: form,
      });
      if (!r.ok) {
        setError('Upload failed.');
        return;
      }
      const data = (await r.json()) as { jobId: string; columns: string[] };
      setJobId(data.jobId);
      setColumns(data.columns);
      if (data.columns.length > 0) setPhoneCol(data.columns[0]);
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  async function processImport() {
    if (!jobId) return;
    if (!phoneCol) {
      setError('Phone column is required.');
      return;
    }
    setBusy(true);
    setError(null);
    setStep(3);
    try {
      const mappings = {
        customer: {
          phone: phoneCol,
          name: nameCol || undefined,
          email: emailCol || undefined,
          zone: zoneCol || undefined,
        },
      };
      const r = await authedFetch(`/api/erp-migration/tenants/${params.id}/jobs/${jobId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings }),
      });
      if (!r.ok) {
        setError('Import processing failed.');
        return;
      }
      const data = (await r.json()) as Job;
      setJobResult(data);
      setStep(4);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Import from Competitor ERP</h1>
        <p className="text-sm text-slate-500">Migrate your customer data in 3 steps.</p>
      </header>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {step === 1 && (
        <Card>
          <CardBody className="space-y-4">
            <CardTitle>Step 1: Upload CSV</CardTitle>
            <div className="space-y-1">
              <Label>Source System</Label>
              <Select value={sourceSystem} onChange={(e) => setSourceSystem(e.target.value)}>
                <option value="CLEANCLOUD">CleanCloud</option>
                <option value="LAUNDRYCARD">LaundryCard</option>
                <option value="SPREADSHEET">Excel / Spreadsheet</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button onClick={upload} disabled={!file || busy}>
              {busy ? 'Uploading…' : 'Upload & Parse'}
            </Button>
          </CardBody>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardBody className="space-y-4">
            <CardTitle>Step 2: Map Columns</CardTitle>
            <p className="text-sm text-slate-500">Match your CSV columns to LMMS fields.</p>
            
            <div className="space-y-1">
              <Label>Phone Number (Required)</Label>
              <Select value={phoneCol} onChange={(e) => setPhoneCol(e.target.value)}>
                <option value="">-- Select Column --</option>
                {columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Customer Name</Label>
              <Select value={nameCol} onChange={(e) => setNameCol(e.target.value)}>
                <option value="">-- Skip --</option>
                {columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Select value={emailCol} onChange={(e) => setEmailCol(e.target.value)}>
                <option value="">-- Skip --</option>
                {columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Zone / Area</Label>
              <Select value={zoneCol} onChange={(e) => setZoneCol(e.target.value)}>
                <option value="">-- Skip --</option>
                {columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            <Button onClick={processImport} disabled={busy || !phoneCol}>
              {busy ? 'Starting Import…' : 'Start Import'}
            </Button>
          </CardBody>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardBody className="space-y-4 text-center py-12">
            <div className="text-4xl animate-spin">⏳</div>
            <CardTitle>Processing your data…</CardTitle>
            <p className="text-sm text-slate-500">This may take a few moments depending on file size.</p>
          </CardBody>
        </Card>
      )}

      {step === 4 && jobResult && (
        <Card>
          <CardBody className="space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <CardTitle>Import Complete</CardTitle>
            <div className="flex justify-center gap-4 text-sm mt-4">
              <div className="bg-slate-50 p-4 rounded-lg min-w-[100px]">
                <div className="text-2xl font-bold">{jobResult.totalRows}</div>
                <div className="text-slate-500">Total Rows</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg min-w-[100px] border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-700">{jobResult.successRows}</div>
                <div className="text-emerald-600">Imported</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg min-w-[100px] border border-red-200">
                <div className="text-2xl font-bold text-red-700">{jobResult.errorRows}</div>
                <div className="text-red-600">Errors</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Imported contacts are marked as <strong>Needs Review</strong> until consent is verified.
            </p>
            <div className="pt-4">
              <Button onClick={() => { setStep(1); setFile(null); }}>Import Another</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
