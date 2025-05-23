// public/js/coord-profesores.js

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // 1) Solo Coordinador y Administrador pueden entrar
  const role = getUserRole();
  if (!['Coordinador', 'Administrador'].includes(role)) {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'index.html';
    return;
  }

  loadAssignedProfessors();
  loadAvailableProfessors();
  setupEventListeners();
});

////////////////////////////////////////////////////////////////////////////////
// 2) Cargar y pintar la tabla de profesores (asignados)
//################################################################################
function loadAssignedProfessors() {
  fetchWithAuth('/api/profesores')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(updateProfesoresTable)
    .catch(err => {
      console.error('Error al cargar profesores:', err);
      updateProfesoresTable([]); // tabla vacía si falla
    });
}

function updateProfesoresTable(profesores) {
  const tbody = document.querySelector('table tbody');
  tbody.innerHTML = '';
  profesores.forEach(p => {
    const nombre = p.usuario?.nombre_completo || '— sin nombre —';
    const comentario = p.ultimo_comentario || 'Sin comentarios';
    const fecha = p.fecha_ultimo_comentario
      ? new Date(p.fecha_ultimo_comentario).toLocaleDateString()
      : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${nombre}</td>
      <td>${comentario}</td>
      <td>${fecha}</td>
      <td>
        <button
          class="btn btn-info btn-sm me-1"
          onclick="verHistorialComentarios('${p._id}')"
        >
          Ver Historial
        </button>
        <button
          class="btn btn-success btn-sm"
          onclick="prepararNuevoComentario('${p._id}', '${nombre}')"
        >
          Nuevo Comentario
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

////////////////////////////////////////////////////////////////////////////////
// 3) Cargar profesores disponibles para el <select> de asignar
////////////////////////////////////////////////////////////////////////////////
function loadAvailableProfessors() {
  fetchWithAuth('/api/profesores')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(updateProfesoresSelect)
    .catch(err => {
      console.error('Error al cargar select de profesores:', err);
      updateProfesoresSelect([]);
    });
}

function updateProfesoresSelect(list) {
  const sel = document.getElementById('selectProfesor');
  sel.innerHTML = '<option value="">Seleccione un profesor</option>';
  list.forEach(p => {
    const nombre = p.usuario?.nombre_completo || '— sin nombre —';
    const opt = document.createElement('option');
    opt.value = p._id;
    opt.textContent = nombre;
    sel.appendChild(opt);
  });
}

////////////////////////////////////////////////////////////////////////////////
// 4) Ver historial de comentarios
////////////////////////////////////////////////////////////////////////////////
function verHistorialComentarios(id) {
  fetchWithAuth(`/api/evaluaciones/profesor/${id}`)
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(data => mostrarHistorialComentarios(data.evaluaciones || data))
    .catch(() => mostrarHistorialComentarios([]));
  new bootstrap.Modal(document.getElementById('modalHistorialComentarios')).show();
}

function mostrarHistorialComentarios(list) {
  const ul = document.querySelector('#modalHistorialComentarios .list-group');
  ul.innerHTML = '';
  if (list.length === 0) {
    ul.innerHTML = '<li class="list-group-item">No hay comentarios registrados</li>';
  } else {
    list.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `
        <strong>${c.fecha}</strong> – ${c.comentario}
        <div class="text-muted small">Por: ${c.coordinador || 'Coordinador'}</div>
      `;
      ul.appendChild(li);
    });
  }
}

////////////////////////////////////////////////////////////////////////////////
// 5) Preparar y guardar nuevo comentario
////////////////////////////////////////////////////////////////////////////////
function prepararNuevoComentario(profesorId, profesorNombre) {
  const form = document.querySelector('#modalNuevoComentario form');
  form.dataset.profesorId = profesorId;
  document.getElementById('modalNuevoComentarioLabel').textContent =
    `Agregar Comentario – ${profesorNombre}`;
  document.getElementById('comentario').value = '';

  fetchWithAuth(`/api/profesores/${profesorId}/asignaturas`)
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(list => {
      const sel = document.getElementById('selectTrayectoria');
      sel.innerHTML = '<option value="" disabled selected>Seleccione una trayectoria</option>';
      list.forEach(t => {
        const lbl = `${t.asignatura.nombre} (${t.periodo} ${t.anio} | Grupo ${t.grupo})`;
        const opt = document.createElement('option');
        opt.value = t._id;
        opt.textContent = lbl;
        sel.appendChild(opt);
      });
    })
    .catch(err => {
      console.error('No se pudo cargar trayectorias:', err);
      document.getElementById('selectTrayectoria').innerHTML = '';
    });

  new bootstrap.Modal(document.getElementById('modalNuevoComentario')).show();
}

function guardarComentario() {
  const form = document.querySelector('#modalNuevoComentario form');
  const trayectoriaId = document.getElementById('selectTrayectoria').value;
  const puntuacion    = Number(document.getElementById('puntuacion').value);
  const comentario    = document.getElementById('comentario').value.trim();

  if (!trayectoriaId || isNaN(puntuacion) || !comentario) {
    return alert('Completa todos los campos obligatorios');
  }

  fetchWithAuth('/api/evaluaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trayectoriaAsignatura: trayectoriaId,
      evaluador: getUserId(),
      puntuacion,
      comentario
    })
  })
    .then(r => (r.ok ? r.json() : Promise.reject('Error al guardar')))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalNuevoComentario')).hide();
      loadAssignedProfessors();
      alert('Comentario guardado correctamente');
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo guardar el comentario');
      bootstrap.Modal.getInstance(document.getElementById('modalNuevoComentario')).hide();
      loadAssignedProfessors();
    });
}

////////////////////////////////////////////////////////////////////////////////
// 6) Asignar profesor al coordinador
////////////////////////////////////////////////////////////////////////////////
function asignarProfesor() {
  const profesorId   = document.getElementById('selectProfesor').value;
  const coordinadorId = getUserId();
  if (!profesorId) {
    return alert('Seleccione un profesor para asignar');
  }

  fetchWithAuth(`/api/coordinadores/${coordinadorId}/profesores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profesor_id: profesorId })
  })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalAsignarProfesor')).hide();
      loadAssignedProfessors();
      alert('Profesor asignado correctamente');
    })
    .catch(err => {
      console.error(err);
      alert('No se pudo asignar el profesor');
      bootstrap.Modal.getInstance(document.getElementById('modalAsignarProfesor')).hide();
      loadAssignedProfessors();
    });
}

////////////////////////////////////////////////////////////////////////////////
// 7) Conectar botones y exponer funciones globales
////////////////////////////////////////////////////////////////////////////////
function setupEventListeners() {
  document
    .querySelector('#modalNuevoComentario .btn-primary')
    .addEventListener('click', guardarComentario);

  document
    .querySelector('#modalAsignarProfesor .btn-primary')
    .addEventListener('click', asignarProfesor);

  window.verHistorialComentarios = verHistorialComentarios;
  window.prepararNuevoComentario = prepararNuevoComentario;
}
