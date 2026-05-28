export const evaluarClase = (t, ang, d) => {
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

export const evaluarAceptacion = (clase, l, t) => {
  if (clase === 'A') return t.rejected;
  if (clase === 'B') return l > 20 ? t.rejected : t.accepted;
  if (clase === 'C') return l > 50 ? t.rejected : t.accepted;
  if (clase === 'D') return t.accepted;
  return '';
};

export const calcularResultados = (inputs, t) => {
  const { espesor, profundidad, longitud, angulo, pierna, nivelB, nivelA } = inputs;
  let errorMsg = '';

  if (espesor <= 38 && (angulo === 60 || angulo === 45)) {
    errorMsg = t.errAngle;
  }
  if (profundidad > espesor) {
    errorMsg = t.errDepth;
  }

  let profAparente = 0;
  if (pierna === 1) profAparente = profundidad;
  else if (pierna === 2) profAparente = (2 * espesor) - profundidad;
  else if (pierna === 3) profAparente = (2 * espesor) + profundidad;

  const rad = angulo * (Math.PI / 180);
  const sp = profAparente / Math.cos(rad);
  const x = sp * Math.sin(rad);

  let c = Math.round(2 * ((sp / 25.4) - 1));
  if (c < 0) c = 0;

  const d = nivelA - nivelB - c;

  let clase = '';
  let veredicto = '';
  let tipoDefecto = '';

  if (!errorMsg) {
    clase = evaluarClase(espesor, angulo, d);
    if (!clase) {
      errorMsg = t.errRange;
    } else {
      veredicto = evaluarAceptacion(clase, longitud, t);
      
      // Lógica para estimar el tipo de defecto geométrico
      if (profundidad <= 3) {
        tipoDefecto = t.defectSurface;
      } else if (espesor - profundidad <= 3) {
        tipoDefecto = t.defectRoot;
      } else {
        tipoDefecto = t.defectVolume;
      }
    }
  }

  return {
    profAparente: profAparente.toFixed(1),
    sp: sp.toFixed(1),
    x: x.toFixed(1),
    c,
    d,
    clase,
    veredicto,
    tipoDefecto,
    error: errorMsg,
  };
};