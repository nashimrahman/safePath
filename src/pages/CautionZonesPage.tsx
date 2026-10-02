// =============================================
// SafePath – Caution Zones Page
// =============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Clock, MapPin, ChevronRight, Crosshair } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { CautionZone } from '../types';

const RADIUS_OPTIONS = [100, 250, 500, 750, 1000];

export function CautionZonesPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { cautionZones } = state.settings;
  const { userPosition } = state;
  const [showCreate, setShowCreate] = useState(false);
  const baseLat = userPosition ? userPosition.lat : 20;
  const baseLng = userPosition ? userPosition.lng : 0;

  return (
    <div className="page">
      <div className="bg-surface-900/95 backdrop-blur-md border-b border-surface-700/50 px-4 pt-14 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Caution Zones</h1>
            <p className="text-surface-300 text-xs">Personal zone warnings</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary px-3 py-2 text-xs"
          >
            <Plus size={15} />
            Add Zone
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Explainer */}
          <div className="flex gap-2 p-3 rounded-2xl bg-caution-500/10 border border-caution-500/20">
            <AlertTriangle size={14} className="text-caution-400 mt-0.5 flex-shrink-0" />
            <p className="text-surface-300 text-xs leading-relaxed">
              Caution zones are personal markers for areas you want to be warned about. They do not indicate danger — they reflect your own judgment about areas to approach with extra awareness.
            </p>
          </div>

          {/* Quick Presets for Demo */}
          <div className="card p-3.5 border border-surface-700/60 bg-surface-900/60">
            <p className="text-surface-300 text-xs font-semibold mb-2">⚡ Quick Presets (1-Tap Demo Add):</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  dispatch({
                    type: 'ADD_CAUTION_ZONE',
                    payload: {
                      id: `zone-${Date.now()}-1`,
                      userId: 'demo-user-001',
                      name: 'North Rail Underpass (Unlit)',
                      latitude: Number((baseLat + 0.0025).toFixed(6)),
                      longitude: Number((baseLng - 0.003).toFixed(6)),
                      radiusMeters: 300,
                      activeFrom: '20:00',
                      activeUntil: '06:00',
                      notifyGuardian: true,
                      suggestAlternateRoute: true,
                      createdAt: new Date().toISOString(),
                    },
                  });
                }}
                className="px-2.5 py-1.5 rounded-xl bg-caution-600/20 border border-caution-500/40 text-caution-300 text-xs font-semibold hover:bg-caution-600/30 transition-all flex items-center gap-1"
              >
                + Rail Underpass
              </button>
              <button
                onClick={() => {
                  dispatch({
                    type: 'ADD_CAUTION_ZONE',
                    payload: {
                      id: `zone-${Date.now()}-2`,
                      userId: 'demo-user-001',
                      name: 'Dimly Lit Canal Path',
                      latitude: Number((baseLat - 0.0022).toFixed(6)),
                      longitude: Number((baseLng + 0.0035).toFixed(6)),
                      radiusMeters: 400,
                      activeFrom: '21:00',
                      activeUntil: '05:30',
                      notifyGuardian: true,
                      suggestAlternateRoute: true,
                      createdAt: new Date().toISOString(),
                    },
                  });
                }}
                className="px-2.5 py-1.5 rounded-xl bg-caution-600/20 border border-caution-500/40 text-caution-300 text-xs font-semibold hover:bg-caution-600/30 transition-all flex items-center gap-1"
              >
                + Canal Path
              </button>
            </div>
          </div>

          {/* Zone list */}
          {cautionZones.length === 0 ? (
            <div className="card p-8 text-center">
              <AlertTriangle size={32} className="text-caution-400 mx-auto mb-3 opacity-50" />
              <p className="text-white font-semibold mb-1">No caution zones</p>
              <p className="text-surface-400 text-sm">Add zones to receive warnings when your route passes nearby.</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={16} />
                Create Zone
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cautionZones.map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  onDelete={() => dispatch({ type: 'REMOVE_CAUTION_ZONE', payload: zone.id })}
                />
              ))}
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <CreateZoneForm
              onSave={(zone) => {
                dispatch({ type: 'ADD_CAUTION_ZONE', payload: zone });
                setShowCreate(false);
              }}
              onCancel={() => setShowCreate(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ZoneCard({ zone, onDelete }: { zone: CautionZone; onDelete: () => void }) {
  return (
    <div className="card-hover p-4 border border-caution-500/20">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-caution-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={18} className="text-caution-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm">{zone.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className="flex items-center gap-1 text-surface-300 text-xs">
              <MapPin size={11} />
              {zone.radiusMeters >= 1000
                ? `${zone.radiusMeters / 1000} km`
                : `${zone.radiusMeters} m`} radius
            </span>
            <span className="flex items-center gap-1 text-surface-300 text-xs">
              <Clock size={11} />
              {zone.activeFrom} – {zone.activeUntil}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {zone.notifyGuardian && (
              <span className="badge badge-caution">Guardian alert</span>
            )}
            {zone.suggestAlternateRoute && (
              <span className="badge bg-primary-500/20 text-primary-300 border border-primary-500/30">
                <ChevronRight size={9} />
                Alt route
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-xl hover:bg-emergency-600/20 text-surface-400 hover:text-emergency-400 transition-all"
          aria-label="Delete zone"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function CreateZoneForm({
  onSave,
  onCancel,
}: {
  onSave: (zone: CautionZone) => void;
  onCancel: () => void;
}) {
  const { state } = useApp();
  const gpsPosition = state.userPosition;

  const [name, setName] = useState('');
  const [radius, setRadius] = useState(500);
  const [from, setFrom] = useState('20:00');
  const [until, setUntil] = useState('06:00');
  const [notifyGuardian, setNotifyGuardian] = useState(false);
  const [suggestAlt, setSuggestAlt] = useState(true);
  // Manual lat/lng fallback — pre-filled with GPS if available
  const [manualLat, setManualLat] = useState(gpsPosition ? String(gpsPosition.lat.toFixed(5)) : '');
  const [manualLng, setManualLng] = useState(gpsPosition ? String(gpsPosition.lng.toFixed(5)) : '');
  const [formError, setFormError] = useState('');

  function handleSave() {
    if (!name.trim()) { setFormError('Zone name is required'); return; }

    // Resolve coordinates: GPS position is the zone centre (i.e. "near here")
    // If GPS is unavailable, use manually entered coordinates
    const lat = gpsPosition ? gpsPosition.lat : parseFloat(manualLat);
    const lng = gpsPosition ? gpsPosition.lng : parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setFormError('Enter valid coordinates (lat −90 to 90, lng −180 to 180)');
      return;
    }

    console.log('NEW CAUTION ZONE coordinates:', { lat, lng });

    onSave({
      id: `zone-${Date.now()}`,
      userId: state.settings.user.id,
      name: name.trim(),
      latitude: lat,
      longitude: lng,
      radiusMeters: radius,
      activeFrom: from,
      activeUntil: until,
      notifyGuardian,
      suggestAlternateRoute: suggestAlt,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="card p-4 border border-caution-500/30 animate-slide-up space-y-4">
      <h3 className="text-white font-bold text-base flex items-center gap-2">
        <Plus size={16} className="text-caution-400" />
        Create Caution Zone
      </h3>

      {/* GPS / Location status */}
      <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs ${
        gpsPosition
          ? 'bg-emerald-500/10 border border-emerald-500/30'
          : 'bg-yellow-500/10 border border-yellow-500/30'
      }`}>
        <Crosshair size={13} className={gpsPosition ? 'text-emerald-400' : 'text-yellow-400'} />
        <span className={gpsPosition ? 'text-emerald-300' : 'text-yellow-300'}>
          {gpsPosition
            ? `Zone placed at your GPS location: ${gpsPosition.lat.toFixed(5)}, ${gpsPosition.lng.toFixed(5)}`
            : 'GPS unavailable — enter coordinates manually below'}
        </span>
      </div>

      {formError && (
        <p className="text-emergency-400 text-xs bg-emergency-500/10 border border-emergency-500/30 rounded-lg px-3 py-2">
          ⚠️ {formError}
        </p>
      )}

      <div>
        <label className="text-surface-300 text-xs mb-1 block">Zone name</label>
        <input
          className="input"
          placeholder="e.g. Dark Alley Near Station"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Manual coords — only shown when GPS is unavailable */}
      {!gpsPosition && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-surface-300 text-xs mb-1 block">Latitude</label>
            <input
              className="input text-xs"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="e.g. 26.1445"
              type="number"
              step="any"
            />
          </div>
          <div>
            <label className="text-surface-300 text-xs mb-1 block">Longitude</label>
            <input
              className="input text-xs"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="e.g. 91.7362"
              type="number"
              step="any"
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-surface-300 text-xs mb-2 block">Radius</label>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                radius === r
                  ? 'bg-caution-600/30 border border-caution-500/60 text-caution-300'
                  : 'bg-surface-800 border border-surface-700 text-surface-300 hover:border-surface-600'
              }`}
            >
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-surface-300 text-xs mb-1 block">Active from</label>
          <input type="time" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-surface-300 text-xs mb-1 block">Active until</label>
          <input type="time" className="input" value={until} onChange={(e) => setUntil(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setSuggestAlt((s) => !s)}
            className={`w-10 h-5 rounded-full transition-all ${suggestAlt ? 'bg-primary-500' : 'bg-surface-700'} relative`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${suggestAlt ? 'left-5' : 'left-0.5'}`} />
          </div>
          <span className="text-surface-200 text-sm">Suggest alternate route</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setNotifyGuardian((n) => !n)}
            className={`w-10 h-5 rounded-full transition-all ${notifyGuardian ? 'bg-primary-500' : 'bg-surface-700'} relative`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${notifyGuardian ? 'left-5' : 'left-0.5'}`} />
          </div>
          <span className="text-surface-200 text-sm">Notify guardian</span>
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} className="btn-primary flex-1 disabled:opacity-50" disabled={!name.trim()}>
          Save Zone
        </button>
        <button onClick={onCancel} className="btn-secondary px-4">
          Cancel
        </button>
      </div>
    </div>
  );
}
