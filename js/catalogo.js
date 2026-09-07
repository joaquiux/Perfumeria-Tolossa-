/* NARDO — catalogo.js: buscar / filtrar / ordenar / paginar */
document.addEventListener("DOMContentLoaded", () => {
  initStore();
  updateCartBadge();
  wireGlobalHeader();
  fillFilterOptions();
  syncUIFromURL();
  bindFilterEvents();
  render();
});

function getStateFromURL() {
  const u = new URLSearchParams(window.location.search);
  return {
    q: u.get("q") || "",
    cat: u.get("cat") || "",
    marca: u.get("marca") || "",
    fam: u.get("fam") || "",
    genero: u.get("genero") || "",
    min: u.get("min") ? Number(u.get("min")) : null,
    max: u.get("max") ? Number(u.get("max")) : null,
    oferta: u.get("oferta") === "1",
    nuevo: u.get("nuevo") === "1",
    destacado: u.get("destacado") === "1",
    stock: u.get("stock") === "1",
    orden: u.get("orden") || "destacados",
    page: Math.max(1, Number(u.get("page")) || 1),
  };
}
function pushState(s) {
  const u = new URLSearchParams();
  Object.entries(s).forEach(([k, v]) => {
    if (v === "" || v === null || v === false || (k === "page" && v === 1) || (k === "orden" && v === "destacados")) return;
    u.set(k, v === true ? "1" : v);
  });
  history.replaceState(null, "", "catalogo.html" + (u.toString() ? "?" + u.toString() : ""));
}
function fillFilterOptions() {
  const cats = getCategories(), brands = getBrands(), fams = getFamilies();
  const selCat = document.querySelector("[data-f-cat]");
  const selMarca = document.querySelector("[data-f-marca]");
  const selFam = document.querySelector("[data-f-fam]");
  cats.forEach((c) => selCat.insertAdjacentHTML("beforeend", `<option value="${escapeHTML(c.id)}">${escapeHTML(c.nombre)}</option>`));
  brands.forEach((b) => selMarca.insertAdjacentHTML("beforeend", `<option>${escapeHTML(b)}</option>`));
  fams.forEach((f) => selFam.insertAdjacentHTML("beforeend", `<option>${escapeHTML(f)}</option>`));
}
function syncUIFromURL() {
  const s = getStateFromURL();
  document.querySelector("[data-f-q]").value = s.q;
  document.querySelector("[data-f-cat]").value = s.cat;
  document.querySelector("[data-f-marca]").value = s.marca;
  document.querySelector("[data-f-fam]").value = s.fam;
  document.querySelector("[data-f-genero]").value = s.genero;
  document.querySelector("[data-f-min]").value = s.min ?? "";
  document.querySelector("[data-f-max]").value = s.max ?? "";
  document.querySelector("[data-f-oferta]").checked = s.oferta;
  document.querySelector("[data-f-nuevo]").checked = s.nuevo;
  document.querySelector("[data-f-destacado]").checked = s.destacado;
  document.querySelector("[data-f-stock]").checked = s.stock;
  document.querySelector("[data-sort]").value = s.orden;
}
function readUIFromInputs() {
  return {
    q: document.querySelector("[data-f-q]").value.trim(),
    cat: document.querySelector("[data-f-cat]").value,
    marca: document.querySelector("[data-f-marca]").value,
    fam: document.querySelector("[data-f-fam]").value,
    genero: document.querySelector("[data-f-genero]").value,
    min: document.querySelector("[data-f-min]").value ? Number(document.querySelector("[data-f-min]").value) : null,
    max: document.querySelector("[data-f-max]").value ? Number(document.querySelector("[data-f-max]").value) : null,
    oferta: document.querySelector("[data-f-oferta]").checked,
    nuevo: document.querySelector("[data-f-nuevo]").checked,
    destacado: document.querySelector("[data-f-destacado]").checked,
    stock: document.querySelector("[data-f-stock]").checked,
    orden: document.querySelector("[data-sort]").value,
    page: getStateFromURL().page,
  };
}
function bindFilterEvents() {
  const rerender = (resetPage = true) => {
    const s = readUIFromInputs();
    if (resetPage) s.page = 1;
    pushState(s);
    render();
  };
  document.querySelectorAll("[data-f-q],[data-f-cat],[data-f-marca],[data-f-fam],[data-f-genero],[data-f-min],[data-f-max],[data-f-oferta],[data-f-nuevo],[data-f-destacado],[data-f-stock]").forEach((el) => {
    el.addEventListener(el.type === "search" || el.type === "text" || el.type === "number" ? "input" : "change", () => rerender(true));
  });
  document.querySelector("[data-sort]").addEventListener("change", () => rerender(false));
  document.querySelector("[data-f-clear]").addEventListener("click", () => {
    window.location.href = "catalogo.html";
  });
  document.querySelector("[data-pagination]").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-page]");
    if (!a) return;
    e.preventDefault();
    const s = getStateFromURL();
    s.page = Number(a.dataset.page);
    pushState(s);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.querySelector("[data-chips]").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-clear-key]");
    if (!b) return;
    const s = getStateFromURL();
    const k = b.dataset.clearKey;
    if (k === "min" || k === "max") s[k] = null;
    else if (["oferta", "nuevo", "destacado", "stock"].includes(k)) s[k] = false;
    else s[k] = "";
    s.page = 1;
    pushState(s);
    syncUIFromURL();
    render();
  });
}
function applyFilters(list, s) {
  const q = s.q.toLowerCase();
  return list.filter((p) => {
    if (s.cat && p.categoria !== s.cat) return false;
    if (s.marca && p.marca !== s.marca) return false;
    if (s.fam && p.familia !== s.fam) return false;
    if (s.genero && p.genero !== s.genero) return false;
    if (s.min != null && p.precio < s.min) return false;
    if (s.max != null && p.precio > s.max) return false;
    if (s.oferta && !p.oferta) return false;
    if (s.nuevo && !p.nuevo) return false;
    if (s.destacado && !p.destacado) return false;
    if (s.stock && p.stock <= 0) return false;
    if (q && !`${p.nombre} ${p.marca} ${p.familia} ${p.categoria}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
function applySort(list, orden) {
  const arr = [...list];
  if (orden === "menor_precio") arr.sort((a, b) => a.precio - b.precio);
  else if (orden === "mayor_precio") arr.sort((a, b) => b.precio - a.precio);
  else if (orden === "nuevos") arr.sort((a, b) => String(b.fechaCreacion).localeCompare(String(a.fechaCreacion)));
  else if (orden === "vendidos") arr.sort((a, b) => b.vendidos - a.vendidos);
  else if (orden === "ofertas") arr.sort((a, b) => (calcDescuento(b) || 0) - (calcDescuento(a) || 0));
  else arr.sort((a, b) => Number(b.destacado) - Number(a.destacado) || b.vendidos - a.vendidos);
  return arr;
}
function render() {
  const s = getStateFromURL();
  // validación rango de precio (Bloque C)
  if (s.min != null && s.max != null && s.min > s.max) {
    document.querySelector("[data-grid]").innerHTML =
      `<div class="empty-state"><h3>Rango de precio inválido</h3><p>El mínimo es mayor que el máximo.</p><a class="btn btn-secondary" href="catalogo.html">Limpiar filtros</a></div>`;
    document.querySelector("[data-result-count]").textContent = "Sin resultados";
    document.querySelector("[data-chips]").innerHTML = "";
    document.querySelector("[data-pagination]").innerHTML = "";
    return;
  }
  const filtered = applySort(applyFilters(getProducts(true), s), s.orden);
  const pageSize = NARDO_CONFIG.pageSize;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(s.page, pages);
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  document.querySelector("[data-result-count]").textContent =
    filtered.length === 0 ? "Sin resultados" : `${filtered.length} perfume${filtered.length !== 1 ? "s" : ""}`;

  document.querySelector("[data-grid]").innerHTML = slice.length
    ? slice.map(productCard).join("")
    : `<div class="empty-state"><h3>Sin resultados</h3><p>No encontramos nada con esos filtros. Probá con otra marca o quitá algún filtro.</p><a class="btn btn-secondary" href="catalogo.html">Limpiar filtros</a></div>`;

  const chips = [];
  if (s.q) chips.push(["q", `Búsqueda: ${s.q}`]);
  if (s.cat) chips.push(["cat", `Cat: ${s.cat}`]);
  if (s.marca) chips.push(["marca", s.marca]);
  if (s.fam) chips.push(["fam", s.fam]);
  if (s.genero) chips.push(["genero", s.genero]);
  if (s.min != null) chips.push(["min", `Mín ${formatARS(s.min)}`]);
  if (s.max != null) chips.push(["max", `Máx ${formatARS(s.max)}`]);
  if (s.oferta) chips.push(["oferta", "Ofertas"]);
  if (s.nuevo) chips.push(["nuevo", "Nuevos"]);
  if (s.destacado) chips.push(["destacado", "Destacados"]);
  if (s.stock) chips.push(["stock", "En stock"]);
  document.querySelector("[data-chips]").innerHTML =
    chips.map(([k, l]) => `<span class="chip">${escapeHTML(l)}<button data-clear-key="${k}" aria-label="Quitar filtro">×</button></span>`).join("");

  let pag = "";
  for (let i = 1; i <= pages; i++) {
    pag += i === page ? `<span class="is-current">${i}</span>` : `<a href="#" data-page="${i}">${i}</a>`;
  }
  document.querySelector("[data-pagination]").innerHTML = pages > 1 ? pag : "";
}
