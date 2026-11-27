// إنشاء محل جديد في دقايق: POST {name, type?, phone?, address?}
import { json, bad } from '../_lib/db.js';
import { adminKey, slugify } from '../_lib/slots.js';

export async function onRequestPost({ request, env }) {
  let body; try { body = await request.json(); } catch { return bad('JSON مش صالح'); }
  const name = String(body.name || '').trim();
  if (name.length < 2) return bad('اسم المحل مطلوب');
  let slug = slugify(body.slug || name);
  const exists = await env.DB.prepare('SELECT 1 FROM shops WHERE slug=?').bind(slug).first();
  if (exists) slug = slug + '-' + Math.random().toString(36).slice(2, 6);
  const key = adminKey();
  await env.DB.prepare('INSERT INTO shops(slug,name,type,phone,address,admin_key) VALUES(?,?,?,?,?,?)')
    .bind(slug, name, String(body.type || 'general'), String(body.phone || ''), String(body.address || ''), key).run();
  return json({ ok: true, slug, admin_key: key, page: `/s/${slug}/`, admin: `/s/${slug}/admin?key=${key}` });
}
