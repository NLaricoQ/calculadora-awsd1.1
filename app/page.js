'use client';

import { useState, useEffect } from 'react';

export default function CalculadoraUT() {
  const [inputs, setInputs] = useState({
    espesor: 50,
    profundidad: 35,
    longitud: 25,
    angulo: 70,
    pierna: 2, // 1, 2 o 3
    nivelB: 54,
    nivelA: 65,
  });

  const [resultados, setResultados] = useState({
    profAparente: 0,
    sp: 0,
    x: 0,
    c: 0,
    d: 0,
    clase: '',
    veredicto: '',
    error: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  useEffect(() => {
    calcular();
  }, [inputs]);

  const calcular = () => {
    const { espesor, profundidad, longitud, angulo, pierna, nivelB, nivelA } = inputs;
    let errorMsg = '';

    // Validaciones AWS para ángulos y espesores menores
    if (espesor <= 38 && (angulo === 60 || angulo === 45)) {
      errorMsg = 'AWS D1.1 no define criterios para este ángulo en espesores menores o iguales a 38 mm.';
    }

    // Validación física básica (la profundidad no puede ser mayor al espesor)
    if (profundidad > espesor) {
      errorMsg = 'La profundidad real de la falla no puede ser mayor al espesor de la junta.';
    }

    // Cálculo de Profundidad Aparente según la Pierna (Leg)
    let profAparente = 0;
    if (pierna === 1) {
      profAparente = profundidad;
    } else if (pierna === 2) {
      profAparente = (2 * espesor) - profundidad;
    } else if (pierna === 3) {
      profAparente = (2 * espesor) + profundidad;
    }

    // Geometría del haz
    const rad = angulo * (Math.PI / 180);
    const sp = profAparente / Math.cos(rad);
    const x = sp * Math.sin(rad);

    // Factor de Atenuación (c)
    let c = Math.round(2 * ((sp / 25.4) - 1));
    if (c < 0) c = 0;

    // Rating (d)
    const d = nivelA - nivelB - c;

    // Lógica AWS D1.1 Tabla 8.2
    let clase = '';
    let veredicto = '';

    if (!errorMsg) {
      clase = evaluarClase(espesor, angulo, d);
      if (!clase) {
        errorMsg = 'Fuera del rango de la Tabla 8.2 de AWS D1.1';
      } else {
        veredicto = evaluarAceptacion(clase, longitud);
      }
    }

    setResultados({
      profAparente: profAparente.toFixed(1),
      sp: sp.toFixed(1),
      x: x.toFixed(1),
      c,
      d,
      clase,
      veredicto,
      error: errorMsg,
    });
  };

  const evaluarClase = (t, ang, d) => {
    if (t >= 8 && t <= 20) {
      if (ang === 70) {
        if (d <= 5) return 'A';
        if (d === 6) return 'B';
        if (d === 7) return 'C';
        if (d >= 8) return 'D';
      }
    } else if (t > 20 && t <= 38) {
      if (ang === 70) {
        if (d <= 2) return 'A';
        if (d === 3) return 'B';
        if (d === 4) return 'C';
        if (d >= 5) return 'D';
      }
    } else if (t > 38 && t <= 65) {
      if (ang === 70) {
        if (d <= -2) return 'A';
        if (d >= -1 && d <= 0) return 'B';
        if (d >= 1 && d <= 2) return 'C';
        if (d >= 3) return 'D';
      }
      if (ang === 60) {
        if (d <= 1) return 'A';
        if (d >= 2 && d <= 3) return 'B';
        if (d >= 4 && d <= 5) return 'C';
        if (d >= 6) return 'D';
      }
      if (ang === 45) {
        if (d <= 3) return 'A';
        if (d >= 4 && d <= 5) return 'B';
        if (d >= 6 && d <= 7) return 'C';
        if (d >= 8) return 'D';
      }
    } else if (t > 65 && t <= 100) {
      if (ang === 70) {
        if (d <= -5) return 'A';
        if (d >= -4 && d <= -3) return 'B';
        if (d >= -2 && d <= 2) return 'C';
        if (d >= 3) return 'D';
      }
      if (ang === 60) {
        if (d <= -2) return 'A';
        if (d >= -1 && d <= 0) return 'B';
        if (d >= 1 && d <= 2) return 'C';
        if (d >= 3) return 'D';
      }
      if (ang === 45) {
        if (d <= 0) return 'A';
        if (d >= 1 && d <= 2) return 'B';
        if (d >= 3 && d <= 4) return 'C';
        if (d >= 5) return 'D';
      }
    } else if (t > 100 && t <= 200) {
      if (ang === 70) {
        if (d <= -7) return 'A';
        if (d >= -6 && d <= -5) return 'B';
        if (d >= -4 && d <= 2) return 'C';
        if (d >= 3) return 'D';
      }
      if (ang === 60) {
        if (d <= -4) return 'A';
        if (d >= -3 && d <= -2) return 'B';
        if (d >= -1 && d <= 2) return 'C';
        if (d >= 3) return 'D';
      }
      if (ang === 45) {
        if (d <= -1) return 'A';
        if (d >= 0 && d <= 1) return 'B';
        if (d >= 2 && d <= 3) return 'C';
        if (d >= 4) return 'D';
      }
    }
    return null;
  };

  const evaluarAceptacion = (clase, l) => {
    if (clase === 'A') return 'RECHAZADO';
    if (clase === 'B') return l > 20 ? 'RECHAZADO' : 'ACEPTADO';
    if (clase === 'C') return l > 50 ? 'RECHAZADO' : 'ACEPTADO';
    if (clase === 'D') return 'ACEPTADO';
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-200 py-8 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Encabezado con Logo */}
        <header className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b-4 border-blue-600">
          <div className="flex items-center gap-4">
            {/* Contenedor del Logo: Fondo blanco para hacer resaltar el PNG transparente azul marino */}
            <div className="w-14 h-14 bg-white rounded shadow-inner flex items-center justify-center overflow-hidden border border-slate-300">
              <img 
                src="/logo.png" 
                alt="Logo Empresa" 
                className="w-full h-full object-contain p-1.5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-slate-400 text-[10px] font-bold">LOGO</span>';
                }}
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">Inspección UT</h1>
              <p className="text-slate-400 text-sm hidden sm:block">Calculadora D1.1 - Evaluación Multi-Pierna</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Norma AWS D1.1</span>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row">
          
          {/* Panel Izquierdo: Formularios */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Sección 1: Geometría */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex justify-between items-center">
                  Geometría de la Junta
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Espesor Total (mm)</label>
                    <input type="number" name="espesor" value={inputs.espesor} onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Profundidad Real (mm)</label>
                    <input type="number" name="profundidad" value={inputs.profundidad} onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Longitud de Falla (mm)</label>
                    <input type="number" name="longitud" value={inputs.longitud} onChange={handleInputChange} 
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Sección 2: Ultrasonido */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Parámetros del Equipo
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Ángulo</label>
                      <select name="angulo" value={inputs.angulo} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors">
                        <option value={70}>70°</option>
                        <option value={60}>60°</option>
                        <option value={45}>45°</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Pierna (Leg)</label>
                      <select name="pierna" value={inputs.pierna} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors">
                        <option value={1}>Leg I (1ra)</option>
                        <option value={2}>Leg II (2da)</option>
                        <option value={3}>Leg III (3ra)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Ref. 'b' (dB)</label>
                      <input type="number" name="nivelB" value={inputs.nivelB} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Indic. 'a' (dB)</label>
                      <input type="number" name="nivelA" value={inputs.nivelA} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Dashboard de Resultados */}
          <div className="w-full lg:w-95 bg-slate-800 p-6 lg:p-8 flex flex-col justify-center text-white border-t lg:border-t-0 lg:border-l border-slate-700 shadow-inner">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-700 pb-2">
              Panel de Resultados
            </h2>
            
            {resultados.error ? (
              <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 rounded text-sm">
                <span className="font-bold block mb-1">Error de Parámetros:</span>
                {resultados.error}
              </div>
            ) : (
              <div className="space-y-6 flex-1">
                
                {/* Datos de cálculo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <span className="block text-xs text-slate-400 mb-1">Recorrido (SP)</span>
                    <span className="font-mono text-xl">{resultados.sp} <span className="text-xs text-slate-500">mm</span></span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <span className="block text-xs text-slate-400 mb-1">Proyección (X)</span>
                    <span className="font-mono text-xl">{resultados.x} <span className="text-xs text-slate-500">mm</span></span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <span className="block text-xs text-slate-400 mb-1">Atenuación (c)</span>
                    <span className="font-mono text-xl">{resultados.c} <span className="text-xs text-slate-500">dB</span></span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-blue-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-full"></div>
                    <span className="block text-xs text-blue-300 font-bold mb-1">Rating (d)</span>
                    <span className="font-mono text-2xl text-white">{resultados.d} <span className="text-sm text-blue-200">dB</span></span>
                  </div>
                </div>

                {/* Veredicto */}
                <div className="pt-6 border-t border-slate-700 mt-auto">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-slate-400 text-sm">Clase asignada:</span>
                    <span className="text-3xl font-black text-slate-200">
                      {resultados.clase}
                    </span>
                  </div>
                  
                  <div className={`w-full text-center py-4 rounded-lg font-bold text-xl tracking-wide uppercase transition-colors shadow-lg
                    ${resultados.veredicto === 'RECHAZADO' 
                      ? 'bg-red-600 text-white shadow-red-900/50' 
                      : 'bg-emerald-500 text-slate-900 shadow-emerald-900/50'}`}>
                    {resultados.veredicto}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}