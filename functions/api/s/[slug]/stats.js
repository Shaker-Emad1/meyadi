// إحصائيات المحل: بالخدمة وبالساعة وبالقناة + نسبة الغياب + توقع الذروة
import { json, bad, checkKey } from '../../../_lib/db.js';

export async function onRequestGet({ env, params, request }) {
  const key = new URL(request.url).searchParams.get('key') || '';
  const shop = await checkKey(env.DB, params.slug, key);
  if (!shop) return bad('مفتاح غلط', 403);
  const q = (sql) => env.DB.prepare(sql).bind(shop.id).all();
  const [byService, byHour, bySource, counts, topCustomers] = await Promise.all([
    q("SELECT s.name, COUNT(*) n, SUM(CASE WHEN b.free_loyalty THEN 0 ELSE s.price_egp END) egp FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.shop_id=? AND b.status!='canceled' GROUP BY s.name ORDER BY n DESC"),
    q("SELECT (start_min/60) hour, COUNT(*) n FROM bookings WHERE shop_id=? AND status!='canceled' GROUP BY hour ORDER BY n DESC"),
    q("SELECT COALESCE(NULLIF(source,''),'مباشر') src, COUNT(*) n FROM bookings WHERE shop_id=? GROUP BY src ORDER BY n DESC"),
    q("SELECT COUNT(*) total, SUM(status='no_show') no_shows, SUM(status='done') done FROM bookings WHERE shop_id=?"),
    q("SELECT c.name, c.visits, c.no_shows FROM customers c WHERE c.shop_id=? ORDER BY c.visits DESC LIMIT 5"),
  ]);
  const c = counts.results[0] || {};
  return json({ ok: true, total: c.total || 0, no_show_rate: c.total ? Math.round(100 * (c.no_shows || 0) / c.total) : 0,
    by_service: byService.results, peak_hours: byHour.results.slice(0, 5), sources: bySource.results,
    top_customers: topCustomers.results });
}
