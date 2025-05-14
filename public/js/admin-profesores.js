// public/js/admin-profesores.js
// Sólo Administrador puede acceder
document.addEventListener('DOMContentLoaded', () => {
  if (getUserRole() !== 'Administrador') {
    alert('No tienes permiso para entrar aquí');
    window.location.href = 'dashboard.html';
    return;
  }

  cargarUsuariosProfesor();
  loadAndRenderProfesores();
  conectarFiltros();
  conectarEventos();
});

// Datos en memoria
let todosProfesores = [];
let todosUsuarios    = [];

/** Carga usuarios de rol 'Profesor' para dropdown */
function cargarUsuariosProfesor() {
  fetchWithAuth('/api/usuarios')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(list => {
      todosUsuarios = list.filter(u => u.rol === 'Profesor');
      const sel = document.getElementById('usuarioSelect');
      sel.innerHTML = '';
      todosUsuarios.forEach(u => {
        const o = document.createElement('option');
        o.value       = u._id;
        o.textContent = u.nombre_completo;
        sel.appendChild(o);
      });
    })
    .catch(err => {
      console.error(err);
      alert('Error cargando usuarios');
    });
}

/** Trae profesores y gatilla render y filtros */
function loadAndRenderProfesores() {
  fetchWithAuth('/api/profesores')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      todosProfesores = data;
      poblarDeptos();
      filtrarYRenderizar();
    })
    .catch(err => {
      console.error(err);
      todosProfesores = [];
      poblarDeptos();
      filtrarYRenderizar();
    });
}

/** Conecta inputs para filtro en tiempo real */
function conectarFiltros() {
  document.getElementById('searchInput')
          .addEventListener('input', filtrarYRenderizar);
  document.getElementById('filterDept')
          .addEventListener('change', filtrarYRenderizar);
  document.getElementById('sortField')
          .addEventListener('change', filtrarYRenderizar);
}

/** Populate departamentos dropdown */
function poblarDeptos() {
  const sel = document.getElementById('filterDept');
  sel.innerHTML = `<option value="">— Todos los Departamentos —</option>`;
  const setDept = new Set(todosProfesores.map(p => p.departamento));
  Array.from(setDept).sort().forEach(d => {
    const o = document.createElement('option');
    o.value       = d;
    o.textContent = d;
    sel.appendChild(o);
  });
}

/** Filtra, ordena y renderiza la tabla */
function filtrarYRenderizar() {
  const txt   = document.getElementById('searchInput').value.trim().toLowerCase();
  const dept  = document.getElementById('filterDept').value;
  const sortF = document.getElementById('sortField').value;

  let list = todosProfesores
    .filter(p => p.usuario.nombre_completo.toLowerCase().includes(txt));

  if (dept) {
    list = list.filter(p => p.departamento === dept);
  }

  list.sort((a, b) => {
    if (sortF === 'departamento') {
      return a.departamento.localeCompare(b.departamento);
    }
    // default: nombre
    return a.usuario.nombre_completo.localeCompare(b.usuario.nombre_completo);
  });

  renderTabla(list);
}

/** Renderiza la tabla dada una lista */
function renderTabla(list) {
  const tbody = document.getElementById('profesoresTbody');
  tbody.innerHTML = '';
  list.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.usuario.nombre_completo}</td>
      <td>${p.usuario.email}</td>
      <td>${p.telefono}</td>
      <td>${p.departamento}</td>
      <td>${p.oficina || ''}</td>
      <td>${p.activo ? '✅' : '❌'}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="abrirEditar('${p._id}')">Editar</button>
        <button class="btn btn-danger btn-sm"  onclick="borrarProfesor('${p._id}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/** Eventos de creación/edición */
function conectarEventos() {
  document.getElementById('btnSaveNew').addEventListener('click', () => {
    const usuario     = document.getElementById('usuarioSelect').value;
    const telefono    = document.getElementById('telefonoInput').value.trim();
    const departamento= document.getElementById('departamentoInput').value.trim();
    const oficina     = document.getElementById('oficinaInput').value.trim();

    if (!usuario || !telefono || !departamento) {
      return alert('Completa todos los campos obligatorios');
    }

    fetchWithAuth('/api/profesores', {
      method: 'POST',
      headers:{ 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, telefono, departamento, oficina })
    })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalCrearProfesor')).hide();
      loadAndRenderProfesores();
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo crear el profesor');
    });
  });

  document.getElementById('btnSaveEdit').addEventListener('click', () => {
    const id           = document.getElementById('editProfesorId').value;
    const telefono     = document.getElementById('editTelefono').value.trim();
    const departamento = document.getElementById('editDepartamento').value.trim();
    const oficina      = document.getElementById('editOficina').value.trim();
    const activo       = document.getElementById('editActivo').checked;

    if (!telefono || !departamento) {
      return alert('Completa teléfono y departamento');
    }

    fetchWithAuth(`/api/profesores/${id}`, {
      method: 'PUT',
      headers:{ 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono, departamento, oficina, activo })
    })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalEditarProfesor')).hide();
      loadAndRenderProfesores();
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo actualizar el profesor');
    });
  });
}

// Funciones globales para botones de fila
window.abrirEditar = function(id) {
  fetchWithAuth(`/api/profesores/${id}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(p => {
      document.getElementById('editProfesorId').value   = p._id;
      document.getElementById('editNombre').value      = p.usuario.nombre_completo;
      document.getElementById('editTelefono').value    = p.telefono;
      document.getElementById('editDepartamento').value= p.departamento;
      document.getElementById('editOficina').value     = p.oficina || '';
      document.getElementById('editActivo').checked    = p.activo;
      new bootstrap.Modal(document.getElementById('modalEditarProfesor')).show();
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo cargar el profesor');
    });
};

window.borrarProfesor = function(id) {
  if (!confirm('¿Eliminar este profesor?')) return;
  fetchWithAuth(`/api/profesores/${id}`, {
    method: 'DELETE',
    headers:{ 'Content-Type': 'application/json' }
  })
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(() => loadAndRenderProfesores())
  .catch(err => {
    console.error(err);
    alert('No se pudo eliminar el profesor');
  });
};

