/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  DollarSign, 
  Percent, 
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { CampaignVariables, CalculatedResults, AppSettings } from '../types';
import { calculatePPC, formatCurrency } from '../utils';

interface ProjectionsScreenProps {
  variables: CampaignVariables;
  settings: AppSettings;
}

export default function ProjectionsScreen({ variables, settings }: ProjectionsScreenProps) {
  const [scalingPeriod, setScalingPeriod] = useState<number>(6);
  const [modelDiminishingReturns, setModelDiminishingReturns] = useState<boolean>(true);

  // 1. Scenario Calculations
  // Base Case
  const baseResults = calculatePPC(variables);

  // Low Case (Conversion Rate is 30% lower, CPC is 15% higher)
  const lowVars: CampaignVariables = {
    ...variables,
    cpc: variables.cpc * 1.15,
    conversionRate: Math.max(0.1, variables.conversionRate * 0.70),
  };
  const lowResults = calculatePPC(lowVars);

  // High Case (Conversion Rate is 30% higher, CPC is 15% lower)
  const highVars: CampaignVariables = {
    ...variables,
    cpc: Math.max(0.05, variables.cpc * 0.85),
    conversionRate: Math.min(100, variables.conversionRate * 1.30),
  };
  const highResults = calculatePPC(highVars);

  // 2. Multi-Month Scaling Projection Schedule
  // We scale spend by increments and project future months
  const generateScalingProjections = () => {
    const projections = [];
    
    // Monthly spend multipliers
    // Month 1: 1.0x, Month 2: 1.25x, Month 3: 1.5x, Month 4: 1.75x, Month 5: 2.0x, Month 6: 2.5x
    const multipliers = [1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0];
    const monthsCount = Math.min(scalingPeriod, multipliers.length);

    for (let i = 0; i < monthsCount; i++) {
      const monthNum = i + 1;
      const mult = multipliers[i];
      
      const currentSpend = variables.adSpend * mult;
      
      // If modeling diminishing returns:
      // - CPC increases by 5% per doubling of spend
      // - Conversion rate decreases by 4% per doubling of spend
      const scaleFactor = Math.log2(mult);
      const adjustedCpc = modelDiminishingReturns && scaleFactor > 0
        ? variables.cpc * (1 + scaleFactor * 0.08)
        : variables.cpc;
        
      const adjustedCr = modelDiminishingReturns && scaleFactor > 0
        ? Math.max(0.1, variables.conversionRate * (1 - scaleFactor * 0.05))
        : variables.conversionRate;

      const monthVars: CampaignVariables = {
        adSpend: currentSpend,
        cpc: adjustedCpc,
        conversionRate: adjustedCr,
        avgOrderValue: variables.avgOrderValue,
        profitMargin: variables.profitMargin,
      };

      const monthResults = calculatePPC(monthVars);
      
      projections.push({
        month: `Month ${monthNum}`,
        multiplier: mult,
        variables: monthVars,
        results: monthResults,
      });
    }

    return projections;
  };

  const monthlyScalingData = generateScalingProjections();

  return (
    <div id="projections-screen-root" className="space-y-6">
      
      {/* Intro Section */}
      <section id="projections-intro" className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] text-center">
        <h3 className="font-hanken text-lg font-semibold text-on-surface mb-1">Scenario & Scale Modeling</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Predict future growth by examining performance boundaries and simulate month-over-month budget scaling with mathematical rigor.
        </p>
      </section>

      {/* Scenario Analysis Tabs/Grid */}
      <section id="scenarios-analysis-panel" className="space-y-3">
        <h3 className="font-hanken text-base font-semibold text-on-surface flex items-center gap-1.5">
          <span>Three-Tier Performance Scenarios</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {/* Low Scenario Card */}
          <div className="bg-surface-container-lowest p-3 rounded-xl border border-error/10 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-error" />
            <span className="text-[10px] font-sans font-bold text-error uppercase block mb-1">Pessimistic</span>
            <div className="text-base font-bold text-on-surface">
              {formatCurrency(lowResults.netProfit, settings.currencySymbol)}
            </div>
            <span className="text-[10px] text-on-surface-variant block mt-1">Profit</span>
            <div className="text-[11px] font-mono font-medium text-error-container bg-error/5 py-0.5 rounded mt-2">
              ROAS: {lowResults.netRoas.toFixed(1)}x
            </div>
          </div>

          {/* Base Scenario Card */}
          <div className="bg-surface-container-lowest p-3 rounded-xl border border-primary/20 shadow-sm text-center relative overflow-hidden ring-1 ring-primary/20">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary-container" />
            <span className="text-[10px] font-sans font-bold text-primary uppercase block mb-1">Current Base</span>
            <div className="text-base font-bold text-on-surface">
              {formatCurrency(baseResults.netProfit, settings.currencySymbol)}
            </div>
            <span className="text-[10px] text-on-surface-variant block mt-1">Profit</span>
            <div className="text-[11px] font-mono font-medium text-primary-container bg-primary/5 py-0.5 rounded mt-2">
              ROAS: {baseResults.netRoas.toFixed(1)}x
            </div>
          </div>

          {/* High Scenario Card */}
          <div className="bg-surface-container-lowest p-3 rounded-xl border border-secondary/10 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-secondary" />
            <span className="text-[10px] font-sans font-bold text-secondary uppercase block mb-1">Optimistic</span>
            <div className="text-base font-bold text-on-surface">
              {formatCurrency(highResults.netProfit, settings.currencySymbol)}
            </div>
            <span className="text-[10px] text-on-surface-variant block mt-1">Profit</span>
            <div className="text-[11px] font-mono font-medium text-secondary-container bg-secondary/5 py-0.5 rounded mt-2">
              ROAS: {highResults.netRoas.toFixed(1)}x
            </div>
          </div>
        </div>

        {/* Informative Subtext for Scenarios */}
        <div className="bg-surface-container p-3 rounded-xl text-[11px] text-on-surface-variant space-y-1">
          <p><strong>Pessimistic scenario</strong> assumes a 15% CPC increase and 30% lower conversion efficiency.</p>
          <p><strong>Optimistic scenario</strong> assumes a 15% lower CPC cost coupled with 30% higher conversion rate.</p>
        </div>
      </section>

      {/* Scaling Curve Configuration */}
      <section id="scaling-schedule-panel" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-hanken text-base font-semibold text-on-surface">Budget Scale Schedule</h3>
          
          {/* Diminishing Returns Switcher */}
          <button
            onClick={() => setModelDiminishingReturns(!modelDiminishingReturns)}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-90"
          >
            <span>Diminishing Returns:</span>
            {modelDiminishingReturns ? (
              <ToggleRight size={24} className="text-primary-container fill-primary-container" />
            ) : (
              <ToggleLeft size={24} className="text-outline" />
            )}
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3 bg-surface-container p-2 rounded-xl text-xs justify-between">
          <span className="font-medium text-on-surface-variant pl-2">Scaling Steps:</span>
          <div className="flex gap-1">
            {[4, 6, 8].map((period) => (
              <button
                key={period}
                onClick={() => setScalingPeriod(period)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  scalingPeriod === period
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {period} Months
              </button>
            ))}
          </div>
        </div>

        {/* Table Schedule View */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/15 text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-2 text-right">Ad Spend</th>
                  <th className="py-3 px-2 text-right">Convs.</th>
                  <th className="py-3 px-2 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-right">Net ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {monthlyScalingData.map((row) => {
                  const isBenchmarkMonth = row.multiplier === 1.0;
                  return (
                    <tr
                      key={row.month}
                      className={`hover:bg-surface-container-low/40 transition-colors ${
                        isBenchmarkMonth ? 'bg-primary-container/5 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-on-surface font-medium flex items-center gap-1.5">
                        {row.month}
                        {isBenchmarkMonth && (
                          <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">
                            Base
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-on-surface">
                        {formatCurrency(row.variables.adSpend, settings.currencySymbol).split('.')[0]}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-on-surface-variant">
                        {Math.round(row.results.conversions)}
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-semibold ${
                        row.results.netProfit >= 0 ? 'text-secondary' : 'text-error'
                      }`}>
                        {formatCurrency(row.results.netProfit, settings.currencySymbol).split('.')[0]}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-on-surface">
                        {row.results.netRoas.toFixed(1)}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Diminishing Returns Warning Indicator */}
          {modelDiminishingReturns && (
            <div className="p-3.5 bg-yellow-500/5 border-t border-yellow-500/10 text-[10px] text-yellow-700 dark:text-yellow-500 flex items-start gap-1.5">
              <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                <strong>Diminishing Returns Mode is Active:</strong> As your ad budget scales upward, CPC escalates slightly and conversion rates experience standard saturation fatigue, giving you a more conservative and accurate roadmap for client pitches.
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
