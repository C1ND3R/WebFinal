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
      // Datos de ejemplo para desarrollo
      const mockData = [
        { id: 1, username: 'admin', rol: 'Administrador', email: 'admin@example.com' },
        { id: 2, username: 'coord1', rol: 'Coordinador', email: 'coord1@example.com' },
        { id: 3, username: 'prof1', rol: 'Profesor', email: 'prof1@example.com' }
      ];
      updateUsuariosTable(mockData);
    });
}

// Actualizar la tabla de usuarios con los datos recibidos
function updateUsuariosTable(usuarios) {
  const tbody = document.querySelector('table tbody');
  tbody.innerHTML = '';

  usuarios.forEach(usuario => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${usuario.id}</td>
      <td>${usuario.username}</td>
      <td>${usuario.rol}</td>
      <td>${usuario.email}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="prepararEditarUsuario('${usuario.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmarEliminarUsuario('${usuario.id}', '${usuario.username}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Preparar modal para editar usuario
function prepararEditarUsuario(usuarioId) {
  fetchWithAuth(`/api/usuarios/${usuarioId}`)
    .then(response => {
      if (!response.ok) throw new Error('Error al cargar datos del usuario');
      return response.json();
    })
    .then(usuario => {
      document.getElementById('editUsername').value    = usuario.username;
      document.getElementById('editTipoUsuario').value = usuario.rol.toLowerCase();
      document.getElementById('editEmail').value       = usuario.email;

      const form = document.querySelector('#modalEditarUsuario form');
      form.dataset.usuarioId = usuarioId;

      new bootstrap.Modal(document.getElementById('modalEditarUsuario')).show();
    })
    .catch(error => {
      console.error('Error:', error);
      // Simulación para desarrollo
      document.getElementById('editUsername').value    = 'usuario' + usuarioId;
      document.getElementById('editTipoUsuario').value = 'coordinador';
      document.getElementById('editEmail').value       = `usuario${usuarioId}@example.com`;
      const form = document.querySelector('#modalEditarUsuario form');
      form.dataset.usuarioId = usuarioId;
      new bootstrap.Modal(document.getElementById('modalEditarUsuario')).show();
    });
}

// Guardar usuario editado
function guardarUsuarioEditado() {
  const form = document.querySelector('#modalEditarUsuario form');
  const usuarioId = form.dataset.usuarioId;

  const userData = {
    username: document.getElementById('editUsername').value,
    rol:      document.getElementById('editTipoUsuario').value,
    email:    document.getElementById('editEmail').value
  };
  // Si cambió la contraseña, inclúyela
  const newPass = document.getElementById('editPassword').value;
  if (newPass) userData.password = newPass;

  // Validación básica
  if (!userData.username || !userData.email) {
    alert('Por favor completa los campos obligatorios');
    return;
  }

  fetchWithAuth(`/api/usuarios/${usuarioId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  })
  .then(resp => {
    if (!resp.ok) throw new Error('Error al actualizar usuario');
    return resp.json();
  })
  .then(() => {
    bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario')).hide();
    loadUsuarios();
    alert('Usuario actualizado correctamente');
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al actualizar el usuario. Por favor intente nuevamente.');
    bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario')).hide();
    loadUsuarios();
  });
}

// Confirmar eliminación de usuario
function confirmarEliminarUsuario(usuarioId, username) {
  if (confirm(`¿Está seguro que desea eliminar al usuario ${username}?`)) {
    eliminarUsuario(usuarioId);
  }
}

// Eliminar usuario
function eliminarUsuario(usuarioId) {
  fetchWithAuth(`/api/usuarios/${usuarioId}`, { method: 'DELETE' })
    .then(resp => {
      if (!resp.ok) throw new Error('Error al eliminar usuario');
      return resp.json();
    })
    .then(() => {
      loadUsuarios();
      alert('Usuario eliminado correctamente');
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al eliminar el usuario. Por favor intente nuevamente.');
      loadUsuarios();
    });
}

// Crear nuevo usuario
function crearUsuario() {
  const userData = {
    username: document.getElementById('username').value,
    rol:      document.getElementById('tipoUsuario').value,
    email:    document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  // Validación básica
  if (!userData.username || !userData.email || !userData.password) {
    alert('Por favor completa los campos obligatorios');
    return;
  }

  fetchWithAuth('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(userData)
  })
  .then(resp => {
    if (!resp.ok) throw new Error('Error al crear usuario');
    return resp.json();
  })
  .then(() => {
    bootstrap.Modal.getInstance(document.getElementById('modalCrearUsuario')).hide();
    document.getElementById('username').value = '';
    document.getElementById('email').value    = '';
    document.getElementById('password').value = '';
    loadUsuarios();
    alert('Usuario creado correctamente');
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al crear el usuario. Por favor intente nuevamente.');
    bootstrap.Modal.getInstance(document.getElementById('modalCrearUsuario')).hide();
    document.getElementById('username').value = '';
    document.getElementById('email').value    = '';
    document.getElementById('password').value = '';
    loadUsuarios();
  });
}

// Configurar listeners para los botones
function setupEventListeners() {
  document.querySelector('#modalCrearUsuario .btn-primary')
          .addEventListener('click', crearUsuario);
  document.querySelector('#modalEditarUsuario .btn-primary')
          .addEventListener('click', guardarUsuarioEditado);

  // Exponer funciones globalmente
  window.prepararEditarUsuario   = prepararEditarUsuario;
  window.confirmarEliminarUsuario = confirmarEliminarUsuario;
}
