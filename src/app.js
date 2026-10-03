const express = require('express');
const path = require('node:path');
const { createDb } = require('./db');
const v = require('./validators');

function createApp(db = createDb()) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    next();
  });
  app.use(express.static(path.join(__dirname, '..', 'public')));

  const bad = (res, errors) => res.status(400).json({ errors });
  const getOrder = (id) => db.prepare('SELECT * FROM laundry_orders WHERE id = ?').get(id);
  const fullOrder = (id) => {
    const o = getOrder(id);
    if (!o) return null;
    return {
      ...o,
      items: db.prepare('SELECT garment_type AS garmentType, quantity FROM order_items WHERE order_id = ?').all(id),
      pickup: db.prepare('SELECT pickup_date AS date, time_slot AS timeSlot FROM pickups WHERE order_id = ?').get(id) || null,
      delivery: db.prepare('SELECT delivery_date AS date, time_slot AS timeSlot, confirmed FROM deliveries WHERE order_id = ?').get(id) || null,
      history: db.prepare('SELECT status, changed_at AS changedAt FROM order_status_history WHERE order_id = ? ORDER BY id').all(id),
    };
  };

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/customers', (req, res) => {
    const errors = v.validateCustomer(req.body);
    if (errors.length) return bad(res, errors);
    const { name, email, phone, address } = req.body;
    if (db.prepare('SELECT 1 FROM customers WHERE email = ?').get(email)) {
      return res.status(409).json({ errors: ['el email ya esta registrado'] });
    }
    const r = db.prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)').run(name.trim(), email, phone);
    const id = Number(r.lastInsertRowid);
    if (address) {
      db.prepare('INSERT INTO addresses (customer_id, street, district, reference) VALUES (?, ?, ?, ?)')
        .run(id, address.street.trim(), address.district.trim(), address.reference || null);
    }
    res.status(201).json({ id });
  });

  app.get('/customers/:id', (req, res) => {
    const c = db.prepare('SELECT id, name, email, phone, created_at AS createdAt FROM customers WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ errors: ['cliente no encontrado'] });
    c.addresses = db.prepare('SELECT id, street, district, reference FROM addresses WHERE customer_id = ?').all(c.id);
    res.json(c);
  });

  app.post('/laundry-orders', (req, res) => {
    const errors = v.validateOrder(req.body);
    if (errors.length) return bad(res, errors);
    const { customerId, serviceType, items, addressId } = req.body;
    if (!db.prepare('SELECT 1 FROM customers WHERE id = ?').get(customerId)) {
      return res.status(404).json({ errors: ['cliente no encontrado'] });
    }
    const r = db.prepare('INSERT INTO laundry_orders (customer_id, address_id, service_type) VALUES (?, ?, ?)')
      .run(customerId, addressId || null, serviceType);
    const id = Number(r.lastInsertRowid);
    const ins = db.prepare('INSERT INTO order_items (order_id, garment_type, quantity) VALUES (?, ?, ?)');
    items.forEach((it) => ins.run(id, it.garmentType.trim(), it.quantity));
    db.prepare('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)').run(id, 'registrado');
    res.status(201).json({ id });
  });

  app.get('/laundry-orders/:id', (req, res) => {
    const o = fullOrder(req.params.id);
    if (!o) return res.status(404).json({ errors: ['pedido no encontrado'] });
    res.json(o);
  });

  const schedule = (table, dateCol) => (req, res) => {
    const errors = v.validateSchedule(req.body);
    if (errors.length) return bad(res, errors);
    if (!getOrder(req.params.id)) return res.status(404).json({ errors: ['pedido no encontrado'] });
    db.prepare(`INSERT OR REPLACE INTO ${table} (order_id, ${dateCol}, time_slot) VALUES (?, ?, ?)`)
      .run(req.params.id, req.body.date, req.body.timeSlot);
    res.status(201).json({ orderId: Number(req.params.id), date: req.body.date, timeSlot: req.body.timeSlot });
  };
  app.post('/laundry-orders/:id/pickup', schedule('pickups', 'pickup_date'));
  app.post('/laundry-orders/:id/delivery', schedule('deliveries', 'delivery_date'));

  app.post('/laundry-orders/:id/status', (req, res) => {
    const errors = v.validateStatus(req.body);
    if (errors.length) return bad(res, errors);
    const o = getOrder(req.params.id);
    if (!o) return res.status(404).json({ errors: ['pedido no encontrado'] });
    if (req.body.status === 'entregado') {
      db.prepare('UPDATE deliveries SET confirmed = 1 WHERE order_id = ?').run(o.id);
    }
    db.prepare('UPDATE laundry_orders SET status = ? WHERE id = ?').run(req.body.status, o.id);
    db.prepare('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)').run(o.id, req.body.status);
    res.json({ id: o.id, status: req.body.status });
  });

  app.get('/customers/:id/laundry-orders', (req, res) => {
    if (!db.prepare('SELECT 1 FROM customers WHERE id = ?').get(req.params.id)) {
      return res.status(404).json({ errors: ['cliente no encontrado'] });
    }
    const ids = db.prepare('SELECT id FROM laundry_orders WHERE customer_id = ? ORDER BY id DESC').all(req.params.id);
    res.json(ids.map((r) => fullOrder(r.id)));
  });

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ errors: ['JSON invalido'] });
    res.status(500).json({ errors: ['error interno'] });
  });
  return app;
}
module.exports = { createApp };
