# Desafío EDO · Métodos Numéricos
## ¿En cuántos días dejamos de tener un refugio saturado?

> **Materia:** Métodos Numéricos  
> **Modelo:** Ecuación Diferencial Ordinaria (EDO) de 1.er orden resuelta de forma Analítica, Heun (RK2) y Runge-Kutta 4 (RK4).  
> **Comunidad Beneficiada:** Refugio comunitario de mascotas y personas adoptantes.  
> **Plataforma:** Aplicación Web interactiva desplegada en **Vercel** con base de datos en **MongoDB Atlas**.

---

## 1. Problema y Contexto de la Comunidad

El refugio comunitario rescata diariamente animales en situación de abandono o vulnerabilidad. Para evitar el hacinamiento, estrés animal y propagación de enfermedades, es fundamental mantener la población por debajo de un umbral operativo sostenible (meta: **60 animales**).

* **Pregunta concreta:** ¿Cuánto tarda el refugio en bajar a una ocupación manejable de 60 animales partiendo de una saturación inicial de 80 animales, y cuánto ayudaría realizar una campaña comunitaria de adopción?
* **Meta cuantificable:** Alcanzar $y(t) \le 60$ animales.

> ⚠️ **Declaración de Parámetros Hipotéticos:** Conforme a las pautas de calidad académica, todos los parámetros numéricos ($y_0 = 80$, $a = 2$, $k = 0.04$) son de carácter **hipotético y representativo**. Esta aplicación constituye una simulación matemática ilustrativa y no una predicción comprobada empíricamente.

---

## 2. Modelo Matemático

* **Variable dependiente:** $y(t)$ = Cantidad de animales en el refugio [animales].
* **Variable independiente:** $t$ = Tiempo transcurrido [días].
* **Parámetros con unidades:**
  * $a$ = Tasa constante de ingreso de animales rescatados [$2\text{ animales/día}$].
  * $k$ = Tasa diaria de adopción o reencuentro per cápita [$0.04\text{ }1/\text{día}$].
  * $y_0$ = Condición inicial de animales al tiempo $t=0$ [$80\text{ animales}$].
  * $h$ = Tamaño de paso de simulación [$5\text{ días}$].
  * $T$ = Horizonte de simulación [$60\text{ días}$].
  * $M$ = Meta de ocupación deseada [$60\text{ animales}$].

### EDO y Condición Inicial
$$\frac{dy}{dt} = a - k \cdot y, \quad y(0) = y_0$$

* **Supuestos:**
  1. Tasa de ingresos constante $a$.
  2. Adopciones proporcionales a la población disponible $k \cdot y$.
  3. No se consideran estacionalidades ni bajas por causas de fuerza mayor.

---

## 3. Solución Analítica Exacta y Verificación

Reordenando la EDO lineal:
$$\frac{dy}{dt} + k \cdot y = a$$

Multiplicando por el factor integrante $\mu(t) = e^{\int k dt} = e^{kt}$:
$$\frac{d}{dt}\left[y(t) \cdot e^{kt}\right] = a \cdot e^{kt} \implies y(t) \cdot e^{kt} = \frac{a}{k}e^{kt} + C$$

Multiplicando por $e^{-kt}$:
$$y(t) = \frac{a}{k} + C \cdot e^{-kt}$$

Aplicando la condición inicial $y(0) = y_0$:
$$y_0 = \frac{a}{k} + C \implies C = y_0 - \frac{a}{k}$$

### Solución General:
$$y(t) = \frac{a}{k} + \left(y_0 - \frac{a}{k}\right)e^{-kt}$$

* **Equilibrio Asintótico ($t \to \infty$):** $y_{eq} = \frac{a}{k} = \frac{2}{0.04} = 50\text{ animales}$.
* **Tiempo exacto para alcanzar la meta $M$:**
  $$t_M = \frac{1}{k}\ln\left(\frac{y_0 - a/k}{M - a/k}\right) = \frac{1}{0.04}\ln\left(\frac{80 - 50}{60 - 50}\right) = \frac{\ln(3)}{0.04} \approx 27.47\text{ días}$$

### Comprobación por Sustitución Directa:
1. **Condición inicial en $t=0$:**
   $$y(0) = 50 + (80 - 50)e^0 = 80 = y_0 \quad \checkmark$$
2. **Derivada en cualquier instante $t$:**
   $$y'(t) = -30 \cdot 0.04 \cdot e^{-0.04t} = -1.2 \cdot e^{-0.04t}$$
3. **Lado derecho de la EDO ($a - ky$):**
   $$2 - 0.04 \cdot [50 + 30e^{-0.04t}] = 2 - 2 - 1.2e^{-0.04t} = -1.2 \cdot e^{-0.04t} \quad \checkmark$$
   *Ambos miembros coinciden exactamente (residual nulo).*

---

## 4. Métodos Numéricos Implementados

### A. Método de Heun (RK2 Predictor-Corrector)
* **Predictor (Euler):**
  $$y^{(p)}_{i+1} = y_i + h \cdot f(t_i, y_i)$$
* **Corrector:**
  $$y_{i+1} = y_i + \frac{h}{2}\left[ f(t_i, y_i) + f(t_{i+1}, y^{(p)}_{i+1}) \right]$$
* **Error de truncamiento global:** $O(h^2)$.

### B. Runge-Kutta Clásico de 4.º Orden (RK4)
* **Etapas intermedias:**
  * $k_1 = f(t_i, y_i)$
  * $k_2 = f(t_i + \frac{h}{2},\, y_i + \frac{h}{2}k_1)$
  * $k_3 = f(t_i + \frac{h}{2},\, y_i + \frac{h}{2}k_2)$
  * $k_4 = f(t_i + h,\, y_i + h k_3)$
* **Promedio ponderado y avance:**
  $$\phi = \frac{1}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$
  $$y_{i+1} = y_i + h \cdot \phi$$
* **Error de truncamiento global:** $O(h^4)$.

---

## 5. Análisis Comparativo de Convergencia Multi-Paso

Evaluación para $T = 60\text{ días}$ con diferentes valores de $h$:

| Paso $h$ (días) | Pasos | Error Máx. Heun | Ratio Reducción Heun (Teórico $\approx 4\times$) | Error Máx. RK4 | Ratio Reducción RK4 (Teórico $\approx 16\times$) |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **10** | 6 | $3.971 \times 10^{-1}$ | — (base) | $3.234 \times 10^{-3}$ | — (base) |
| **5** | 12 | $8.581 \times 10^{-2}$ | **$4.63\times$** | $1.739 \times 10^{-4}$ | **$18.59\times$** |
| **2.5** | 24 | $1.985 \times 10^{-2}$ | **$4.32\times$** | $9.997 \times 10^{-6}$ | **$17.40\times$** |

* **Conclusión matemática:** Al reducir el paso a la mitad, el error de Heun disminuye cerca de 4 veces ($2^2$), mientras que el error de RK4 disminuye entre 17 y 18 veces ($2^4$), validando empíricamente sus órdenes de convergencia teóricos.
* **Ganador en precisión:** **RK4** fue casi **500 veces más preciso** que Heun en el paso de referencia ($h = 5\text{ días}$).

---

## 6. Estructura del Proyecto

```text
Desafioedo/
├── index.html                  # Aplicación Web (HTML5 semántico con tabs y KaTeX)
├── css/
│   └── style.css               # Estilos Neumórficos, Soft-UI, modo claro/oscuro y responsive
├── js/
│   ├── edo-solver.js           # Módulo matemático puro (Heun, RK4, exacta, análisis multi-paso)
│   ├── charts.js               # Visualizaciones con Chart.js (curvas y errores logarítmicos)
│   └── app.js                  # Controlador de UI, presets interactivos y sincronización MongoDB
├── api/
│   └── simulaciones.js         # Función Serverless Vercel con pool y sanitización de datos
├── .github/
│   └── workflows/
│       └── keepalive.yml       # Ping automático cada 3 días para evitar pausa del cluster Atlas
├── .gitignore                  # Protección de credenciales y dependencias
├── .env.example                # Plantilla de variables de entorno
├── test-db.js                  # Script para verificar conexión local con MongoDB Atlas
└── package.json                # Configuración de dependencias (mongodb)
```

---

## 7. Instrucciones de Ejecución

### Prerrequisitos
* **Node.js** (versión 18 o superior recomendada).
* Conexión a internet (para sincronización con MongoDB Atlas y carga de librerías CDN como Chart.js y KaTeX).

### Ejecución Local Paso a Paso

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/VictorQuito1999/desafio-Edo.git
   cd desafio-Edo
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Verificar conexión a la base de datos (Opcional):**
   ```bash
   npm run test:db
   ```

4. **Iniciar el servidor local:**
   ```bash
   npm start
   ```

5. **Abrir en el navegador:**
   Ingresa a [http://localhost:3000](http://localhost:3000) para interactuar con la aplicación, simular escenarios con Heun y RK4, y guardar registros en MongoDB Atlas.

### Despliegue en la Nube (Vercel)

El proyecto está configurado con `vercel.json` y la carpeta `api/` para funcionar automáticamente como Serverless en Vercel:
1. Conectar el repositorio de GitHub en el panel de Vercel.
2. Desplegar automáticamente con un clic.
3. Asegurarse de que en MongoDB Atlas esté habilitada la regla `0.0.0.0/0` en *Network Access* para permitir la comunicación segura en la nube.

---

## 8. Enlaces del Proyecto

* **Repositorio GitHub:** [https://github.com/VictorQuito1999/desafio-Edo](https://github.com/VictorQuito1999/desafio-Edo)
* **Aplicación Web Desplegada en Vercel:** [https://desafio-edo.vercel.app](https://desafio-edo.vercel.app)
* **Video de Explicación (1 minuto):** Enlace en entrega académica.
