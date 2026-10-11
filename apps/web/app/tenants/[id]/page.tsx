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
  churnRisk: boolean;
  upgradeReady: boolean;
  createdAt: string;
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    authedFetch(`/api/tenants/${params.id}`)
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        setTenant((await r.json()) as TenantDetail);
      })
      .catch(() => setError('Network error'));
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

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <Link
          href="/tenants"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Tenants
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {tenant.nameEn} · {tenant.nameAr}
        </h1>
        <p className="text-sm text-slate-500">
          {tenant.mode} · {tenant.country} · {tenant.currency} · {tenant.timezone}
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardBody className="space-y-4">
              <CardTitle>Tenant details</CardTitle>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <Badge variant={tenant.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {tenant.status}
                  </Badge>
                </dd>
                <dt className="text-slate-500">Package</dt>
                <dd>{tenant.package}</dd>
                <dt className="text-slate-500">Mode</dt>
                <dd>{tenant.mode}</dd>
                <dt className="text-slate-500">Churn risk</dt>
                <dd>
                  {tenant.churnRisk ? (
                    <Badge variant="danger">Yes</Badge>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </dd>
                <dt className="text-slate-500">Upgrade ready</dt>
                <dd>
                  {tenant.upgradeReady ? (
                    <Badge variant="info">Yes</Badge>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </dd>
                <dt className="text-slate-500">Created</dt>
                <dd>{new Date(tenant.createdAt).toLocaleString()}</dd>
              </dl>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Data sources</CardTitle>
              <p className="text-sm text-slate-500">
                <Link href={`/tenants/${tenant.id}/data`} className="underline">
                  Open the data sources page →
                </Link>
              </p>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Segments</CardTitle>
              <p className="text-sm text-slate-500">
                <Link href={`/tenants/${tenant.id}/segments`} className="underline">
                  Open the segments page →
                </Link>
              </p>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Campaigns</CardTitle>
              <p className="text-sm text-slate-500">
                <Link href={`/tenants/${tenant.id}/campaigns`} className="underline">
                  Open the campaigns page →
                </Link>
              </p>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="automations">
          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Automations</CardTitle>
              <p className="text-sm text-slate-500">
                <Link href={`/tenants/${tenant.id}/automations`} className="underline">
                  Open the automations page →
                </Link>
              </p>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Content Calendar</CardTitle>
              <p className="text-sm text-slate-500">
                <Link href={`/tenants/${tenant.id}/calendar`} className="underline">
                  Open the calendar page →
                </Link>
              </p>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardBody className="space-y-3">
              <CardTitle>Compliance</CardTitle>
              <p className="text-sm text-slate-500">
                <Link href={`/tenants/${tenant.id}/compliance`} className="underline">
                  Open the compliance dashboard →
                </Link>
              </p>
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
