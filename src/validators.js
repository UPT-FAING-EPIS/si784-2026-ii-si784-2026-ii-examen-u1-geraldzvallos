const STATUSES = ['registrado', 'recogido', 'en proceso', 'listo', 'enviado', 'entregado'];
const SERVICES = ['lavado al peso', 'lavado al seco', 'planchado', 'edredones'];
const SLOTS = ['08:00-12:00', '14:00-18:00'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isText = (v, min = 1, max = 150) => typeof v === 'string' && v.trim().length >= min && v.length <= max;

function validateDate(v) {
  if (typeof v !== 'string' || !DATE.test(v) || Number.isNaN(Date.parse(v))) return 'fecha invalida (YYYY-MM-DD)';
  const today = new Date().toISOString().slice(0, 10);
  if (v < today) return 'la fecha no puede estar en el pasado';
  return null;
}

function validateCustomer(b = {}) {
  const e = [];
  if (!isText(b.name, 2, 100)) e.push('name requerido (2-100 caracteres)');
  if (!isText(b.email, 5, 120) || !EMAIL.test(b.email)) e.push('email invalido');
  if (typeof b.phone !== 'string' || !/^\d{9}$/.test(b.phone)) e.push('phone debe tener 9 digitos');
  if (b.address !== undefined) {
    if (!isText(b.address.street, 3, 150)) e.push('address.street requerido');
    if (!isText(b.address.district, 2, 80)) e.push('address.district requerido');
  }
  return e;
}

function validateOrder(b = {}) {
  const e = [];
  if (!Number.isInteger(b.customerId) || b.customerId < 1) e.push('customerId invalido');
  if (!SERVICES.includes(b.serviceType)) e.push(`serviceType debe ser: ${SERVICES.join(', ')}`);
  if (!Array.isArray(b.items) || b.items.length === 0) e.push('items requerido (al menos una prenda)');
  else b.items.forEach((it, i) => {
    if (!isText(it.garmentType, 2, 60)) e.push(`items[${i}].garmentType requerido`);
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 100) e.push(`items[${i}].quantity debe ser 1-100`);
  });
  return e;
}

function validateSchedule(b = {}) {
  const e = [];
  const dateErr = validateDate(b.date);
  if (dateErr) e.push(dateErr);
  if (!SLOTS.includes(b.timeSlot)) e.push(`timeSlot debe ser: ${SLOTS.join(', ')}`);
  return e;
}

function validateStatus(b = {}) {
  return STATUSES.includes(b.status) ? [] : [`status debe ser: ${STATUSES.join(', ')}`];
}

module.exports = { STATUSES, SERVICES, SLOTS, validateCustomer, validateOrder, validateSchedule, validateStatus };
