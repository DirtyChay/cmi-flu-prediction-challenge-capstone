import { useState } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { DatasetOverview } from './components/pages/DatasetOverview';
import { HAITiterExplorer } from './components/pages/HAITiterExplorer';
import { FeatureCorrelations } from './components/pages/FeatureCorrelations';
import { ParticipantDeepDive } from './components/pages/ParticipantDeepDive';

export default function App() {
  const [page, setPage] = useState<PageId>('overview');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F1117',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#E2E8F0',
      display: 'flex',
    }}>
      <Sidebar active={page} onNavigate={setPage} />

      <main style={{
        marginLeft: 240,
        flex: 1,
        minHeight: '100vh',
        overflowY: 'auto',
      }}>
        {page === 'overview'     && <DatasetOverview />}
        {page === 'hai'          && <HAITiterExplorer />}
        {page === 'correlations' && <FeatureCorrelations />}
        {page === 'participant'  && <ParticipantDeepDive />}
      </main>
    </div>
  );
}
