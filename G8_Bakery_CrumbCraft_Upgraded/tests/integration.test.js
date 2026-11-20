'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
process.env.DB_FILE = path.join(os.tmpdir(), `g8-integration-${process.pid}.sqlite`);
const { server, db, hashPassword } = require('../server');

test('HTTP integration: login, create booking, protect dashboard and update status', async t => {
  const username = 'integration-admin';
  const password = 'IntegrationPass123!';
  const { hash, salt } = hashPassword(password);
  db.prepare('INSERT INTO admins(username,password_hash,salt,created_at) VALUES(?,?,?,?)').run(username,hash,salt,new Date().toISOString());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    db.close();
    for (const suffix of ['', '-shm', '-wal']) { try { fs.unlinkSync(process.env.DB_FILE + suffix); } catch {} }
  });
  const unauthenticated = await fetch(`${base}/api/bookings`);
  assert.equal(unauthenticated.status, 401);
  const login = await fetch(`${base}/api/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password}) });
  assert.equal(login.status, 200);
  const cookieHeader = login.headers.get('set-cookie');
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Strict/);
  const cookie = cookieHeader.split(';')[0];
  for (let i = 0; i < 5; i++) {
    const failedLogin = await fetch(`${base}/api/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password:'incorrect-password'}) });
    assert.equal(failedLogin.status, 401);
  }
  const throttledLogin = await fetch(`${base}/api/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password:'incorrect-password'}) });
  assert.equal(throttledLogin.status, 429);
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const created = await fetch(`${base}/api/bookings`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:'Integration Customer',phone:'9876543210',festival:'Birthday',date,time:'10 AM - 12 PM',cake:{flavor:'Chocolate Truffle',weight:1,shape:'round',frosting:'Pink',decoration:0}}) });
  assert.equal(created.status, 201);
  const booking = (await created.json()).booking;
  const list = await fetch(`${base}/api/bookings`, { headers:{Cookie:cookie} });
  assert.equal(list.status, 200);
  assert.equal((await list.json()).bookings.length, 1);
  const updated = await fetch(`${base}/api/bookings/${booking.id}/status`, { method:'PATCH', headers:{'Content-Type':'application/json',Cookie:cookie}, body:JSON.stringify({status:'Accepted'}) });
  assert.equal(updated.status, 200);
  const completed = await fetch(`${base}/api/bookings/${booking.id}/status`, { method:'PATCH', headers:{'Content-Type':'application/json',Cookie:cookie}, body:JSON.stringify({status:'Completed'}) });
  assert.equal(completed.status, 200);
  const invalidTransition = await fetch(`${base}/api/bookings/${booking.id}/status`, { method:'PATCH', headers:{'Content-Type':'application/json',Cookie:cookie}, body:JSON.stringify({status:'Cancelled'}) });
  assert.equal(invalidTransition.status, 409);
  const orderPayload = {name:'Capacity Customer',phone:'9876543210',festival:'Birthday',date,time:'12 PM - 2 PM',cake:{flavor:'Mango',weight:0.5,shape:'heart',frosting:'Mint Green',decoration:0}};
  for (let i = 0; i < 24; i++) {
    const response = await fetch(`${base}/api/bookings`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(orderPayload)});
    assert.equal(response.status, 201);
  }
  const overCapacity = await fetch(`${base}/api/bookings`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(orderPayload)});
  assert.equal(overCapacity.status, 409);
  const invalid = await fetch(`${base}/api/bookings`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:'<script>x</script>',phone:'123',festival:'X',date,time:'invalid',cake:{}}) });
  assert.equal(invalid.status, 400);
});
