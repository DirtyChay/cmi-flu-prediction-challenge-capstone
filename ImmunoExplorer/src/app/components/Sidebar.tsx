import { Database, Activity, GitBranch, User } from 'lucide-react';

export type PageId = 'overview' | 'hai' | 'correlations' | 'participant';

interface NavItem { id: PageId; label: string; icon: React.ComponentType<any>; }

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',    label: 'Dataset Overview',      icon: Database },
  { id: 'hai',         label: 'HAI Titer Explorer',    icon: Activity },
  { id: 'correlations',label: 'Feature Correlations',  icon: GitBranch },
  { id: 'participant', label: 'Participant Deep Dive',  icon: User },
];

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      width: 240,
      background: '#1E2130',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Logo / title */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #2E86AB 0%, #00D9C0 100%)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="white" opacity="0.9" />
              <circle cx="3" cy="4" r="2" fill="white" opacity="0.5" />
              <circle cx="13" cy="4" r="2" fill="white" opacity="0.5" />
              <circle cx="3" cy="12" r="2" fill="white" opacity="0.5" />
              <circle cx="13" cy="12" r="2" fill="white" opacity="0.5" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>ImmunoExplorer</div>
            <div style={{ color: '#64748B', fontSize: 10, marginTop: 1 }}>Flu Vaccine Study</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#E2E8F0' : '#94A3B8',
                background: isActive ? 'rgba(46,134,171,0.15)' : 'transparent',
                borderLeft: isActive ? '2px solid #2E86AB' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
                }
              }}
            >
              <Icon size={16} style={{ color: isActive ? '#2E86AB' : undefined, flexShrink: 0 }} />
              {item.label}
            </button>
          );
        })}
      </nav>


    </aside>
  );
}
