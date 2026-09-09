/* NARDO — config.js: ajustes globales editables sin tocar lógica */
const NARDO_CONFIG = {
  whatsapp: "5493834045628", // +54 9 3834 04-5628 — se puede pisar desde admin (nardo_settings)
  adminUser: "admin@tolossa.com",
  adminPass: "123",
  pageSize: 12,
  maxImagePx: 800,
};

/* NARDO — nube Firebase (Firestore NoSQL + Auth + Storage, plan Spark).
   Proyecto: perfumeria-tolossa. La seguridad la dan las reglas
   de Firestore/Storage (ver firestore.rules / storage.rules), no estas claves. */
const NARDO_FIREBASE = {
  apiKey: "AIzaSyDsAEWFe5o40OQYMf9swhrIxhWIvaNwx-w",
  authDomain: "perfumeria-tolossa.firebaseapp.com",
  projectId: "perfumeria-tolossa",
  storageBucket: "perfumeria-tolossa.firebasestorage.app",
  messagingSenderId: "131001026864",
  appId: "1:131001026864:web:189e6074a6a1ed6129a0f5",
};
