// public/js/auth-utils.js

// Verificar si el usuario está autenticado
function isAuthenticated() {
  return localStorage.getItem('authToken') !== null;
}

// Obtener el token de autenticación
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Obtener el rol del usuario
function getUserRole() {
  return localStorage.getItem('userRole');
}

// Obtener el ID del usuario
function getUserId() {
  return localStorage.getItem('userId');
}

// Cerrar sesión: limpia almacenamiento y redirige al login
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  window.location.href = 'index.html';
}

// fetchWithAuth: añade Authorization: Bearer <token> y Content-Type
function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  if (!token) {
    // Sin token, volvemos al login
    window.location.href = 'index.html';
    return Promise.reject('No autenticado');
  }
  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
}

// Al cargar cualquier página (salvo index.html), forzar que esté autenticado
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('index.html') && !isAuthenticated()) {
    window.location.href = 'index.html';
  }
  // Asociar el botón de logout si existe
  const btn = document.getElementById('logout-btn');
  if (btn) btn.addEventListener('click', logout);
});
