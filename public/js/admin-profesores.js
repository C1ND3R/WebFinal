// public/js/admin-profesores.js

document.addEventListener('DOMContentLoaded', () => {
  if (getUserRole() !== 'Administrador') {
    alert('No tienes permisos para esta sección');
    return window.location.href = 'dashboard.html';
  }
  cargarUsuariosProfesor();
  loadAndRenderProfesores();
  setupFiltros();
  setupEventos();
});

let allProfesores = [];
let allUsuarios   = [];

function cargarUsuariosProfesor() {
  fetchWithAuth('/api/usuarios')
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(list => {
      allUsuarios = list.filter(u => u.rol === 'Profesor');
      const sel = document.getElementById('usuarioSelect');
      sel.innerHTML = '';
      allUsuarios.forEach(u => {
        const o = document.createElement('option');
        o.value       = u._id;
        o.textContent = u.nombre_completo;
        sel.appendChild(o);
      });
    })
    .catch(err => {
      console.error(err);
      alert('Error al cargar lista de usuarios');
    });
}

function loadAndRenderProfesores() {
  fetchWithAuth('/api/profesores')
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(data => {
      allProfesores = data;
      poblarDeptos();
      filtrarYRenderizar();
    })
    .catch(err => {
      console.error(err);
      allProfesores = [];
      poblarDeptos();
      filtrarYRenderizar();
    });
}

function poblarDeptos() {
  const sel = document.getElementById('filterDept');
  sel.innerHTML = `<option value="">— Todos —</option>`;
  [...new Set(allProfesores.map(p => p.departamento))]
    .sort()
    .forEach(d => {
      const o = document.createElement('option');
      o.value       = d;
      o.textContent = d;
      sel.appendChild(o);
    });
}

function setupFiltros() {
  document.getElementById('searchInput')
          .addEventListener('input', filtrarYRenderizar);
  document.getElementById('filterDept')
          .addEventListener('change', filtrarYRenderizar);
  document.getElementById('sortField')
          .addEventListener('change', filtrarYRenderizar);
}

function filtrarYRenderizar() {
  const txt   = document.getElementById('searchInput').value.trim().toLowerCase();
  const dept  = document.getElementById('filterDept').value;
  const sortF = document.getElementById('sortField').value;
  let list = allProfesores.filter(p =>
    p.usuario.nombre_completo.toLowerCase().includes(txt)
  );
  if (dept) list = list.filter(p => p.departamento === dept);
  list.sort((a,b) => {
    if (sortF === 'departamento') {
      return a.departamento.localeCompare(b.departamento);
    }
    return a.usuario.nombre_completo.localeCompare(b.usuario.nombre_completo);
  });
  renderTabla(list);
}

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
      </td>`;
    tbody.appendChild(tr);
  });
}

function setupEventos() {
  document.getElementById('btnSaveNew')
          .addEventListener('click', crearProfesor);
  document.getElementById('btnSaveEdit')
          .addEventListener('click', guardarProfesorEditado);
}

function crearProfesor() {
  const usuario     = document.getElementById('usuarioSelect').value;
  const telefono    = document.getElementById('telefonoInput').value.trim();
  const departamento= document.getElementById('departamentoInput').value.trim();
  const oficina     = document.getElementById('oficinaInput').value.trim();
  if (!usuario || !telefono || !departamento) {
    return alert('Completa todos los campos obligatorios');
  }
  fetchWithAuth('/api/profesores', {
    method: 'POST',
    body: JSON.stringify({ usuario, telefono, departamento, oficina })
  })
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalCrearProfesor')).hide();
      loadAndRenderProfesores();
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo crear el profesor');
    });
}

function abrirEditar(id) {
  fetchWithAuth(`/api/profesores/${id}`)
    .then(r => r.ok ? r.json() : Promise.reject(r))
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
}

function guardarProfesorEditado() {
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
    body: JSON.stringify({ telefono, departamento, oficina, activo })
  })
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalEditarProfesor')).hide();
      loadAndRenderProfesores();
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo actualizar el profesor');
    });
}

function borrarProfesor(id) {
  if (!confirm('¿Eliminar este profesor?')) return;
  fetchWithAuth(`/api/profesores/${id}`, { method: 'DELETE' })
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(() => loadAndRenderProfesores())
    .catch(err => {
      console.error(err);
      alert('No se pudo eliminar el profesor');
    });
}


