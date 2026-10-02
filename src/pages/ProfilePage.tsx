// =============================================
// SafePath – My Safety Profile Page
// =============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Plus, Trash2,
  Check, X, Shield, MapPin, Edit2, Bell, BellOff, Loader2, Mic, PhoneCall, Star,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { TrustedContact } from '../types';

// ---- helpers ----
function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const RELATIONSHIPS = ['Family', 'Friend', 'Partner', 'Colleague', 'Neighbour', 'Other'];

const AVATAR_COLORS = [
  'bg-primary-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-caution-500', 'bg-rose-600', 'bg-cyan-600',
];

// ---- Contact Form ----
interface ContactFormData {
  name: string;
  phone: string;
  relationship: string;
  notifyOnJourneyStart: boolean;
  notifyOnSOS: boolean;
  notifyOnArrival: boolean;
}

const EMPTY_FORM: ContactFormData = {
  name: '',
  phone: '',
  relationship: 'Family',
  notifyOnJourneyStart: true,
  notifyOnSOS: true,
  notifyOnArrival: true,
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { settings, userPosition, gpsLoading } = state;
  const { user, trustedContacts, voiceGuard, primaryContactId } = settings;

  // --- User profile editing ---
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name, phone: user.phone || '', email: user.email || '' });

  function saveProfile() {
    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: { name: profileForm.name, phone: profileForm.phone, email: profileForm.email },
    });
    setEditingProfile(false);
  }

  // --- Contact management ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  function handleAddContact() {
    if (!contactForm.name.trim()) { setFormError('Name is required'); return; }
    if (!contactForm.phone.trim()) { setFormError('Phone number is required'); return; }
    if (!/^[+\d\s\-()]{6,20}$/.test(contactForm.phone.trim())) {
      setFormError('Enter a valid phone number'); return;
    }
    const newContact: TrustedContact = {
      id: `contact-${Date.now()}`,
      userId: user.id,
      name: contactForm.name.trim(),
      phone: contactForm.phone.trim(),
      relationship: contactForm.relationship,
      notificationPreferences: {
        notifyOnJourneyStart: contactForm.notifyOnJourneyStart,
        notifyOnSOS: contactForm.notifyOnSOS,
        notifyOnArrival: contactForm.notifyOnArrival,
      },
    };
    dispatch({ type: 'ADD_CONTACT', payload: newContact });
    setContactForm(EMPTY_FORM);
    setShowAddForm(false);
    setFormError('');
  }

  function handleRemove(id: string) {
    if (window.confirm('Remove this trusted contact?')) {
      dispatch({ type: 'REMOVE_CONTACT', payload: id });
      // If removed contact was primary, clear primary
      if (primaryContactId === id) {
        dispatch({ type: 'SET_PRIMARY_CONTACT', payload: null });
      }
    }
  }

  function toggleVoiceAssistant() {
    dispatch({ type: 'UPDATE_VOICE_GUARD', payload: { enabled: !voiceGuard.enabled } });
  }

  function toggleAutomaticCalling() {
    dispatch({ type: 'UPDATE_VOICE_GUARD', payload: { automaticEmergencyCalling: !voiceGuard.automaticEmergencyCalling } });
  }

  function setPrimaryContact(id: string) {
    dispatch({ type: 'SET_PRIMARY_CONTACT', payload: primaryContactId === id ? null : id });
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
            <h1 className="text-lg font-bold text-white">My Safety Profile</h1>
            <p className="text-surface-300 text-xs">Personal info & emergency contacts</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* GPS Status */}
          <div className="flex items-center gap-2 px-1 py-1.5">
            {gpsLoading ? (
              <Loader2 size={13} className="text-primary-400 animate-spin" />
            ) : (
              <div className={`w-2 h-2 rounded-full ${userPosition ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
            )}
            <span className={`text-xs ${userPosition ? 'text-emerald-300' : 'text-yellow-300'}`}>
              {gpsLoading
                ? 'Detecting GPS location…'
                : userPosition
                ? `GPS Active · ${userPosition.lat.toFixed(5)}, ${userPosition.lng.toFixed(5)}`
                : 'Location unavailable — enable in browser settings'}
            </span>
          </div>

          {/* Personal Profile Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="section-header mb-0">Personal Details</p>
              <button
                onClick={() => setEditingProfile((e) => !e)}
                className="btn-ghost px-2.5 py-1 text-xs flex items-center gap-1"
              >
                {editingProfile ? <X size={13} /> : <Edit2 size={13} />}
                {editingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingProfile ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-surface-400 text-xs mb-1">Display Name</label>
                  <input
                    className="input text-sm"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-surface-400 text-xs mb-1">Phone (for SOS messages)</label>
                  <input
                    className="input text-sm"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+44 7700 000000"
                    type="tel"
                  />
                </div>
                <div>
                  <label className="block text-surface-400 text-xs mb-1">Email (optional)</label>
                  <input
                    className="input text-sm"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    type="email"
                  />
                </div>
                <button onClick={saveProfile} className="btn-primary w-full py-2.5 text-xs">
                  <Check size={14} />
                  Save Profile
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-glow-primary">
                  <span className="text-white font-black text-2xl">{initials(user.name)}</span>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-white font-bold text-base">{user.name}</p>
                  {user.phone && (
                    <div className="flex items-center gap-1.5 text-surface-300 text-xs">
                      <Phone size={11} className="text-surface-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-1.5 text-surface-300 text-xs">
                      <Mail size={11} className="text-surface-400" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* GPS Location Card */}
          <div className="card p-4 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">GPS Location</p>
                <p className="text-surface-400 text-xs">
                  {gpsLoading
                    ? 'Requesting location…'
                    : userPosition
                    ? `${userPosition.lat.toFixed(5)}°, ${userPosition.lng.toFixed(5)}° — Used as SOS broadcast position`
                    : 'Location not detected — SOS will use demo coordinates'}
                </p>
              </div>
              {userPosition && <Check size={16} className="text-emerald-400 flex-shrink-0" />}
            </div>
          </div>

          {/* Trusted Contacts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="section-header mb-0">
                Emergency Contacts
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600/30 text-primary-300 text-[10px] font-bold">
                  {trustedContacts.length}
                </span>
              </p>
              <button
                onClick={() => { setShowAddForm(true); setFormError(''); setContactForm(EMPTY_FORM); }}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <Plus size={13} />
                Add Contact
              </button>
            </div>

            {trustedContacts.length === 0 && !showAddForm && (
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Shield size={20} className="text-surface-500" />
                </div>
                <p className="text-white font-semibold text-sm mb-1">No emergency contacts</p>
                <p className="text-surface-400 text-xs">Add trusted people who will receive your SOS alert.</p>
              </div>
            )}

            {/* Add form */}
            {showAddForm && (
              <div className="card p-4 mb-3 border border-primary-500/40 animate-scale-in space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-bold text-sm">New Emergency Contact</p>
                  <button onClick={() => setShowAddForm(false)} className="btn-ghost p-1 rounded-lg">
                    <X size={16} />
                  </button>
                </div>

                {formError && (
                  <p className="text-emergency-400 text-xs bg-emergency-500/10 border border-emergency-500/30 rounded-lg px-3 py-2">
                    ⚠️ {formError}
                  </p>
                )}

                <div>
                  <label className="block text-surface-400 text-xs mb-1">Full Name *</label>
                  <input
                    className="input text-sm"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Jane Smith"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-surface-400 text-xs mb-1">Phone Number *</label>
                  <input
                    className="input text-sm"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+44 7700 000000"
                    type="tel"
                  />
                </div>
                <div>
                  <label className="block text-surface-400 text-xs mb-1">Relationship</label>
                  <select
                    className="input text-sm"
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm((f) => ({ ...f, relationship: e.target.value }))}
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Notification toggles */}
                <div className="space-y-2">
                  <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider">Notify when…</p>
                  {(
                    [
                      ['notifyOnSOS', 'SOS Emergency triggered 🚨', true],
                      ['notifyOnJourneyStart', 'Journey starts', false],
                      ['notifyOnArrival', 'I arrive safely', false],
                    ] as [keyof ContactFormData, string, boolean][]
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setContactForm((f) => ({ ...f, [key]: !f[key as keyof ContactFormData] }))}
                        className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${
                          contactForm[key] ? 'bg-primary-600' : 'bg-surface-700'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          contactForm[key] ? 'left-4' : 'left-0.5'
                        }`} />
                      </div>
                      <span className="text-surface-200 text-xs">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={handleAddContact} className="btn-primary flex-1 py-2.5 text-xs">
                    <Check size={14} />
                    Add Contact
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="btn-secondary py-2.5 text-xs">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Contact list */}
            <div className="space-y-2">
              {trustedContacts.map((contact, idx) => {
                const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const isPrimary = contact.id === primaryContactId || (primaryContactId === null && idx === 0 && trustedContacts.length > 0);
                return (
                  <div
                    key={contact.id}
                    className={`card p-3.5 flex items-center gap-3 ${
                      isPrimary ? 'border border-emerald-500/30' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{initials(contact.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm truncate">{contact.name}</p>
                        <span className="badge bg-surface-700 text-surface-300 text-[10px] flex-shrink-0">
                          {contact.relationship}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="text-surface-500" />
                        <p className="text-surface-400 text-xs">{contact.phone}</p>
                      </div>
                      {/* Notification badges */}
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {contact.notificationPreferences.notifyOnSOS && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emergency-300 bg-emergency-500/10 border border-emergency-500/30 px-1.5 py-0.5 rounded-full">
                            <Bell size={8} />SOS
                          </span>
                        )}
                        {contact.notificationPreferences.notifyOnJourneyStart && (
                          <span className="flex items-center gap-0.5 text-[10px] text-primary-300 bg-primary-500/10 border border-primary-500/30 px-1.5 py-0.5 rounded-full">
                            <Bell size={8} />Journey
                          </span>
                        )}
                        {contact.notificationPreferences.notifyOnArrival && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                            <Bell size={8} />Arrival
                          </span>
                        )}
                        {!contact.notificationPreferences.notifyOnSOS &&
                          !contact.notificationPreferences.notifyOnJourneyStart &&
                          !contact.notificationPreferences.notifyOnArrival && (
                            <span className="flex items-center gap-0.5 text-[10px] text-surface-500 px-1.5 py-0.5 rounded-full">
                              <BellOff size={8} />No alerts
                            </span>
                          )}
                      </div>
                    </div>
                    {/* Primary badge + controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => setPrimaryContact(contact.id)}
                        title={isPrimary ? 'Primary contact' : 'Set as primary contact'}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                          isPrimary
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-surface-800 text-surface-500 border border-surface-700 hover:border-emerald-500/40 hover:text-emerald-400'
                        }`}
                      >
                        <Star size={9} fill={isPrimary ? 'currentColor' : 'none'} />
                        {isPrimary ? 'Primary' : 'Set Primary'}
                      </button>
                      <button
                        onClick={() => handleRemove(contact.id)}
                        className="p-1.5 rounded-lg bg-surface-800 hover:bg-emergency-700/30 text-surface-500 hover:text-emergency-400 transition-colors"
                        aria-label={`Remove ${contact.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Safety Assistant Settings */}
          <div className="card p-5 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-violet-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mic size={15} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Voice Safety Assistant</p>
                <p className="text-surface-400 text-xs">Hands-free emergency keyword detection</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Voice Assistant toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-surface-200 text-sm">Voice Assistant</span>
                <div
                  onClick={toggleVoiceAssistant}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                    voiceGuard.enabled ? 'bg-violet-600' : 'bg-surface-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    voiceGuard.enabled ? 'left-6' : 'left-1'
                  }`} />
                </div>
              </label>

              {/* Automatic Emergency Calling toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <PhoneCall size={13} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-surface-200 text-sm">Automatic Emergency Calling</span>
                </div>
                <div
                  onClick={toggleAutomaticCalling}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                    voiceGuard.automaticEmergencyCalling ? 'bg-emerald-600' : 'bg-surface-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    voiceGuard.automaticEmergencyCalling ? 'left-6' : 'left-1'
                  }`} />
                </div>
              </label>

              <p className="text-surface-500 text-[11px] leading-relaxed">
                When enabled, SafePath will automatically initiate a call to your primary emergency contact when the Voice Safety Assistant detects an emergency phrase.
              </p>

              {voiceGuard.automaticEmergencyCalling && (
                <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/30 px-3 py-2.5 text-xs text-emerald-300 leading-relaxed">
                  <p className="font-semibold mb-1">⚡ Auto-Call Active</p>
                  {trustedContacts.length === 0 ? (
                    <p className="text-yellow-300">⚠️ Add an emergency contact first to use this feature.</p>
                  ) : !primaryContactId && trustedContacts.length > 0 ? (
                    <p>Calls <strong>{trustedContacts[0].name}</strong> ({trustedContacts[0].phone}) — the first contact is used as primary by default. Star a contact below to change this.</p>
                  ) : (
                    (() => {
                      const pc = trustedContacts.find(c => c.id === primaryContactId);
                      return pc ? <p>Will call <strong>{pc.name}</strong> ({pc.phone}) immediately on phrase detection.</p> : null;
                    })()
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Privacy disclaimer */}
          <div className="p-3 rounded-2xl bg-surface-800/50 border border-surface-700/30">
            <p className="text-surface-400 text-[11px] leading-relaxed text-center">
              🔒 Contact data is stored locally on your device only. It is never uploaded or shared without your explicit action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
