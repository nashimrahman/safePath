// =============================================
// SafePath – Home Dashboard
// =============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Navigation, Map, Shield, Mic, AlertTriangle, Users, ChevronRight,
  Zap, MapPin, CheckCircle2, Radio, UserCircle, Loader2
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { DemoBanner } from '../components/DemoBanner';

interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  path: string;
  accent: string;
  iconBg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'map',
    label: 'Explore Map',
    sublabel: 'View your area',
    icon: Map,
    path: '/map',
    accent: 'border-primary-500/30',
    iconBg: 'bg-primary-600/20',
  },
  {
    id: 'voice',
    label: 'Voice Guard',
    sublabel: 'Hands-free keyword',
    icon: Mic,
    path: '/voice-guard',
    accent: 'border-violet-500/30',
    iconBg: 'bg-violet-600/20',
  },
  {
    id: 'zones',
    label: 'Caution Zones',
    sublabel: 'Manage your zones',
    icon: AlertTriangle,
    path: '/caution-zones',
    accent: 'border-caution-500/30',
    iconBg: 'bg-caution-500/20',
  },
  {
    id: 'profile',
    label: 'My Safety Profile',
    sublabel: 'Contacts & profile',
    icon: UserCircle,
    path: '/profile',
    accent: 'border-emerald-500/30',
    iconBg: 'bg-emerald-600/20',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { settings, currentJourney, activeEmergency, userPosition, gpsLoading } = state;

  // --- GPS Detection ---
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      dispatch({ type: 'SET_GPS_LOADING', payload: false });
      setGpsError('GPS not supported by this browser');
      return;
    }
    dispatch({ type: 'SET_GPS_LOADING', payload: true });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch({
          type: 'SET_USER_POSITION',
          payload: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        dispatch({ type: 'SET_GPS_LOADING', payload: false });
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location access denied — enable in browser settings');
        } else {
          setGpsError('Unable to detect location — check device GPS');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStartDemo() {
    dispatch({ type: 'START_DEMO_MODE' });
    navigate('/journey');
  }

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  });

  // Build location status string
  const locationStatus = gpsLoading
    ? null // show spinner
    : gpsError
    ? gpsError
    : userPosition
    ? `GPS Active · ${userPosition.lat.toFixed(4)}°N, ${Math.abs(userPosition.lng).toFixed(4)}°${
        userPosition.lng >= 0 ? 'E' : 'W'
      }`
    : 'Location unavailable';

  return (
    <div className="page">
      <DemoBanner />

      {/* Header */}
      <div className="relative overflow-hidden pt-10 pb-6 px-4">
        {/* Gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-surface-900 to-surface-950" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/10 rounded-full translate-y-24 -translate-x-24 blur-3xl" />

        <div className="relative z-10 max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-glow-primary">
                <Navigation size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-surface-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient leading-none">SafePath</h1>
              <p className="text-[11px] text-surface-300 mt-0.5">Informed Journey Planner</p>
            </div>
          </div>

          {/* Greeting */}
          <p className="text-surface-300 text-sm mb-1">{greeting},</p>
          <h2 className="text-2xl font-bold text-white mb-1">{settings.user.name}</h2>

          {/* Location indicator */}
          <div className="flex items-center gap-2 mt-3">
            {gpsLoading ? (
              <Loader2 size={12} className="text-primary-400 animate-spin" />
            ) : (
              <div className={`status-dot-active ${gpsError ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
            )}
            <span className={`text-xs ${
              gpsError ? 'text-yellow-400' :
              gpsLoading ? 'text-surface-400' :
              userPosition ? 'text-emerald-300' : 'text-surface-400'
            }`}>
              {gpsLoading
                ? 'Detecting your GPS location…'
                : currentJourney?.status === 'active'
                ? `Active journey to ${currentJourney.destination.label}`
                : locationStatus}
            </span>
          </div>

          {/* Active emergency banner */}
          {activeEmergency && (
            <button
              onClick={() => navigate('/emergency-status')}
              className="mt-4 w-full flex items-center gap-3 p-3 rounded-2xl bg-emergency-600/20 border border-emergency-500/50 animate-pulse"
            >
              <div className="w-8 h-8 bg-emergency-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Radio size={16} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-emergency-300 font-bold text-sm">Emergency Active</p>
                <p className="text-emergency-400/70 text-xs">Tap to view status</p>
              </div>
              <ChevronRight size={16} className="text-emergency-400 ml-auto" />
            </button>
          )}

          {/* Active journey banner */}
          {currentJourney?.status === 'active' && !activeEmergency && (
            <button
              onClick={() => navigate('/live-journey')}
              className="mt-4 w-full flex items-center gap-3 p-3 rounded-2xl bg-primary-600/20 border border-primary-500/50"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Navigation size={16} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-primary-300 font-bold text-sm">Journey in Progress</p>
                <p className="text-primary-400/70 text-xs">To: {currentJourney.destination.label}</p>
              </div>
              <ChevronRight size={16} className="text-primary-400 ml-auto" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Problem vs SafePath Value Proposition (10-Second Understanding) */}
          <div className="card p-4 border border-primary-500/30 bg-gradient-to-br from-surface-900 via-primary-950/30 to-surface-900">
            <div className="flex items-center justify-between mb-2">
              <span className="badge bg-primary-500/20 text-primary-300 border border-primary-500/40 text-[10px] font-bold uppercase tracking-wider">
                Why SafePath?
              </span>
              <span className="text-[11px] text-surface-400">Proactive vs Reactive</span>
            </div>
            <p className="text-white text-xs font-semibold mb-2">
              Traditional maps optimize for the fastest route — often leading through dark, deserted alleys.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2.5 rounded-xl bg-surface-800/80 border border-red-500/20">
                <p className="text-red-400 text-[11px] font-bold flex items-center gap-1">
                  ✕ Standard Maps
                </p>
                <p className="text-surface-300 text-[10px] mt-0.5 leading-tight">
                  Blindly calculates shortest distance into unlit corners.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-800/80 border border-emerald-500/20">
                <p className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  ✓ SafePath
                </p>
                <p className="text-surface-300 text-[10px] mt-0.5 leading-tight">
                  Prioritizes verified lighting, open shops & proactive reroutes.
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => navigate('/journey')}
            className="w-full relative overflow-hidden rounded-3xl p-5 text-left group transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Navigation size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium">Ready to travel?</p>
                  <h3 className="text-white font-bold text-lg leading-tight">Plan Safe Journey</h3>
                </div>
              </div>
              <p className="text-white/70 text-xs leading-relaxed">
                Compare verified street lighting, active safe havens, and avoid known caution zones before you leave.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-white text-xs font-semibold bg-white/10 px-3 py-1 rounded-full">
                  Compare Route Scores →
                </span>
                <ChevronRight size={18} className="text-white/80 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Emergency SOS */}
          <button
            onClick={() => navigate('/sos')}
            className="w-full flex items-center gap-4 p-4 rounded-3xl group"
            style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #be123c 100%)' }}
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold text-base">Emergency SOS</h3>
              <p className="text-white/60 text-xs">Alert trusted contacts instantly</p>
            </div>
            <div className="w-3 h-3 bg-emergency-400 rounded-full animate-ping-slow" />
          </button>

          {/* Quick Actions Grid */}
          <div>
            <p className="section-header">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className={`card-hover p-4 flex flex-col gap-3 text-left border ${action.accent}`}
                  >
                    <div className={`w-9 h-9 ${action.iconBg} rounded-xl flex items-center justify-center`}>
                      <Icon size={17} strokeWidth={2} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{action.label}</p>
                      <p className="text-surface-300 text-xs mt-0.5">{action.sublabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Summary */}
          <div>
            <p className="section-header">Your Status</p>
            <div className="card p-4 space-y-3">
              <StatusRow
                icon={<Users size={15} className="text-primary-400" />}
                label="Trusted Contacts"
                value={`${settings.trustedContacts.length} configured`}
                ok={settings.trustedContacts.length > 0}
              />
              <StatusRow
                icon={<AlertTriangle size={15} className="text-caution-400" />}
                label="Caution Zones"
                value={`${settings.cautionZones.length} active`}
                ok={settings.cautionZones.length >= 0}
              />
              <StatusRow
                icon={<Mic size={15} className="text-violet-400" />}
                label="Voice Guard"
                value={settings.voiceGuard.enabled ? `Phrase: "${settings.voiceGuard.phrase}"` : 'Off'}
                ok={settings.voiceGuard.enabled}
              />
              <StatusRow
                icon={<MapPin size={15} className="text-emerald-400" />}
                label="Location"
                value={
                  gpsLoading
                    ? 'Detecting GPS…'
                    : userPosition
                    ? `${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}`
                    : gpsError || 'Unavailable'
                }
                ok={!!userPosition}
              />
            </div>
          </div>

          {/* 3-Minute Pitch Demo Controller */}
          <div className="card p-4 border border-violet-500/40 bg-gradient-to-br from-surface-900 to-violet-950/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-violet-600/20 rounded-2xl flex items-center justify-center">
                <Zap size={20} className="text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">3-Minute Judge Demo Flow</h3>
                <p className="text-surface-400 text-xs">Step-by-step pitch walkthrough</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 p-2 rounded-xl bg-surface-800/60 text-xs">
                <span className="w-5 h-5 rounded-full bg-primary-600/30 text-primary-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                <div>
                  <p className="text-white font-medium">Compare Route Explanations</p>
                  <p className="text-surface-400 text-[11px]">See why Route A (Score 94) beats Route B (Score 61: dark alleyway).</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-xl bg-surface-800/60 text-xs">
                <span className="w-5 h-5 rounded-full bg-caution-600/30 text-caution-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                <div>
                  <p className="text-white font-medium">Proactive Caution Alert & 1-Tap Reroute</p>
                  <p className="text-surface-400 text-[11px]">Live HUD detects unlit underpass and automatically reroutes.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-xl bg-surface-800/60 text-xs">
                <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                <div>
                  <p className="text-white font-medium">Hands-free Voice Guard</p>
                  <p className="text-surface-400 text-[11px]">Speech recognition + audio visualizer triggers emergency alert.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-xl bg-surface-800/60 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">4</span>
                <div>
                  <p className="text-white font-medium">Guardian Response Dashboard</p>
                  <p className="text-surface-400 text-[11px]">Simulates live guardian view with real telemetry payload.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartDemo}
              className="btn-primary w-full py-3 text-sm font-bold shadow-glow-primary"
            >
              <Zap size={16} />
              Start Guided Demo (Step 1)
            </button>
          </div>

          {/* Ethical Disclaimer */}
          <div className="p-3 rounded-2xl bg-surface-800/50 border border-surface-700/30">
            <p className="text-surface-400 text-[11px] leading-relaxed text-center">
              🛡️ SafePath provides objective route context (verified streetlights, active open storefronts & community hazards)
              to empower informed decisions. It does not replace emergency 999/911 services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  icon, label, value, ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 bg-surface-800 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-surface-300 text-xs">{label}</p>
        <p className="text-white text-xs font-medium truncate">{value}</p>
      </div>
      {ok ? (
        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-surface-500 flex-shrink-0" />
      )}
    </div>
  );
}
