// =============================================
// SafePath – Emergency Status / Response Dashboard
// =============================================
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Radio, CheckCircle2, User, Navigation, AlertTriangle } from 'lucide-react';
import { SafeMap } from '../components/SafeMap';
import { useApp } from '../store/AppContext';

export function EmergencyStatusPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { activeEmergency, settings, currentJourney } = state;

  const pos = activeEmergency
    ? { lat: activeEmergency.latitude, lng: activeEmergency.longitude }
    : state.userPosition || { lat: 20, lng: 0 };

  if (!activeEmergency) {
    return (
      <div className="page items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <p className="text-white font-bold text-xl">No Active Emergency</p>
        <p className="text-surface-300 text-sm text-center">All clear. No emergency event is currently active.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const typeLabel = {
    sos_manual: 'Manual SOS',
    voice_trigger: 'Voice Phrase Detected',
    no_response: 'No Check-in Response',
  }[activeEmergency.type];

  return (
    <div className="page">
      {/* Header */}
      <div className="bg-emergency-900/40 border-b border-emergency-700/50 px-4 pt-14 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-emergency-200 font-black text-lg flex items-center gap-2">
              <Radio size={18} className="animate-pulse" />
              Emergency Status
            </h1>
            <p className="text-surface-400 text-xs">{typeLabel}</p>
          </div>
          <div className="badge bg-emergency-600/30 text-emergency-300 border border-emergency-600/50 animate-pulse">
            ACTIVE
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Mini map */}
          <div className="card overflow-hidden">
            <div className="h-48">
              <SafeMap
                center={pos}
                zoom={16}
                className="w-full h-full"
                emergencyPosition={pos}
              />
            </div>
            <div className="p-3 flex items-center gap-2">
              <MapPin size={14} className="text-emergency-400" />
              <p className="text-surface-200 text-xs">
                Emergency location: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {/* Event details */}
          <div className="card p-4">
            <p className="section-header">Event Details</p>
            <div className="space-y-2">
              <DetailRow icon={<User size={14} className="text-primary-400" />}
                label="User" value={settings.user.name} />
              <DetailRow icon={<AlertTriangle size={14} className="text-emergency-400" />}
                label="Emergency Type" value={typeLabel} />
              <DetailRow icon={<Clock size={14} className="text-surface-400" />}
                label="Triggered At" value={new Date(activeEmergency.timestamp).toLocaleString()} />
              {currentJourney && (
                <DetailRow
                  icon={<Navigation size={14} className="text-emerald-400" />}
                  label="Journey Destination"
                  value={currentJourney.destination.label}
                />
              )}
              <DetailRow
                icon={<Radio size={14} className="text-caution-400" />}
                label="Status"
                value={activeEmergency.status.charAt(0).toUpperCase() + activeEmergency.status.slice(1)}
              />
            </div>
          </div>

          {/* Guardian Status */}
          <div className="card p-4">
            <p className="section-header">Guardian Notifications</p>
            <div className="space-y-2">
              {settings.trustedContacts
                .filter((c) => c.notificationPreferences.notifyOnSOS)
                .map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 p-2.5 bg-surface-800 rounded-xl">
                    <div className="w-9 h-9 bg-primary-600/20 rounded-full flex items-center justify-center font-bold text-primary-300">
                      {contact.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{contact.name}</p>
                      <p className="text-surface-400 text-xs">{contact.phone} · {contact.relationship}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-emerald-400 text-xs font-medium">Sent (sim)</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Response Actions (Demo admin view) */}
          <div className="card p-4">
            <p className="section-header">Response Dashboard Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary text-xs py-2.5 flex items-center gap-2 justify-center">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Acknowledge
              </button>
              <button
                onClick={() => navigate('/map')}
                className="btn-secondary text-xs py-2.5 flex items-center gap-2 justify-center"
              >
                <Navigation size={14} className="text-primary-400" />
                Open Map
              </button>
            </div>
          </div>

          {/* Resolve */}
          <button
            onClick={() => {
              dispatch({ type: 'RESOLVE_EMERGENCY' });
              navigate('/');
            }}
            className="w-full py-3.5 rounded-2xl border border-surface-600 text-surface-300 font-semibold text-sm hover:bg-surface-800 transition-colors"
          >
            ✓ Resolve — Situation Safe
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 flex items-center justify-center flex-shrink-0">{icon}</div>
      <p className="text-surface-400 text-xs w-32 flex-shrink-0">{label}</p>
      <p className="text-white text-xs font-medium">{value}</p>
    </div>
  );
}
