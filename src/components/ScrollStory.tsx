import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { DESTINATIONS } from '../data/destinations';
import { MoodType } from '../utils/plannerLogic';

interface ScrollStoryProps {
  currentMood: MoodType;
  onSelectMood: (mood: MoodType) => void;
  onGoToPlanner: (destId?: string) => void;
}

export const ScrollStory: React.FC<ScrollStoryProps> = ({
  currentMood,
  onSelectMood,
  onGoToPlanner,
}) => {
  const [activeStoryDest, setActiveStoryDest] = useState<number>(0);
  const storyDest = DESTINATIONS[activeStoryDest];

  const moods: Array<{ id: MoodType; title: string; desc: string }> = [
    { id: 'Adventure', title: 'The Thrillseeker', desc: 'High passes, rapids, and edge-of-world trails.' },
    { id: 'Photography', title: 'The Visual Poet', desc: 'Golden hour angles, mist inversions, and timeless stone.' },
    { id: 'Culture', title: 'The Time Traveler', desc: 'Ancient dynasties, sacred rituals, and royal palaces.' },
    { id: 'Food', title: 'The Epicurean', desc: 'Centuries-old recipes, spice orchards, and street delicacies.' },
    { id: 'Peaceful', title: 'The Meditator', desc: 'Unbroken silence, lakeside dawns, and cloud sanctuaries.' },
    { id: 'Romantic', title: 'The Dreamer', desc: 'Sunset lagoons, starlit forts, and candlelit waters.' },
  ];

  return (
    <div id="storytelling" className="relative bg-neutral-950 text-neutral-100 divide-y divide-neutral-900">
      {/* --- SCENE A & B: DISCOVER THE WORLD & FLY INTO DESTINATION --- */}
      <section className="relative min-h-[85vh] flex items-center justify-center py-20 px-6 overflow-hidden">
        {/* Cinematic backdrop photo with zoom blur parallax */}
        <div className="absolute inset-0 z-0">
          <img
            src={storyDest.image}
            alt={storyDest.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25 filter blur-xs scale-105 transition-all duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/80 to-neutral-950" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400 mb-4">
            <span>Chapter 01</span>
            <span aria-hidden="true" className="text-neutral-700">
              ·
            </span>
            <span>Spatial Immersion</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 max-w-3xl text-balance">
            From cosmic orbit to ground-level wonder.
          </h2>

          <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mb-10 leading-relaxed">
            As you zoom closer, planetary coordinates transform into sensory reality. Listen to the temple chimes of Hampi, taste the ocean brine of Goa, and breathe the high-altitude crispness of Ladakh.
          </p>

          {/* Interactive destination switcher bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-neutral-900/80 backdrop-blur-md rounded-xl border border-neutral-800">
            {DESTINATIONS.map((d, idx) => (
              <button
                key={d.id}
                onClick={() => setActiveStoryDest(idx)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                  activeStoryDest === idx
                    ? 'bg-amber-400 text-neutral-950 font-semibold shadow-md shadow-amber-400/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- SCENE C: EXPLORE THE DESTINATION (Editorial Layering) --- */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-neutral-950 via-[#0d101a] to-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual hero card */}
            <div className="lg:col-span-7 relative group">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
                <img
                  src={storyDest.image}
                  alt={`${storyDest.name} scenery`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-black/30" />

                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{storyDest.name}, {storyDest.state}</span>
                    <span aria-hidden="true" className="text-neutral-500">·</span>
                    <span>Best Season: {storyDest.bestMonths}</span>
                  </div>
                  <p className="text-sm italic text-neutral-200 font-serif">
                    "{storyDest.editorialQuote}"
                  </p>
                </div>
              </div>

              {/* Floating overlay chip */}
              <div className="absolute -top-4 -right-4 hidden sm:flex items-center gap-2 bg-neutral-900/95 border border-neutral-700/80 rounded-xl px-4 py-2.5 shadow-xl text-xs font-medium text-neutral-200">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Curated for {storyDest.categories.join(' · ')}</span>
              </div>
            </div>

            {/* Editorial copy */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400 mb-3">
                <span>Chapter 02</span>
                <span aria-hidden="true" className="text-neutral-700">·</span>
                <span>Sense of Place</span>
              </div>

              <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                {storyDest.tagline}
              </h3>

              <p className="text-neutral-300 text-base leading-relaxed mb-6">
                {storyDest.description}
              </p>

              {/* Key Attractions list */}
              <div className="space-y-3 mb-8">
                <p className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                  Signature Highlights
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-200">
                  {storyDest.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => onGoToPlanner(storyDest.id)}
                  className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>Build {storyDest.name} Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SCENE D: TRAVEL PERSONALITY (Interactive Mood Selection) --- */}
      <section id="personality" className="relative py-24 px-6 bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400 mb-3">
              <span>Chapter 03</span>
              <span aria-hidden="true" className="text-neutral-700">·</span>
              <span>Travel Archetypes</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Your journey. Your kind of magic.
            </h2>
            <p className="text-neutral-300 text-base sm:text-lg">
              Travel isn't one-size-fits-all. Select your innate travel mood to see how the intelligence engine adjusts pacing, priorities, and secrets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {moods.map((m) => {
              const isSelected = currentMood === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMood(m.id)}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-left relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-950/30 to-neutral-900 border-amber-500/60 shadow-xl shadow-amber-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectMood(m.id);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`Select travel mood: ${m.id} - ${m.title}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                      {m.id}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">
                    {m.title}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed mb-4">
                    {m.desc}
                  </p>
                  <div className="text-xs font-medium text-amber-400/90 group-hover:text-amber-300 flex items-center gap-1">
                    <span>{isSelected ? 'Active Preference' : 'Apply Mood'}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SCENE E: INTELLIGENT ITINERARY FORMATION & ARCHITECTURE --- */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-neutral-950 via-[#0a0f1d] to-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-teal-400 mb-3">
                <span>Chapter 04</span>
                <span aria-hidden="true" className="text-neutral-700">·</span>
                <span>Algorithmic Craft</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                Watch the intelligent itinerary assemble.
              </h2>
              <p className="text-neutral-300 text-base leading-relaxed mb-8">
                Traditional planners dump generic lists. TravelMind AI dynamically weaves sunlight angles, physical energy curves, geographic distance, and realistic budget envelopes into an unbroken narrative.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Energy-Paced Daily Schedules</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Morning high-focus ascents, afternoon shade pauses, and sunset contemplation slots matched to your selected pace.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Honest Transparent Budgets</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Real breakdown of stay, local transit, entry permits, and dining with calculated buffers so surprises stay zero.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Editable &amp; Exportable</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Add, delete, or swap attractions. One-click copy formatted text to WhatsApp or save permanently to your browser.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Preview Mock Diagram */}
            <div className="lg:col-span-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-semibold text-white">Live Engine Preview: Hampi Expedition</span>
                </div>
                <span className="font-mono text-teal-400 text-[11px]">OPTIMIZED · 3 DAYS</span>
              </div>

              <div className="space-y-3 font-sans">
                <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-amber-400">09:00 AM</span>
                    <div>
                      <p className="text-xs font-semibold text-white">Matanga Hill Sunrise Ascent</p>
                      <p className="text-[11px] text-neutral-400">Morning golden light &amp; cool breezes</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">~2.5 hrs</span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-amber-400">02:00 PM</span>
                    <div>
                      <p className="text-xs font-semibold text-white">Lotus Mahal &amp; Royal Enclosure</p>
                      <p className="text-[11px] text-neutral-400">Air-cooled Indo-Islamic stone pavilions</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">~2.5 hrs</span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-teal-400">05:30 PM</span>
                    <div>
                      <p className="text-xs font-semibold text-white">Sanapur Lake Boulder Sunset</p>
                      <p className="text-[11px] text-neutral-400">Twilight reflections across granite piles</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">~2.0 hrs</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-neutral-400">Estimated Total: </span>
                  <span className="font-mono font-semibold text-white">₹19,500</span>
                </div>
                <button
                  onClick={() => onGoToPlanner('hampi')}
                  className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
                >
                  Load in Planner
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
