// public/js/reportes.js
document.addEventListener('DOMContentLoaded', () => {
  const selProf  = document.getElementById('filtroProfesor');
  const selAsig  = document.getElementById('filtroAsignatura');
  const btnGen   = document.getElementById('btnGenerarReporte');
  const tbody    = document.getElementById('cuerpoReportes');

  // Helper para poblar selects
  function poblarSelect(url, selectElem, textProp) {
    fetch(url, { headers: { 'Authorization': localStorage.getItem('token') || '' } })
      .then(r => r.json())
      .then(data => {
        data.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item._id;
          opt.textContent = item[textProp] || (item.usuario && item.usuario.nombre_completo);
          selectElem.appendChild(opt);
        });
      })
      .catch(console.error);
  }

  // Poblar dropdowns
  poblarSelect('/api/profesores', selProf, 'usuario');
  poblarSelect('/api/asignaturas', selAsig, 'nombre');

  // Al hacer click, pedimos reporte al servidor
  btnGen.addEventListener('click', () => {
    const params = new URLSearchParams({
      profesor:    selProf.value,
      asignatura:  selAsig.value,
      fechaInicio: document.getElementById('fechaInicio').value,
      fechaFin:    document.getElementById('fechaFin').value,
    });

    fetch(`/api/reportes?${params}`, {
      headers: { 'Authorization': localStorage.getItem('token') || '' }
    })
      .then(r => r.json())
      .then(reportes => {
        tbody.innerHTML = '';
        reportes.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${r.id}</td>
            <td>${r.titulo}</td>
            <td>${r.descripcion}</td>
            <td>${new Date(r.createdAt).toLocaleDateString()}</td>
          `;
          tbody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error(err);
        alert('Error al generar el reporte');
      });
  });
});
