import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = './database.json';
const PORT = process.env.PORT || 3000;

// ----------------- Helper Functions -----------------
function loadDB() {
if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Optional: parser durasi (misal "1h", "30m") jika mau simpan timestamp
function parseDuration(str) {
const regex = /^(\d+)([mhdwby])$/i;
const match = str.match(regex);
if(!match) return null;

const value = parseInt(match[1]);
const unit = match[2].toLowerCase();
const now = Date.now();
let ms = 0;

switch(unit){
case 'm': ms = value * 60 * 1000; break;
case 'h': ms = value * 60 * 60 * 1000; break;
case 'd': ms = value * 24 * 60 * 60 * 1000; break;
case 'w': ms = value * 7 * 24 * 60 * 60 * 1000; break;
case 'b': ms = value * 30 * 24 * 60 * 60 * 1000; break;
case 'y': ms = value * 365 * 24 * 60 * 60 * 1000; break;
}
return now + ms;
}

// ----------------- API Endpoints -----------------

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
// Example body: { "username": "oktodev", "number": ["6283822"], "expired": 1735304443210 }
app.post('/accounts', (req, res) => {
const { username, number, expired } = req.body;
if(!username || !number) return res.status(400).json({ error: 'username & number required' });

const db = loadDB();
const newAcc = { _id: uuidv4(), username, number, expired: expired || null };
db.push(newAcc);
saveDB(db);
res.json(newAcc);
});

// PUT update account by id
app.put('/accounts/:id', (req, res) => {
const db = loadDB();
const ix = db.findIndex(x => x._id === req.params.id);
if(ix === -1) return res.status(404).json({ error: 'Not found' });
db[ix] = { ...db[ix], ...req.body };
saveDB(db);
res.json(db[ix]);
});

// DELETE account by id
app.delete('/accounts/:id', (req, res) => {
let db = loadDB();
db = db.filter(x => x._id !== req.params.id);
saveDB(db);
res.json({ success: true });
});

// ----------------- Start Server -----------------
app.listen(PORT, () => console.log(Server running on port ${PORT}));