/* NARDO — auth.js: login local o Firebase Auth (si hay nube configurada).
   initStore() debe resolverse antes de requireAdmin(), así el estado
   de sesión de la nube ya es conocido. */
function _cloudAuthOn() {
  try { return typeof Cloud !== "undefined" && Cloud.isConfigured() && Cloud.isReady(); }
  catch { return false; }
}
function _localAdminOn() {
  try { return sessionStorage.getItem("nardo_admin") === "1"; } catch { return false; }
}
function isAdmin() {
  if (_cloudAuthOn()) return !!(Cloud.currentUser() || _localAdminOn());
  return _localAdminOn();
}
function requireAdmin() {
  if (!isAdmin()) { window.location.href = "acceso-tolossa.html"; return false; }
  return true;
}
// En modo nube intenta Firebase primero y cae a clave local
// (útil mientras no hay proveedor Email/Password creado).
function tryLogin(user, pass) {
  const localOk = () => {
    if (user === NARDO_CONFIG.adminUser && pass === NARDO_CONFIG.adminPass) {
      try { sessionStorage.setItem("nardo_admin", "1"); } catch {}
      return true;
    }
    return false;
  };
  if (_cloudAuthOn()) {
    return Cloud.signIn(user, pass).then(() => true).catch(() => localOk());
  }
  return localOk();
}
function logout() {
  const go = () => { window.location.href = "acceso-tolossa.html"; };
  if (_cloudAuthOn()) {
    try { sessionStorage.removeItem("nardo_admin"); } catch {}
    Cloud.signOut().then(go).catch(go);
    return;
  }
  try { sessionStorage.removeItem("nardo_admin"); } catch {}
  go();
}
function adminLabel() {
  if (_cloudAuthOn() && Cloud.currentUser()) return Cloud.currentUser().email || "Admin";
  try { return "Sesión: " + NARDO_CONFIG.adminUser; } catch { return "Admin"; }
}
