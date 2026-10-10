import Link from 'next/link';
import { Button, Card, CardBody, CardTitle } from '@lmms/ui';

export default function HomePage() {
  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold">LMMS</h1>
        <p className="text-slate-500">Laundry Marketing Management System</p>
      </header>
      <Card>
        <CardBody className="space-y-4">
          <CardTitle>Get started</CardTitle>
          <p className="text-sm text-slate-600">
            Sign in with your agency account to manage tenants.
          </p>
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
