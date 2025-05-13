// auth-utils.js - Funciones de utilidad para la autenticación y autorización

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

// Cerrar sesión
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  window.location.href = 'index.html';
}

// Verificar si el usuario tiene el rol requerido
function checkRole(requiredRole) {
  const role = getUserRole();

  // Si no hay rol o no coincide con el requerido, redirigir al login
  if (!role || role !== requiredRole) {
    if (role === 'Administrador') {
      // Los administradores pueden acceder a todo
      return true;
    }
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'index.html';
    return false;
  }

  return true;
}

// Agregar headers de autenticación a las solicitudes fetch
function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();

  if (!token) {
    window.location.href = 'index.html';
    return Promise.reject('No autenticado');
  }

  // Configurar headers con token
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

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Si estamos en la página de login, no verificar
  if (window.location.pathname.includes('index.html')) {
    return;
  }

  // Verificar si hay token
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
  }

  // Agregar listener para el botón de cerrar sesión si existe
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});
