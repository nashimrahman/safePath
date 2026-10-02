// =============================================
// SafePath – Route Scoring Service
// =============================================
// This is an explainable weighted model, NOT a scientific safety measure.
// Call it "Route Context Score" or "Route Activity & Risk Indicator".
// Do NOT call it "Safety Probability".

import type { Route, RouteIndicators } from '../types';

// Configurable weights – must sum to 1.0
export const SCORE_WEIGHTS = {
  activityScore: 0.35,      // public activity indicators
  openBusinessScore: 0.25,  // nearby open businesses
  hazardScore: 0.20,        // absence of reported hazards
  helpPointScore: 0.10,     // proximity to assistance points
  cautionZoneScore: 0.10,   // avoidance of caution zones
};

/**
 * Calculate a composite Route Context Score (0–100).
 * Higher = stronger available public-activity indicators, fewer reported hazards.
 * This is NOT a guarantee of personal safety.
 */
export function calculateRouteContextScore(indicators: Omit<RouteIndicators, 'routeContextScore' | 'breakdown'>): number {
  const {
    activityScore,
    openBusinessScore,
    hazardScore,
    helpPointScore,
    cautionZoneScore,
  } = indicators;

  const composite =
    SCORE_WEIGHTS.activityScore * activityScore +
    SCORE_WEIGHTS.openBusinessScore * openBusinessScore +
    SCORE_WEIGHTS.hazardScore * hazardScore +
    SCORE_WEIGHTS.helpPointScore * helpPointScore +
    SCORE_WEIGHTS.cautionZoneScore * cautionZoneScore;

  return Math.round(Math.min(100, Math.max(0, composite)));
}

/**
 * Determine which route is "recommended" based on the highest composite score.
 * Marks the best route as recommended.
 */
export function selectRecommendedRoute(routes: Route[]): Route[] {
  if (routes.length === 0) return routes;

  let bestIndex = 0;
  let bestScore = -1;

  routes.forEach((route, index) => {
    if (route.indicators.routeContextScore > bestScore) {
      bestScore = route.indicators.routeContextScore;
      bestIndex = index;
    }
  });

  return routes.map((route, index) => ({
    ...route,
    isRecommended: index === bestIndex,
  }));
}

/**
 * Get a human-readable activity level label.
 */
export function getActivityLabel(score: number): string {
  if (score >= 70) return 'Higher public activity';
  if (score >= 40) return 'Moderate public activity';
  return 'Limited public activity';
}

/**
 * Get score color class for Tailwind.
 */
export function getScoreColorClass(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-orange-600';
}

/**
 * Get score text color class for Tailwind.
 */
export function getScoreTextClass(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-orange-400';
}

/**
 * Format distance in a human-readable way.
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/**
 * Format duration in a human-readable way.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins} min`;
}

/**
 * Format a timestamp as relative time (e.g. "2 hours ago").
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

/**
 * Calculate distance between two lat/lng points (Haversine formula).
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Check if a user is inside a caution zone's radius.
 */
export function isInsideCautionZone(
  userLat: number,
  userLng: number,
  zoneLat: number,
  zoneLng: number,
  radiusMeters: number,
  warningBuffer = 1.5 // warn at 1.5× the radius
): { inside: boolean; approaching: boolean; distance: number } {
  const dist = haversineDistance(userLat, userLng, zoneLat, zoneLng);
  return {
    inside: dist <= radiusMeters,
    approaching: dist <= radiusMeters * warningBuffer,
    distance: Math.round(dist),
  };
}
