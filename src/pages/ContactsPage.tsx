// =============================================
// SafePath – Trusted Contacts Page
// =============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Users, Phone, Heart, Shield } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { TrustedContact } from '../types';

const RELATIONSHIPS = ['Family', 'Friend', 'Partner', 'Colleague', 'Other'];

export function ContactsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { trustedContacts } = state.settings;
  const [showForm, setShowForm] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rel, setRel] = useState('Family');
  const [notifyStart, setNotifyStart] = useState(true);
  const [notifySOSPref, setNotifySOSPref] = useState(true);
  const [notifyArrival, setNotifyArrival] = useState(true);

  function handleSave() {
    if (!name.trim() || !phone.trim()) return;
    const contact: TrustedContact = {
      id: `contact-${Date.now()}`,
      userId: 'demo-user-001',
      name: name.trim(),
      phone: phone.trim(),
      relationship: rel,
      notificationPreferences: {
        notifyOnJourneyStart: notifyStart,
        notifyOnSOS: notifySOSPref,
        notifyOnArrival: notifyArrival,
      },
    };
    dispatch({ type: 'ADD_CONTACT', payload: contact });
    setShowForm(false);
    setName('');
    setPhone('');
  }

  return (
    <div className="page">
      <div className="bg-surface-900/95 backdrop-blur-md border-b border-surface-700/50 px-4 pt-14 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Trusted Contacts</h1>
            <p className="text-surface-300 text-xs">Guardians for journey sharing & SOS</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary px-3 py-2 text-xs">
            <Plus size={15} />
            Add
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Privacy note */}
          <div className="flex gap-2 p-3 rounded-2xl bg-primary-600/10 border border-primary-500/20">
            <Shield size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-surface-300 text-xs leading-relaxed">
              Location is never shared with contacts without your explicit consent during an active journey or SOS event.
            </p>
          </div>

          {/* Contact list */}
          {trustedContacts.length === 0 ? (
            <div className="card p-8 text-center">
              <Users size={32} className="text-primary-400 mx-auto mb-3 opacity-50" />
              <p className="text-white font-semibold mb-1">No contacts added</p>
              <p className="text-surface-400 text-sm">Add trusted contacts to receive SOS alerts and journey updates.</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={16} />
                Add Contact
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trustedContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onDelete={() => dispatch({ type: 'REMOVE_CONTACT', payload: contact.id })}
                />
              ))}
            </div>
          )}

          {/* Create form */}
          {showForm && (
            <div className="card p-4 border border-primary-500/30 animate-slide-up space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Plus size={16} className="text-primary-400" />
                Add Trusted Contact
              </h3>

              <div>
                <label className="text-surface-300 text-xs mb-1 block">Name</label>
                <input className="input" placeholder="e.g. Mum" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="text-surface-300 text-xs mb-1 block">Phone number</label>
                <input className="input" placeholder="+44 7700 900000" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <label className="text-surface-300 text-xs mb-2 block">Relationship</label>
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIPS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRel(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        rel === r
                          ? 'bg-primary-600/30 border border-primary-500/60 text-primary-300'
                          : 'bg-surface-800 border border-surface-700 text-surface-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-surface-300 text-xs mb-2 block">Notify when</label>
                <div className="space-y-2">
                  <Toggle label="Journey started" value={notifyStart} onChange={setNotifyStart} />
                  <Toggle label="SOS activated" value={notifySOSPref} onChange={setNotifySOSPref} />
                  <Toggle label="Arrived safely" value={notifyArrival} onChange={setNotifyArrival} />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || !phone.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  Save Contact
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary px-4">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactCard({ contact, onDelete }: { contact: TrustedContact; onDelete: () => void }) {
  const { notifyOnJourneyStart, notifyOnSOS, notifyOnArrival } = contact.notificationPreferences;
  return (
    <div className="card-hover p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-primary-600/40 to-violet-600/40 rounded-2xl flex items-center justify-center text-lg font-bold text-primary-200 flex-shrink-0">
          {contact.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-sm">{contact.name}</h3>
            <span className="badge bg-surface-700/50 text-surface-300 border border-surface-600">{contact.relationship}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone size={11} className="text-surface-400" />
            <p className="text-surface-400 text-xs">{contact.phone}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {notifyOnSOS && <span className="badge bg-emergency-700/20 text-emergency-300 border border-emergency-700/30 text-[10px]">SOS alert</span>}
            {notifyOnJourneyStart && <span className="badge bg-primary-700/20 text-primary-300 border border-primary-700/30 text-[10px]">Journey start</span>}
            {notifyOnArrival && <span className="badge badge-open text-[10px]">Arrival</span>}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-xl hover:bg-emergency-600/20 text-surface-400 hover:text-emergency-400 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-surface-200 text-sm flex items-center gap-2">
        <Heart size={12} className="text-primary-400" />
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-primary-500' : 'bg-surface-700'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
