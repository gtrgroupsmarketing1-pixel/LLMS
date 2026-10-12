export type AttributionSource =
  | 'PROMO_CODE'
  | 'UTM'
  | 'CALL_TRACKING'
  | 'ERP_ORDER_MATCH'
  | 'MANUAL';

export type AttributionConfidence = 'HIGH' | 'MEDIUM' | 'ESTIMATED';

/**
 * Confidence rules — PRD §11 Module 8.
 * Never overstate: promo redemption and ERP match are the only HIGH confidence
 * sources. UTM is MEDIUM (click may not convert). Call tracking is ESTIMATED
 * because it depends on the caller identifying the campaign.
 */
export const CONFIDENCE_BY_SOURCE: Record<AttributionSource, AttributionConfidence> = {
  ERP_ORDER_MATCH: 'HIGH',
  PROMO_CODE: 'HIGH',
  UTM: 'MEDIUM',
  CALL_TRACKING: 'ESTIMATED',
  MANUAL: 'ESTIMATED',
};

export function confidenceFor(source: AttributionSource): AttributionConfidence {
  return CONFIDENCE_BY_SOURCE[source];
}

export interface ConfidenceScore {
  numeric: number;
  label: AttributionConfidence;
}

/**
 * Numeric score for reporting — 0..100.
 * HIGH = 90, MEDIUM = 70, ESTIMATED = 40.
 * These are exposed so AC-ATT-002 ("display confidence level for every figure")
 * can be satisfied without needing raw evidence inspection.
 */
export function numericScore(label: AttributionConfidence): number {
  switch (label) {
    case 'HIGH': return 90;
    case 'MEDIUM': return 70;
    case 'ESTIMATED': return 40;
  }
}
