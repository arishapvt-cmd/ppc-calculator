/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Rocket, 
  Share2, 
  HelpCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { CampaignVariables, CalculatedResults, AppSettings, PlatformType, ActiveTab } from '../types';
import { calculatePPC, formatCurrency } from '../utils';

interface DashboardScreenProps {
  platform: PlatformType;
  setPlatform: (p: PlatformType) => void;
  variables: CampaignVariables;
  setVariables: (v: CampaignVariables) => void;
  settings: AppSettings;
  onNavigate: (tab: ActiveTab) => void;
  onExport: () => void;
}

export default function DashboardScreen({
  platform,
  setPlatform,
  variables,
  setVariables,
  settings,
  onNavigate,
  onExport,
}: DashboardScreenProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Calculate current results
  const results = calculatePPC(variables);

  // Compute baseline based on benchmarks to show dynamic relative trend percentages
  const benchmark = platform === 'google' ? settings.googleBenchmarks : settings.metaBenchmarks;
  const baselineVars: CampaignVariables = {
    adSpend: 2500, // standard baseline
    cpc: benchmark.avgCpc,
    conversionRate: benchmark.avgConversionRate,
    avgOrderValue: benchmark.avgAov,
    profitMargin: benchmark.avgMargin,
  };
  const baselineResults = calculatePPC(baselineVars);

  // Trend computations
  const getTrend = (current: number, baseline: number, isCost: boolean = false) => {
    if (baseline === 0) return { pct: 0, text: '0%', isPositive: true };
    const diff = current - baseline;
    const pct = (diff / baseline) * 100;
    
    // For cost metrics, a decrease is positive
    const isPositive = isCost ? pct <= 0 : pct >= 0;
    const absPct = Math.abs(pct).toFixed(0);
    const sign = pct >= 0 ? '+' : '-';
    
    return {
      pct,
      text: `${sign}${absPct}%`,
      isPositive,
    };
  };

  const profitTrend = getTrend(results.netProfit, baselineResults.netProfit);
  const roasTrend = getTrend(results.netRoas, baselineResults.netRoas);
  const cplTrend = getTrend(results.cpl, baselineResults.cpl, true);

  const handleSliderChange = (key: keyof CampaignVariables, val: number) => {
    setVariables({
      ...variables,
      [key]: val,
    });
  };

  // Helper for slider active track calculation
  const getSliderTrackStyle = (val: number, min: number, max: number) => {
    const percentage = ((val - min) / (max - min)) * 100;
    return {
      background: `linear-gradient(to right, #0061ff 0%, #0061ff ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
    };
  };

  return (
    <div id="dashboard-screen-root" className="space-y-6">
      {/* Platform Switcher */}
      <section id="platform-switcher" className="flex justify-center">
        <div className="bg-surface-container-high p-1 rounded-full flex w-full max-w-xs shadow-sm">
          <button
            id="btn-google"
            onClick={() => setPlatform('google')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-200 ${
              platform === 'google'
                ? 'bg-primary-container text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface bg-transparent'
            }`}
          >
            Google Ads
          </button>
          <button
            id="btn-meta"
            onClick={() => setPlatform('meta')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-200 ${
              platform === 'meta'
                ? 'bg-primary-container text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface bg-transparent'
            }`}
          >
            Meta
          </button>
        </div>
      </section>

      {/* KPI Section */}
      <section id="kpi-metrics-grid" className="space-y-3">
        {/* Full Width Metric: Monthly Profit */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)]">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
              Estimated Monthly Profit
            </span>
            <div className={`font-mono text-sm font-medium flex items-center gap-1 ${
              profitTrend.isPositive ? 'text-secondary' : 'text-error'
            }`}>
              {profitTrend.isPositive ? (
                <TrendingUp size={16} className="stroke-[2.5]" />
              ) : (
                <TrendingDown size={16} className="stroke-[2.5]" />
              )}
              <span>{profitTrend.text}</span>
            </div>
          </div>
          <div className="font-hanken text-3xl md:text-4xl font-bold text-on-surface">
            {formatCurrency(results.netProfit, settings.currencySymbol)}
          </div>
        </div>

        {/* Side-by-Side Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* ROAS Metric */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)]">
            <span className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase block mb-1">
              ROAS (Net)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-hanken text-xl md:text-2xl font-bold text-on-surface">
                {results.netRoas.toFixed(1)}x
              </span>
              <span className={`font-mono text-[10px] font-semibold ${
                roasTrend.isPositive ? 'text-secondary' : 'text-error'
              }`}>
                {roasTrend.text}
              </span>
            </div>
          </div>

          {/* CPL Metric */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)]">
            <span className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase block mb-1">
              CPL
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-hanken text-xl md:text-2xl font-bold text-on-surface">
                {formatCurrency(results.cpl, settings.currencySymbol)}
              </span>
              <span className={`font-mono text-[10px] font-semibold ${
                cplTrend.isPositive ? 'text-secondary' : 'text-error'
              }`}>
                {cplTrend.text}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Info Card */}
      {showInfo && (
        <div id="formulas-info-panel" className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs space-y-2 text-primary animate-fade-in">
          <div className="flex justify-between items-center">
            <h4 className="font-bold uppercase tracking-wider">Calculation Schema</h4>
            <button onClick={() => setShowInfo(false)} className="text-primary hover:underline">Dismiss</button>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Clicks:</strong> Ad Spend / CPC</li>
            <li><strong>Conversions:</strong> Clicks × Conversion Rate</li>
            <li><strong>CPL:</strong> Ad Spend / Conversions</li>
            <li><strong>Revenue:</strong> Conversions × Avg Order Value</li>
            <li><strong>Monthly Profit:</strong> (Revenue × Margin) - Ad Spend</li>
            <li><strong>Net ROAS:</strong> (Revenue - Spend) / Spend</li>
          </ul>
        </div>
      )}

      {/* Campaign Variables Section */}
      <section id="campaign-variables-panel" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-hanken text-lg font-semibold text-on-surface">Campaign Variables</h2>
          <button
            id="info-tooltip-trigger"
            onClick={() => setShowInfo(!showInfo)}
            className="text-primary hover:text-primary-container p-1 rounded-full hover:bg-surface-container transition-colors"
            title="Formula Info"
          >
            <Info size={20} />
          </button>
        </div>

        <div className="space-y-6 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)]">
          
          {/* Spend Slider */}
          <div id="var-container-spend" className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="input-spend" className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
                Monthly Ad Spend
              </label>
              <span id="val-spend" className="font-mono text-xs font-semibold text-primary bg-primary-container/10 px-2 py-0.5 rounded-md">
                {formatCurrency(variables.adSpend, settings.currencySymbol)}
              </span>
            </div>
            <input
              id="input-spend"
              type="range"
              min="500"
              max="20000"
              step="100"
              value={variables.adSpend}
              onChange={(e) => handleSliderChange('adSpend', parseFloat(e.target.value))}
              className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer slider-thumb"
              style={getSliderTrackStyle(variables.adSpend, 500, 20000)}
            />
          </div>

          {/* CPC Slider */}
          <div id="var-container-cpc" className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="input-cpc" className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
                Avg. CPC
              </label>
              <span id="val-cpc" className="font-mono text-xs font-semibold text-primary bg-primary-container/10 px-2 py-0.5 rounded-md">
                {formatCurrency(variables.cpc, settings.currencySymbol)}
              </span>
            </div>
            <input
              id="input-cpc"
              type="range"
              min="0.1"
              max="15.0"
              step="0.05"
              value={variables.cpc}
              onChange={(e) => handleSliderChange('cpc', parseFloat(e.target.value))}
              className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer slider-thumb"
              style={getSliderTrackStyle(variables.cpc, 0.1, 15.0)}
            />
          </div>

          {/* Conversion Rate Slider */}
          <div id="var-container-cr" className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="input-cr" className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
                Conversion Rate
              </label>
              <span id="val-cr" className="font-mono text-xs font-semibold text-primary bg-primary-container/10 px-2 py-0.5 rounded-md">
                {variables.conversionRate.toFixed(1)}%
              </span>
            </div>
            <input
              id="input-cr"
              type="range"
              min="0.1"
              max="25.0"
              step="0.1"
              value={variables.conversionRate}
              onChange={(e) => handleSliderChange('conversionRate', parseFloat(e.target.value))}
              className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer slider-thumb"
              style={getSliderTrackStyle(variables.conversionRate, 0.1, 25.0)}
            />
          </div>

          {/* Avg Order Value Slider */}
          <div id="var-container-aov" className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="input-aov" className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
                Avg. Order Value
              </label>
              <span id="val-aov" className="font-mono text-xs font-semibold text-primary bg-primary-container/10 px-2 py-0.5 rounded-md">
                {formatCurrency(variables.avgOrderValue, settings.currencySymbol)}
              </span>
            </div>
            <input
              id="input-aov"
              type="range"
              min="10"
              max="2000"
              step="10"
              value={variables.avgOrderValue}
              onChange={(e) => handleSliderChange('avgOrderValue', parseFloat(e.target.value))}
              className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer slider-thumb"
              style={getSliderTrackStyle(variables.avgOrderValue, 10, 2000)}
            />
          </div>

          {/* Profit Margin Slider */}
          <div id="var-container-margin" className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="input-margin" className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase">
                Profit Margin
              </label>
              <span id="val-margin" className="font-mono text-xs font-semibold text-primary bg-primary-container/10 px-2 py-0.5 rounded-md">
                {variables.profitMargin}%
              </span>
            </div>
            <input
              id="input-margin"
              type="range"
              min="5"
              max="100"
              step="1"
              value={variables.profitMargin}
              onChange={(e) => handleSliderChange('profitMargin', parseFloat(e.target.value))}
              className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer slider-thumb"
              style={getSliderTrackStyle(variables.profitMargin, 5, 100)}
            />
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section id="dashboard-actions-section" className="space-y-3 flex flex-col pt-2">
        <button
          id="btn-nav-projection"
          onClick={() => onNavigate('projections')}
          className="w-full h-[52px] bg-primary-container text-on-primary font-bold text-base rounded-xl shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-container/95"
        >
          <span>Calculate Full Projection</span>
          <Rocket size={18} className="fill-current animate-pulse" />
        </button>
        <button
          id="btn-nav-export"
          onClick={onExport}
          className="w-full h-[52px] bg-transparent border border-outline-variant text-primary font-semibold text-base rounded-xl active:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-container-low"
        >
          <Share2 size={18} />
          <span>Export Report</span>
        </button>
      </section>

      {/* Helper Context Badge */}
      <div id="benchmark-comparison-badge" className="text-center text-xs text-on-surface-variant/75 pt-2 flex items-center justify-center gap-1">
        <Sparkles size={14} className="text-primary-container" />
        <span>Comparing live inputs to standard {platform === 'google' ? 'Google Ads' : 'Meta'} benchmarks</span>
      </div>
    </div>
  );
}
