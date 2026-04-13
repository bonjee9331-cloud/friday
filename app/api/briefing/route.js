import { askFriday } from '../../../lib/brain.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function getWeather(){
  try{
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-37.81&longitude=144.96&current_weather=true&timezone=Australia%2FMelbourne',{cache:'no-store'});
    const d=await r.json();const w=d.current_weather;
    const WMO={0:'clear',1:'mostly clear',2:'partly cloudy',3:'overcast',45:'foggy',51:'drizzle',61:'rain',63:'rain',65:'heavy rain',80:'showers',95:'thunderstorms'};
    return `${Math.round(w.temperature)}\u00b0C, ${WMO[w.weathercode]||'variable'}`;
  }catch{return 'weather unavailable';}
}
async function getNews(){
  try{
    const r=await fetch('https://feeds.bbci.co.uk/news/rss.xml',{cache:'no-store'});
    const txt=await r.text();
    return [...txt.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)]
      .map(m=>m[1].trim()).filter(t=>t&&!t.toLowerCase().includes('bbc')).slice(0,5);
  }catch{return [];}
}
export async function GET(){
  const [weather,headlines]=await Promise.all([getWeather(),getNews()]);
  const now=new Date().toLocaleString('en-AU',{timeZone:'Australia/Melbourne',weekday:'long',hour:'2-digit',minute:'2-digit'});
  const prompt=`You are FRIDAY, Ben Lynch's personal AI. Deliver his morning briefing. Max 90 words. Sharp, punchy, Aussie tone. No lists. Include: time of day, Melbourne weather, weave in 2 top global headlines naturally, close with one sharp coaching focus for the D2MS HelloFresh sales floor today.\n\nTime: ${now}\nWeather: Melbourne, ${weather}\nHeadlines: ${headlines.join(' | ')}`;
  const briefing=await askFriday(prompt,'bob');
  return Response.json({briefing,weather,headlines,time:now});
}
