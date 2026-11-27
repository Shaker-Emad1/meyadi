// صفحة تأكيد/إدارة الحجز
const PAGE = (code) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>حجزك · ميعادي</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/app.css">
</head>
<body>
<div class="hero"><div class="inner"><div class="brand">ميعادي</div><h1 id="title">…</h1></div></div>
<div class="wrap single">
  <div class="card" id="details"></div>
  <div class="card" id="actions" style="display:none">
    <div class="msg" id="msg"></div>
    <div class="field"><label>رقم موبايلك (للتأكد إنه حجزك)</label><input id="phone" inputmode="tel" style="direction:ltr;text-align:right"></div>
    <div style="display:grid;gap:8px">
      <button class="btn" id="confirmBtn" style="display:none">أكيد جاي ✓</button>
      <a class="btn wa" id="waBtn" target="_blank">افتح تذكير واتساب</a>
      <button class="btn ghost" id="cancelBtn">إلغاء الحجز</button>
    </div>
  </div>
  <div class="card" id="reviewCard" style="display:none">
    <div class="sec">قيم زيارتك</div>
    <div class="field"><label>من 1 لـ5</label><input id="rating" type="number" min="1" max="5" value="5"></div>
    <div class="field"><label>تعليق (اختياري)</label><textarea id="rtext" rows="2"></textarea></div>
    <button class="btn" id="reviewBtn">إرسال التقييم</button>
  </div>
</div>
<script>
const CODE=${JSON.stringify(code)};
const $=id=>document.getElementById(id);
let bk;
async function load(){
  const r=await fetch('/api/b/'+CODE);const d=await r.json();
  if(!d.ok){$('title').textContent='الحجز مش موجود';return}
  bk=d.booking;
  $('title').textContent=bk.status==='canceled'?'الحجز اتلغى':'حجزك اتأكد!';
  $('details').innerHTML=
    '<div class="bk"><div class="who"><b>'+bk.shop+'</b><small>'+bk.service+' · '+(bk.staff||'أي حد متاح')+'</small></div></div>'+
    '<div class="bk"><div class="tm">📅</div><div class="who"><b>'+bk.date+' · '+bk.time+'</b><small>السعر: '+bk.price+' ج'+(bk.free?' (مجاني — ولاء الحجز العاشر)':'')+'</small></div></div>'+
    '<div class="bk"><div class="who"><b>كود الحجز: '+bk.code+'</b><small>الحالة: '+({confirmed:'مؤكد',pending_confirm:'محتاج تأكيدك',done:'تمت الزيارة',no_show:'غياب',canceled:'ملغي'}[bk.status]||bk.status)+'</small></div></div>';
  if(bk.status==='confirmed'||bk.status==='pending_confirm')$('actions').style.display='block';
  if(bk.status==='pending_confirm')$('confirmBtn').style.display='block';
  if(bk.status==='done')$('reviewCard').style.display='block';
  const txt=encodeURIComponent('تذكير: ميعادك '+bk.date+' الساعة '+bk.time+' في '+bk.shop+'. كود الحجز '+bk.code);
  $('waBtn').href='https://wa.me/?text='+txt;
}
async function act(action,extra){
  const r=await fetch('/api/b/'+CODE+'/action',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify(Object.assign({action,phone:$('phone').value.trim()},extra||{}))});
  const d=await r.json();const msg=$('msg');
  if(!d.ok){msg.className='msg err';msg.textContent=d.error;return false}
  msg.className='msg ok';msg.textContent='تم بنجاح';setTimeout(load,700);return true;
}
$('confirmBtn').onclick=()=>act('confirm');
$('cancelBtn').onclick=()=>{if(confirm('متأكد إنك عايز تلغي؟'))act('cancel')};
$('reviewBtn').onclick=async()=>{
  const r=await fetch('/api/b/'+CODE+'/action',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'review',phone:$('phone').value.trim(),rating:$('rating').value,text:$('rtext').value})});
  const d=await r.json();alert(d.ok?'شكرا لتقييمك!':(d.error||'مشكلة'));
};
load();
</script>
</body></html>`;
export async function onRequestGet({ params }) {
  return new Response(PAGE(params.code), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
