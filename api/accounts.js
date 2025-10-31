import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path file JSON di direktori kerja sementara
const DB_FILE = path.join('/tmp', 'database.json');

// Fungsi baca database
function loadDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Fungsi simpan database
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Fungsi handler utama (tanpa express)
export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    // GET /api/accounts or /api/accounts?username=okto
    const db = loadDB();
    if (req.query.username) {
      const user = db.find(u => u.username === req.query.username);
      return res.status(200).json(user || {});
    }
    return res.status(200).json(db);
  }

  if (method === 'POST') {
    const body = await getBody(req);
    const { username, number, expired } = body;
    if (!username || !number)
      return res.status(400).json({ error: 'username & number required' });

    const db = loadDB();
    const newAcc = { _id: uuidv4(), username, number, expired: expired || null };
    db.push(newAcc);
    saveDB(db);
    return res.status(200).json(newAcc);
  }

  if (method === 'PUT') {
    const { id } = req.query;
    const body = await getBody(req);
    const db = loadDB();
    const ix = db.findIndex(x => x._id === id);
    if (ix === -1) return res.status(404).json({ error: 'Not found' });
    db[ix] = { ...db[ix], ...body };
    saveDB(db);
    return res.status(200).json(db[ix]);
  }

  if (method === 'DELETE') {
    const { id } = req.query;
    let db = loadDB();
    db = db.filter(x => x._id !== id);
    saveDB(db);
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}

// Utility: parsing body tanpa express
async function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        reject(e);
      }
    });
  });
}