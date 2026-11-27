// محرك المواعيد: كود نقي قابل للاختبار، بيتحكم في إتاحة المواعيد ومنع التضارب.
export function parseDaysOff(s){ return new Set(String(s||'').split(',').filter(Boolean).map(Number)); }

// كل المواعيد الممكنة ليوم معين لموظف واحد
export function slotsForStaff({ openMin, closeMin, stepMin, durationMin, busy }) {
  const out = [];
  for (let t = openMin; t + durationMin <= closeMin; t += stepMin) {
    const clash = busy.some(b => t < b.end_min && t + durationMin > b.start_min);
    if (!clash) out.push({ start_min: t, end_min: t + durationMin });
  }
  return out;
}

// دمج مواعيد كل الموظفين: الميعاد متاح لو فيه موظف واحد على الأقل فاضي
export function availableSlots({ openMin, closeMin, stepMin, durationMin, staffIds, busyByStaff }) {
  const seen = new Map();
  for (const id of staffIds) {
    for (const s of slotsForStaff({ openMin, closeMin, stepMin, durationMin, busy: busyByStaff[id] || [] })) {
      if (!seen.has(s.start_min)) seen.set(s.start_min, { ...s, staff_id: id });
    }
  }
  return [...seen.values()].sort((a, b) => a.start_min - b.start_min);
}

// اختيار موظف فاضي لميعاد محدد (لحجز "أي حد متاح")
export function pickFreeStaff({ staffIds, busyByStaff, start_min, end_min }) {
  for (const id of staffIds) {
    const clash = (busyByStaff[id] || []).some(b => start_min < b.end_min && end_min > b.start_min);
    if (!clash) return id;
  }
  return null;
}

export function isValidEgyptPhone(p){ return /^01[0-9]{9}$/.test(String(p||'').replace(/[\s-]/g,'')); }

export function fmtMin(m){ const h=Math.floor(m/60), mm=m%60; const ap=h>=12?'م':'ص'; let h12=h%12; if(h12===0)h12=12; return `${h12}:${String(mm).padStart(2,'0')} ${ap}`; }

export function todayCairo(d=new Date()){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}
export function weekdayCairo(dateStr){ // 0=Sun..6=Sat من تاريخ YYYY-MM-DD
  return new Date(dateStr+'T12:00:00+02:00').getUTCDay();
}
export function bookingCode(){
  const chars='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c=''; for(let i=0;i<4;i++) c+=chars[Math.floor(Math.random()*chars.length)];
  return 'MQ-'+c;
}
export function adminKey(){
  const chars='abcdefghjkmnpqrstuvwxyz23456789';
  let c=''; for(let i=0;i<16;i++) c+=chars[Math.floor(Math.random()*chars.length)];
  return c;
}
export function slugify(name){
  const base=String(name||'').trim().toLowerCase()
    .replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')
    .replace(/[^a-z0-9ء-ي]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
  return base || 'shop';
}
