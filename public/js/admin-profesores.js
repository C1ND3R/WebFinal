// public/js/admin-profesores.js

document.addEventListener('DOMContentLoaded', () => {
  // Restringir acceso a Administradores
  if (getUserRole() !== 'Administrador') {
    alert('No tienes permisos para esta sección');
    window.location.href = 'dashboard.html';
    return;
  }
  cargarUsuariosProfesor();
  loadAndRenderProfesores();
  setupFiltros();
  setupEventos();
});

let allProfesores = [];
let allUsuarios   = [];

// 1) Cargar lista de usuarios con rol Profesor para el modal de creación
function cargarUsuariosProfesor() {
  fetchWithAuth('/api/usuarios')
    .then(r => (r.ok ? r.json() : Promise.reject(r)))
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
      console.error('Error al cargar usuarios:', err);
      alert('Error al cargar lista de usuarios');
    });
}

// 2) Traer y renderizar todos los profesores
function loadAndRenderProfesores() {
  fetchWithAuth('/api/profesores')
    .then(r => (r.ok ? r.json() : Promise.reject(r)))
    .then(data => {
      allProfesores = data;
      poblarDeptos();
      filtrarYRenderizar();
    })
    .catch(err => {
      console.error('Error al cargar profesores:', err);
      allProfesores = [];
      poblarDeptos();
      filtrarYRenderizar();
    });
}

// Rellena el dropdown de Departamentos
function poblarDeptos() {
  const sel = document.getElementById('filterDept');
  sel.innerHTML = '<option value="">— Todos los Departamentos —</option>';
  Array.from(new Set(allProfesores.map(p => p.departamento)))
    .sort()
    .forEach(d => {
      const o = document.createElement('option');
      o.value       = d;
      o.textContent = d;
      sel.appendChild(o);
    });
}

// 3) Filtros y ordenamiento
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

  list.sort((a, b) => {
    if (sortF === 'departamento') return a.departamento.localeCompare(b.departamento);
    return a.usuario.nombre_completo.localeCompare(b.usuario.nombre_completo);
  });

  renderTabla(list);
}

// Inserta las filas en el tbody
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
        <button class="btn btn-secondary btn-sm me-1"
                onclick="prepararAsignarAsignatura('${p._id}', '${p.usuario.nombre_completo}')">
          Asignar Asignatura
        </button>
        <button class="btn btn-warning btn-sm me-1"
                onclick="abrirEditar('${p._id}')">
          Editar
        </button>
        <button class="btn btn-danger btn-sm"
                onclick="borrarProfesor('${p._id}')">
          Eliminar
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// 4) Botones Crear y Guardar edición y asignación
function setupEventos() {
  document.getElementById('btnSaveNew')
          .addEventListener('click', crearProfesor);
  document.getElementById('btnSaveEdit')
          .addEventListener('click', guardarProfesorEditado);
  document.getElementById('btnSaveAsignacion')
          .addEventListener('click', guardarAsignacion);

  // Exponer funciones globales para onclick inline
  window.prepararAsignarAsignatura = prepararAsignarAsignatura;
  window.abrirEditar             = abrirEditar;
  window.borrarProfesor          = borrarProfesor;
}

// Crear nuevo profesor
function crearProfesor() {
  const usuario      = document.getElementById('usuarioSelect').value;
  const telefono     = document.getElementById('telefonoInput').value.trim();
  const departamento = document.getElementById('departamentoInput').value.trim();
  const oficina      = document.getElementById('oficinaInput').value.trim();
  if (!usuario || !telefono || !departamento) {
    return alert('Completa todos los campos obligatorios');
  }
  fetchWithAuth('/api/profesores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ usuario, telefono, departamento, oficina })
  })
    .then(r => (r.ok ? r.json() : Promise.reject(r)))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalCrearProfesor')).hide();
      loadAndRenderProfesores();
    })
    .catch(err => {
      console.error('Error al crear profesor:', err);
      alert('No se pudo crear el profesor');
    });
}

// Abrir modal de edición y rellenar datos
function abrirEditar(id) {
  fetchWithAuth(`/api/profesores/${id}`)
    .then(r => (r.ok ? r.json() : Promise.reject(r)))
    .then(p => {
      document.getElementById('editProfesorId').value   = p._id;
      document.getElementById('editNombre').value       = p.usuario.nombre_completo;
      document.getElementById('editTelefono').value     = p.telefono;
      document.getElementById('editDepartamento').value = p.departamento;
      document.getElementById('editOficina').value      = p.oficina || '';
      document.getElementById('editActivo').checked     = p.activo;
      new bootstrap.Modal(document.getElementById('modalEditarProfesor')).show();
    })
    .catch(err => {
      console.error('Error al cargar profesor:', err);
      alert('No se pudo cargar el profesor');
    });
}

// Guardar cambios de edición
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
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ telefono, departamento, oficina, activo })
  })
    .then(r => (r.ok ? r.json() : Promise.reject(r)))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalEditarProfesor')).hide();
      loadAndRenderProfesores();
    })
    .catch(err => {
      console.error('Error al actualizar profesor:', err);
      alert('No se pudo actualizar el profesor');
    });
}

// 5) Preparar y guardar nueva asignación (nueva trayectoria)
function prepararAsignarAsignatura(profesorId, profesorNombre) {
  document.getElementById('asignarProfesorId').value = profesorId;
  document.getElementById('modalAsignarAsignaturaLabel').textContent =
    `Asignar Asignatura – ${profesorNombre}`;
  const sel = document.getElementById('asignaturaSelect');
  sel.innerHTML = '<option value="">Seleccione una asignatura</option>';
  fetchWithAuth('/api/asignaturas')
    .then(r => (r.ok ? r.json() : Promise.reject(r)))
    .then(list => {
      list.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a._id;
        opt.textContent = a.nombre;
        sel.appendChild(opt);
      });
    })
    .catch(err => {
      console.error('Error cargando asignaturas:', err);
      sel.innerHTML = '';
    });
  // Reset inputs
  document.getElementById('periodoInput').value = '';
  document.getElementById('anioInput').value    = '';
  document.getElementById('grupoInput').value   = '';
  new bootstrap.Modal(document.getElementById('modalAsignarAsignatura')).show();
}

function guardarAsignacion() {
  const profesorId = document.getElementById('asignarProfesorId').value;
  const asignatura= document.getElementById('asignaturaSelect').value;
  const periodo    = document.getElementById('periodoInput').value.trim();
  const anio       = Number(document.getElementById('anioInput').value);
  const grupo      = document.getElementById('grupoInput').value.trim();
  if (!asignatura || !periodo || isNaN(anio) || !grupo) {
    return alert('Completa todos los campos obligatorios');
  }
  fetchWithAuth(`/api/profesores/${profesorId}/asignaturas`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ asignatura, periodo, anio, grupo })
  })
    .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalAsignarAsignatura')).hide();
      alert('Asignatura asignada correctamente');
      loadAndRenderProfesores();
    })
    .catch(err => {
      console.error('Error al asignar asignatura:', err);
      alert(err.message || 'Error al asignar la asignatura');
      bootstrap.Modal.getInstance(document.getElementById('modalAsignarAsignatura')).hide();
    });
}

// 6) Eliminar profesor
function borrarProfesor(id) {
  if (!confirm('¿Eliminar este profesor?')) return;
  fetchWithAuth(`/api/profesores/${id}`, { method: 'DELETE' })
    .then(r => (r.ok ? r.json() : Promise.reject(r)))
    .then(() => loadAndRenderProfesores())
    .catch(err => {
      console.error('Error al eliminar profesor:', err);
      alert('No se pudo eliminar el profesor');
    });
}

