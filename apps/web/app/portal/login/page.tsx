'use client';

import { useState } from 'react';
import { Button, Card, CardBody, CardTitle, Input, Label } from '@lmms/ui';
import { setTokens } from '../../../lib/portal/session';

export default function PortalLoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  async function requestOtp() {
    if (Date.now() - lastSentAt < 30_000) {
      setErr('Please wait before requesting another code.');
      return;
    }
    setSending(true);
    setErr(null);
    try {
      const r = await fetch('/api/auth/client/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!r.ok) {
        setErr('Could not send OTP. Check your number.');
        return;
      }
      setLastSentAt(Date.now());
      setStep('otp');
    } catch {
      setErr('Network error');
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    setErr(null);
    try {
      const r = await fetch('/api/auth/client/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      if (!r.ok) {
        setErr('Invalid or expired code.');
        return;
      }
      const data = (await r.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      setTokens(data.accessToken, data.refreshToken);
      window.location.href = '/portal';
    } catch {
      setErr('Network error');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-4">
          <header>
            <CardTitle>LMMS</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {step === 'phone' ? 'أدخل رقم هاتفك' : 'أدخل الرمز المكوّن من 6 أرقام'}
            </p>
          </header>

          {step === 'phone' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button
                onClick={requestOtp}
                disabled={sending || phone.length < 8}
                className="w-full"
              >
                {sending ? 'Sending…' : 'Send OTP'}
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  dir="ltr"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl tracking-widest"
                />
              </div>
              <Button
                onClick={verify}
                disabled={otp.length !== 6}
                className="w-full"
              >
                Verify
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('phone')}
                className="w-full"
              >
                Change number
              </Button>
            </div>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}
        </CardBody>
      </Card>
    </main>
  );
}
