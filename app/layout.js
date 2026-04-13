import './globals.css';
import FridayNav from '../components/FridayNav';

export const metadata = {
  title: 'Friday',
  description: "Ben Lynch's personal AI brain. BOB sales ops, Job Autopilot, Daily Tasks, voice, Telegram."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <FridayNav />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
