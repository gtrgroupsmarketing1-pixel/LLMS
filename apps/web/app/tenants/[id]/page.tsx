'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Badge,
  Card,
  CardBody,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@lmms/ui';
import { authedFetch, getAccessToken } from '../../../lib/session';

interface TenantDetail {
  id: string;
  nameAr: string;
  nameEn: string;
  mode: string;
  country: string;
  currency: string;
  timezone: string;
  package: string;
  status: string;
  region: string;
  churnRisk: boolean;
  upgradeReady: boolean;
  createdAt: string;
}

interface ModuleDef {
  key: string;
  name: string;
  enabled: boolean;
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    Promise.all([
      authedFetch(`/api/tenants/${params.id}`).then(r => r.ok ? r.json() : null),
      authedFetch(`/api/modules/tenants/${params.id}`).then(r => r.ok ? r.json() : []),
    ]).then(([t, m]) => {
      if (t) setTenant(t as TenantDetail);
      else setError('Failed to load tenant');
      if (m) setModules(m as ModuleDef[]);
    }).catch(() => setError('Network error'));
  }, [params.id]);

  if (error) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!tenant) {
    return (
      <main className="p-8 max-w-4xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  const isEnabled = (key: string) => modules.find(m => m.key === key)?.enabled;

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <Link href="/tenants" className="text-sm text-slate-500 hover:text-slate-900">
          ← Tenants
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {tenant.nameEn} · {tenant.nameAr}
        </h1>
        <p className="text-sm text-slate-500">
          {tenant.mode} · {tenant.country} · {tenant.region} · {tenant.currency}
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          {isEnabled('BRAND_HUB') && <TabsTrigger value="brand">Brand</TabsTrigger>}
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          {isEnabled('JOURNEY_BUILDER') && <TabsTrigger value="journeys">Journeys</TabsTrigger>}
          {isEnabled('WEBSITE_BUILDER') && <TabsTrigger value="website">Website</TabsTrigger>}
          {isEnabled('CONTENT_CALENDAR') && <TabsTrigger value="calendar">Calendar</TabsTrigger>}
          {isEnabled('REVIEWS') && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
          {isEnabled('ADS_MANAGEMENT') && <TabsTrigger value="ads">Ads</TabsTrigger>}
          {isEnabled('B2B_PIPELINE') && <TabsTrigger value="b2b">B2B</TabsTrigger>}
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardBody className="space-y-4">
              <CardTitle>Tenant details</CardTitle>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-slate-500">Status</dt>
                <dd><Badge variant={tenant.status === 'ACTIVE' ? 'success' : 'warning'}>{tenant.status}</Badge></dd>
                <dt className="text-slate-500">Package</dt>
                <dd>{tenant.package}</dd>
                <dt className="text-slate-500">Mode</dt>
                <dd>{tenant.mode}</dd>
                <dt className="text-slate-500">Region</dt>
                <dd>{tenant.region}</dd>
                <dt className="text-slate-500">Created</dt>
                <dd>{new Date(tenant.createdAt).toLocaleString()}</dd>
              </dl>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Module Activation</CardTitle>
              <p className="text-sm text-slate-500">Enable or disable features for this tenant.</p>
              <ul className="space-y-2 mt-4">
                {modules.map(m => (
                  <li key={m.key} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                    <span className="font-medium text-sm">{m.name}</span>
                    <Badge variant={m.enabled ? 'success' : 'default'}>
                      {m.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-slate-400 mt-2">Module toggling UI is managed by the agency. Use the API to update status.</div>
            </CardBody>
          </Card>
        </TabsContent>

        {isEnabled('BRAND_HUB') && <TabsContent value="brand"><Card><CardBody><CardTitle>Brand Hub</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/brand`} className="underline">Open the brand hub →</Link></p></CardBody></Card></TabsContent>}
        
        <TabsContent value="data"><Card><CardBody><CardTitle>Data sources</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/data`} className="underline">Open the data sources page →</Link></p></CardBody></Card></TabsContent>
        <TabsContent value="segments"><Card><CardBody><CardTitle>Segments</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/segments`} className="underline">Open the segments page →</Link></p></CardBody></Card></TabsContent>
        <TabsContent value="campaigns"><Card><CardBody><CardTitle>Campaigns</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/campaigns`} className="underline">Open the campaigns page →</Link></p></CardBody></Card></TabsContent>
        
        {isEnabled('JOURNEY_BUILDER') && <TabsContent value="journeys"><Card><CardBody><CardTitle>Journeys</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/journeys`} className="underline">Open the journey builder →</Link></p></CardBody></Card></TabsContent>}
        {isEnabled('WEBSITE_BUILDER') && <TabsContent value="website"><Card><CardBody><CardTitle>Website Builder</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/website`} className="underline">Open the website builder →</Link></p></CardBody></Card></TabsContent>}
        {isEnabled('CONTENT_CALENDAR') && <TabsContent value="calendar"><Card><CardBody><CardTitle>Content Calendar</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/calendar`} className="underline">Open the calendar page →</Link></p></CardBody></Card></TabsContent>}
        {isEnabled('REVIEWS') && <TabsContent value="reviews"><Card><CardBody><CardTitle>Reviews</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/reviews`} className="underline">Open the reviews inbox →</Link></p></CardBody></Card></TabsContent>}
        {isEnabled('ADS_MANAGEMENT') && <TabsContent value="ads"><Card><CardBody><CardTitle>Ads</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/ads`} className="underline">Open the ads page →</Link></p></CardBody></Card></TabsContent>}
        {isEnabled('B2B_PIPELINE') && <TabsContent value="b2b"><Card><CardBody><CardTitle>B2B Pipeline</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/b2b`} className="underline">Open the B2B pipeline →</Link></p></CardBody></Card></TabsContent>}

        <TabsContent value="compliance"><Card><CardBody><CardTitle>Compliance</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/compliance`} className="underline">Open the compliance dashboard →</Link></p></CardBody></Card></TabsContent>
        <TabsContent value="billing"><Card><CardBody><CardTitle>Billing</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/billing`} className="underline">Open the billing page →</Link></p></CardBody></Card></TabsContent>
        <TabsContent value="migration"><Card><CardBody><CardTitle>Migration</CardTitle><p className="text-sm text-slate-500 mt-2"><Link href={`/tenants/${tenant.id}/migration`} className="underline">Open the migration page →</Link></p></CardBody></Card></TabsContent>
      </Tabs>
    </main>
  );
}
