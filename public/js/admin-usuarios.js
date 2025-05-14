// public/js/admin-usuarios.js
// Funcionalidad para la gestión de usuarios

document.addEventListener('DOMContentLoaded', function() {
  // Verificar que el usuario sea Administrador
  if (getUserRole() !== 'Administrador') {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'index.html';
    return;
  }

  // Cargar la lista de usuarios
  loadUsuarios();
  // Configurar listeners para los botones
  setupEventListeners();
});

// Cargar lista de usuarios
function loadUsuarios() {
  fetchWithAuth('/api/usuarios')
    .then(response => {
      if (!response.ok) throw new Error('Error al cargar usuarios');
      return response.json();
    })
    .then(data => updateUsuariosTable(data))
    .catch(error => {
      console.error('Error:', error);
      // Mock para desarrollo
      const mockData = [
        { id: 1, username: 'admin', nombre_completo: 'Administrador', rol: 'Administrador', email: 'admin@example.com' }
      ];
      updateUsuariosTable(mockData);
    });
}

// Actualizar la tabla de usuarios
function updateUsuariosTable(usuarios) {
  const tbody = document.querySelector('table tbody');
  tbody.innerHTML = '';
  usuarios.forEach(usuario => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${usuario._id || usuario.id}</td>
      <td>${usuario.username}</td>
      <td>${usuario.nombre_completo}</td>
      <td>${usuario.rol}</td>
      <td>${usuario.email}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="prepararEditarUsuario('${usuario._id || usuario.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmarEliminarUsuario('${usuario._id || usuario.id}', '${usuario.username}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Preparar modal para editar usuario
function prepararEditarUsuario(usuarioId) {
  fetchWithAuth(`/api/usuarios/${usuarioId}`)
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(usuario => {
      document.getElementById('editUsername').value        = usuario.username;
      document.getElementById('editNombreCompleto').value  = usuario.nombre_completo;
      document.getElementById('editTipoUsuario').value     = usuario.rol.toLowerCase();
      document.getElementById('editEmail').value           = usuario.email;

      const form = document.querySelector('#modalEditarUsuario form');
      form.dataset.usuarioId = usuarioId;

      new bootstrap.Modal(document.getElementById('modalEditarUsuario')).show();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('No se pudo cargar el usuario para editar');
    });
}

// Guardar usuario editado
function guardarUsuarioEditado() {
  const form = document.querySelector('#modalEditarUsuario form');
  const usuarioId = form.dataset.usuarioId;

  const username       = document.getElementById('editUsername').value.trim();
  const nombreCompleto = document.getElementById('editNombreCompleto').value.trim();
  const tipoKey        = document.getElementById('editTipoUsuario').value;
  const email          = document.getElementById('editEmail').value.trim();
  const password       = document.getElementById('editPassword').value;

  if (!username || !nombreCompleto || !email) {
    alert('Por favor completa los campos obligatorios');
    return;
  }

  const rolesMap = {
    administrador: 'Administrador',
    coordinador:   'Coordinador',
    profesor:      'Profesor',
    alumno:        'Alumno'
  };
  const rol = rolesMap[tipoKey];

  const userData = { username, nombre_completo: nombreCompleto, email, rol };
  if (password) userData.password = password;

  fetchWithAuth(`/api/usuarios/${usuarioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
    .then(resp => resp.ok ? resp.json() : Promise.reject())
    .then(() => {
      alert('Usuario actualizado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario')).hide();
      loadUsuarios();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al actualizar el usuario');
      loadUsuarios();
    });
}

// Confirmar y eliminar usuario
function confirmarEliminarUsuario(usuarioId, username) {
  if (!confirm(`¿Eliminar al usuario ${username}?`)) return;
  fetchWithAuth(`/api/usuarios/${usuarioId}`, { method: 'DELETE' })
    .then(resp => resp.ok ? resp.json() : Promise.reject())
    .then(() => {
      alert('Usuario eliminado correctamente');
      loadUsuarios();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al eliminar el usuario');
    });
}

// Crear nuevo usuario
function crearUsuario() {
  const username       = document.getElementById('username').value.trim();
  const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
  const tipoKey        = document.getElementById('tipoUsuario').value;
  const email          = document.getElementById('email').value.trim();
  const password       = document.getElementById('password').value;

  if (!username || !nombreCompleto || !email || !password) {
    alert('Por favor completa todos los campos');
    return;
  }

  const rolesMap = {
    administrador: 'Administrador',
    coordinador:   'Coordinador',
    profesor:      'Profesor',
    alumno:        'Alumno'
  };
  const rol = rolesMap[tipoKey];

  const userData = { username, nombre_completo: nombreCompleto, email, password, rol };

  fetchWithAuth('/api/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
    .then(resp => resp.ok ? resp.json() : Promise.reject())
    .then(() => {
      alert('Usuario creado correctamente');
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearUsuario'));
      modal.hide();
      ['username','nombreCompleto','email','password'].forEach(id => document.getElementById(id).value = '');
      loadUsuarios();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al crear el usuario. Por favor revisa la consola.');
    });
}

// Configurar listeners y exponer funciones
function setupEventListeners() {
  document.querySelector('#modalCrearUsuario .btn-primary').addEventListener('click', crearUsuario);
  document.querySelector('#modalEditarUsuario .btn-primary').addEventListener('click', guardarUsuarioEditado);
  window.prepararEditarUsuario    = prepararEditarUsuario;
  window.confirmarEliminarUsuario = confirmarEliminarUsuario;
}
