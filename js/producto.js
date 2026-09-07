/* NARDO — producto.js: ficha + galería + relacionados */
document.addEventListener("DOMContentLoaded", async () => {
  await initStore();
  updateCartBadge();
  wireGlobalHeader();
  const box = document.querySelector("[data-product-detail]");
  if (box) box.innerHTML = `<div class="product-layout"><div class="skel"><div class="sk-media"></div></div><div class="skel"><div class="sk-lines"><span style="width:50%"></span><span style="width:90%"></span><span style="width:70%"></span><span style="width:80%"></span></div></div></div>`;
  const rel = document.querySelector("[data-related]");
  if (rel) rel.innerHTML = skeletonCards(4);
  requestAnimationFrame(() => setTimeout(renderDetail, 250));
  // En vivo: re-render ante cambios del admin (nube)
  if (typeof onCatalogChange === "function") onCatalogChange(() => renderDetail());
});
function currentId() { return new URLSearchParams(window.location.search).get("id"); }
function allImages(p) {
  const imgs = [p.imagenPrincipal, ...(p.imagenes || [])].filter(Boolean);
  return imgs.length ? imgs : [null]; // null = silueta
}
function renderDetail() {
  const box = document.querySelector("[data-product-detail]");
  const p = getProductById(currentId());
  if (!p || !p.activo) {
    box.innerHTML = `<div class="empty-state"><h3>No encontramos el producto</h3><p>Puede estar oculto o el enlace es incorrecto.</p><a class="btn btn-secondary" href="catalogo.html">Volver al catálogo</a></div>`;
    document.querySelector("[data-related]").innerHTML = "";
    return;
  }
  document.title = `${p.marca} ${p.nombre} — NARDO`;
  const estado = stockEstado(p);
  const descuento = calcDescuento(p);
  const imgs = allImages(p);
  box.innerHTML = `
    <div class="product-layout">
      <div>
        <div class="gallery-main" data-gallery-main>
          ${imgs[0] ? `<img src="${escapeHTML(imgs[0])}" alt="${escapeHTML(p.nombre)}">` : bottleSVG(p.tono, "")}
        </div>
        ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `
          <button type="button" data-thumb="${i}" class="${i === 0 ? "is-active" : ""}" aria-label="Ver imagen ${i + 1}">
            ${src ? `<img src="${escapeHTML(src)}" alt="">` : bottleSVG(p.tono, "")}
          </button>`).join("")}</div>` : ""}
      </div>
      <div class="product-info">
        <div class="product-badges" style="position:static;display:flex;flex-direction:row;gap:6px;margin-bottom:12px">${productBadges(p)}</div>
        <p class="product-brand">${escapeHTML(p.marca)} · ${escapeHTML(p.codigo)}</p>
        <h1 style="font-size:var(--fs-700)">${escapeHTML(p.nombre)}</h1>
        <p class="product-meta">${escapeHTML(p.tamano)} · ${escapeHTML(p.concentracion)} · ${escapeHTML(p.genero)}</p>
        <div class="product-price-row" style="margin-top:var(--sp-4)">
          <span class="product-price-lg">${formatARS(p.precio)}</span>
          ${p.precioAnterior ? `<span class="product-price-old">${formatARS(p.precioAnterior)}</span>` : ""}
          ${descuento ? `<span class="product-discount">-${descuento}%</span>` : ""}
        </div>
        <p class="product-stock ${estado.cls}"><span class="dot"></span>${estado.label}${p.stock > 0 ? ` (${p.stock} disponibles)` : ""}</p>
        ${p.descripcion ? `<p style="margin-top:var(--sp-4)">${escapeHTML(p.descripcion)}</p>` : ""}
        <table class="spec-table">
          <tr><th>Marca</th><td>${escapeHTML(p.marca)}</td></tr>
          <tr><th>Categoría</th><td>${escapeHTML(p.categoria)}</td></tr>
          <tr><th>Familia olfativa</th><td>${escapeHTML(p.familia)}</td></tr>
          <tr><th>Concentración</th><td>${escapeHTML(p.concentracion)}</td></tr>
          <tr><th>Tamaño</th><td>${escapeHTML(p.tamano)}</td></tr>
          ${p.notas.salida ? `<tr><th>Salida</th><td>${escapeHTML(p.notas.salida)}</td></tr>` : ""}
          ${p.notas.corazon ? `<tr><th>Corazón</th><td>${escapeHTML(p.notas.corazon)}</td></tr>` : ""}
          ${p.notas.fondo ? `<tr><th>Fondo</th><td>${escapeHTML(p.notas.fondo)}</td></tr>` : ""}
        </table>
        <div class="qty-row">
          <input type="number" value="1" min="1" max="${p.stock}" data-qty aria-label="Cantidad">
          <button class="btn btn-primary" type="button" data-detail-add ${p.stock <= 0 ? "disabled" : ""}>${p.stock <= 0 ? "Agotado" : "Agregar al carrito"}</button>
          <a class="btn btn-secondary" href="carrito.html">Ver carrito</a>
        </div>
      </div>
    </div>`;

  box.querySelectorAll("[data-thumb]").forEach((btn) => {
    btn.addEventListener("click", () => {
      box.querySelectorAll("[data-thumb]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const src = imgs[Number(btn.dataset.thumb)];
      document.querySelector("[data-gallery-main]").innerHTML =
        src ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(p.nombre)}">` : bottleSVG(p.tono, "");
    });
  });
  const addBtn = box.querySelector("[data-detail-add]");
  if (addBtn) addBtn.addEventListener("click", () => {
    const qty = Math.max(1, Number(box.querySelector("[data-qty]").value) || 1);
    if (addToCart(p.id, qty)) showToast(`${p.nombre} x${qty} agregado`);
  });
  renderRelated(p);
}
function renderRelated(p) {
  const grid = document.querySelector("[data-related]");
  const pool = getProducts(true).filter((x) => x.id !== p.id);
  const score = (x) => (x.categoria === p.categoria ? 3 : 0) + (x.marca === p.marca ? 2 : 0) + (x.familia === p.familia ? 1 : 0);
  grid.innerHTML = pool.sort((a, b) => score(b) - score(a)).slice(0, 4).map(productCard).join("");
}
