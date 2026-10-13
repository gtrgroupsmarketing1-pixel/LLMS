export interface ProposalInput {
  title: string;
  items: Array<{ description: string; amount: number }>;
  currency: string;
  notes?: string;
}

export interface BuiltProposal {
  title: string;
  body: string;
  totalValue: number;
  currency: string;
}

export function buildProposal(input: ProposalInput): BuiltProposal {
  const lines: string[] = [];
  lines.push(`# ${input.title}`);
  lines.push('');
  lines.push('## Scope');
  for (const it of input.items) {
    lines.push(`- ${it.description} — ${input.currency} ${it.amount.toFixed(2)}`);
  }
  const total = input.items.reduce((s, i) => s + i.amount, 0);
  lines.push('');
  lines.push(`**Total: ${input.currency} ${total.toFixed(2)}**`);
  if (input.notes) {
    lines.push('');
    lines.push('## Notes');
    lines.push(input.notes);
  }
  return {
    title: input.title,
    body: lines.join('\n'),
    totalValue: Math.round(total * 100) / 100,
    currency: input.currency,
  };
}
