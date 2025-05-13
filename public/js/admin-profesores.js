// public/js/admin-profesores.js

document.addEventListener('DOMContentLoaded', () => {
  // Sólo Admin
  if (getUserRole() !== 'Administrador') {
    alert('No tienes permiso para entrar aquí');
    window.location.href = 'dashboard.html';
    return;
  }

  cargarUsuariosProfesor();
  cargarProfesores();
  poblarFiltros();
  conectarEventos();
});

let todosProfesores = [];
let todosUsuarios = [];

// 1) Traer lista de usuarios con rol 'Profesor' para asignarlos
function cargarUsuariosProfesor() {
  fetchWithAuth('/api/usuarios')
    .then(r => r.json())
    .then(usuarios => {
      // Filtrar sólo aquellos cuyo rol === 'Profesor' y que aún no tengan Profesor creado
      todosUsuarios = usuarios.filter(u => u.rol === 'Profesor');
      const select = document.getElementById('usuarioSelect');
      select.innerHTML = '';
      todosUsuarios.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.nombre_completo;
        select.appendChild(opt);
      });
    })
    .catch(console.error);
}

// 2) Traer tabla de profesores
function cargarProfesores() {
  fetchWithAuth('/api/profesores')
    .then(r => r.json())
    .then(data => {
      todosProfesores = data;
      renderTabla(data);
    })
    .catch(console.error);
}

// 3) Renderizar tabla según filtros/orden
function renderTabla(list) {
  const tbody = document.getElementById('profesoresTbody');
  tbody.innerHTML = '';

  // Filtrar por búsqueda de nombre
  const busq = document.getElementById('searchInput').value.toLowerCase();
  // Filtrar por departamento
  const depto = document.getElementById('filterDept').value;
  let fil = list.filter(p => {
    const name = p.usuario.nombre_completo.toLowerCase();
    const okName = !busq || name.includes(busq);
    const okDept = !depto || p.departamento === depto;
    return okName && okDept;
  });

  // Ordenar
  const campo = document.getElementById('sortField').value;
  fil.sort((a, b) => {
    const va = campo === 'usuario.nombre_completo'
      ? a.usuario.nombre_completo.toLowerCase()
      : a[campo].toLowerCase();
    const vb = campo === 'usuario.nombre_completo'
      ? b.usuario.nombre_completo.toLowerCase()
      : b[campo].toLowerCase();
    return va < vb ? -1 : va > vb ? 1 : 0;
  });

  // Dibujar filas
  fil.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.usuario.nombre_completo}</td>
      <td>${p.usuario.email}</td>
      <td>${p.telefono}</td>
      <td>${p.departamento}</td>
      <td>${p.oficina || ''}</td>
      <td>${p.activo ? '✅' : '❌'}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="abrirEditar('${p._id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="borrarProfesor('${p._id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 4) Poblar filtro de departamentos dinámicamente
function poblarFiltros() {
  const depts = Array.from(new Set(todosProfesores.map(p => p.departamento))).sort();
  const sel = document.getElementById('filterDept');
  depts.forEach(d => {
    const o = document.createElement('option');
    o.value = d;
    o.textContent = d;
    sel.appendChild(o);
  });
}

// 5) Eventos de búsqueda / orden / filtros
function conectarEventos() {
  document.getElementById('searchInput').addEventListener('input', () => renderTabla(todosProfesores));
  document.getElementById('filterDept').addEventListener('change', () => renderTabla(todosProfesores));
  document.getElementById('sortField').addEventListener('change', () => renderTabla(todosProfesores));

  // Crear
  document.getElementById('btnSaveNew').addEventListener('click', () => {
    const usuario = document.getElementById('usuarioSelect').value;
    const telefono = document.getElementById('telefonoInput').value.trim();
    const departamento = document.getElementById('departamentoInput').value.trim();
    const oficina = document.getElementById('oficinaInput').value.trim();
    fetchWithAuth('/api/profesores', {
      method: 'POST',
      body: JSON.stringify({ usuario, telefono, departamento, oficina })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        bootstrap.Modal.getInstance(document.getElementById('modalCrearProfesor')).hide();
        cargarProfesores();
      })
      .catch(() => alert('No se pudo crear el profesor'));
  });

  // Guardar edición
  document.getElementById('btnSaveEdit').addEventListener('click', () => {
    const id = document.getElementById('editProfesorId').value;
    const telefono = document.getElementById('editTelefono').value.trim();
    const departamento = document.getElementById('editDepartamento').value.trim();
    const oficina = document.getElementById('editOficina').value.trim();
    const activo = document.getElementById('editActivo').checked;
    fetchWithAuth(`/api/profesores/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ telefono, departamento, oficina, activo })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarProfesor')).hide();
        cargarProfesores();
      })
      .catch(() => alert('No se pudo actualizar el profesor'));
  });
}

// Abrir modal de edición y precargar datos
window.abrirEditar = function(id) {
  fetchWithAuth(`/api/profesores/${id}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(p => {
      document.getElementById('editProfesorId').value   = p._id;
      document.getElementById('editNombre').value      = p.usuario.nombre_completo;
      document.getElementById('editTelefono').value    = p.telefono;
      document.getElementById('editDepartamento').value = p.departamento;
      document.getElementById('editOficina').value     = p.oficina || '';
      document.getElementById('editActivo').checked    = p.activo;
      new bootstrap.Modal(document.getElementById('modalEditarProfesor')).show();
    })
    .catch(() => alert('No se pudo cargar datos del profesor'));
};

// Borrar (soft delete)
window.borrarProfesor = function(id) {
  if (!confirm('¿Seguro que deseas eliminar este profesor?')) return;
  fetchWithAuth(`/api/profesores/${id}`, { method: 'DELETE' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(() => cargarProfesores())
    .catch(() => alert('No se pudo eliminar el profesor'));
};
