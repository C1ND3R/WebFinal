// public/js/login.js
// Script para manejar la autenticación de usuarios

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || 'Credenciales inválidas');
      }

      const data = await resp.json();
      // Guardar token y datos del usuario
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.usuario.rol);
      localStorage.setItem('userId',   data.usuario.id);

      // Siempre al dashboard principal
      window.location.href = 'dashboard.html';
    } catch (error) {
      alert('Error de inicio de sesión: ' + error.message);
    }
  });

  // Si ya hay sesión activa, saltar al dashboard
  (function checkExistingSession() {
    const token = localStorage.getItem('authToken');
    const role  = localStorage.getItem('userRole');
    if (token && role) {
      window.location.href = 'dashboard.html';
    }
  })();
});
