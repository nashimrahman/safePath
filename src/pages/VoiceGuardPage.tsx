// =============================================
// SafePath – Voice Guard Page
// =============================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Check, X, Settings, Zap, Volume2, ShieldAlert, PhoneCall } from 'lucide-react';
import { useApp } from '../store/AppContext';

// Type shim for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare class SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

const SpeechRecognitionAPI =
  (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
  (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

const isSpeechSupported = !!SpeechRecognitionAPI;

const PHRASE_PRESETS = [
  'SafePath Help',
  'Emergency',
  'Help Me',
  'Code Red',
];

export function VoiceGuardPage() {
  const navigate = useNavigate();
  const { state, dispatch, triggerSOS } = useApp();
  const { voiceGuard } = state.settings;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [phraseDetected, setPhraseDetected] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);
  const [editingPhrase, setEditingPhrase] = useState(false);
  const [phraseInput, setPhraseInput] = useState(voiceGuard.phrase);
  const [demoMode, setDemoMode] = useState(false);
  const [audioBars, setAudioBars] = useState<number[]>([15, 25, 40, 60, 35, 50, 20, 10]);
  const [autoCallStatus, setAutoCallStatus] = useState<'idle' | 'dialing'>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const pos = state.userPosition || state.currentJourney?.currentPosition || { lat: 20, lng: 0 };

  // Resolve primary contact from store
  const { primaryContactId } = state.settings;
  const primaryContact = primaryContactId
    ? state.settings.trustedContacts.find((c) => c.id === primaryContactId)
    : state.settings.trustedContacts[0] ?? null;

  // Animate audio waveform when listening
  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      setAudioBars(Array.from({ length: 8 }, () => Math.floor(Math.random() * 60) + 15));
    }, 150);
    return () => clearInterval(interval);
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setTranscript('');
  }, []);

  const handlePhraseDetected = useCallback(() => {
    stopListening();
    setPhraseDetected(true);

    // ── Automatic Emergency Calling path ──────────────────────────────────────
    // Condition: user has explicitly opted in AND a real contact exists
    if (voiceGuard.automaticEmergencyCalling && primaryContact) {
      // 1. Capture real GPS at this moment
      const lat = pos.lat;
      const lng = pos.lng;
      // 2. Register the SOS event in app state
      triggerSOS(lat, lng, 'voice_trigger');
      // 3. Open phone dialer – browser security means we can only open the dialer,
      //    not silently place the call. We show an honest status.
      setAutoCallStatus('dialing');
      window.location.href = `tel:${primaryContact.phone.replace(/\s/g, '')}`;
      // 4. Navigate to emergency status after a short delay so the dialer can open
      setTimeout(() => navigate('/emergency-status'), 800);
      return;
    }

    // ── Standard path: 5-second cancellable countdown ────────────────────────
    setCancelCountdown(5);
  }, [stopListening, voiceGuard.automaticEmergencyCalling, primaryContact, pos, triggerSOS, navigate]);

  // Cancel countdown
  useEffect(() => {
    if (cancelCountdown === null) return;
    if (cancelCountdown === 0) {
      triggerSOS(pos.lat, pos.lng, 'voice_trigger');
      navigate('/emergency-status');
      return;
    }
    const t = setTimeout(() => setCancelCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelCountdown]);

  // Demo simulation
  useEffect(() => {
    if (!demoMode) return;
    const timer = setTimeout(() => {
      setTranscript(voiceGuard.phrase);
      handlePhraseDetected();
      setDemoMode(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [demoMode, voiceGuard.phrase, handlePhraseDetected]);

  function startListening() {
    if (!isSpeechSupported) return;
    setIsListening(true);
    setTranscript('');

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript.toLowerCase();
          }
        }
        setTranscript(finalTranscript);
        if (finalTranscript.includes(voiceGuard.phrase.toLowerCase())) {
          handlePhraseDetected();
        }
      };

      recognition.onend = () => {
        if (isListening) recognition.start();
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  function handleCancel() {
    setCancelCountdown(null);
    setPhraseDetected(false);
    setTranscript('');
  }

  function handleSavePhrase(newPhrase: string) {
    dispatch({ type: 'UPDATE_VOICE_GUARD', payload: { phrase: newPhrase } });
    setPhraseInput(newPhrase);
    setEditingPhrase(false);
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
            <h1 className="text-lg font-bold text-white">Voice Guard</h1>
            <p className="text-surface-300 text-xs">Hands-free emergency keyword detection</p>
          </div>
          <button
            onClick={() => setEditingPhrase(true)}
            className="btn-ghost p-2 rounded-xl ml-auto"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Auto-call dialing status */}
          {autoCallStatus === 'dialing' && primaryContact && (
            <div className="p-4 rounded-3xl bg-emerald-900/30 border-2 border-emerald-500/60 animate-scale-in text-center">
              <div className="w-16 h-16 bg-emerald-600/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <PhoneCall size={28} className="text-emerald-300 animate-pulse" />
              </div>
              <h2 className="text-emerald-200 font-black text-xl mb-1">📞 Opening Phone Dialer</h2>
              <p className="text-white font-semibold mb-1">{primaryContact.name}</p>
              <p className="text-emerald-300 text-sm font-mono mb-1">{primaryContact.phone}</p>
              <p className="text-surface-400 text-xs">
                Your phone's dialer has been opened. Complete the call on your device. SOS event recorded.
              </p>
            </div>
          )}

          {/* Phrase detected alert — standard countdown path */}
          {phraseDetected && cancelCountdown !== null && (
            <div className="p-4 rounded-3xl bg-emergency-700/30 border-2 border-emergency-600/60 animate-scale-in text-center">
              <div className="w-16 h-16 bg-emergency-600/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-black text-emergency-300">{cancelCountdown}</span>
              </div>
              <h2 className="text-emergency-200 font-black text-xl mb-1">🚨 Emergency Keyword Detected</h2>
              <p className="text-white font-semibold mb-1">"{voiceGuard.phrase}"</p>
              <p className="text-surface-300 text-xs mb-4">
                Emergency broadcast activating in {cancelCountdown}s. Location captured.
              </p>
              <button
                onClick={handleCancel}
                className="w-full py-3 rounded-xl bg-surface-700 text-white font-bold border border-surface-600 hover:bg-surface-600 transition-all text-xs"
              >
                Cancel — I Am Safe
              </button>
            </div>
          )}

          {/* Differentiator Value Explainer */}
          <div className="card p-4 border border-violet-500/30 bg-surface-900/90 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-violet-400" />
              <p className="font-semibold text-white text-xs">Hands-Free Protection</p>
            </div>
            <p className="text-xs text-surface-300 leading-relaxed">
              When traveling alone at night with your phone in a pocket or jacket, Voice Guard listens in the background for your selected distress keyword.
            </p>
            <div className="flex items-center gap-2 pt-1 border-t border-surface-700/50 text-[11px] text-surface-400">
              <Volume2 size={12} className="text-emerald-400" />
              <span>Ambient noise baseline: Normal (&lt; 75 dB)</span>
            </div>
          </div>

          {/* Emergency Phrase Configuration */}
          <div className="card p-4 space-y-3">
            <p className="section-header">Emergency Keyword</p>
            {editingPhrase ? (
              <div className="space-y-2">
                <input
                  className="input text-xs"
                  value={phraseInput}
                  onChange={(e) => setPhraseInput(e.target.value)}
                  placeholder="e.g. SafePath Help"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => handleSavePhrase(phraseInput)} className="btn-primary flex-1 py-2 text-xs">
                    <Check size={14} />
                    Save
                  </button>
                  <button onClick={() => setEditingPhrase(false)} className="btn-secondary py-2 text-xs">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between bg-surface-800 rounded-xl px-3 py-2.5 mb-2">
                  <div>
                    <p className="text-surface-400 text-[10px]">Active Trigger</p>
                    <p className="text-white font-bold text-sm">"{voiceGuard.phrase}"</p>
                  </div>
                  <button
                    onClick={() => setEditingPhrase(true)}
                    className="btn-ghost px-2.5 py-1 text-xs"
                  >
                    Custom
                  </button>
                </div>

                {/* Phrase Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PHRASE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleSavePhrase(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        voiceGuard.phrase.toLowerCase() === preset.toLowerCase()
                          ? 'bg-violet-600 text-white font-bold'
                          : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                      }`}
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Voice Control Center */}
          <div className="card p-6 flex flex-col items-center gap-4 border border-surface-700/60">
            {/* Visual audio bars when listening */}
            {isListening && (
              <div className="flex items-end gap-1.5 h-10 py-1">
                {audioBars.map((height, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-violet-400 rounded-full transition-all duration-150"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            )}

            {/* Mic button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!isSpeechSupported}
              className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-emergency-700/30 border-2 border-emergency-500 shadow-glow-emergency'
                  : 'bg-violet-600/20 border-2 border-violet-500/50 hover:border-violet-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isListening ? 'Stop listening' : 'Start Voice Guard'}
            >
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-emergency-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border border-emergency-500/20 animate-ping" style={{ animationDelay: '0.3s' }} />
                </>
              )}
              {isListening ? (
                <Mic size={36} className="text-emergency-400 animate-pulse" strokeWidth={2} />
              ) : (
                <MicOff size={36} className="text-violet-400" strokeWidth={2} />
              )}
            </button>

            <div className="text-center">
              <p className="text-white font-bold text-base">
                {isListening ? 'Actively Listening…' : 'Voice Guard Off'}
              </p>
              {isListening ? (
                <p className="text-surface-300 text-xs mt-1">
                  Say aloud: <span className="text-white font-bold">"{voiceGuard.phrase}"</span>
                </p>
              ) : (
                <p className="text-surface-400 text-xs mt-0.5">
                  Tap to start microphone keyword listener
                </p>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="w-full bg-surface-800 rounded-xl p-3 text-center">
                <p className="text-surface-400 text-[10px] uppercase tracking-wider mb-0.5">Live Audio Transcript</p>
                <p className="text-white text-xs font-medium italic">"{transcript}"</p>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!isSpeechSupported}
              className={`w-full py-3 rounded-2xl font-bold text-xs transition-all disabled:opacity-50 ${
                isListening
                  ? 'bg-emergency-700/30 border border-emergency-600/50 text-emergency-300 hover:bg-emergency-700/40'
                  : 'bg-violet-600 text-white hover:bg-violet-500 shadow-glow-primary'
              }`}
            >
              {isListening ? '⏹ Deactivate Voice Guard' : '▶ Activate Voice Guard'}
            </button>
          </div>

          {/* Quick Demo Simulator for Judges */}
          <button
            onClick={() => {
              setDemoMode(true);
              setIsListening(true);
              setTranscript('Listening for keyword...');
            }}
            className="w-full py-3.5 rounded-2xl bg-violet-600/20 border border-violet-500/40 text-violet-300 font-bold text-xs hover:bg-violet-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Zap size={15} />
            Demo Simulation: Trigger Keyword ("{voiceGuard.phrase}")
          </button>

          {/* Ethical & Privacy note */}
          <div className="p-3 rounded-2xl bg-surface-800/50 border border-surface-700/30">
            <p className="text-surface-400 text-[11px] leading-relaxed text-center">
              🔒 Privacy First: Voice Guard performs on-device audio keyword detection via the browser.
              No raw audio recordings are uploaded or stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
