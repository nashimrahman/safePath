// =============================================
// SafePath – Map Explorer Page
// =============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Store, AlertTriangle, LifeBuoy, MapPin } from 'lucide-react';
import { SafeMap } from '../components/SafeMap';
import { useApp } from '../store/AppContext';
import { getPlacesAround, getHazardsAround } from '../data/demoData';

export function MapPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { settings, userPosition, hazards } = state;

  const [showPlaces, setShowPlaces] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showHelp, setShowHelp] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const localPlaces = getPlacesAround(userPosition);
  const localHazards = hazards.length > 0 ? hazards : getHazardsAround(userPosition);

  return (
    <div className="page relative">
      {/* Map */}
      <div className="flex-1 relative">
        <SafeMap
          // No fixed center — auto-detect GPS and fly to it
          autoCenter={!userPosition}
          center={userPosition || undefined}
          zoom={16}
          className="w-full h-full"
          userPosition={userPosition || undefined}
          places={showPlaces ? localPlaces : []}
          hazards={showHazards ? localHazards : []}
          cautionZones={showZones ? settings.cautionZones : []}
          showHelpPoints={showHelp}
          onGpsPosition={(pos) => dispatch({ type: 'SET_USER_POSITION', payload: pos })}
        />

        {/* Top bar */}
        <div className="map-overlay top-14 left-3 right-3">
          <div className="p-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface-700">
              <ArrowLeft size={16} className="text-surface-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-white font-bold text-sm">Map Explorer</h1>
              <p className="text-surface-400 text-xs">
                {userPosition
                  ? `${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)} · GPS Active`
                  : 'Detecting your location…'}
              </p>
            </div>
            <button
              onClick={() => setShowFilters((f) => !f)}
              className={`p-2 rounded-xl transition-all ${showFilters ? 'bg-primary-600' : 'bg-surface-700'}`}
            >
              <Layers size={16} className="text-white" />
            </button>
          </div>

          {/* Filter toggles */}
          {showFilters && (
            <div className="px-3 pb-3 grid grid-cols-2 gap-2 animate-slide-down border-t border-surface-700/50 pt-3">
              <FilterToggle
                icon={<Store size={13} />}
                label="Open Businesses"
                active={showPlaces}
                color="text-emerald-400"
                onToggle={() => setShowPlaces((p) => !p)}
              />
              <FilterToggle
                icon={<AlertTriangle size={13} />}
                label="Reported Hazards"
                active={showHazards}
                color="text-orange-400"
                onToggle={() => setShowHazards((h) => !h)}
              />
              <FilterToggle
                icon={<MapPin size={13} />}
                label="Caution Zones"
                active={showZones}
                color="text-caution-400"
                onToggle={() => setShowZones((z) => !z)}
              />
              <FilterToggle
                icon={<LifeBuoy size={13} />}
                label="Help Points"
                active={showHelp}
                color="text-blue-400"
                onToggle={() => setShowHelp((h) => !h)}
              />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="map-overlay bottom-24 right-3">
          <div className="p-3 space-y-1.5">
            <p className="text-surface-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Legend</p>
            <LegendItem emoji="🟢" label="Open business" />
            <LegendItem emoji="⭕" label="Closed" />
            <LegendItem emoji="⚠️" label="Hazard report" />
            <LegendItem emoji="🟡" label="Caution zone" />
            <LegendItem emoji="🚔" label="Help point" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterToggle({
  icon, label, active, color, onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  color: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
        active ? 'bg-surface-700 text-white' : 'bg-surface-800/50 text-surface-400'
      }`}
    >
      <span className={color}>{icon}</span>
      {label}
    </button>
  );
}

function LegendItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{emoji}</span>
      <span className="text-surface-300 text-[11px]">{label}</span>
    </div>
  );
}
