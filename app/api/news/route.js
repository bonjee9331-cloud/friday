export const runtime = 'nodejs';
export async function GET(){
  try{
    const r=await fetch('https://feeds.bbci.co.uk/news/rss.xml',{cache:'no-store'});
    const txt=await r.text();
    const items=[...txt.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>m[1]);
    const headlines=items.slice(0,10).map(item=>{
      const t=(item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)||[])[1]||'';
      return t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
    }).filter(Boolean);
    return Response.json({headlines});
  }catch{return Response.json({headlines:[]});}
}
