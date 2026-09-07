/* NARDO — store.js: caché en memoria + localStorage + nube opcional (Cloud/Firebase).
   - Los getters son SINCRÓNICOS: leen la caché (igual que antes para el resto del código).
   - initStore() es ASÍNCRONA: usar con `await`. Carga local, luego nube si hay,
     y queda suscripta a cambios en vivo.
   - Las escrituras actualizan caché+local al instante (optimista) y luego la nube.
   - Sin Firebase configurado funciona 100% en modo local, como siempre. */
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

/* ---------- caché + suscripciones ---------- */
let _cache = { products: null, categories: null, brands: null, families: null, settings: null };
const _subs = [];
function onCatalogChange(fn) {
  if (typeof fn !== "function") return () => {};
  _subs.push(fn);
  return () => { const i = _subs.indexOf(fn); if (i >= 0) _subs.splice(i, 1); };
}
function _emit(kind) { _subs.forEach((fn) => { try { fn(kind); } catch (e) { console.warn(e); } }); }
function notify(msg) { try { if (typeof showToast === "function") showToast(msg); } catch {} }
function _cloudOn() {
  try { return typeof Cloud !== "undefined" && Cloud.isConfigured() && Cloud.isReady(); }
  catch { return false; }
}
function _defaultSettings() {
  return { whatsapp: NARDO_CONFIG.whatsapp, heroImage: "" };
}

function _seedLocal() {
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
function _loadCacheFromLocal() {
  _cache.products = _read(STORE_KEYS.products, []).map(migrateProduct);
  _cache.categories = _read(STORE_KEYS.categories, []).map((c) => ({
    id: c.id, nombre: c.nombre || c.id, texto: c.texto || "", imagen: c.imagen || "",
  }));
  _cache.brands = _read(STORE_KEYS.brands, []);
  _cache.families = _read(STORE_KEYS.families, []);
  _cache.settings = Object.assign(_defaultSettings(), _read(STORE_KEYS.settings, {}));
}
function _mirrorCacheToLocal() {
  try {
    if (_cache.products) _write(STORE_KEYS.products, _cache.products);
    if (_cache.categories) _write(STORE_KEYS.categories, _cache.categories);
    if (_cache.brands) _write(STORE_KEYS.brands, _cache.brands);
    if (_cache.families) _write(STORE_KEYS.families, _cache.families);
    if (_cache.settings) _write(STORE_KEYS.settings, _cache.settings);
  } catch (e) { console.warn("[nardo] no se pudo espejar a local:", e); }
}
function _applySnapshot(snap) {
  if (!snap) return false;
  let changed = false;
  if (snap.products) { _cache.products = snap.products.map(migrateProduct); changed = true; }
  if (snap.taxonomies) {
    if (Array.isArray(snap.taxonomies.categories)) {
      _cache.categories = snap.taxonomies.categories.map((c) => ({
        id: c.id, nombre: c.nombre || c.id, texto: c.texto || "", imagen: c.imagen || "",
      }));
      changed = true;
    }
    if (Array.isArray(snap.taxonomies.brands)) { _cache.brands = snap.taxonomies.brands.slice(); changed = true; }
    if (Array.isArray(snap.taxonomies.families)) { _cache.families = snap.taxonomies.families.slice(); changed = true; }
  }
  if (snap.settings) { _cache.settings = Object.assign(_defaultSettings(), snap.settings); changed = true; }
  return changed;
}

async function initStore() {
  _seedLocal();
  _loadCacheFromLocal();
  if (typeof Cloud !== "undefined" && Cloud.isConfigured()) {
    try {
      await Cloud.init();
      const snap = await Cloud.pullAll();
      // pullAll devuelve products:null si la nube aún no fue migrada -> se respeta lo local
      if (snap && _applySnapshot(snap)) _mirrorCacheToLocal();
      Cloud.subscribe((fresh) => {
        if (_applySnapshot(fresh)) {
          _mirrorCacheToLocal();
          try { if (typeof updateCartBadge === "function") updateCartBadge(); } catch {}
          _emit("cloud");
        }
      });
    } catch (err) {
      console.warn("[nardo] nube no disponible, sigo en modo local.", err);
    }
  }
}

/* ---------- lectura (sincrónica, desde caché) ---------- */
function getProducts(activeOnly = false) {
  const all = (_cache.products || []).map(migrateProduct);
  return activeOnly ? all.filter((p) => p.activo) : all;
}
function getProductById(id) { return getProducts().find((p) => p.id === id) || null; }
function getCategories() { return (_cache.categories || []).slice(); }
function getBrands() { return (_cache.brands || []).slice(); }
function getFamilies() { return (_cache.families || []).slice(); }
function getSettings() { return Object.assign(_defaultSettings(), _cache.settings || {}); }

/* ---------- escritura (optimista: caché+local ya, nube después) ---------- */
async function saveProducts(list) {
  _cache.products = list.map(migrateProduct);
  _mirrorCacheToLocal(); _emit("products");
  if (_cloudOn()) {
    try {
      for (const p of _cache.products) await Cloud.upsertProduct(p);
    } catch (e) { console.warn(e); notify("Se guardó en este dispositivo, pero falló la nube."); }
  }
}
async function upsertProduct(p) {
  const all = getProducts();
  const clean = migrateProduct(p);
  const i = all.findIndex((x) => x.id === clean.id);
  if (i >= 0) all[i] = clean;
  else all.push(clean);
  _cache.products = all;
  _mirrorCacheToLocal(); _emit("products");
  if (_cloudOn()) {
    try { await Cloud.upsertProduct(clean); }
    catch (e) { console.warn(e); notify("Se guardó en este dispositivo, pero falló la nube. Revisá tu conexión o sesión."); }
  }
  return true;
}
async function deleteProduct(id) {
  _cache.products = getProducts().filter((p) => p.id !== id);
  _mirrorCacheToLocal(); _emit("products");
  if (_cloudOn()) {
    try { await Cloud.deleteProduct(id); }
    catch (e) { console.warn(e); notify("Se eliminó en este dispositivo, pero falló la nube."); }
  }
}
async function toggleProductActive(id) {
  const all = getProducts();
  const p = all.find((x) => x.id === id);
  if (p) {
    p.activo = !p.activo;
    _cache.products = all;
    _mirrorCacheToLocal(); _emit("products");
    if (_cloudOn()) {
      try { await Cloud.upsertProduct(migrateProduct(p)); }
      catch (e) { console.warn(e); notify("Se cambió en este dispositivo, pero falló la nube."); }
    }
  }
  return p;
}
function _currentTaxonomies() {
  return { categories: getCategories(), brands: getBrands(), families: getFamilies() };
}
async function saveCategories(list) {
  _cache.categories = list.slice();
  _mirrorCacheToLocal(); _emit("taxonomies");
  if (_cloudOn()) {
    try { await Cloud.pushTaxonomies(_currentTaxonomies()); }
    catch (e) { console.warn(e); notify("Se guardó en este dispositivo, pero falló la nube."); }
  }
}
async function saveBrands(list) {
  _cache.brands = list.slice();
  _mirrorCacheToLocal(); _emit("taxonomies");
  if (_cloudOn()) {
    try { await Cloud.pushTaxonomies(_currentTaxonomies()); }
    catch (e) { console.warn(e); notify("Se guardó en este dispositivo, pero falló la nube."); }
  }
}
async function saveFamilies(list) {
  _cache.families = list.slice();
  _mirrorCacheToLocal(); _emit("taxonomies");
  if (_cloudOn()) {
    try { await Cloud.pushTaxonomies(_currentTaxonomies()); }
    catch (e) { console.warn(e); notify("Se guardó en este dispositivo, pero falló la nube."); }
  }
}
async function saveSettings(patch) {
  _cache.settings = Object.assign(getSettings(), patch);
  _mirrorCacheToLocal(); _emit("settings");
  if (_cloudOn()) {
    try { await Cloud.pushSettings(_cache.settings); }
    catch (e) { console.warn(e); notify("Se guardó en este dispositivo, pero falló la nube."); }
  }
}
/* Métrica "más vendidos" del checkout: solo toca el campo vendidos
   (permitido por reglas incluso sin sesión admin). */
async function bumpVendidos(map) {
  if (!map) return;
  const all = getProducts();
  let touched = false;
  Object.entries(map).forEach(([id, qty]) => {
    const p = all.find((x) => x.id === id);
    if (p) { p.vendidos = (p.vendidos || 0) + (Number(qty) || 0); touched = true; }
  });
  if (!touched) return;
  _cache.products = all;
  try { _write(STORE_KEYS.products, all); } catch {}
  if (_cloudOn()) {
    try { await Cloud.bumpVendidos(map); } catch (e) { console.warn("[nardo] vendidos nube:", e); }
  }
}
function makeId(prefix = "p") { return prefix + Date.now().toString(36) + Math.floor(Math.random() * 999); }

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function formatARS(n) {
  try {
    return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  } catch {
    // Fallback manual si el locale no existe en el dispositivo
    const v = String(Math.round(Number(n) || 0));
    return "$ " + v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}
/* Render seguro: si una tarjeta falla, no rompe toda la grilla */
function safeCard(p) {
  try { return productCard(p); }
  catch (e) { console.warn("[nardo] tarjeta:", e); return ""; }
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
