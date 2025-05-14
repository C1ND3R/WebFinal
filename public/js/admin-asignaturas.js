// public/js/admin-asignaturas.js

document.addEventListener('DOMContentLoaded', () => {
  if (getUserRole() !== 'Administrador') {
    alert('No tienes permisos para esta sección');
    return window.location.href = 'dashboard.html';
  }
  loadAsignaturas();
  setupEventListeners();
});

function loadAsignaturas() {
  fetchWithAuth('/api/asignaturas')
    .then(res => {
      if (!res.ok) throw new Error('Error al cargar asignaturas');
      return res.json();
    })
    .then(updateTabla)
    .catch(err => {
      console.error(err);
      updateTabla([]);
    });
}

function updateTabla(asigs) {
  const tbody = document.querySelector('#tablaAsignaturas tbody');
  tbody.innerHTML = '';
  asigs.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a._id}</td>
      <td>${a.codigo}</td>
      <td>${a.nombre}</td>
      <td>${a.descripcion || ''}</td>
      <td>${a.creditos}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="prepararEditarAsignatura('${a._id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmarEliminarAsignatura('${a._id}','${a.nombre}')">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function prepararEditarAsignatura(id) {
  fetchWithAuth(`/api/asignaturas/${id}`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(a => {
      document.getElementById('editCodigo').value      = a.codigo;
      document.getElementById('editNombre').value      = a.nombre;
      document.getElementById('editDescripcion').value = a.descripcion || '';
      document.getElementById('editCreditos').value    = a.creditos;
      const form = document.querySelector('#modalEditarAsignatura form');
      form.dataset.asignaturaId = id;
      new bootstrap.Modal(document.getElementById('modalEditarAsignatura')).show();
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo cargar la asignatura');
    });
}

function guardarAsignaturaEditada() {
  const form = document.querySelector('#modalEditarAsignatura form');
  const id   = form.dataset.asignaturaId;
  const payload = {
    codigo:      document.getElementById('editCodigo').value.trim(),
    nombre:      document.getElementById('editNombre').value.trim(),
    descripcion: document.getElementById('editDescripcion').value.trim(),
    creditos:    Number(document.getElementById('editCreditos').value)
  };
  if (!payload.codigo || !payload.nombre || isNaN(payload.creditos)) {
    return alert('Completa todos los campos obligatorios');
  }
  fetchWithAuth(`/api/asignaturas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalEditarAsignatura')).hide();
      loadAsignaturas();
      alert('Asignatura actualizada');
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo actualizar la asignatura');
    });
}

function crearAsignatura() {
  const payload = {
    codigo:      document.getElementById('codigo').value.trim(),
    nombre:      document.getElementById('nombre').value.trim(),
    descripcion: document.getElementById('descripcion').value.trim(),
    creditos:    Number(document.getElementById('creditos').value)
  };
  if (!payload.codigo || !payload.nombre || isNaN(payload.creditos)) {
    return alert('Completa todos los campos obligatorios');
  }
  fetchWithAuth('/api/asignaturas', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalCrearAsignatura')).hide();
      ['codigo','nombre','descripcion','creditos'].forEach(id => document.getElementById(id).value = '');
      loadAsignaturas();
      alert('Asignatura creada');
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo crear la asignatura');
    });
}

function confirmarEliminarAsignatura(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"?`)) return;
  fetchWithAuth(`/api/asignaturas/${id}`, { method: 'DELETE' })
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(() => {
      loadAsignaturas();
      alert('Asignatura eliminada');
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo eliminar la asignatura');
    });
}

function setupEventListeners() {
  document.getElementById('btnCrearAsig').addEventListener('click', crearAsignatura);
  document.getElementById('btnEditarAsig').addEventListener('click', guardarAsignaturaEditada);
  window.prepararEditarAsignatura    = prepararEditarAsignatura;
  window.confirmarEliminarAsignatura = confirmarEliminarAsignatura;
}

