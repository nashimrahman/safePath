import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Phone, X, MapPin, Clock, Zap, Volume2, VolumeX, MessageSquare, Radio } from 'lucide-react';
import { useApp } from '../store/AppContext';

const COUNTDOWN_SECONDS = 5;

function playSirenSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.6);
    osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.9);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.4);
  } catch {
    // Audio synthesis blocked by autoplay policy
  }
}

export function SOSPage() {
  const navigate = useNavigate();
  const { state, triggerSOS, dispatch } = useApp();
  const { settings, activeEmergency, currentJourney, userPosition } = state;

  const [countdown, setCountdown] = useState<number | null>(null);
  const [activated, setActivated] = useState(false);
  const [sirenOn, setSirenOn] = useState(false);
  const [strobeOn, setStrobeOn] = useState(false);
  const sirenIntervalRef = useRef<number | null>(null);

  // Use real GPS if available, else journey position, else neutral fallback
  const pos = userPosition || currentJourney?.currentPosition || { lat: 20, lng: 0 };

  // Start countdown when page loads if no active emergency
  useEffect(() => {
    if (!activeEmergency) {
      setCountdown(COUNTDOWN_SECONDS);
    } else {
      setActivated(true);
    }
  }, [activeEmergency]);

  // Countdown ticker
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      handleActivate();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // Siren effect loop
  useEffect(() => {
    if (sirenOn) {
      playSirenSound();
      sirenIntervalRef.current = window.setInterval(playSirenSound, 1500);
    } else if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    return () => {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    };
  }, [sirenOn]);

  function handleActivate() {
    triggerSOS(pos.lat, pos.lng, 'sos_manual');
    setActivated(true);
    setCountdown(null);
  }

  function handleInstantActivate() {
    handleActivate();
  }

  function handleCancel() {
    setCountdown(null);
    setSirenOn(false);
    navigate(-1);
  }

  function handleResolve() {
    setSirenOn(false);
    dispatch({ type: 'RESOLVE_EMERGENCY' });
    navigate('/');
  }

  const guardians = settings.trustedContacts.filter(
    (c) => c.notificationPreferences.notifyOnSOS
  );

  const smsBody = encodeURIComponent(
    `🚨 EMERGENCY: ${settings.user.name} triggered SafePath SOS near Greenfield Campus! Live location: https://maps.google.com/?q=${pos.lat.toFixed(5)},${pos.lng.toFixed(5)} at ${new Date().toLocaleTimeString()}`
  );

  return (
    <div className={`page relative ${strobeOn ? 'animate-pulse bg-red-950/80' : ''}`}>
      {/* Header */}
      <div className={`relative pt-14 pb-6 px-4 ${activated ? 'bg-emergency-700/20' : 'bg-surface-900'} border-b border-emergency-600/30`}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <X size={20} />
          </button>
          <div className="flex-1">
            <h1 className={`text-xl font-black ${activated ? 'text-emergency-300' : 'text-white'}`}>
              {activated ? '🚨 EMERGENCY ACTIVE' : 'Emergency SOS'}
            </h1>
            <p className="text-surface-300 text-xs">
              {activated ? 'Telemetry captured · Guardian broadcast ready' : 'Alert your trusted contacts'}
            </p>
          </div>
          {activated && (
            <div className="w-3 h-3 bg-emergency-500 rounded-full animate-ping" />
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Countdown / Activation */}
          {!activated && countdown !== null && (
            <div className="card p-6 text-center animate-scale-in border border-emergency-500/40">
              <div className="w-24 h-24 rounded-full bg-emergency-700/30 border-4 border-emergency-600/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-black text-emergency-400">{countdown}</span>
              </div>
              <h2 className="text-white font-bold text-xl mb-1">Activating in {countdown}s</h2>
              <p className="text-surface-300 text-xs mb-5">
                Will broadcast GPS alert to {guardians.length} trusted guardian{guardians.length !== 1 ? 's' : ''}.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleInstantActivate}
                  className="btn-emergency w-full py-4 text-base shadow-glow-emergency flex items-center justify-center gap-2"
                >
                  <Zap size={20} />
                  Instant SOS (0s Bypass)
                </button>
                <button onClick={handleCancel} className="btn-secondary w-full py-3">
                  <X size={16} />
                  Cancel – I'm Safe
                </button>
              </div>
            </div>
          )}

          {/* Emergency Active State */}
          {activated && activeEmergency && (
            <>
              {/* Status card */}
              <div className="p-4 rounded-3xl bg-emergency-700/20 border-2 border-emergency-600/50 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emergency-600 rounded-2xl flex items-center justify-center shadow-glow-emergency">
                    <Shield size={22} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-emergency-200 font-black text-lg">Emergency SOS Active</h2>
                    <p className="text-surface-300 text-xs">
                      {new Date(activeEmergency.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 mb-2 p-2 bg-surface-800/50 rounded-xl">
                  <MapPin size={14} className="text-emergency-400" />
                  <p className="text-surface-200 text-xs">
                    Location captured: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
                  </p>
                </div>
                <div className="flex items-center gap-2 p-2 bg-surface-800/50 rounded-xl">
                  <Clock size={14} className="text-surface-400" />
                  <p className="text-surface-200 text-xs">
                    Time: {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Guardian notifications */}
              <div className="card p-4">
                <p className="section-header">Guardian Notifications</p>
                {guardians.length === 0 ? (
                  <p className="text-surface-400 text-sm">No contacts configured for SOS alerts.</p>
                ) : (
                  <div className="space-y-2">
                    {guardians.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-3 p-2.5 bg-surface-800 rounded-xl">
                        <div className="w-8 h-8 bg-primary-600/30 rounded-full flex items-center justify-center text-sm font-bold text-primary-300">
                          {contact.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{contact.name}</p>
                          <p className="text-surface-400 text-xs">{contact.phone}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                          <span className="text-emerald-400 text-xs font-medium">Simulated</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency message preview */}
              <div className="card p-4">
                <p className="section-header">Emergency Message</p>
                <div className="p-3 bg-surface-800 rounded-xl">
                  <p className="text-surface-200 text-xs leading-relaxed italic">
                    "SafePath Emergency Alert: An emergency was triggered during an active journey.
                    Latest available location: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}.
                    Time: {new Date().toLocaleString()}.
                    Please contact the user and seek appropriate emergency assistance if necessary."
                  </p>
                </div>
              </div>

              {/* Deterrent Controls (Acoustic Siren & Strobe) */}
              <div className="card p-4 border border-emergency-500/40 bg-surface-900/90 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 size={14} className="text-emergency-400" />
                    Immediate Deterrent Tools
                  </p>
                  <span className="badge bg-emergency-500/20 text-emergency-300 text-[10px]">
                    Attention Magnet
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSirenOn((s) => !s)}
                    className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      sirenOn
                        ? 'bg-emergency-600 text-white animate-bounce'
                        : 'bg-surface-800 border border-emergency-500/40 text-emergency-300 hover:bg-emergency-900/40'
                    }`}
                  >
                    {sirenOn ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    {sirenOn ? 'Stop Siren' : '🔊 Sound Siren'}
                  </button>
                  <button
                    onClick={() => setStrobeOn((s) => !s)}
                    className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      strobeOn
                        ? 'bg-yellow-400 text-black font-black animate-pulse'
                        : 'bg-surface-800 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-900/20'
                    }`}
                  >
                    ⚡ {strobeOn ? 'Strobe ON' : 'Strobe Beacon'}
                  </button>
                </div>
              </div>

              {/* Actions & Dispatch */}
              <div className="space-y-2.5">
                {/* 1-Tap SMS Dispatch */}
                <a
                  href={`sms:${guardians[0]?.phone || ''}?body=${smsBody}`}
                  className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-glow-primary"
                >
                  <MessageSquare size={18} />
                  Send Live GPS SMS to Guardians
                </a>

                <div className="grid grid-cols-2 gap-2">
                  {guardians[0] && (
                    <a
                      href={`tel:${guardians[0].phone}`}
                      className="py-3 px-3 rounded-xl bg-surface-800 border border-surface-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-700 transition-colors"
                    >
                      <Phone size={14} className="text-emerald-400" />
                      Call {guardians[0].name.split(' ')[0]}
                    </a>
                  )}
                  <a
                    href="tel:999"
                    className="py-3 px-3 rounded-xl bg-emergency-700/40 border border-emergency-600/50 text-emergency-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emergency-700 transition-colors"
                  >
                    <Phone size={14} className="text-emergency-400" />
                    Dial 999 / 911
                  </a>
                </div>

                <button
                  onClick={() => navigate('/response-dashboard')}
                  className="btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2"
                >
                  <Radio size={14} className="text-violet-400" />
                  View Guardian Response Dashboard
                </button>

                <button
                  onClick={handleResolve}
                  className="w-full py-3 rounded-2xl border border-surface-600 text-surface-300 font-semibold text-xs hover:bg-surface-800 transition-colors"
                >
                  <X size={15} className="inline mr-1" />
                  Resolve SOS — I Am Safe Now
                </button>
              </div>

              {/* Ethical Disclaimer */}
              <div className="p-3 rounded-2xl bg-surface-800/50 border border-surface-700/30">
                <p className="text-surface-400 text-[11px] text-center leading-relaxed">
                  ⚠️ DEMO MODE: Emergency alerts are prepared locally and dispatched via native device SMS/dialer.
                  No automatic police dispatches are falsely simulated.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
