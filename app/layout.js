import './globals.css';
import FridayNav from '../components/FridayNav';
import WeatherWidget from '../components/WeatherWidget';
import NewsTicker from '../components/NewsTicker';

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
          <main className="main" style={{ paddingBottom: 28 }}>
            <div style={{ position:'fixed', top:12, right:16, zIndex:40 }}>
              <WeatherWidget />
            </div>
            {children}
          </main>
        </div>
        <NewsTicker />
      </body>
    </html>
  );
}
