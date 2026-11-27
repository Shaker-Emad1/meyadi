// صفحة الحجز العامة للمحل
import { getShop } from '../../_lib/db.js';

const PAGE = (slug) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ميعادي · حجز</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/app.css">
<link rel="manifest" href="/app.webmanifest">
</head>
<body>
<div class="hero"><div class="inner">
  <div class="brand">ميعادي · حجز أونلاين</div>
  <h1 id="shopName">…</h1>
  <div class="meta" id="shopMeta"></div>
</div></div>
<div class="wrap single">
  <div class="card"><div class="sec">اختار الخدمة</div><div id="services"></div></div>
  <div class="card"><div class="sec">مين يخدمك؟ <small style="color:var(--mut);font-size:12px">(اختياري)</small></div><div class="chips" id="staff"></div></div>
  <div class="card"><div class="sec">اليوم والمعاد</div>
    <div class="days" id="days"></div><div style="height:12px"></div>
    <div class="slots" id="slots"></div>
  </div>
  <div class="card"><div class="sec">بياناتك</div>
    <div class="field"><label>الاسم</label><input id="name"></div>
    <div class="field"><label>رقم الموبايل</label><input id="phone" inputmode="tel" placeholder="01xxxxxxxxx" style="direction:ltr;text-align:right"></div>
    <div class="msg" id="msg"></div>
  </div>
  <div class="card"><div class="sec">اسأل المساعد بالعامية</div>
    <div class="chat-box">
      <div class="chat-log" id="chatLog"><div class="a">قولي عايز تحجز إيه وإمتى، مثلا: "حلاقة بكرة الساعة 6"</div></div>
      <div class="chat-in"><input id="chatIn" placeholder="اكتب هنا…"><button class="btn sm" id="chatSend">ابعت</button></div>
    </div>
  </div>
  <div class="cta"><button class="btn" id="bookBtn">تأكيد الحجز</button>
  <div style="text-align:center;font-size:11.5px;color:var(--mut);margin-top:6px">بدون تسجيل · هيوصلك تأكيد فوري وتذكير قبل الميعاد</div></div>
</div>
<script>
const SLUG=${JSON.stringify(slug)};
const SRC=new URLSearchParams(location.search).get('src')||'';
const DAYS_AR=['الأحد','الاثنين','التلات','الأربع','الخميس','الجمعه','السبت'];
let shop,services,staff,selService=null,selStaff='any',selDate=null,selSlot=null,dates=[];
const $=id=>document.getElementById(id);
const cairoToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function fmt(m){const h=Math.floor(m/60),mm=m%60;const ap=h>=12?'م':'ص';let x=h%12;if(!x)x=12;return x+':'+String(mm).padStart(2,'0')+' '+ap}
async function init(){
  const r=await fetch('/api/s/'+SLUG); const d=await r.json();
  if(!d.ok){$('shopName').textContent='المحل مش موجود';return}
  shop=d.shop;services=d.services;staff=d.staff;
  document.title=shop.name+' · ميعادي';
  $('shopName').textContent=shop.name;
  $('shopMeta').innerHTML=(shop.rating?('★ '+shop.rating+' ('+shop.reviews+' تقييم)'):'')+' <span>'+(shop.address||'')+'</span>';
  $('services').innerHTML=services.map(s=>'<div class="svc" data-id="'+s.id+'"><div class="ic">'+s.name.split(' ')[0]+'</div><div class="nm">'+s.name+'<small>'+s.duration_min+' دقيقة</small></div><div class="pr">'+s.price_egp+' ج</div></div>').join('');
  document.querySelectorAll('.svc').forEach(el=>el.onclick=()=>{document.querySelectorAll('.svc').forEach(x=>x.classList.remove('on'));el.classList.add('on');selService=+el.dataset.id;selSlot=null;loadSlots()});
  $('staff').innerHTML='<div class="chip on" data-id="any">أي حد متاح</div>'+staff.map(s=>'<div class="chip" data-id="'+s.id+'">'+s.name+'</div>').join('');
  document.querySelectorAll('#staff .chip').forEach(el=>el.onclick=()=>{document.querySelectorAll('#staff .chip').forEach(x=>x.classList.remove('on'));el.classList.add('on');selStaff=el.dataset.id;selSlot=null;loadSlots()});
  const t=new Date(cairoToday()+'T12:00:00+02:00');
  for(let i=0;i<7;i++){const d=new Date(t.getTime()+i*864e5);dates.push(new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d))}
  $('days').innerHTML=dates.map((d,i)=>{const wd=new Date(d+'T12:00:00+02:00').getUTCDay();return '<div class="day'+(i==0?' on':'')+'" data-d="'+d+'"><span>'+DAYS_AR[wd]+'</span><b>'+d.slice(8)+'</b></div>'}).join('');
  selDate=dates[0];
  document.querySelectorAll('.day').forEach(el=>el.onclick=()=>{document.querySelectorAll('.day').forEach(x=>x.classList.remove('on'));el.classList.add('on');selDate=el.dataset.d;selSlot=null;loadSlots()});
  if(services[0])document.querySelector('.svc').click();
}
async function loadSlots(){
  if(!selService||!selDate)return;
  $('slots').innerHTML='…';
  const r=await fetch('/api/s/'+SLUG+'/slots?date='+selDate+'&service='+selService+'&staff='+selStaff);
  const d=await r.json();
  if(d.closed){$('slots').innerHTML='<div style="grid-column:1/-1;text-align:center;color:var(--mut);font-weight:700">المحل مقفول اليوم ده</div>';return}
  if(!d.slots||!d.slots.length){$('slots').innerHTML='<div style="grid-column:1/-1;text-align:center;color:var(--mut);font-weight:700">مفيش مواعيد فاضية — ممكن تدخل قائمة الانتظار من المساعد</div>';return}
  $('slots').innerHTML=d.slots.map(s=>'<div class="slot" data-m="'+s.start_min+'">'+s.label+'</div>').join('');
  document.querySelectorAll('.slot').forEach(el=>el.onclick=()=>{document.querySelectorAll('.slot').forEach(x=>x.classList.remove('on'));el.classList.add('on');selSlot=+el.dataset.m});
}
$('bookBtn').onclick=async()=>{
  const msg=$('msg');msg.className='msg';
  if(!selService||!selSlot){msg.className='msg err';msg.textContent='اختار الخدمة والمعاد الأول';return}
  const name=$('name').value.trim(),phone=$('phone').value.trim();
  if(!name||!phone){msg.className='msg err';msg.textContent='اكتب الاسم ورقم الموبايل';return}
  $('bookBtn').disabled=true;
  const r=await fetch('/api/s/'+SLUG+'/book',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({service_id:selService,staff_id:selStaff,date:selDate,start_min:selSlot,name,phone,source:SRC})});
  const d=await r.json();$('bookBtn').disabled=false;
  if(!d.ok){msg.className='msg err';msg.textContent=d.error||'حصلت مشكلة، جرب تاني';return}
  location.href='/b/'+d.code;
};
$('chatSend').onclick=async()=>{
  const inp=$('chatIn');const t=inp.value.trim();if(!t)return;
  $('chatLog').insertAdjacentHTML('beforeend','<div class="u"></div>');
  $('chatLog').lastChild.textContent=t;inp.value='';
  const r=await fetch('/api/s/'+SLUG+'/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:t})});
  const d=await r.json();
  let html='<div class="a"></div>';
  $('chatLog').insertAdjacentHTML('beforeend',html);
  const el=$('chatLog').lastChild;
  el.textContent=d.reply||d.error||'مش فاهم، جرب صيغة تانية';
  if(d.slots&&d.slots.length){
    const btns=document.createElement('div');btns.className='a';
    d.slots.forEach(s=>{const b=document.createElement('button');b.className='btn sm ghost';b.style.margin='2px';b.textContent=s.label;b.onclick=()=>{
      selService=d.service.id;selDate=d.date;
      document.querySelectorAll('.svc').forEach(x=>x.classList.toggle('on',+x.dataset.id===d.service.id));
      document.querySelectorAll('.day').forEach(x=>x.classList.toggle('on',x.dataset.d===d.date));
      loadSlots().then(()=>{const sl=document.querySelector('.slot[data-m="'+s.start_min+'"]');if(sl)sl.click()});
    };btns.appendChild(b)});
    $('chatLog').appendChild(btns);
  }
  $('chatLog').scrollTop=1e9;
};
$('chatIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('chatSend').click()});
init();
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js');
</script>
</body></html>`;

export async function onRequestGet({ env, params }) {
  const shop = await getShop(env.DB, params.slug);
  const status = shop ? 200 : 404;
  return new Response(PAGE(params.slug), { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
