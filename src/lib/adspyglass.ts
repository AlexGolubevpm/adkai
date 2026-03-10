// ---------------------------------------------------------------------------
// AdSpyGlass (ASG) API client
// Docs: discovered via exploration — base URL https://api.adok.ai/api
// Auth: X-Asg-Auth-Email + X-Asg-Auth-Token headers
// ---------------------------------------------------------------------------

export interface AsgReportRow {
  name: string;
  hits: number;
  clicks: number;
  impressions: number;
  bounces: number;
  broker_income: number;
  broker_hits: number;
  broker_clicks: number;
  predicted_income: number;
  bounce_rate: number;
  ctr: number;
  broker_cpc: number;
  broker_cpm: number;
  broker_ctr: number;
  fill_rate: number;
  open_rate: number;
  discrepancy: number;
  hits_to_clicks: number;
  real_cpm: number;
  real_cpm_with_bounces: number;
  real_cpm_open: number;
  requests: number;
  win_rate: number;
  prediction_accuracy: number;
  banner_ctr: number;
  banner_view_rate: number;
  predicted_cpm: number;
  discrepancy_rev: number;
  discrepancy_imp: number;
  cpc: number;
}

export type AsgGroupBy =
  | "date"
  | "website"
  | "spot"
  | "ad_type"
  | "country"
  | "device"
  | "browser"
  | "hour";

export interface AsgReportParams {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  group_by?: AsgGroupBy;
  website_id?: number;
}

// Website names come as "ID. domain.com" — parse both parts
export interface AsgWebsite {
  externalId: number;
  domain: string;
}

export function parseWebsiteName(name: string): AsgWebsite {
  const match = name.match(/^(\d+)\.\s*(.+)$/);
  if (!match) return { externalId: 0, domain: name };
  return { externalId: parseInt(match[1], 10), domain: match[2] };
}

// Spot names come as "ID. SpotName (domain.com)"
export interface AsgSpot {
  externalId: number;
  spotName: string;
  domain: string;
}

export function parseSpotName(name: string): AsgSpot {
  const match = name.match(/^(\d+)\.\s*(.+?)\s*\((.+?)\)$/);
  if (!match) return { externalId: 0, spotName: name, domain: "" };
  return {
    externalId: parseInt(match[1], 10),
    spotName: match[2],
    domain: match[3],
  };
}

class AdSpyGlassClient {
  private baseUrl: string;
  private email: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.ASG_API_URL || "https://api.adok.ai/api";
    this.email = process.env.ASG_AUTH_EMAIL || "";
    this.token = process.env.ASG_AUTH_TOKEN || "";
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString(), {
      headers: {
        "X-Asg-Auth-Email": this.email,
        "X-Asg-Auth-Token": this.token,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`ASG API ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  /** Fetch report data with optional grouping and filtering */
  async getReport(params: AsgReportParams): Promise<AsgReportRow[]> {
    const queryParams: Record<string, string> = {
      from: params.from,
      to: params.to,
    };
    if (params.group_by) queryParams.group_by = params.group_by;
    if (params.website_id) queryParams.website_id = String(params.website_id);

    return this.request<AsgReportRow[]>("/api/report", queryParams);
  }

  /** Aggregated totals for a date range (no group_by) */
  async getTotals(from: string, to: string): Promise<AsgReportRow> {
    const rows = await this.getReport({ from, to });
    return rows[0];
  }

  /** Per-website breakdown */
  async getWebsiteReport(from: string, to: string): Promise<(AsgReportRow & AsgWebsite)[]> {
    const rows = await this.getReport({ from, to, group_by: "website" });
    return rows.map((row) => ({ ...row, ...parseWebsiteName(row.name) }));
  }

  /** Per-spot (ad placement) breakdown, optionally filtered by website */
  async getSpotReport(from: string, to: string, websiteId?: number): Promise<(AsgReportRow & AsgSpot)[]> {
    const rows = await this.getReport({
      from,
      to,
      group_by: "spot",
      website_id: websiteId,
    });
    return rows.map((row) => ({ ...row, ...parseSpotName(row.name) }));
  }

  /** Per ad-type breakdown (Banner, Popunder, Slider, etc.) */
  async getAdTypeReport(from: string, to: string): Promise<AsgReportRow[]> {
    return this.getReport({ from, to, group_by: "ad_type" });
  }

  /** Daily breakdown for a date range */
  async getDailyReport(from: string, to: string, websiteId?: number): Promise<AsgReportRow[]> {
    return this.getReport({ from, to, group_by: "date", website_id: websiteId });
  }

  /** Per-country breakdown */
  async getCountryReport(from: string, to: string): Promise<AsgReportRow[]> {
    return this.getReport({ from, to, group_by: "country" });
  }

  /** Per-device breakdown */
  async getDeviceReport(from: string, to: string): Promise<AsgReportRow[]> {
    return this.getReport({ from, to, group_by: "device" });
  }

  /** Hourly breakdown */
  async getHourlyReport(from: string, to: string): Promise<AsgReportRow[]> {
    return this.getReport({ from, to, group_by: "hour" });
  }
}

// Singleton
const globalForAsg = globalThis as unknown as { asgClient: AdSpyGlassClient };
export const asg = globalForAsg.asgClient || new AdSpyGlassClient();
if (process.env.NODE_ENV !== "production") globalForAsg.asgClient = asg;
