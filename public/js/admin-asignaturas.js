// public/js/admin-asignaturas.js
// CRUD de asignaturas via API

document.addEventListener('DOMContentLoaded', () => {
  if (getUserRole() !== 'Administrador') {
    alert('No tienes permisos para acceder aquí');
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
    .then(updateAsignaturasTable)
    .catch(err => {
      console.error(err);
      updateAsignaturasTable([]); // tabla vacía
    });
}

function updateAsignaturasTable(asigs) {
  const tbody = document.querySelector('table tbody');
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
        <button class="btn btn-danger btn-sm" onclick="confirmarEliminarAsignatura('${a._id}', '${a.nombre}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function prepararEditarAsignatura(id) {
  fetchWithAuth(`/api/asignaturas/${id}`)
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(a => {
      document.getElementById('editCodigoAsignatura').value    = a.codigo;
      document.getElementById('editNombreAsignatura').value    = a.nombre;
      document.getElementById('editDescripcionAsignatura').value = a.descripcion || '';
      document.getElementById('editCreditosAsignatura').value = a.creditos;
      const form = document.querySelector('#modalEditarAsignatura form');
      form.dataset.asignaturaId = id;
      new bootstrap.Modal(document.getElementById('modalEditarAsignatura')).show();
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo cargar la asignatura para editar');
    });
}

function guardarAsignaturaEditada() {
  const form = document.querySelector('#modalEditarAsignatura form');
  const id = form.dataset.asignaturaId;
  const payload = {
    codigo:      document.getElementById('editCodigoAsignatura').value.trim(),
    nombre:      document.getElementById('editNombreAsignatura').value.trim(),
    descripcion: document.getElementById('editDescripcionAsignatura').value.trim(),
    creditos:    Number(document.getElementById('editCreditosAsignatura').value)
  };
  if (!payload.codigo || !payload.nombre || isNaN(payload.creditos)) {
    return alert('Completa código, nombre y créditos');
  }
  fetchWithAuth(`/api/asignaturas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.ok ? res.json() : Promise.reject())
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
    codigo:      document.getElementById('codigoAsignatura').value.trim(),
    nombre:      document.getElementById('nombreAsignatura').value.trim(),
    descripcion: document.getElementById('descripcionAsignatura').value.trim(),
    creditos:    Number(document.getElementById('creditosAsignatura').value)
  };
  if (!payload.codigo || !payload.nombre || isNaN(payload.creditos)) {
    return alert('Completa código, nombre y créditos');
  }
  fetchWithAuth('/api/asignaturas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalCrearAsignatura')).hide();
      ['codigoAsignatura','nombreAsignatura','descripcionAsignatura','creditosAsignatura']
        .forEach(id => document.getElementById(id).value = '');
      loadAsignaturas();
      alert('Asignatura creada correctamente');
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo crear la asignatura');
    });
}

function confirmarEliminarAsignatura(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"?`)) return;
  fetchWithAuth(`/api/asignaturas/${id}`, { method: 'DELETE' })
    .then(res => res.ok ? res.json() : Promise.reject())
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
  document.querySelector('#modalCrearAsignatura .btn-primary')
          .addEventListener('click', crearAsignatura);
  document.querySelector('#modalEditarAsignatura .btn-primary')
          .addEventListener('click', guardarAsignaturaEditada);
  window.prepararEditarAsignatura    = prepararEditarAsignatura;
  window.confirmarEliminarAsignatura = confirmarEliminarAsignatura;
}
