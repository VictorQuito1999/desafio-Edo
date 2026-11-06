import { MongoClient } from 'mongodb';
import dns from 'node:dns';
import fs from 'node:fs';

// Cargar .env manualmente
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = (match[2] || '').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
}

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI no definida en .env');
  process.exit(1);
}

const seeds = [
  {
    y0: 80,
    a: 2,
    k: 0.04,
    h: 5,
    T: 60,
    meta: 60,
    errHeun: 0.08581,
    errRK4: 0.0001739,
    tMeta: 27.47,
    ganador: 'RK4',
    escenario: 'Caso Base (Saturación y₀=80, meta=60)',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 4) // Hace 4 horas
  },
  {
    y0: 80,
    a: 2,
    k: 0.06,
    h: 5,
    T: 60,
    meta: 60,
    errHeun: 0.09842,
    errRK4: 0.0002461,
    tMeta: 9.35,
    ganador: 'RK4',
    escenario: 'Campaña Adopción +50% (k=0.06)',
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 2) // Hace 2 horas
  },
  {
    y0: 80,
    a: 5,
    k: 0.04,
    h: 5,
    T: 60,
    meta: 60,
    errHeun: 0.12871,
    errRK4: 0.0002609,
    tMeta: null,
    ganador: 'RK4',
    escenario: 'Crisis de Abandono (a=5 animales/día)',
    fecha: new Date(Date.now() - 1000 * 60 * 30) // Hace 30 min
  },
  {
    y0: 80,
    a: 2,
    k: 0.04,
    h: 2.5,
    T: 60,
    meta: 60,
    errHeun: 0.01985,
    errRK4: 0.000009997,
    tMeta: 27.47,
    ganador: 'RK4',
    escenario: 'Paso Fino h=2.5 días (Alta Precisión)',
    fecha: new Date() // Ahora
  }
];

async function seed() {
  console.log('🔄 Conectando a MongoDB Atlas para registrar datos de demostración...');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 6000 });
  await client.connect();
  const db = client.db('edo_refugio');
  const col = db.collection('simulaciones');

  // Limpiar registros previos de prueba y dejar exactamente los 4 casos documentados
  await col.deleteMany({});
  const result = await col.insertMany(seeds);
  console.log(`✅ ¡Éxito! Se insertaron ${result.insertedCount} simulaciones de demostración en MongoDB Atlas.`);

  const list = await col.find({}, { projection: { _id: 0 } }).sort({ fecha: -1 }).toArray();
  console.log('📋 Registros en la nube:');
  console.table(list.map(s => ({
    Escenario: s.escenario,
    y0: s.y0,
    a: s.a,
    k: s.k,
    h: s.h,
    Meta: s.meta,
    'Días a Meta': s.tMeta != null ? s.tMeta.toFixed(1) : 'Inalcanzable',
    'Ganador': s.ganador,
    Fecha: s.fecha.toLocaleTimeString()
  })));

  await client.close();
}

seed().catch(err => {
  console.error('❌ Error al sembrar datos:', err);
  process.exit(1);
});

