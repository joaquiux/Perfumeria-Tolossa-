/* ============================================================
   NARDO — data.js — semillas (sin lógica, solo datos iniciales)
   ============================================================ */
const STORE_KEYS = {
  products: "nardo_products",
  categories: "nardo_categories",
  brands: "nardo_brands",
  families: "nardo_families",
  cart: "nardo_cart",
  settings: "nardo_settings",
  meta: "nardo_meta",
};

const SEED_CATEGORIES = [
  { id: "hombre", nombre: "Hombre", texto: "Maderas, especias y cuero. Fragancias con carácter." },
  { id: "mujer", nombre: "Mujer", texto: "Florales, gourmand y orientales de autor." },
  { id: "unisex", nombre: "Unisex", texto: "Composiciones que no piden permiso para el género." },
  { id: "arabes", nombre: "Árabes", texto: "Oud, ámbar y resinas. Intensidad e ideas." },
  { id: "niche", nombre: "Niche", texto: "Casas independientes, tiradas cortas, otra escala." },
];

const SEED_FAMILIES = [
  "Floral", "Amaderada", "Cítrica", "Frutal",
  "Gourmand", "Oriental", "Especiada", "Acuática", "Almizclada",
];

const SEED_BRANDS = [
  "Dior", "Chanel", "Paco Rabanne", "Versace", "Lattafa",
  "Carolina Herrera", "Giorgio Armani", "Montblanc", "Yves Saint Laurent", "Afnan",
];

const SEED_PRODUCTS = [
  { id: "p01", codigo: "DIO-001", nombre: "Sauvage", marca: "Dior", categoria: "hombre", familia: "Especiada", genero: "Hombre", concentracion: "EDT", tamano: "100 ml", precio: 145000, precioAnterior: null, stock: 14, stockMinimo: 5, destacado: true, oferta: false, nuevo: false, tono: "amber", descripcion: "Fresco y especiado, un clásico moderno de Dior.", imagenPrincipal: "", imagenes: [], notas: { salida: "Bergamota", corazon: "Pimienta", fondo: "Ambroxan" }, activo: true, vendidos: 12, fechaCreacion: "2026-01-10" },
  { id: "p02", codigo: "PR-002", nombre: "Invictus", marca: "Paco Rabanne", categoria: "hombre", familia: "Acuática", genero: "Hombre", concentracion: "EDT", tamano: "100 ml", precio: 120000, precioAnterior: 150000, stock: 9, stockMinimo: 5, destacado: false, oferta: true, nuevo: false, tono: "blue", descripcion: "Victoria embotellada: marino, vibrante y deportivo.", imagenPrincipal: "", imagenes: [], notas: { salida: "Notas marinas", corazon: "Pomelo", fondo: "Madera de gaiac" }, activo: true, vendidos: 20, fechaCreacion: "2026-02-01" },
  { id: "p03", codigo: "CHA-003", nombre: "Coco Mademoiselle", marca: "Chanel", categoria: "mujer", familia: "Floral", genero: "Mujer", concentracion: "EDP", tamano: "50 ml", precio: 210000, precioAnterior: null, stock: 6, stockMinimo: 4, destacado: true, oferta: false, nuevo: false, tono: "rose", descripcion: "Elegancia atemporal: cítricos, jazmín y pachulí.", imagenPrincipal: "", imagenes: [], notas: { salida: "Naranja", corazon: "Jazmín", fondo: "Pachulí" }, activo: true, vendidos: 8, fechaCreacion: "2026-01-15" },
  { id: "p04", codigo: "CH-004", nombre: "Good Girl", marca: "Carolina Herrera", categoria: "mujer", familia: "Gourmand", genero: "Mujer", concentracion: "EDP", tamano: "80 ml", precio: 175000, precioAnterior: 205000, stock: 3, stockMinimo: 4, destacado: false, oferta: true, nuevo: false, tono: "wine", descripcion: "Dulce y audaz: haba tonka, jazmín y cacao.", imagenPrincipal: "", imagenes: [], notas: { salida: "Almendra", corazon: "Jazmín", fondo: "Tonka" }, activo: true, vendidos: 15, fechaCreacion: "2026-02-10" },
  { id: "p05", codigo: "LAT-005", nombre: "Khamrah", marca: "Lattafa", categoria: "arabes", familia: "Gourmand", genero: "Unisex", concentracion: "EDP", tamano: "100 ml", precio: 65000, precioAnterior: null, stock: 22, stockMinimo: 6, destacado: true, oferta: false, nuevo: true, tono: "amber", descripcion: "El árabe más buscado: dátiles, canela y vainilla.", imagenPrincipal: "", imagenes: [], notas: { salida: "Canela", corazon: "Dátiles", fondo: "Vainilla" }, activo: true, vendidos: 30, fechaCreacion: "2026-05-01" },
  { id: "p06", codigo: "LAT-006", nombre: "Asad", marca: "Lattafa", categoria: "arabes", familia: "Amaderada", genero: "Hombre", concentracion: "EDP", tamano: "100 ml", precio: 58000, precioAnterior: 72000, stock: 17, stockMinimo: 6, destacado: false, oferta: true, nuevo: false, tono: "olive", descripcion: "Intenso y ahumado, ideal para la noche.", imagenPrincipal: "", imagenes: [], notas: { salida: "Pimienta negra", corazon: "Tabaco", fondo: "Ámbar" }, activo: true, vendidos: 25, fechaCreacion: "2026-03-01" },
  { id: "p07", codigo: "VER-007", nombre: "Eros", marca: "Versace", categoria: "hombre", familia: "Cítrica", genero: "Hombre", concentracion: "EDT", tamano: "100 ml", precio: 110000, precioAnterior: null, stock: 11, stockMinimo: 5, destacado: false, oferta: false, nuevo: false, tono: "blue", descripcion: "Menta, manzana verde y vainilla. Pasión mediterránea.", imagenPrincipal: "", imagenes: [], notas: { salida: "Menta", corazon: "Manzana verde", fondo: "Vainilla" }, activo: true, vendidos: 10, fechaCreacion: "2026-01-20" },
  { id: "p08", codigo: "YSL-008", nombre: "Black Opium", marca: "Yves Saint Laurent", categoria: "mujer", familia: "Oriental", genero: "Mujer", concentracion: "EDP", tamano: "50 ml", precio: 195000, precioAnterior: null, stock: 8, stockMinimo: 4, destacado: true, oferta: false, nuevo: false, tono: "ink", descripcion: "Café, vainilla y flores blancas. Adictivo.", imagenPrincipal: "", imagenes: [], notas: { salida: "Café", corazon: "Jazmín", fondo: "Vainilla" }, activo: true, vendidos: 18, fechaCreacion: "2026-02-15" },
  { id: "p09", codigo: "MON-009", nombre: "Explorer", marca: "Montblanc", categoria: "unisex", familia: "Amaderada", genero: "Unisex", concentracion: "EDP", tamano: "60 ml", precio: 98000, precioAnterior: null, stock: 0, stockMinimo: 4, destacado: false, oferta: false, nuevo: true, tono: "olive", descripcion: "Aventura en frasco: bergamota y vetiver.", imagenPrincipal: "", imagenes: [], notas: { salida: "Bergamota", corazon: "Vetiver", fondo: "Cuero" }, activo: true, vendidos: 5, fechaCreacion: "2026-06-01" },
  { id: "p10", codigo: "AFN-010", nombre: "Supremacy Silver", marca: "Afnan", categoria: "niche", familia: "Almizclada", genero: "Unisex", concentracion: "EDP", tamano: "100 ml", precio: 72000, precioAnterior: 89000, stock: 13, stockMinimo: 5, destacado: true, oferta: true, nuevo: false, tono: "rose", descripcion: "Limpio y elegante, estela jabonosa de nicho accesible.", imagenPrincipal: "", imagenes: [], notas: { salida: "Bergamota", corazon: "Almizcle", fondo: "Ámbar" }, activo: true, vendidos: 22, fechaCreacion: "2026-03-10" },
  { id: "p11", codigo: "ARM-011", nombre: "Stronger With You", marca: "Giorgio Armani", categoria: "hombre", familia: "Especiada", genero: "Hombre", concentracion: "EDT", tamano: "50 ml", precio: 105000, precioAnterior: null, stock: 5, stockMinimo: 5, destacado: false, oferta: false, nuevo: true, tono: "amber", descripcion: "Castaña, vainilla y salvia. Abrigo dulce.", imagenPrincipal: "", imagenes: [], notas: { salida: "Cardamomo", corazon: "Salvia", fondo: "Vainilla" }, activo: true, vendidos: 9, fechaCreacion: "2026-05-15" },
  { id: "p12", codigo: "YSL-012", nombre: "Libre", marca: "Yves Saint Laurent", categoria: "mujer", familia: "Floral", genero: "Mujer", concentracion: "EDP", tamano: "50 ml", precio: 188000, precioAnterior: null, stock: 2, stockMinimo: 4, destacado: false, oferta: false, nuevo: false, tono: "ink", descripcion: "Lavanda y flor de azahar con carácter.", imagenPrincipal: "", imagenes: [], notas: { salida: "Lavanda", corazon: "Azahar", fondo: "Almizcle" }, activo: true, vendidos: 7, fechaCreacion: "2026-04-01" },
];
