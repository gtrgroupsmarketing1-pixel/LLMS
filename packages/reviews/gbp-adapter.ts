export interface GbpReview {
  externalId: string;
  authorName?: string;
  rating: number;
  text?: string;
  language?: string;
  reviewedAt: string;
}

export interface GbpInsightRow {
  date: string;
  searchViews: number;
  mapViews: number;
  calls: number;
  directionReqs: number;
  websiteClicks: number;
  bookings: number;
}

export interface GbpAdapter {
  validate(): Promise<boolean>;
  fetchNewReviews(since: Date): Promise<GbpReview[]>;
  fetchInsights(since: Date, until: Date): Promise<GbpInsightRow[]>;
  postResponse(externalReviewId: string, body: string): Promise<{ ok: boolean; externalId?: string; error?: string }>;
}

export class MockGbpAdapter implements GbpAdapter {
  async validate(): Promise<boolean> {
    return true;
  }
  async fetchNewReviews(): Promise<GbpReview[]> {
    return [];
  }
  async fetchInsights(): Promise<GbpInsightRow[]> {
    return [];
  }
  async postResponse(): Promise<{ ok: boolean; externalId?: string }> {
    return { ok: true, externalId: `mock-${Date.now()}` };
  }
}
