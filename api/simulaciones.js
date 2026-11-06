import { MongoClient } from 'mongodb';
import dns from 'node:dns';

// Fallback de servidores DNS para entornos donde el proveedor bloquea registros SRV
try {
  if (typeof dns.setServers === 'function') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (_) {
  // Ignorar si el runtime restringe dns.setServers
}

// Cadena de conexión de MongoDB Atlas para producción y despliegue Vercel
const DEFAULT_MONGODB_URI = 'mongodb+srv://vquitoc_db_user:AwzUQf5Kg1O5TnSz@clusteredo.y9qbykx.mongodb.net/?retryWrites=true&w=majority&appName=clusteredo';

let cachedClient = null;
let cachedPromise = null;

async function getSimulacionesCollection() {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  if (!cachedPromise) {
    cachedClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 7000,
      maxPoolSize: 10,
    });
    cachedPromise = cachedClient.connect();
  }

  const client = await cachedPromise;
  return client.db('edo_refugio').collection('simulaciones');
}

async function parseRequestBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch (_) {
        return {};
      }
    }
    return req.body;
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
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
      const body = await parseRequestBody(req);
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
      doc.escenario = typeof body.escenario === 'string' && body.escenario.trim() ? body.escenario.trim().slice(0, 80) : 'Personalizado';
      doc.fecha = new Date();

      const result = await col.insertOne(doc);
      return res.status(201).json({ ok: true, id: result.insertedId });
    }

    // Listar las simulaciones más recientes
    if (req.method === 'GET') {
      const limit = Math.min(Math.max(Number(req.query?.limit) || 20, 1), 50);
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
