/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Settings, 
  RotateCcw, 
  DollarSign, 
  Percent, 
  HelpCircle,
  TrendingUp,
  Sliders,
  Check,
  RefreshCw,
  Globe
} from 'lucide-react';
import { AppSettings, PlatformBenchmarks } from '../types';
import { DEFAULT_SETTINGS } from '../utils';

interface SettingsScreenProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  onReset: () => void;
}

const CURRENCIES = [
  { label: 'US Dollar ($)', code: 'USD', symbol: '$' },
  { label: 'Euro (€)', code: 'EUR', symbol: '€' },
  { label: 'British Pound (£)', code: 'GBP', symbol: '£' },
  { label: 'Yen (¥)', code: 'JPY', symbol: '¥' },
  { label: 'Indian Rupee (₹)', code: 'INR', symbol: '₹' },
  { label: 'Australian Dollar (A$)', code: 'AUD', symbol: 'A$' },
];

export default function SettingsScreen({
  settings,
  setSettings,
  onReset,
}: SettingsScreenProps) {

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = CURRENCIES.find(c => c.code === e.target.value);
    if (selected) {
      setSettings({
        ...settings,
        currency: selected.code,
        currencySymbol: selected.symbol,
      });
    }
  };

  const handleTargetChange = (key: 'targetRoas' | 'targetCpl', val: number) => {
    setSettings({
      ...settings,
      [key]: val,
    });
  };

  const handleBenchmarkChange = (
    platform: 'google' | 'meta',
    field: keyof PlatformBenchmarks,
    val: number
  ) => {
    const platformKey = platform === 'google' ? 'googleBenchmarks' : 'metaBenchmarks';
    setSettings({
      ...settings,
      [platformKey]: {
        ...settings[platformKey],
        [field]: val,
      },
    });
  };

  return (
    <div id="settings-screen-root" className="space-y-6">
      
      {/* Intro section */}
      <section id="settings-intro" className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] text-center">
        <h3 className="font-hanken text-lg font-semibold text-on-surface mb-1 flex items-center justify-center gap-1.5">
          <Settings size={18} className="text-primary-container" />
          <span>Calculator Customization</span>
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Configure localized currencies, set firm campaign target boundaries, and specify your company's historic benchmarks to align trend tracking.
        </p>
      </section>

      {/* Global Configuration */}
      <section id="global-preferences-section" className="space-y-3">
        <h4 className="font-hanken text-sm font-semibold text-on-surface flex items-center gap-1">
          <Globe size={16} className="text-primary" />
          <span>Regional & Performance Targets</span>
        </h4>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] space-y-4">
          {/* Currency Selector */}
          <div className="space-y-1.5">
            <label htmlFor="setting-currency" className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
              Active Currency
            </label>
            <select
              id="setting-currency"
              value={settings.currency}
              onChange={handleCurrencyChange}
              className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Target ROAS */}
            <div className="space-y-1.5">
              <label htmlFor="setting-target-roas" className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Target ROAS (Multiplier)
              </label>
              <input
                id="setting-target-roas"
                type="number"
                step="0.1"
                min="0.5"
                value={settings.targetRoas}
                onChange={(e) => handleTargetChange('targetRoas', parseFloat(e.target.value) || 3.0)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-2 text-xs font-mono font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>

            {/* Target CPL */}
            <div className="space-y-1.5">
              <label htmlFor="setting-target-cpl" className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Target CPL ({settings.currencySymbol})
              </label>
              <input
                id="setting-target-cpl"
                type="number"
                step="0.5"
                min="1"
                value={settings.targetCpl}
                onChange={(e) => handleTargetChange('targetCpl', parseFloat(e.target.value) || 35.0)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-2 text-xs font-mono font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Google Ads Benchmarks */}
      <section id="google-benchmarks-section" className="space-y-3">
        <h4 className="font-hanken text-sm font-semibold text-on-surface flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Google Ads Baseline Benchmarks</span>
        </h4>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="benchmark-g-cpc" className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Benchmark CPC
              </label>
              <input
                id="benchmark-g-cpc"
                type="number"
                step="0.05"
                value={settings.googleBenchmarks.avgCpc}
                onChange={(e) => handleBenchmarkChange('google', 'avgCpc', parseFloat(e.target.value) || 1.5)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="benchmark-g-cr" className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Benchmark CR (%)
              </label>
              <input
                id="benchmark-g-cr"
                type="number"
                step="0.1"
                value={settings.googleBenchmarks.avgConversionRate}
                onChange={(e) => handleBenchmarkChange('google', 'avgConversionRate', parseFloat(e.target.value) || 3.5)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="benchmark-g-aov" className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Benchmark AOV
              </label>
              <input
                id="benchmark-g-aov"
                type="number"
                step="1"
                value={settings.googleBenchmarks.avgAov}
                onChange={(e) => handleBenchmarkChange('google', 'avgAov', parseFloat(e.target.value) || 150)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="benchmark-g-margin" className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Benchmark Margin (%)
              </label>
              <input
                id="benchmark-g-margin"
                type="number"
                step="1"
                value={settings.googleBenchmarks.avgMargin}
                onChange={(e) => handleBenchmarkChange('google', 'avgMargin', parseFloat(e.target.value) || 40)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Meta Benchmarks */}
      <section id="meta-benchmarks-section" className="space-y-3">
        <h4 className="font-hanken text-sm font-semibold text-on-surface flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span>Meta Ads Baseline Benchmarks</span>
        </h4>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="benchmark-m-cpc" className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Benchmark CPC
              </label>
              <input
                id="benchmark-m-cpc"
                type="number"
                step="0.05"
                value={settings.metaBenchmarks.avgCpc}
                onChange={(e) => handleBenchmarkChange('meta', 'avgCpc', parseFloat(e.target.value) || 0.95)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="benchmark-m-cr" className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Benchmark CR (%)
              </label>
              <input
                id="benchmark-m-cr"
                type="number"
                step="0.1"
                value={settings.metaBenchmarks.avgConversionRate}
                onChange={(e) => handleBenchmarkChange('meta', 'avgConversionRate', parseFloat(e.target.value) || 2.2)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="benchmark-m-aov" className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Benchmark AOV
              </label>
              <input
                id="benchmark-m-aov"
                type="number"
                step="1"
                value={settings.metaBenchmarks.avgAov}
                onChange={(e) => handleBenchmarkChange('meta', 'avgAov', parseFloat(e.target.value) || 95)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="benchmark-m-margin" className="text-[9px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                Benchmark Margin (%)
              </label>
              <input
                id="benchmark-m-margin"
                type="number"
                step="1"
                value={settings.metaBenchmarks.avgMargin}
                onChange={(e) => handleBenchmarkChange('meta', 'avgMargin', parseFloat(e.target.value) || 50)}
                className="w-full bg-surface-container border border-outline-variant/35 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Reset State Action */}
      <section id="settings-footer-actions" className="pt-2">
        <button
          onClick={onReset}
          className="w-full h-[48px] bg-transparent border border-dashed border-error/40 text-error font-semibold text-xs rounded-xl active:bg-error/5 transition-colors flex items-center justify-center gap-2 cursor-pointer hover:bg-error/5"
        >
          <RotateCcw size={14} />
          <span>Restore Factory Baseline Defaults</span>
        </button>
      </section>
    </div>
  );
}
