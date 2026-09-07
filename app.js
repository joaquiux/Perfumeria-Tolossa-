/* ============================================================
   NARDO — app.js
   Arma el contenido dinámico del Home a partir de los datos en
   localStorage, y maneja las interacciones chicas de la página
   (menú mobile, buscador, toasts).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initStore();
  updateCartBadge();

  renderCategorias();
  renderOfertas();
  renderDestacados();
  renderMarcas();

  wireHeader();
  wireCards();
  wireYear();
});

/* ---------- Tarjeta de producto (reutilizada en ofertas/destacados) ---------- */

function bottleMark(tono) {
  return `
    <svg class="product-bottle" viewBox="0 0 120 160" aria-hidden="true">
      <use href="#bottle-mark" fill="var(--tone-${tono})"></use>
    </svg>`;
}

function productBadges(p) {
  const out = [];
  if (p.oferta) out.push('<span class="badge badge-oferta">Oferta</span>');
  if (p.nuevo) out.push('<span class="badge badge-nuevo">Nuevo</span>');
  if (p.destacado) out.push('<span class="badge badge-destacado">Destacado</span>');
  return out.join("");
}

function productCard(p) {
  const estado = stockEstado(p);
  const descuento = p.precioAnterior
    ? Math.round((1 - p.precio / p.precioAnterior) * 100)
    : null;

  return `
    <article class="product-card" data-product-id="${p.id}">
      <div class="product-media" style="--tone-bg: var(--tone-${p.tono}-tint)">
        <div class="product-badges">${productBadges(p)}</div>
        ${bottleMark(p.tono)}
        <button class="quick-add" type="button" data-add="${p.id}" aria-label="Agregar ${p.nombre} al carrito" ${p.stock <= 0 ? "disabled" : ""}>
          ${p.stock <= 0 ? "Agotado" : "＋ Agregar"}
        </button>
      </div>
      <div class="product-body">
        <p class="product-brand">${p.marca}</p>
        <h3 class="product-name">${p.nombre}</h3>
        <p class="product-meta">${p.tamano} · ${p.concentracion}</p>
        <div class="product-price-row">
          <span class="product-price">${formatARS(p.precio)}</span>
          ${p.precioAnterior ? `<span class="product-price-old">${formatARS(p.precioAnterior)}</span>` : ""}
          ${descuento ? `<span class="product-discount">-${descuento}%</span>` : ""}
        </div>
        <p class="product-stock ${estado.cls}"><span class="dot"></span>${estado.label}</p>
      </div>
    </article>`;
}

/* ---------- Secciones ---------- */

function renderCategorias() {
  const track = document.querySelector("[data-categorias]");
  if (!track) return;
  const cats = getCategories();
  track.innerHTML = cats
    .map(
      (c) => `
      <a class="category-tile" href="#" data-categoria="${c.id}">
        <span class="category-name">${c.nombre}</span>
        <span class="category-text">${c.texto}</span>
      </a>`
    )
    .join("");
}

function renderOfertas() {
  const track = document.querySelector("[data-ofertas]");
  if (!track) return;
  const productos = getProducts().filter((p) => p.oferta);
  track.innerHTML = productos.map(productCard).join("");
  const section = document.querySelector("[data-ofertas-section]");
  if (section) section.hidden = productos.length === 0;
}

function renderDestacados() {
  const grid = document.querySelector("[data-destacados]");
  if (!grid) return;
  const productos = getProducts().filter((p) => p.destacado);
  grid.innerHTML = productos.map(productCard).join("");
}

function renderMarcas() {
  const strip = document.querySelector("[data-marcas]");
  if (!strip) return;
  const marcas = getBrands();
  const dobles = [...marcas, ...marcas]; // para el desplazamiento continuo
  strip.innerHTML = dobles.map((m) => `<span class="marca-item">${m}</span>`).join("");
}

/* ---------- Interacciones ---------- */

function wireHeader() {
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  const searchToggle = document.querySelector("[data-search-toggle]");
  const searchPanel = document.querySelector("[data-search-panel]");
  if (searchToggle && searchPanel) {
    searchToggle.addEventListener("click", () => {
      const open = searchPanel.classList.toggle("is-open");
      searchToggle.setAttribute("aria-expanded", String(open));
      if (open) searchPanel.querySelector("input").focus();
    });
  }

  const searchForm = document.querySelector("[data-search-form]");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = new FormData(searchForm).get("q");
      showToast(q ? `Buscando "${q}"… (catálogo en la próxima etapa)` : "Escribí algo para buscar");
    });
  }
}

function wireCards() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const id = btn.getAttribute("data-add");
    const productos = getProducts();
    const p = productos.find((x) => x.id === id);
    if (!p) return;
    addToCart(id, 1);
    showToast(`${p.nombre} se agregó al carrito`);
  });
}

function wireYear() {
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = new Date().getFullYear();
}
