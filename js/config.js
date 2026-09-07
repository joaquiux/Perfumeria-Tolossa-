/* NARDO — config.js: ajustes globales editables sin tocar lógica */
const NARDO_CONFIG = {
  whatsapp: "5493834045628", // +54 9 3834 04-5628 — se puede pisar desde admin (nardo_settings)
  adminUser: "admin",
  adminPass: "123",
  pageSize: 12,
  maxImagePx: 800,
};

/* NARDO — nube opcional (Firebase: Firestore + Auth + Storage, plan gratis).
   Vacío = modo local (todo en localStorage, como hasta ahora).
   Para activar: creá el proyecto en firebase.google.com y pegá acá tu config.
   La seguridad la dan las reglas de Firestore/Storage (ver js/cloud.js), no estas claves. */
const NARDO_FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
