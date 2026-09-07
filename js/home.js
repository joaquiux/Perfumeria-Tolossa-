/* NARDO — home.js */
document.addEventListener("DOMContentLoaded", () => {
  initStore();
  updateCartBadge();
  wireGlobalHeader();
  // skeletons Bloque C: feedback inmediato mientras se arma el contenido
  const of = document.querySelector("[data-ofertas]");
  const dt = document.querySelector("[data-destacados]");
  if (of) of.innerHTML = skeletonCards(4);
  if (dt) dt.innerHTML = skeletonCards(4);
  requestAnimationFrame(() => setTimeout(() => {
    renderCategorias();
    renderOfertas();
    renderDestacados();
    renderMarcas();
  }, 250));
});
function renderCategorias() {
  const track = document.querySelector("[data-categorias]");
  if (!track) return;
  track.innerHTML = getCategories().map((c) => `
    <a class="category-tile${c.imagen ? " has-img" : ""}" href="catalogo.html?cat=${encodeURIComponent(c.id)}">
      ${c.imagen ? `<img class="category-img" src="${escapeHTML(c.imagen)}" alt="${escapeHTML(c.nombre)}" loading="lazy">` : ""}
      <span class="category-name">${escapeHTML(c.nombre)}</span>
      <span class="category-text">${escapeHTML(c.texto)}</span>
    </a>`).join("");
}
function renderOfertas() {
  const track = document.querySelector("[data-ofertas]");
  if (!track) return;
  const productos = getProducts(true).filter((p) => p.oferta);
  track.innerHTML = productos.length
    ? productos.map(productCard).join("")
    : `<p class="empty-msg">No hay ofertas activas por el momento.</p>`;
  const section = document.querySelector("[data-ofertas-section]");
  if (section) section.hidden = productos.length === 0;
}
function renderDestacados() {
  const grid = document.querySelector("[data-destacados]");
  if (!grid) return;
  grid.innerHTML = getProducts(true).filter((p) => p.destacado).map(productCard).join("");
}
function renderMarcas() {
  const strip = document.querySelector("[data-marcas]");
  if (!strip) return;
  const marcas = getBrands();
  strip.innerHTML = [...marcas, ...marcas].map((m) => `<span class="marca-item">${escapeHTML(m)}</span>`).join("");
}
