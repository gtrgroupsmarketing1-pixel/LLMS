export interface RawMetrics {
  campaignsSent: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesReplied: number;
  messagesFailed: number;
  optOuts: number;
  attributedRevenue: number;
  attributedOrders: number;
  unattributedRevenue: number;
  commercialContractsSigned: number;
  commercialContractValue: number;
  reviewsNew: number;
  reviewsRatingSum: number;
  reviewsResponded: number;
  gbpCalls: number;
  gbpDirections: number;
  adSpend: number;
  adRevenue: number;
  totalRecipients: number;
}

export interface Kpis {
  campaignsSent: number;
  messagesSent: number;
  deliveryRate: number;
  readRate: number;
  replyRate: number;
  failureRate: number;
  optOutRate: number;
  attributedRevenue: number;
  attributedOrders: number;
  unattributedRevenue: number;
  roas: number | null;
  costPerAcquisition: number | null;
  commercialContractsSigned: number;
  commercialContractValue: number;
  reviewsNew: number;
  averageRating: number | null;
  reviewsRespondedRate: number;
  gbpCalls: number;
  gbpDirections: number;
}

function ratio(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 10000) / 10000;
}

export function computeKpis(r: RawMetrics): Kpis {
  const delivered = r.messagesDelivered || r.messagesSent;
  const avgRating = r.reviewsNew > 0 ? r.reviewsRatingSum / r.reviewsNew : null;
  return {
    campaignsSent: r.campaignsSent,
    messagesSent: r.messagesSent,
    deliveryRate: ratio(r.messagesDelivered, r.messagesSent),
    readRate: ratio(r.messagesRead, delivered),
    replyRate: ratio(r.messagesReplied, delivered),
    failureRate: ratio(r.messagesFailed, r.messagesSent),
    optOutRate: ratio(r.optOuts, r.messagesSent),
    attributedRevenue: r.attributedRevenue,
    attributedOrders: r.attributedOrders,
    unattributedRevenue: r.unattributedRevenue,
    roas: r.adSpend > 0 ? Math.round((r.adRevenue / r.adSpend) * 100) / 100 : null,
    costPerAcquisition:
      r.attributedOrders > 0 && r.adSpend > 0
        ? Math.round((r.adSpend / r.attributedOrders) * 100) / 100
        : null,
    commercialContractsSigned: r.commercialContractsSigned,
    commercialContractValue: r.commercialContractValue,
    reviewsNew: r.reviewsNew,
    averageRating: avgRating === null ? null : Math.round(avgRating * 100) / 100,
    reviewsRespondedRate: ratio(r.reviewsResponded, r.reviewsNew),
    gbpCalls: r.gbpCalls,
    gbpDirections: r.gbpDirections,
  };
}

const ERP_ONLY_KEYS: Array<keyof Kpis> = ['attributedOrders', 'unattributedRevenue'];

export function applyModeFilter(
  kpis: Kpis,
  mode: 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
): Partial<Kpis> {
  if (mode === 'ERP_CONNECTED' || mode === 'UPGRADING') return kpis;
  const out: Partial<Kpis> = { ...kpis };
  for (const key of ERP_ONLY_KEYS) delete out[key];
  return out;
}
