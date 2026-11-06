/**
 * Módulo de Visualización con Chart.js
 * Gráficas de Evolución y Error Absoluto con estética Neumórfica/Moderna
 */

import { EDOSolver } from './edo-solver.js';

let chartEvolution = null;
let chartErrors = null;

export const EDOCharts = {
  /**
   * Obtiene la paleta de colores según las variables CSS activas
   */
  getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      isDark,
      grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      text: isDark ? '#94a3b8' : '#64748b',
      textStrong: isDark ? '#f1f5f9' : '#1e293b',
      exact: '#0d9488', // Teal
      exactBg: isDark ? 'rgba(13, 148, 136, 0.15)' : 'rgba(13, 148, 136, 0.08)',
      heun: '#ea580c', // Orange
      rk4: '#6366f1',  // Indigo
      meta: '#ec4899', // Pink
      eq: '#64748b'    // Slate
    };
  },

  /**
   * Renderiza o actualiza ambas gráficas
   */
  render(simulationData) {
    const { params, heunSteps, rk4Steps, eq, tExactMeta } = simulationData;
    const colors = this.getThemeColors();

    // 1. Gráfica de Evolución
    this.renderEvolutionChart(params, heunSteps, rk4Steps, eq, colors, tExactMeta);

    // 2. Gráfica de Errores Logarítmicos
    this.renderErrorsChart(params, heunSteps, rk4Steps, colors);
  },

  /**
   * Gráfica de Evolución y(t)
   */
  renderEvolutionChart(params, heunSteps, rk4Steps, eq, colors, tExactMeta) {
    const canvas = document.getElementById('chartEvolution');
    if (!canvas) return;

    const pointsCount = 200;
    // Curva analítica exacta activa
    const denseExact = [];
    for (let i = 0; i <= pointsCount; i++) {
      const t = (params.T * i) / pointsCount;
      denseExact.push({ x: t, y: EDOSolver.exact(t, params) });
    }

    // Curva de comparación directa (Normal vs Campaña)
    const isNormal = params.k <= 0.045;
    const kCompare = isNormal ? 0.06 : 0.04;
    const compareLabel = isNormal
      ? '⚡ Proyección con Campaña (+50% k=0.06)'
      : 'Referencia sin Campaña (Normal k=0.04)';
    const compareColor = isNormal ? '#8b5cf6' : '#06b6d4';

    const denseCompare = [];
    for (let i = 0; i <= pointsCount; i++) {
      const t = (params.T * i) / pointsCount;
      denseCompare.push({ x: t, y: EDOSolver.exact(t, { ...params, k: kCompare }) });
    }

    const heunPoints = heunSteps.map(s => ({ x: s.t, y: s.y }));
    const rk4Points = rk4Steps.map(s => ({ x: s.t, y: s.y }));

    const datasets = [
      {
        label: `Solución Actual (${params.k === 0.04 ? 'Normal' : params.k === 0.06 ? 'Campaña' : 'Personalizada'})`,
        data: denseExact,
        showLine: true,
        borderColor: colors.exact,
        backgroundColor: colors.exactBg,
        borderWidth: 3.5,
        pointRadius: 0,
        fill: false,
        tension: 0.1
      },
      {
        label: compareLabel,
        data: denseCompare,
        showLine: true,
        borderColor: compareColor,
        borderWidth: 2.2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        tension: 0.1
      },
      {
        label: `Heun (h = ${params.h} d)`,
        data: heunPoints,
        showLine: true,
        borderColor: colors.heun,
        backgroundColor: colors.heun,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0
      },
      {
        label: `RK4 (h = ${params.h} d)`,
        data: rk4Points,
        showLine: true,
        borderColor: colors.rk4,
        backgroundColor: colors.rk4,
        borderWidth: 2,
        pointStyle: 'rectRot',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0
      }
    ];

    // Marcador visual del punto exacto donde se alcanza la meta actual
    if (tExactMeta != null && tExactMeta >= 0 && tExactMeta <= params.T) {
      datasets.push({
        label: `🎯 Meta alcanzada: Día ${tExactMeta.toFixed(1)}`,
        data: [{ x: tExactMeta, y: params.meta }],
        showLine: false,
        borderColor: colors.meta,
        backgroundColor: colors.meta,
        pointRadius: 7,
        pointHoverRadius: 9,
        pointStyle: 'circle'
      });
    }

    // Marcador del punto donde la curva de comparación alcanza la meta
    const tCompareMeta = EDOSolver.timeToTarget({ ...params, k: kCompare }, params.meta);
    if (tCompareMeta != null && tCompareMeta >= 0 && tCompareMeta <= params.T) {
      datasets.push({
        label: `⚡ Con Campaña: Día ${tCompareMeta.toFixed(1)}`,
        data: [{ x: tCompareMeta, y: params.meta }],
        showLine: false,
        borderColor: compareColor,
        backgroundColor: compareColor,
        pointRadius: 7,
        pointHoverRadius: 9,
        pointStyle: 'triangle'
      });
    }

    // Línea horizontal de Meta
    if (params.meta != null && Number.isFinite(params.meta)) {
      datasets.push({
        label: `Meta (${params.meta} animales)`,
        data: [{ x: 0, y: params.meta }, { x: params.T, y: params.meta }],
        showLine: true,
        borderColor: colors.meta,
        borderWidth: 1.8,
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false
      });
    }

    // Línea de Equilibrio del caso actual
    if (eq != null && Number.isFinite(eq)) {
      datasets.push({
        label: `Equilibrio actual a/k (${eq.toFixed(1)})`,
        data: [{ x: 0, y: eq }, { x: params.T, y: eq }],
        showLine: true,
        borderColor: colors.eq,
        borderWidth: 1.2,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false
      });
    }

    if (chartEvolution) {
      chartEvolution.destroy();
    }

    // Cálculo dinámico de escala Y fija desde 0 para que la caída sea visible y proporcional
    const maxDataY = Math.max(
      params.y0,
      Number.isFinite(eq) && eq < 250 ? eq : 90,
      params.meta || 60
    );

    chartEvolution = new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: {
          mode: 'nearest',
          intersect: false,
          axis: 'x'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: colors.textStrong,
              usePointStyle: true,
              boxWidth: 10,
              font: { family: 'Outfit, sans-serif', size: 11, weight: 500 }
            }
          },
          tooltip: {
            backgroundColor: colors.isDark ? '#1e293b' : '#ffffff',
            titleColor: colors.isDark ? '#f8fafc' : '#0f172a',
            bodyColor: colors.isDark ? '#cbd5e1' : '#334155',
            borderColor: colors.isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const y = context.parsed.y;
                return `${label}: ${y.toFixed(2)} animales (t = ${context.parsed.x.toFixed(1)} d)`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Tiempo t (días)',
              color: colors.text,
              font: { weight: 600 }
            },
            grid: { color: colors.grid },
            ticks: { color: colors.text }
          },
          y: {
            type: 'linear',
            min: 0, // Escala fija desde 0 animales para que la caída sea 100% visible
            suggestedMax: Math.ceil(maxDataY * 1.1 / 10) * 10,
            title: {
              display: true,
              text: 'Ocupación y(t) [animales]',
              color: colors.text,
              font: { weight: 600 }
            },
            grid: { color: colors.grid },
            ticks: { color: colors.text }
          }
        }
      }
    });
  },

  /**
   * Gráfica de Errores Absolutos en escala logarítmica
   */
  renderErrorsChart(params, heunSteps, rk4Steps, colors) {
    const canvas = document.getElementById('chartErrors');
    if (!canvas) return;

    // Se omiten los pasos iniciales en t=0 (error es 0 exacto)
    const minPositive = 1e-16;
    const heunErrors = heunSteps.slice(1).map(s => ({
      x: s.t,
      y: Math.max(s.errAbs, minPositive)
    }));
    const rk4Errors = rk4Steps.slice(1).map(s => ({
      x: s.t,
      y: Math.max(s.errAbs, minPositive)
    }));

    if (chartErrors) {
      chartErrors.destroy();
    }

    chartErrors = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Error Absoluto Heun (Orden 2)',
            data: heunErrors,
            showLine: true,
            borderColor: colors.heun,
            backgroundColor: colors.heun,
            borderWidth: 2,
            pointRadius: 4,
            tension: 0
          },
          {
            label: 'Error Absoluto RK4 (Orden 4)',
            data: rk4Errors,
            showLine: true,
            borderColor: colors.rk4,
            backgroundColor: colors.rk4,
            borderWidth: 2,
            pointStyle: 'rectRot',
            pointRadius: 4.5,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: colors.textStrong,
              usePointStyle: true,
              boxWidth: 10,
              font: { family: 'Outfit, sans-serif', size: 12, weight: 500 }
            }
          },
          tooltip: {
            backgroundColor: colors.isDark ? '#1e293b' : '#ffffff',
            titleColor: colors.isDark ? '#f8fafc' : '#0f172a',
            bodyColor: colors.isDark ? '#cbd5e1' : '#334155',
            borderColor: colors.isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const y = context.parsed.y;
                return `${label}: ${y.toExponential(4)} animales`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Tiempo t (días)',
              color: colors.text,
              font: { weight: 600 }
            },
            grid: { color: colors.grid },
            ticks: { color: colors.text }
          },
          y: {
            type: 'logarithmic',
            title: {
              display: true,
              text: 'Error Absoluto |y_exacta - y_num| [animales]',
              color: colors.text,
              font: { weight: 600 }
            },
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              callback: (value) => Number(value).toExponential(0)
            }
          }
        }
      }
    });
  }
};

