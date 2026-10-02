// =============================================
// SafePath – Nearby Help Page
// =============================================
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Navigation, Shield, Heart, Clock } from 'lucide-react';
import { getPlacesAround } from '../data/demoData';
import { useApp } from '../store/AppContext';
import { haversineDistance } from '../services/routeScoring';
import type { Place } from '../types';

const HELP_CATEGORIES = ['police', 'hospital', 'clinic', 'campus_security', 'help_center'];

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  police: { icon: '🚔', label: 'Police Station', color: 'text-blue-400' },
  hospital: { icon: '🏥', label: 'Hospital', color: 'text-emerald-400' },
  clinic: { icon: '🩺', label: 'Clinic', color: 'text-emerald-400' },
  campus_security: { icon: '🛡️', label: 'Campus Security', color: 'text-primary-400' },
  help_center: { icon: '🆘', label: 'Help Centre', color: 'text-caution-400' },
};

export function NearbyHelpPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { userPosition } = state;

  const center = userPosition || { lat: 20, lng: 0 };
  const places = getPlacesAround(userPosition);

  const helpPlaces: (Place & { distanceM: number })[] = places
    .filter((p) => HELP_CATEGORIES.includes(p.category))
    .map((p) => ({
      ...p,
      distanceM: Math.round(haversineDistance(center.lat, center.lng, p.latitude, p.longitude)),
    }))
    .sort((a, b) => a.distanceM - b.distanceM);

  return (
    <div className="page">
      <div className="bg-surface-900/95 backdrop-blur-md border-b border-surface-700/50 px-4 pt-14 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Nearby Help</h1>
            <p className="text-surface-300 text-xs">Verified assistance locations</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Disclaimer */}
          <div className="flex gap-2 p-3 rounded-2xl bg-primary-600/10 border border-primary-500/20">
            <Shield size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-surface-300 text-xs leading-relaxed">
              These locations are potential assistance points in the area. Contacting emergency services directly (999/911) is always recommended in an emergency.
            </p>
          </div>

          {/* Emergency call shortcut */}
          <div className="card p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emergency-700/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Phone size={22} className="text-emergency-400" />
            </div>
            <div className="flex-1">
              <p className="text-emergency-300 font-bold text-sm">Emergency Services</p>
              <p className="text-surface-400 text-xs">In immediate danger, call 999 (UK) or 911 (US)</p>
            </div>
            <a
              href="tel:999"
              className="px-3 py-2 bg-emergency-700/40 rounded-xl text-emergency-300 font-bold text-sm hover:bg-emergency-600/40 transition-colors"
            >
              Call
            </a>
          </div>

          {/* Help places */}
          <div>
            <p className="section-header">Assistance Points Nearby</p>
            <div className="space-y-3">
              {helpPlaces.map((place) => {
                const config = CATEGORY_CONFIG[place.category];
                return (
                  <div key={place.id} className="card-hover p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-surface-800 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm">{place.name}</h3>
                        <p className={`text-xs font-medium mt-0.5 ${config.color}`}>{config.label}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                          <span className="flex items-center gap-1 text-surface-300 text-xs">
                            <MapPin size={11} />
                            {place.distanceM < 1000
                              ? `${place.distanceM} m away`
                              : `${(place.distanceM / 1000).toFixed(1)} km away`}
                          </span>
                          {place.openingHours && (
                            <span className="flex items-center gap-1 text-surface-300 text-xs">
                              <Clock size={11} />
                              {place.openingHours}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <span className={`badge text-[10px] ${
                            place.openingStatus === 'open'
                              ? 'badge-open'
                              : place.openingStatus === 'closed'
                              ? 'badge-closed'
                              : 'badge-unknown'
                          }`}>
                            {place.openingStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <button className="p-2 rounded-xl hover:bg-primary-600/20 text-surface-400 hover:text-primary-400 transition-all">
                        <Navigation size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mental health note */}
          <div className="card p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Heart size={22} className="text-pink-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Mental Health Support</p>
              <p className="text-surface-400 text-xs">Samaritans (UK): 116 123 — Free, 24/7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
