/* NARDO — store.js: única puerta a localStorage + migración + helpers */
function _read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function _write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function migrateProduct(p) {
  return {
    id: p.id, codigo: p.codigo || p.id.toUpperCase(),
    nombre: p.nombre || "", marca: p.marca || "",
    descripcion: p.descripcion || "",
    categoria: p.categoria || "unisex", familia: p.familia || "Floral",
    genero: p.genero || "Unisex", concentracion: p.concentracion || "EDP",
    tamano: p.tamano || "100 ml",
    precio: Number(p.precio) || 0,
    precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : null,
    stock: Number(p.stock ?? 0), stockMinimo: Number(p.stockMinimo ?? 4),
    destacado: !!p.destacado, oferta: !!p.oferta, nuevo: !!p.nuevo,
    tono: p.tono || "amber",
    imagenPrincipal: p.imagenPrincipal || "",
    imagenes: Array.isArray(p.imagenes) ? p.imagenes : [],
    notas: p.notas || { salida: "", corazon: "", fondo: "" },
    activo: p.activo !== false,
    vendidos: Number(p.vendidos ?? 0),
    fechaCreacion: p.fechaCreacion || new Date().toISOString().slice(0, 10),
  };
}

function initStore() {
  if (!_read(STORE_KEYS.products, null)) _write(STORE_KEYS.products, SEED_PRODUCTS);
  else _write(STORE_KEYS.products, _read(STORE_KEYS.products, []).map(migrateProduct));
  if (!_read(STORE_KEYS.categories, null)) _write(STORE_KEYS.categories, SEED_CATEGORIES);
  if (!_read(STORE_KEYS.brands, null)) _write(STORE_KEYS.brands, SEED_BRANDS);
  if (!_read(STORE_KEYS.families, null)) _write(STORE_KEYS.families, SEED_FAMILIES);
  if (!_read(STORE_KEYS.cart, null)) _write(STORE_KEYS.cart, []);
  if (!_read(STORE_KEYS.settings, null)) _write(STORE_KEYS.settings, { whatsapp: NARDO_CONFIG.whatsapp });
  else {
    // migración: si quedó guardado el número viejo de prueba, actualizar al real
    const s = _read(STORE_KEYS.settings, {});
    if (s && s.whatsapp === "5493834000000") {
      s.whatsapp = NARDO_CONFIG.whatsapp;
      _write(STORE_KEYS.settings, s);
    }
  }
  if (!_read(STORE_KEYS.meta, null)) _write(STORE_KEYS.meta, { version: 2 });
}

function getProducts(activeOnly = false) {
  const all = _read(STORE_KEYS.products, []).map(migrateProduct);
  return activeOnly ? all.filter((p) => p.activo) : all;
}
function getProductById(id) { return getProducts().find((p) => p.id === id) || null; }
function getCategories() {
  return _read(STORE_KEYS.categories, []).map((c) => ({
    id: c.id, nombre: c.nombre || c.id, texto: c.texto || "", imagen: c.imagen || "",
  }));
}
function getBrands() { return _read(STORE_KEYS.brands, []); }
function getFamilies() { return _read(STORE_KEYS.families, []); }
function getSettings() {
  return Object.assign({ whatsapp: NARDO_CONFIG.whatsapp, heroImage: "" }, _read(STORE_KEYS.settings, {}));
}
function saveSettings(patch) { _write(STORE_KEYS.settings, Object.assign(getSettings(), patch)); }
function saveProducts(list) { _write(STORE_KEYS.products, list.map(migrateProduct)); }
function upsertProduct(p) {
  const all = getProducts();
  const i = all.findIndex((x) => x.id === p.id);
  if (i >= 0) all[i] = migrateProduct(p);
  else all.push(migrateProduct(p));
  saveProducts(all);
}
function deleteProduct(id) { saveProducts(getProducts().filter((p) => p.id !== id)); }
function toggleProductActive(id) {
  const all = getProducts();
  const p = all.find((x) => x.id === id);
  if (p) { p.activo = !p.activo; saveProducts(all); }
  return p;
}
function saveCategories(list) { _write(STORE_KEYS.categories, list); }
function saveBrands(list) { _write(STORE_KEYS.brands, list); }
function saveFamilies(list) { _write(STORE_KEYS.families, list); }
function makeId(prefix = "p") { return prefix + Date.now().toString(36) + Math.floor(Math.random() * 999); }

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function formatARS(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}
function stockEstado(p) {
  if (p.stock <= 0) return { label: "Sin stock", cls: "stock-out" };
  if (p.stock <= p.stockMinimo) return { label: "Poco stock", cls: "stock-low" };
  return { label: "Disponible", cls: "stock-ok" };
}
function calcDescuento(p) {
  return p.precioAnterior && p.precioAnterior > p.precio
    ? Math.round((1 - p.precio / p.precioAnterior) * 100) : null;
}
