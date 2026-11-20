'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
process.env.DB_FILE = path.join(os.tmpdir(), `g8-security-${process.pid}.sqlite`);
const { cleanText, hashPassword, validateBooking, isRealDate, db } = require('../server');
after(() => {
  db.close();
  for (const suffix of ['', '-shm', '-wal']) { try { fs.unlinkSync(process.env.DB_FILE + suffix); } catch {} }
});

test('server sanitizes markup and control characters from text input', () => {
  assert.equal(cleanText('  <script>alert(1)</script> Alice\n  ', 80), 'alert(1) Alice');
});

test('password hashes use unique salts and verify through scrypt', () => {
  const first = hashPassword('a-long-test-password');
  const second = hashPassword('a-long-test-password');
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
});

test('booking validation accepts valid order data and calculates price server-side', () => {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const booking = validateBooking({ name:'Test Customer', phone:'9876543210', festival:'Birthday', date, time:'10 AM - 12 PM', cake:{ flavor:'Chocolate Truffle', weight:1, shape:'round', frosting:'Pink', decoration:150, price:1 } });
  assert.equal(booking.cake.price, '800.00');
  assert.equal(booking.cake.discountPercent, 0);
});

test('booking validation rejects invalid mobile numbers and unsupported cake options', () => {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const base = { name:'Test Customer', phone:'123', festival:'Birthday', date, time:'10 AM - 12 PM', cake:{ flavor:'Chocolate Truffle', weight:1, shape:'round', frosting:'Pink', decoration:0 } };
  assert.throws(() => validateBooking(base), /valid booking details/);
  assert.throws(() => validateBooking({...base,phone:'9876543210',cake:{...base.cake,weight:99}}), /Cake selection is invalid/);
});


test('calendar date validation rejects impossible dates and accepts leap days', () => {
  assert.equal(isRealDate('2028-02-29'), true);
  assert.equal(isRealDate('2027-02-29'), false);
  assert.equal(isRealDate('2026-13-01'), false);
  assert.equal(isRealDate('2026-04-31'), false);
});

test('booking validation rejects an unsupported frosting value', () => {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const booking = { name:'Test Customer', phone:'9876543210', festival:'Birthday', date, time:'10 AM - 12 PM', cake:{ flavor:'Chocolate Truffle', weight:1, shape:'round', frosting:'url(javascript:alert(1))', decoration:0 } };
  assert.throws(() => validateBooking(booking), /Cake selection is invalid/);
});
