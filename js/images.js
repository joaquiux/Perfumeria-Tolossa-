/* NARDO — images.js: helpers compartidos (productos, categorías, logo) */
function fileToCompressedDataURL(file, maxPx) {
  const max = maxPx || (typeof NARDO_CONFIG !== "undefined" ? NARDO_CONFIG.maxImagePx : 800);
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("not-image"));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        // Si la imagen tiene transparencia real, conservarla con PNG;
        // si no, JPEG liviano como antes.
        const dataUrl = hasAlpha(ctx, c.width, c.height)
          ? c.toDataURL("image/png")
          : c.toDataURL("image/jpeg", 0.72);
        // prueba de cuota antes de aceptar
        const probe = "__quota__";
        localStorage.setItem(probe, dataUrl.slice(0, 50000));
        localStorage.removeItem(probe);
        resolve(dataUrl);
      } catch (err) { URL.revokeObjectURL(url); reject(err); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}
/* Misma compresión que fileToCompressedDataURL pero devuelve Blob,
   listo para subir a Firebase Storage (modo nube). */
function fileToCompressedBlob(file, maxPx) {
  const max = maxPx || (typeof NARDO_CONFIG !== "undefined" ? NARDO_CONFIG.maxImagePx : 800);
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("not-image"));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        const usePng = hasAlpha(ctx, c.width, c.height);
        c.toBlob(
          (blob) => { blob ? resolve(blob) : reject(new Error("encode")); },
          usePng ? "image/png" : "image/jpeg", 0.72);
      } catch (err) { URL.revokeObjectURL(url); reject(err); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}
function dataUrlKB(src) {
  if (!src) return 0;
  if (src.startsWith("data:")) {
    const b64 = src.split(",")[1] || "";
    return Math.round((b64.length * 3) / 4 / 1024);
  }
  return 0; // URL externa: no ocupa localStorage
}
function formatKB(kb) { return kb > 0 ? `${kb} KB en local` : "URL (no ocupa local)"; }
function isHttpUrl(s) { return /^https?:\/\/.+/i.test(String(s || "").trim()); }
/* Detecta píxeles semitransparentes (muestreo cada 4px por rendimiento).
   Los JPG nunca tienen alfa; los PNG/WebP con fondo real tampoco. */
function hasAlpha(ctx, w, h) {
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    const step = 4 * 4; // cada 4 píxeles
    for (let i = 3; i < data.length; i += step) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch { return false; }
}
