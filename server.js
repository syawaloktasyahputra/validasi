import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = './database.json';
const PORT = process.env.PORT || 3000;

// Helper functions
function loadDB() {
  if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- API CRUD ---

// GET all accounts
app.get('/accounts', (req, res) => {
  res.json(loadDB());
});

// GET account by username
app.get('/accounts/user/:username', (req, res) => {
  const db = loadDB();
  const user = db.find(u => u.username === req.params.username);
  res.json(user || {});
});

// POST add new account
app.post('/accounts', (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: 'username & password required' });

  const db = loadDB();
  const newAcc = { _id: uuidv4(), ...req.body };
  db.push(newAcc);
  saveDB(db);
  res.json(newAcc);
});

// PUT update account
app.put('/accounts/:id', (req, res) => {
  const db = loadDB();
  const ix = db.findIndex(x => x._id === req.params.id);
  if(ix === -1) return res.status(404).json({ error: 'Not found' });
  db[ix] = { ...db[ix], ...req.body };
  saveDB(db);
  res.json(db[ix]);
});

// DELETE account
app.delete('/accounts/:id', (req, res) => {
  let db = loadDB();
  db = db.filter(x => x._id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));