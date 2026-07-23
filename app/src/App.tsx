import { Routes, Route } from 'react-router';
import { CXMProvider } from '@/store/CXMContext';
import AppShell from '@/components/AppShell';
import Overview from '@/pages/Overview';
import JourneyTree from '@/pages/JourneyTree';
import CoverageGap from '@/pages/CoverageGap';
import ImpactAnalysis from '@/pages/ImpactAnalysis';
import POBoard from '@/pages/POBoard';
import IssueHub from '@/pages/IssueHub';
import VoiceOfCustomer from '@/pages/VoiceOfCustomer';
import CXControlTower from '@/pages/CXControlTower';

export default function App() {
  return (
    <CXMProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<CXControlTower />} />
          <Route path="/legacy-overview" element={<Overview />} />
          <Route path="/journey" element={<JourneyTree />} />
          <Route path="/coverage" element={<CoverageGap />} />
          <Route path="/impact" element={<ImpactAnalysis />} />
          <Route path="/board" element={<POBoard />} />
          <Route path="/issues" element={<IssueHub />} />
          <Route path="/voice" element={<VoiceOfCustomer />} />
        </Routes>
      </AppShell>
    </CXMProvider>
  );
}
