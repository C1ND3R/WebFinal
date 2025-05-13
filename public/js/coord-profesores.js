// public/js/coord-profesores.js
// Funcionalidad para gestionar profesores y comentarios con selección de trayectoria

document.addEventListener('DOMContentLoaded', () => {
  // Solo Coordinador y Administrador pueden entrar
  if (!['Coordinador', 'Administrador'].includes(getUserRole())) {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'index.html';
    return;
  }

  loadAssignedProfessors();
  loadAvailableProfessors();
  setupEventListeners();
});

// 1) Cargar profesores asignados
function loadAssignedProfessors() {
  fetchWithAuth('/api/profesores')
    .then(r => r.ok ? r.json() : Promise.reject('Error al cargar profesores'))
    .then(updateProfesoresTable)
    .catch(err => {
      console.error(err);
      updateProfesoresTable([]); // tabla vacía si falla
    });
}

function updateProfesoresTable(profesores) {
  const tbody = document.querySelector('table tbody');
  tbody.innerHTML = '';
  profesores.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.nombre_completo}</td>
      <td>${p.ultimo_comentario || 'Sin comentarios'}</td>
      <td>${p.fecha_ultimo_comentario || '-'}</td>
      <td>
        <button class="btn btn-info btn-sm" onclick="verHistorialComentarios('${p._id}')">Ver Historial</button>
        <button class="btn btn-success btn-sm" onclick="prepararNuevoComentario('${p._id}', '${p.nombre_completo}')">Nuevo Comentario</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 2) Cargar profesores disponibles para asignar (sin cambios)
function loadAvailableProfessors() {
  fetchWithAuth('/api/profesores')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(updateProfesoresSelect)
    .catch(() => updateProfesoresSelect([]));
}
function updateProfesoresSelect(list) {
  const sel = document.getElementById('selectProfesor');
  sel.innerHTML = '';
  list.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p._id;
    opt.textContent = p.nombre_completo;
    sel.appendChild(opt);
  });
}

// 3) Ver historial de un profesor (sin cambios)
function verHistorialComentarios(id) {
  fetchWithAuth(`/api/evaluaciones/profesor/${id}`)
    .then(r => r.ok ? r.json() : Promise.reject())
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
      li.innerHTML = `<strong>${c.fecha}</strong> – ${c.comentario}
        <div class="text-muted small">Por: ${c.coordinador || 'Coordinador'}</div>`;
      ul.appendChild(li);
    });
  }
}

// 4) Preparar modal de nuevo comentario y poblar select de trayectorias
function prepararNuevoComentario(profesorId, profesorNombre) {
  const form = document.querySelector('#modalNuevoComentario form');
  form.dataset.profesorId = profesorId;
  document.getElementById('modalNuevoComentarioLabel').textContent =
    `Agregar Comentario – ${profesorNombre}`;
  document.getElementById('comentario').value = '';

  // Poblar select de trayectorias
  fetchWithAuth(`/api/profesores/${profesorId}/asignaturas`)
    .then(r => r.ok ? r.json() : Promise.reject())
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

// 5) Guardar el nuevo comentario usando trayectoria y puntuación
function guardarComentario() {
  const form = document.querySelector('#modalNuevoComentario form');
  const profesorId = form.dataset.profesorId;
  const trayectoriaId = document.getElementById('selectTrayectoria').value;
  const puntuacion   = Number(document.getElementById('puntuacion').value);
  const comentario   = document.getElementById('comentario').value.trim();

  if (!trayectoriaId || isNaN(puntuacion) || !comentario) {
    alert('Completa todos los campos obligatorios');
    return;
  }

  fetchWithAuth('/api/evaluaciones', {
    method: 'POST',
    body: JSON.stringify({
      trayectoriaAsignatura: trayectoriaId,
      evaluador: getUserId(),
      puntuacion,
      comentario
    })
  })
    .then(r => r.ok ? r.json() : Promise.reject('Error al guardar'))
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

// 6) Asignar profesor (igual que antes)
function asignarProfesor() {
  const profesorId   = document.getElementById('selectProfesor').value;
  const coordinadorId = getUserId();
  fetchWithAuth(`/api/coordinadores/${coordinadorId}/profesores`, {
    method: 'POST',
    body: JSON.stringify({ profesor_id: profesorId })
  })
    .then(r => r.ok ? r.json() : Promise.reject())
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

// 7) Conectar botones y exponer funciones
function setupEventListeners() {
  document.querySelector('#modalNuevoComentario .btn-primary')
          .addEventListener('click', guardarComentario);
  document.querySelector('#modalAsignarProfesor .btn-primary')
          .addEventListener('click', asignarProfesor);
  window.verHistorialComentarios   = verHistorialComentarios;
  window.prepararNuevoComentario   = prepararNuevoComentario;
}
