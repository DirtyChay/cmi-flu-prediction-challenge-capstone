import { useState, useEffect } from 'react';
import { Bot, AlertCircle, ExternalLink } from 'lucide-react';

// The querychat Shiny app (server/querychat_app.py), served separately.
// Run it with:  cd ImmunoExplorer/server && shiny run querychat_app.py --port 8001
const QUERYCHAT_URL = 'http://localhost:8001';

export function ChatPanelEmbed() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  // Probe reachability of the Shiny server. A no-cors fetch resolves (opaque)
  // when the server is up and throws when it's down — enough to flip the dot.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch(QUERYCHAT_URL, { mode: 'no-cors' });
        if (!cancelled) setStatus('connected');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const STATUS_META = {
    checking:  { color: '#F4A261', label: 'Connecting…' },
    connected: { color: '#06D6A0', label: 'querychat · :8001' },
    offline:   { color: '#EF4444', label: 'Offline · :8001' },
  }[status];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0F1117',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #2E86AB 0%, #00D9C0 100%)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={18} color="white" />
        </div>
        <div>
          <div style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 600 }}>Data Chat</div>
          <div style={{ color: '#64748B', fontSize: 11, marginTop: 1 }}>
            Ask questions about the train_combined dataset — answers run as live SQL
          </div>
        </div>

        {/* Connection status */}
        <div title={`querychat Shiny app at ${QUERYCHAT_URL}`} style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 7,
          background: '#1E2130',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '5px 12px',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: STATUS_META.color,
            boxShadow: `0 0 6px ${STATUS_META.color}`,
            animation: status === 'checking' ? 'pulse 1.2s ease-in-out infinite' : undefined,
          }} />
          <span style={{ color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap' }}>
            {STATUS_META.label}
          </span>
        </div>
      </div>

      {/* Embedded querychat app, or an offline notice */}
      {status === 'offline' ? (
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: 40, textAlign: 'center',
        }}>
          <AlertCircle size={32} color="#EF4444" />
          <div style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 600 }}>
            Chat server isn’t running
          </div>
          <div style={{ color: '#94A3B8', fontSize: 13, maxWidth: 460, lineHeight: 1.6 }}>
            Start the querychat app, then reload this page:
            <pre style={{
              background: '#0D1117',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '10px 14px',
              marginTop: 12,
              color: '#C9D1D9',
              fontSize: 12,
              textAlign: 'left',
              overflowX: 'auto',
            }}><code>cd ImmunoExplorer/server{'\n'}shiny run querychat_app.py --port 8001</code></pre>
            Make sure Ollama is running too, with a tool-capable model
            available (this project uses <code>gemma4</code>).
          </div>
          <a
            href={QUERYCHAT_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#00D9C0', fontSize: 12, textDecoration: 'none',
            }}
          >
            Open chat in a new tab <ExternalLink size={12} />
          </a>
        </div>
      ) : (
        <iframe
          title="querychat"
          src={QUERYCHAT_URL}
          style={{ flex: 1, width: '100%', border: 'none', background: '#0F1117' }}
        />
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
