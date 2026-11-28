// قوالب الصفحات المشتركة: خطوط، هيدر، غلاف
export const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">`;

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// لون المحل: كل محل ليه لون من اسمه، فالصفحة تبان برانده
const PALETTE = ['#C6462C', '#2E4A3A', '#1F3A5F', '#6B2D5B', '#8A6A12', '#7A3B1E'];
export function accentFor(shop) {
  const s = String((shop && (shop.slug || shop.id)) || 'x');
  let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return PALETTE[h % PALETTE.length];
}

export function page({ title, body, dark = false, css = '', script = '', bodyStyle = '' }) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${dark ? '#0B0C0D' : '#F3EFE6'}">
<title>${esc(title)}</title>
${FONTS}
<link rel="stylesheet" href="/assets/app.css">
<link rel="manifest" href="/app.webmanifest">
<style>${css}</style>
</head>
<body class="${dark ? 'dark' : ''}" style="${bodyStyle}">
${body}
<script>${script}</script>
</body></html>`;
}

// الهيدر الموحد: براند ميعادي + اسم المحل
export function topbar(shop, opts = {}) {
  const right = shop
    ? `<div class="shop"><b>${esc(shop.name)}</b>${esc(shop.address || '')}</div>`
    : `<div class="shop"><b>ميعادي</b>تشغيل الطابور للمحلات</div>`;
  return `<div class="wrap"><div class="topbar">
    <a class="logo" href="/">مي<i>عادي</i></a>
    ${right}
  </div></div>`;
}
