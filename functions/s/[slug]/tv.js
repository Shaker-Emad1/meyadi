// شاشة الانتظار في المحل: تابلت على الحيطة، بتتحدث لوحدها كل ١٠ ثواني
import { getShop } from '../../_lib/db.js';
import { page, esc } from '../../_lib/ui.js';

export async function onRequestGet({ env, params }) {
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return new Response('not found', { status: 404 });
  const body = `
<div class="tv">
  <header>
    <div class="shop">
      <div class="mark">${esc(shop.name.trim().charAt(0))}</div>
      <div><h1>${esc(shop.name)}</h1><p>${esc(shop.address || '')} · شاشة الانتظار</p></div>
    </div>
    <div class="clock"><b id="clock">—</b><span class="liv"><i></i> لايف · بيتحدث كل ١٠ ثواني</span></div>
  </header>

  <main>
    <div class="boardwrap">
      <div class="title"><h2>الطابور <em>دلوقتي</em></h2><p id="sub">…</p></div>
      <div class="thead"><span>الدور</span><span>الاسم</span><span>الخدمة</span><span>الحالة</span><span>المتوقع</span></div>
      <div id="rows"><div class="trow"><div class="n">—</div></div></div>
    </div>
    <aside>
      <div class="stat"><h5>داخل دلوقتي</h5><b id="nowName" style="font-size:22px">—</b><p id="nowSvc">—</p></div>
      <div class="stats2">
        <div class="stat"><h5>مستنيين</h5><b id="kW">—</b></div>
        <div class="stat"><h5>متوسط الانتظار</h5><b id="kA">—<small>دقيقة</small></b></div>
      </div>
      <div class="stat"><h5>النهاردة</h5><b id="kT">—<small>حجز</small></b><p id="kD">—</p></div>
      <div class="qr"><div class="tiny">امسح الكود واحجز دورك</div><img id="qr" alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('https://meyadi.pages.dev/s/' + shop.slug + '/?src=tv')}"></div>
    </aside>
  </main>

  <footer><b>MEYADI</b><span>دورك في جيبك · ${esc(shop.slug)}</span></footer>
</div>`;

  const css = `
html,body{height:100%}
.tv{min-height:100vh;padding:26px 34px 0;display:flex;flex-direction:column}
.tv header{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid var(--line)}
.tv .shop{display:flex;align-items:center;gap:14px}
.tv .mark{width:52px;height:52px;border-radius:14px;background:var(--amber);color:#111;display:flex;align-items:center;justify-content:center;font-family:'Alexandria';font-weight:900;font-size:24px}
.tv h1{font-size:26px}
.tv .shop p{font-size:12px;color:var(--mut);margin-top:3px}
.tv .clock{text-align:left}
.tv .clock b{display:block;font-family:'IBM Plex Mono';font-size:36px;font-weight:500;letter-spacing:-1px}
.tv .clock span{font-size:11px;color:var(--mut)}
.tv .liv i{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--green2);margin-left:5px}
.tv main{display:flex;gap:24px;flex:1;padding-top:20px}
.tv .boardwrap{flex:1;min-width:0}
.tv .title{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:22px}
.tv .title h2{font-size:clamp(34px,4.6vw,54px);line-height:1.1}
.tv .title h2 em{font-style:normal;color:var(--amber);margin-right:12px}
.tv .title p{font-size:12px;color:var(--mut);padding-bottom:6px}
.tv .thead{display:grid;grid-template-columns:90px 1.4fr 1.2fr 1fr 90px;gap:10px;padding:0 10px 8px;font-size:11px;color:var(--mut);border-bottom:1px solid var(--line)}
.tv .trow{display:grid;grid-template-columns:90px 1.4fr 1.2fr 1fr 90px;gap:10px;align-items:center;padding:16px 10px;border-bottom:1px solid var(--line)}
.tv .trow.now{background:#1A1710;border-radius:14px;border-bottom-color:#3A2E12}
.tv .trow .n{font-family:'Alexandria';font-weight:900;font-size:38px;color:#5F666C;letter-spacing:-2px}
.tv .trow.now .n{color:var(--amber)}
.tv .trow b{font-size:16px;display:block}
.tv .trow small{font-size:11px;color:var(--mut);display:block}
.tv .trow .cell-svc{font-size:13.5px;color:#D9D5CC}
.tv .trow .eta{font-family:'IBM Plex Mono';font-size:14px;color:#CFCBC2}
.tv aside{width:300px;flex:none;display:flex;flex-direction:column;gap:10px}
.tv .stat{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px}
.tv .stat h5{font-size:10.5px;color:var(--mut);font-weight:600;letter-spacing:.04em;margin-bottom:4px}
.tv .stat b{font-family:'Alexandria';font-size:32px;letter-spacing:-1px}
.tv .stat b small{font-family:'IBM Plex Sans Arabic';font-size:12px;color:var(--mut);font-weight:600;margin-right:3px}
.tv .stat p{font-size:11.5px;color:#AEB4B9;margin-top:3px}
.tv .stats2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tv .qr{background:var(--paper);border-radius:16px;padding:12px;text-align:center;color:#121314;margin-top:auto}
.tv .qr .tiny{font-size:10px;font-weight:700;color:#6C6659;margin-bottom:6px}
.tv .qr img{width:100%;max-width:170px;display:block;margin:0 auto}
.tv footer{margin-top:auto;border-top:1px solid var(--line);padding:14px 0 18px;display:flex;justify-content:space-between;font-size:11px;color:var(--mut)}
.tv footer b{font-family:'IBM Plex Mono';letter-spacing:.16em;font-size:10px;color:var(--text)}
@media(max-width:900px){.tv aside{display:none}.tv .thead,.tv .trow{grid-template-columns:64px 1.4fr 1fr 70px}.tv .thead span:nth-child(3),.tv .trow .cell-svc{display:none}}
`;

  const script = `
const SLUG = ${JSON.stringify(shop.slug)};
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,'0');
function tick(){const d=new Date();$('clock').textContent=pad(d.getHours())+':'+pad(d.getMinutes())}
async function load(){
  try{
    const r=await fetch('/api/s/'+SLUG+'/queue'); const d=await r.json(); if(!d.ok)return;
    $('sub').textContent = d.stats.total+' حجز النهاردة · '+d.stats.waiting+' مستنيين';
    $('nowName').textContent = d.now ? d.now.name : 'مفيش حد';
    $('nowSvc').textContent = d.now ? (d.now.service+(d.now.staff?' · '+d.now.staff:'')) : 'الطابور فاضي';
    $('kW').textContent=d.stats.waiting; $('kA').innerHTML=d.stats.avg_wait_min+'<small>دقيقة</small>';
    $('kT').innerHTML=d.stats.total+'<small>حجز</small>'; $('kD').textContent=d.stats.done+' خلصوا · '+d.stats.no_show+' غياب';
    const rows=[];
    if(d.now) rows.push({n:'●',name:d.now.name,svc:d.now.service,st:'عند الكرسي',cls:'t-now',eta:d.now.start,now:true});
    d.waiting.slice(0,6).forEach(w=>rows.push({n:w.pos,name:w.name,svc:w.service,st:w.arrived?'وصل':'مستني',cls:w.arrived?'t-done':'t-wait',eta:w.eta,now:false}));
    $('rows').innerHTML = rows.length ? rows.map(r=>'<div class="trow'+(r.now?' now':'')+'"><div class="n">'+r.n+'</div><div><b>'+r.name+'</b><small>'+(r.now?'داخل دلوقتي':'في الانتظار')+'</small></div><div class="cell-svc">'+r.svc+'</div><div><span class="tag '+r.cls+'">'+r.st+'</span></div><div class="eta">'+r.eta+'</div></div>').join('') : '<div class="trow"><div class="n">—</div><div><b>الطابور فاضي</b><small>احجز أول دور</small></div></div>';
  }catch(e){}
}
tick(); setInterval(tick,1000); load(); setInterval(load,10000);
`;

  return new Response(page({ title: `شاشة الانتظار · ${shop.name}`, body, script, dark: true, css }), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
