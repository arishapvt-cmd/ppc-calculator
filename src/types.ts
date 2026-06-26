/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlatformType = 'google' | 'meta';

export type ActiveTab = 'dashboard' | 'projections' | 'reports' | 'settings';

export interface CampaignVariables {
  adSpend: number;
  cpc: number;
  conversionRate: number; // in percentage (e.g., 3.5)
  avgOrderValue: number;
  profitMargin: number; // in percentage (e.g., 40)
}

export interface CalculatedResults {
  clicks: number;
  conversions: number;
  cpl: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  roas: number; // standard roas (Revenue / Spend)
  netRoas: number; // (Revenue - Spend) / Spend, shown in screenshot
  roi: number; // Net Profit / Spend as %
  cac: number; // Customer Acquisition Cost (equals CPL if every conversion is a purchase)
}

export interface PlatformBenchmarks {
  avgCpc: number;
  avgConversionRate: number;
  avgAov: number;
  avgMargin: number;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  targetRoas: number;
  targetCpl: number;
  googleBenchmarks: PlatformBenchmarks;
  metaBenchmarks: PlatformBenchmarks;
}

export interface SavedCampaign {
  id: number | string;
  name: string;
  platform: PlatformType;
  adSpend: number;
  cpc: number;
  conversionRate: number;
  avgOrderValue: number;
  profitMargin: number;
  createdAt?: string;
  updatedAt?: string;
}

