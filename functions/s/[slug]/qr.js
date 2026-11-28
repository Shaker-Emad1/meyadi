// بوستر المحل: QR للطباعة + ستوري
import { getShop } from '../../_lib/db.js';
import { page, esc, accentFor } from '../../_lib/ui.js';

export async function onRequestGet({ env, params, request }) {
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return new Response('not found', { status: 404 });
  const origin = new URL(request.url).origin;
  const link = origin + '/s/' + shop.slug + '/?src=qr';
  const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=' + encodeURIComponent(link);
  const body = `
<div class="wrap narrow" style="padding:20px 0 40px;max-width:660px;margin:0 auto">
  <div class="poster" id="poster" style="--accent:${accentFor(shop)};background:var(--paper);padding:26px;border-radius:6px">
    <div class="eyebrow" style="color:${accentFor(shop)}">امسح · احجز · استنى دورك</div>
    <h1 style="font-size:clamp(26px,6.4vw,40px);margin-top:8px;line-height:1.2">${esc(shop.name)}</h1>
    <p class="small" style="color:#6C6659;margin-top:6px;font-weight:600">${esc(shop.address || '')}</p>
    <div style="display:flex;gap:18px;align-items:center;margin-top:22px;flex-wrap:wrap">
      <img src="${qr}" alt="QR" style="width:150px;height:150px;background:#fff;padding:8px;border:1px solid #D8CFBC;border-radius:6px">
      <div style="flex:1;min-width:180px">
        <div class="mono tiny" style="color:#6C6659;letter-spacing:.1em">SCAN · MEYADI</div>
        <div style="font-family:'Alexandria';font-weight:800;font-size:22px;margin-top:6px;line-height:1.3">دورك في جيبك</div>
        <p class="small" style="color:#6C6659;margin-top:6px;line-height:1.7">امسح الكود، اختار خدمتك، وخد رقمك في الطابور. هتعرف وقت وصولك المتوقع من موبايلك.</p>
      </div>
    </div>
    <div style="margin-top:22px;border-top:2px solid #0B0C0D;padding-top:10px;display:flex;justify-content:space-between;font-size:10px;color:#6C6659" class="mono">
      <span>MEYADI</span><span>${esc(shop.slug)}</span>
    </div>
  </div>
  <div class="row noprint" style="margin-top:14px">
    <button class="btn" onclick="print()">اطبع البوستر</button>
    <a class="btn ghost dark" href="/s/${esc(shop.slug)}/" target="_blank">صفحة الحجز</a>
    <a class="btn ghost dark" href="/s/${esc(shop.slug)}/tv" target="_blank">شاشة الانتظار</a>
  </div>
</div>`;
  return new Response(page({ title: `بوستر · ${shop.name}`, body, bodyStyle: 'background:#E9E2D2' }), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
