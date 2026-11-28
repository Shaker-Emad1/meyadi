import test from 'node:test';
import assert from 'node:assert/strict';
import { computeQueue, ticketState, maskName, nowCairoMin } from '../functions/_lib/queue.js';

const row = (o) => ({ id: o.id, code: o.code || 'C' + o.id, start_min: o.start_min, end_min: o.end_min ?? o.start_min + 30, status: o.status || 'confirmed', duration_min: o.duration_min || 30, arrived_at: o.arrived_at || null, customer: o.customer || 'عميل', service: 'حلاقة', staff: 'أحمد' });

test('الطابور بيرتب المستنيين وبيحسب الوقت المتوقع', () => {
  const rows = [row({ id: 1, start_min: 600, status: 'in_service' }), row({ id: 2, start_min: 630 }), row({ id: 3, start_min: 660 })];
  const q = computeQueue(rows, 615);
  assert.equal(q.now.id, 1);
  assert.equal(q.waiting.length, 2);
  assert.equal(q.waiting[0].pos, 1);
  assert.equal(q.waiting[0].eta_min, 630);
  assert.equal(q.waiting[1].eta_min, 660);
  assert.equal(q.waiting[0].wait_min, 15);
});

test('لو المحل متأخر، الوقت المتوقع يبدأ من دلوقتي', () => {
  const rows = [row({ id: 1, start_min: 600, status: 'in_service' }), row({ id: 2, start_min: 630 })];
  const q = computeQueue(rows, 700);
  assert.equal(q.waiting[0].eta_min, 700);
  assert.equal(q.stats.behind_min, 100);
});

test('من غير حد جوه، أول واحد هو اللي بعده', () => {
  const rows = [row({ id: 2, start_min: 630 }), row({ id: 3, start_min: 660 })];
  const q = computeQueue(rows, 600);
  assert.equal(q.now, null);
  assert.equal(q.waiting[0].pos, 1);
  assert.equal(q.waiting[0].eta_min, 600);
});

test('تذكرة العميل بتعرف دوره أو إنه جوه', () => {
  const rows = [row({ id: 1, start_min: 600, status: 'in_service' }), row({ id: 2, start_min: 630 })];
  const q = computeQueue(rows, 610);
  assert.equal(ticketState(q, 'C1').state, 'serving');
  assert.equal(ticketState(q, 'C2').pos, 1);
  assert.equal(ticketState(q, 'ZZ').state, 'other');
});

test('اسم الشاشة بيتقصر', () => {
  assert.equal(maskName('محمود عبد الله'), 'محمود ع.');
  assert.equal(maskName('سارة'), 'سارة');
  assert.equal(maskName(''), 'عميل');
});

test('دقيقة القاهرة رقم منطقي', () => {
  const m = nowCairoMin(new Date('2026-11-28T00:30:00Z'));
  assert.ok(m >= 0 && m < 1440);
  assert.equal(m, 150); // 2:30 ص بتوقيت القاهرة
});
