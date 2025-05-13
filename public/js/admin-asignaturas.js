// public/js/admin-asignaturas.js
// Gestión de Asignaturas (CRUD) usando la API

document.addEventListener('DOMContentLoaded', function() {
    // Solo Administrador puede modificar asignaturas
    if (getUserRole() !== 'Administrador') {
      alert('No tienes permisos para acceder a esta página');
      window.location.href = 'dashboard.html';
      return;
    }
  
    loadAsignaturas();
    setupEventListeners();
  });
  
  // 1) Cargar todas las asignaturas
  function loadAsignaturas() {
    fetchWithAuth('/api/asignaturas')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar asignaturas');
        return res.json();
      })
      .then(data => updateAsignaturasTable(data))
      .catch(err => {
        console.error(err);
        // Tabla vacía si falla la API
        updateAsignaturasTable([]);
      });
  }
  
  // 2) Renderizar la tabla
  function updateAsignaturasTable(asignaturas) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
  
    asignaturas.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a._id}</td>
        <td>${a.nombre}</td>
        <td>${a.descripcion || ''}</td>
        <td>${a.creditos}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="prepararEditarAsignatura('${a._id}')">
            Editar
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmarEliminarAsignatura('${a._id}', '${a.nombre}')">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  // 3) Preparar el modal de edición
  function prepararEditarAsignatura(id) {
    fetchWithAuth(`/api/asignaturas/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Asignatura no encontrada');
        return res.json();
      })
      .then(a => {
        // Rellenar formulario de edición
        document.getElementById('editNombreAsignatura').value      = a.nombre;
        document.getElementById('editDescripcionAsignatura').value = a.descripcion || '';
        document.getElementById('editCreditosAsignatura').value    = a.creditos;
  
        // Guardar ID para el submit
        const form = document.querySelector('#modalEditarAsignatura form');
        form.dataset.asignaturaId = id;
  
        new bootstrap.Modal(document.getElementById('modalEditarAsignatura')).show();
      })
      .catch(err => {
        console.error(err);
        alert('Error cargando datos de la asignatura');
      });
  }
  
  // 4) Guardar los cambios de edición
  function guardarAsignaturaEditada() {
    const form = document.querySelector('#modalEditarAsignatura form');
    const id = form.dataset.asignaturaId;
  
    const payload = {
      nombre:      document.getElementById('editNombreAsignatura').value.trim(),
      descripcion: document.getElementById('editDescripcionAsignatura').value.trim(),
      creditos:    Number(document.getElementById('editCreditosAsignatura').value)
    };
  
    if (!payload.nombre || isNaN(payload.creditos)) {
      alert('Por favor completa nombre y créditos correctamente');
      return;
    }
  
    fetchWithAuth(`/api/asignaturas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al actualizar');
        return res.json();
      })
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
  
  // 5) Confirmar y eliminar
  function confirmarEliminarAsignatura(id, nombre) {
    if (!confirm(`¿Eliminar la asignatura "${nombre}"?`)) return;
    eliminarAsignatura(id);
  }
  
  function eliminarAsignatura(id) {
    fetchWithAuth(`/api/asignaturas/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Error al eliminar');
        return res.json();
      })
      .then(() => {
        loadAsignaturas();
        alert('Asignatura eliminada');
      })
      .catch(err => {
        console.error(err);
        alert('No se pudo eliminar la asignatura');
      });
  }
  
  // 6) Crear nueva asignatura
  function crearAsignatura() {
    const payload = {
      nombre:      document.getElementById('nombreAsignatura').value.trim(),
      descripcion: document.getElementById('descripcionAsignatura').value.trim(),
      creditos:    Number(document.getElementById('creditosAsignatura').value)
    };
  
    if (!payload.nombre || isNaN(payload.creditos)) {
      alert('Por favor completa nombre y créditos correctamente');
      return;
    }
  
    fetchWithAuth('/api/asignaturas', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al crear');
        return res.json();
      })
      .then(() => {
        bootstrap.Modal.getInstance(document.getElementById('modalCrearAsignatura')).hide();
        document.getElementById('nombreAsignatura').value = '';
        document.getElementById('descripcionAsignatura').value = '';
        document.getElementById('creditosAsignatura').value = '';
        loadAsignaturas();
        alert('Asignatura creada');
      })
      .catch(err => {
        console.error(err);
        alert('No se pudo crear la asignatura');
      });
  }
  
  // 7) Conectar botones de los modales y exponer funciones globales
  function setupEventListeners() {
    // Crear
    document.querySelector('#modalCrearAsignatura .btn-primary')
            .addEventListener('click', crearAsignatura);
    // Editar
    document.querySelector('#modalEditarAsignatura .btn-primary')
            .addEventListener('click', guardarAsignaturaEditada);
  
    // Para los botones inline
    window.prepararEditarAsignatura   = prepararEditarAsignatura;
    window.confirmarEliminarAsignatura = confirmarEliminarAsignatura;
  }
  