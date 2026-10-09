export function maskPhone(phone: string): string {
  if (phone.length < 6) return '***';
  return phone.slice(0, 4) + '*'.repeat(phone.length - 6) + phone.slice(-2);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const l =
    local.length <= 2
      ? local[0] + '*'
      : local[0] + '*'.repeat(local.length - 2) + local.slice(-1);
  return `${l}@${domain}`;
}
