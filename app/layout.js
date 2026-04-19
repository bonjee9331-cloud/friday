import './globals.css';
import HudShell from '../components/HudShell';

export const metadata = {
  title: 'FRIDAY OS',
  description: "Ben Lynch's personal AI operating system — sales ops, job hunt, daily tasks, voice.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <HudShell>{children}</HudShell>
      </body>
    </html>
  );
}
