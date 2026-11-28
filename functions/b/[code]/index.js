// تذكرة الحجز: الدور، وقت الوصول، تأكيد الوصول، الإلغاء، التقييم
import { page, esc, topbar } from '../../_lib/ui.js';
import { fmtMin } from '../../_lib/slots.js';

export async function onRequestGet({ env, params }) {
  const b = await env.DB.prepare(
    `SELECT b.*, s.name service, s.price_egp, st.name staff_name, sh.name shop_name, sh.slug shop_slug, sh.address shop_address
     FROM bookings b JOIN services s ON s.id=b.service_id LEFT JOIN staff st ON st.id=b.staff_id
     JOIN shops sh ON sh.id=b.shop_id WHERE b.code=?`
  ).bind(params.code).first();
  if (!b) {
    return new Response(page({ title: 'التذكرة مش موجودة · ميعادي', dark: true, body: `${topbar(null)}<div class="wrap narrow" style="padding:60px 18px"><h1>التذكرة مش موجودة</h1><p class="muted" style="margin-top:8px">اتأكد من الكود أو اللينك.</p></div>` }), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  const body = `
${topbar({ name: b.shop_name, address: b.shop_address })}
<div class="wrap narrow" style="padding:6px 0 34px">
  <div class="ticket" id="ticket">
    <div class="t-label" id="statusLine">${esc(b.shop_name)}</div>
    <div class="t-row" style="margin-top:6px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div class="t-label" id="posLabel">دورك في الطابور</div>
        <div class="t-num" id="pos">—</div>
        <div class="t-eta" id="eta">بيحمل…</div>
        <div class="t-sub" id="etaTime"></div>
      </div>
      <div style="text-align:left;flex:none">
        <div class="tiny" style="color:#6C6659">كود الحجز</div>
        <div class="mono" id="code" style="font-size:16px;margin-top:2px">${esc(b.code)}</div>
      </div>
    </div>
    <div class="perf on-paper"></div>
    <div class="t-row">
      <div><b id="svc">${esc(b.service)}</b><span id="meta">${esc(b.staff_name || 'أي حد متاح')} · ${esc(b.date)} · ${fmtMin(b.start_min)}</span></div>
      <div class="t-price" id="price">${b.free_loyalty ? 0 : b.price_egp} <small>ج</small></div>
    </div>
    <div class="steps" id="steps">
      <div class="step done"><i></i><span>اتأكد</span></div>
      <div class="step"><i></i><span>في الطابور</span></div>
      <div class="step"><i></i><span>دورك</span></div>
      <div class="step"><i></i><span>خلصت</span></div>
    </div>
  </div>

  <div class="panel" style="margin-top:14px" id="acts">
    <button class="btn amber block" id="arriveBtn">أكد وصولك</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px">
      <a class="btn ghost sm" id="queueLink" href="/s/${esc(b.shop_slug)}/queue?code=${esc(b.code)}">شوف الطابور لايف</a>
      <a class="btn ghost sm" id="waBtn" target="_blank">ابعت التذكرة واتساب</a>
      <button class="btn ghost sm" id="cancelToggle" style="grid-column:1/-1">ألغي الحجز</button>
    </div>
    <div class="msg" id="msg"></div>
  </div>

  <div class="panel" style="margin-top:12px;display:none" id="cancelPanel">
    <div class="sec"><h4>إلغاء الحجز</h4></div>
    <div class="field"><label>رقم الموبايل اللي حجزت بيه</label><input id="phone" class="ltr" inputmode="tel" placeholder="01xxxxxxxxx"></div>
    <button class="btn block" id="cancelBtn" style="background:#B03A24;color:#fff">تأكيد الإلغاء</button>
  </div>

  <div class="panel" style="margin-top:12px;display:none" id="reviewPanel">
    <div class="sec"><h4>قيم زيارتك</h4><span class="tag">بعد الزيارة</span></div>
    <div class="row" id="stars"></div>
    <div class="field" style="margin-top:8px"><label>رقم الموبايل اللي حجزت بيه</label><input id="rphone" class="ltr" inputmode="tel"></div>
    <div class="field"><label>تعليق (اختياري)</label><textarea id="rtext" rows="2"></textarea></div>
    <button class="btn block" id="reviewBtn">إرسال التقييم</button>
  </div>

  <div class="foot">MEYADI · ${esc(b.shop_name)}</div>
</div>`;

  const script = `
const CODE = ${JSON.stringify(b.code)};
const SLUG = ${JSON.stringify(b.shop_slug)};
const $ = id => document.getElementById(id);
let bk = null, state = null, rating = 5;

function fmt(m){const h=Math.floor(m/60),mm=m%60,ap=h<12?'ص':'م';let x=h%12;if(!x)x=12;return x+':'+String(mm).padStart(2,'0')+' '+ap}
function setSteps(active){
  const labels=['اتأكد','في الطابور','دورك','خلصت'];
  $('steps').innerHTML=labels.map((l,i)=>'<div class="step '+(i<active?'done':(i===active?'on':''))+'"><i></i><span>'+l+'</span></div>').join('');
}
async function loadBooking(){
  const r=await fetch('/api/b/'+CODE); const d=await r.json();
  if(!d.ok){$('statusLine').textContent='التذكرة مش موجودة';return}
  bk=d.booking;
  if(bk.status==='canceled')$('statusLine').textContent='التذكرة ملغية';
  if(bk.status==='done')$('statusLine').textContent='زيارة مكتملة';
  $('svc').textContent=bk.service;
  $('meta').textContent=(bk.staff||'أي حد متاح')+' · '+bk.date+' · '+bk.time;
  $('price').innerHTML=(bk.price)+' <small>ج</small>';
  if(bk.status==='canceled'){ $('posLabel').textContent='تذكرة ملغية'; $('pos').textContent='—'; $('eta').textContent='الحجز اتلغى'; $('acts').style.display='none'; setSteps(0); return; }
  if(bk.status==='done'){ $('posLabel').textContent='زيارة مكتملة'; $('pos').textContent='✓'; $('eta').textContent='شكرًا لزيارتك'; $('acts').style.display='none'; setSteps(4); $('reviewPanel').style.display='block'; }
  const txt=encodeURIComponent('تذكرة دوري في '+bk.shop+': '+bk.date+' الساعة '+bk.time+'. الكود '+bk.code);
  $('waBtn').href='https://wa.me/?text='+txt;
}
async function loadQueue(){
  try{
    const r=await fetch('/api/s/'+SLUG+'/queue?code='+CODE); const d=await r.json();
    if(!d.ok)return;
    const m=d.mine;
    if(!m)return;
    if(m.state==='serving'){ $('posLabel').textContent='دورك دلوقتي'; $('pos').textContent='✓'; $('eta').innerHTML='ادخل للمحل'; $('etaTime').textContent=''; setSteps(2); $('arriveBtn').style.display='none'; }
    else if(m.state==='waiting'){
      $('posLabel').textContent='دورك في الطابور';
      $('pos').textContent=m.pos;
      $('eta').innerHTML='بعد حوالي <b>'+m.wait_min+' دقيقة</b>';
      $('etaTime').textContent=m.eta?('الوصول حوالي '+m.eta):'';
      setSteps(1);
    } else { $('eta').textContent=''; }
  }catch(e){}
}
$('arriveBtn').onclick=async()=>{
  const r=await fetch('/api/s/'+SLUG+'/queue',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:CODE,action:'arrive'})});
  const d=await r.json(); const m=$('msg');
  if(!d.ok){m.className='msg err';m.textContent=d.error||'حصلت مشكلة';return}
  m.className='msg ok';m.textContent='تم تأكيد وصولك، استنى دورك هنا.';
  $('arriveBtn').textContent='وصلت ✓'; $('arriveBtn').disabled=true;
  loadQueue();
};
$('cancelToggle').onclick=()=>{ $('cancelPanel').style.display='block'; };
$('cancelBtn').onclick=async()=>{
  const r=await fetch('/api/b/'+CODE+'/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'cancel',phone:$('phone').value.trim()})});
  const d=await r.json(); const m=$('msg');
  if(!d.ok){m.className='msg err';m.textContent=d.error;return}
  location.reload();
};
$('stars').innerHTML=[1,2,3,4,5].map(i=>'<button class="chip" data-r="'+i+'" style="min-width:44px">'+i+'</button>').join('');
$('stars').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{rating=+btn.dataset.r;$('stars').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.r<=rating))});
$('stars').querySelectorAll('button')[4].click();
$('reviewBtn').onclick=async()=>{
  const r=await fetch('/api/b/'+CODE+'/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'review',phone:$('rphone').value.trim(),rating,text:$('rtext').value})});
  const d=await r.json(); const m=$('msg');
  m.className='msg '+(d.ok?'ok':'err'); m.textContent=d.ok?'شكرًا لتقييمك':(d.error||'مشكلة');
};
loadBooking(); loadQueue();
setInterval(loadQueue,15000);
`;

  return new Response(page({ title: `تذكرة ${b.code} · ${b.shop_name}`, body, script, dark: true }), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
