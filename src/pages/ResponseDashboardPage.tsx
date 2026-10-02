// =============================================
// SafePath – Response Dashboard (Admin/Demo view)
// =============================================
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, MapPin, Clock, User, Navigation, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SafeMap } from '../components/SafeMap';
import { useApp } from '../store/AppContext';
import { getDemoEmergency } from '../data/demoData';

export function ResponseDashboardPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { activeEmergency, settings, currentJourney, userPosition } = state;

  const emergency = activeEmergency || getDemoEmergency(userPosition);
  const pos = { lat: emergency.latitude, lng: emergency.longitude };

  const typeLabel = {
    sos_manual: 'Manual SOS',
    voice_trigger: 'Voice Phrase Detected',
    no_response: 'No Check-in Response',
  }[emergency.type];

  return (
    <div className="page">
      {/* Header */}
      <div className="bg-emergency-900/30 border-b border-emergency-700/40 px-4 pt-14 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-emergency-200 font-black text-lg flex items-center gap-2">
              <Radio size={16} className="animate-pulse" />
              Response Dashboard
            </h1>
            <p className="text-surface-400 text-xs">Simulated demo · Not connected to real emergency services</p>
          </div>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="bg-caution-600/10 border-b border-caution-500/30 px-4 py-2">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <AlertTriangle size={13} className="text-caution-400 flex-shrink-0" />
          <p className="text-caution-300 text-xs">
            DEMO: This dashboard simulates how a response centre could receive alerts. Real emergency services are NOT notified.
          </p>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Emergency banner */}
          <div className={`p-4 rounded-3xl border-2 ${
            emergency.status === 'active'
              ? 'bg-emergency-700/20 border-emergency-600/60'
              : 'bg-surface-800 border-surface-700'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                emergency.status === 'active'
                  ? 'bg-emergency-600 text-white animate-pulse'
                  : 'bg-emerald-700 text-emerald-200'
              }`}>
                {emergency.status === 'active' ? '🚨 NEW EMERGENCY' : '✓ RESOLVED'}
              </div>
            </div>
            <h2 className="text-white font-bold text-lg">{typeLabel}</h2>
            <p className="text-surface-300 text-xs mt-0.5">
              {new Date(emergency.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Map */}
          <div className="card overflow-hidden">
            <div className="h-52">
              <SafeMap
                center={pos}
                zoom={16}
                className="w-full h-full"
                emergencyPosition={pos}
              />
            </div>
          </div>

          {/* Details */}
          <div className="card p-4 space-y-3">
            <p className="section-header">Incident Details</p>
            <DashRow icon={<User size={14} className="text-primary-400" />} label="User" value={settings.user.name} />
            <DashRow icon={<Clock size={14} className="text-surface-400" />} label="Time" value={new Date(emergency.timestamp).toLocaleTimeString()} />
            <DashRow icon={<MapPin size={14} className="text-emergency-400" />} label="Location" value={`${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`} />
            <DashRow icon={<AlertTriangle size={14} className="text-caution-400" />} label="Type" value={typeLabel} />
            {currentJourney && (
              <DashRow icon={<Navigation size={14} className="text-emerald-400" />} label="Destination" value={currentJourney.destination.label} />
            )}
            <DashRow
              icon={<Radio size={14} className="text-violet-400" />}
              label="Guardian Alerts"
              value={`${emergency.guardianNotificationStatus} (simulated)`}
            />
          </div>

          {/* Guardian list */}
          <div className="card p-4">
            <p className="section-header">Guardian Notification Status</p>
            {settings.trustedContacts
              .filter((c) => c.notificationPreferences.notifyOnSOS)
              .map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 py-2 border-b border-surface-700/50 last:border-0">
                  <div className="w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center font-bold text-primary-300 text-sm">
                    {contact.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{contact.name}</p>
                    <p className="text-surface-400 text-xs">{contact.phone}</p>
                  </div>
                  <span className="badge badge-open text-[10px]">✓ Sent</span>
                </div>
              ))}
          </div>

          {/* Actions */}
          <div className="card p-4">
            <p className="section-header">Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary py-3 text-sm flex items-center gap-2 justify-center">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Acknowledge
              </button>
              <button onClick={() => navigate('/map')} className="btn-secondary py-3 text-sm flex items-center gap-2 justify-center">
                <Navigation size={15} className="text-primary-400" />
                Open Map
              </button>
              {activeEmergency && (
                <button
                  onClick={() => {
                    dispatch({ type: 'RESOLVE_EMERGENCY' });
                    navigate('/');
                  }}
                  className="btn-primary py-3 col-span-2 text-sm"
                >
                  ✓ Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 mt-0.5 flex-shrink-0">{icon}</div>
      <span className="text-surface-400 text-xs w-28 flex-shrink-0">{label}</span>
      <span className="text-white text-xs font-medium break-all">{value}</span>
    </div>
  );
}
