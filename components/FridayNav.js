import Link from 'next/link';

const links = [
  { href: '/', label: 'Chat', hint: 'Main brain' },
  { href: '/bob', label: 'BOB', hint: 'Sales ops' },
  { href: '/jobs', label: 'Jobs', hint: 'Autopilot' },
  { href: '/tasks', label: 'Tasks', hint: 'Daily runner' },
  { href: '/brain', label: 'Brain', hint: 'Debug' },
  { href: '/settings', label: 'Settings', hint: 'Config' }
];

export default function FridayNav() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">F</div>
        <div>
          <div className="brand-name">FRIDAY</div>
          <div className="brand-sub">Ben's brain</div>
        </div>
      </div>
      <nav className="nav">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="nav-link">
            <span className="nav-label">{l.label}</span>
            <span className="nav-hint">{l.hint}</span>
          </Link>
        ))}
      </nav>
      <div className="status">
        <span className="status-dot online"></span>
        <span>Online</span>
      </div>
    </aside>
  );
}
