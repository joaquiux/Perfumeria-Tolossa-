/* NARDO — cart.js: carrito con validación de stock */
function getCart() {
  try { return JSON.parse(localStorage.getItem(STORE_KEYS.cart) || "[]"); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(STORE_KEYS.cart, JSON.stringify(cart));
  updateCartBadge();
}
function cartCount() { return getCart().reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0); }
function cartSubtotal() {
  return getCart().reduce((acc, l) => {
    const p = getProductById(l.id);
    return acc + (p ? p.precio * l.cantidad : 0);
  }, 0);
}
function addToCart(productId, cantidad = 1) {
  const p = getProductById(productId);
  if (!p || !p.activo) { showToast("Producto no disponible"); return false; }
  if (p.stock <= 0) { showToast("Sin stock por el momento"); return false; }
  const cart = getCart();
  const linea = cart.find((l) => l.id === productId);
  const actual = linea ? linea.cantidad : 0;
  if (actual + cantidad > p.stock) {
    showToast(`Solo quedan ${p.stock} unidades de ${p.nombre}`);
    return false;
  }
  if (linea) linea.cantidad += cantidad;
  else cart.push({ id: productId, cantidad });
  saveCart(cart);
  return true;
}
function setQty(productId, cantidad) {
  const p = getProductById(productId);
  const cart = getCart();
  const linea = cart.find((l) => l.id === productId);
  if (!linea) return;
  if (cantidad <= 0) { removeFromCart(productId); return; }
  if (p && cantidad > p.stock) { showToast(`Máximo disponible: ${p.stock}`); return; }
  linea.cantidad = cantidad;
  saveCart(cart);
}
function removeFromCart(productId) { saveCart(getCart().filter((l) => l.id !== productId)); }
function clearCart() { saveCart([]); }
function updateCartBadge() {
  const badge = document.querySelector("[data-cart-count]");
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}
let toastTimer = null;
function showToast(message) {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}
