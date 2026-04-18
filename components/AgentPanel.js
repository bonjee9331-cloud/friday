'use client';

const AGENTS = [
  { key: 'BOB',   name: 'BOB',   role: 'Orchestrator',     colour: '#ff6b35', icon: '🎯' },
  { key: 'SUSAN', name: 'SUSAN', role: 'Job Search',        colour: '#3dd68c', icon: '💼' },
  { key: 'DOUG',  name: 'DOUG',  role: 'Tasks & Fair Work', colour: '#60a5fa', icon: '⚖️' },
  { key: 'RILEY', name: 'RILEY', role: 'Sales Floor',       colour: '#f59e0b', icon: '📊' },
  { key: 'MAYA',  name: 'MAYA',  role: 'Research',          colour: '#c084fc', icon: '🔍' }
];

export { AGENTS };

export default function AgentPanel({ activeAgent = 'BOB', onSelectAgent }) {
  const active = AGENTS.find(a => a.key === activeAgent) || AGENTS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Active agent display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        background: `${active.colour}18`,
        border: `1px solid ${active.colour}44`,
        borderRadius: 8,
        marginBottom: 4
      }}>
        <span style={{ fontSize: 20 }}>{active.icon}</span>
        <div>
          <div style={{ fontWeight: 700, color: active.colour, fontSize: 13, letterSpacing: 1 }}>
            {active.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{active.role}</div>
        </div>
        <div style={{
          marginLeft: 'auto',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: active.colour,
          boxShadow: `0 0 6px ${active.colour}`
        }} />
      </div>

      {/* Agent roster strip */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {AGENTS.map(agent => (
          <button
            key={agent.key}
            onClick={() => onSelectAgent?.(agent.key)}
            title={`Talk to ${agent.name} — ${agent.role}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              background: activeAgent === agent.key ? `${agent.colour}22` : 'transparent',
              border: `1px solid ${activeAgent === agent.key ? agent.colour : agent.colour + '44'}`,
              borderRadius: 20,
              cursor: 'pointer',
              color: agent.colour,
              fontSize: 12,
              fontWeight: activeAgent === agent.key ? 700 : 400,
              transition: 'all 0.15s',
              fontFamily: 'inherit'
            }}
          >
            <span style={{ fontSize: 14 }}>{agent.icon}</span>
            {agent.name}
          </button>
        ))}
      </div>
    </div>
  );
}
