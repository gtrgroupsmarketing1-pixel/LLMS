export interface AdCampaignInput {
  name: string;
  objective: string;
  dailyBudget: number;
  currency: string;
  startDate: string;
  endDate?: string;
  geoPreset: string;
}

export interface AdCreativeInput {
  name: string;
  fileUrl: string;
  mimeType?: string;
  width?: number;
  height?: number;
  copyAr?: string;
  copyEn?: string;
}

export interface AdSetInput {
  name: string;
  targeting: Record<string, unknown>;
  dailyBudget: number;
}

export interface CreateCampaignResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

export interface AdPlatformAdapter {
  validate(): Promise<boolean>;
  createCampaign(
    input: AdCampaignInput,
    adSets: AdSetInput[],
    creatives: AdCreativeInput[],
  ): Promise<CreateCampaignResult>;
  pauseCampaign(externalId: string): Promise<{ ok: boolean; error?: string }>;
  resumeCampaign(externalId: string): Promise<{ ok: boolean; error?: string }>;
  updateDailyBudget(
    externalId: string,
    newDailyBudget: number,
  ): Promise<{ ok: boolean; error?: string }>;
  fetchSpend(
    externalId: string,
    since: Date,
    until: Date,
  ): Promise<Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    currency: string;
  }>>;
}

export class MockMetaAdsAdapter implements AdPlatformAdapter {
  async validate(): Promise<boolean> {
    return true;
  }
  async createCampaign(
    input: AdCampaignInput,
    adSets: AdSetInput[],
    creatives: AdCreativeInput[],
  ): Promise<CreateCampaignResult> {
    if (creatives.length < 2) {
      return { ok: false, error: 'min_two_creatives_required' };
    }
    if (adSets.length < 1) {
      return { ok: false, error: 'at_least_one_ad_set_required' };
    }
    return { ok: true, externalId: `meta-${Date.now()}` };
  }
  async pauseCampaign(_id: string) { return { ok: true }; }
  async resumeCampaign(_id: string) { return { ok: true }; }
  async updateDailyBudget(_id: string, _n: number) { return { ok: true }; }
  async fetchSpend(
    _externalId: string,
    _since: Date,
    _until: Date,
  ): Promise<Array<{ date: string; spend: number; impressions: number; clicks: number; conversions: number; currency: string }>> {
    return [];
  }
}

export class MockGoogleAdsAdapter implements AdPlatformAdapter {
  async validate(): Promise<boolean> {
    return true;
  }
  async createCampaign(
    input: AdCampaignInput,
    adSets: AdSetInput[],
    creatives: AdCreativeInput[],
  ): Promise<CreateCampaignResult> {
    if (creatives.length < 2) {
      return { ok: false, error: 'min_two_creatives_required' };
    }
    if (adSets.length < 1) {
      return { ok: false, error: 'at_least_one_ad_set_required' };
    }
    return { ok: true, externalId: `google-${Date.now()}` };
  }
  async pauseCampaign(_id: string) { return { ok: true }; }
  async resumeCampaign(_id: string) { return { ok: true }; }
  async updateDailyBudget(_id: string, _n: number) { return { ok: true }; }
  async fetchSpend(
    _externalId: string,
    _since: Date,
    _until: Date,
  ): Promise<Array<{ date: string; spend: number; impressions: number; clicks: number; conversions: number; currency: string }>> {
    return [];
  }
}
