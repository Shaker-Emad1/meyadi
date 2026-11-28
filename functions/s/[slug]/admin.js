// لوحة صاحب المحل: الطابور، نداء الدور، حجز يدوي، الأسبوع
import { page, esc, topbar } from '../../_lib/ui.js';

export async function onRequestGet({ env, params }) {
  const shop = await env.DB.prepare('SELECT * FROM shops WHERE slug=?').bind(params.slug).first();
  if (!shop) return new Response('not found', { status: 404 });
  const body = `
${topbar(shop)}
<div class="wrap" style="padding:2px 0 34px">
  <div style="padding-top:6px">
    <div class="kicker">OWNER BOARD</div>
    <h1 style="font-size:28px;margin-top:4px">لوحة المحل</h1>
    <div class="row" style="margin-top:10px">
      <a class="btn ghost sm dark" href="/s/${esc(shop.slug)}/" target="_blank">صفحة الحجز</a>
      <a class="btn ghost sm dark" href="/s/${esc(shop.slug)}/tv" target="_blank">شاشة الانتظار</a>
      <a class="btn ghost sm dark" id="qrLink" target="_blank">بوستر QR</a>
    </div>
  </div>

  <div class="panel" style="background:#0B0C0D;color:#F4F1EA;margin-top:16px;border-color:#2A2D31">
    <div class="spread">
      <div class="kicker" style="color:#8C9399">الطابور دلوقتي</div>
      <div class="mono tiny" id="nowTime" style="color:#8C9399">—</div>
    </div>
    <div class="row" style="justify-content:space-between;align-items:flex-end;margin-top:6px">
      <div>
        <div class="num" id="nowName" style="font-size:32px">—</div>
        <div class="small" id="nowSvc" style="color:#AEB4B9;margin-top:2px">—</div>
      </div>
      <div class="row" id="nowBtns">
        <button class="btn amber" id="nextBtn">التالي</button>
        <button class="btn ghost" id="doneBtn">تم</button>
      </div>
    </div>
    <div class="tiny" id="nowLate" style="color:#FF6B4A;margin-top:6px"></div>
  </div>

  <div class="kpis" style="margin-top:12px;grid-template-columns:repeat(4,1fr)">
    <div class="kpi" style="background:#fff;border-color:#E2DAC8;color:#0B0C0D"><b id="kToday">—</b><span style="color:#6C6659">حجوزات النهاردة</span></div>
    <div class="kpi" style="background:#fff;border-color:#E2DAC8;color:#0B0C0D"><b id="kEgp">—</b><span style="color:#6C6659">إيراد متوقع (ج)</span></div>
    <div class="kpi" style="background:#fff;border-color:#E2DAC8;color:#0B0C0D"><b id="kNoShow">—</b><span style="color:#6C6659">نسبة الغياب</span></div>
    <div class="kpi" style="background:#fff;border-color:#E2DAC8;color:#0B0C0D"><b id="kWait">—</b><span style="color:#6C6659">مستنيين دلوقتي</span></div>
  </div>

  <div class="grid2" style="margin-top:14px;align-items:start">
    <div>
      <div class="card">
        <div class="sec"><h3>المستنيين</h3><span class="tag" id="waitTag">—</span></div>
        <div id="waitList"><div class="brow"><div class="who"><span>بيحمل…</span></div></div></div>
      </div>
      <div class="card">
        <div class="sec"><h3>جدول النهاردة</h3><span class="tag" id="todayTag">—</span></div>
        <div id="today"><div class="brow"><div class="who"><span>بيحمل…</span></div></div></div>
      </div>
      <div class="card">
        <div class="sec"><h3>الأسبوع</h3><span class="tag">من السبت</span></div>
        <div class="week" id="week"></div>
      </div>
    </div>
    <div>
      <div class="card">
        <div class="sec"><h3>حجز يدوي / Walk-in</h3></div>
        <div class="field"><label>الخدمة</label><select id="wService"></select></div>
        <div class="field"><label>الميعاد</label><select id="wStart"></select></div>
        <div class="field"><label>الاسم</label><input id="wName" placeholder="اسم العميل"></div>
        <div class="field"><label>الموبايل (اختياري)</label><input id="wPhone" class="ltr" inputmode="tel"></div>
        <button class="btn block" id="wAdd">أضف للطابور</button>
        <div class="msg" id="wMsg"></div>
      </div>

      <div class="card">
        <div class="sec"><h3>تذكيرات بكرة</h3><span class="tag">واتساب</span></div>
        <div id="reminders"><div class="tiny muted">بيحمل…</div></div>
      </div>

      <div class="card">
        <div class="sec"><h3>قائمة الانتظار</h3></div>
        <div id="waitlistQ"><div class="tiny muted">بيحمل…</div></div>
      </div>

      <div class="card">
        <div class="sec"><h3>التقرير الأسبوعي</h3></div>
        <pre class="mono" id="report" style="white-space:pre-wrap;background:#F3EFE6;border-radius:12px;padding:12px;font-size:11.5px;line-height:1.9">…</pre>
      </div>
    </div>
  </div>
  <div class="foot">MEYADI · لوحة ${esc(shop.name)}</div>
</div>`;

  const css = `
.week{display:grid;grid-template-columns:repeat(7,minmax(70px,1fr));gap:6px;overflow-x:auto}
.wd{background:#F7F3EA;border:1px solid #E2DAC8;border-radius:10px;padding:7px;min-width:70px}
.wd h4{font-size:11px;text-align:center;margin-bottom:2px}
.wd .d{font-size:9.5px;color:#6C6659;text-align:center;margin-bottom:5px}
.wb{background:#fff;border-radius:6px;padding:4px 6px;margin-bottom:4px;font-size:10px;line-height:1.4}
.wb b{display:block;font-family:'IBM Plex Mono';font-size:10px}
.wb.off{opacity:.45}
.qrow{display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #E2DAC8}
.qrow:first-child{border-top:none}
.qrow .p{font-family:'Alexandria';font-weight:900;font-size:20px;text-align:center;color:#6C6659}
.qrow b{display:block;font-size:13.5px}
.qrow small{display:block;font-size:11px;color:#6C6659;margin-top:1px}
@media(max-width:820px){.kpis{grid-template-columns:repeat(2,1fr)!important}}
`;

  const script = `
const SLUG = ${JSON.stringify(shop.slug)};
const KEY = new URLSearchParams(location.search).get('key') || '';
const $ = id => document.getElementById(id);
let DATA = null;
const pad = n => String(n).padStart(2,'0');
function fmt(m){const h=Math.floor(m/60),mm=m%60,ap=h<12?'ص':'م';let x=h%12;if(!x)x=12;return x+':'+pad(mm)+' '+ap}
const TAG = {arrived:['وصل','t-now'],confirmed:['قادم','t-wait'],pending_confirm:['محتاج تأكيد','t-late'],in_service:['داخل','t-now'],done:['تم','t-done'],no_show:['مجاش','t-no']};

async function load(){
  const r = await fetch('/api/s/'+SLUG+'/admin?key='+KEY);
  const d = await r.json();
  if(!d.ok){ document.body.innerHTML = '<div class="wrap narrow" style="padding:60px 18px"><h1>مفتاح غلط</h1><p class="muted">افتح اللوحة من اللينك اللي فيه المفتاح.</p></div>'; return; }
  DATA = d;
  $('qrLink').href = '/s/'+SLUG+'/qr?key='+KEY;
  $('nowTime').textContent = 'تحديث ' + pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());
  if(d.queue.now){ $('nowName').textContent = d.queue.now.name; $('nowSvc').textContent = d.queue.now.service + (d.queue.now.staff?(' · '+d.queue.now.staff):''); $('nowLate').textContent = d.queue.now.late_min>0 ? ('متأخر '+d.queue.now.late_min+' دقيقة عن ميعاده') : ''; $('doneBtn').style.display='inline-flex'; }
  else { $('nowName').textContent='مفيش حد جوه'; $('nowSvc').textContent='دوس "التالي" عشان تنادي أول واحد'; $('nowLate').textContent=''; $('doneBtn').style.display='none'; }

  $('kToday').textContent = d.bookings.length;
  $('kEgp').textContent = d.expected_egp;
  const ns = d.bookings.filter(b=>b.status==='no_show').length;
  $('kNoShow').textContent = d.bookings.length ? Math.round(100*ns/d.bookings.length)+'%' : '0%';
  $('kWait').textContent = d.queue.stats.waiting;
  $('waitTag').textContent = d.queue.stats.waiting + ' مستني';
  $('todayTag').textContent = d.bookings.length + ' حجز';

  $('waitList').innerHTML = d.queue.waiting.length ? d.queue.waiting.map(w=>
    '<div class="qrow"><div class="p">'+w.pos+'</div><div><b>'+w.name+'</b><small>'+w.service+' · '+w.start+' · متوقع '+w.eta+(w.arrived?' · وصل':'')+'</small></div>'+
    '<div class="row" style="gap:6px"><button class="btn sm ghost dark" onclick="arrive('+w.id+')">وصل</button><button class="btn sm" onclick="call('+w.id+')">نداء</button></div></div>'
  ).join('') : '<div class="tiny muted" style="padding:8px 0">مفيش حد مستني</div>';

  $('today').innerHTML = d.bookings.length ? d.bookings.map(b=>{
    const t = TAG[b.status] || ['—','t-wait'];
    return '<div class="qrow" style="grid-template-columns:64px 1fr auto"><div class="mono" style="font-size:12px;color:#6C6659">'+b.time+'</div>'+
      '<div><b>'+b.customer+'</b><small>'+b.service+' · '+(b.staff||'—')+(b.kind==='walkin'?' · walk-in':'')+(b.arrived?' · وصل':'')+'</small></div>'+
      '<div class="row" style="gap:6px"><span class="tag '+t[1]+'">'+t[0]+'</span>'+
      (b.status==='done'||b.status==='no_show'?'':'<button class="btn sm ghost dark" onclick="st('+b.id+',\\'done\\')">تم</button><button class="btn sm ghost dark" onclick="st('+b.id+',\\'no_show\\')">مجاش</button>')+
      '</div></div>';
  }).join('') : '<div class="tiny muted" style="padding:8px 0">مفيش حجوزات النهاردة</div>';

  $('wService').innerHTML = d.services.map(s=>'<option value="'+s.id+'">'+s.name+' ('+s.duration_min+' دقيقة · '+s.price_egp+' ج)</option>').join('');
  let opts=''; for(let m=d.shop.open_min;m<d.shop.close_min;m+=d.shop.slot_step_min) opts+='<option value="'+m+'">'+fmt(m)+'</option>';
  $('wStart').innerHTML = opts;

  const ws = new Date(d.week_start+'T00:00:00Z'); const days=[];
  for(let i=0;i<7;i++){const dd=new Date(ws);dd.setUTCDate(dd.getUTCDate()+i);days.push(dd.toISOString().slice(0,10))}
  const DN=['الأحد','الاثنين','التلات','الأربع','الخميس','الجمعة','السبت'];
  $('week').innerHTML = days.map(dt=>{
    const items = d.week.filter(b=>b.date===dt);
    return '<div class="wd"><h4>'+DN[new Date(dt+'T00:00:00Z').getUTCDay()]+'</h4><div class="d">'+dt.slice(8)+'/'+dt.slice(5,7)+'</div>'+
      (items.length?items.map(b=>'<div class="wb'+(b.status==='no_show'?' off':'')+'"><b>'+b.time+'</b>'+b.customer+' · '+b.service+'</div>').join(''):'<div class="wb off">فاضي</div>')+'</div>';
  }).join('');

  $('reminders').innerHTML = d.tomorrow_reminders.length ? d.tomorrow_reminders.map(b=>
    '<div class="qrow" style="grid-template-columns:1fr auto"><div><b>'+b.name+'</b><small>'+b.time+'</small></div><a class="btn sm wa" target="_blank" href="'+b.wa+'">تذكير</a></div>'
  ).join('') : '<div class="tiny muted">مفيش حجوزات بكرة</div>';

  $('waitlistQ').innerHTML = d.waitlist.length ? d.waitlist.map(w=>'<div class="qrow" style="grid-template-columns:1fr auto"><div><b>'+w.name+'</b><small>'+w.date+'</small></div></div>').join('') : '<div class="tiny muted">فاضية</div>';

  const sr = await fetch('/api/s/'+SLUG+'/report?key='+KEY); const rp = await sr.json();
  if(rp.ok) $('report').textContent = rp.report;
}
async function op(body){ const r=await fetch('/api/s/'+SLUG+'/admin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({key:KEY},body))}); return r.json(); }
window.st = async (id,status)=>{ await op({op:'status',booking_id:id,status}); load(); };
window.call = async (id)=>{ await op({op:'call',booking_id:id}); load(); };
window.arrive = async (id)=>{ await op({op:'arrive',booking_id:id}); load(); };
$('nextBtn').onclick = async ()=>{ await op({op:'next'}); load(); };
$('doneBtn').onclick = async ()=>{ if(DATA && DATA.queue.now){ await op({op:'status',booking_id:DATA.queue.now.id,status:'done'}); load(); } };
$('wAdd').onclick = async ()=>{
  const d = await op({op:'walkin',service_id:$('wService').value,start_min:$('wStart').value,name:$('wName').value,phone:$('wPhone').value});
  const m=$('wMsg'); m.className='msg '+(d.ok?'ok':'err'); m.textContent = d.ok?'اتضاف للطابور':(d.error||'مشكلة');
  if(d.ok){ $('wName').value=''; $('wPhone').value=''; load(); }
};
load(); setInterval(load,20000);
`;

  return new Response(page({ title: `لوحة ${shop.name} · ميعادي`, body, script, css }), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
