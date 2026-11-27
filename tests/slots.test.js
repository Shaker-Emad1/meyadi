import test from 'node:test';
import assert from 'node:assert/strict';
import { slotsForStaff, availableSlots, pickFreeStaff, isValidEgyptPhone, fmtMin, weekdayCairo, slugify, bookingCode, adminKey } from '../functions/_lib/slots.js';

const open = { openMin: 720, closeMin: 1320, stepMin: 30 };

test('slotsForStaff: ميعاد 45 دقيقة بيبدأ كل 30 وبيحترم قفل المحل', () => {
  const s = slotsForStaff({ ...open, durationMin: 45, busy: [] });
  assert.equal(s[0].start_min, 720);
  assert.equal(s.at(-1).end_min <= 1320, true);
});

test('slotsForStaff: الحجز الموجود بيمنع التضارب', () => {
  // حجز من 12:00 لـ12:45
  const busy = [{ start_min: 720, end_min: 765 }];
  const s = slotsForStaff({ ...open, durationMin: 45, busy });
  assert.equal(s.some(x => x.start_min === 720), false);
  assert.equal(s.some(x => x.start_min === 750), false); // 750+45=795 > 720? لا: 750 < 765 تضارب
  assert.equal(s.some(x => x.start_min === 780), true);
});

test('availableSlots: دمج موظفين، الميعاد يظهر لو حد فاضي', () => {
  const busyByStaff = { 1: [{ start_min: 720, end_min: 765 }], 2: [] };
  const s = availableSlots({ ...open, durationMin: 45, staffIds: [1, 2], busyByStaff });
  assert.equal(s.some(x => x.start_min === 720 && x.staff_id === 2), true);
});

test('pickFreeStaff: بيرجع أول فاضي وnull لو الكل مشغول', () => {
  const busyByStaff = { 1: [{ start_min: 720, end_min: 765 }] };
  assert.equal(pickFreeStaff({ staffIds: [1, 2], busyByStaff, start_min: 720, end_min: 765 }), 2);
  assert.equal(pickFreeStaff({ staffIds: [1], busyByStaff, start_min: 720, end_min: 765 }), null);
});

test('isValidEgyptPhone', () => {
  assert.equal(isValidEgyptPhone('01020227296'), true);
  assert.equal(isValidEgyptPhone('0102 022 7296'), true);
  assert.equal(isValidEgyptPhone('12345'), false);
});

test('fmtMin بتنسيق ص/م', () => {
  assert.equal(fmtMin(720), '12:00 م');
  assert.equal(fmtMin(1095), '6:15 م');
  assert.equal(fmtMin(240), '4:00 ص');
});

test('weekdayCairo: السبت يوم 6', () => {
  assert.equal(weekdayCairo('2026-11-28'), 6); // السبت
  assert.equal(weekdayCairo('2026-11-27'), 5); // الجمعه
});

test('slugify + codes', () => {
  assert.equal(slugify('صالون النور!!'), 'صالون-النور');
  assert.match(bookingCode(), /^MQ-[A-Z2-9]{4}$/);
  assert.equal(adminKey().length, 16);
});
