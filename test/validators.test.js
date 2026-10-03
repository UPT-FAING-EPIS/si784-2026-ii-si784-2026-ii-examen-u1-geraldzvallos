const test = require('node:test');
const assert = require('node:assert');
const v = require('../src/validators');

test('cliente valido no genera errores', () => {
  assert.deepStrictEqual(v.validateCustomer({ name: 'Ana Ruiz', email: 'ana@mail.com', phone: '987654321' }), []);
});
test('cliente invalido genera errores', () => {
  assert.ok(v.validateCustomer({ name: 'A', email: 'x', phone: '12' }).length >= 3);
});
test('pedido sin items es invalido', () => {
  assert.ok(v.validateOrder({ customerId: 1, serviceType: 'planchado', items: [] }).length > 0);
});
test('servicio inexistente es invalido', () => {
  assert.ok(v.validateOrder({ customerId: 1, serviceType: 'x', items: [{ garmentType: 'camisa', quantity: 1 }] }).length > 0);
});
test('fecha pasada es invalida', () => {
  assert.ok(v.validateSchedule({ date: '2000-01-01', timeSlot: '08:00-12:00' }).length > 0);
});
test('fecha futura y franja valida', () => {
  assert.deepStrictEqual(v.validateSchedule({ date: '2999-01-01', timeSlot: '14:00-18:00' }), []);
});
test('estado invalido', () => {
  assert.ok(v.validateStatus({ status: 'perdido' }).length > 0);
});
