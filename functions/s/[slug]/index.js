// صفحة المحل: بوستر برانده + حجز بالتذكرة + مساعد بالكلام
import { getShop } from '../../_lib/db.js';
import { page, accentFor, esc, topbar } from '../../_lib/ui.js';

const TYPE = { barber: 'حلاقة', salon: 'صالون', clinic: 'عيادة', course: 'كورسات', general: 'محل' };

export async function onRequestGet({ env, params, request }) {
  const shop = await getShop(env.DB, params.slug);
  if (!shop) {
    return new Response(page({ title: 'المحل مش موجود · ميعادي', dark: true, body: `${topbar(null)}<div class="wrap narrow" style="padding:60px 18px"><h1>المحل مش موجود</h1><p class="muted" style="margin-top:8px">اتأكد من اللينك، أو ابدأ محلك من <a href="/">الصفحة الرئيسية</a>.</p></div>` }), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
  const accent = accentFor(shop);
  const type = TYPE[shop.type] || TYPE.general;
  const body = `
${topbar(shop)}
<div class="wrap">
  <div class="grid2" style="padding:8px 0 34px;align-items:start">
    <div>
      <div class="poster">
        <div class="eyebrow">${esc(type)} · ${esc(shop.address || '')}</div>
        <h1>${esc(shop.name)}</h1>
        <div class="pmeta">
          <p>من ${hour12(shop.open_min)} لـ ${hour12(shop.close_min)}<br>بيستقبل بالدور والمواعيد</p>
          <div class="stamp" id="stamp" style="display:none">تقييم<b id="rate">—</b><span id="revs">—</span></div>
        </div>
        <div class="offer" id="offer" style="display:none">
          <div><h3 id="offName">—</h3><p id="offMeta">—</p></div>
          <div class="big"><span id="offPrice">0</span><small>ج</small></div>
        </div>
        <div class="sec" style="margin-top:20px"><h3>الخدمات</h3><span class="tag" id="svcCount">—</span></div>
        <div id="svcList"><div class="srow"><span class="nm">بيحمل…</span></div></div>
      </div>

      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
        <a class="pill" href="/s/${esc(shop.slug)}/queue" id="queuePill"><span class="dot"></span> الطابور دلوقتي</a>
        <a class="pill" href="/s/${esc(shop.slug)}/tv">شاشة الانتظار</a>
        <a class="pill" href="/s/${esc(shop.slug)}/qr">بوستر وQR</a>
      </div>
    </div>

    <div>
      <div class="card">
        <div class="sec"><h3>احجز دورك</h3><span class="tag" id="selInfo">اختار خدمة</span></div>
        <div class="days" id="days"></div>
        <div class="slots" id="slots" style="margin-top:10px"><div class="tiny muted" style="grid-column:1/-1">اختار خدمة الأول</div></div>
        <div style="margin-top:14px">
          <div class="field"><label>الاسم</label><input id="name" placeholder="اسمك"></div>
          <div class="field"><label>الموبايل</label><input id="phone" class="ltr" inputmode="tel" placeholder="01xxxxxxxxx"></div>
        </div>
        <div class="msg" id="msg"></div>
        <button class="btn block" id="bookBtn" style="margin-top:6px">احجز دوري</button>
        <div class="tiny muted center" style="margin-top:8px">بدون تسجيل · برقم الموبايل بس</div>
      </div>

      <div class="panel" style="margin-top:14px">
        <div class="sec"><h4>أو احجز بالكلام</h4><span class="tag">عامية · صوت</span></div>
        <div class="chat">
          <div class="chat-log" id="chatLog"><div class="bub a">أهلًا، قولي عايز تحجز إيه وإمتى. مثلا: "حلاقة بكرة الساعة 6".</div></div>
          <div class="chat-in"><input id="chatIn" placeholder="اكتب هنا…"><button class="btn amber" id="chatSend">ابعت</button></div>
        </div>
      </div>
    </div>
  </div>
  <div class="foot">MEYADI · ${esc(shop.name)}</div>
</div>`;

  const script = `
const SLUG = ${JSON.stringify(shop.slug)};
const SRC = new URLSearchParams(location.search).get('src') || '';
const DAYS = ['الأحد','الاثنين','التلات','الأربع','الخميس','الجمعة','السبت'];
const $ = id => document.getElementById(id);
let services = [], selService = null, selStaff = 'any', selDate = null, selSlot = null, dates = [];
const cairoToday = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function fmt(m){const h=Math.floor(m/60),mm=m%60,ap=h<12?'ص':'م';let x=h%12;if(!x)x=12;return x+':'+String(mm).padStart(2,'0')+' '+ap}
function money(n){return '<span>'+n+'</span><small>ج</small>'}

async function init(){
  const r = await fetch('/api/s/'+SLUG); const d = await r.json();
  if(!d.ok){$('svcList').innerHTML='<div class="srow">المحل مش موجود</div>';return}
  services = d.services;
  if(d.shop.rating){$('stamp').style.display='flex';$('rate').textContent=d.shop.rating;$('revs').textContent='★ '+d.shop.reviews+' تقييم'}
  if(services[0]){
    $('offer').style.display='flex';
    $('offName').textContent=services[0].name;
    $('offMeta').textContent=services[0].duration_min+' دقيقة · أول خدمة في القائمة';
    $('offPrice').textContent=services[0].price_egp;
  }
  $('svcCount').textContent=services.length+' خدمات';
  $('svcList').innerHTML=services.map(s=>'<button class="srow" data-id="'+s.id+'" style="width:100%;background:none;border:none;border-bottom:1px solid #E2DAC8;text-align:right;font-family:inherit;cursor:pointer;padding:11px 0"><span class="nm">'+s.name+'</span><span class="dots"></span><span class="du">'+s.duration_min+' د</span><span class="pr">'+s.price_egp+'<small>ج</small></span></button>').join('');
  document.querySelectorAll('#svcList .srow').forEach(el=>el.onclick=()=>{
    document.querySelectorAll('#svcList .srow').forEach(x=>x.style.background='none');
    el.style.background='#fff'; selService=+el.dataset.id; selSlot=null;
    $('selInfo').textContent=el.querySelector('.nm').textContent;
    loadSlots();
  });
  const t = new Date(cairoToday()+'T12:00:00+02:00');
  for(let i=0;i<7;i++){const dd=new Date(t.getTime()+i*864e5);dates.push(new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(dd))}
  $('days').innerHTML=dates.map((dd,i)=>{const wd=new Date(dd+'T12:00:00+02:00').getUTCDay();return '<button class="day'+(i===0?' on':'')+'" data-d="'+dd+'"><span>'+DAYS[wd]+'</span><b>'+dd.slice(8)+'</b></button>'}).join('');
  selDate=dates[0];
  document.querySelectorAll('.day').forEach(el=>el.onclick=()=>{document.querySelectorAll('.day').forEach(x=>x.classList.remove('on'));el.classList.add('on');selDate=el.dataset.d;selSlot=null;loadSlots()});
  if(services[0])document.querySelector('#svcList .srow').click();
  queuePill();
}
async function queuePill(){
  try{const r=await fetch('/api/s/'+SLUG+'/queue');const d=await r.json();
    if(d.ok)$('queuePill').innerHTML='<span class="dot"></span> '+d.stats.waiting+' مستنيين';
  }catch(e){}
}
async function loadSlots(){
  if(!selService||!selDate)return;
  $('slots').innerHTML='<div class="tiny muted" style="grid-column:1/-1">بيحمل…</div>';
  const r=await fetch('/api/s/'+SLUG+'/slots?date='+selDate+'&service='+selService+'&staff='+selStaff);
  const d=await r.json();
  if(d.closed){$('slots').innerHTML='<div class="tiny muted" style="grid-column:1/-1">المحل مقفول اليوم ده</div>';return}
  if(!d.slots||!d.slots.length){$('slots').innerHTML='<div class="tiny muted" style="grid-column:1/-1">مفيش مواعيد فاضية — جرب يوم تاني أو كلمنا.</div>';return}
  $('slots').innerHTML=d.slots.map(s=>'<button class="slot" data-m="'+s.start_min+'">'+s.label+'</button>').join('');
  document.querySelectorAll('.slot').forEach(el=>el.onclick=()=>{document.querySelectorAll('.slot').forEach(x=>x.classList.remove('on'));el.classList.add('on');selSlot=+el.dataset.m});
}
$('bookBtn').onclick=async()=>{
  const msg=$('msg');msg.className='msg';
  if(!selService||selSlot===null){msg.className='msg err';msg.textContent='اختار الخدمة والمعاد الأول';return}
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
  $('chatLog').insertAdjacentHTML('beforeend','<div class="bub u"></div>');
  $('chatLog').lastChild.textContent=t;inp.value='';
  const r=await fetch('/api/s/'+SLUG+'/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:t})});
  const d=await r.json();
  $('chatLog').insertAdjacentHTML('beforeend','<div class="bub a"></div>');
  const el=$('chatLog').lastChild;
  el.textContent=d.reply||d.error||'مش فاهم، جرب صيغة تانية';
  if(d.slots&&d.slots.length){
    const box=document.createElement('div');box.className='bub a';
    d.slots.forEach(s=>{const b=document.createElement('button');b.className='btn sm amber';b.style.margin='2px';b.textContent=s.label;b.onclick=()=>{
      selService=d.service.id;selDate=d.date;
      document.querySelectorAll('.day').forEach(x=>x.classList.toggle('on',x.dataset.d===d.date));
      loadSlots().then(()=>{const sl=document.querySelector('.slot[data-m="'+s.start_min+'"]');if(sl)sl.click();window.scrollTo({top:0,behavior:'smooth'})});
    };box.appendChild(b)});
    $('chatLog').appendChild(box);
  }
  $('chatLog').scrollTop=1e9;
};
$('chatIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('chatSend').click()});
init();
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js');
`;

  return new Response(page({ title: `${shop.name} · حجز · ميعادي`, body, script, bodyStyle: `--accent:${accent}` }), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function hour12(m) { const h = Math.floor(m / 60); const ap = h < 12 ? 'الصبح' : (h < 17 ? 'الضهر' : 'بالليل'); let x = h % 12; if (!x) x = 12; return `${x} ${ap}`; }
