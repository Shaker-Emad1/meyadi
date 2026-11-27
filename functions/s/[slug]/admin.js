// لوحة صاحب المحل (?key=...) — سايدبار + عرض أسبوعي + حجز يدوي سهل
const PAGE = (slug) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>لوحة التحكم · ميعادي</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/app.css">
<style>
.layout{display:flex;gap:20px;align-items:flex-start}
.side{display:none}
.main{flex:1;min-width:0}
@media(min-width:960px){
  .side{display:block;width:210px;flex:none;position:sticky;top:16px}
  .side .card{padding:10px}
  .side a{display:block;padding:11px 14px;border-radius:12px;font-weight:800;font-size:14px;color:var(--ink,#222);text-decoration:none}
  .side a:hover,.side a.on{background:var(--pri,#0D7A6F);color:#fff}
}
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;overflow-x:auto}
.wd{background:#fff;border:1px solid #0001;border-radius:12px;min-width:96px;padding:8px}
.wd h4{margin:0 0 6px;font-size:13px;text-align:center}
.wd .d{font-size:11px;color:var(--mut,#888);text-align:center;margin-bottom:6px}
.wb{background:var(--bg,#F6F5F1);border-radius:8px;padding:5px 7px;margin-bottom:5px;font-size:11.5px}
.wb b{display:block;font-size:12px}
.wb.off{opacity:.45}
@media(max-width:959px){.week{grid-template-columns:repeat(7,minmax(96px,1fr))}}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:600px){.frow{grid-template-columns:1fr}}
select{width:100%;padding:12px;border:1.5px solid #0002;border-radius:12px;font-family:inherit;font-size:15px;background:#fff}
</style>
</head>
<body>
<div class="hero"><div class="inner"><div class="brand">ميعادي · لوحة صاحب المحل</div><h1 id="shopName">…</h1><div class="meta" id="dateLine"></div></div></div>
<div class="wrap layout">
  <nav class="side"><div class="card">
    <a href="#sec-today" class="on">اليوم</a>
    <a href="#sec-week">الأسبوع</a>
    <a href="#sec-walkin">حجز يدوي</a>
    <a href="#sec-rem">تذكيرات بكرة</a>
    <a href="#sec-wait">قائمة الانتظار</a>
    <a href="#sec-report">التقرير الأسبوعي</a>
    <a href="#sec-tools">أدوات</a>
  </div></nav>
  <div class="main">
    <div class="stats">
      <div class="stat"><b id="cToday">0</b><span>حجوزات النهارده</span></div>
      <div class="stat"><b id="cEgp">0</b><span>إيراد متوقع (ج)</span></div>
      <div class="stat"><b id="cNoShow">0%</b><span>نسبة الغياب</span></div>
    </div>
    <div class="card" id="sec-today"><div class="sec">جدول النهارده</div><div id="today"></div></div>
    <div class="card" id="sec-week"><div class="sec">الأسبوع (من السبت)</div><div class="week" id="week"></div></div>
    <div class="card" id="sec-walkin"><div class="sec">+ حجز يدوي / Walk-in</div>
      <div class="frow">
        <div class="field"><label>الخدمة</label><select id="wService"></select></div>
        <div class="field"><label>المعاد</label><select id="wStart"></select></div>
      </div>
      <div class="frow">
        <div class="field"><label>اسم العميل</label><input id="wName"></div>
        <div class="field"><label>موبايله (اختياري)</label><input id="wPhone" style="direction:ltr;text-align:right"></div>
      </div>
      <button class="btn" id="wAdd">إضافة</button><div class="msg" id="wMsg"></div>
    </div>
    <div class="card" id="sec-rem"><div class="sec">تذكيرات بكرة (واتساب)</div><div id="reminders"></div></div>
    <div class="card" id="sec-wait"><div class="sec">قائمة الانتظار</div><div id="waitlist"></div></div>
    <div class="card" id="sec-report"><div class="sec">التقرير الأسبوعي</div><pre class="rpt" id="report">…</pre></div>
    <div class="card"><div class="sec">استيراد عملاء (اسم,موبايل في كل سطر)</div>
      <div class="field"><textarea id="csv" rows="3" style="direction:rtl"></textarea></div>
      <button class="btn" id="importBtn">استيراد</button><div class="msg" id="iMsg"></div>
    </div>
    <div class="card" id="sec-tools"><div class="sec">أدوات</div>
      <a class="btn ghost" id="qrLink" target="_blank">QR للطباعة</a>
      <a class="btn ghost" id="pageLink" target="_blank" style="margin-top:8px">صفحة الحجز العامة</a>
    </div>
  </div>
</div>
<script>
const SLUG=${JSON.stringify(slug)};
const KEY=new URLSearchParams(location.search).get('key')||'';
const $=id=>document.getElementById(id);
const DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const TAG={confirmed:'قادم',pending_confirm:'محتاج تأكيد',done:'تم',no_show:'مجاش'};
const CLS={done:'t-done',no_show:'t-no'};
const fmt=m=>{const h=Math.floor(m/60),mm=m%60,ap=h<12?'ص':'م';const h12=((h+11)%12)+1;return h12+':'+String(mm).padStart(2,'0')+' '+ap};
async function load(){
  const r=await fetch('/api/s/'+SLUG+'/admin?key='+KEY);const d=await r.json();
  if(!d.ok){$('shopName').textContent=d.error||'مشكلة';return}
  $('shopName').textContent=d.shop.name;$('dateLine').textContent=d.date;
  $('cToday').textContent=d.bookings.length;
  $('cEgp').textContent=d.expected_egp;
  const ns=d.bookings.filter(b=>b.status==='no_show').length;
  $('cNoShow').textContent=d.bookings.length?Math.round(100*ns/d.bookings.length)+'%':'0%';
  $('today').innerHTML=d.bookings.length?d.bookings.map(b=>
    '<div class="bk"><div class="tm">'+b.time+'</div><div class="who"><b>'+(b.customer||'عميل')+'</b><small>'+b.service+' · '+(b.staff||'—')+(b.kind==='walkin'?' · walk-in':'')+'</small></div>'+
    '<span class="tag '+(CLS[b.status]||'t-wait')+'">'+(TAG[b.status]||b.status)+'</span>'+
    (b.status!=='done'&&b.status!=='no_show'?'<button class="btn sm ghost" onclick="st('+b.id+',\\'done\\')">تم</button><button class="btn sm ghost" onclick="st('+b.id+',\\'no_show\\')">مجاش</button>':'')+
    '</div>').join(''):'<div style="color:var(--mut);font-weight:700">مفيش حجوزات النهارده</div>';
  // الأسبوع
  const ws=new Date(d.week_start+'T00:00:00Z');const days=[];
  for(let i=0;i<7;i++){const dd=new Date(ws);dd.setUTCDate(dd.getUTCDate()+i);days.push(dd.toISOString().slice(0,10))}
  $('week').innerHTML=days.map(dt=>{
    const wd=DAYS[new Date(dt+'T00:00:00Z').getUTCDay()];
    const items=d.week.filter(b=>b.date===dt);
    return '<div class="wd"><h4>'+wd+'</h4><div class="d">'+dt.slice(8)+'/'+dt.slice(5,7)+'</div>'+
      (items.length?items.map(b=>'<div class="wb'+(b.status==='no_show'?' off':'')+'"><b>'+b.time+'</b>'+(b.customer||'عميل')+' · '+b.service+'</div>').join(''):'<div class="wb off">فاضي</div>')+'</div>';
  }).join('');
  // فورم الحجز اليدوي
  $('wService').innerHTML=d.services.map(s=>'<option value="'+s.id+'">'+s.name+' ('+s.duration_min+' دقيقة · '+s.price_egp+' ج)</option>').join('');
  const step=d.shop.slot_step_min||30;let opts='';
  for(let m=d.shop.open_min;m<d.shop.close_min;m+=step)opts+='<option value="'+m+'">'+fmt(m)+'</option>';
  $('wStart').innerHTML=opts;
  $('reminders').innerHTML=d.tomorrow_reminders.length?d.tomorrow_reminders.map(b=>
    '<div class="bk"><div class="who"><b>'+b.name+'</b><small>'+b.time+'</small></div><a class="btn sm wa" target="_blank" href="'+b.wa+'">تذكير</a></div>').join(''):'<div style="color:var(--mut);font-weight:700">مفيش حجوزات بكرة</div>';
  $('waitlist').innerHTML=d.waitlist.length?d.waitlist.map(w=>'<div class="bk"><div class="who"><b>'+w.name+'</b><small>'+w.date+'</small></div></div>').join(''):'<div style="color:var(--mut);font-weight:700">فاضية</div>';
  $('qrLink').href='/s/'+SLUG+'/qr?key='+KEY;
  $('pageLink').href='/s/'+SLUG+'/';
  const sr=await fetch('/api/s/'+SLUG+'/report?key='+KEY);const rp=await sr.json();
  if(rp.ok)$('report').textContent=rp.report;
}
window.st=async(id,status)=>{
  await fetch('/api/s/'+SLUG+'/admin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:KEY,op:'status',booking_id:id,status})});
  load();
};
$('wAdd').onclick=async()=>{
  const r=await fetch('/api/s/'+SLUG+'/admin',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({key:KEY,op:'walkin',service_id:$('wService').value,start_min:$('wStart').value,name:$('wName').value,phone:$('wPhone').value})});
  const d=await r.json();const m=$('wMsg');m.className='msg '+(d.ok?'ok':'err');m.textContent=d.ok?'اتضاف':d.error;if(d.ok)load();
};
$('importBtn').onclick=async()=>{
  const r=await fetch('/api/s/'+SLUG+'/admin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:KEY,op:'import',csv:$('csv').value})});
  const d=await r.json();const m=$('iMsg');m.className='msg '+(d.ok?'ok':'err');m.textContent=d.ok?('اتسجل '+d.imported+' عميل'):d.error;
};
load();
</script>
</body></html>`;
export async function onRequestGet({ params }) {
  return new Response(PAGE(params.slug), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
