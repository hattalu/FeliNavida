import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./database.sqlite");

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  spins_left INTEGER DEFAULT 1,
  last_spin TEXT
)`);

app.post("/user", (req, res) => {
  const { name } = req.body;
  db.get("SELECT * FROM users WHERE name = ?", [name], (err, row) => {
    if (row) return res.json(row);
    db.run("INSERT INTO users (name) VALUES (?)", [name], function() {
      res.json({ id: this.lastID, name, spins_left: 1, last_spin: null });
    });
  });
});

app.post("/spin", (req, res) => {
  const { name } = req.body;
  const today = new Date().toISOString().split("T")[0];

  db.get("SELECT * FROM users WHERE name = ?", [name], (err, user) => {
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    if (user.spins_left <= 0 && user.last_spin === today) {
      return res.json({ message: "Ya hiciste tu tirada de hoy." });
    }

    if (user.last_spin !== today && user.spins_left <= 0) {
      user.spins_left = 1;
    }

    const spinsLeft = user.spins_left - 1;

    const rewards = [
      { name: "1 regalo", code: "regalo" },
      { name: "el poder raspar la imagen", code: "raspa" },
      { name: "chistaco navideño", code: "pito" }
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    db.run(
      "UPDATE users SET spins_left = ?, last_spin = ? WHERE name = ?",
      [spinsLeft, today, name],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Error al actualizar" });
        }
        res.json({ reward, spins_left: spinsLeft });
      }
    );
  });
});


app.post("/add_spin", (req, res) => {
  const { name } = req.body;

  db.get("SELECT spins_left FROM users WHERE name = ?", [name], (err, user) => {
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const newSpins = user.spins_left + 1;
    db.run("UPDATE users SET spins_left = ? WHERE name = ?", [newSpins, name], function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al actualizar" });
      }
      res.json({ message: "Tirada extra añadida", spins_left: newSpins });
    });
  });
});

app.listen(3000, () => console.log("Servidor escuchando en puerto 3000"));
