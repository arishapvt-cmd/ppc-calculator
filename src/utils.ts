/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CampaignVariables, CalculatedResults, AppSettings } from './types';

/**
 * Calculates all PPC metrics based on campaign inputs.
 */
export function calculatePPC(vars: CampaignVariables): CalculatedResults {
  const { adSpend, cpc, conversionRate, avgOrderValue, profitMargin } = vars;

  if (adSpend <= 0 || cpc <= 0) {
    return {
      clicks: 0,
      conversions: 0,
      cpl: 0,
      revenue: 0,
      grossProfit: 0,
      netProfit: 0,
      roas: 0,
      netRoas: 0,
      roi: 0,
      cac: 0,
    };
  }

  const clicks = adSpend / cpc;
  const conversions = clicks * (conversionRate / 100);
  const cpl = conversions > 0 ? adSpend / conversions : 0;
  const revenue = conversions * avgOrderValue;
  const grossProfit = revenue * (profitMargin / 100);
  const netProfit = grossProfit - adSpend;
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  
  // netRoas matches the screenshot's representation: (Revenue - Spend) / Spend
  // e.g. ($8,750 - $2,500) / $2,500 = 2.5x
  const netRoas = adSpend > 0 ? (revenue - adSpend) / adSpend : 0;
  const roi = adSpend > 0 ? (netProfit / adSpend) * 100 : 0;
  const cac = conversions > 0 ? adSpend / conversions : 0;

  return {
    clicks: Math.round(clicks),
    conversions: parseFloat(conversions.toFixed(2)),
    cpl: parseFloat(cpl.toFixed(2)),
    revenue: parseFloat(revenue.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    roas: parseFloat(roas.toFixed(2)),
    netRoas: parseFloat(netRoas.toFixed(2)),
    roi: parseFloat(roi.toFixed(2)),
    cac: parseFloat(cac.toFixed(2)),
  };
}

/**
 * Formats a currency value with the chosen symbol.
 */
export function formatCurrency(value: number, symbol: string = '$'): string {
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Default settings with typical industry benchmarks for Google and Meta
 */
export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  currencySymbol: '$',
  targetRoas: 3.0,
  targetCpl: 35.0,
  googleBenchmarks: {
    avgCpc: 1.50,
    avgConversionRate: 3.5,
    avgAov: 150,
    avgMargin: 40,
  },
  metaBenchmarks: {
    avgCpc: 0.95,
    avgConversionRate: 2.2,
    avgAov: 95,
    avgMargin: 50,
  },
};
