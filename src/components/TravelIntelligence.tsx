import React, { useState } from 'react';
import {
  Brain,
  Sliders,
  DollarSign,
  Clock,
  Shuffle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const TravelIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routing' | 'budget' | 'pacing' | 'alternatives'>('routing');

  return (
    <section id="how-it-works" className="relative py-28 px-6 bg-[#050811] text-slate-100 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono uppercase tracking-widest mb-3">
            <Brain className="w-3.5 h-3.5 text-teal-400" />
            <span>AI Architecture &amp; Travel Logic</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Travel smarter, not harder.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            How the TravelMind engine balances geographic geometry, diurnal sunlight angles, crowd distributions, and budget boundaries into fluid itineraries.
          </p>
        </div>

        {/* Feature Demonstration Tabs */}
        <div className="flex justify-center mb-12 overflow-x-auto pb-2">
          <div className="inline-flex p-1.5 bg-[#090f20] rounded-2xl border border-slate-800 gap-1.5 shadow-xl">
            <button
              onClick={() => setActiveTab('routing')}
              className={`px-4 py-2.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'routing'
                  ? 'bg-teal-400 text-slate-950 font-semibold shadow-md shadow-teal-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Geometric Route Clustering
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-4 py-2.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'budget'
                  ? 'bg-teal-400 text-slate-950 font-semibold shadow-md shadow-teal-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Dynamic Budget Allocation
            </button>
            <button
              onClick={() => setActiveTab('pacing')}
              className={`px-4 py-2.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pacing'
                  ? 'bg-teal-400 text-slate-950 font-semibold shadow-md shadow-teal-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Diurnal Pacing &amp; Sun Angles
            </button>
            <button
              onClick={() => setActiveTab('alternatives')}
              className={`px-4 py-2.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'alternatives'
                  ? 'bg-teal-400 text-slate-950 font-semibold shadow-md shadow-teal-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Intelligent Alternatives
            </button>
          </div>
        </div>

        {/* Active Tab Storytelling Card */}
        <div className="bg-[#090f20]/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          {activeTab === 'routing' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400">
                  Topological Clustering
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Zero Backtracking. Less Transit Fatigue.
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Instead of pinballing across town, TravelMind clusters points of interest by geodesic quadrant. Morning hill climbs transition smoothly to neighboring lakeside lunches and cliffside sunsets with minimal travel overhead.
                </p>
                <div className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>Average 38% transit time reduction vs random sequencing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>Respects local travel mode (car, motorcycle, public transit)</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 p-6 rounded-2xl bg-[#050811] border border-slate-800/90 font-mono text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-teal-400">
                  <span>TRANSIT OPTIMIZATION ENGINE</span>
                  <span>STATUS: ACTIVE</span>
                </div>
                <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-800/30 text-teal-300">
                  ✓ Geodesic distance vector: Ordered by proximity to avoid cross-city crisscrossing
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  ✓ Time-of-day dwell times: Calibrated to travel party size and chosen energy curve
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                  Envelope Allocation
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Predictable Budgets, No Hidden Surprises.
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  We divide your total INR budget into verified categories: base lodging tier, local transit allowance, entry permits, culinary discoveries, and an automatic 8% emergency contingency buffer.
                </p>
                <div className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Group dynamic multiplier accounts for shared accommodation savings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Real-time budget status alerts: Comfortable, Balanced, or Tight</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 p-6 rounded-2xl bg-[#050811] border border-slate-800/90 font-mono text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-cyan-400">
                  <span>BUDGET ENVELOPE CALIBRATION</span>
                  <span>CURRENCY: INR</span>
                </div>
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/30 text-cyan-300">
                  ✓ Accommodation: 45% · Transit: 18% · Dining: 22% · Buffer: 8%
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  ✓ Automatic adjustment for Food mood (+35% dining allocation)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pacing' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400">
                  Diurnal Sunlight Arc
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Golden Hours for Views. Midday for Shade.
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Attractions aren't placed randomly throughout the day. High-altitude view points and monument walks are automatically scheduled for early morning or sunset golden hours, while midday heat slots are reserved for shaded palaces, cafes, or relaxed transit.
                </p>
                <div className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>Morning slots: 09:00 AM high-contrast photography</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>Sunset slots: 05:30 PM amber horizon vistas</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 p-6 rounded-2xl bg-[#050811] border border-slate-800/90 font-mono text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-teal-400">
                  <span>DIURNAL LIGHTING CALENDAR</span>
                  <span>PHOTOMETRIC LOGIC</span>
                </div>
                <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-800/30 text-teal-300">
                  ✓ Photographers receive golden hour viewpoints automatically in prime slots
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  ✓ Relaxed energy levels cap active site duration to maximum 1.5–2 hours per day
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alternatives' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-300">
                  Adaptive Flexibility
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Add Your Own Discoveries Anytime.
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  TravelMind acts as a collaborative partner, not a rigid tour guide. Easily add your own custom cafes, hidden viewpoints, or unplanned detours to any day, with instant budget recalculation.
                </p>
                <div className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>Add, delete, and rearrange stops directly on the fly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>Synchronized Leaflet map highlights custom stops instantly</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 p-6 rounded-2xl bg-[#050811] border border-slate-800/90 font-mono text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-teal-300">
                  <span>INTERACTIVE STOP MANAGER</span>
                  <span>SYNC: REAL-TIME</span>
                </div>
                <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-800/30 text-teal-300">
                  ✓ Custom additions update map route coordinates and daily budget estimates
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  ✓ One-click export to clipboard or browser storage for offline reference
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
