import React from 'react';
import { ArrowRight, MapPin, Calendar, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onStartPlanning: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartPlanning }) => {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden bg-gray-50"
      aria-label="Hero section"
    >
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/src/assets/images/dest_kerala_1792602058604.jpg"
          alt="Beautiful travel destination - backwaters and nature"
          className="w-full h-full object-cover scale-105"
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/80" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm mb-6">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Smart Trip Planning Made Easy</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
          Discover Your Next<br />
          <span className="text-blue-600">Adventure</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed mb-10 max-w-2xl mx-auto">
          Create personalized travel itineraries with transparent budgets, local recommendations, 
          and smart planning tools designed for real travelers
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartPlanning}
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            <MapPin className="w-5 h-5" />
            <span>Plan Your Trip</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              const showcase = document.getElementById('destinations');
              showcase?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-gray-700 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white hover:shadow-md active:scale-[0.98] transition-all duration-200 border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            <Calendar className="w-5 h-5" />
            <span>Browse Destinations</span>
          </button>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm">
          <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700">
            📍 Real Coordinates
          </div>
          <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700">
            💰 Transparent Budgets
          </div>
          <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700">
            🗺️ Interactive Maps
          </div>
          <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700">
            🏨 Local Hotels & Restaurants
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-gray-400 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        </div>
      </div>
    </section>
  );
};
