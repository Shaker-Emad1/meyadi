// لوحة صاحب المحل (?key=...)
const PAGE = (slug) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>لوحة التحكم · ميعادي</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/app.css">
</head>
<body>
<div class="hero"><div class="inner"><div class="brand">ميعادي · لوحة صاحب المحل</div><h1 id="shopName">…</h1><div class="meta" id="dateLine"></div></div></div>
<div class="wrap single">
  <div class="stats">
    <div class="stat"><b id="cToday">0</b><span>حجوزات النهارده</span></div>
    <div class="stat"><b id="cEgp">0</b><span>إيراد متوقع (ج)</span></div>
    <div class="stat"><b id="cNoShow">0%</b><span>نسبة الغياب</span></div>
  </div>
  <div class="card"><div class="sec">جدول النهارده</div><div id="today"></div></div>
  <div class="card"><div class="sec">+ حجز يدوي / Walk-in</div>
    <div class="field"><label>الخدمة</label><input id="wService" placeholder="رقم الخدمة (من صفحة الحجز)" inputmode="numeric"></div>
    <div class="field"><label>الساعة (بالدقايق من منتصف الليل، مثلا 1080 = 6 مساء)</label><input id="wStart" inputmode="numeric"></div>
    <div class="field"><label>اسم العميل</label><input id="wName"></div>
    <div class="field"><label>موبايله (اختياري)</label><input id="wPhone" style="direction:ltr;text-align:right"></div>
    <button class="btn" id="wAdd">إضافة</button><div class="msg" id="wMsg"></div>
  </div>
  <div class="card"><div class="sec">تذكيرات بكرة (واتساب)</div><div id="reminders"></div></div>
  <div class="card"><div class="sec">قائمة الانتظار</div><div id="waitlist"></div></div>
  <div class="card"><div class="sec">التقرير الأسبوعي</div><pre class="rpt" id="report">…</pre></div>
  <div class="card"><div class="sec">استيراد عملاء (اسم,موبايل في كل سطر)</div>
    <div class="field"><textarea id="csv" rows="3" style="direction:rtl"></textarea></div>
    <button class="btn" id="importBtn">استيراد</button><div class="msg" id="iMsg"></div>
  </div>
  <div class="card"><div class="sec">أدوات</div>
    <a class="btn ghost" id="qrLink" target="_blank">QR للطباعة</a>
    <a class="btn ghost" id="pageLink" target="_blank" style="margin-top:8px">صفحة الحجز العامة</a>
  </div>
</div>
<script>
const SLUG=${JSON.stringify(slug)};
const KEY=new URLSearchParams(location.search).get('key')||'';
const $=id=>document.getElementById(id);
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
    '<span class="tag '+(b.status==='done'?'t-done':b.status==='no_show'?'t-no':'t-wait')+'">'+({confirmed:'قادم',pending_confirm:'محتاج تأكيد',done:'تم',no_show:'مجاش'}[b.status]||b.status)+'</span>'+
    (b.status!=='done'&&b.status!=='no_show'?'<button class="btn sm ghost" onclick="st('+b.id+',\'done\')">تم</button><button class="btn sm ghost" onclick="st('+b.id+',\'no_show\')">مجاش</button>':'')+
    '</div>').join(''):'<div style="color:var(--mut);font-weight:700">مفيش حجوزات النهارده</div>';
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
