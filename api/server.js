import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // membaca .env di local (tidak berpengaruh di vercel)

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in environment variables");
} else {
  mongoose
    .connect(MONGO_URI, {
      dbName: "vercel_api",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// Schema
const accountSchema = new mongoose.Schema({
  username: { type: String, required: true },
  number: { type: [String], required: true },
  expired: { type: Number, default: null },
});

const Account =
  mongoose.models.Account || mongoose.model("Account", accountSchema);

// Root page
app.get("/", async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? "✅ Connected" : "❌ Disconnected";
  res.send(`
    <html>
      <head>
        <title>API Status</title>
        <style>
          body { font-family: sans-serif; background: #f4f4f4; color: #222; text-align: center; padding: 40px; }
          h1 { color: #0070f3; }
          a { color: #0070f3; display: block; margin: 6px; }
        </style>
      </head>
      <body>
        <h1>🚀 API Running</h1>
        <p>MongoDB: ${dbState}</p>
        <h3>Endpoints:</h3>
        <a href="/accounts">GET /accounts</a>
        <a href="/accounts/user/:username">GET /accounts/user/:username</a>
        <p>POST /accounts</p>
        <p>PUT /accounts/:id</p>
        <p>DELETE /accounts/:id</p>
      </body>
    </html>
  `);
});

// Endpoints
app.get("/accounts", async (req, res) => {
  const users = await Account.find();
  res.json(users);
});

app.get("/accounts/user/:username", async (req, res) => {
  const user = await Account.findOne({ username: req.params.username });
  res.json(user || {});
});

app.post("/accounts", async (req, res) => {
  const { username, number, expired } = req.body;
  if (!username || !number)
    return res.status(400).json({ error: "username & number required" });

  const acc = new Account({ username, number, expired });
  await acc.save();
  res.json(acc);
});

app.put("/accounts/:id", async (req, res) => {
  const updated = await Account.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated || { error: "Not found" });
});

app.delete("/accounts/:id", async (req, res) => {
  const deleted = await Account.findByIdAndDelete(req.params.id);
  res.json(deleted ? { success: true } : { error: "Not found" });
});

// Important: export app, NOT app.listen()
export default app;