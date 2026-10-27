import React from 'react';
import {
  Compass,
  Camera,
  Utensils,
  Heart,
  Feather,
  Landmark,
  User,
  Users,
  Flame,
  Activity,
  Coffee,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { MoodType, GroupType, EnergyType } from '../utils/plannerLogic';

interface MoodSelectorProps {
  mood: MoodType;
  group: GroupType;
  energy: EnergyType;
  onMoodChange: (mood: MoodType) => void;
  onGroupChange: (group: GroupType) => void;
  onEnergyChange: (energy: EnergyType) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  mood,
  group,
  energy,
  onMoodChange,
  onGroupChange,
  onEnergyChange,
}) => {
  const moodOptions: Array<{
    id: MoodType;
    label: string;
    icon: React.ReactNode;
    subtitle: string;
  }> = [
    { id: 'Adventure', label: 'Adventure', icon: <Compass className="w-4 h-4" />, subtitle: 'Trekking, high passes & expeditions' },
    { id: 'Photography', label: 'Photography', icon: <Camera className="w-4 h-4" />, subtitle: 'Golden hour angles & timeless stone' },
    { id: 'Food', label: 'Food', icon: <Utensils className="w-4 h-4" />, subtitle: 'Bazaars, regional delicacies & spices' },
    { id: 'Romantic', label: 'Romantic', icon: <Heart className="w-4 h-4" />, subtitle: 'Sunset lagoons & candlelit shores' },
    { id: 'Peaceful', label: 'Peaceful', icon: <Feather className="w-4 h-4" />, subtitle: 'Quietude, lakeside dawns & cloud mist' },
    { id: 'Culture', label: 'Culture', icon: <Landmark className="w-4 h-4" />, subtitle: 'Ancient dynasties, forts & heritage' },
  ];

  const groupOptions: Array<{
    id: GroupType;
    label: string;
    icon: React.ReactNode;
    note: string;
  }> = [
    { id: 'Solo', label: 'Solo Traveler', icon: <User className="w-4 h-4" />, note: 'Spontaneous & intimate pace (1x)' },
    { id: 'Couple', label: 'Couple', icon: <Heart className="w-4 h-4" />, note: 'Curated romance & shared memories (2x)' },
    { id: 'Friends', label: 'Friends Group', icon: <Users className="w-4 h-4" />, note: 'Dynamic activities & shared adventures (3x)' },
    { id: 'Family', label: 'Family Trip', icon: <Users className="w-4 h-4" />, note: 'Comfortable transfers & all-age sites (4x)' },
  ];

  const energyOptions: Array<{
    id: EnergyType;
    label: string;
    icon: React.ReactNode;
    pace: string;
  }> = [
    { id: 'Relaxed', label: 'Relaxed', icon: <Coffee className="w-4 h-4" />, pace: '1 signature attraction / day' },
    { id: 'Balanced', label: 'Balanced', icon: <Activity className="w-4 h-4" />, pace: '2 curated experiences / day' },
    { id: 'Active', label: 'Active', icon: <Flame className="w-4 h-4" />, pace: '3+ high-energy expeditions / day' },
  ];

  return (
    <div className="bg-[#090f20]/80 border border-slate-800/90 rounded-3xl p-6 sm:p-10 backdrop-blur-md shadow-2xl">
      <div className="mb-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono uppercase tracking-widest mb-3">
          <span>Scene 04</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Travel Mood &amp; Dynamics</span>
        </div>
        <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
          Your travel archetype shapes your journey.
        </h3>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Select your innate travel style. The algorithmic planner adjusts dwell times, rest intervals, group budget multipliers, and daily expedition intensity in real-time.
        </p>
      </div>

      {/* 1. Travel Mood */}
      <div className="mb-10">
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-teal-300 mb-4 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>1. Travel Mood Archetype</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {moodOptions.map((item) => {
            const active = mood === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onMoodChange(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  active
                    ? 'bg-gradient-to-b from-[#0d1e38] to-[#0a1528] border-teal-400/80 text-white font-semibold shadow-lg shadow-teal-500/15 ring-1 ring-teal-400/30'
                    : 'bg-[#050811]/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-900/60'
                }`}
                aria-pressed={active}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={active ? 'text-teal-300' : 'text-slate-400'}>
                      {item.icon}
                    </div>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                  <span className="text-xs font-semibold block mb-1">{item.label}</span>
                </div>
                <p className={`text-[11px] leading-tight line-clamp-2 ${active ? 'text-slate-200' : 'text-slate-400'}`}>
                  {item.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Group Composition */}
      <div className="mb-10">
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300 mb-4 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>2. Group Dynamic &amp; Budget Multiplier</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {groupOptions.map((item) => {
            const active = group === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onGroupChange(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  active
                    ? 'bg-gradient-to-b from-[#0c233c] to-[#0a192e] border-cyan-400/80 text-white font-semibold shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/30'
                    : 'bg-[#050811]/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                aria-pressed={active}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/80 text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-xs font-semibold block">{item.label}</span>
                    <span className="text-[11px] text-slate-400">{item.note}</span>
                  </div>
                </div>
                {active && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Daily Energy & Pacing Curve */}
      <div>
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-teal-300 mb-4 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>3. Daily Energy Curve &amp; Sight Density</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {energyOptions.map((item) => {
            const active = energy === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onEnergyChange(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  active
                    ? 'bg-gradient-to-b from-[#0d2238] to-[#091729] border-teal-400/80 text-white font-semibold shadow-lg shadow-teal-500/15 ring-1 ring-teal-400/30'
                    : 'bg-[#050811]/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                aria-pressed={active}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${active ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800/80 text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-xs font-semibold block">{item.label} Pace</span>
                    <span className="text-[11px] text-slate-400">{item.pace}</span>
                  </div>
                </div>
                {active && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
