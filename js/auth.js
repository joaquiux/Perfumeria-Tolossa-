/* NARDO — auth.js: login fijo + guard para admin */
function isAdmin() { try { return sessionStorage.getItem("nardo_admin") === "1"; } catch { return false; } }
function requireAdmin() {
  if (!isAdmin()) { window.location.href = "acceso-tolossa.html"; return false; }
  return true;
}
function tryLogin(user, pass) {
  if (user === NARDO_CONFIG.adminUser && pass === NARDO_CONFIG.adminPass) {
    try { sessionStorage.setItem("nardo_admin", "1"); } catch {}
    return true;
  }
  return false;
}
function logout() {
  try { sessionStorage.removeItem("nardo_admin"); } catch {}
  window.location.href = "acceso-tolossa.html";
}
