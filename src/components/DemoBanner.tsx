// =============================================
// SafePath – Demo Mode Banner
// =============================================
import { Zap } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 pointer-events-none">
      <div className="badge-demo flex items-center gap-1.5 px-3 py-1 text-xs font-semibold backdrop-blur-sm pointer-events-auto">
        <Zap size={10} className="text-violet-400" />
        DEMO MODE — Data is simulated
      </div>
    </div>
  );
}
