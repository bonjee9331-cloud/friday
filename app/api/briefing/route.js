import { askFriday } from '../../../lib/brain.js';
import { isAuthorized, unauthorized } from '../../../lib/auth.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function getWeather(){
  try{
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=12.57&longitude=99.96&current_weather=true&hourly=apparent_temperature,precipitation_probability&timezone=Asia%2FBangkok&forecast_days=1',{cache:'no-store'});
    const d=await r.json();const w=d.current_weather;
    const hr=new Date().getHours();
    const feels=Math.round(d.hourly?.apparent_temperature?.[hr]??w.temperature);
    const rain=d.hourly?.precipitation_probability?.[hr]??0;
    const WMO={0:'clear',1:'mostly clear',2:'partly cloudy',3:'overcast',45:'foggy',51:'drizzle',61:'rain',63:'rain',65:'heavy rain',80:'showers',95:'thunderstorms'};
    return `${Math.round(w.temperature)}°C (feels ${feels}°C), ${WMO[w.weathercode]||'variable'}, ${rain}% chance of rain`;
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
export async function GET(request){
  if (!isAuthorized(request)) return unauthorized();
  const [weather,headlines]=await Promise.all([getWeather(),getNews()]);
  const now=new Date().toLocaleString('en-AU',{timeZone:'Asia/Bangkok',weekday:'long',hour:'2-digit',minute:'2-digit'});
  const prompt=`You are FRIDAY, Ben Lynch's personal AI. Deliver his morning briefing. Max 90 words. Sharp, punchy, Aussie tone. Spoken word only — no bullet points, no markdown, no lists. Natural flowing sentences.\n\nInclude: time, Hua Hin weather, weave in 2 headlines and whether they matter to Ben's day, then one sharp focus for today (job hunting, Fair Work case, or life admin — whatever is most pressing).\n\nContext: Ben was dismissed from D2MS on 10 April 2026, currently in Hua Hin Thailand building his Fair Work case and job hunting.\n\nTime: ${now}\nWeather: Hua Hin, ${weather}\nHeadlines: ${headlines.join(' | ')}`;
  const { reply, mock } = await askFriday({
    userMessage: prompt,
    module: 'bob',
    maxTokens: 220
  });

  return Response.json({
    briefing: reply || '',
    mock,
    weather,
    headlines,
    time: now
  });
}
