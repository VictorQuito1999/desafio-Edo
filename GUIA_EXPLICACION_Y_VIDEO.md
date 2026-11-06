# Guía de Explicación de Casos y Guión de Video (1 Minuto)
## Desafío de Métodos Numéricos: EDO para Refugio de Mascotas

---

## 🎯 LISTA DE VERIFICACIÓN OFICIAL: CUMPLIMIENTO PUNTO POR PUNTO (Consignas 3 y 4)

Aquí tienes la correspondencia exacta de cada punto de la hoja de consignas oficial para que puedas **señalarlo directamente en la aplicación web**:

| Punto de la Consigna | Requisito Oficial | Cómo se cumple en el Proyecto | Dónde mostrarlo en la App |
|:---:|:---|:---|:---|
| **3.a** | **Problema y contexto:** Nombre, comunidad beneficiaria, problema, relevancia y pregunta a responder. | • **Nombre:** "¿En cuántos días dejamos de tener un refugio saturado?"<br>• **Comunidad:** Refugio de mascotas y adoptantes.<br>• **Problema:** Sobrepoblación y hacinamiento.<br>• **Pregunta:** ¿Cuánto tarda en bajar de 80 a 60 animales y cuánto ayuda una campaña? | **Pestaña `📖 Contexto & Modelo Real`** y en el encabezado principal de la web. |
| **3.b** | **Modelo matemático:** Variables dependiente e independiente con unidades, parámetros con unidades, formular y justificar EDO, $y(0)=y_0$, supuestos e intervalo $T$. | • **Dep:** $y(t)$ [animales], **Indep:** $t$ [días].<br>• **Parámetros:** $a$ [animales/día], $k$ [1/día], $y_0$ [animales].<br>• **EDO:** $\frac{dy}{dt} = a - ky$, $y(0)=y_0$.<br>• **Supuestos:** Ingresos constantes, salidas proporcionales a presentes. Intervalo $T = 60\text{ días}$. | **Pestaña `📖 Contexto & Modelo Real`** y en los campos del panel lateral. |
| **3.c** | **Solución analítica:** Resolver de forma exacta y comprobar por sustitución en la EDO y condición inicial. | • **Exacta:** $y(t) = a/k + (y_0 - a/k)e^{-kt}$.<br>• **Verificación formal:** Derivada igualada a $a-ky(t)$ con residual nulo ($< 10^{-14}$) y comprobación en $t=0$. | **Pestaña `🧮 Solución Analítica & Demostración`** (calculada y verificada en vivo). |
| **3.d** | **Soluciones numéricas:** Heun (RK2) y Runge-Kutta 4 (RK4) con mismos parámetros, $y_0$, $T$ y paso $h$. | • Implementación matemática de Heun (predictor-corrector) y RK4 clásico de 4 etapas intermedias ($k_1$ a $k_4$). Mismos parámetros para ambos. | **Pestaña `📈 Simulación`** y selector de métodos en **`📑 Tablas Paso a Paso`**. |
| **3.e** | **Análisis comparativo:** Tabla por pasos, gráfica con Analítica + Heun + RK4, error absoluto y relativo %, comparar al menos DOS tamaños de paso. | • Gráfica comparativa triple con curvas superpuestas.<br>• Gráfica de error logarítmico.<br>• Tabla paso a paso con error absoluto y relativo %.<br>• **Tabla multi-paso:** Evalúa 3 pasos ($2h, h, h/2$) demostrando reducción de error $4\times$ en Heun y $16\times$ en RK4. | **Pestaña `📈 Simulación`** (gráficas) y **`📑 Tablas Paso a Paso`** (tabla multi-paso y etapas intermedias). |
| **3.f** | **Interpretación y conclusiones:** Lenguaje sencillo, responder la pregunta, señalar limitaciones y cuál método tuvo menor error. | • Texto explicativo dinámico generado según los valores ingresados.<br>• Responde días exactos a la meta.<br>• Declara limitaciones (parámetros hipotéticos, modelo simplificado).<br>• Declara a RK4 como ganador con orden $10^{-4}$ vs $10^{-2}$. | **Pestaña `📈 Simulación`** (sección *"💡 Interpretación Práctica & Conclusiones"*). |
| **4** | **Aplicación web obligatoria:** Publicada, funcional, ajuste de $y_0$, parámetros, $h$ y $T$; Heun y RK4; tabla, gráfica, unidades, validación y explicación. | • App web reactiva desplegada en Vercel con diseño Soft-UI/Neumórfico.<br>• Validación de entradas numéricas, límites y valores no negativos.<br>• Base de datos persistente en MongoDB Atlas.<br>• 100% funcional en cualquier navegador. | **URL pública de Vercel** y repositorio GitHub. |

---

## 1. Contexto Social y Problemática Real

* **Comunidad beneficiada:** Un refugio comunitario de animales y las personas que rescatan o adoptan mascotas.
* **El problema real:** Los refugios comunitarios viven al límite de su capacidad. Cuando entran más animales abandonados de los que son adoptados, se produce **hacinamiento, estrés en los animales, propagación de enfermedades y agotamiento de recursos** (alimento, vacunas y atención veterinaria).
* **Pregunta concreta:** ¿En cuántos días dejamos de tener un refugio saturado (bajando de 80 a una meta manejable de 60 animales) y cuánto ayudaría realizar una campaña comunitaria de adopción?

---

## 2. Variables y Modelo Matemático

| Símbolo | Nombre Técnico | Concepto Intuitivo (Para el Usuario) | Unidad | Valor Base |
|:---:|:---|:---|:---:|:---:|
| $y(t)$ | Variable dependiente | **Población en el refugio en el tiempo $t$** | animales | Variable |
| $t$ | Variable independiente | **Tiempo transcurrido** | días | 0 a 60 |
| $y_0$ | Condición inicial | **Población inicial del refugio** | animales | 80 |
| $a$ | Parámetro de entrada | **Ingresos diarios de animales rescatados** | animales/día | 2 |
| $k$ | Tasa de adopción | **Porcentaje diario de adopción** | fracción/día | 0.04 (4% diario) |
| $h$ | Tamaño de paso | **Frecuencia de conteo o cálculo** | días | 5 |
| $T$ | Intervalo de simulación | **Tiempo total a evaluar** | días | 60 |
| $M$ | Meta | **Capacidad sostenible o meta deseada** | animales | 60 |

### Ecuación Diferencial Ordinaria (EDO)
$$\frac{dy}{dt} = a - k \cdot y, \quad y(0) = y_0$$

* **Lógica del modelo:** La variación diaria de animales ($\frac{dy}{dt}$) es igual a los que entran ($a$) menos los que salen por adopción o reencuentro ($k \cdot y$).
* **Solución analítica exacta:**
  $$y(t) = \frac{a}{k} + \left( y_0 - \frac{a}{k} \right) e^{-kt}$$
* **Población de equilibrio ($t \to \infty$):** $\frac{a}{k} = \frac{2}{0.04} = 50\text{ animales}$.
* **Tiempo exacto para alcanzar la meta $M$:**
  $$t_M = \frac{1}{k} \ln\left( \frac{y_0 - a/k}{M - a/k} \right)$$

---

## 3. Los 3 Casos de Estudio (Vinculados a los Botones de la App)

En la parte superior del panel lateral tienes botones de acceso rápido que configuran cada caso con un solo clic:

```
[Normal (y₀=80)]   [Campaña (+50%)]   [Crisis (5 entran/d)]   [Paso fino (h=2.5 d)]
```

---

### CASO 1: Operación Normal (Botón `Normal (y₀=80)`)
*El refugio opera con su ritmo habitual sin ninguna campaña especial.*

* **Valores que se colocan:**
  * Población Inicial ($y_0$): `80` animales
  * Ingresos Diarios ($a$): `2` animales/día
  * Porcentaje de Adopción ($k$): `0.04` (la app indica abajo: *4% diario o ~3.2 adopciones/día*)
  * Frecuencia de Conteo ($h$): `5` días
  * Tiempo Total ($T$): `60` días
  * Capacidad Meta ($M$): `60` animales

* **Lo que aparece en pantalla:**
  * **Población Estable a Futuro:** `50.0 animales`
  * **Tiempo para Desaturar:** `27.5 días` (exactamente 27.47 días)
  * **Algoritmo Más Exacto:** `RK4` (con margen de error de $0.00017$ animales vs $0.086$ de Heun)

* **¿Qué implica para el refugio?**  
  Como entran 2 al día pero al inicio salen 3.2 al día, la población desciende. Sin embargo, toma **casi un mes entero (27.5 días)** llegar a la capacidad ideal, lo que implica semanas de altos costos de alimentación y cuidado.

---

### CASO 2: Campaña Comunitaria de Adopción (Botón `Campaña (+50%)`)
*Los voluntarios organizan ferias de adopción y difusión intensiva en redes sociales.*

* **Valores que se colocan:**
  * Población Inicial ($y_0$): `80` animales
  * Ingresos Diarios ($a$): `2` animales/día
  * Porcentaje de Adopción ($k$): `0.06` (sube un 50%; la app indica: *6% diario o ~4.8 adopciones/día*)
  * Frecuencia de Conteo ($h$): `5` días
  * Tiempo Total ($T$): `60` días
  * Capacidad Meta ($M$): `60` animales

* **Lo que aparece en pantalla:**
  * **Población Estable a Futuro:** Cae a `33.3 animales`
  * **Tiempo para Desaturar:** Se reduce drásticamente de 27.5 a **`9.3 días`**
  * **Gráfica:** La curva se inclina fuertemente hacia abajo demostrando un alivio rápido

* **¿Qué implica para el refugio?**  
  Una campaña comunitaria reduce el tiempo de desaturación en casi un **66% (de 27.5 a solo 9 días)**. Además, el refugio descansará a futuro con solo 33 animales en promedio, garantizando condiciones dignas y espacio para nuevas urgencias.

---

### CASO 3: Crisis de Abandono (Botón `Crisis (5 entran/d)`)
*Ocurre una ola de abandono callejero (post-vacaciones o camadas no deseadas).*

* **Valores que se colocan:**
  * Población Inicial ($y_0$): `80` animales
  * Ingresos Diarios ($a$): `5` animales/día (se disparan los rescates)
  * Porcentaje de Adopción ($k$): `0.04` (adopción normal de 4% diario)
  * Frecuencia de Conteo ($h$): `5` días
  * Tiempo Total ($T$): `60` días
  * Capacidad Meta ($M$): `60` animales

* **Lo que aparece en pantalla:**
  * **Población Estable a Futuro:** Se dispara a **`125.0 animales`**
  * **Tiempo para Desaturar:** **`Inalcanzable`**
  * **Aviso de la App:** *Meta Inalcanzable: la meta de 60 animales no se logrará porque el equilibrio del sistema (125 animales) está por encima del objetivo.*
  * **Gráfica:** La curva sube hacia arriba alejándose de la meta.

* **¿Qué implica para el refugio?**  
  Demuestra la utilidad preventiva del modelo matemático. Alertará al comité que el refugio va camino al colapso inevitable a menos que se frene el abandono o se tripliquen las adopciones.

---

## 4. Guión Cronometrado para Grabar el Video de 1 Minuto (60 Segundos)

*Consejo: Ten abierta la aplicación web en tu navegador. Puedes ir haciendo clic en los botones rápidos mientras hablas.*

| Tiempo | Qué decir (Diálogo fluido y claro) | Qué hacer en pantalla |
|:---:|:---|:---|
| **00:00 - 00:15** | *"Hola, soy Víctor Quito. Para el desafío de Métodos Numéricos modelé la saturación de un refugio comunitario de mascotas mediante una ecuación diferencial de primer orden: dy/dt = a - ky, donde evaluamos cómo desaturar el refugio de 80 a 60 animales."* | Muestra la pantalla inicial con el título y las tarjetas KPI. |
| **00:15 - 00:30** | *"En el **Caso Normal**, con 2 rescates al día y un 4% de adopción diaria, la solución exacta y los métodos de Heun y Runge-Kutta 4 demuestran que la meta se alcanza en **27.5 días**, con un equilibrio estable de 50 animales."* | Señala la tarjeta de **27.5 días** y la curva verde y violeta de la gráfica. |
| **00:30 - 00:45** | *"Si pulsamos el botón de **Campaña de Adopción**, elevando las adopciones al 6% diario, vemos que el tiempo para desaturar cae a solo **9.3 días**. Le damos a **Guardar en Historial y Limpiar**, lo que guarda el ensayo en MongoDB Atlas y deja el formulario listo para el siguiente caso."* | Pulsa el botón `Campaña (+50%)`, muestra cómo cambia a 9.3 días y haz clic en `💾 Guardar en Historial y Limpiar`. |
| **00:45 - 01:00** | *"Si probamos la **Crisis de Abandono** con 5 ingresos diarios, el modelo nos advierte que la meta es inalcanzable porque tendería a 125 animales. En todos los casos, la tabla multi-paso confirma que **Runge-Kutta 4 es el método más exacto**, reduciendo el error 16 veces frente a Heun. La app está desplegada en Vercel y lista para revisión. Muchas gracias."* | Pulsa el botón `Crisis (5 entran/d)`, muestra el aviso de inalcanzable, ve un segundo a la pestaña `Tablas Paso a Paso` y despídete. |

