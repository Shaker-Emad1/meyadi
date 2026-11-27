// صفحة QR للطباعة
import { getShop } from '../../../_lib/db.js';
export async function onRequestGet({ env, params, request }) {
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return new Response('not found', { status: 404 });
  const base = new URL(request.url).origin;
  const page = base + '/s/' + shop.slug + '/?src=qr';
  const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=' + encodeURIComponent(page);
  return new Response(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>QR · ${shop.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;800&display=swap" rel="stylesheet">
<style>body{font-family:Cairo;text-align:center;padding:40px}h1{font-size:28px}p{color:#5E6E6B;font-size:18px}img{width:320px;margin:20px}button{padding:14px 40px;font-size:18px;font-family:Cairo;font-weight:800;background:#0D7A6F;color:#fff;border:none;border-radius:14px}@media print{button{display:none}}</style>
</head><body>
<h1>${shop.name}</h1><p>امسح الكود واحجز ميعادك في ثواني</p>
<img src="${qr}" alt="QR">
<p style="font-size:14px;direction:ltr">${page}</p>
<button onclick="print()">اطبع</button>
</body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
