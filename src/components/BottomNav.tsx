// =============================================
// SafePath – Bottom Navigation
// =============================================
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, Shield, Settings, AlertTriangle } from 'lucide-react';
import { useApp } from '../store/AppContext';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/map', icon: Map, label: 'Map' },
  { path: '/hazards', icon: AlertTriangle, label: 'Report' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="max-w-lg mx-auto">
        <div className="bg-surface-900/95 backdrop-blur-md border-t border-surface-700/50 flex items-stretch">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`nav-item touch-target ${isActive ? 'text-primary-400' : ''}`}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-400 rounded-full" />
                )}
              </button>
            );
          })}
          {/* SOS quick action */}
          <button
            onClick={() => navigate('/sos')}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 touch-target relative"
            aria-label="Emergency SOS"
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${
              state.activeEmergency
                ? 'bg-emergency-600 animate-pulse'
                : 'bg-emergency-700/80 hover:bg-emergency-600'
            }`}>
              <Shield size={18} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-[10px] font-semibold text-emergency-400">SOS</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
