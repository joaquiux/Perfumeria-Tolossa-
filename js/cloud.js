/* ============================================================
   NARDO — cloud.js: sincronización opcional con Firebase
   (Firestore NoSQL + Auth + Storage, todo plan gratuito).

   - Si NARDO_FIREBASE está vacío -> modo local, no hace nada.
   - Si está configurado -> Firestore es la fuente compartida:
     lo que guarda el admin aparece en todos los dispositivos,
     en vivo (onSnapshot) y con soporte offline.
   - El SDK se carga solo cuando hace falta (lazy, CDN fijado).

   REGLAS SUGERIDAS — pegar en Firebase Console:

   --- Firestore (Firestore Database > Reglas) ---
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /products/{id} {
         allow read: if true;
         allow create, delete: if request.auth != null;
         // El checkout suma "vendidos" sin estar logueado:
         // solo se permite tocar ese campo.
         allow update: if request.auth != null ||
           (request.resource.data.diff(resource.data)
             .affectedKeys().hasOnly(['vendidos']));
       }
       match /meta/{doc} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }

   --- Storage (Storage > Reglas) ---
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null
           && request.resource.size < 2 * 1024 * 1024;
       }
     }
   }
   ============================================================ */
const Cloud = (() => {
  const SDK_BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
  let _sdkPromise = null;
  let _app = null, _db = null, _auth = null, _storage = null;
  let _ready = false;
  let _user = null;

  function isConfigured() {
    try {
      const c = typeof NARDO_FIREBASE !== "undefined" ? NARDO_FIREBASE : null;
      return !!(c && c.apiKey && c.projectId);
    } catch { return false; }
  }
  function isReady() { return _ready && !!_db; }

  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("sdk-load:" + src));
      document.head.appendChild(s);
    });
  }
  function loadSDK(extra = []) {
    if (_sdkPromise) {
      if (!extra.length) return _sdkPromise;
      return _sdkPromise.then(() => Promise.all(extra.map(_loadScript)));
    }
    const base = ["firebase-app-compat.js", "firebase-firestore-compat.js", "firebase-auth-compat.js"];
    _sdkPromise = base.concat(extra).reduce(
      (p, f) => p.then(() => _loadScript(SDK_BASE + f)), Promise.resolve());
    return _sdkPromise;
  }

  async function init() {
    if (!isConfigured()) return false;
    if (_ready) return true;
    await loadSDK();
    if (!window.firebase) throw new Error("firebase-sdk-missing");
    if (!firebase.apps.length) firebase.initializeApp(NARDO_FIREBASE);
    _app = firebase.app();
    _db = firebase.firestore();
    _auth = firebase.auth();
    try { await _db.enablePersistence({ synchronizeTabs: true }); } catch { /* offline opcional */ }
    _auth.onAuthStateChanged((u) => { _user = u || null; });
    await new Promise((resolve) => {
      const un = _auth.onAuthStateChanged((u) => { _user = u || null; un(); resolve(); });
      setTimeout(resolve, 4000); // no bloquear el arranque si Auth tarda
    });
    _ready = true;
    return true;
  }

  /* ---------- lectura ---------- */
  function _docToProduct(id, data) {
    const p = Object.assign({}, data, { id });
    if (typeof migrateProduct === "function") return migrateProduct(p);
    return p;
  }
  // null = la nube aún no fue migrada (no pisar lo local)
  async function pullAll() {
    if (!isReady()) return null;
    const [psnap, meta] = await Promise.all([
      _db.collection("products").get(),
      _db.collection("meta").doc("catalog").get(),
    ]);
    const m = meta.exists ? meta.data() : null;
    const out = { products: null, taxonomies: null, settings: null };
    if (m && m.seeded) {
      out.products = [];
      psnap.forEach((d) => out.products.push(_docToProduct(d.id, d.data())));
      if (m.taxonomies) out.taxonomies = m.taxonomies;
      if (m.settings) out.settings = m.settings;
    }
    return out;
  }
  // cb recibe el estado fresco completo en cada cambio en vivo
  function subscribe(cb) {
    if (!isReady() || typeof cb !== "function") return () => {};
    const fresh = { products: null, taxonomies: null, settings: null };
    const emit = () => { try { cb(fresh); } catch (e) { console.warn(e); } };
    const u1 = _db.collection("products").onSnapshot((snap) => {
      const arr = [];
      snap.forEach((d) => arr.push(_docToProduct(d.id, d.data())));
      fresh.products = arr;
      // Si la colección existe en la nube (migrada), vale aunque esté vacía.
      // El flag seeded lo confirma; si el doc meta aún no llegó, igual avisar.
      emit();
    }, (e) => console.warn("[nardo] sub productos:", e));
    const u2 = _db.collection("meta").doc("catalog").onSnapshot((doc) => {
      if (doc.exists) {
        const m = doc.data();
        if (m.taxonomies) fresh.taxonomies = m.taxonomies;
        if (m.settings) fresh.settings = m.settings;
        if (m.seeded && fresh.products) emit();
        else if (m.seeded) emit();
      }
    }, (e) => console.warn("[nardo] sub meta:", e));
    return () => { try { u1(); u2(); } catch {} };
  }

  /* ---------- escritura (requiere login, salvo vendidos) ---------- */
  function _strip(p) {
    const c = Object.assign({}, p);
    delete c.id;
    return c;
  }
  async function upsertProduct(p) {
    await _db.collection("products").doc(p.id).set(_strip(p), { merge: true });
  }
  async function deleteProduct(id) {
    await _db.collection("products").doc(id).delete();
  }
  async function pushTaxonomies(t) {
    await _db.collection("meta").doc("catalog").set({ taxonomies: t, seeded: true }, { merge: true });
  }
  async function pushSettings(s) {
    await _db.collection("meta").doc("catalog").set({ settings: s, seeded: true }, { merge: true });
  }
  // Solo toca "vendidos" (permitido por reglas sin login, ver encabezado).
  async function bumpVendidos(map) {
    const batch = _db.batch();
    Object.entries(map).forEach(([id, qty]) => {
      batch.set(_db.collection("products").doc(id),
        { vendidos: firebase.firestore.FieldValue.increment(Number(qty) || 0) },
        { merge: true });
    });
    await batch.commit();
  }
  // Migración inicial: sube el estado local tal cual a la nube.
  async function pushAll(data) {
    const batch = _db.batch();
    (data.products || []).forEach((p) => {
      batch.set(_db.collection("products").doc(p.id), _strip(p));
    });
    batch.set(_db.collection("meta").doc("catalog"), {
      taxonomies: data.taxonomies || { categories: [], brands: [], families: [] },
      settings: data.settings || {},
      seeded: true,
    }, { merge: true });
    await batch.commit();
  }

  /* ---------- imágenes ---------- */
  async function uploadImageFile(file, folder) {
    await loadSDK(["firebase-storage-compat.js"]);
    if (!window.firebase || !firebase.apps.length) throw new Error("sdk-missing");
    _storage = _storage || firebase.storage();
    const blob = await fileToCompressedBlob(file, 1000);
    const name = `${folder || "img"}/${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}.${blob.type === "image/png" ? "png" : "jpg"}`;
    const snap = await _storage.ref().child(name).put(blob);
    return await snap.ref.getDownloadURL();
  }

  /* ---------- auth ---------- */
  function currentUser() { return _user || null; }
  async function signIn(email, pass) {
    const cred = await _auth.signInWithEmailAndPassword(String(email).trim(), pass);
    _user = cred.user || null;
    return _user;
  }
  async function signOut() {
    try { await _auth.signOut(); } catch {}
    _user = null;
  }

  return {
    isConfigured, isReady, init, pullAll, subscribe, subscribe: subscribe,
    upsertProduct, deleteProduct, pushTaxonomies, pushSettings,
    bumpVendidos, pushAll, uploadImageFile,
    currentUser, signIn, signOut,
  };
})();
