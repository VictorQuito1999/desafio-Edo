import { MongoClient } from 'mongodb';
import dns from 'node:dns';

// Fallback de servidores DNS para entornos locales donde el proveedor de internet bloquea registros SRV
try {
  if (process.env.NODE_ENV !== 'production' && typeof dns.setServers === 'function') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (_) {
  // Ignorar si no se puede configurar en tiempo de ejecución restringido
}

let cachedClient = null;
let cachedPromise = null;

async function getSimulacionesCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('La variable de entorno MONGODB_URI no está configurada.');
  }

  if (!cachedPromise) {
    cachedClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 6000,
      maxPoolSize: 10,
    });
    cachedPromise = cachedClient.connect();
  }

  const client = await cachedPromise;
  return client.db('edo_refugio').collection('simulaciones');
}

export default async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const col = await getSimulacionesCollection();

    // Guardar una nueva simulación
    if (req.method === 'POST') {
      const body = req.body || {};
      const requiredNumericFields = ['y0', 'a', 'k', 'h', 'T', 'meta', 'errHeun', 'errRK4'];
      const doc = {};

      for (const field of requiredNumericFields) {
        const val = Number(body[field]);
        if (!Number.isFinite(val)) {
          return res.status(400).json({ error: `Valor numérico inválido en el campo: ${field}` });
        }
        doc[field] = val;
      }

      doc.tMeta = body.tMeta == null || !Number.isFinite(Number(body.tMeta)) ? null : Number(body.tMeta);
      doc.ganador = body.ganador === 'Heun' ? 'Heun' : 'RK4';
      doc.escenario = typeof body.escenario === 'string' ? body.escenario.trim().slice(0, 50) : 'Personalizado';
      doc.fecha = new Date();

      const result = await col.insertOne(doc);
      return res.status(201).json({ ok: true, id: result.insertedId });
    }

    // Listar las simulaciones más recientes
    if (req.method === 'GET') {
      const limit = Math.min(Math.max(Number(req.query?.limit) || 10, 1), 50);
      const items = await col
        .find({}, { projection: { _id: 0 } })
        .sort({ fecha: -1 })
        .limit(limit)
        .toArray();
      return res.status(200).json(items);
    }

    return res.status(405).json({ error: 'Método no permitido. Use GET o POST.' });
  } catch (error) {
    console.error('Error de conexión con MongoDB Atlas:', error);
    // Reiniciar conexión en caso de fallo para permitir reintento limpio
    cachedPromise = null;
    return res.status(503).json({
      error: 'Base de datos MongoDB no disponible temporalmente.',
      message: error.message
    });
  }
}
