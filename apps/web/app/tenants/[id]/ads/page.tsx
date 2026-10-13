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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lmms/ui';
import { authedFetch } from '../../../../lib/session';

interface Account {
  id: string;
  platform: string;
  accountName: string | null;
  externalId: string;
  currency: string;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  dailyBudgetCap: string | number | null;
  geoPreset: string | null;
  adAccount: { platform: string; currency: string };
  adSets: Array<{ id: string }>;
  creatives: Array<{ id: string }>;
}

export default function AdsPage() {
  const params = useParams<{ id: string }>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // connect form
  const [platform, setPlatform] = useState('META');
  const [externalId, setExternalId] = useState('');
  const [accountName, setAccountName] = useState('');

  async function load() {
    try {
      const [aRes, cRes] = await Promise.all([
        authedFetch(`/api/ads/tenants/${params.id}/accounts`),
        authedFetch(`/api/ads/tenants/${params.id}/campaigns`),
      ]);
      if (aRes.ok) setAccounts((await aRes.json()) as Account[]);
      if (cRes.ok) setCampaigns((await cRes.json()) as Campaign[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function connect() {
    if (!externalId) return;
    setBusy(true);
    try {
      await authedFetch(`/api/ads/tenants/${params.id}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, externalId, accountName, currency: 'AED', timezone: 'Asia/Dubai' }),
      });
      setExternalId('');
      setAccountName('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function action(campaignId: string, verb: string) {
    setMsg(null);
    const r = await authedFetch(
      `/api/ads/tenants/${params.id}/campaigns/${campaignId}/${verb}`,
      { method: 'POST' },
    );
    if (!r.ok) {
      setMsg(`${verb} failed: ${r.status}`);
      return;
    }
    setMsg(`${verb} ok`);
    await load();
  }

  async function budgetShift(campaignId: string) {
    const raw = prompt('New daily budget cap:');
    if (!raw) return;
    const newDailyBudget = Number(raw);
    const r = await authedFetch(
      `/api/ads/tenants/${params.id}/campaigns/${campaignId}/budget-shift`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDailyBudget }),
      },
    );
    const data = (await r.json()) as { applied: boolean; requiresApproval: boolean; percentChange: number };
    if (data.applied) setMsg(`Budget shift applied (${data.percentChange}%)`);
    else setMsg(`Requires approval — shift ${data.percentChange}%`);
    await load();
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ads</h1>
          <p className="text-sm text-slate-500">
            Meta and Google Ads campaigns with budget caps and geo presets.
          </p>
        </div>
        <Link
          href={`/tenants/${params.id}/attribution`}
          className="text-sm rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
        >
          Attribution →
        </Link>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Connect ad account</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Platform</Label>
              <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="META">META</option>
                <option value="GOOGLE">GOOGLE</option>
                <option value="TIKTOK">TIKTOK</option>
                <option value="SNAPCHAT">SNAPCHAT</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>External account ID</Label>
              <Input value={externalId} onChange={(e) => setExternalId(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Account name (optional)</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
          </div>
          <Button onClick={connect} disabled={busy || !externalId}>
            Connect
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Connected accounts ({accounts.length})</CardTitle>
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-500">No accounts connected yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell><Badge variant="info">{a.platform}</Badge></TableCell>
                    <TableCell>{a.accountName ?? a.externalId}</TableCell>
                    <TableCell>{a.currency}</TableCell>
                    <TableCell><Badge variant="success">{a.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <CardTitle>Campaigns ({campaigns.length})</CardTitle>
          {campaigns.length === 0 ? (
            <p className="text-sm text-slate-500">No campaigns yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daily cap</TableHead>
                  <TableHead>Ad sets</TableHead>
                  <TableHead>Creatives</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell><Badge variant="info">{c.adAccount.platform}</Badge></TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === 'ACTIVE'
                            ? 'success'
                            : c.status === 'PAUSED'
                              ? 'warning'
                              : c.status === 'PENDING_APPROVAL'
                                ? 'info'
                                : 'default'
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{String(c.dailyBudgetCap ?? '—')}</TableCell>
                    <TableCell>{c.adSets.length}</TableCell>
                    <TableCell>{c.creatives.length}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.status === 'DRAFT' && (
                          <Button size="sm" onClick={() => action(c.id, 'submit')}>
                            Submit
                          </Button>
                        )}
                        {c.status === 'PENDING_APPROVAL' && (
                          <Button size="sm" onClick={() => action(c.id, 'approve')}>
                            Approve
                          </Button>
                        )}
                        {c.status === 'ACTIVE' && (
                          <Button size="sm" variant="outline" onClick={() => action(c.id, 'pause')}>
                            Pause
                          </Button>
                        )}
                        {c.status === 'PAUSED' && (
                          <Button size="sm" onClick={() => action(c.id, 'resume')}>
                            Resume
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => budgetShift(c.id)}>
                          Budget
                        </Button>
                      </div>
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
