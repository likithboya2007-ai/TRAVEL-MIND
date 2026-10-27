import React, { useState, useEffect } from 'react';
import { Compass, Bookmark, ListChecks, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  savedCount: number;
  bucketListCount: number;
  onOpenSaved: () => void;
  onOpenBucketList: () => void;
  onPlanClick: () => void;
  onOpenAuth: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  savedCount,
  bucketListCount,
  onOpenSaved,
  onOpenBucketList,
  onPlanClick,
  onOpenAuth,
}) => {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Destinations', href: '#destinations' },
    { label: 'Plan Trip', href: '#planner' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 py-3.5 shadow-sm'
          : 'bg-white/90 backdrop-blur-sm py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-8">
        {/* Brand */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="TravelMind AI Home"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-600 transition-colors duration-200">
            <Compass className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-display tracking-tight text-xl text-gray-900">
            TravelMind AI
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-blue-500 transition-colors duration-200 whitespace-nowrap focus:outline-none focus-visible:underline"
            >
              {link.label}
            </a>
          ))}

          {bucketListCount > 0 && (
            <button
              onClick={onOpenBucketList}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-500 transition-colors whitespace-nowrap cursor-pointer"
              aria-label={`View ${bucketListCount} trips in bucket list`}
            >
              <ListChecks className="w-4 h-4" />
              <span>Bucket List</span>
              <span className="tabular-nums text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {bucketListCount}
              </span>
            </button>
          )}

          {savedCount > 0 && (
            <button
              onClick={onOpenSaved}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-500 transition-colors whitespace-nowrap cursor-pointer"
              aria-label={`View ${savedCount} saved trips`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved</span>
              <span className="tabular-nums text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {savedCount}
              </span>
            </button>
          )}
        </nav>

        {/* Primary CTA & Auth */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
          <button
            onClick={onPlanClick}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm"
          >
            Plan Your Trip
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {bucketListCount > 0 && (
            <button
              onClick={onOpenBucketList}
              className="p-2 text-gray-700 hover:text-blue-500 transition-colors relative"
              aria-label={`View ${bucketListCount} trips in bucket list`}
            >
              <ListChecks className="w-5 h-5" />
              {bucketListCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {bucketListCount}
                </span>
              )}
            </button>
          )}
          {savedCount > 0 && (
            <button
              onClick={onOpenSaved}
              className="p-2 text-gray-700 hover:text-blue-500 transition-colors relative"
              aria-label={`View ${savedCount} saved trips`}
            >
              <Bookmark className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-100 text-gray-700 text-[10px] rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-700 hover:text-gray-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 py-6 shadow-lg">
          <nav className="flex flex-col gap-4 text-base font-medium">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-500 transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
            {bucketListCount > 0 && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBucketList();
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-500 py-1 text-left"
              >
                <ListChecks className="w-4 h-4" />
                <span>Bucket List ({bucketListCount})</span>
              </button>
            )}
            {savedCount > 0 && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSaved();
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-500 py-1 text-left"
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved Trips ({savedCount})</span>
              </button>
            )}
            <div className="pt-2 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPlanClick();
                }}
                className="w-full py-3 text-center text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 shadow-sm transition-colors"
              >
                Plan Your Trip
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
