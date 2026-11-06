/**
 * Módulo de Métodos Numéricos para EDO
 * Desafío: Modelado de ocupación de un refugio de mascotas
 * EDO: dy/dt = a - k*y, con y(0) = y0
 */

export const EDOSolver = {
  /**
   * Función f(t, y) de la EDO dy/dt = a - k*y
   */
  f(t, y, { a, k }) {
    return a - k * y;
  },

  /**
   * Valor de equilibrio asíntotico (t -> infinito): y_eq = a / k
   */
  equilibrium({ a, k }) {
    if (k <= 0) return null;
    return a / k;
  },

  /**
   * Solución analítica exacta: y(t) = a/k + (y0 - a/k) * exp(-k*t)
   */
  exact(t, { y0, a, k }) {
    const eq = a / k;
    return eq + (y0 - eq) * Math.exp(-k * t);
  },

  /**
   * Derivada exacta dy/dt en el instante t: y'(t) = -k * (y0 - a/k) * exp(-k*t)
   */
  exactDerivative(t, { y0, a, k }) {
    const eq = a / k;
    return -k * (y0 - eq) * Math.exp(-k * t);
  },

  /**
   * Tiempo analítico exacto para alcanzar la meta M:
   * M = a/k + (y0 - a/k)*exp(-k*t)  =>  t = (1/k) * ln((y0 - a/k)/(M - a/k))
   */
  timeToTarget({ y0, a, k }, target) {
    if (k <= 0) return null;
    const eq = a / k;
    
    // Si ya está exactamente en la meta al inicio
    if (Math.abs(y0 - target) < 1e-9) return 0;
    
    // Si la meta está en la dirección opuesta al equilibrio o fuera del rango asintótico
    const num = y0 - eq;
    const den = target - eq;
    
    if (Math.abs(den) < 1e-9) {
      // La meta es exactamente el equilibrio asíntotico: se alcanza formalmente en infinito
      return null;
    }
    
    const ratio = num / den;
    // Para que t >= 0, ratio debe ser >= 1 (es decir, target debe estar entre y0 y eq)
    if (ratio > 1) {
      return Math.log(ratio) / k;
    }
    
    return null;
  },

  /**
   * Estimación numérica del cruce por interpolación lineal en la serie simulada
   */
  findNumericCrossing(steps, target) {
    if (!steps || steps.length < 2) return null;
    if (Math.abs(steps[0].y - target) < 1e-6) return steps[0].t;

    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1];
      const curr = steps[i];
      const u = prev.y - target;
      const v = curr.y - target;
      
      if (u * v <= 0 && u !== v) {
        // Interpolación lineal entre (prev.t, prev.y) y (curr.t, curr.y)
        const tInterp = prev.t + (curr.t - prev.t) * (Math.abs(u) / (Math.abs(u) + Math.abs(v)));
        return tInterp;
      }
    }
    return null;
  },

  /**
   * Método de Heun (Runge-Kutta de orden 2, Predictor-Corrector)
   * Predictor (Euler): y_pred = y_i + h * f(t_i, y_i)
   * Corrector: y_(i+1) = y_i + (h/2) * [ f(t_i, y_i) + f(t_i + h, y_pred) ]
   */
  solveHeun(params, h) {
    const n = Math.round(params.T / h);
    const steps = [];
    let currentY = params.y0;

    for (let i = 0; i <= n; i++) {
      const t = i * h;
      const exactY = this.exact(t, params);
      const errAbs = Math.abs(exactY - currentY);
      const errRel = exactY !== 0 ? (errAbs / Math.abs(exactY)) * 100 : null;

      const f_i = this.f(t, currentY, params);
      const y_pred = currentY + h * f_i;
      const t_next = t + h;
      const f_pred = this.f(t_next, y_pred, params);
      const nextY = currentY + (h / 2) * (f_i + f_pred);

      steps.push({
        i,
        t,
        y: currentY,
        f_i,
        y_pred,
        f_pred,
        nextY,
        exactY,
        errAbs,
        errRel
      });

      currentY = nextY;
    }

    return steps;
  },

  /**
   * Método de Runge-Kutta de 4to Orden (Clásico, RK4)
   * k1 = f(t_i, y_i)
   * k2 = f(t_i + h/2, y_i + (h/2)*k1)
   * k3 = f(t_i + h/2, y_i + (h/2)*k2)
   * k4 = f(t_i + h, y_i + h*k3)
   * y_(i+1) = y_i + (h/6) * (k1 + 2*k2 + 2*k3 + k4)
   */
  solveRK4(params, h) {
    const n = Math.round(params.T / h);
    const steps = [];
    let currentY = params.y0;

    for (let i = 0; i <= n; i++) {
      const t = i * h;
      const exactY = this.exact(t, params);
      const errAbs = Math.abs(exactY - currentY);
      const errRel = exactY !== 0 ? (errAbs / Math.abs(exactY)) * 100 : null;

      const k1 = this.f(t, currentY, params);
      const k2 = this.f(t + h / 2, currentY + (h / 2) * k1, params);
      const k3 = this.f(t + h / 2, currentY + (h / 2) * k2, params);
      const k4 = this.f(t + h, currentY + h * k3, params);
      const phi = (k1 + 2 * k2 + 2 * k3 + k4) / 6;
      const nextY = currentY + h * phi;

      steps.push({
        i,
        t,
        y: currentY,
        k1,
        k2,
        k3,
        k4,
        phi,
        nextY,
        exactY,
        errAbs,
        errRel
      });

      currentY = nextY;
    }

    return steps;
  },

  /**
   * Ejecuta simulación completa con ambos métodos
   */
  runFullSimulation(params) {
    const h = params.h;
    const heunSteps = this.solveHeun(params, h);
    const rk4Steps = this.solveRK4(params, h);

    const maxErrHeun = Math.max(...heunSteps.map(s => s.errAbs));
    const maxErrRK4 = Math.max(...rk4Steps.map(s => s.errAbs));
    const maxRelErrHeun = Math.max(...heunSteps.map(s => s.errRel || 0));
    const maxRelErrRK4 = Math.max(...rk4Steps.map(s => s.errRel || 0));

    const eq = this.equilibrium(params);
    const tExactMeta = this.timeToTarget(params, params.meta);
    const tHeunMeta = this.findNumericCrossing(heunSteps, params.meta);
    const tRK4Meta = this.findNumericCrossing(rk4Steps, params.meta);

    const winner = maxErrRK4 <= maxErrHeun ? 'RK4' : 'Heun';
    const accuracyRatio = maxErrRK4 > 0 ? maxErrHeun / maxErrRK4 : Infinity;

    return {
      params,
      heunSteps,
      rk4Steps,
      maxErrHeun,
      maxErrRK4,
      maxRelErrHeun,
      maxRelErrRK4,
      eq,
      tExactMeta,
      tHeunMeta,
      tRK4Meta,
      winner,
      accuracyRatio
    };
  },

  /**
   * Análisis comparativo para múltiples tamaños de paso (2h, h, h/2)
   * Demuestra experimentalmente el orden de convergencia O(h^2) vs O(h^4)
   */
  analyzeConvergence(params) {
    const baseH = params.h;
    const testSteps = [2 * baseH, baseH, baseH / 2].filter(h => h > 0 && h <= params.T && params.T / h <= 2500);

    const results = testSteps.map(h => {
      const hSteps = this.solveHeun(params, h);
      const rSteps = this.solveRK4(params, h);

      return {
        h,
        stepsCount: hSteps.length - 1,
        maxErrHeun: Math.max(...hSteps.map(s => s.errAbs)),
        maxErrRK4: Math.max(...rSteps.map(s => s.errAbs)),
        maxRelErrHeun: Math.max(...hSteps.map(s => s.errRel || 0)),
        maxRelErrRK4: Math.max(...rSteps.map(s => s.errRel || 0))
      };
    });

    // Calcular ratios experimentales entre pasos consecutivos
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      curr.ratioHeun = curr.maxErrHeun > 0 ? prev.maxErrHeun / curr.maxErrHeun : null;
      curr.ratioRK4 = curr.maxErrRK4 > 0 ? prev.maxErrRK4 / curr.maxErrRK4 : null;
    }

    return results;
  },

  /**
   * Verificación formal por sustitución de la solución analítica
   */
  verifyAnalyticSolution(params, testT = null) {
    const t = testT !== null ? testT : params.T / 2;
    const y0_check = this.exact(0, params);
    const diff_y0 = Math.abs(y0_check - params.y0);

    const y_t = this.exact(t, params);
    const dy_dt = this.exactDerivative(t, params);
    const rhs = this.f(t, y_t, params);
    const residual = Math.abs(dy_dt - rhs);

    return {
      t,
      y0_check,
      diff_y0,
      y_t,
      dy_dt,
      rhs,
      residual,
      isValid: diff_y0 < 1e-10 && residual < 1e-10
    };
  }
};

