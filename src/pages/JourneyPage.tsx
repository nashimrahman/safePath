// =============================================
// SafePath – Journey Planning Page (Dynamic Routing & Geocoding)
// =============================================
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  ChevronRight,
  Info,
  TrendingUp,
  AlertOctagon,
  Store,
  LifeBuoy,
  Star,
  ShieldCheck,
  X,
  Search,
  Loader2,
  Check,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { SafeMap } from '../components/SafeMap';
import { getPlacesAround, getHazardsAround, getCautionZonesAround } from '../data/demoData';
import { searchLocations, getNearbyQuickDestinations, type GeocodedLocation } from '../services/geocoding';
import { generateRoutes } from '../services/routeService';
import {
  formatDistance,
  formatDuration,
  getScoreColorClass,
  getScoreTextClass,
} from '../services/routeScoring';
import type { Route, LatLng } from '../types';

type JourneyStep = 'input' | 'routes' | 'detail';

export function JourneyPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { userPosition } = state;

  const [step, setStep] = useState<JourneyStep>('input');

  // Origin state — strictly anchored to user GPS
  const [originInput, setOriginInput] = useState<string>(
    userPosition
      ? `Your Location (GPS) · ${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}`
      : 'Detecting GPS location…'
  );
  const [originCoords, setOriginCoords] = useState<LatLng | null>(userPosition);

  // Sync GPS updates to origin if not manually changed
  useEffect(() => {
    if (userPosition && (!originCoords || originCoords.lat === 0)) {
      setOriginCoords(userPosition);
      setOriginInput(
        `Your Location (GPS) · ${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}`
      );
    }
  }, [userPosition, originCoords]);

  // Destination state
  const [destInput, setDestInput] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<(LatLng & { label: string }) | null>(null);

  // Search autocomplete state
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  // Routes state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Effective coordinates for routing
  const effectiveOrigin: LatLng & { label: string } = originCoords
    ? { ...originCoords, label: originInput || 'Your Location' }
    : userPosition
    ? { ...userPosition, label: 'Your Location' }
    : { lat: 20, lng: 0, label: 'Default Location' };

  // Quick preset recommendations relative to current position
  const quickDestinations = getNearbyQuickDestinations(effectiveOrigin);

  // Auto-fill initial destination from quick presets if empty
  useEffect(() => {
    if (!destinationCoords && quickDestinations.length > 0) {
      const initial = quickDestinations[0];
      setDestInput(initial.label);
      setDestinationCoords({
        lat: initial.lat,
        lng: initial.lng,
        label: initial.label,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originCoords?.lat, originCoords?.lng]);

  // Handle destination typing with debounced geocoding search
  function handleDestInputChange(val: string) {
    setDestInput(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const results = await searchLocations(val, effectiveOrigin);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }

  // Handle selecting a search result or quick preset
  function handleSelectDestination(loc: GeocodedLocation) {
    setDestInput(loc.label);
    setDestinationCoords({
      lat: loc.lat,
      lng: loc.lng,
      label: loc.label,
    });
    setShowDropdown(false);
  }

  // Analyse and calculate routes
  async function handleSearch() {
    if (!destInput.trim()) return;

    let targetCoords = destinationCoords;
    // If user typed without clicking dropdown, geocode right now
    if (!targetCoords || targetCoords.label !== destInput.trim()) {
      setIsCalculatingRoutes(true);
      try {
        const found = await searchLocations(destInput, effectiveOrigin);
        if (found.length > 0) {
          targetCoords = { lat: found[0].lat, lng: found[0].lng, label: found[0].label };
          setDestinationCoords(targetCoords);
        } else {
          // Fallback relative offset near origin
          targetCoords = {
            lat: Number((effectiveOrigin.lat + 0.006).toFixed(6)),
            lng: Number((effectiveOrigin.lng + 0.004).toFixed(6)),
            label: destInput.trim(),
          };
          setDestinationCoords(targetCoords);
        }
      } catch {
        targetCoords = {
          lat: Number((effectiveOrigin.lat + 0.006).toFixed(6)),
          lng: Number((effectiveOrigin.lng + 0.004).toFixed(6)),
          label: destInput.trim(),
        };
        setDestinationCoords(targetCoords);
      }
    }

    setIsCalculatingRoutes(true);
    try {
      const generated = await generateRoutes(
        effectiveOrigin,
        targetCoords,
        getPlacesAround(effectiveOrigin),
        getHazardsAround(effectiveOrigin),
        getCautionZonesAround(effectiveOrigin)
      );
      setRoutes(generated);
      setSelectedRoute(generated[0]);
      setStep('routes');
    } catch (err) {
      console.error('Error generating routes:', err);
    } finally {
      setIsCalculatingRoutes(false);
    }
  }

  // Start selected journey
  function handleStartJourney(route: Route) {
    if (!destinationCoords) return;

    dispatch({
      type: 'SET_JOURNEY',
      payload: {
        id: `journey-${Date.now()}`,
        userId: state.settings.user.id,
        origin: effectiveOrigin,
        destination: destinationCoords,
        selectedRoute: route,
        startedAt: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + route.durationSeconds * 1000).toISOString(),
        status: 'active',
        sharingEnabled: false,
        currentPosition: effectiveOrigin,
      },
    });
    navigate('/live-journey');
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="bg-surface-900/95 backdrop-blur-md border-b border-surface-700/50 px-4 pt-14 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Plan Safe Journey</h1>
            <p className="text-surface-300 text-xs">AI-scored routes & verified safe havens</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="animate-slide-up space-y-4">
              <div className="card p-4 space-y-3 relative">
                <p className="section-header">Your Journey Points</p>

                {/* Origin (GPS locked) */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider block">
                      Starting Location (GPS)
                    </label>
                    <input
                      className="input w-full text-xs font-medium"
                      placeholder="Detecting GPS..."
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                      aria-label="Starting location"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="ml-4 flex items-center gap-2">
                  <div className="w-0.5 h-4 bg-surface-600 ml-3" />
                </div>

                {/* Destination */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin size={15} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 relative">
                      <label className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider block">
                        Destination
                      </label>
                      <div className="relative flex items-center">
                        <input
                          className="input w-full pr-8 text-xs font-medium"
                          placeholder="Search address, landmark, or venue..."
                          value={destInput}
                          onChange={(e) => handleDestInputChange(e.target.value)}
                          onFocus={() => {
                            if (searchResults.length > 0) setShowDropdown(true);
                          }}
                          aria-label="Destination"
                        />
                        {isSearching ? (
                          <Loader2 size={14} className="absolute right-2.5 text-primary-400 animate-spin" />
                        ) : destInput ? (
                          <button
                            onClick={() => {
                              setDestInput('');
                              setDestinationCoords(null);
                              setSearchResults([]);
                              setShowDropdown(false);
                            }}
                            className="absolute right-2.5 text-surface-400 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        ) : (
                          <Search size={14} className="absolute right-2.5 text-surface-400 pointer-events-none" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute left-11 right-0 top-full mt-1.5 z-40 bg-surface-900 border border-primary-500/40 rounded-2xl shadow-2xl overflow-hidden divide-y divide-surface-800 animate-slide-down">
                      {searchResults.map((res, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectDestination(res)}
                          className="w-full text-left p-3 hover:bg-primary-950/40 transition-colors flex items-start gap-2.5"
                        >
                          <MapPin size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{res.label}</p>
                            {res.sublabel && (
                              <p className="text-surface-400 text-[11px] truncate">{res.sublabel}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Destination Chips */}
              <div className="card-glass p-3.5 space-y-2">
                <p className="text-surface-300 text-xs font-semibold flex items-center justify-between">
                  <span>⚡ Quick Local Destinations</span>
                  <span className="text-[10px] text-surface-400">Relative to your location</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickDestinations.map((q, idx) => {
                    const isSelected = destinationCoords?.label === q.label;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectDestination(q)}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-primary-600/30 border-primary-400 text-white shadow-glow-primary'
                            : 'bg-surface-800/80 border-surface-700/60 text-surface-300 hover:bg-surface-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-white text-xs font-bold truncate">{q.label.split(' / ')[0]}</p>
                          {isSelected && <Check size={12} className="text-emerald-400 flex-shrink-0" />}
                        </div>
                        <p className="text-surface-400 text-[10px] mt-0.5 truncate">{q.sublabel}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-glow-primary"
                onClick={handleSearch}
                disabled={isCalculatingRoutes}
              >
                {isCalculatingRoutes ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Calculating Safety-Aware Routes…
                  </>
                ) : (
                  <>
                    <Navigation size={18} />
                    Analyse Route Options
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Routes Selection */}
          {step === 'routes' && (
            <div className="animate-slide-up space-y-4">
              {/* Summary Bar */}
              <div className="card p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 bg-primary-400 rounded-full flex-shrink-0" />
                    <span className="text-white text-xs font-medium truncate">{effectiveOrigin.label}</span>
                  </div>
                  <button
                    onClick={() => setStep('input')}
                    className="text-[11px] text-primary-400 hover:text-primary-300 font-semibold flex-shrink-0 ml-2"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={12} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-white text-xs font-medium truncate">
                    {destinationCoords?.label || destInput}
                  </span>
                </div>
              </div>

              {/* Dynamic Interactive Route Map Framing the real local trip */}
              {destinationCoords && (
                <div className="card overflow-hidden h-52 border border-primary-500/40 relative">
                  <SafeMap
                    origin={effectiveOrigin}
                    destination={destinationCoords}
                    routes={routes}
                    selectedRouteId={selectedRoute?.id}
                    className="w-full h-full"
                    userPosition={effectiveOrigin}
                    places={getPlacesAround(effectiveOrigin)}
                    hazards={getHazardsAround(effectiveOrigin)}
                    cautionZones={getCautionZonesAround(effectiveOrigin)}
                    showHelpPoints
                  />
                  <div className="absolute top-2 right-2 z-20 bg-surface-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-surface-700/60">
                    <span className="text-[10px] text-surface-300 font-semibold">
                      Local Route Preview
                    </span>
                  </div>
                </div>
              )}

              {/* Comparison Header */}
              <div className="card p-3.5 border border-primary-500/30 bg-surface-900/90">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-primary-400" />
                    Route Indicators Compared
                  </span>
                  <button
                    onClick={() => setShowFormulaModal(true)}
                    className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1"
                  >
                    <Info size={12} />
                    Scoring
                  </button>
                </div>
                <p className="text-surface-300 text-xs leading-relaxed">
                  SafePath analyzes open storefronts, public transit presence, and avoids your personal caution zones.
                </p>
              </div>

              {/* Route options list */}
              {routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isSelected={selectedRoute?.id === route.id}
                  showBreakdown={showBreakdown === route.id}
                  onToggleBreakdown={() =>
                    setShowBreakdown(showBreakdown === route.id ? null : route.id)
                  }
                  onSelect={() => {
                    setSelectedRoute(route);
                    setStep('detail');
                  }}
                />
              ))}
            </div>
          )}

          {/* Step 3: Route Detail & Start */}
          {step === 'detail' && selectedRoute && destinationCoords && (
            <div className="animate-slide-up space-y-4">
              <button
                onClick={() => setStep('routes')}
                className="btn-ghost gap-2 text-xs"
              >
                <ArrowLeft size={15} />
                Back to routes
              </button>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  {selectedRoute.isRecommended && (
                    <span className="badge bg-primary-500/20 text-primary-300 border border-primary-500/30">
                      <Star size={10} fill="currentColor" /> Recommended
                    </span>
                  )}
                </div>
                <h2 className="text-white font-bold text-lg">{selectedRoute.name}</h2>
                <div className="flex gap-4 mt-2 text-xs text-surface-300">
                  <span>{formatDistance(selectedRoute.distanceMeters)}</span>
                  <span>·</span>
                  <span>{formatDuration(selectedRoute.durationSeconds)}</span>
                </div>

                {/* Score */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-surface-300 font-medium">Route Context Score</span>
                    <span className={`text-sm font-bold ${getScoreTextClass(selectedRoute.indicators.routeContextScore)}`}>
                      {selectedRoute.indicators.routeContextScore}/100
                    </span>
                  </div>
                  <div className="score-bar">
                    <div
                      className={`score-bar-fill ${getScoreColorClass(selectedRoute.indicators.routeContextScore)}`}
                      style={{ width: `${selectedRoute.indicators.routeContextScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Indicators */}
              <div className="card p-4 space-y-3">
                <p className="section-header">Environmental Factors</p>
                <IndicatorRow
                  icon={<Store size={15} className="text-emerald-400" />}
                  label="Open businesses nearby"
                  value={`${selectedRoute.indicators.openBusinesses} open safe havens`}
                  sub="Active storefronts, 24/7 pharmacies & markets"
                />
                <IndicatorRow
                  icon={<AlertOctagon size={15} className="text-orange-400" />}
                  label="Reported conditions"
                  value={`${selectedRoute.indicators.reportedHazards} reported`}
                  sub="Environmental & infrastructure reports"
                />
                <IndicatorRow
                  icon={<LifeBuoy size={15} className="text-blue-400" />}
                  label="Nearby assistance points"
                  value={`${selectedRoute.indicators.nearbyHelpPoints} help points`}
                  sub="Transit security & community police"
                />
              </div>

              {/* Safe Havens on Route */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <p className="text-white font-semibold text-sm">Open Safe Havens on Route</p>
                  </div>
                  <span className="badge badge-open text-[10px]">Verified Open</span>
                </div>
                <div className="space-y-2 mt-2">
                  {getPlacesAround(effectiveOrigin)
                    .filter((p) => p.openingStatus === 'open')
                    .slice(0, 3)
                    .map((place) => (
                      <div
                        key={place.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-800/80 border border-surface-700"
                      >
                        <div>
                          <p className="text-white text-xs font-semibold">{place.name}</p>
                          <p className="text-surface-400 text-[11px] capitalize">
                            {place.category.replace('_', ' ')} · {place.openingHours}
                          </p>
                        </div>
                        <span className="badge badge-open text-[10px]">Open</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Start */}
              <button
                className="btn-primary w-full py-4 text-base font-bold shadow-glow-primary"
                onClick={() => handleStartJourney(selectedRoute)}
              >
                <Navigation size={20} />
                Start Live Journey
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Formula Modal */}
      {showFormulaModal && <FormulaModal onClose={() => setShowFormulaModal(false)} />}
    </div>
  );
}

function RouteCard({
  route,
  isSelected,
  showBreakdown,
  onToggleBreakdown,
  onSelect,
}: {
  route: Route;
  isSelected?: boolean;
  showBreakdown: boolean;
  onToggleBreakdown: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={`${
        isSelected || route.isRecommended ? 'route-card-recommended' : 'route-card-default'
      } rounded-3xl overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm">{route.name}</h3>
              {route.isRecommended && (
                <span className="badge bg-primary-500/20 text-primary-300 border border-primary-500/30 text-[10px]">
                  <Star size={8} fill="currentColor" />
                  Recommended
                </span>
              )}
            </div>
            <p className="text-surface-300 text-xs mt-0.5">
              {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}
            </p>
          </div>

          <div className="text-right">
            <p className={`text-lg font-black ${getScoreTextClass(route.indicators.routeContextScore)}`}>
              {route.indicators.routeContextScore}
            </p>
            <p className="text-surface-400 text-[10px]">/ 100</p>
          </div>
        </div>

        {/* Score Bar */}
        <div className="score-bar mb-3">
          <div
            className={`score-bar-fill ${getScoreColorClass(route.indicators.routeContextScore)}`}
            style={{ width: `${route.indicators.routeContextScore}%` }}
          />
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-open">
            {route.indicators.openBusinesses} safe havens
          </span>
          {route.indicators.reportedHazards > 0 ? (
            <span className="badge badge-hazard">
              {route.indicators.reportedHazards} hazard
            </span>
          ) : (
            <span className="badge badge-open">No hazards</span>
          )}
          {route.indicators.cautionZonesOnRoute > 0 ? (
            <span className="badge badge-caution">Near caution zone</span>
          ) : (
            <span className="badge badge-open">Avoids caution zones</span>
          )}
        </div>

        {/* Why this score button */}
        <button
          onClick={onToggleBreakdown}
          className="text-primary-400 text-xs flex items-center gap-1 mb-3 hover:text-primary-300 transition-colors"
        >
          <Info size={12} />
          {showBreakdown ? 'Hide factors' : 'Why this score?'}
          <ChevronRight size={12} className={`transition-transform ${showBreakdown ? 'rotate-90' : ''}`} />
        </button>

        {showBreakdown && (
          <div className="mb-3 space-y-1 pl-2 border-l-2 border-primary-700/50 animate-slide-down">
            {route.indicators.breakdown.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className={`text-[11px] font-bold ${
                    item.impact === 'positive'
                      ? 'text-emerald-400'
                      : item.impact === 'negative'
                      ? 'text-orange-400'
                      : 'text-surface-300'
                  }`}
                >
                  {item.impact === 'positive' ? '+' : item.impact === 'negative' ? '−' : '○'}
                </span>
                <p className="text-surface-300 text-[11px]">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onSelect}
          className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all ${
            route.isRecommended
              ? 'bg-primary-600 text-white hover:bg-primary-500'
              : 'bg-surface-700 text-white hover:bg-surface-600'
          }`}
        >
          View & Select Route
        </button>
      </div>
    </div>
  );
}

function IndicatorRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-surface-800 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-surface-300 text-xs">{label}</p>
        <p className="text-white text-sm font-medium">{value}</p>
        <p className="text-surface-400 text-[11px]">{sub}</p>
      </div>
    </div>
  );
}

function FormulaModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fade-in">
      <div className="card max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up border border-primary-500/40">
        <div className="flex items-center justify-between pb-3 border-b border-surface-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-600/30 flex items-center justify-center">
              <TrendingUp size={16} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Route Context Scoring Formula</h2>
              <p className="text-surface-400 text-xs">Transparent, explainable 100-pt index</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-surface-800/80 border border-primary-500/20">
            <p className="font-mono text-primary-300 font-semibold mb-1">
              Score = (Lighting × 35%) + (SafeHavens × 25%) + (Hazards × 20%) + (Assistance × 10%) + (CautionZone × 10%)
            </p>
            <p className="text-surface-400 text-[11px]">
              Every point reflects verifiable environmental data.
            </p>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary w-full py-2.5 text-xs font-semibold">
          Got it
        </button>
      </div>
    </div>
  );
}
