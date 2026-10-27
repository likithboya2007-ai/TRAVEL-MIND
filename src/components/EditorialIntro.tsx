import React, { useState } from 'react';
import { DESTINATIONS } from '../data/destinations';
import { ArrowRight, Compass, MapPin, Sparkles } from 'lucide-react';

interface EditorialIntroProps {
  onExploreDestinations: () => void;
  onPlanTrip: (destId: string) => void;
}

export const EditorialIntro: React.FC<EditorialIntroProps> = ({
  onExploreDestinations,
  onPlanTrip,
}) => {
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  const featuredDestinations = [
    DESTINATIONS.find((d) => d.id === 'hampi') || DESTINATIONS[1],
    DESTINATIONS.find((d) => d.id === 'ladakh') || DESTINATIONS[4],
    DESTINATIONS.find((d) => d.id === 'kerala') || DESTINATIONS[3],
    DESTINATIONS.find((d) => d.id === 'meghalaya') || DESTINATIONS[5],
  ];

  const current = featuredDestinations[activeStoryIdx];

  return (
    <section
      id="scenic-transition"
      className="relative py-28 px-6 bg-gradient-to-b from-[#050811] via-[#080e1e] to-[#050811] text-slate-100 border-b border-slate-800/80 overflow-hidden"
      aria-label="Scene 2: Ground-Level Wonder"
    >
      <div className="max-w-7xl mx-auto">
        {/* Storytelling Scene Kicker */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono uppercase tracking-widest mb-4">
              <span>Scene 02</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Spatial Transition</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
              From cosmic orbit to ground-level wonder.
            </h2>
          </div>
          <div className="max-w-md text-slate-300 text-sm sm:text-base leading-relaxed">
            <p className="mb-4">
              As your journey descends from planetary coordinates, geography turns into sensory presence.
              Sunlight hits weathered stone, mist gathers across emerald valleys, and sacred evening bells ring across water.
            </p>
            {/* Interactive Destination Preview Switcher */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {featuredDestinations.map((dest, idx) => (
                <button
                  key={dest.id}
                  onClick={() => setActiveStoryIdx(idx)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                    activeStoryIdx === idx
                      ? 'bg-teal-400 text-slate-950 font-semibold shadow-md shadow-teal-400/20'
                      : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                  }`}
                  aria-pressed={activeStoryIdx === idx}
                >
                  {dest.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Breathtaking Cinematic Destination Photograph Composition */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-2xl group">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
            <img
              src={current.image}
              alt={`${current.name}, ${current.state}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-1000 ease-out"
              loading="lazy"
            />
            {/* Atmospheric gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050811]/70 via-transparent to-transparent hidden md:block" />
          </div>

          {/* Editorial Content Overlay */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-teal-300 mb-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  {current.name}, {current.state}
                </span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span>{current.lat.toFixed(3)}°N, {current.lng.toFixed(3)}°E</span>
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-bold text-white mb-3">
                {current.tagline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 italic font-serif max-w-xl leading-relaxed mb-4">
                "{current.editorialQuote}"
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {current.highlights.slice(0, 3).map((h) => (
                  <span
                    key={h}
                    className="px-2.5 py-1 rounded-md bg-[#050811]/80 backdrop-blur-sm border border-slate-700/70 text-slate-300 text-[11px]"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onPlanTrip(current.id)}
                className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 rounded-xl hover:from-teal-300 hover:to-cyan-300 hover:shadow-lg hover:shadow-teal-500/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Plan {current.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
