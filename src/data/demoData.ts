// =============================================
// SafePath – Dynamic Demo / Seed Data Generator
// =============================================
// All seed POIs, hazards, and zones are generated RELATIVE
// to the user's detected location. London coordinates are NEVER used.
import type {
  Place,
  Hazard,
  CautionZone,
  TrustedContact,
  User,
  Route,
  LatLng,
  EmergencyEvent,
} from '../types';

export const DEMO_USER: User = {
  id: 'demo-user-001',
  name: 'Demo User',
  phone: '+1 555 019 2831',
  email: 'demo@safepath.app',
  createdAt: '2024-01-01T00:00:00Z',
};

export const DEMO_CONTACTS: TrustedContact[] = [
  {
    id: 'contact-001',
    userId: 'demo-user-001',
    name: 'Mother',
    phone: '+1 555 019 0001',
    relationship: 'Family',
    notificationPreferences: {
      notifyOnJourneyStart: true,
      notifyOnSOS: true,
      notifyOnArrival: true,
    },
  },
  {
    id: 'contact-002',
    userId: 'demo-user-001',
    name: 'Best Friend',
    phone: '+1 555 019 0002',
    relationship: 'Friend',
    notificationPreferences: {
      notifyOnJourneyStart: false,
      notifyOnSOS: true,
      notifyOnArrival: false,
    },
  },
];

/**
 * Generate verified safe havens and open businesses relative to any center.
 */
export function getPlacesAround(center?: LatLng | null): Place[] {
  const c = center || { lat: 0, lng: 0 };
  return [
    {
      id: 'place-001',
      name: 'Safe Haven Pharmacy (24/7)',
      latitude: Number((c.lat + 0.0031).toFixed(6)),
      longitude: Number((c.lng - 0.0028).toFixed(6)),
      category: 'pharmacy',
      openingStatus: 'open',
      openingHours: '00:00–24:00 (Staffed)',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'place-002',
      name: 'Avenue Cafe & Bakery',
      latitude: Number((c.lat + 0.0042).toFixed(6)),
      longitude: Number((c.lng - 0.0012).toFixed(6)),
      category: 'cafe',
      openingStatus: 'open',
      openingHours: '06:30–23:00',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'place-003',
      name: 'Central 24h Convenience Store',
      latitude: Number((c.lat + 0.0035).toFixed(6)),
      longitude: Number((c.lng + 0.0015).toFixed(6)),
      category: 'convenience',
      openingStatus: 'open',
      openingHours: '00:00–24:00',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'place-004',
      name: 'Transit Desk & Campus Security',
      latitude: Number((c.lat + 0.0022).toFixed(6)),
      longitude: Number((c.lng - 0.0008).toFixed(6)),
      category: 'campus_security',
      openingStatus: 'open',
      openingHours: 'Staffed 24/7',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'place-005',
      name: 'Police Community Station',
      latitude: Number((c.lat + 0.0048).toFixed(6)),
      longitude: Number((c.lng - 0.0021).toFixed(6)),
      category: 'police',
      openingStatus: 'open',
      openingHours: '24 Hours',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'place-006',
      name: 'District Urgent Care / Clinic',
      latitude: Number((c.lat + 0.0028).toFixed(6)),
      longitude: Number((c.lng + 0.0032).toFixed(6)),
      category: 'hospital',
      openingStatus: 'open',
      openingHours: 'Emergency 24/7',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'place-007',
      name: 'Back Lane Retail Shop',
      latitude: Number((c.lat - 0.0012).toFixed(6)),
      longitude: Number((c.lng + 0.0038).toFixed(6)),
      category: 'grocery',
      openingStatus: 'closed',
      openingHours: 'Closed at 18:00',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'place-008',
      name: 'Community Center & Well-Lit Lobby',
      latitude: Number((c.lat + 0.0055).toFixed(6)),
      longitude: Number((c.lng + 0.0018).toFixed(6)),
      category: 'help_center',
      openingStatus: 'open',
      openingHours: 'Staffed until midnight',
      lastUpdated: new Date().toISOString(),
    },
  ];
}

/**
 * Generate hazards relative to center.
 */
export function getHazardsAround(center?: LatLng | null): Hazard[] {
  const c = center || { lat: 0, lng: 0 };
  return [
    {
      id: 'hazard-001',
      latitude: Number((c.lat - 0.0018).toFixed(6)),
      longitude: Number((c.lng + 0.0025).toFixed(6)),
      category: 'poor_lighting',
      description: 'Street lighting reported poor along this stretch',
      reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      source: 'user',
    },
    {
      id: 'hazard-002',
      latitude: Number((c.lat - 0.0012).toFixed(6)),
      longitude: Number((c.lng + 0.0018).toFixed(6)),
      category: 'isolated_area',
      description: 'Low public activity reported in this area after 8PM',
      reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      source: 'user',
    },
    {
      id: 'hazard-003',
      latitude: Number((c.lat + 0.0025).toFixed(6)),
      longitude: Number((c.lng - 0.0022).toFixed(6)),
      category: 'blocked_walkway',
      description: 'Sidewalk construction work partially obstructing path',
      reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'needs_verification',
      source: 'user',
    },
  ];
}

/**
 * Generate caution zones relative to center.
 */
export function getCautionZonesAround(center?: LatLng | null): CautionZone[] {
  const c = center || { lat: 0, lng: 0 };
  return [
    {
      id: 'zone-001',
      userId: 'demo-user-001',
      name: 'Unlit Alley Shortcut',
      latitude: Number((c.lat - 0.0022).toFixed(6)),
      longitude: Number((c.lng + 0.0035).toFixed(6)),
      radiusMeters: 300,
      activeFrom: '20:00',
      activeUntil: '06:00',
      notifyGuardian: true,
      suggestAlternateRoute: true,
      createdAt: '2024-01-10T00:00:00Z',
    },
    {
      id: 'zone-002',
      userId: 'demo-user-001',
      name: 'Underpass with Poor Visibility',
      latitude: Number((c.lat + 0.0018).toFixed(6)),
      longitude: Number((c.lng - 0.0042).toFixed(6)),
      radiusMeters: 250,
      activeFrom: '21:00',
      activeUntil: '07:00',
      notifyGuardian: false,
      suggestAlternateRoute: true,
      createdAt: '2024-01-12T00:00:00Z',
    },
  ];
}

/**
 * Generate emergency event relative to center.
 */
export function getDemoEmergency(center?: LatLng | null): EmergencyEvent {
  const c = center || { lat: 0, lng: 0 };
  return {
    id: 'emergency-001',
    userId: 'demo-user-001',
    journeyId: 'journey-demo-001',
    type: 'voice_trigger',
    latitude: Number((c.lat + 0.0012).toFixed(6)),
    longitude: Number((c.lng - 0.0008).toFixed(6)),
    timestamp: new Date().toISOString(),
    status: 'active',
    guardianNotificationStatus: 'simulated',
    responseNotificationStatus: 'simulated',
  };
}

// Fallback relative exports (default to 0,0 until GPS updates)
export const DEMO_CENTER: LatLng = { lat: 0, lng: 0 };
export const DEMO_PLACES: Place[] = getPlacesAround(DEMO_CENTER);
export const DEMO_HAZARDS: Hazard[] = getHazardsAround(DEMO_CENTER);
export const DEMO_CAUTION_ZONES: CautionZone[] = getCautionZonesAround(DEMO_CENTER);
export const DEMO_EMERGENCY: EmergencyEvent = getDemoEmergency(DEMO_CENTER);

export const DEMO_ORIGIN: LatLng & { label: string } = {
  lat: 0,
  lng: 0,
  label: 'Current Location',
};

export const DEMO_DESTINATION: LatLng & { label: string } = {
  lat: 0.008,
  lng: 0.005,
  label: 'Downtown Transit Hub',
};

export const DEMO_ROUTES: Route[] = [
  {
    id: 'route-a',
    name: 'Route A — Main Well-Lit Avenue',
    coordinates: [
      { lat: 0, lng: 0 },
      { lat: 0.003, lng: 0.002 },
      { lat: 0.006, lng: 0.004 },
      { lat: 0.008, lng: 0.005 },
    ],
    distanceMeters: 1200,
    durationSeconds: 960,
    isRecommended: true,
    indicators: {
      activityLevel: 'high',
      activityScore: 92,
      openBusinesses: 14,
      closedBusinesses: 2,
      unknownBusinesses: 1,
      reportedHazards: 0,
      nearbyHelpPoints: 2,
      cautionZonesOnRoute: 0,
      openBusinessScore: 95,
      hazardScore: 100,
      helpPointScore: 85,
      cautionZoneScore: 100,
      routeContextScore: 94,
      breakdown: [
        { label: 'High Public Activity', detail: 'Main road with pedestrian traffic', impact: 'positive' },
        { label: '14 Open Safe Havens', detail: 'Pharmacies, transit desk & cafes', impact: 'positive' },
        { label: 'Continuous Street Lighting', detail: 'Standard municipal lighting along entire walk', impact: 'positive' },
      ],
    },
  },
];
