import { useState } from 'react';

export default function WeldSimulation({ inputs, resultados, t, weldOffset, setWeldOffset }) {

  const thickness = Number(inputs.espesor) || 50;
  const angle = Number(inputs.angulo) || 70;
  const leg = Number(inputs.pierna) || 1;
  const sp = Number(resultados.sp) || 0;
  const autoX = Number(resultados.x) || 0;
  const pcs = autoX + weldOffset;

  // Calculamos los extremos relativos al centro de la soldadura
  const minP = Math.min(-pcs, -weldOffset, 0);
  const maxP = Math.max(-pcs, -weldOffset, 0);
  const spread = maxP - minP;

  // Escala dinámica para que el dibujo quepa siempre en la pantalla
  const maxThicknessPx = 150;
  const maxSpreadPx = 800; // Margen horizontal seguro dentro del viewBox
  const scale = Math.min(
    maxThicknessPx / Math.max(thickness, 1),
    maxSpreadPx / Math.max(spread, 1),
    4
  );
  const T = thickness * scale;

  const probeY = 50;  // Margen superior

  // Calculamos el centro de la soldadura dinámicamente para centrar todo el dibujo
  const weldCenterX = 500 - ((minP + maxP) / 2) * scale;
  const probeX = weldCenterX - (pcs * scale); // El transductor se mueve dinámicamente

  // Cálculos de los puntos de rebote del haz ultrasónico
  let currentSP = sp * scale;
  let currentX = probeX;
  let currentY = probeY;
  let currentAngleRad = angle * (Math.PI / 180);
  let isMovingDown = true;

  const pathPoints = [`${currentX},${currentY}`];
  let remainingSP = currentSP;

  for (let i = 0; i < leg; i++) {
    const distToSurface = T;
    const maxLegSP = distToSurface / Math.cos(currentAngleRad);

    if (remainingSP <= maxLegSP) {
      // La falla ocurre en esta pierna (termina el haz)
      currentX += remainingSP * Math.sin(currentAngleRad);
      currentY += isMovingDown ? remainingSP * Math.cos(currentAngleRad) : -remainingSP * Math.cos(currentAngleRad);
      pathPoints.push(`${currentX},${currentY}`);
      break;
    } else {
      // El haz rebota en la superficie
      currentX += maxLegSP * Math.sin(currentAngleRad);
      currentY = isMovingDown ? probeY + T : probeY;
      pathPoints.push(`${currentX},${currentY}`);
      remainingSP -= maxLegSP;
      isMovingDown = !isMovingDown;
    }
  }

  const flawX = currentX;
  const flawY = currentY;

  // Geometría y recomendación automática predefinida por espesor
  const grooveType = inputs.grooveType || 'singleV';
  const rootOpening = thickness <= 10 ? 2 : (thickness <= 20 ? 3 : 4);
  
  let grooveAngle = 60;
  if (grooveType === 'singleBevel' || grooveType === 'k') {
    grooveAngle = 45;
  }
  
  const rootHalf = (rootOpening / 2) * scale;
  const tanBevel = Math.tan((grooveAngle / 2) * (Math.PI / 180));
  const tanSingle = Math.tan(grooveAngle * (Math.PI / 180));

  let weldPath = "";
  let grooveRecText = "";

  if (grooveType === 'singleV') {
    const topHW = rootHalf + (thickness * tanBevel) * scale;
    weldPath = `M ${weldCenterX - topHW},${probeY} L ${weldCenterX - rootHalf},${probeY + T} L ${weldCenterX + rootHalf},${probeY + T} L ${weldCenterX + topHW},${probeY} Z`;
    grooveRecText = t.grooveSingleV;
  } else if (grooveType === 'doubleV') {
    const topHW = rootHalf + ((thickness / 2) * tanBevel) * scale;
    weldPath = `M ${weldCenterX - topHW},${probeY} L ${weldCenterX - rootHalf},${probeY + T/2} L ${weldCenterX - topHW},${probeY + T} L ${weldCenterX + topHW},${probeY + T} L ${weldCenterX + rootHalf},${probeY + T/2} L ${weldCenterX + topHW},${probeY} Z`;
    grooveRecText = t.grooveDoubleV;
  } else if (grooveType === 'singleBevel') {
    const straightX = weldCenterX - rootHalf;
    const botRightX = weldCenterX + rootHalf;
    const topRightX = weldCenterX + rootHalf + (thickness * tanSingle) * scale;
    weldPath = `M ${straightX},${probeY} L ${straightX},${probeY + T} L ${botRightX},${probeY + T} L ${topRightX},${probeY} Z`;
    grooveRecText = t.grooveSingleBevel;
  } else if (grooveType === 'k') {
    const straightX = weldCenterX - rootHalf;
    const rightMidX = weldCenterX + rootHalf;
    const rightTopBotX = weldCenterX + rootHalf + ((thickness / 2) * tanSingle) * scale;
    weldPath = `M ${straightX},${probeY} L ${straightX},${probeY + T} L ${rightTopBotX},${probeY + T} L ${rightMidX},${probeY + T/2} L ${rightTopBotX},${probeY} Z`;
    grooveRecText = t.grooveK;
  }

  return (
    <section className="w-full bg-slate-900 border-t-4 border-slate-700 p-6 flex flex-col items-center">
      <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2 self-start">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {t.simulationTitle}
      </h2>

      <div className="relative w-full max-w-4xl bg-slate-800 rounded-lg shadow-inner border border-slate-700 overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes dash { to { stroke-dashoffset: -20; } }
          .anim-beam { animation: dash 1s linear infinite; }
        `}} />
        <svg viewBox="0 0 1000 280" className="w-full h-auto drop-shadow-2xl">
          <defs>
            <linearGradient id="weldGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          {/* Placa de Acero */}
          <rect x="-1000" y={probeY} width="3000" height={T} fill="#334155" />
          {/* Bisel de Soldadura Dinámico (Cuadrada, V Simple o Doble V) */}
          {sp > 0 && <path d={weldPath} fill="url(#weldGrad)" />}
          {/* Línea Central (Raíz) */}
          {sp > 0 && <line x1={weldCenterX} y1={probeY} x2={weldCenterX} y2={probeY + T} stroke="#1e293b" strokeWidth="2" strokeDasharray="5 3" />}
          {/* Haz Ultrasónico (Sound Path) */}
          {sp > 0 && <polyline points={pathPoints.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 4" className="anim-beam" />}
          {/* Palpador */}
          <g transform={`translate(${probeX}, ${probeY})`}>
            <rect x="-20" y="-28" width="40" height="28" fill="#3b82f6" rx="3" />
            <rect x="-10" y="-38" width="20" height="10" fill="#1d4ed8" rx="2" />
          </g>
          {/* Indicación / Defecto encontrada */}
          {sp > 0 && (
            <g transform={`translate(${flawX}, ${flawY})`}>
              <circle cx="0" cy="0" r="10" fill="#ef4444" className="animate-ping opacity-75" />
              <circle cx="0" cy="0" r="5" fill="#ef4444" />
            </g>
          )}
        </svg>
      </div>
      {/* Leyenda Visual */}
      <div className="flex flex-wrap justify-center gap-6 mt-5 text-sm font-semibold text-slate-400">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded border border-blue-700"></div> {t.probe}</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-500 rounded-full"></div> {t.beam}</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]"></div> {t.defect}</div>
      </div>

      {/* Controles del Simulador */}
      <div className="mt-6 w-full max-w-4xl bg-slate-800 rounded-lg border border-slate-700 p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          <label htmlFor="weldOffset" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            {t.weldOffset}: <span className="text-blue-400">{weldOffset > 0 ? '+' : ''}{weldOffset} mm</span>
          </label>
          <input type="range" id="weldOffset" min="-40" max="40" step="1" value={weldOffset} onChange={(e) => setWeldOffset(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>
        <div className="bg-slate-900 px-6 py-3 rounded border border-slate-700 text-center w-full sm:w-auto sm:min-w-[200px]">
          <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{t.pcs}</span>
          <span className="font-mono text-2xl text-blue-400 font-black">{pcs.toFixed(1)} <span className="text-sm text-slate-500 font-sans">mm</span></span>
        </div>
      </div>

      {/* Recomendación de Ranura Normativa */}
      <div className="mt-6 w-full max-w-4xl bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-blue-400 font-bold text-sm mb-1 uppercase tracking-wide">{t.grooveRecTitle}</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{grooveRecText}</p>
      </div>
    </section>
  );
}