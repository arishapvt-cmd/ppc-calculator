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
  CheckCircle,
  Sparkles,
  Database,
  Trash2,
  CloudLightning,
  Loader2,
  Bookmark,
  LogIn
} from 'lucide-react';
import { CampaignVariables, CalculatedResults, AppSettings, PlatformType, ActiveTab, SavedCampaign } from '../types';
import { calculatePPC, formatCurrency } from '../utils';

interface DashboardScreenProps {
  platform: PlatformType;
  setPlatform: (p: PlatformType) => void;
  variables: CampaignVariables;
  setVariables: (v: CampaignVariables) => void;
  settings: AppSettings;
  onNavigate: (tab: ActiveTab) => void;
  onExport: () => void;
  user: any;
  savedCampaigns: SavedCampaign[];
  onSaveCampaign: (name: string) => Promise<void>;
  onLoadCampaign: (campaign: SavedCampaign) => void;
  onDeleteCampaign: (id: number | string) => Promise<void>;
  dbLoading: boolean;
  onSignIn: () => void;
  storageType?: 'cloudsql' | 'firestore';
  setStorageType?: (type: 'cloudsql' | 'firestore') => void;
}

export default function DashboardScreen({
  platform,
  setPlatform,
  variables,
  setVariables,
  settings,
  onNavigate,
  onExport,
  user,
  savedCampaigns,
  onSaveCampaign,
  onLoadCampaign,
  onDeleteCampaign,
  dbLoading,
  onSignIn,
  storageType = 'firestore',
  setStorageType
}: DashboardScreenProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isSavingLocal, setIsSavingLocal] = useState(false);

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
  const roiTrend = getTrend(results.roi, baselineResults.roi);

  const handleSliderChange = (key: keyof CampaignVariables, val: number) => {
    setVariables({
      ...variables,
      [key]: val,
    });
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    setIsSavingLocal(true);
    try {
      await onSaveCampaign(newCampaignName.trim());
      setNewCampaignName('');
    } finally {
      setIsSavingLocal(false);
    }
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
        <div className="bg-surface-container-high p-1 rounded-full flex w-full max-w-xs shadow-sm border border-outline-variant/10">
          <button
            id="btn-google"
            onClick={() => setPlatform('google')}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
              platform === 'google'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface bg-transparent'
            }`}
          >
            Google Ads
          </button>
          <button
            id="btn-meta"
            onClick={() => setPlatform('meta')}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
              platform === 'meta'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface bg-transparent'
            }`}
          >
            Meta Ads
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
            <div className={`font-mono text-xs font-bold flex items-center gap-1 ${
              profitTrend.isPositive ? 'text-secondary bg-secondary/10 px-2 py-0.5 rounded-full' : 'text-error bg-error/10 px-2 py-0.5 rounded-full'
            }`}>
              {profitTrend.isPositive ? (
                <TrendingUp size={14} className="stroke-[2.5]" />
              ) : (
                <TrendingDown size={14} className="stroke-[2.5]" />
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
              <span className={`font-mono text-[10px] font-bold ${
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
              <span className={`font-mono text-[10px] font-bold ${
                cplTrend.isPositive ? 'text-secondary' : 'text-error'
              }`}>
                {cplTrend.text}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Return on Investment (ROI) Metric */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-sans font-semibold text-xs tracking-wider text-on-surface-variant uppercase block">
                Return on Investment (ROI)
              </span>
              <span className="text-[10px] text-on-surface-variant/80 font-normal">
                Net Profit Percentage based on Spend & Profit Margin
              </span>
            </div>
            <div className={`font-mono text-xs font-bold flex items-center gap-1 ${
              roiTrend.isPositive ? 'text-secondary bg-secondary/10 px-2 py-0.5 rounded-full' : 'text-error bg-error/10 px-2 py-0.5 rounded-full'
            }`}>
              {roiTrend.isPositive ? (
                <TrendingUp size={14} className="stroke-[2.5]" />
              ) : (
                <TrendingDown size={14} className="stroke-[2.5]" />
              )}
              <span>{roiTrend.text}</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div className={`font-hanken text-3xl font-bold ${results.roi >= 0 ? 'text-secondary' : 'text-error'}`}>
              {results.roi >= 0 ? '+' : ''}{results.roi.toFixed(1)}%
            </div>
            <div className="text-[10px] font-mono text-on-surface-variant/80">
              Spend: {formatCurrency(variables.adSpend, settings.currencySymbol)}
            </div>
          </div>

          {/* ROI Visual Progress Track */}
          <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden relative">
            {results.roi > 0 ? (
              <div 
                className="bg-secondary h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(results.roi, 100)}%` }}
              />
            ) : results.roi < 0 ? (
              <div 
                className="bg-error h-full rounded-full transition-all duration-500 float-right" 
                style={{ width: `${Math.min(Math.abs(results.roi), 100)}%` }}
              />
            ) : null}
          </div>
          <div className="flex justify-between text-[9px] text-on-surface-variant/60 font-mono">
            <span>{results.roi < 0 ? '-100% loss' : '0% break-even'}</span>
            <span>{results.roi > 100 ? `${results.roi.toFixed(0)}% ROI` : '100%+ profit'}</span>
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
            <li><strong>Return on Investment (ROI):</strong> (Net Profit / Ad Spend) × 100</li>
          </ul>
        </div>
      )}

      {/* Campaign Variables Section */}
      <section id="campaign-variables-panel" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-hanken text-base font-bold text-on-surface">Campaign Variables</h2>
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

      {/* Cloud Database Sync Panel */}
      <section id="cloud-database-sync-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-hanken text-base font-bold text-on-surface flex items-center gap-2">
            <Database size={16} className="text-primary" />
            <span>Database Cloud Storage</span>
          </h3>
          
          {user && setStorageType && (
            <div className="bg-surface-container-high p-0.5 rounded-lg flex text-[10px] font-bold border border-outline-variant/10">
              <button
                type="button"
                onClick={() => setStorageType('firestore')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  storageType === 'firestore'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Firestore
              </button>
              <button
                type="button"
                onClick={() => setStorageType('cloudsql')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  storageType === 'cloudsql'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Cloud SQL
              </button>
            </div>
          )}
        </div>

        {user ? (
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] space-y-4">
            
            {/* Save Current Scenario Form */}
            <form onSubmit={handleSaveSubmit} className="space-y-2">
              <label htmlFor="campaign-name" className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Save Current Variables as Scenario to {storageType === 'firestore' ? 'Firestore' : 'Cloud SQL'}
              </label>
              <div className="flex gap-2">
                <input
                  id="campaign-name"
                  type="text"
                  placeholder="e.g. Q4 Growth Promo"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="flex-1 bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <button
                  type="submit"
                  disabled={dbLoading || isSavingLocal}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {(dbLoading || isSavingLocal) ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Bookmark size={13} />
                  )}
                  <span>Save</span>
                </button>
              </div>
            </form>

            {/* List Saved Scenarios */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                My {storageType === 'firestore' ? 'Firestore' : 'Cloud SQL'} Scenarios ({savedCampaigns.length})
              </span>
              
              {savedCampaigns.length === 0 ? (
                <div className="text-center p-4 bg-surface-container/30 border border-dashed border-outline-variant/20 rounded-xl text-xs text-on-surface-variant">
                  No saved scenarios in {storageType === 'firestore' ? 'Firestore' : 'Cloud SQL'}. Adjust sliders above and save one!
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-outline-variant/10 pr-1">
                  {savedCampaigns.map((camp) => (
                    <div 
                      key={camp.id} 
                      className="flex items-center justify-between pt-2 first:pt-0 group hover:bg-surface-container/10 rounded-lg p-1.5 transition-all"
                    >
                      <button
                        onClick={() => onLoadCampaign(camp)}
                        className="flex-1 text-left cursor-pointer"
                        title="Click to load this scenario"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-on-surface">{camp.name}</span>
                          <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-bold ${
                            camp.platform === 'google' 
                              ? 'bg-blue-500/10 text-blue-600' 
                              : 'bg-purple-500/10 text-purple-600'
                          }`}>
                            {camp.platform}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                          Spend: {formatCurrency(camp.adSpend, settings.currencySymbol).split('.')[0]} • ROAS: {((camp.avgOrderValue * (camp.conversionRate / 100) * (camp.adSpend / camp.cpc)) / camp.adSpend).toFixed(1)}x
                        </div>
                      </button>
                      <button
                        onClick={() => onDeleteCampaign(camp.id)}
                        className="text-on-surface-variant hover:text-error p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Delete scenario"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] text-center space-y-3">
            <div className="flex justify-center text-primary-container">
              <CloudLightning size={32} className="stroke-[1.5]" />
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed px-2">
              Connect to our secure Firestore & PostgreSQL databases via Google Sign-In to save campaign variations, compare snapshots, and access them from any browser.
            </p>
            <button
              onClick={onSignIn}
              className="w-full h-10 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn size={13} />
              <span>Connect Cloud SQL & Firestore Account</span>
            </button>
          </div>
        )}
      </section>


      {/* Action Buttons */}
      <section id="dashboard-actions-section" className="space-y-3 flex flex-col pt-2">
        <button
          id="btn-nav-projection"
          onClick={() => onNavigate('projections')}
          className="w-full h-[52px] bg-primary text-white font-bold text-base rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/95"
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
        <Sparkles size={14} className="text-primary" />
        <span>Comparing live inputs to standard {platform === 'google' ? 'Google Ads' : 'Meta Ads'} benchmarks</span>
      </div>
    </div>
  );
}
