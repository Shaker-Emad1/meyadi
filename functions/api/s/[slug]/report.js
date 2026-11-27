// التقرير الأسبوعي بالعربي لصاحب المحل (نص جاهز يتبعت واتساب)
import { json, bad, checkKey } from '../../_lib/db.js';

export async function onRequestGet({ env, params, request }) {
  const key = new URL(request.url).searchParams.get('key') || '';
  const shop = await checkKey(env.DB, params.slug, key);
  if (!shop) return bad('مفتاح غلط', 403);
  const { results } = await env.DB.prepare(
    `SELECT s.name service, s.price_egp, b.status, b.start_min, b.free_loyalty FROM bookings b
     JOIN services s ON s.id=b.service_id
     WHERE b.shop_id=? AND b.date >= date('now','-7 days') AND b.status!='canceled'`
  ).bind(shop.id).all();
  const total = results.length;
  const egp = results.reduce((a, b) => a + (b.free_loyalty ? 0 : b.price_egp), 0);
  const noShows = results.filter(b => b.status === 'no_show').length;
  const svcCount = {};
  const hourCount = {};
  for (const b of results) {
    svcCount[b.service] = (svcCount[b.service] || 0) + 1;
    const h = Math.floor(b.start_min / 60);
    hourCount[h] = (hourCount[h] || 0) + 1;
  }
  const topSvc = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0];
  const topHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
  const fmtH = h => { const ap = h >= 12 ? 'م' : 'ص'; let x = h % 12; if (!x) x = 12; return `${x} ${ap}`; };
  const lines = [
    `تقرير الأسبوع — ${shop.name}`,
    `• ${total} حجز بإيراد متوقع ${egp} جنيه.`,
    topSvc ? `• أكتر خدمة مطلوبة: ${topSvc[0]} (${topSvc[1]} حجز).` : null,
    topHour ? `• أعلى وقت زحمة: حوالي الساعة ${fmtH(Number(topHour[0]))}.` : null,
    `• نسبة الغياب: ${total ? Math.round(100 * noShows / total) : 0}%${noShows ? ' — فعّل طلب التأكيد للعملاء المتكررين الغياب.' : '.'}`,
    `• نصيحة: الأوقات الفاضية قبل الذروة ممكن تعمل عليها عرض بكوبون من لوحة التحكم.`,
  ].filter(Boolean);
  return json({ ok: true, report: lines.join('\n') });
}
