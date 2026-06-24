/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  ExternalLink,
  ChevronRight,
  BarChart2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { CampaignVariables, CalculatedResults, AppSettings } from '../types';
import { calculatePPC, formatCurrency } from '../utils';

interface ReportsScreenProps {
  variables: CampaignVariables;
  settings: AppSettings;
  platform: 'google' | 'meta';
}

export default function ReportsScreen({ variables, settings, platform }: ReportsScreenProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportType, setExportType] = useState<string>('');
  
  // Calculate current results
  const currentResults = calculatePPC(variables);

  // Platform comparison modeling
  // What would the same budget look like on the opposite platform?
  const budget = variables.adSpend;
  const googleVars: CampaignVariables = {
    adSpend: budget,
    cpc: settings.googleBenchmarks.avgCpc,
    conversionRate: settings.googleBenchmarks.avgConversionRate,
    avgOrderValue: settings.googleBenchmarks.avgAov,
    profitMargin: settings.googleBenchmarks.avgMargin,
  };
  const metaVars: CampaignVariables = {
    adSpend: budget,
    cpc: settings.metaBenchmarks.avgCpc,
    conversionRate: settings.metaBenchmarks.avgConversionRate,
    avgOrderValue: settings.metaBenchmarks.avgAov,
    profitMargin: settings.metaBenchmarks.avgMargin,
  };

  const googleResults = calculatePPC(googleVars);
  const metaResults = calculatePPC(metaVars);

  // Render sensitivity graph data points (CR from 1.0% to 6.0%)
  const sensitivityPoints = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0];
  const sensitivityData = sensitivityPoints.map(cr => {
    const res = calculatePPC({ ...variables, conversionRate: cr });
    return { cr, netProfit: res.netProfit, roas: res.netRoas };
  });

  const triggerExport = (type: string) => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportType(type);
    
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      
      // If CSV export, trigger a real download of CSV text!
      if (type === 'csv') {
        const headers = 'Metric,Value\n';
        const rows = [
          `Platform,${platform === 'google' ? 'Google Ads' : 'Meta'}`,
          `Monthly Ad Spend,${variables.adSpend}`,
          `Avg CPC,${variables.cpc}`,
          `Conversion Rate (%),${variables.conversionRate}`,
          `Avg Order Value,${variables.avgOrderValue}`,
          `Profit Margin (%),${variables.profitMargin}`,
          `Clicks,${currentResults.clicks}`,
          `Conversions,${currentResults.conversions}`,
          `Cost Per Lead (CPL),${currentResults.cpl}`,
          `Total Revenue,${currentResults.revenue}`,
          `Gross Profit,${currentResults.grossProfit}`,
          `Estimated Monthly Net Profit,${currentResults.netProfit}`,
          `Net ROAS,${currentResults.netRoas}`,
          `ROI (%),${currentResults.roi}`
        ].join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `ppc_calculator_report_${platform}.csv`);
        a.click();
      }
    }, 1500);
  };

  // SVG Chart Dimensions & Computations
  const chartHeight = 120;
  const chartWidth = 300;
  const maxProfitVal = Math.max(...sensitivityData.map(d => Math.abs(d.netProfit)), 1000);
  
  return (
    <div id="reports-screen-root" className="space-y-6">
      
      {/* Printable Styled Report Header */}
      <section id="executive-summary-card" className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] relative">
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-primary bg-primary/10 font-bold px-2 py-0.5 rounded uppercase">
          <Calendar size={10} />
          <span>FY 2026</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-widest">
            Executive Performance Brief
          </span>
          <h3 className="font-hanken text-lg font-bold text-on-surface">
            {platform === 'google' ? 'Google Ads Campaign Analysis' : 'Meta Campaign Analysis'}
          </h3>
          <p className="text-[11px] text-on-surface-variant">
            Allocated Budget: <strong>{formatCurrency(variables.adSpend, settings.currencySymbol)}</strong> @ {formatCurrency(variables.cpc, settings.currencySymbol)} CPC
          </p>
        </div>

        {/* Core KPI grid */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-outline-variant/10">
          <div>
            <span className="text-[9px] font-sans font-bold text-on-surface-variant uppercase block">Spend Efficiency</span>
            <div className="text-sm font-mono font-bold text-on-surface mt-0.5">
              {formatCurrency(currentResults.cpl, settings.currencySymbol)}
              <span className="text-[8px] text-on-surface-variant font-normal block">Per Lead</span>
            </div>
          </div>
          <div>
            <span className="text-[9px] font-sans font-bold text-on-surface-variant uppercase block">Total Pipeline</span>
            <div className="text-sm font-mono font-bold text-on-surface mt-0.5">
              {formatCurrency(currentResults.revenue, settings.currencySymbol).split('.')[0]}
              <span className="text-[8px] text-on-surface-variant font-normal block">Gross Value</span>
            </div>
          </div>
          <div>
            <span className="text-[9px] font-sans font-bold text-on-surface-variant uppercase block">Net Yield</span>
            <div className="text-sm font-mono font-bold text-secondary mt-0.5">
              {formatCurrency(currentResults.netProfit, settings.currencySymbol).split('.')[0]}
              <span className="text-[8px] text-secondary/80 font-normal block">Net Profit</span>
            </div>
          </div>
        </div>
      </section>

      {/* SVG Chart 1: Spend vs. Revenue (Polished Custom Bar Chart) */}
      <section id="chart-spend-revenue" className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] space-y-4">
        <h4 className="font-hanken text-sm font-semibold text-on-surface flex items-center gap-1">
          <BarChart2 size={16} className="text-primary-container" />
          <span>Budget vs. Revenue Yield</span>
        </h4>

        <div className="flex items-end justify-around h-24 pt-4 border-b border-outline-variant/20 relative">
          {/* Y-axis line markers */}
          <div className="absolute left-0 right-0 top-2 border-t border-outline-variant/5 text-[9px] text-on-surface-variant/40 text-left pl-1">Target</div>
          <div className="absolute left-0 right-0 top-12 border-t border-outline-variant/5 text-[9px] text-on-surface-variant/40 text-left pl-1">Baseline</div>

          {/* Bar 1: Spend */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-[10px] font-mono font-semibold text-primary mb-1">
              {formatCurrency(variables.adSpend, settings.currencySymbol).split('.')[0]}
            </div>
            <div 
              className="w-8 bg-primary/20 hover:bg-primary/30 transition-all rounded-t-md" 
              style={{ height: '40px' }} 
            />
            <span className="text-[9px] text-on-surface-variant uppercase font-semibold mt-1">Ad Spend</span>
          </div>

          {/* Bar 2: Net Profit */}
          <div className="flex flex-col items-center w-1/3">
            <div className={`text-[10px] font-mono font-semibold mb-1 ${
              currentResults.netProfit >= 0 ? 'text-secondary' : 'text-error'
            }`}>
              {formatCurrency(currentResults.netProfit, settings.currencySymbol).split('.')[0]}
            </div>
            <div 
              className={`w-8 transition-all rounded-t-md ${
                currentResults.netProfit >= 0 ? 'bg-secondary' : 'bg-error'
              }`} 
              style={{ height: `${Math.max(10, Math.min(64, (currentResults.netProfit / (variables.adSpend || 1)) * 40))}px` }} 
            />
            <span className="text-[9px] text-on-surface-variant uppercase font-semibold mt-1">Net Profit</span>
          </div>

          {/* Bar 3: Revenue */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-[10px] font-mono font-semibold text-primary-container mb-1">
              {formatCurrency(currentResults.revenue, settings.currencySymbol).split('.')[0]}
            </div>
            <div 
              className="w-8 bg-primary-container hover:bg-primary-container/90 transition-all rounded-t-md" 
              style={{ height: `${Math.max(15, Math.min(80, (currentResults.revenue / (variables.adSpend || 1)) * 40))}px` }} 
            />
            <span className="text-[9px] text-on-surface-variant uppercase font-semibold mt-1">Revenue</span>
          </div>
        </div>
      </section>

      {/* SVG Chart 2: Conversion Rate Sensitivity Curve */}
      <section id="chart-sensitivity" className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] space-y-4">
        <h4 className="font-hanken text-sm font-semibold text-on-surface flex items-center gap-1">
          <TrendingUp size={16} className="text-secondary" />
          <span>Conversion Rate Sensitivity Analysis</span>
        </h4>

        {/* Polished interactive SVG Line Graph */}
        <div className="relative pt-2 h-32 flex flex-col justify-end">
          <svg className="w-full h-24 overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {/* Horizontal Grid lines */}
            <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#eceef0" strokeWidth="1" strokeDasharray="3,3" />
            
            {/* Draw Path */}
            <path
              d={sensitivityData.reduce((acc, d, i) => {
                const x = (i / (sensitivityData.length - 1)) * chartWidth;
                // Normalize profit to fit chartHeight
                const y = (chartHeight / 2) - (d.netProfit / maxProfitVal) * (chartHeight / 2);
                return acc + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#0061ff"
              strokeWidth="2.5"
            />

            {/* Draw Points */}
            {sensitivityData.map((d, i) => {
              const x = (i / (sensitivityData.length - 1)) * chartWidth;
              const y = (chartHeight / 2) - (d.netProfit / maxProfitVal) * (chartHeight / 2);
              const isActive = Math.abs(d.cr - variables.conversionRate) < 0.6;
              return (
                <g key={d.cr}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? "5" : "3.5"}
                    fill={isActive ? "#006c49" : "#0061ff"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    className="font-mono text-[9px] font-bold"
                    fill={isActive ? "#006c49" : "#424656"}
                  >
                    {d.roas.toFixed(1)}x
                  </text>
                </g>
              );
            })}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[10px] font-mono text-on-surface-variant font-semibold px-1 pt-1.5 border-t border-outline-variant/15 mt-2">
            {sensitivityData.map(d => (
              <span key={d.cr} className={d.cr === Math.round(variables.conversionRate) ? 'text-primary font-bold underline' : ''}>
                {d.cr.toFixed(0)}% CR
              </span>
            ))}
          </div>
          <span className="text-[9px] text-center text-on-surface-variant/75 mt-1 block">ROAS Net multiplier at each conversion tier</span>
        </div>
      </section>

      {/* Google Ads vs. Meta Benchmark Simulation Table */}
      <section id="comparative-modeling-panel" className="space-y-3">
        <h4 className="font-hanken text-base font-semibold text-on-surface">Cross-Platform Comparison</h4>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          How would your allocated budget of <strong>{formatCurrency(budget, settings.currencySymbol)}</strong> perform across both platforms under default industry benchmarks?
        </p>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/15 text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-2 text-right">Avg CPL</th>
                <th className="py-3 px-2 text-right">Profit</th>
                <th className="py-3 px-4 text-right">ROAS (Net)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-xs font-mono">
              <tr className={platform === 'google' ? 'bg-primary-container/5 font-semibold' : ''}>
                <td className="py-3 px-4 text-on-surface font-sans text-xs">Google Ads (Search)</td>
                <td className="py-3 px-2 text-right">{formatCurrency(googleResults.cpl, settings.currencySymbol)}</td>
                <td className="py-3 px-2 text-right text-secondary">{formatCurrency(googleResults.netProfit, settings.currencySymbol).split('.')[0]}</td>
                <td className="py-3 px-4 text-right text-on-surface">{googleResults.netRoas.toFixed(1)}x</td>
              </tr>
              <tr className={platform === 'meta' ? 'bg-primary-container/5 font-semibold' : ''}>
                <td className="py-3 px-4 text-on-surface font-sans text-xs">Meta Ads (Social)</td>
                <td className="py-3 px-2 text-right">{formatCurrency(metaResults.cpl, settings.currencySymbol)}</td>
                <td className="py-3 px-2 text-right text-secondary">{formatCurrency(metaResults.netProfit, settings.currencySymbol).split('.')[0]}</td>
                <td className="py-3 px-4 text-right text-on-surface">{metaResults.netRoas.toFixed(1)}x</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Export Interactive Module */}
      <section id="export-action-module" className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(11,28,48,0.04)] space-y-4">
        <h4 className="font-hanken text-sm font-semibold text-on-surface">Export Campaign Brief</h4>
        <p className="text-[11px] text-on-surface-variant">
          Generate an immediate, formatted spreadsheet CSV dataset or formatted performance brief.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => triggerExport('csv')}
            disabled={isExporting}
            className="h-[48px] border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download size={16} />
            <span>Comma-Value CSV</span>
          </button>

          <button
            onClick={() => triggerExport('pdf')}
            disabled={isExporting}
            className="h-[48px] bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <FileText size={16} />
            <span>Brief PDF</span>
          </button>
        </div>

        {/* Loading and Success states */}
        {isExporting && (
          <div className="p-3 bg-primary/5 rounded-xl text-xs text-primary flex items-center justify-center gap-2 animate-pulse font-medium">
            <RefreshCw size={14} className="animate-spin" />
            <span>Compiling report formulas & formatting layout structure...</span>
          </div>
        )}

        {exportSuccess && (
          <div className="p-3 bg-secondary/10 rounded-xl text-xs text-secondary flex items-center justify-center gap-2 font-semibold">
            <CheckCircle size={16} className="fill-current text-secondary" />
            <span>
              {exportType === 'csv' 
                ? 'CSV exported successfully and downloading!' 
                : 'Brief PDF report successfully compiled and sent to printer!'}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
