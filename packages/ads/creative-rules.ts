export interface CreativeCheckInput {
  id: string;
  width?: number;
  height?: number;
  mimeType?: string;
  copyAr?: string;
  copyEn?: string;
}

export interface CreativeCheckIssue {
  creativeId: string;
  issue: string;
  details?: Record<string, unknown>;
}

export function checkCreatives(
  creatives: CreativeCheckInput[],
): { valid: boolean; issues: CreativeCheckIssue[] } {
  const issues: CreativeCheckIssue[] = [];

  if (creatives.length < 2) {
    issues.push({ creativeId: '', issue: 'min_two_creatives_required' });
  }

  for (const c of creatives) {
    if (!c.copyAr && !c.copyEn) {
      issues.push({ creativeId: c.id, issue: 'missing_copy' });
    }
    if (c.width && c.height) {
      const ratio = c.width / c.height;
      const isLandscape = Math.abs(ratio - 16 / 9) < 0.05 || Math.abs(ratio - 1.91) < 0.05;
      const isSquare = Math.abs(ratio - 1) < 0.05;
      const isVertical = Math.abs(ratio - 9 / 16) < 0.05 || Math.abs(ratio - 4 / 5) < 0.05;
      if (!isLandscape && !isSquare && !isVertical) {
        issues.push({
          creativeId: c.id,
          issue: 'aspect_ratio_off',
          details: { ratio: Math.round(ratio * 100) / 100 },
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
