/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  User, 
  LayoutDashboard, 
  TrendingUp, 
  FileText, 
  Settings,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CampaignVariables, AppSettings, PlatformType, ActiveTab } from './types';
import { DEFAULT_SETTINGS, calculatePPC } from './utils';
import DashboardScreen from './components/DashboardScreen';
import ProjectionsScreen from './components/ProjectionsScreen';
import ReportsScreen from './components/ReportsScreen';
import SettingsScreen from './components/SettingsScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [platform, setPlatform] = useState<PlatformType>('google');
  
  // App Settings State (with standard fallback)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ppc_calc_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Campaign Inputs state
  const [variables, setVariables] = useState<CampaignVariables>(() => {
    const saved = localStorage.getItem('ppc_calc_variables_google');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    // Default matching Google Ads benchmark
    return {
      adSpend: 2500,
      cpc: DEFAULT_SETTINGS.googleBenchmarks.avgCpc,
      conversionRate: DEFAULT_SETTINGS.googleBenchmarks.avgConversionRate,
      avgOrderValue: DEFAULT_SETTINGS.googleBenchmarks.avgAov,
      profitMargin: DEFAULT_SETTINGS.googleBenchmarks.avgMargin,
    };
  });

  // Keep LocalStorage synchronized
  useEffect(() => {
    localStorage.setItem('ppc_calc_settings', JSON.stringify(settings));
  }, [settings]);

  // Handle platform change - update values to fit platform standard baseline
  const handlePlatformChange = (newPlatform: PlatformType) => {
    setPlatform(newPlatform);
    
    // Attempt to load from storage for this platform, or load defaults
    const key = `ppc_calc_variables_${newPlatform}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        setVariables(JSON.parse(saved));
        return;
      } catch (e) {}
    }

    // Load defaults if no saved copy
    const bench = newPlatform === 'google' ? settings.googleBenchmarks : settings.metaBenchmarks;
    setVariables({
      adSpend: variables.adSpend, // keep current budget to let user compare immediately
      cpc: bench.avgCpc,
      conversionRate: bench.avgConversionRate,
      avgOrderValue: bench.avgAov,
      profitMargin: bench.avgMargin,
    });
  };

  // Keep variables synchronized per-platform
  useEffect(() => {
    const key = `ppc_calc_variables_${platform}`;
    localStorage.setItem(key, JSON.stringify(variables));
  }, [variables, platform]);

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to restore default benchmarks and settings?')) {
      setSettings(DEFAULT_SETTINGS);
      
      // Load google defaults back in
      const bench = DEFAULT_SETTINGS.googleBenchmarks;
      setVariables({
        adSpend: 2500,
        cpc: bench.avgCpc,
        conversionRate: bench.avgConversionRate,
        avgOrderValue: bench.avgAov,
        profitMargin: bench.avgMargin,
      });
      setPlatform('google');
      setActiveTab('dashboard');
    }
  };

  const handleExportTrigger = () => {
    setActiveTab('reports');
  };

  // Component router
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            platform={platform}
            setPlatform={handlePlatformChange}
            variables={variables}
            setVariables={setVariables}
            settings={settings}
            onNavigate={setActiveTab}
            onExport={handleExportTrigger}
          />
        );
      case 'projections':
        return (
          <ProjectionsScreen
            variables={variables}
            settings={settings}
          />
        );
      case 'reports':
        return (
          <ReportsScreen
            variables={variables}
            settings={settings}
            platform={platform}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            setSettings={setSettings}
            onReset={handleResetSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen flex items-center justify-center p-0 sm:p-4 font-sans antialiased">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-background min-h-screen sm:min-h-[850px] sm:max-h-[900px] sm:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border-0 sm:border-[8px] border-slate-900">
        
        {/* Dynamic Mobile Status Bar Notch Placeholder */}
        <div className="hidden sm:block absolute top-0 inset-x-0 h-6 bg-slate-900 z-50">
          <div className="w-40 h-4 bg-slate-900 mx-auto rounded-b-2xl flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
          </div>
        </div>

        {/* Header App Bar */}
        <header className="flex items-center justify-between px-5 pt-7 pb-3 w-full bg-background border-b border-outline-variant/10 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <BarChart3 size={20} className="stroke-[2.5]" />
            </div>
            <h1 className="font-hanken text-lg font-bold text-on-surface tracking-tight">
              PPC Calculator
            </h1>
          </div>
          <button 
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors border border-outline-variant/15"
            title="User Profile Info"
            onClick={() => alert(`Precision PPC Dashboard v1.2.0\nActive Currency: ${settings.currency}\nLocal Cache Safe`)}
          >
            <User size={18} className="text-on-surface-variant" />
          </button>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto px-5 pt-4 pb-28 hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Sticky iOS Home Indicator Bar Spacer (mobile frame decor) */}
        <div className="hidden sm:block absolute bottom-1 inset-x-0 h-1.5 w-1/3 bg-slate-800 mx-auto rounded-full z-50" />

        {/* Polished Bottom Tab Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 z-40 flex justify-around items-center px-4 py-2 bg-surface-container-lowest border-t border-outline-variant/10 shadow-[0_-4px_12px_rgba(11,28,48,0.03)] h-20 sm:rounded-b-[32px]">
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-primary bg-primary/10 font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-[10px] font-sans font-semibold mt-1">Dashboard</span>
          </button>

          {/* Tab 2: Projections */}
          <button
            onClick={() => setActiveTab('projections')}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
              activeTab === 'projections'
                ? 'text-primary bg-primary/10 font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <TrendingUp size={18} />
            <span className="text-[10px] font-sans font-semibold mt-1">Projections</span>
          </button>

          {/* Tab 3: Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
              activeTab === 'reports'
                ? 'text-primary bg-primary/10 font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <FileText size={18} />
            <span className="text-[10px] font-sans font-semibold mt-1">Reports</span>
          </button>

          {/* Tab 4: Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-primary bg-primary/10 font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Settings size={18} />
            <span className="text-[10px] font-sans font-semibold mt-1">Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
