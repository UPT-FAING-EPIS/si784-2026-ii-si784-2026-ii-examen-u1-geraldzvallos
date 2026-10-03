'use strict';
const STATUSES = ['registrado', 'recogido', 'en proceso', 'listo', 'enviado', 'entregado'];
const $ = (id) => document.getElementById(id);
let customerId = null;
let pollTimer = null;

const today = new Date().toISOString().slice(0, 10);
$('pickupDate').min = today;
$('deliveryDate').min = today;

function setMsg(id, text, ok) {
  const el = $(id);
  el.textContent = text;
  el.className = ok ? 'msg ok' : 'msg err';
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.errors || ['error']).join('; '));
  return data;
}

function validateCustomer() {
  const errors = [];
  if ($('name').value.trim().length < 2) errors.push('Nombre muy corto');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('email').value)) errors.push('Email inválido');
  if (!/^\d{9}$/.test($('phone').value)) errors.push('Teléfono: 9 dígitos');
  if ($('street').value.trim().length < 3) errors.push('Dirección requerida');
  if ($('district').value.trim().length < 2) errors.push('Distrito requerido');
  return errors;
}

$('customerForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const errors = validateCustomer();
  if (errors.length) return setMsg('customerMsg', errors.join('. '), false);
  try {
    const r = await api('POST', '/customers', {
      name: $('name').value.trim(), email: $('email').value, phone: $('phone').value,
      address: { street: $('street').value.trim(), district: $('district').value.trim() },
    });
    customerId = r.id;
    $('who').textContent = `Cliente #${customerId}: ${$('name').value.trim()}`;
    setMsg('customerMsg', 'Cliente registrado', true);
    startPolling();
  } catch (e) { setMsg('customerMsg', e.message, false); }
});

$('orderForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (!customerId) return setMsg('orderMsg', 'Primero registra un cliente', false);
  const qty = Number($('qty').value);
  if (!$('garment').value.trim() || !Number.isInteger(qty) || qty < 1) return setMsg('orderMsg', 'Prenda y cantidad inválidas', false);
  if (!$('pickupDate').value || !$('deliveryDate').value) return setMsg('orderMsg', 'Elige fechas de recojo y entrega', false);
  if ($('deliveryDate').value < $('pickupDate').value) return setMsg('orderMsg', 'La entrega no puede ser antes del recojo', false);
  try {
    const o = await api('POST', '/laundry-orders', {
      customerId, serviceType: $('service').value,
      items: [{ garmentType: $('garment').value.trim(), quantity: qty }],
    });
    await api('POST', `/laundry-orders/${o.id}/pickup`, { date: $('pickupDate').value, timeSlot: $('pickupSlot').value });
    await api('POST', `/laundry-orders/${o.id}/delivery`, { date: $('deliveryDate').value, timeSlot: $('deliverySlot').value });
    setMsg('orderMsg', `Pedido #${o.id} creado y programado`, true);
    loadOrders();
  } catch (e) { setMsg('orderMsg', e.message, false); }
});

async function advance(orderId, status) {
  await api('POST', `/laundry-orders/${orderId}/status`, { status });
  loadOrders();
}

function renderOrder(o) {
  const box = document.createElement('div');
  box.className = 'order';
  const title = document.createElement('strong');
  title.textContent = `Pedido #${o.id} · ${o.service_type} `;
  const st = document.createElement('span');
  st.className = 'status';
  st.textContent = o.status;
  box.append(title, st);

  const steps = document.createElement('div');
  steps.className = 'steps';
  const idx = STATUSES.indexOf(o.status);
  STATUSES.forEach((s, i) => {
    const sp = document.createElement('span');
    sp.className = i <= idx ? 'step done' : 'step';
    sp.textContent = s;
    steps.append(sp);
  });
  box.append(steps);

  const info = document.createElement('p');
  info.className = 'small';
  const items = o.items.map((i) => `${i.quantity} x ${i.garmentType}`).join(', ');
  const pk = o.pickup ? `${o.pickup.date} ${o.pickup.timeSlot}` : 'sin programar';
  const dl = o.delivery ? `${o.delivery.date} ${o.delivery.timeSlot}${o.delivery.confirmed ? ' (confirmada)' : ''}` : 'sin programar';
  info.textContent = `Prendas: ${items} | Recojo: ${pk} | Entrega: ${dl}`;
  box.append(info);

  if (idx < STATUSES.length - 1) {
    const btn = document.createElement('button');
    btn.textContent = `Avanzar a: ${STATUSES[idx + 1]}`;
    btn.addEventListener('click', () => advance(o.id, STATUSES[idx + 1]).catch(() => {}));
    box.append(btn);
  }
  return box;
}

async function loadOrders() {
  if (!customerId) return;
  try {
    const orders = await api('GET', `/customers/${customerId}/laundry-orders`);
    const cont = $('orders');
    cont.replaceChildren(...orders.map(renderOrder));
    if (!orders.length) cont.textContent = 'Aún no hay pedidos.';
  } catch (e) { $('orders').textContent = e.message; }
}

function startPolling() {
  clearInterval(pollTimer);
  loadOrders();
  pollTimer = setInterval(loadOrders, 5000);
}
