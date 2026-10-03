const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

let server; let base;
test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json() };
};
const customer = { name: 'Juan Perez', email: 'juan@mail.com', phone: '987654321', address: { street: 'Av. Bolognesi 100', district: 'Tacna' } };

test('flujo completo del pedido', async () => {
  let r = await call('POST', '/customers', customer);
  assert.strictEqual(r.status, 201);
  const cid = r.data.id;

  r = await call('GET', `/customers/${cid}`);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.addresses.length, 1);

  r = await call('POST', '/laundry-orders', { customerId: cid, serviceType: 'lavado al seco', items: [{ garmentType: 'terno', quantity: 2 }] });
  assert.strictEqual(r.status, 201);
  const oid = r.data.id;

  r = await call('POST', `/laundry-orders/${oid}/pickup`, { date: '2999-01-01', timeSlot: '08:00-12:00' });
  assert.strictEqual(r.status, 201);
  r = await call('POST', `/laundry-orders/${oid}/delivery`, { date: '2999-01-03', timeSlot: '14:00-18:00' });
  assert.strictEqual(r.status, 201);

  for (const status of ['recogido', 'en proceso', 'listo', 'enviado', 'entregado']) {
    r = await call('POST', `/laundry-orders/${oid}/status`, { status });
    assert.strictEqual(r.status, 200);
  }
  r = await call('GET', `/laundry-orders/${oid}`);
  assert.strictEqual(r.data.status, 'entregado');
  assert.strictEqual(r.data.delivery.confirmed, 1);
  assert.strictEqual(r.data.history.length, 6);

  r = await call('GET', `/customers/${cid}/laundry-orders`);
  assert.strictEqual(r.data.length, 1);
});

test('validaciones devuelven 400', async () => {
  assert.strictEqual((await call('POST', '/customers', { name: '' })).status, 400);
  assert.strictEqual((await call('POST', '/laundry-orders', {})).status, 400);
  assert.strictEqual((await call('POST', '/laundry-orders/1/pickup', { date: 'x' })).status, 400);
  assert.strictEqual((await call('POST', '/laundry-orders/1/status', { status: 'x' })).status, 400);
});

test('email duplicado devuelve 409', async () => {
  await call('POST', '/customers', { ...customer, email: 'dup@mail.com' });
  assert.strictEqual((await call('POST', '/customers', { ...customer, email: 'dup@mail.com' })).status, 409);
});

test('recursos inexistentes devuelven 404', async () => {
  assert.strictEqual((await call('GET', '/customers/9999')).status, 404);
  assert.strictEqual((await call('GET', '/laundry-orders/9999')).status, 404);
  assert.strictEqual((await call('GET', '/customers/9999/laundry-orders')).status, 404);
  assert.strictEqual((await call('POST', '/laundry-orders/9999/pickup', { date: '2999-01-01', timeSlot: '08:00-12:00' })).status, 404);
  assert.strictEqual((await call('POST', '/laundry-orders/9999/status', { status: 'listo' })).status, 404);
  assert.strictEqual((await call('POST', '/laundry-orders', { customerId: 9999, serviceType: 'planchado', items: [{ garmentType: 'camisa', quantity: 1 }] })).status, 404);
});

test('health responde ok', async () => {
  assert.strictEqual((await call('GET', '/health')).data.status, 'ok');
});
