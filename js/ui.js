/* NARDO — ui.js: tarjeta unificada + header global */
try { document.documentElement.classList.add("js"); } catch {}
function productImage(p, cls = "product-bottle") {
  if (p.imagenPrincipal) {
    return `<img class="${cls} product-photo" src="${escapeHTML(p.imagenPrincipal)}" alt="${escapeHTML(p.marca + " " + p.nombre)}" loading="lazy" onerror="this.outerHTML=bottleSVG('${escapeHTML(p.tono)}','${cls}')">`;
  }
  return bottleSVG(p.tono, cls);
}
function bottleSVG(tono, cls = "product-bottle") {
  return `<svg class="${cls}" viewBox="0 0 120 160" aria-hidden="true"><use href="#bottle-mark" fill="var(--tone-${escapeHTML(tono)})"></use></svg>`;
}
function productBadges(p) {
  const out = [];
  if (p.oferta) out.push('<span class="badge badge-oferta">Oferta</span>');
  if (p.nuevo) out.push('<span class="badge badge-nuevo">Nuevo</span>');
  if (p.destacado) out.push('<span class="badge badge-destacado">Destacado</span>');
  if (p.stock <= 0) out.push('<span class="badge badge-agotado">Agotado</span>');
  return out.join("");
}
function productCard(p) {
  const estado = stockEstado(p);
  const descuento = calcDescuento(p);
  const out = p.stock <= 0 ? " is-out" : "";
  return `
    <article class="product-card${out}" data-product-id="${escapeHTML(p.id)}">
      <a class="product-media" style="--tone-bg: var(--tone-${escapeHTML(p.tono)}-tint)" href="producto.html?id=${escapeHTML(p.id)}" aria-label="Ver ${escapeHTML(p.marca)} ${escapeHTML(p.nombre)}">
        <div class="product-badges">${productBadges(p)}</div>
        ${productImage(p)}
      </a>
      <div class="product-body">
        <p class="product-brand">${escapeHTML(p.marca)}</p>
        <h3 class="product-name"><a href="producto.html?id=${escapeHTML(p.id)}">${escapeHTML(p.nombre)}</a></h3>
        <p class="product-meta">${escapeHTML(p.tamano)} · ${escapeHTML(p.concentracion)}</p>
        <div class="product-price-row">
          <span class="product-price">${formatARS(p.precio)}</span>
          ${p.precioAnterior ? `<span class="product-price-old">${formatARS(p.precioAnterior)}</span>` : ""}
          ${descuento ? `<span class="product-discount">-${descuento}%</span>` : ""}
        </div>
        <p class="product-stock ${estado.cls}"><span class="dot"></span>${estado.label}</p>
        <button class="quick-add quick-add--static" type="button" data-add="${escapeHTML(p.id)}" ${p.stock <= 0 ? "disabled" : ""}>
          ${p.stock <= 0 ? "Agotado" : "＋ Agregar"}
        </button>
      </div>
    </article>`;
}
/* El logo lo sube el dueño como archivo en assets/logo.png (o .jpg).
   Si el archivo no existe, queda el nombre en texto.
   En fondos oscuros (menú móvil, footer, admin) se mantiene el texto
   para que siempre se lea bien. */
function renderSiteLogo() {
  const base = window.location.pathname.includes("/admin/") ? "../" : "";
  const candidates = [base + "assets/logo.png", base + "assets/logo.jpg"];
  const applyLogo = (src) => {
    document.querySelectorAll("a.logo").forEach((a) => {
      if (a.dataset.logoDone) return;
      if (a.querySelector("img")) return; // ya viene inline en el HTML
      if (a.closest(".main-nav, .admin-side, .site-footer")) return;
      a.dataset.logoDone = "1";
      a.innerHTML = `<img class="site-logo" src="${src}" alt="Tolossa parfumerie">`;
    });
  };
  const tryNext = (i) => {
    if (i >= candidates.length) return;
    const probe = new Image();
    probe.onload = () => applyLogo(candidates[i]);
    probe.onerror = () => tryNext(i + 1);
    probe.src = candidates[i];
  };
  tryNext(0);
}
/* Hero del inicio: el admin lo cambia desde Categorías. Si hay imagen,
   reemplaza las botellitas; si no, queda la ilustración original. */
function renderHeroImage() {
  const box = document.querySelector("[data-hero]");
  if (!box) return;
  let hero = "";
  try { hero = getSettings().heroImage || ""; } catch { hero = ""; }
  if (!hero) return;
  box.innerHTML = `<div class="rings" aria-hidden="true"><span></span><span></span><span></span></div><img class="hero-photo" src="${escapeHTML(hero)}" alt="Perfume destacado">`;
}
/* Todos los links con data-wa-link usan el número del panel (settings).
   Así, al cambiar el WhatsApp en admin, cambia en TODA la tienda. */
function wireWhatsAppLinks() {
  let whatsapp = "";
  try { whatsapp = getSettings().whatsapp || NARDO_CONFIG.whatsapp; } catch { whatsapp = ""; }
  if (!whatsapp) return;
  document.querySelectorAll("[data-wa-link]").forEach((a) => {
    const text = a.getAttribute("data-wa-text") || "";
    a.href = `https://wa.me/${whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
    a.target = "_blank";
    a.rel = "noopener";
  });
}
function skeletonCards(n = 4) {
  return Array.from({ length: n }, () => `
    <div class="skel" aria-hidden="true"><div class="sk-media"></div>
    <div class="sk-lines"><span style="width:40%"></span><span style="width:80%"></span><span style="width:60%"></span></div></div>`).join("");
}
function wireGlobalHeader() {
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const setNav = (open) => {
    if (!nav) return;
    nav.classList.toggle("is-open", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
    let overlay = document.querySelector("[data-nav-overlay]");
    if (open && !overlay) {
      overlay = document.createElement("div");
      overlay.setAttribute("data-nav-overlay", "");
      overlay.className = "nav-overlay";
      overlay.addEventListener("click", () => setNav(false));
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("is-visible"));
    }
    if (overlay) {
      overlay.classList.toggle("is-visible", open);
      if (!open) setTimeout(() => overlay.remove(), 300);
    }
  };
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
    // botón cerrar dentro del panel + cerrar al tocar un link o con Escape
    if (!nav.querySelector("[data-nav-close]")) {
      const c = document.createElement("button");
      c.className = "nav-close";
      c.setAttribute("type", "button");
      c.setAttribute("data-nav-close", "");
      c.setAttribute("aria-label", "Cerrar menú");
      c.textContent = "×";
      c.addEventListener("click", () => setNav(false));
      nav.prepend(c);
    }
    // Cerrar al navegar. Si el link es un ancla de la página actual
    // (ej. "index.html#nosotros" estando en index.html), se evita la
    // recarga y se hace scroll suave con el header ya liberado.
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "";
      const hashIdx = href.indexOf("#");
      if (hashIdx !== -1) {
        const pagePart = href.slice(0, hashIdx);
        const hash = href.slice(hashIdx);
        const targetId = decodeURIComponent(hash.slice(1));
        if (targetId) {
          const currentPage = window.location.pathname.split("/").pop() || "index.html";
          const linkPage = pagePart === "" ? currentPage : pagePart.split("/").pop().split("?")[0];
          const isIndex = (p) => p === "" || p === "/" || p === "index.html";
          if (linkPage === currentPage || (isIndex(linkPage) && isIndex(currentPage))) {
            const target = document.getElementById(targetId);
            if (target) {
              e.preventDefault();
              setNav(false);
              // esperar a que se quite body.nav-open (overflow hidden)
              // y el panel salga de pantalla antes de scrollear
              setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", hash);
              }, 80);
              return;
            }
          }
        }
      }
      setNav(false);
    }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });
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
      window.location.href = "catalogo.html" + (q ? `?q=${encodeURIComponent(q)}` : "");
    });
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn || btn.disabled) return;
    const id = btn.getAttribute("data-add");
    const p = getProductById(id);
    if (p && addToCart(id, 1)) showToast(`✓ ${p.marca} ${p.nombre} agregado`);
  });
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
  renderSiteLogo();
  renderHeroImage();
  wireWhatsAppLinks();
  // ticker de la barra superior: duplica el contenido para loop continuo
  document.querySelectorAll(".utility-bar").forEach((bar) => {
    const wrap = bar.querySelector(".wrap");
    if (!wrap || wrap.dataset.tickerDone) return;
    wrap.dataset.tickerDone = "1";
    const clone = wrap.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("data-ticker-done");
    // quitar ids duplicados si los hubiera
    const track = document.createElement("div");
    track.className = "ticker-track";
    track.appendChild(wrap.cloneNode(true));
    track.appendChild(clone);
    bar.innerHTML = "";
    bar.appendChild(track);
  });
  // reveal on scroll: aparición suave de bloques al entrar en pantalla
  try {
    const els = document.querySelectorAll(".section-head, .page-head .wrap, .hero-copy, .hero-figure, .contacto-grid, .nosotros-grid, .family-card, .aroma-card, .discover-card, .tech-mini-grid article, .steps li, .beneficio");
    if (els.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
        });
      }, { threshold: 0.1 });
      els.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
    }
  } catch {}
  // volver arriba (Bloque C)
  if (!document.querySelector("[data-to-top]")) {    const b = document.createElement("button");
    b.className = "to-top";
    b.setAttribute("data-to-top", "");
    b.setAttribute("aria-label", "Volver arriba");
    b.textContent = "↑";
    b.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(b);
    window.addEventListener("scroll", () => b.classList.toggle("is-visible", window.scrollY > 600), { passive: true });
  }
  // Al llegar desde otra página con #ancla (ej. catálogo -> index.html#nosotros),
  // reasegurar la posición exacta cuando el layout ya está listo.
  // scroll-margin-top / scroll-padding-top del CSS evitan que el header sticky la tape.
  if (window.location.hash) {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) setTimeout(() => target.scrollIntoView({ block: "start" }), 150);
  }
}
