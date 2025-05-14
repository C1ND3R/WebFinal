// public/js/reportes.js

// 1) Debug: confirmar que el archivo se carga
console.log('reportes.js cargado');

(function() {
  // 2) Obtener referencias
  const selProf = document.getElementById('filtroProfesor');
  const selAsig = document.getElementById('filtroAsignatura');
  const btnGen  = document.getElementById('btnGenerarReporte');
  const tbody   = document.getElementById('cuerpoReportes');

  console.log('Referencias:', {
    selProf: !!selProf,
    selAsig: !!selAsig,
    btnGen:  !!btnGen,
    tbody:   !!tbody
  });

  // 3) Función genérica para poblar selects
  function poblarSelectAuth(url, selectElem, textProp) {
    fetchWithAuth(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        selectElem.innerHTML = '<option value="">Todos</option>';
        data.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item._id;
          opt.textContent = textProp === 'usuario'
            ? (item.usuario?.nombre_completo || '— sin nombre —')
            : item[textProp];
          selectElem.appendChild(opt);
        });
        console.log(`✅ Select ${selectElem.id} poblado con ${data.length} items`);
      })
      .catch(err => {
        console.error(`❌ Error cargando ${url}:`, err);
        alert(`No se pudieron cargar los datos de ${url.split('/').pop()}.`);
      });
  }

  // 4) Poblar dropdowns
  poblarSelectAuth('/api/profesores', selProf, 'usuario');
  poblarSelectAuth('/api/asignaturas', selAsig, 'nombre');

  // 5) Enganchar el botón y confirmar
  if (btnGen) {
    console.log('🖱️ Enganchando click en Generar Reporte');
    btnGen.addEventListener('click', () => {
      console.log('🖱️ Click en Generar Reporte capturado');
      const params = new URLSearchParams({
        profesor:    selProf.value,
        asignatura:  selAsig.value,
        fechaInicio: document.getElementById('fechaInicio').value,
        fechaFin:    document.getElementById('fechaFin').value,
      }).toString();
      console.log(' → Parámetros:', params);

      fetchWithAuth(`/api/reportes?${params}`)
        .then(res => {
          console.log(' ← /api/reportes status', res.status);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(reportes => {
          console.log(' ← reportes devueltos:', reportes);
          tbody.innerHTML = '';
          if (!Array.isArray(reportes)) {
            console.error('⚠️ Respuesta no es arreglo:', reportes);
            return alert('Formato inesperado de respuesta de reportes.');
          }
          reportes.forEach(rp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${rp.id}</td>
              <td>${rp.titulo}</td>
              <td>${rp.descripcion}</td>
              <td>${new Date(rp.createdAt).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
          });
        })
        .catch(err => {
          console.error('❌ Error al generar reportes:', err);
          alert('Error al generar el reporte');
        });
    });
  } else {
    console.error('🚨 No se encontró el botón #btnGenerarReporte');
  }
})();

