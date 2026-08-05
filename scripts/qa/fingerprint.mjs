const BASE="https://kumamoto-action-navigator-web.cokomo-gt.workers.dev";
const WORDS=["応急給水","無料入浴","り災証明","火の君文化センター","氷川町","119","110","確認できません","有効期限切れ","emergency-strip","action-section","need-grid","area-map","skip-link"];
const label=process.argv[2]??"snapshot";
const r=await fetch(BASE+"/");
const html=await r.text();
const s=await fetch(BASE+"/status");
const sh=await s.text();
const out={
  label, at:new Date().toISOString(),
  serverDate:r.headers.get("date"),
  root:{status:r.status,bytes:html.length,cacheControl:r.headers.get("cache-control")},
  status:{code:s.status,mode:sh.includes("緊急縮退中")?"緊急縮退中":sh.includes("通常表示")?"通常表示":"unknown",cacheControl:s.headers.get("cache-control")},
  counts:Object.fromEntries(WORDS.map(w=>[w,(html.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"))||[]).length])),
};
console.log(JSON.stringify(out,null,2));
