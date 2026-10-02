// =============================================
// SafePath – App Router
// =============================================
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { BottomNav } from './components/BottomNav';

// Pages
import { HomePage } from './pages/HomePage';
import { JourneyPage } from './pages/JourneyPage';
import { LiveJourneyPage } from './pages/LiveJourneyPage';
import { MapPage } from './pages/MapPage';
import { SOSPage } from './pages/SOSPage';
import { VoiceGuardPage } from './pages/VoiceGuardPage';
import { EmergencyStatusPage } from './pages/EmergencyStatusPage';
import { CautionZonesPage } from './pages/CautionZonesPage';
import { HazardsPage } from './pages/HazardsPage';
import { ContactsPage } from './pages/ContactsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResponseDashboardPage } from './pages/ResponseDashboardPage';
import { NearbyHelpPage } from './pages/NearbyHelpPage';
import { ProfilePage } from './pages/ProfilePage';

// Pages that should hide bottom navigation
const HIDE_BOTTOM_NAV_ROUTES = ['/live-journey', '/sos'];

function AppShell() {
  const location = useLocation();
  const hideBottomNav = HIDE_BOTTOM_NAV_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto relative bg-surface-950">
      <main className={`flex-1 overflow-hidden ${!hideBottomNav ? 'pb-16' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/journey" element={<JourneyPage />} />
          <Route path="/live-journey" element={<LiveJourneyPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/sos" element={<SOSPage />} />
          <Route path="/voice-guard" element={<VoiceGuardPage />} />
          <Route path="/emergency-status" element={<EmergencyStatusPage />} />
          <Route path="/caution-zones" element={<CautionZonesPage />} />
          <Route path="/hazards" element={<HazardsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/response-dashboard" element={<ResponseDashboardPage />} />
          <Route path="/nearby-help" element={<NearbyHelpPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  );
}
