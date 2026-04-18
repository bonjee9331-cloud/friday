export const runtime = 'nodejs';
const WMO={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',80:'Showers',81:'Heavy Showers',82:'Violent Showers',95:'Thunderstorm',99:'Hail Storm'};
const WMO_ICON={0:'Clear Sky',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',65:'Heavy Rain',80:'Showers',95:'Thunderstorm'};
function desc(c){return WMO[c]||'Variable';}
export async function GET(){
  try{
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=12.57&longitude=99.96&current_weather=true&hourly=apparent_temperature,precipitation_probability&timezone=Asia%2FBangkok&forecast_days=1',{cache:'no-store'});
    const d=await r.json();const w=d.current_weather;
    const hr=new Date().getHours();
    const feels=Math.round(d.hourly?.apparent_temperature?.[hr]??w.temperature);
    const rain=d.hourly?.precipitation_probability?.[hr]??0;
    return Response.json({temp:Math.round(w.temperature),feels,wind:Math.round(w.windspeed),rain,desc:desc(w.weathercode),code:w.weathercode});
  }catch(e){return Response.json({error:String(e.message)},{status:500});}
}
