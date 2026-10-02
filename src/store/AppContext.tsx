// =============================================
// SafePath – App Store (React Context)
// =============================================
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  AppSettings,
  Journey,
  EmergencyEvent,
  TrustedContact,
  CautionZone,
  Hazard,
  VoiceGuardConfig,
} from '../types';
import {
  DEMO_USER,
  DEMO_CONTACTS,
  DEMO_CAUTION_ZONES,
  DEMO_HAZARDS,
  getHazardsAround,
  getCautionZonesAround,
} from '../data/demoData';

// ---- State ----
interface AppState {
  settings: AppSettings;
  currentJourney: Journey | null;
  activeEmergency: EmergencyEvent | null;
  hazards: Hazard[];
  isDemoMode: boolean;
  demoStep: number;
  /** Real GPS position from navigator.geolocation; null until resolved */
  userPosition: { lat: number; lng: number } | null;
  /** Whether the GPS request is still in progress */
  gpsLoading: boolean;
}

// ---- Actions ----
type AppAction =
  | { type: 'START_DEMO_MODE' }
  | { type: 'ADVANCE_DEMO_STEP' }
  | { type: 'SET_JOURNEY'; payload: Journey }
  | { type: 'UPDATE_JOURNEY'; payload: Partial<Journey> }
  | { type: 'END_JOURNEY' }
  | { type: 'TRIGGER_EMERGENCY'; payload: EmergencyEvent }
  | { type: 'RESOLVE_EMERGENCY' }
  | { type: 'ADD_CONTACT'; payload: TrustedContact }
  | { type: 'REMOVE_CONTACT'; payload: string }
  | { type: 'ADD_CAUTION_ZONE'; payload: CautionZone }
  | { type: 'REMOVE_CAUTION_ZONE'; payload: string }
  | { type: 'ADD_HAZARD'; payload: Hazard }
  | { type: 'UPDATE_VOICE_GUARD'; payload: Partial<VoiceGuardConfig> }
  | { type: 'SET_USER_POSITION'; payload: { lat: number; lng: number } }
  | { type: 'SET_GPS_LOADING'; payload: boolean }
  | { type: 'SET_PRIMARY_CONTACT'; payload: string | null }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<import('../types').User> };

// ---- Initial state ----
const initialState: AppState = {
  settings: {
    user: DEMO_USER,
    trustedContacts: DEMO_CONTACTS,
    cautionZones: DEMO_CAUTION_ZONES,
    voiceGuard: {
      enabled: false,
      phrase: 'Help Help',
      confirmBeforeActivate: true,
      automaticEmergencyCalling: false,
    },
    isDemoMode: true,
    primaryContactId: null,
  },
  currentJourney: null,
  activeEmergency: null,
  hazards: DEMO_HAZARDS,
  isDemoMode: true,
  demoStep: 0,
  userPosition: null,
  gpsLoading: true,
};

// ---- Reducer ----
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_DEMO_MODE': {
      const origin = state.userPosition
        ? { ...state.userPosition, label: 'Current Location (GPS)' }
        : { lat: 20, lng: 0, label: 'Current Location' };
      const destination = {
        lat: Number((origin.lat + 0.007).toFixed(6)),
        lng: Number((origin.lng + 0.004).toFixed(6)),
        label: 'Safe Haven & Transit Hub',
      };
      const demoJourney: Journey = {
        id: 'journey-demo-001',
        userId: DEMO_USER.id,
        origin,
        destination,
        selectedRoute: {
          id: 'route-demo',
          name: 'Route A — Main Well-Lit Avenue',
          coordinates: [
            origin,
            { lat: Number((origin.lat + 0.0025).toFixed(6)), lng: Number((origin.lng + 0.0015).toFixed(6)) },
            { lat: Number((origin.lat + 0.005).toFixed(6)), lng: Number((origin.lng + 0.003).toFixed(6)) },
            destination,
          ],
          distanceMeters: 850,
          durationSeconds: 660,
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
              { label: 'High Public Activity', detail: 'Main avenue with regular pedestrian footfall', impact: 'positive' },
              { label: '14 Open Safe Havens', detail: 'Verified staffed pharmacies & convenience stores', impact: 'positive' },
              { label: 'Continuous Street Lighting', detail: 'Consistent LED municipal streetlights', impact: 'positive' },
            ],
          },
        },
        startedAt: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + 11 * 60 * 1000).toISOString(),
        status: 'planning',
        sharingEnabled: false,
        currentPosition: origin,
      };
      return {
        ...state,
        isDemoMode: true,
        currentJourney: demoJourney,
        demoStep: 1,
      };
    }

    case 'ADVANCE_DEMO_STEP':
      return { ...state, demoStep: state.demoStep + 1 };

    case 'SET_JOURNEY':
      return { ...state, currentJourney: action.payload };

    case 'UPDATE_JOURNEY':
      if (!state.currentJourney) return state;
      return {
        ...state,
        currentJourney: { ...state.currentJourney, ...action.payload },
      };

    case 'END_JOURNEY':
      return {
        ...state,
        currentJourney: state.currentJourney
          ? { ...state.currentJourney, status: 'completed', completedAt: new Date().toISOString() }
          : null,
      };

    case 'TRIGGER_EMERGENCY':
      return { ...state, activeEmergency: action.payload };

    case 'RESOLVE_EMERGENCY':
      return {
        ...state,
        activeEmergency: state.activeEmergency
          ? { ...state.activeEmergency, status: 'resolved' }
          : null,
      };

    case 'ADD_CONTACT':
      return {
        ...state,
        settings: {
          ...state.settings,
          trustedContacts: [...state.settings.trustedContacts, action.payload],
        },
      };

    case 'REMOVE_CONTACT':
      return {
        ...state,
        settings: {
          ...state.settings,
          trustedContacts: state.settings.trustedContacts.filter((c) => c.id !== action.payload),
        },
      };

    case 'ADD_CAUTION_ZONE':
      return {
        ...state,
        settings: {
          ...state.settings,
          cautionZones: [...state.settings.cautionZones, action.payload],
        },
      };

    case 'REMOVE_CAUTION_ZONE':
      return {
        ...state,
        settings: {
          ...state.settings,
          cautionZones: state.settings.cautionZones.filter((z) => z.id !== action.payload),
        },
      };

    case 'ADD_HAZARD':
      return { ...state, hazards: [action.payload, ...state.hazards] };

    case 'UPDATE_VOICE_GUARD':
      return {
        ...state,
        settings: {
          ...state.settings,
          voiceGuard: { ...state.settings.voiceGuard, ...action.payload },
        },
      };

    case 'SET_USER_POSITION': {
      const isFirst = !state.userPosition;
      return {
        ...state,
        userPosition: action.payload,
        gpsLoading: false,
        hazards: isFirst ? getHazardsAround(action.payload) : state.hazards,
        settings: isFirst
          ? {
              ...state.settings,
              cautionZones: getCautionZonesAround(action.payload),
            }
          : state.settings,
      };
    }

    case 'SET_GPS_LOADING':
      return { ...state, gpsLoading: action.payload };

    case 'UPDATE_USER_PROFILE':
      return {
        ...state,
        settings: {
          ...state.settings,
          user: { ...state.settings.user, ...action.payload },
        },
      };

    case 'SET_PRIMARY_CONTACT':
      return {
        ...state,
        settings: { ...state.settings, primaryContactId: action.payload },
      };

    default:
      return state;
  }
}

// ---- Context ----
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  triggerSOS: (lat: number, lng: number, type?: EmergencyEvent['type']) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ---- Provider ----
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const triggerSOS = useCallback(
    (lat: number, lng: number, type: EmergencyEvent['type'] = 'sos_manual') => {
      const event: EmergencyEvent = {
        id: `emergency-${Date.now()}`,
        userId: state.settings.user.id,
        journeyId: state.currentJourney?.id,
        type,
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
        status: 'active',
        guardianNotificationStatus: 'simulated',
        responseNotificationStatus: 'simulated',
      };
      dispatch({ type: 'TRIGGER_EMERGENCY', payload: event });
    },
    [state.settings.user.id, state.currentJourney?.id]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, triggerSOS }}>
      {children}
    </AppContext.Provider>
  );
}

// ---- Hook ----
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
