'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardBody, CardTitle } from '@lmms/ui';

export default function MigrationPage() {
  const params = useParams<{ id: string }>();
  
  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Migration</h1>
          <p className="text-sm text-slate-500">
            Manage data migrations for this tenant.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>LMMS Standalone → ERP</CardTitle>
            <p className="text-sm text-slate-600">
              Upgrade this tenant from Standalone mode to our full LMMS ERP connection.
            </p>
            <Link
              href={`/tenants/${params.id}/migration/erp`}
              className="inline-block mt-4 text-sm rounded-md border border-slate-200 px-4 py-2 hover:bg-slate-50"
            >
              Open LMMS ERP Migration →
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <CardTitle>Import from Competitor</CardTitle>
            <p className="text-sm text-slate-600">
              Upload a CSV from CleanCloud, LaundryCard, or spreadsheets to import customers.
            </p>
            <Link
              href={`/tenants/${params.id}/migration/import`}
              className="inline-block mt-4 text-sm rounded-md border border-slate-200 px-4 py-2 hover:bg-slate-50"
            >
              Open Competitor Import Wizard →
            </Link>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
