// الطابور اللايف للعميل: مين جوه، مين مستني، ودورك فين
import { getShop } from '../../_lib/db.js';
import { page, esc, topbar } from '../../_lib/ui.js';

export async function onRequestGet({ env, params }) {
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return new Response('not found', { status: 404 });
  const body = `
${topbar(shop)}
<div class="wrap narrow" style="padding:4px 0 30px">
  <div style="padding-top:10px">
    <div class="kicker">LIVE QUEUE</div>
    <div class="spread" style="margin-top:4px">
      <h1 style="font-size:29px">الطابور دلوقتي</h1>
      <div class="pill"><span class="dot"></span><span class="mono" id="clock">—</span></div>
    </div>
  </div>

  <div class="panel" id="nowCard" style="margin-top:16px;border-color:#3A2E12;background:#1A1710">
    <div class="spread"><span class="tag t-now">داخل دلوقتي</span><span class="mono tiny" style="color:#8C9399" id="nowStart"></span></div>
    <div class="num" id="nowName" style="font-size:32px;margin-top:8px">—</div>
    <div class="small" id="nowSvc" style="color:#AEB4B9;margin-top:2px"></div>
  </div>

  <div class="panel" id="mineCard" style="margin-top:12px;display:none;border-color:#4A3A12">
    <div class="spread"><span class="tag t-now">تذكرة دورك</span><span class="mono tiny" id="mineEta"></span></div>
    <div class="row" style="margin-top:8px;align-items:baseline;gap:10px">
      <div class="num" id="minePos" style="font-size:44px">—</div>
      <div class="small" id="mineNote" style="color:#AEB4B9"></div>
    </div>
  </div>

  <div class="panel" style="margin-top:12px">
    <div class="sec"><h4>المستنيين</h4><span class="tag t-wait" id="waitCount">—</span></div>
    <div class="board" id="list"><div class="brow"><div class="who"><span>بيحمل…</span></div></div></div>
  </div>

  <div class="kpis" style="margin-top:12px">
    <div class="kpi"><b id="kWait">—</b><span>مستنيين</span></div>
    <div class="kpi"><b id="kAvg">—</b><span>متوسط الانتظار (دقيقة)</span></div>
    <div class="kpi"><b id="kDone">—</b><span>خلصوا النهاردة</span></div>
    <div class="kpi"><b id="kTotal">—</b><span>حجوزات النهاردة</span></div>
  </div>

  <div class="row" style="margin-top:16px">
    <a class="btn amber" href="/s/${esc(shop.slug)}/">احجز دورك</a>
    <a class="btn ghost" href="/s/${esc(shop.slug)}/tv">شاشة الانتظار</a>
  </div>
  <div class="foot">MEYADI · ${esc(shop.name)}</div>
</div>`;

  const script = `
const SLUG = ${JSON.stringify(shop.slug)};
const CODE = new URLSearchParams(location.search).get('code') || '';
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,'0');
function tick(){ const d=new Date(); $('clock').textContent = pad(d.getHours())+':'+pad(d.getMinutes()); }
async function load(){
  try{
    const r=await fetch('/api/s/'+SLUG+'/queue'+(CODE?('?code='+CODE):''));
    const d=await r.json(); if(!d.ok)return;
    if(d.now){ $('nowName').textContent=d.now.name; $('nowSvc').textContent=d.now.service+(d.now.staff?(' · '+d.now.staff):''); $('nowStart').textContent='من '+d.now.start; }
    else { $('nowName').textContent='مفيش حد جوه'; $('nowSvc').textContent='الطابور فاضي'; $('nowStart').textContent=''; }
    $('waitCount').textContent = d.stats.waiting ? d.stats.waiting+' مستني' : 'فاضي';
    $('list').innerHTML = d.waiting.length ? d.waiting.map(w=>'<div class="brow'+(w.arrived?' now':'')+'"><div class="n">'+w.pos+'</div><div class="who"><b>'+w.name+'</b><span>'+w.service+(w.arrived?' · وصل':'')+'</span></div><div class="side">'+w.eta+'</div></div>').join('') : '<div class="brow"><div class="who"><span>مفيش حد مستني دلوقتي</span></div></div>';
    $('kWait').textContent=d.stats.waiting; $('kAvg').textContent=d.stats.avg_wait_min;
    $('kDone').textContent=d.stats.done; $('kTotal').textContent=d.stats.total;
    if(d.mine && d.mine.state!=='other'){
      $('mineCard').style.display='block';
      $('minePos').textContent = d.mine.state==='serving' ? 'دورك' : d.mine.pos;
      $('mineEta').textContent = d.mine.state==='serving' ? 'ادخل دلوقتي' : ('الوصول '+d.mine.eta);
      $('mineNote').textContent = d.mine.state==='serving' ? 'ادخل للمحل' : ('بعد حوالي '+d.mine.wait_min+' دقيقة');
    }
  }catch(e){}
}
tick(); setInterval(tick,1000);
load(); setInterval(load,10000);
`;
  return new Response(page({ title: `الطابور · ${shop.name}`, body, script, dark: true }), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
