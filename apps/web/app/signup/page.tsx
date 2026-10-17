'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardBody, CardTitle, Input, Label, Select } from '@lmms/ui';

const COUNTRIES = ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'];
const CURRENCIES = ['AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'];

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('AE');
  const [currency, setCurrency] = useState('AED');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/self-serve/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          contactName,
          businessName,
          phone,
          country,
          currency,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error === 'email_already_registered' ? 'This email is already registered.' : 'Could not submit. Try again.');
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="w-full max-w-md">
          <CardBody className="space-y-4 text-center">
            <h1 className="text-2xl font-bold">You&apos;re on the list!</h1>
            <p className="text-slate-600 text-sm">
              We&apos;ve received your request. Our team will review it and email you within 1 business day.
            </p>
            <Link href="/" className="text-sm underline">
              Back to home
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-4">
          <header className="text-center mb-2">
            <h1 className="text-2xl font-bold">Get started with LMMS</h1>
            <p className="text-sm text-slate-500">
              Self-serve. No agency required. 14-day free trial.
            </p>
          </header>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label>Business name</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Your name</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Phone (optional)</Label>
              <Input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Country</Label>
                <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Submitting…' : 'Request access'}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
