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
  LogIn,
  LogOut,
  Database,
  CloudLightning,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { 
  syncUserProfile, 
  fetchCampaignsFromFirestore, 
  saveCampaignToFirestore, 
  deleteCampaignFromFirestore 
} from './lib/firestore-service.ts';
import { CampaignVariables, AppSettings, PlatformType, ActiveTab, SavedCampaign } from './types';
import { DEFAULT_SETTINGS } from './utils';
import DashboardScreen from './components/DashboardScreen';
import ProjectionsScreen from './components/ProjectionsScreen';
import ReportsScreen from './components/ReportsScreen';
import SettingsScreen from './components/SettingsScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [platform, setPlatform] = useState<PlatformType>('google');
  
  // Auth & Cloud SQL States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [storageType, setStorageType] = useState<'cloudsql' | 'firestore'>('firestore');

  // App Settings State
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
    return {
      adSpend: 2500,
      cpc: DEFAULT_SETTINGS.googleBenchmarks.avgCpc,
      conversionRate: DEFAULT_SETTINGS.googleBenchmarks.avgConversionRate,
      avgOrderValue: DEFAULT_SETTINGS.googleBenchmarks.avgAov,
      profitMargin: DEFAULT_SETTINGS.googleBenchmarks.avgMargin,
    };
  });

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('ppc_calc_settings', JSON.stringify(settings));
  }, [settings]);

  // Handle platform change
  const handlePlatformChange = (newPlatform: PlatformType) => {
    setPlatform(newPlatform);
    const key = `ppc_calc_variables_${newPlatform}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        setVariables(JSON.parse(saved));
        return;
      } catch (e) {}
    }

    const bench = newPlatform === 'google' ? settings.googleBenchmarks : settings.metaBenchmarks;
    setVariables({
      adSpend: variables.adSpend,
      cpc: bench.avgCpc,
      conversionRate: bench.avgConversionRate,
      avgOrderValue: bench.avgAov,
      profitMargin: bench.avgMargin,
    });
  };

  // Sync variables to localStorage
  useEffect(() => {
    const key = `ppc_calc_variables_${platform}`;
    localStorage.setItem(key, JSON.stringify(variables));
  }, [variables, platform]);

  // Auth State Listener & Sync to Cloud SQL & Firestore Backends
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);
          
          // Call backend user sync API for PostgreSQL (non-blocking)
          fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }).catch(e => console.warn("Cloud SQL user sync warning:", e));

          // Sync User Profile to Firestore (non-blocking)
          syncUserProfile(firebaseUser.uid, firebaseUser.email || '').catch(e => 
            console.error("Firestore user sync error:", e)
          );

          // Fetch user's saved campaigns
          fetchSavedCampaigns(token, firebaseUser.uid);
        } catch (err: any) {
          console.error("Auth sync failed:", err);
          showToast(err.message || 'Failed to synchronize with server.');
        }
      } else {
        setUser(null);
        setAuthToken(null);
        setSavedCampaigns([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch campaigns from active storage engine
  const fetchSavedCampaigns = async (token: string | null, userId?: string) => {
    setDbLoading(true);
    try {
      const activeUserId = userId || user?.uid;
      if (storageType === 'firestore') {
        if (activeUserId) {
          const data = await fetchCampaignsFromFirestore(activeUserId);
          setSavedCampaigns(data);
        } else {
          setSavedCampaigns([]);
        }
      } else if (token) {
        const response = await fetch('/api/campaigns', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to retrieve saved campaign records.');
        }
        const data = await response.json();
        setSavedCampaigns(data);
      } else {
        setSavedCampaigns([]);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to connect to database.');
    } finally {
      setDbLoading(false);
    }
  };

  // Re-fetch saved campaigns when storage choice or user status changes
  useEffect(() => {
    if (user) {
      fetchSavedCampaigns(authToken, user.uid);
    } else {
      setSavedCampaigns([]);
    }
  }, [storageType, user, authToken]);

  // Save active campaign to active database
  const handleSaveCampaign = async (name: string) => {
    if (!user) {
      showToast("Please sign in to save your campaign scenarios to the cloud.");
      return;
    }
    setDbLoading(true);
    try {
      if (storageType === 'firestore') {
        await saveCampaignToFirestore(user.uid, {
          name,
          platform,
          adSpend: variables.adSpend,
          cpc: variables.cpc,
          conversionRate: variables.conversionRate,
          avgOrderValue: variables.avgOrderValue,
          profitMargin: variables.profitMargin
        });
        await fetchSavedCampaigns(authToken, user.uid);
        showToast(`Scenario "${name}" saved to Firestore successfully!`);
      } else {
        if (!authToken) {
          throw new Error('No authentication token found for Cloud SQL.');
        }
        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name,
            platform,
            adSpend: variables.adSpend,
            cpc: variables.cpc,
            conversionRate: variables.conversionRate,
            avgOrderValue: variables.avgOrderValue,
            profitMargin: variables.profitMargin
          })
        });

        if (!response.ok) {
          throw new Error('Failed to store campaign scenario in Cloud SQL.');
        }

        await fetchSavedCampaigns(authToken, user.uid);
        showToast(`Scenario "${name}" saved to Cloud SQL successfully!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving campaign.');
    } finally {
      setDbLoading(false);
    }
  };

  // Load saved campaign into local state
  const handleLoadCampaign = (campaign: SavedCampaign) => {
    setPlatform(campaign.platform);
    setVariables({
      adSpend: campaign.adSpend,
      cpc: campaign.cpc,
      conversionRate: campaign.conversionRate,
      avgOrderValue: campaign.avgOrderValue,
      profitMargin: campaign.profitMargin,
    });
    showToast(`Loaded "${campaign.name}" scenario!`);
  };

  // Delete saved campaign from active database
  const handleDeleteCampaign = async (id: number | string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to permanently delete this scenario?")) return;
    
    setDbLoading(true);
    try {
      if (storageType === 'firestore') {
        await deleteCampaignFromFirestore(String(id));
        await fetchSavedCampaigns(authToken, user.uid);
        showToast("Scenario permanently deleted from Firestore.");
      } else {
        if (!authToken) return;
        const response = await fetch(`/api/campaigns/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete campaign from database.');
        }

        await fetchSavedCampaigns(authToken, user.uid);
        showToast("Scenario permanently deleted from Cloud SQL.");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error deleting campaign.');
    } finally {
      setDbLoading(false);
    }
  };


  // Authentication controllers
  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      showToast("Sign-in cancelled or pop-up blocked. Open in a new tab if issues persist.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    setShowProfileMenu(false);
    try {
      await signOut(auth);
      showToast("Successfully signed out of cloud session.");
    } catch (err: any) {
      console.error("Sign-out failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Toast utility
  const showToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => {
      setErrorToast(null);
    }, 4000);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to restore default benchmarks and settings?')) {
      setSettings(DEFAULT_SETTINGS);
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

  return (
    <div className="bg-slate-100 min-h-screen flex items-center justify-center p-0 sm:p-4 font-sans antialiased">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {errorToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-800"
          >
            <Sparkles size={14} className="text-primary-container" />
            <span>{errorToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div>
              <h1 className="font-hanken text-lg font-bold text-on-surface tracking-tight leading-tight">
                PPC Calculator
              </h1>
              {user && (
                <div className="flex items-center gap-1 text-[9px] text-secondary font-semibold font-mono">
                  <Database size={8} />
                  <span>Cloud Active</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            {user ? (
              <button 
                className="w-9 h-9 flex items-center justify-center rounded-full overflow-hidden border border-primary/20 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-primary" />
                )}
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/15 transition-all rounded-full text-xs font-bold cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <LogIn size={13} />
                )}
                <span>Sign In</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && user && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-xl p-3 z-50 space-y-2"
                >
                  <div className="text-center pb-2 border-b border-outline-variant/10">
                    <div className="text-xs font-bold text-on-surface truncate">{user.displayName || 'PPC Professional'}</div>
                    <div className="text-[10px] text-on-surface-variant truncate font-mono">{user.email}</div>
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-mono space-y-1">
                    <div className="flex justify-between">
                      <span>Server:</span>
                      <span className="text-secondary font-bold flex items-center gap-0.5"><CloudLightning size={10} /> Asia-SE1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scenarios:</span>
                      <span className="font-bold text-on-surface">{savedCampaigns.length} Saved</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full py-1.5 bg-error/10 hover:bg-error/15 text-error text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <LogOut size={12} />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              {activeTab === 'dashboard' && (
                <DashboardScreen
                  platform={platform}
                  setPlatform={handlePlatformChange}
                  variables={variables}
                  setVariables={setVariables}
                  settings={settings}
                  onNavigate={setActiveTab}
                  onExport={() => setActiveTab('reports')}
                  user={user}
                  savedCampaigns={savedCampaigns}
                  onSaveCampaign={handleSaveCampaign}
                  onLoadCampaign={handleLoadCampaign}
                  onDeleteCampaign={handleDeleteCampaign}
                  dbLoading={dbLoading}
                  onSignIn={handleSignIn}
                  storageType={storageType}
                  setStorageType={setStorageType}
                />
              )}
              {activeTab === 'projections' && (
                <ProjectionsScreen
                  variables={variables}
                  settings={settings}
                />
              )}
              {activeTab === 'reports' && (
                <ReportsScreen
                  variables={variables}
                  settings={settings}
                  platform={platform}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsScreen
                  settings={settings}
                  setSettings={setSettings}
                  onReset={handleResetSettings}
                />
              )}
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
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all cursor-pointer ${
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
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all cursor-pointer ${
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
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all cursor-pointer ${
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
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all cursor-pointer ${
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
