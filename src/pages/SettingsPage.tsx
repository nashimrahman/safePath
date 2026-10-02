// =============================================
// SafePath – Settings Page
// =============================================
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Users, AlertTriangle, Mic, Bell, MapPin, Lock, Trash2, ChevronRight, Info } from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  iconColor: string;
  iconBg: string;
  path?: string;
  action?: () => void;
  danger?: boolean;
}

export function SettingsPage() {
  const navigate = useNavigate();

  const sections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Profile',
          sublabel: 'Demo User',
          icon: User,
          iconColor: 'text-primary-400',
          iconBg: 'bg-primary-600/20',
          action: () => {},
        },
      ],
    },
    {
      id: 'safety',
      title: 'Safety & Journey',
      items: [
        {
          id: 'contacts',
          label: 'Trusted Contacts',
          sublabel: 'Manage guardians',
          icon: Users,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-600/20',
          path: '/contacts',
        },
        {
          id: 'zones',
          label: 'Caution Zones',
          sublabel: 'Personal zone warnings',
          icon: AlertTriangle,
          iconColor: 'text-caution-400',
          iconBg: 'bg-caution-500/20',
          path: '/caution-zones',
        },
        {
          id: 'voice',
          label: 'Voice Guard',
          sublabel: 'Emergency phrase settings',
          icon: Mic,
          iconColor: 'text-violet-400',
          iconBg: 'bg-violet-600/20',
          path: '/voice-guard',
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      items: [
        {
          id: 'location',
          label: 'Location Permissions',
          sublabel: 'Active (simulated in demo)',
          icon: MapPin,
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-600/20',
          action: () => {},
        },
        {
          id: 'notifications',
          label: 'Notification Preferences',
          sublabel: 'Journey alerts',
          icon: Bell,
          iconColor: 'text-primary-400',
          iconBg: 'bg-primary-600/20',
          action: () => {},
        },
        {
          id: 'privacy',
          label: 'Privacy Policy',
          sublabel: 'How your data is used',
          icon: Lock,
          iconColor: 'text-surface-300',
          iconBg: 'bg-surface-700/50',
          action: () => {},
        },
        {
          id: 'delete',
          label: 'Delete Account & Data',
          sublabel: 'Permanently remove all data',
          icon: Trash2,
          iconColor: 'text-emergency-400',
          iconBg: 'bg-emergency-600/20',
          danger: true,
          action: () => {
            alert('Demo mode: Data deletion is not active in demo.');
          },
        },
      ],
    },
  ];

  return (
    <div className="page">
      <div className="bg-surface-900/95 backdrop-blur-md border-b border-surface-700/50 px-4 pt-14 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Settings</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-lg mx-auto space-y-5">

          {/* App info */}
          <div className="card p-4 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-violet-600 rounded-3xl flex items-center justify-center shadow-glow-primary">
              <span className="text-2xl">🛡️</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">SafePath</h2>
              <p className="text-surface-400 text-xs">Proactive Personal Safety Platform</p>
              <p className="text-surface-500 text-xs mt-0.5">v1.0.0 · Hackathon MVP · Demo Mode</p>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.id}>
              <p className="section-header">{section.title}</p>
              <div className="card overflow-hidden">
                {section.items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.path ? () => navigate(item.path!) : item.action}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-800/50 transition-all text-left ${
                        i < section.items.length - 1 ? 'border-b border-surface-700/50' : ''
                      }`}
                    >
                      <div className={`w-9 h-9 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={17} className={item.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${item.danger ? 'text-emergency-400' : 'text-white'}`}>
                          {item.label}
                        </p>
                        {item.sublabel && (
                          <p className="text-surface-400 text-xs">{item.sublabel}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-surface-500 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Disclaimer */}
          <div className="flex gap-2 p-3 rounded-2xl bg-surface-800/50 border border-surface-700/30">
            <Info size={14} className="text-surface-400 mt-0.5 flex-shrink-0" />
            <p className="text-surface-400 text-xs leading-relaxed">
              SafePath provides route context indicators to help you make more informed decisions.
              Route recommendations are not guarantees of personal safety.
              Always trust your instincts and contact emergency services (999/911) in an emergency.
            </p>
          </div>

          {/* Response dashboard link */}
          <button
            onClick={() => navigate('/response-dashboard')}
            className="w-full btn-secondary text-sm py-3 flex items-center justify-center gap-2"
          >
            📡 View Demo Response Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
