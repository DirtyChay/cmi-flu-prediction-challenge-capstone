import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import {
  participants, cohortCounts, sexData, ageHistogram, STRAINS, strainD28Coverage,
  strainBoost, strainTestedCount, sexResponse, ageBaseline,
} from '../data/mockData';

// Local LLM server (LM Studio / any OpenAI-compatible endpoint)
const API_BASE = 'http://127.0.0.1:1234';

type Role = 'user' | 'assistant';
interface Message { role: Role; content: string; }

const mostMissingD28 = strainD28Coverage.slice(0, 10)
  .map(s => `${s.strain} (${s.missing} missing)`).join('; ');
const bestCoveredD28 = strainD28Coverage.slice(-8).reverse()
  .map(s => `${s.strain} (${s.measured} measured)`).join('; ');
const biggestBoost = strainBoost.slice(0, 6)
  .map(s => `${s.strain} +${s.medianRise}`).join('; ');
const fewestTested = strainTestedCount.slice(0, 6)
  .map(s => `${s.strain} (${s.n} tested)`).join('; ');
const responseSex = sexResponse
  .map(s => `${s.sex}: mean log₂ rise +${s.meanRise}`).join('; ');
const ageBaselineStr = ageBaseline
  .map(b => `${b.age}: ${b.medianD0}`).join(', ');

// Ground the model with the real dataset facts so it can answer the suggestions.
const SYSTEM_PROMPT = `You are a data assistant for the ImmunoExplorer flu-vaccine study dashboard.
Answer questions about the train_combined dataset using these known facts:
- Total participants: ${participants.length}
- Vaccine arms (cohorts): ${cohortCounts.map(c => `${c.cohort} = ${c.count}`).join(', ')}
- Sex: ${sexData.map(s => `${s.name} ${s.value}`).join(', ')}
- Age distribution (bin: count): ${ageHistogram.map(b => `${b.bin}: ${b.count}`).join(', ')}
- HAI strains assayed: ${STRAINS.length}, grouped into H1N1, H3N2, B/Victoria, B/Yamagata, and ancestral B
- Timepoints: Day 0 (baseline), Day 28 (post-vaccination), Day 365 (one year)
- HAI titers are log2-transformed, so a +1 change means a doubling of titer.
- HAI strains with the MOST missing Day-28 values (out of ${participants.length}): ${mostMissingD28}
- HAI strains measured for the MOST participants at Day 28: ${bestCoveredD28}
- Strains tested for the FEWEST participants: ${fewestTested}
- Biggest antibody boost (highest median Day0→28 fold rise, log₂): ${biggestBoost}
- Vaccine response by sex (higher mean rise = more responsive): ${responseSex}
- Baseline (Day-0) titer by age group (median log₂): ${ageBaselineStr}
Be concise. Use only the facts above. This dataset has no transcriptomics or challenge-cohort information, so say so if asked. If a question needs data not listed above, say what would be required.`;

// LM Studio needs the loaded model's id; fetch it once (fall back to a placeholder).
let cachedModel: string | null = null;
async function getModelId(): Promise<string> {
  if (cachedModel) return cachedModel;
  try {
    const r = await fetch(`${API_BASE}/v1/models`);
    const d = await r.json();
    cachedModel = d?.data?.[0]?.id ?? 'local-model';
  } catch {
    cachedModel = 'local-model';
  }
  return cachedModel;
}

const SUGGESTIONS = [
  'How many participants are in each vaccine arm?',
  'What is the distribution of ages in the training set?',
  'Which HAI strains have the most missing values at D28?',
  'Which HAI strains were measured for the most participants?',
];

// Very basic markdown-to-JSX: bold, inline code, code blocks, line breaks
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    // Fenced code block
    if (lines[i].startsWith('```')) {
      const langLine = lines[i];
      const lang = langLine.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={{
          background: '#0D1117',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          padding: '10px 14px',
          overflowX: 'auto',
          fontSize: 12,
          lineHeight: 1.6,
          margin: '8px 0',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          color: '#C9D1D9',
        }}>
          {lang && <div style={{ color: '#6E7681', fontSize: 10, marginBottom: 6 }}>{lang}</div>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++; // skip closing ```
      continue;
    }

    // Bullet list item
    if (lines[i].match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} style={{ paddingLeft: 18, margin: '4px 0', listStyleType: 'disc' }}>
          {items.map((item, j) => (
            <li key={j} style={{ marginBottom: 2, color: '#CBD5E1' }}>{inlineFormat(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (lines[i].trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // Regular paragraph line
    elements.push(
      <p key={i} style={{ margin: '2px 0', lineHeight: 1.65, color: '#CBD5E1' }}>
        {inlineFormat(lines[i])}
      </p>
    );
    i++;
  }

  return <div style={{ fontSize: 13 }}>{elements}</div>;
}

function inlineFormat(text: string): React.ReactNode {
  // Handle **bold** and `code` inline
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: '#E2E8F0' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code key={i} style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
          color: '#00D9C0',
        }}>{part.slice(1, -1)}</code>
      );
    return part;
  });
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [status, setStatus]     = useState<'checking' | 'connected' | 'offline'>('checking');
  const [modelName, setModelName] = useState('');
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Ping the local server on mount to confirm it's reachable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/v1/models`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        const id = d?.data?.[0]?.id ?? 'local-model';
        if (cancelled) return;
        cachedModel = id;
        setModelName(id);
        setStatus('connected');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const STATUS_META = {
    checking:  { color: '#F4A261', label: 'Connecting…' },
    connected: { color: '#06D6A0', label: modelName || 'Connected' },
    offline:   { color: '#EF4444', label: 'Offline · 127.0.0.1:1234' },
  }[status];

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const model = await getModelId();
      const res = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...nextHistory],
          temperature: 0.3,
          stream: false,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? '(empty response)';
      setMessages([...nextHistory, { role: 'assistant', content }]);
      setStatus('connected');
      if (model) setModelName(model);
    } catch (e: any) {
      const failedToFetch = e?.message === 'Failed to fetch' || e?.name === 'TypeError';
      if (failedToFetch) setStatus('offline');
      setError(failedToFetch
        ? 'Could not reach the local model server at 127.0.0.1:1234. Make sure LM Studio’s server is running with CORS enabled.'
        : (e.message ?? 'Could not reach the chat server.'));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const empty = messages.length === 0;

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
            Ask questions about the train_combined dataset
          </div>
        </div>

        {/* Connection status */}
        <div title={`Local model server at ${API_BASE}`} style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 7,
          background: '#1E2130',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '5px 12px',
          maxWidth: 240,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: STATUS_META.color,
            boxShadow: `0 0 6px ${STATUS_META.color}`,
            animation: status === 'checking' ? 'pulse 1.2s ease-in-out infinite' : undefined,
          }} />
          <span style={{
            color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {STATUS_META.label}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

        {/* Empty state + suggestions */}
        {empty && (
          <div style={{ maxWidth: 560, margin: '40px auto 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56,
                background: 'linear-gradient(135deg, #2E86AB 0%, #00D9C0 100%)',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Bot size={28} color="white" />
              </div>
              <div style={{ color: '#E2E8F0', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
                What do you want to know?
              </div>
              <div style={{ color: '#64748B', fontSize: 13 }}>
                Ask anything about the flu vaccine study data.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: '#1E2130',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    color: '#94A3B8',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    lineHeight: 1.5,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(46,134,171,0.15)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(46,134,171,0.4)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1E2130';
                    (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              maxWidth: 760,
              margin: '0 auto 20px',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: m.role === 'user'
                ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                : 'linear-gradient(135deg, #2E86AB 0%, #00D9C0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {m.role === 'user'
                ? <User size={14} color="white" />
                : <Bot  size={14} color="white" />}
            </div>

            {/* Bubble */}
            <div style={{
              background: m.role === 'user' ? 'rgba(99,102,241,0.15)' : '#1E2130',
              border: `1px solid ${m.role === 'user' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              padding: '12px 16px',
              maxWidth: '85%',
              wordBreak: 'break-word',
            }}>
              {m.role === 'assistant'
                ? renderMarkdown(m.content)
                : <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>{m.content}</p>
              }
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div style={{ display: 'flex', gap: 12, maxWidth: 760, margin: '0 auto 20px' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #2E86AB 0%, #00D9C0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="white" />
            </div>
            <div style={{
              background: '#1E2130',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '4px 16px 16px 16px',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Loader2 size={14} color="#2E86AB" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#64748B', fontSize: 13 }}>Thinking…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            maxWidth: 760, margin: '0 auto 20px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={14} color="#EF4444" />
            <span style={{ color: '#FCA5A5', fontSize: 12 }}>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '16px 28px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 760, margin: '0 auto',
          display: 'flex', gap: 10, alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about the data… (Enter to send, Shift+Enter for newline)"
              rows={1}
              style={{
                width: '100%',
                background: '#1E2130',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '12px 14px',
                color: '#E2E8F0',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
                minHeight: 46,
                maxHeight: 160,
                overflowY: 'auto',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e  => (e.target.style.borderColor = 'rgba(46,134,171,0.6)')}
              onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              onInput={e  => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 160) + 'px';
              }}
            />
          </div>
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 46, height: 46, borderRadius: 12, border: 'none',
              background: (!input.trim() || loading)
                ? 'rgba(46,134,171,0.2)'
                : 'linear-gradient(135deg, #2E86AB 0%, #00D9C0 100%)',
              cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <Send size={16} color={(!input.trim() || loading) ? '#64748B' : 'white'} />
          </button>
        </div>
        <div style={{ maxWidth: 760, margin: '6px auto 0', textAlign: 'center', color: '#334155', fontSize: 10 }}>
          Powered by your local model · Data stays local · LM Studio server must be running on 127.0.0.1:1234
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
