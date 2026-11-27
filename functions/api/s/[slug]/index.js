// بيانات المحل العامة: الخدمات والفريق والتقييمات
import { json, bad, getShop, shopContext } from '../../_lib/db.js';

export async function onRequestGet({ env, params }) {
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return bad('المحل مش موجود', 404);
  const ctx = await shopContext(env.DB, shop);
  const rev = await env.DB.prepare('SELECT COUNT(*) n, AVG(rating) avg FROM reviews WHERE shop_id=?').bind(shop.id).all();
  const r = rev.results[0];
  return json({
    ok: true,
    shop: {
      slug: shop.slug, name: shop.name, type: shop.type, address: shop.address,
      open_min: shop.open_min, close_min: shop.close_min, days_off: shop.days_off,
      slot_step_min: shop.slot_step_min,
      rating: r && r.n ? Math.round(r.avg * 10) / 10 : null, reviews: r ? r.n : 0,
    },
    services: ctx.services, staff: ctx.staff,
  });
}
