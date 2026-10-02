// =============================================
// SafePath – Hazard Reporting Page
// =============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { DEMO_HAZARDS } from '../data/demoData';
import { formatRelativeTime } from '../services/routeScoring';
import type { HazardCategory, Hazard } from '../types';

const CATEGORIES: { value: HazardCategory; label: string; icon: string }[] = [
  { value: 'poor_lighting', label: 'Poor Lighting', icon: '💡' },
  { value: 'isolated_area', label: 'Isolated Area', icon: '🚶' },
  { value: 'blocked_walkway', label: 'Blocked Walkway', icon: '🚧' },
  { value: 'broken_streetlight', label: 'Broken Streetlight', icon: '🔦' },
  { value: 'unsafe_bus_stop', label: 'Unsafe Bus Stop', icon: '🚌' },
  { value: 'road_condition', label: 'Road Condition', icon: '🛣️' },
  { value: 'other', label: 'Other Concern', icon: '⚠️' },
];

export function HazardsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { hazards, userPosition } = state;

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [category, setCategory] = useState<HazardCategory>('poor_lighting');
  const [description, setDescription] = useState('');

  function handleSubmit() {
    if (!description.trim()) return;
    const center = userPosition || { lat: 20, lng: 0 };
    const hazard: Hazard = {
      id: `hazard-${Date.now()}`,
      latitude: Number((center.lat + (Math.random() - 0.5) * 0.003).toFixed(6)),
      longitude: Number((center.lng + (Math.random() - 0.5) * 0.003).toFixed(6)),
      category,
      description: description.trim(),
      reportedAt: new Date().toISOString(),
      status: 'active',
      source: 'user',
    };
    dispatch({ type: 'ADD_HAZARD', payload: hazard });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
      setDescription('');
    }, 2000);
  }

  const allHazards = [...hazards, ...DEMO_HAZARDS].filter(
    (h, i, arr) => arr.findIndex((x) => x.id === h.id) === i
  );

  return (
    <div className="page">
      <div className="bg-surface-900/95 backdrop-blur-md border-b border-surface-700/50 px-4 pt-14 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Hazard Reports</h1>
            <p className="text-surface-300 text-xs">Report environmental conditions</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="btn-primary px-3 py-2 text-xs"
          >
            + Report
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Important disclaimer */}
          <div className="flex gap-2 p-3 rounded-2xl bg-primary-600/10 border border-primary-500/20">
            <AlertTriangle size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-surface-300 text-xs leading-relaxed">
              Reports should describe <strong className="text-white">environmental or infrastructure conditions</strong>, not individuals, groups, or communities. SafePath does not allow reports targeting people.
            </p>
          </div>

          {/* Report form */}
          {showForm && (
            <div className="card p-4 border border-orange-500/30 animate-slide-up space-y-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-400" />
                Report a Condition
              </h3>

              {submitted ? (
                <div className="flex flex-col items-center py-6 gap-3">
                  <CheckCircle2 size={36} className="text-emerald-400" />
                  <p className="text-emerald-400 font-bold">Report Submitted</p>
                  <p className="text-surface-400 text-sm text-center">Thank you. Your report helps others plan safer routes.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-surface-300 text-xs mb-2 block">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                            category === cat.value
                              ? 'bg-orange-600/20 border border-orange-500/50 text-orange-300'
                              : 'bg-surface-800 border border-surface-700 text-surface-300 hover:border-surface-600'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-surface-300 text-xs mb-1 block">Description</label>
                    <textarea
                      className="input resize-none h-24"
                      placeholder="Describe the environmental condition (e.g. 'Street lighting not working along this stretch')"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 p-2.5 bg-surface-800 rounded-xl items-center">
                    <MapPin size={14} className="text-primary-400" />
                    <p className="text-surface-300 text-xs">Location: Your current position (demo)</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={!description.trim()}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      Submit Report
                    </button>
                    <button onClick={() => setShowForm(false)} className="btn-secondary px-4">Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Hazard list */}
          <div>
            <p className="section-header">Active Reports ({allHazards.filter(h => h.status !== 'resolved').length})</p>
            <div className="space-y-2">
              {allHazards
                .filter((h) => h.status !== 'resolved')
                .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
                .map((hazard) => {
                  const cat = CATEGORIES.find((c) => c.value === hazard.category);
                  return (
                    <div key={hazard.id} className="card p-3 flex items-start gap-3">
                      <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {cat?.icon || '⚠️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-white text-sm font-medium">{cat?.label || hazard.category}</p>
                          <span className={`badge text-[10px] ${
                            hazard.status === 'active'
                              ? 'badge-hazard'
                              : 'bg-surface-700/50 text-surface-400 border border-surface-600'
                          }`}>
                            {hazard.status === 'needs_verification' ? 'Needs verify' : hazard.status}
                          </span>
                        </div>
                        <p className="text-surface-300 text-xs truncate">{hazard.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={10} className="text-surface-500" />
                          <span className="text-surface-500 text-[11px]">{formatRelativeTime(hazard.reportedAt)}</span>
                          <span className="text-surface-600 text-[11px] mx-1">·</span>
                          <span className="text-surface-500 text-[11px]">{hazard.source}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
