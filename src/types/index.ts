// =============================================
// SafePath – Core TypeScript Types
// =============================================

export interface LatLng {
  lat: number;
  lng: number;
}

// ---- User ----
export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

// ---- Trusted Contact ----
export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  notificationPreferences: {
    notifyOnJourneyStart: boolean;
    notifyOnSOS: boolean;
    notifyOnArrival: boolean;
  };
}

// ---- Caution Zone ----
export interface CautionZone {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  activeFrom: string; // HH:MM
  activeUntil: string; // HH:MM
  notifyGuardian: boolean;
  suggestAlternateRoute: boolean;
  createdAt: string;
}

// ---- Hazard ----
export type HazardCategory =
  | 'poor_lighting'
  | 'isolated_area'
  | 'blocked_walkway'
  | 'broken_streetlight'
  | 'unsafe_bus_stop'
  | 'road_condition'
  | 'other';

export interface Hazard {
  id: string;
  latitude: number;
  longitude: number;
  category: HazardCategory;
  description: string;
  reportedAt: string;
  status: 'active' | 'needs_verification' | 'resolved';
  source: 'user' | 'municipal' | 'demo';
  expiresAt?: string;
}

// ---- Place ----
export type PlaceCategory =
  | 'restaurant'
  | 'pharmacy'
  | 'grocery'
  | 'cafe'
  | 'petrol_station'
  | 'police'
  | 'hospital'
  | 'clinic'
  | 'campus_security'
  | 'convenience'
  | 'help_center'
  | 'other';

export type OpeningStatus = 'open' | 'closed' | 'unknown';

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  openingStatus: OpeningStatus;
  openingHours?: string;
  phone?: string;
  distance?: number; // meters from route
  lastUpdated: string;
}

// ---- Route ----
export interface RouteIndicators {
  activityLevel: 'low' | 'medium' | 'high';
  activityScore: number; // 0-100
  openBusinesses: number;
  closedBusinesses: number;
  unknownBusinesses: number;
  reportedHazards: number;
  nearbyHelpPoints: number;
  cautionZonesOnRoute: number;
  openBusinessScore: number;
  hazardScore: number;
  helpPointScore: number;
  cautionZoneScore: number;
  routeContextScore: number; // 0-100 composite
  breakdown: RouteScoreBreakdown[];
}

export interface RouteScoreBreakdown {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  detail: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface Route {
  id: string;
  name: string;
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  indicators: RouteIndicators;
  isRecommended: boolean;
  steps?: RouteStep[];
}

// ---- Journey ----
export type JourneyStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface Journey {
  id: string;
  userId: string;
  origin: LatLng & { label: string };
  destination: LatLng & { label: string };
  selectedRoute?: Route;
  startedAt?: string;
  estimatedArrival?: string;
  completedAt?: string;
  status: JourneyStatus;
  sharingEnabled: boolean;
  currentPosition?: LatLng;
}

// ---- Emergency ----
export type EmergencyType = 'sos_manual' | 'voice_trigger' | 'no_response';

export interface EmergencyEvent {
  id: string;
  userId: string;
  journeyId?: string;
  type: EmergencyType;
  latitude: number;
  longitude: number;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  guardianNotificationStatus: 'pending' | 'sent' | 'failed' | 'simulated';
  responseNotificationStatus: 'pending' | 'sent' | 'failed' | 'simulated';
  nearestHelpPoint?: Place;
}

// ---- Voice Guard ----
export interface VoiceGuardConfig {
  enabled: boolean;
  phrase: string;
  confirmBeforeActivate: boolean;
  /** When true, immediately dials primary contact on phrase detection (no confirmation step) */
  automaticEmergencyCalling: boolean;
}

// ---- App State ----
export interface AppSettings {
  user: User;
  trustedContacts: TrustedContact[];
  cautionZones: CautionZone[];
  voiceGuard: VoiceGuardConfig;
  isDemoMode: boolean;
  /** ID of the contact that receives the automatic emergency call */
  primaryContactId: string | null;
}
