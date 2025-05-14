// public/js/admin-usuarios.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Restringir acceso
  if (getUserRole() !== 'Administrador') {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'dashboard.html';
    return;
  }
  loadUsuarios();
  setupEventListeners();
});

////////////////////////////////////////////////////////////////////////////////
// 2) Carga y pinta la tabla de usuarios
////////////////////////////////////////////////////////////////////////////////
function loadUsuarios() {
  fetchWithAuth('/api/usuarios')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(updateUsuariosTable)
    .catch(err => {
      console.error('Error al cargar usuarios:', err);
      alert('No se pudo cargar la lista de usuarios.');
    });
}

function updateUsuariosTable(usuarios) {
  const tbody = document.querySelector('#tablaUsuarios tbody');
  tbody.innerHTML = '';
  usuarios.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u._id}</td>
      <td>${u.username}</td>
      <td>${u.nombre_completo}</td>
      <td>${u.rol}</td>
      <td>${u.email}</td>
      <td>
        <button class="btn btn-warning btn-sm me-1"
                onclick="prepararEditarUsuario('${u._id}')">
          Editar
        </button>
        <button class="btn btn-danger btn-sm"
                onclick="confirmarEliminarUsuario('${u._id}', '${u.username}')">
          Eliminar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

////////////////////////////////////////////////////////////////////////////////
// 3) Crear Usuario (formCrearUsuario)
////////////////////////////////////////////////////////////////////////////////
function crearUsuario() {
  const body = {
    username:        document.getElementById('username').value.trim(),
    nombre_completo: document.getElementById('nombreCompleto').value.trim(),
    rol:             document.getElementById('rol').value,
    email:           document.getElementById('email').value.trim(),
    password:        document.getElementById('password').value
  };
  if (!body.username || !body.nombre_completo || !body.email || !body.password) {
    return alert('Completa todos los campos obligatorios.');
  }
  fetchWithAuth('/api/usuarios', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  })
    .then(res => {
      if (!res.ok) return res.json().then(e => Promise.reject(e));
      return res.json();
    })
    .then(() => {
      loadUsuarios();
      bootstrap.Modal.getInstance(
        document.getElementById('modalCrearUsuario')
      ).hide();
      document.getElementById('formCrearUsuario').reset();
    })
    .catch(err => {
      console.error('Error al crear usuario:', err);
      alert(err.message || 'Error al crear el usuario.');
    });
}

////////////////////////////////////////////////////////////////////////////////
// 4) Preparar edición (carga y abre modalEditarUsuario)
////////////////////////////////////////////////////////////////////////////////
function prepararEditarUsuario(id) {
  fetchWithAuth(`/api/usuarios/${id}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(u => {
      document.getElementById('editar-id').value = u._id;
      document.getElementById('editar-username').value = u.username;
      document.getElementById('editar-nombreCompleto').value = u.nombre_completo;
      document.getElementById('editar-rol').value = u.rol;
      document.getElementById('editar-email').value = u.email;
      document.getElementById('editar-password').value = '';
      new bootstrap.Modal(
        document.getElementById('modalEditarUsuario')
      ).show();
    })
    .catch(err => {
      console.error('Error al cargar usuario:', err);
      alert('No se pudo cargar los datos para edición.');
    });
}

////////////////////////////////////////////////////////////////////////////////
// 5) Guardar cambios de edición (formEditarUsuario)
////////////////////////////////////////////////////////////////////////////////
function guardarUsuarioEditado() {
  const id = document.getElementById('editar-id').value;
  const body = {
    username:        document.getElementById('editar-username').value.trim(),
    nombre_completo: document.getElementById('editar-nombreCompleto').value.trim(),
    rol:             document.getElementById('editar-rol').value,
    email:           document.getElementById('editar-email').value.trim()
  };
  const pwd = document.getElementById('editar-password').value;
  if (pwd) body.password = pwd;

  fetchWithAuth(`/api/usuarios/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  })
    .then(res => {
      if (!res.ok) return res.json().then(e => Promise.reject(e));
      return res.json();
    })
    .then(() => {
      loadUsuarios();
      bootstrap.Modal.getInstance(
        document.getElementById('modalEditarUsuario')
      ).hide();
    })
    .catch(err => {
      console.error('Error al guardar cambios:', err);
      alert(err.message || 'Error al actualizar el usuario.');
    });
}

////////////////////////////////////////////////////////////////////////////////
// 6) Eliminar usuario
////////////////////////////////////////////////////////////////////////////////
function confirmarEliminarUsuario(id, username) {
  if (!confirm(`¿Eliminar al usuario "${username}"?`)) return;
  fetchWithAuth(`/api/usuarios/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      loadUsuarios();
    })
    .catch(err => {
      console.error('Error al eliminar usuario:', err);
      alert('No se pudo eliminar el usuario.');
    });
}

////////////////////////////////////////////////////////////////////////////////
// 7) Enlazar listeners
////////////////////////////////////////////////////////////////////////////////
function setupEventListeners() {
  // Crear
  const formCrear = document.getElementById('formCrearUsuario');
  if (formCrear) {
    formCrear.addEventListener('submit', e => {
      e.preventDefault();
      crearUsuario();
    });
  }

  // Editar
  const formEditar = document.getElementById('formEditarUsuario');
  if (formEditar) {
    formEditar.addEventListener('submit', e => {
      e.preventDefault();
      guardarUsuarioEditado();
    });
  }

  // Funciones globales para onclick inline
  window.prepararEditarUsuario    = prepararEditarUsuario;
  window.confirmarEliminarUsuario = confirmarEliminarUsuario;
}
