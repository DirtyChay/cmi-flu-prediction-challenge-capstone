import { useState } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { DatasetOverview } from './components/pages/DatasetOverview';
import { HAITiterExplorer } from './components/pages/HAITiterExplorer';
import { FeatureCorrelations } from './components/pages/FeatureCorrelations';
import { ModelPerformance } from './components/pages/ModelPerformance';
import { ParticipantDeepDive } from './components/pages/ParticipantDeepDive';
import { ChatPanel } from './components/ChatPanel';

export default function App() {
  const [page, setPage] = useState<PageId>('overview');

  const isChat = page === 'chat';

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
        overflowY: isChat ? 'hidden' : 'auto',
      }}>
        {page === 'overview'     && <DatasetOverview />}
        {page === 'hai'          && <HAITiterExplorer />}
        {page === 'correlations' && <FeatureCorrelations />}
        {page === 'models'       && <ModelPerformance />}
        {page === 'participant'  && <ParticipantDeepDive />}
        {page === 'chat'         && <ChatPanel />}
      </main>
    </div>
  );
}
