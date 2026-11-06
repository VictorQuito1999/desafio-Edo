import { MongoClient } from 'mongodb';
import dns from 'node:dns';
import fs from 'node:fs';

// Cargar .env manualmente si existe sin depender de librerías externas
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
  console.error('❌ Error: MONGODB_URI no está definido en .env');
  process.exit(1);
}

console.log('🔄 Conectando a MongoDB Atlas...');
try {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  console.log('✅ Conexión exitosa a MongoDB Atlas');
  const db = client.db('edo_refugio');
  const docs = await db.collection('simulaciones').find({}).sort({ fecha: -1 }).toArray();
  console.log(`📊 Total de simulaciones guardadas en colección 'simulaciones': ${docs.length}`);
  docs.forEach((d, i) => {
    console.log(` [${i+1}] ${d.escenario} | y0=${d.y0}, a=${d.a}, k=${d.k}, h=${d.h}, meta=${d.meta} | ${new Date(d.fecha).toLocaleString()}`);
  });
  await client.close();
  console.log('✨ Prueba de base de datos finalizada correctamente.');
} catch (err) {
  console.error('❌ Error conectando a MongoDB Atlas:', err.message);
  process.exit(1);
}
