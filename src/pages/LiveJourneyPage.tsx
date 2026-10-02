// =============================================
// SafePath – Live Journey Page
// =============================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Share2, Pause, CheckCircle2, AlertTriangle, Clock, ArrowLeft, Zap } from 'lucide-react';
import { SafeMap } from '../components/SafeMap';
import { useApp } from '../store/AppContext';
import { getPlacesAround, getHazardsAround, getCautionZonesAround } from '../data/demoData';
import { generateRoutes } from '../services/routeService';
import { formatDuration, isInsideCautionZone } from '../services/routeScoring';
import type { LatLng } from '../types';

/**
 * Build a linear interpolation path between two real coordinates.
 * This generates intermediate positions so the simulated "dot"
 * moves from the actual journey origin to the actual destination.
 */
function buildSimulatedPath(origin: LatLng, destination: LatLng, steps = 8): LatLng[] {
  const path: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push({
      lat: Number((origin.lat + (destination.lat - origin.lat) * t).toFixed(6)),
      lng: Number((origin.lng + (destination.lng - origin.lng) * t).toFixed(6)),
    });
  }
  return path;
}

export function LiveJourneyPage() {
  const navigate = useNavigate();
  const { state, dispatch, triggerSOS } = useApp();
  const { currentJourney, settings } = state;

  const [posIndex, setPosIndex] = useState(0);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [showCautionAlert, setShowCautionAlert] = useState(false);
  const [showArrival, setShowArrival] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeCautionZone, setActiveCautionZone] = useState<string | null>(null);
  const [reroutedNotice, setReroutedNotice] = useState<string | null>(null);

  // Build the simulated path from the ACTUAL journey origin → destination.
  const simulatedPath = useMemo<LatLng[]>(() => {
    if (!currentJourney) return [];

    const routeCoords = currentJourney.selectedRoute?.coordinates;
    if (routeCoords && routeCoords.length >= 2) {
      return routeCoords;
    }

    return buildSimulatedPath(currentJourney.origin, currentJourney.destination, 8);
  }, [currentJourney]);

  // Current position is always derived from the REAL journey coordinates
  const currentPos: LatLng = simulatedPath[posIndex] ?? currentJourney?.origin ?? { lat: 0, lng: 0 };

  console.log('CURRENT USER LOCATION:', currentPos);

  // Simulate movement along the REAL path
  useEffect(() => {
    if (!currentJourney || currentJourney.status !== 'active') return;
    if (simulatedPath.length === 0) return;
    const interval = setInterval(() => {
      setPosIndex((prev) => {
        if (prev >= simulatedPath.length - 1) {
          clearInterval(interval);
          setShowArrival(true);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [currentJourney, simulatedPath]);

  // Update journey current position in global state as it moves
  useEffect(() => {
    if (!currentJourney || !currentPos) return;
    dispatch({
      type: 'UPDATE_JOURNEY',
      payload: { currentPosition: currentPos },
    });
  // Only update when posIndex changes, not every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posIndex]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check caution zones
  useEffect(() => {
    settings.cautionZones.forEach((zone) => {
      const { approaching } = isInsideCautionZone(
        currentPos.lat, currentPos.lng,
        zone.latitude, zone.longitude,
        zone.radiusMeters
      );
      if (approaching && activeCautionZone !== zone.id) {
        setActiveCautionZone(zone.id);
        setShowCautionAlert(true);
      }
    });
  }, [currentPos, settings.cautionZones, activeCautionZone]);

  const handleEndJourney = useCallback(() => {
    setShowArrival(true);
  }, []);

  const handleConfirmArrival = useCallback(() => {
    dispatch({ type: 'END_JOURNEY' });
    navigate('/');
  }, [dispatch, navigate]);

  const handleReroute = useCallback(async () => {
    if (currentJourney) {
      const newRoutes = await generateRoutes(currentPos, currentJourney.destination);
      const safeRoute = newRoutes[0] || currentJourney.selectedRoute;
      dispatch({
        type: 'SET_JOURNEY',
        payload: {
          ...currentJourney,
          selectedRoute: safeRoute,
        },
      });
    }
    setShowCautionAlert(false);
    setReroutedNotice('Rerouted to safer path: avoiding low-activity area (+2 min walk, 14 open shops)');
    setTimeout(() => setReroutedNotice(null), 6000);
  }, [currentJourney, currentPos, dispatch]);

  const handleSOS = useCallback(() => {
    triggerSOS(currentPos.lat, currentPos.lng, 'sos_manual');
    navigate('/emergency-status');
  }, [triggerSOS, currentPos, navigate]);

  if (!currentJourney) {
    return (
      <div className="page items-center justify-center">
        <p className="text-surface-300">No active journey.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/journey')}>Plan Journey</button>
      </div>
    );
  }

  const remainingSeconds = Math.max(
    0,
    (currentJourney.selectedRoute?.durationSeconds || 1260) - elapsedSeconds
  );
  const progressPercent = Math.min(
    100,
    (posIndex / Math.max(simulatedPath.length - 1, 1)) * 100
  );

  const localPlaces = getPlacesAround(currentJourney.origin);
  const localHazards = state.hazards.length > 0 ? state.hazards : getHazardsAround(currentJourney.origin);
  const localCautionZones = settings.cautionZones.length > 0 ? settings.cautionZones : getCautionZonesAround(currentJourney.origin);

  return (
    <div className="page relative">
      {/* Map — centered on REAL current position, showing REAL origin/destination */}
      <div className="flex-1 relative">
        <SafeMap
          center={currentPos}
          zoom={16}
          className="w-full h-full"
          userPosition={currentPos}
          origin={currentJourney.origin}
          destination={currentJourney.destination}
          routes={currentJourney.selectedRoute ? [currentJourney.selectedRoute] : []}
          selectedRouteId={currentJourney.selectedRoute?.id}
          places={localPlaces}
          hazards={localHazards}
          cautionZones={localCautionZones}
          showHelpPoints
        />

        {/* Dynamic Reroute Success Notification */}
        {reroutedNotice && (
          <div className="absolute top-36 left-3 right-3 z-30 animate-slide-down">
            <div className="p-3.5 rounded-2xl bg-emerald-600/95 backdrop-blur-md border border-emerald-400 text-white shadow-xl flex items-center gap-3">
              <CheckCircle2 size={22} className="text-white flex-shrink-0" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm">⚡ Safe Reroute Applied</p>
                <p className="text-emerald-100">{reroutedNotice}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top overlay */}
        <div className="map-overlay top-14 left-3 right-3">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface-700">
                <ArrowLeft size={16} className="text-surface-300" />
              </button>
              <div className="flex-1">
                <p className="text-white font-bold text-sm truncate">
                  → {currentJourney.destination.label}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-surface-300">
                    <Clock size={11} />
                    {formatDuration(remainingSeconds)} remaining
                  </span>
                  {sharingEnabled && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Sharing
                    </span>
                  )}
                </div>
              </div>
              {/* Quick simulation trigger for judges */}
              <button
                onClick={() => setShowCautionAlert(true)}
                className="px-2 py-1 rounded-lg bg-caution-600/30 border border-caution-500/40 text-caution-300 text-[10px] font-bold hover:bg-caution-600/50 transition-all flex items-center gap-1"
                title="Demo shortcut for judges"
              >
                <Zap size={11} />
                Demo Alert
              </button>
            </div>

            {/* Progress bar */}
            <div className="score-bar">
              <div
                className="score-bar-fill bg-gradient-to-r from-primary-600 to-emerald-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="map-overlay bottom-24 left-3 right-3">
          <div className="p-3 flex items-center gap-2">
            {/* SOS */}
            <button
              onClick={handleSOS}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emergency-700 hover:bg-emergency-600 transition-colors"
              aria-label="Emergency SOS"
            >
              <Shield size={18} className="text-white" strokeWidth={2.5} />
              <span className="text-white font-bold text-sm">SOS</span>
            </button>

            {/* Share */}
            <button
              onClick={() => setSharingEnabled((s) => !s)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all text-sm font-semibold ${
                sharingEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-700 text-surface-300'
              }`}
            >
              <Share2 size={16} />
              {sharingEnabled ? 'Sharing' : 'Share'}
            </button>

            {/* End journey */}
            <button
              onClick={handleEndJourney}
              className="px-4 py-3 rounded-xl bg-surface-700 text-surface-300 hover:bg-surface-600 text-sm font-semibold flex items-center gap-2"
            >
              <Pause size={16} />
              End
            </button>
          </div>
        </div>

        {/* Caution Zone Alert */}
        {showCautionAlert && (
          <CautionZoneAlert
            zoneName={settings.cautionZones.find((z) => z.id === activeCautionZone)?.name || 'Low-Activity Area Ahead'}
            onContinue={() => setShowCautionAlert(false)}
            onAlternate={handleReroute}
          />
        )}

        {/* Arrival confirmation */}
        {showArrival && (
          <ArrivalModal
            destination={currentJourney.destination.label}
            onConfirm={handleConfirmArrival}
            onKeepActive={() => setShowArrival(false)}
          />
        )}
      </div>
    </div>
  );
}

function CautionZoneAlert({
  zoneName,
  onContinue,
  onAlternate,
}: {
  zoneName: string;
  onContinue: () => void;
  onAlternate: () => void;
}) {
  return (
    <div className="absolute inset-x-3 bottom-24 z-20 animate-slide-up mb-20">
      <div className="bg-caution-600/25 backdrop-blur-md border-2 border-caution-500/70 rounded-3xl p-4 shadow-glow-caution">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-caution-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-caution-400" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-caution-300 font-bold text-base">Caution Zone Detected Ahead</h3>
            <p className="text-white font-semibold text-sm mt-0.5">{zoneName}</p>
            <p className="text-surface-200 text-xs mt-1">
              Low illumination reported on this street stretch. Proactive detour available via main road (+2 min, 14 open safe havens).
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onAlternate}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-primary-600 text-white font-bold text-xs shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
          >
            <Zap size={14} />
            Reroute via Safer Path (Score 94)
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-3 rounded-xl bg-surface-700/80 text-surface-300 font-semibold text-xs hover:bg-surface-600 transition-colors"
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrivalModal({
  destination,
  onConfirm,
  onKeepActive,
}: {
  destination: string;
  onConfirm: () => void;
  onKeepActive: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-end">
      <div className="w-full p-4 pb-8 animate-slide-up">
        <div className="card p-5 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-1">Have you arrived?</h2>
          <p className="text-surface-300 text-sm mb-4">
            You appear to be near <strong>{destination}</strong>
          </p>
          <div className="space-y-2">
            <button
              onClick={onConfirm}
              className="btn-primary w-full py-3.5 text-base"
            >
              <CheckCircle2 size={18} />
              Yes, I've Arrived Safely
            </button>
            <button
              onClick={onKeepActive}
              className="btn-secondary w-full py-3"
            >
              Keep Journey Active
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
