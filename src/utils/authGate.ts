/**
 * Authentication gate utility for conditional feature access
 * Used to prompt guests to sign in when accessing premium features
 */

import type { User } from '@supabase/supabase-js';

export interface AuthGateOptions {
  user: User | null;
  onShowAuthModal: () => void;
  featureName: string;
}

/**
 * Check if user is authenticated and gate feature access
 * @returns true if user is authenticated, false if not (shows auth modal)
 */
export function requireAuth(
  user: User | null,
  onShowAuthModal: () => void,
  featureName: string
): boolean {
  if (!user) {
    // Show auth modal for guests
    onShowAuthModal();
    return false;
  }
  return true;
}

/**
 * Get friendly feature name for display in auth prompts
 */
export function getFeatureDisplayName(featureName: string): string {
  const displayNames: Record<string, string> = {
    'save trips': 'save your trips',
    'bucket list': 'add to bucket list',
    'expenses': 'track expenses',
    'copilot': 'use AI copilot',
    'share': 'share trips',
    'group': 'create group trips'
  };
  return displayNames[featureName] || featureName;
}
