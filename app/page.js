'use client';

import { useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { calcularResultados } from '../utils/awsFormulas';
import Footer from './Footer';
import Header from './Header';
import WhatsAppButton from './WhatsAppButton';
import WeldSimulation from './WeldSimulation';


export default function CalculadoraUT() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  const [inputs, setInputs] = useState({
    espesor: 50,
    profundidad: 35,
    longitud: 25,
    angulo: 70,
    pierna: 2, // 1, 2 o 3
    nivelB: 54,
    nivelA: 65,
    grooveType: 'singleV',
  });

  const [resultados, setResultados] = useState({
    profAparente: 0,
    sp: 0,
    x: 0,
    c: 0,
    d: 0,
    clase: '',
    veredicto: '',
    tipoDefecto: '',
    error: '',
  });

  const [weldOffset, setWeldOffset] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setInputs((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (name === 'grooveType' ? value : Number(value)),
    }));
  };

  useEffect(() => {
    calcular();
  }, [inputs, lang]);

  const calcular = () => {
    const nuevosResultados = calcularResultados(inputs, t);
    setResultados(nuevosResultados);
  };

  const isRejected = resultados.veredicto === t.rejected;

  // Lógica dinámica para el tipo de defecto según posición X (weldOffset) y profundidad
  let tipoDefectoDinamico = resultados.tipoDefecto;
  if (resultados.sp > 0 && !resultados.error) {
    const thickness = inputs.espesor || 50;
    const angleRad = (inputs.angulo || 70) * (Math.PI / 180);
    const leg = inputs.pierna || 1;
    let remainingSP = resultados.sp;
    let depth = 0;
    
    for (let i = 0; i < leg; i++) {
      const maxLegSP = thickness / Math.cos(angleRad);
      if (remainingSP <= maxLegSP) {
        depth = i % 2 === 0 ? remainingSP * Math.cos(angleRad) : thickness - (remainingSP * Math.cos(angleRad));
        break;
      } else {
        remainingSP -= maxLegSP;
      }
    }

    // Cálculos estándar basados en AWS según tipo de junta y espesor
    const rootOpening = thickness <= 10 ? 2 : (thickness <= 20 ? 3 : 4);
    let grooveAngle = 60;
    if (inputs.grooveType === 'singleBevel' || inputs.grooveType === 'k') {
      grooveAngle = 45;
    }

    const rootHalf = rootOpening / 2;
    const tanBevel = Math.tan((grooveAngle / 2) * (Math.PI / 180));

    let isOutside = false;
    let isFusion = false;
    const absOffset = Math.abs(weldOffset);
    const flawPos = -weldOffset; // Posición horizontal real de la falla

    if (inputs.grooveType === 'singleV') {
      const hw = rootHalf + ((thickness - depth) * tanBevel);
      if (absOffset > hw) isOutside = true;
      else if (absOffset >= hw - 2 && depth >= 3 && depth <= thickness - 3) isFusion = true;
    } else if (inputs.grooveType === 'doubleV') {
      const halfT = thickness / 2;
      const hw = depth <= halfT ? rootHalf + ((halfT - depth) * tanBevel) : rootHalf + ((depth - halfT) * tanBevel);
      if (absOffset > hw) isOutside = true;
      else if (absOffset >= hw - 2 && depth >= 3 && depth <= thickness - 3) isFusion = true;
    } else if (inputs.grooveType === 'singleBevel') {
      const tanSingle = Math.tan(grooveAngle * (Math.PI / 180));
      const leftEdge = -rootHalf;
      const rightEdge = rootHalf + (thickness - depth) * tanSingle;
      if (flawPos < leftEdge || flawPos > rightEdge) {
        isOutside = true;
      } else if (flawPos <= leftEdge + 2 || flawPos >= rightEdge - 2) {
        if (depth >= 3 && depth <= thickness - 3) isFusion = true;
      }
    } else if (inputs.grooveType === 'k') {
      const halfT = thickness / 2;
      const tanSingle = Math.tan(grooveAngle * (Math.PI / 180));
      const leftEdge = -rootHalf;
      const rightEdge = depth <= halfT 
        ? rootHalf + ((halfT - depth) * tanSingle) 
        : rootHalf + ((depth - halfT) * tanSingle);
        
      if (flawPos < leftEdge || flawPos > rightEdge) {
        isOutside = true;
      } else if (flawPos <= leftEdge + 2 || flawPos >= rightEdge - 2) {
        if (depth >= 3 && depth <= thickness - 3) isFusion = true;
      }
    }

    if (resultados.veredicto === t.accepted) {
      tipoDefectoDinamico = t.defectAccepted.replace('{class}', resultados.clase);
    } else if (isOutside) {
      tipoDefectoDinamico = t.defectBaseMaterial;
    } else if (isFusion) {
      tipoDefectoDinamico = t.defectFusion;
    } else {
      tipoDefectoDinamico = depth < 3 ? t.defectSurface : (depth > thickness - 3 ? t.defectRoot : t.defectVolume);
    }
  }

  return (
    <div className="min-h-screen bg-slate-200 py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center justify-center relative">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        <Header t={t} lang={lang} setLang={setLang} />

        <main className="flex flex-col lg:flex-row">
          
          {/* Panel Izquierdo: Formularios */}
          <section aria-label="Input Forms" className="flex-1 p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Sección 1: Geometría */}
              <fieldset>
                <legend className="text-lg w-full font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex justify-between items-center">
                  {t.geometry}
                </legend>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="grooveType" className="block text-sm font-semibold text-slate-700 mb-1">{t.grooveTypeLabel}</label>
                      <select id="grooveType" name="grooveType" value={inputs.grooveType} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors">
                        <option value="singleV">{t.optSingleV}</option>
                        <option value="doubleV">{t.optDoubleV}</option>
                        <option value="singleBevel">{t.optSingleBevel}</option>
                        <option value="k">{t.optK}</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="espesor" className="block text-sm font-semibold text-slate-700 mb-1">{t.thickness}</label>
                      <input type="number" id="espesor" name="espesor" value={inputs.espesor} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                    </div>
                    <div>
                      <label htmlFor="profundidad" className="block text-sm font-semibold text-slate-700 mb-1">{t.depth}</label>
                      <input type="number" id="profundidad" name="profundidad" value={inputs.profundidad} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="longitud" className="block text-sm font-semibold text-slate-700 mb-1">{t.length}</label>
                      <input type="number" id="longitud" name="longitud" value={inputs.longitud} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Sección 2: Ultrasonido */}
              <fieldset>
                <legend className="text-lg w-full font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  {t.equipment}
                </legend>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="angulo" className="block text-sm font-semibold text-slate-700 mb-1">{t.angle}</label>
                      <select id="angulo" name="angulo" value={inputs.angulo} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors">
                        <option value={70}>70°</option>
                        <option value={60}>60°</option>
                        <option value={45}>45°</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="pierna" className="block text-sm font-semibold text-slate-700 mb-1">{t.leg}</label>
                      <select id="pierna" name="pierna" value={inputs.pierna} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors">
                        <option value={1}>{t.leg1}</option>
                        <option value={2}>{t.leg2}</option>
                        <option value={3}>{t.leg3}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nivelB" className="block text-sm font-semibold text-slate-700 mb-1">{t.refB}</label>
                      <input type="number" id="nivelB" name="nivelB" value={inputs.nivelB} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                    </div>
                    <div>
                      <label htmlFor="nivelA" className="block text-sm font-semibold text-slate-700 mb-1">{t.indA}</label>
                      <input type="number" id="nivelA" name="nivelA" value={inputs.nivelA} onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
          </section>

          {/* Panel Derecho: Dashboard de Resultados */}
          <section aria-label="Results Dashboard" className="w-full lg:w-96 bg-slate-800 p-6 lg:p-8 flex flex-col justify-center text-white border-t lg:border-t-0 lg:border-l border-slate-700 shadow-inner">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 border-b border-slate-700 pb-2">
              {t.results}
            </h2>
            
            {resultados.error ? (
              <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 rounded text-sm">
                <span className="font-bold block mb-1">{t.error}</span>
                {resultados.error}
              </div>
            ) : (
              <div className="space-y-6 flex-1">
                
                {/* Datos de cálculo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <span className="block text-xs text-slate-300 mb-1">{t.path}</span>
                    <span className="font-mono text-xl">{resultados.sp} <span className="text-xs text-slate-400">mm</span></span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <span className="block text-xs text-slate-300 mb-1">{t.proj}</span>
                    <span className="font-mono text-xl">{resultados.sp > 0 ? (Number(resultados.x) + weldOffset).toFixed(1) : 0} <span className="text-xs text-slate-400">mm</span></span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <span className="block text-xs text-slate-300 mb-1">{t.attenuation}</span>
                    <span className="font-mono text-xl">{resultados.c} <span className="text-xs text-slate-400">dB</span></span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-blue-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-full"></div>
                    <span className="block text-xs text-blue-200 font-bold mb-1">{t.rating}</span>
                    <span className="font-mono text-2xl text-white">{resultados.d} <span className="text-sm text-blue-200">dB</span></span>
                  </div>
                </div>

                {/* Tipo de Defecto Estimado */}
                <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                  <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t.defectTypeLabel}</h3>
                  <p className="text-sm text-slate-200">{tipoDefectoDinamico}</p>
                </div>

                {/* Veredicto */}
                <div className="pt-6 border-t border-slate-700 mt-auto">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-slate-300 text-sm">{t.classAssigned}</span>
                    <span className="text-3xl font-black text-slate-200">
                      {resultados.clase}
                    </span>
                  </div>
                  
                  <div className={`w-full text-center py-4 rounded-lg font-bold text-xl tracking-wide uppercase transition-colors shadow-lg
                    ${isRejected 
                      ? 'bg-red-600 text-white shadow-red-900/50' 
                      : 'bg-emerald-500 text-slate-900 shadow-emerald-900/50'}`}>
                    {resultados.veredicto}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Simulación Gráfica */}
        <WeldSimulation inputs={inputs} resultados={resultados} t={t} weldOffset={weldOffset} setWeldOffset={setWeldOffset} />

      </div>
      
      <Footer t={t} />

      <WhatsAppButton />
    </div>
  );
}