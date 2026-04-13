import Link from 'next/link';
import { appConfig } from '../lib/config';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/applications', label: 'Applications' },
  { href: '/interviews', label: 'Interviews' },
  { href: '/settings', label: 'Settings' }
];

export default function Nav() {
  return (
    <nav className="nav">
      <div>
        <strong>{appConfig.appName}</strong>
        <div className="muted">Automated job search assistant</div>
      </div>
      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
