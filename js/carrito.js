/* NARDO — carrito.js (página): render + checkout WhatsApp */
document.addEventListener("DOMContentLoaded", async () => {
  await initStore();
  updateCartBadge();
  wireGlobalHeader();
  renderCartPage();
  // En vivo: si cambian precios/stock (nube), re-render
  if (typeof onCatalogChange === "function") {
    onCatalogChange(() => { renderCartPage(); updateCartBadge(); });
  }
});
function renderCartPage() {
  const linesBox = document.querySelector("[data-lines]");
  const summaryBox = document.querySelector("[data-summary]");
  if (!linesBox || !summaryBox) return;
  const cart = getCart().map((l) => ({ ...l, product: getProductById(l.id) })).filter((l) => l.product);

  if (cart.length === 0) {
    linesBox.innerHTML = `<div class="empty-state"><h3>Tu carrito está vacío</h3><p>Recorré el catálogo y sumá tus fragancias favoritas.</p><a class="btn btn-primary" href="catalogo.html">Ver perfumes</a></div>`;
    summaryBox.innerHTML = "";
    return;
  }
  linesBox.innerHTML = cart.map((l) => {
    const p = l.product;
    const img = p.imagenPrincipal
      ? `<img src="${escapeHTML(p.imagenPrincipal)}" alt="${escapeHTML(p.nombre)}">`
      : `<svg viewBox="0 0 120 160" aria-hidden="true"><use href="#bottle-mark" fill="var(--tone-${escapeHTML(p.tono)})"></use></svg>`;
    return `
    <div class="cart-line">
      ${img}
      <div>
        <p class="line-name"><a href="producto.html?id=${escapeHTML(p.id)}">${escapeHTML(p.marca)} ${escapeHTML(p.nombre)}</a></p>
        <p class="line-meta">${escapeHTML(p.tamano)} · ${formatARS(p.precio)} c/u</p>
        <div class="stepper" style="margin-top:8px">
          <button type="button" data-dec="${escapeHTML(p.id)}" aria-label="Quitar uno">−</button>
          <span>${l.cantidad}</span>
          <button type="button" data-inc="${escapeHTML(p.id)}" aria-label="Agregar uno">+</button>
          <button type="button" data-del="${escapeHTML(p.id)}" style="width:auto;padding:0 8px">Quitar</button>
        </div>
      </div>
      <strong>${formatARS(p.precio * l.cantidad)}</strong>
    </div>`;
  }).join("");

  const total = cartSubtotal();
  summaryBox.innerHTML = `
    <div class="row"><span>Subtotal</span><span>${formatARS(total)}</span></div>
    <div class="row"><span>Envío</span><span>A coordinar</span></div>
    <div class="row total"><span>Total estimado</span><span>${formatARS(total)}</span></div>
    <button class="whatsapp-cta" type="button" data-checkout style="width:100%;justify-content:center">Enviar por WhatsApp</button>
    <button type="button" data-clear style="margin-top:12px;width:100%;border:1px solid rgba(239,231,216,.4);padding:.7em;border-radius:2px">Vaciar carrito</button>
    <p style="margin-top:12px;font-size:.8rem;opacity:.7">Nada se cobra online. El vendedor valida stock y coordina la compra.</p>`;

  linesBox.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => {
    const l = getCart().find((x) => x.id === b.dataset.inc);
    setQty(b.dataset.inc, (l ? l.cantidad : 0) + 1);
    renderCartPage(); updateCartBadge();
  }));
  linesBox.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => {
    const l = getCart().find((x) => x.id === b.dataset.dec);
    setQty(b.dataset.dec, (l ? l.cantidad : 1) - 1);
    renderCartPage(); updateCartBadge();
  }));
  linesBox.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
    removeFromCart(b.dataset.del);
    renderCartPage(); updateCartBadge();
  }));
  summaryBox.querySelector("[data-clear]").addEventListener("click", () => {
    if (confirm("¿Vaciar el carrito?")) { clearCart(); renderCartPage(); }
  });
  summaryBox.querySelector("[data-checkout]").addEventListener("click", checkoutWhatsApp);
}
function checkoutWhatsApp() {
  const cart = getCart().map((l) => ({ ...l, product: getProductById(l.id) })).filter((l) => l.product);
  if (!cart.length) return;
  const lines = cart.map((l) => `• ${l.product.marca} ${l.product.nombre} ${l.product.tamano} x${l.cantidad} — ${formatARS(l.product.precio * l.cantidad)}`);
  const total = cartSubtotal();
  const msg = `Hola! Me interesa este pedido:\n${lines.join("\n")}\nTotal estimado: ${formatARS(total)}\n¿Me confirman stock y coordinamos la compra?`;
  // métrica simple para "más vendidos" (en nube solo toca el campo vendidos)
  try {
    const map = {};
    cart.forEach((l) => { map[l.id] = (map[l.id] || 0) + l.cantidad; });
    bumpVendidos(map);
  } catch {}
  const { whatsapp } = getSettings();
  window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  showToast("Pedido listo en WhatsApp");
}
