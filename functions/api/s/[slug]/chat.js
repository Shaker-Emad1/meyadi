// مساعد بالعامية: بيفهم طلب بسيط (خدمة + يوم + ساعة) ويرشح مواعيد فاضية
import { json, bad, getShop, shopContext } from '../../../_lib/db.js';
import { todayCairo } from '../../../_lib/slots.js';

const DAYS = { 'السبت': 6, 'الحد': 0, 'الأحد': 0, 'الاتنين': 1, 'الاثنين': 1, 'التلات': 2, 'التلاتاء': 2, 'الثلاثاء': 2, 'الاربع': 3, 'الأربع': 3, 'الاربعاء': 3, 'الخميس': 4, 'الجمعه': 5, 'الجمعة': 5 };

function resolveDate(text) {
  const now = new Date();
  const cairo = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
  if (/النهارده|اليوم/.test(text)) return todayCairo(now);
  if (/بكره|بكرة|بعد بكرة/.test(text)) {
    const d = new Date(now.getTime() + (/بعد بكرة/.test(text) ? 2 : 1) * 864e5);
    return todayCairo(d);
  }
  for (const [w, num] of Object.entries(DAYS)) {
    if (text.includes(w)) {
      // أقرب يوم جاي بنفس الاسم
      const cur = new Date(todayCairo(now) + 'T12:00:00+02:00');
      let diff = (num - cur.getUTCDay() + 7) % 7; if (diff === 0) diff = 7;
      return todayCairo(new Date(cur.getTime() + diff * 864e5));
    }
  }
  return todayCairo(now);
}

export async function onRequestPost({ env, params, request }) {
  let body; try { body = await request.json(); } catch { return bad('JSON مش صالح'); }
  const text = String(body.text || '');
  if (!text.trim()) return bad('اكتب طلبك');
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return bad('المحل مش موجود', 404);
  const ctx = await shopContext(env.DB, shop);
  const svc = ctx.services.find(s => text.includes(s.name.split(' ')[0]) || text.includes(s.name))
    || ctx.services.find(s => s.name.split(' ').some(w => w.length > 3 && text.includes(w)));
  if (!svc) {
    return json({ ok: true, reply: `تمام! عندنا: ${ctx.services.map(s => s.name).join('، ')}. قولي عايز أنهي خدمة وإمتى؟`, need: 'service' });
  }
  const date = resolveDate(text);
  const base = new URL(request.url).origin;
  const r = await fetch(`${base}/api/s/${shop.slug}/slots?date=${date}&service=${svc.id}&staff=any`);
  const data = await r.json();
  const slots = (data.slots || []).slice(0, 4);
  if (!slots.length) return json({ ok: true, reply: `للأسف مفيش مواعيد فاضية ل"${svc.name}" يوم ${date}. تحب تدخل قائمة الانتظار؟`, date, service: svc, slots: [] });
  return json({ ok: true, reply: `"${svc.name}" يوم ${date} — أقرب مواعيد فاضية:`, date, service: svc, slots });
}
